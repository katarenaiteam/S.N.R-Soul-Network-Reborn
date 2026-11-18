const URL_BROKER_FEIRA = "wss://mqtt.feira-de-jogos.dev.br/mqtt";
const TOPICO_COMANDOS_FEIRA = "vending/comando/#";
const CHAVE_COMPRAS_PENDENTES = "snr-compras-pendentes";
const CHAVE_CLIENTE_MQTT_FEIRA = "snr-feira-mqtt-client-id";

function obterClientIdFeira() {
  const salvo = localStorage.getItem(CHAVE_CLIENTE_MQTT_FEIRA);
  if (typeof salvo === "string" && /^snr-espectador-[a-z0-9]{8}$/.test(salvo)) return salvo;

  const clientId = `snr-espectador-${Math.random().toString(36).slice(2, 10).padEnd(8, "0")}`;
  localStorage.setItem(CHAVE_CLIENTE_MQTT_FEIRA, clientId);
  return clientId;
}

function carregarComprasPendentes() {
  try {
    const compras = JSON.parse(localStorage.getItem(CHAVE_COMPRAS_PENDENTES) || "[]");
    return Array.isArray(compras) ? compras : [];
  } catch {
    return [];
  }
}

export default function iniciarRecebedorCompras() {
  if (globalThis.recebedorComprasSNR || !globalThis.mqtt?.connect) return;

  const cliente = globalThis.mqtt.connect(URL_BROKER_FEIRA, {
    clientId: obterClientIdFeira(),
    clean: false,
    reconnectPeriod: 5000,
  });
  globalThis.recebedorComprasSNR = cliente;

  cliente.on("connect", () => {
    cliente.subscribe(TOPICO_COMANDOS_FEIRA, { qos: 1 });
  });
  cliente.on("message", (_topico, mensagem) => {
    let evento;
    try {
      evento = JSON.parse(mensagem.toString());
    } catch {
      return;
    }
    if (Number(evento?.product) !== 101 || typeof evento?.email !== "string") return;

    const compra = {
      product: 101,
      email: evento.email.trim().toLowerCase(),
      id: evento.transactionId || evento.purchaseId || evento.orderId || null,
      recebidaEm: Date.now(),
    };
    const compras = carregarComprasPendentes();
    if (compra.id && compras.some((item) => item.id === compra.id)) return;
    compras.push(compra);
    localStorage.setItem(CHAVE_COMPRAS_PENDENTES, JSON.stringify(compras));
    window.dispatchEvent(new CustomEvent("snr-compra-recebida", { detail: compra }));
  });
}
