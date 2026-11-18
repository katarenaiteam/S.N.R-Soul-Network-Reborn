const CHAVE_BANIDOS = "snr-espectador-emails-banidos";
const TEMPO_PRESENCA_MS = 45000;

function normalizarEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function carregarBanidos() {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_BANIDOS) || "[]");
    return new Set(lista.map(normalizarEmail).filter(Boolean));
  } catch {
    return new Set();
  }
}

const emailsBanidos = carregarBanidos();
const presencas = new Map();

export function usuarioBanido(email) {
  return emailsBanidos.has(normalizarEmail(email));
}

export function banirUsuario(email) {
  const normalizado = normalizarEmail(email);
  if (!normalizado) return false;
  emailsBanidos.add(normalizado);
  localStorage.setItem(CHAVE_BANIDOS, JSON.stringify([...emailsBanidos]));
  return true;
}

export function desbanirUsuario(email) {
  const removido = emailsBanidos.delete(normalizarEmail(email));
  localStorage.setItem(CHAVE_BANIDOS, JSON.stringify([...emailsBanidos]));
  return removido;
}

export function listarUsuariosBanidos() {
  return [...emailsBanidos].sort();
}

export function registrarPresencaEspectador(email, clientId, vistoEm = Date.now()) {
  const normalizado = normalizarEmail(email);
  if (!normalizado || typeof clientId !== "string") return;
  presencas.set(clientId, { email: normalizado, clientId, vistoEm });
}

export function listarEspectadoresOnline(agora = Date.now()) {
  for (const [clientId, presenca] of presencas) {
    if (agora - presenca.vistoEm > TEMPO_PRESENCA_MS) presencas.delete(clientId);
  }
  return [...new Map([...presencas.values()].map(({ email, clientId }) => [email, { email, clientId }])).values()]
    .sort((a, b) => a.email.localeCompare(b.email));
}
