const mqtt = globalThis.mqtt;
const variaveisAmbiente = import.meta.env ?? {};

const URL_BROKER =
  variaveisAmbiente.VITE_MQTT_BROKER_URL || "wss://test.mosquitto.org:8081/mqtt";
const PREFIXO_TOPICO =
  variaveisAmbiente.VITE_MQTT_TOPIC_PREFIX || "6080821-2026.2";
const ID_SALA = variaveisAmbiente.VITE_SNR_ROOM || "arena-01";
const TOPICO_BASE = `${PREFIXO_TOPICO}/SNR/${ID_SALA}`;

export const TOPICO_STATUS = `${TOPICO_BASE}/status`;
export const TOPICO_ESTADO = `${TOPICO_BASE}/state`;

function criarClientId(papel) {
  const aleatorio = Math.random().toString(36).slice(2, 12);
  return `snr-${papel}-${aleatorio}`;
}

export default class ClienteMQTT extends Phaser.Events.EventEmitter {
  constructor(papel) {
    super();
    this.papel = papel;
    this.client = null;
    this.ultimoEstado = null;
    this.ultimoStatus = null;
    this.statusDesejado = "aguardando-versus";
  }

  conectar() {
    if (this.client) return;
    if (!mqtt?.connect) {
      this.emit("error", new Error("O bundle MQTT do navegador nao foi carregado."));
      return;
    }

    const opcoes = {
      clientId: criarClientId(this.papel),
      reconnectPeriod: 2000,
      connectTimeout: 10000,
      clean: true,
    };

    if (this.papel === "host") {
      opcoes.will = {
        topic: TOPICO_STATUS,
        payload: JSON.stringify({ status: "offline" }),
        qos: 0,
        retain: true,
      };
    }

    this.client = mqtt.connect(URL_BROKER, opcoes);

    this.client.on("connect", () => {
      if (this.papel === "host") {
        this.publicarStatus(this.statusDesejado);
      }
      this.emit("connect");
      if (this.papel !== "espectador") return;

      this.client.subscribe([TOPICO_STATUS, TOPICO_ESTADO], (erro) => {
        if (erro) this.emit("error", erro);
      });
    });

    this.client.on("message", (topico, mensagem) => {
      let dados;
      try {
        dados = JSON.parse(mensagem.toString());
      } catch {
        return;
      }

      if (topico === TOPICO_STATUS) {
        this.ultimoStatus = dados;
        this.emit("status", dados);
      } else if (topico === TOPICO_ESTADO) {
        this.ultimoEstado = dados;
        this.emit("state", dados);
      }
    });

    this.client.on("error", (erro) => this.emit("error", erro));
    this.client.on("close", () => this.emit("close"));
    this.client.on("reconnect", () => this.emit("reconnect"));
  }

  publicarStatus(status) {
    if (this.papel !== "host") return;
    this.statusDesejado = status;
    if (!this.client?.connected) return;
    this.client.publish(
      TOPICO_STATUS,
      JSON.stringify({ status, updatedAt: Date.now() }),
      { retain: true },
    );
  }

  publicarEstado(estado) {
    if (this.papel !== "host" || !this.client?.connected) return;
    this.client.publish(
      TOPICO_ESTADO,
      JSON.stringify({ ...estado, updatedAt: Date.now() }),
      { retain: true },
    );
  }

  limparEstado() {
    if (this.papel !== "host" || !this.client?.connected) return;
    this.client.publish(TOPICO_ESTADO, "", { retain: true });
  }

  desconectar() {
    this.client?.end(true);
    this.client = null;
  }
}