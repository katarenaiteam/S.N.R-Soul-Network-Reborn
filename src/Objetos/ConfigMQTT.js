const variaveisAmbiente = import.meta.env ?? {};
const sala = variaveisAmbiente.VITE_SNR_ROOM || "arena-01";

const configMQTT = {
  brokerUrl:
    variaveisAmbiente.VITE_MQTT_BROKER_URL ||
    "wss://snr.feira-de-jogos.dev.br/mqtt",
  topicPrefix: `SNR/${sala}`,
};

export default configMQTT;
