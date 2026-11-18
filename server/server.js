import { createServer } from "node:http";
import { createHash, createPublicKey, randomBytes, verify } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import mqtt from "mqtt";

const PORT = Number(process.env.SNR_ACCOUNT_PORT || 3001);
const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "").trim();
const MQTT_URL = process.env.SNR_PURCHASE_MQTT_URL || "wss://mqtt.feira-de-jogos.dev.br/mqtt";
const PURCHASE_TOPIC = process.env.SNR_PURCHASE_TOPIC || "vending/comando/#";
const DATA_DIR = path.resolve(process.env.SNR_ACCOUNT_DATA_DIR || "../snr-account-data");
const DATA_FILE = path.join(DATA_DIR, "accounts.json");
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const ALLOWED_ORIGINS = new Set(
  String(process.env.SNR_ACCOUNT_ALLOWED_ORIGINS || "")
    .split(",").map((origin) => origin.trim()).filter(Boolean),
);
if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.add("http://localhost:5173");
  ALLOWED_ORIGINS.add("http://127.0.0.1:5173");
}

function origemPermitida(origin, request) {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const origem = new URL(origin);
    const protocolo = String(request.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
    return origem.host === request.headers.host && origem.protocol === `${protocolo}:`;
  } catch {
    return false;
  }
}

mkdirSync(DATA_DIR, { recursive: true });
let database = { version: 1, accounts: {}, pendingPurchases: {}, sessions: {} };
try {
  const saved = JSON.parse(readFileSync(DATA_FILE, "utf8"));
  database = {
    ...database,
    ...saved,
    accounts: saved.accounts || {},
    pendingPurchases: saved.pendingPurchases || {},
    sessions: saved.sessions || {},
  };
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

function saveDatabase() {
  const temporary = `${DATA_FILE}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(database), { mode: 0o600 });
  renameSync(temporary, DATA_FILE);
}

function normalizarEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

let chavesGoogle = null;
let chavesGoogleExpiramEm = 0;
async function obterChavesGoogle() {
  if (chavesGoogle && chavesGoogleExpiramEm > Date.now()) return chavesGoogle;
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!response.ok) throw new Error("Não foi possível validar o login Google.");
  chavesGoogle = await response.json();
  const maxAge = Number(/max-age=(\d+)/i.exec(response.headers.get("cache-control") || "")?.[1]) || 300;
  chavesGoogleExpiramEm = Date.now() + maxAge * 1000;
  return chavesGoogle;
}

async function verificarTokenGoogle(idToken) {
  if (!GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID não foi configurado no servidor.");
  const partes = String(idToken || "").split(".");
  if (partes.length !== 3) throw new Error("Token Google inválido.");

  const decodificar = (parte) => JSON.parse(Buffer.from(parte, "base64url").toString("utf8"));
  const cabecalho = decodificar(partes[0]);
  const identidade = decodificar(partes[1]);
  if (cabecalho.alg !== "RS256" || typeof cabecalho.kid !== "string") throw new Error("Token Google inválido.");

  const jwk = (await obterChavesGoogle()).keys?.find((chave) => chave.kid === cabecalho.kid);
  if (!jwk || !verify(
    "RSA-SHA256",
    Buffer.from(`${partes[0]}.${partes[1]}`),
    createPublicKey({ key: jwk, format: "jwk" }),
    Buffer.from(partes[2], "base64url"),
  )) throw new Error("Token Google inválido.");

  const audiencias = Array.isArray(identidade.aud) ? identidade.aud : [identidade.aud];
  const emissorValido = ["accounts.google.com", "https://accounts.google.com"].includes(identidade.iss);
  if (!emissorValido || !audiencias.includes(GOOGLE_CLIENT_ID) ||
      !Number.isFinite(identidade.exp) || identidade.exp * 1000 <= Date.now() ||
      !Number.isFinite(identidade.iat) || identidade.iat * 1000 > Date.now() + 60_000 ||
      typeof identidade.sub !== "string" || !identidade.sub ||
      identidade.email_verified !== true || !normalizarEmail(identidade.email)) {
    throw new Error("Não foi possível confirmar a conta Google.");
  }
  return { sub: identidade.sub, email: normalizarEmail(identidade.email) };
}

function creditarCompra(emailInformado, idCompra) {
  const email = normalizarEmail(emailInformado);
  if (!email) return;
  const id = typeof idCompra === "string" && idCompra ? idCompra : null;
  const conta = Object.values(database.accounts).find((item) => item.email === email);
  if (conta) {
    conta.purchaseIds ||= [];
    if (id && conta.purchaseIds.includes(id)) return;
    conta.balance = Math.max(0, Number(conta.balance) || 0) + 1;
    if (id) conta.purchaseIds.push(id);
  } else {
    const pendentes = database.pendingPurchases[email] ||= [];
    if (id && pendentes.some((compra) => compra.id === id)) return;
    pendentes.push({ id, receivedAt: Date.now() });
  }
  saveDatabase();
}

const clienteCompras = mqtt.connect(MQTT_URL, {
  clientId: process.env.SNR_PURCHASE_MQTT_CLIENT_ID || "snr-account-server-v1",
  clean: false,
  reconnectPeriod: 5000,
});
clienteCompras.on("connect", () => {
  clienteCompras.subscribe(PURCHASE_TOPIC, { qos: 1 }, (error) => {
    if (error) console.error("Falha ao assinar compras MQTT:", error.message);
  });
});
clienteCompras.on("message", (_topic, message) => {
  try {
    const evento = JSON.parse(message.toString());
    if (Number(evento?.product) !== 101 || typeof evento.email !== "string") return;
    const id = evento.transactionId || evento.purchaseId || evento.orderId || evento.id || null;
    creditarCompra(evento.email, typeof id === "string" ? id : null);
  } catch (error) {
    console.error("Falha ao processar compra MQTT:", error.message);
  }
});
clienteCompras.on("error", (error) => console.error("Erro MQTT de compras:", error.message));

function enviarJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
}

function lerJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 32 * 1024) {
        reject(new Error("Corpo da requisição muito grande."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error("JSON inválido.")); }
    });
    request.on("error", reject);
  });
}

function buscarContaAutenticada(request) {
  const token = /^Bearer ([a-f0-9]{64})$/i.exec(request.headers.authorization || "")?.[1];
  if (!token) return null;
  const hash = createHash("sha256").update(token).digest("hex");
  const sessao = database.sessions[hash];
  if (!sessao || sessao.expiresAt <= Date.now()) {
    delete database.sessions[hash];
    return null;
  }
  const conta = database.accounts[sessao.sub];
  return conta ? { hash, conta } : null;
}

function criarSessao(sub) {
  const token = randomBytes(32).toString("hex");
  database.sessions[createHash("sha256").update(token).digest("hex")] = {
    sub,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  saveDatabase();
  return token;
}

function enviarConta(response, conta, token = undefined) {
  enviarJson(response, 200, {
    ok: true,
    ...(token ? { token } : {}),
    email: conta.email,
    balance: conta.balance,
  });
}

async function tratarApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    return enviarJson(response, 200, { ok: true, mqttConnected: clienteCompras.connected });
  }
  if (request.method === "POST" && url.pathname === "/api/google/login") {
    const body = await lerJson(request);
    const identidade = await verificarTokenGoogle(body.credential);
    let conta = database.accounts[identidade.sub];
    if (!conta) {
      conta = database.accounts[identidade.sub] = {
        email: identidade.email,
        balance: 0,
        purchaseIds: [],
        spentPurchaseIds: [],
        refundedPurchaseIds: [],
      };
    }
    conta.email = identidade.email;
    conta.purchaseIds ||= [];
    conta.spentPurchaseIds ||= [];
    conta.refundedPurchaseIds ||= [];
    for (const compra of database.pendingPurchases[conta.email] || []) {
      if (!compra.id || !conta.purchaseIds.includes(compra.id)) {
        conta.balance += 1;
        if (compra.id) conta.purchaseIds.push(compra.id);
      }
    }
    delete database.pendingPurchases[conta.email];
    const token = criarSessao(identidade.sub);
    return enviarConta(response, conta, token);
  }

  const sessao = buscarContaAutenticada(request);
  if (request.method === "GET" && url.pathname === "/api/account") {
    if (!sessao) return enviarJson(response, 401, { ok: false, error: "Entre com Google novamente." });
    return enviarConta(response, sessao.conta);
  }
  if (request.method === "POST" && url.pathname === "/api/account/spend") {
    if (!sessao) return enviarJson(response, 401, { ok: false, error: "Entre com Google novamente." });
    const body = await lerJson(request);
    const id = String(body.purchaseId || "");
    if (!/^[a-zA-Z0-9._:-]{8,180}$/.test(id)) return enviarJson(response, 400, { ok: false, error: "Compra inválida." });
    const conta = sessao.conta;
    if (conta.spentPurchaseIds.includes(id)) return enviarConta(response, conta);
    if (conta.balance < 1) return enviarJson(response, 409, { ok: false, error: "SEM MOEDAS SNR" });
    conta.balance -= 1;
    conta.spentPurchaseIds.push(id);
    saveDatabase();
    return enviarConta(response, conta);
  }
  if (request.method === "POST" && url.pathname === "/api/account/refund") {
    if (!sessao) return enviarJson(response, 401, { ok: false, error: "Entre com Google novamente." });
    const body = await lerJson(request);
    const id = String(body.purchaseId || "");
    const conta = sessao.conta;
    if (conta.spentPurchaseIds.includes(id) && !conta.refundedPurchaseIds.includes(id)) {
      conta.balance += 1;
      conta.refundedPurchaseIds.push(id);
      saveDatabase();
    }
    return enviarConta(response, conta);
  }
  if (request.method === "POST" && url.pathname === "/api/logout") {
    if (sessao) {
      delete database.sessions[sessao.hash];
      saveDatabase();
    }
    return enviarJson(response, 200, { ok: true });
  }
  return enviarJson(response, 404, { ok: false, error: "Rota não encontrada." });
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin) {
    if (!origemPermitida(origin, request)) return enviarJson(response, 403, { ok: false, error: "Origem não autorizada." });
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("vary", "Origin");
    response.setHeader("access-control-allow-headers", "authorization, content-type");
    response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  }
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    return response.end();
  }
  try {
    await tratarApi(request, response, new URL(request.url, `http://${request.headers.host || "localhost"}`));
  } catch (error) {
    console.error("Falha na API de conta:", error.message);
    if (!response.headersSent) enviarJson(response, 400, { ok: false, error: error.message });
    else response.destroy();
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`API de conta SNR ouvindo na porta ${PORT}.`);
});

function encerrar() {
  clienteCompras.end(true);
  server.close(() => process.exit(0));
}
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
