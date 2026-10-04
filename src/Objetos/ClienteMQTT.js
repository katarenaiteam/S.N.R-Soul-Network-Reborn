const mqtt = globalThis.mqtt;
const LETRAS_CLIENT_ID = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function criarClientId(papel) {
  let id = "";
  for (let indice = 0; indice < 4; indice += 1) {
    id += LETRAS_CLIENT_ID[Math.floor(Math.random() * LETRAS_CLIENT_ID.length)];
  }
  return `snr-${papel}-${id}`;
}

export default class ClienteMQTT extends Phaser.Events.EventEmitter {
  constructor({ brokerUrl, topicPrefix }, papel) {
    super();
    this.brokerUrl = brokerUrl;
    this.topicPrefix = topicPrefix.replace(/\/$/, "");
    this.papel = papel;
    this.client = null;
    this.ultimoEstado = null;
  }

  connect() {
    if (this.client) return;
    if (!mqtt?.connect) {
      this.emit("error", new Error("O bundle MQTT do navegador nao foi carregado."));
      return;
    }

    this.clientId = criarClientId(this.papel);
    this.client = mqtt.connect(this.brokerUrl, { clientId: this.clientId });

    this.client.on("connect", () => {
      console.log(`Connected to MQTT broker at ${this.brokerUrl}`);
      this.emit("connect");
      if (this.papel === "espectador") this.subscribe("state");
    });

    this.client.on("message", (topico, mensagem) => {
      const topicoCurto = topico.startsWith(`${this.topicPrefix}/`)
        ? topico.slice(this.topicPrefix.length + 1)
        : topico;
      let dados;
      try {
        dados = JSON.parse(mensagem.toString());
      } catch {
        dados = mensagem.toString();
      }

      if (topicoCurto === "state") {
        this.ultimoEstado = dados;
      }

      this.emit("message", topicoCurto, dados);
      this.emit(`message:${topicoCurto}`, dados);
    });

    this.client.on("error", (erro) => this.emit("error", erro));
    this.client.on("close", () => this.emit("close"));
    this.client.on("reconnect", () => this.emit("reconnect"));
  }

  subscribe(topico) {
    const topicos = Array.isArray(topico) ? topico : [topico];
    const topicosComPrefixo = topicos.map((item) => `${this.topicPrefix}/${item}`);
    this.client?.subscribe(topicosComPrefixo, (erro) => {
      if (erro) this.emit("error", erro);
    });
  }

  publish(topico, dados, opcoes = {}) {
    if (!this.client?.connected) return;
    const envelope =
      typeof dados === "object" && dados !== null
        ? { ...dados, clientId: this.clientId }
        : { data: dados, clientId: this.clientId };
    this.client.publish(
      `${this.topicPrefix}/${topico}`,
      JSON.stringify(envelope),
      opcoes,
    );
  }

  publishState(estado) {
    if (this.papel !== "host") return;
    this.publish("state", { ...estado, updatedAt: Date.now() }, { retain: true });
  }

  clearState() {
    if (this.papel !== "host" || !this.client?.connected) return;
    this.client.publish(`${this.topicPrefix}/state`, "", { retain: true });
  }

  disconnect() {
    this.client?.end();
    this.client = null;
  }
}