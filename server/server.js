import { createServer } from "node:http";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import mqtt from "mqtt";

try {
  const arquivoAmbiente = await readFile(resolve(".env"), "utf8");
  for (const linha of arquivoAmbiente.split(/\r?\n/)) {
    const correspondencia = linha.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (correspondencia && process.env[correspondencia[1]] === undefined) {
      process.env[correspondencia[1]] = correspondencia[2].replace(/^['"]|['"]$/g, "");
    }
  }
} catch (erro) {
  if (erro.code !== "ENOENT") throw erro;
}

const PORT = Number(process.env.PORT || 3001);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "14164817969-s43fpf0hi0vdh2lkjn372igr4lsv96lq.apps.googleusercontent.com";
const WEB_ORIGIN = process.env.SNR_WEB_ORIGIN || "http://localhost:5173";
const FEIRA_BROKER_URL = process.env.FEIRA_MQTT_BROKER_URL || "wss://mqtt.feira-de-jogos.dev.br/mqtt";
const FEIRA_TOPIC = process.env.FEIRA_MQTT_TOPIC || "vending/comando/#";
const SNR_BROKER_URL = process.env.SNR_MQTT_BROKER_URL || process.env.VITE_MQTT_BROKER_URL || "wss://snr.feira-de-jogos.dev.br/mqtt";
const SNR_TOPIC_PREFIX = process.env.SNR_MQTT_TOPIC_PREFIX || process.env.VITE_MQTT_TOPIC_PREFIX || "6080821-2026.2";
const SNR_ROOM = process.env.SNR_ROOM || process.env.VITE_SNR_ROOM || "arena-01";
const SNR_TOPIC_ROOT = `${SNR_TOPIC_PREFIX}/SNR/${SNR_ROOM}`;
const DATA_FILE = resolve(process.env.SNR_LEDGER_FILE || "./data/snr-ledger.json");
const EFEITOS_VALIDOS = new Set([
  "miku-rain", "less", "puppet", "life", "slen-shop", "1hit",
  "froze-shop", "lava-shop", "raio", "ult-shop", "dead-shop",
]);
const EFEITOS_COM_JOGADOR = new Set([
  "less", "life", "slen-shop", "froze-shop", "raio", "ult-shop", "dead-shop",
]);

let ledger = { balances: {}, processedPurchases: {} };
let filaEscrita = Promise.resolve();
let filaLedger = Promise.resolve();

function serializar(fn) {
  const proximo = filaLedger.then(fn, fn);
  filaLedger = proximo.catch(() => {});
  return proximo;
}

async function salvarLedger() {
  const temporario = `${DATA_FILE}.tmp`;
  await mkdir(dirname(DATA_FILE), { recursive: true });
  const conteudo = JSON.stringify(ledger, null, 2);
  filaEscrita = filaEscrita.catch(() => {}).then(() => writeFile(temporario, conteudo, "utf8")).then(() => rename(temporario, DATA_FILE));
  await filaEscrita;
}

async function carregarLedger() {
  try {
    ledger = JSON.parse(await readFile(DATA_FILE, "utf8"));
    ledger.balances ||= {};
    ledger.processedPurchases ||= {};
  } catch (erro) {
    if (erro.code !== "ENOENT") throw erro;
    await salvarLedger();
  }
}

await carregarLedger();

async function verificarGoogle(idToken) {
  if (!GOOGLE_CLIENT_ID) throw new Error("Login Google ainda não está configurado no servidor.");
  if (typeof idToken !== "string" || !idToken) throw new Error("Faça login com Google.");
  const url = new URL("https://oauth2.googleapis.com/tokeninfo");
  url.searchParams.set("id_token", idToken);
  const resposta = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!resposta.ok) throw new Error("A sessão Google expirou. Entre novamente.");
  const perfil = await resposta.json();
  if (perfil.aud !== GOOGLE_CLIENT_ID || String(perfil.email_verified) !== "true" || !perfil.email) {
    throw new Error("Não foi possível validar a conta Google.");
  }
  return perfil.email.trim().toLowerCase();
}

function enviarJson(resposta, status, dados) {
  resposta.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    vary: "Origin",
  });
  resposta.end(JSON.stringify(dados));
}

async function lerJson(requisicao) {
  let corpo = "";
  for await (const parte of requisicao) {
    corpo += parte;
    if (corpo.length > 16_384) throw new Error("Requisição muito grande.");
  }
  return JSON.parse(corpo || "{}");
}

const clienteFeira = mqtt.connect(FEIRA_BROKER_URL, {
  clientId: "snr-ledger-service",
  clean: false,
  reconnectPeriod: 5000,
});
clienteFeira.on("connect", () => clienteFeira.subscribe(FEIRA_TOPIC, { qos: 1 }));
clienteFeira.on("error", (erro) => console.error("MQTT Feira:", erro.message));
clienteFeira.on("message", (topico, mensagem) => {
  let evento;
  try {
    evento = JSON.parse(mensagem.toString());
  } catch {
    return;
  }
  const email = typeof evento?.email === "string" ? evento.email.trim().toLowerCase() : "";
  if (Number(evento?.product) !== 101 || !email) return;

  const identificador = evento.transactionId || evento.purchaseId || evento.orderId;
  const idCompra = identificador ? `${email}:${identificador}` : "";
  serializar(async () => {
    if (idCompra && ledger.processedPurchases[idCompra]) return;
    ledger.balances[email] = (ledger.balances[email] || 0) + 1;
    if (idCompra) ledger.processedPurchases[idCompra] = { topico, recebidoEm: Date.now() };
    await salvarLedger();
    console.log("Crédito de moeda SNR registrado.");
  }).catch((erro) => console.error("Falha ao registrar compra Feira:", erro));
});

const clienteSNR = mqtt.connect(SNR_BROKER_URL, {
  clientId: `snr-loja-api-${randomUUID().slice(0, 8)}`,
  reconnectPeriod: 5000,
});
clienteSNR.on("error", (erro) => console.error("MQTT SNR:", erro.message));

const servidor = createServer(async (requisicao, resposta) => {
  if (requisicao.headers.origin === WEB_ORIGIN) {
    resposta.setHeader("access-control-allow-origin", WEB_ORIGIN);
    resposta.setHeader("access-control-allow-headers", "content-type");
    resposta.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  }
  if (requisicao.method === "OPTIONS") {
    resposta.writeHead(204, { vary: "Origin" });
    return resposta.end();
  }
  if (requisicao.method === "GET" && requisicao.url === "/api/health") {
    return enviarJson(resposta, 200, {
      ok: true,
      feiraConectada: clienteFeira.connected,
      jogoConectado: clienteSNR.connected,
    });
  }
  if (requisicao.method !== "POST" || !["/api/account", "/api/shop/purchase"].includes(requisicao.url)) {
    return enviarJson(resposta, 404, { error: "Rota não encontrada." });
  }

  try {
    const dados = await lerJson(requisicao);
    const email = await verificarGoogle(dados.idToken);
    if (requisicao.url === "/api/account") {
      const saldo = await serializar(() => ledger.balances[email] || 0);
      return enviarJson(resposta, 200, { email, saldo });
    }

    const { efeito, jogador, clientId } = dados;
    if (!EFEITOS_VALIDOS.has(efeito)) throw new Error("Item inválido.");
    if (EFEITOS_COM_JOGADOR.has(efeito) && ![1, 2].includes(jogador)) {
      throw new Error("Escolha o jogador alvo.");
    }
    if (typeof clientId !== "string" || !/^snr-espectador-[A-Z]{4}$/.test(clientId)) {
      throw new Error("Sessão MQTT do espectador inválida.");
    }
    if (!clienteSNR.connected) throw new Error("Loja indisponível; tente novamente.");

    const compra = await serializar(async () => {
      const saldoAtual = ledger.balances[email] || 0;
      if (saldoAtual < 1) throw new Error("Sem moedas SNR.");
      ledger.balances[email] = saldoAtual - 1;
      await salvarLedger();

      const pedido = {
        efeito,
        jogador,
        clientId,
        pedidoId: `${clientId}-${Date.now()}-${randomUUID().slice(0, 8)}`,
      };
      try {
        await new Promise((resolvePublicacao, rejeitarPublicacao) => {
          clienteSNR.publish(`${SNR_TOPIC_ROOT}/shop/purchase`, JSON.stringify(pedido), { qos: 1 }, (erro) => {
            if (erro) rejeitarPublicacao(erro);
            else resolvePublicacao();
          });
        });
      } catch (erro) {
        ledger.balances[email] += 1;
        await salvarLedger();
        throw erro;
      }
      return { email, saldo: ledger.balances[email] };
    });
    return enviarJson(resposta, 200, compra);
  } catch (erro) {
    const status = erro.message.includes("configurado") ? 503
      : erro.message.includes("Sem moedas") ? 409
        : erro.message.includes("Sessão") || erro.message.includes("Item inválido") || erro.message.includes("Escolha") ? 400
          : erro.message.includes("Google") || erro.message.includes("login") || erro.message.includes("sessão Google") ? 401
            : 503;
    return enviarJson(resposta, status, { error: erro.message || "Erro interno." });
  }
});

servidor.listen(PORT, () => console.log(`API de moedas SNR ouvindo na porta ${PORT}`));

function encerrar() {
  clienteFeira.end();
  clienteSNR.end();
  servidor.close(() => process.exit(0));
}
process.on("SIGINT", encerrar);
process.on("SIGTERM", encerrar);
