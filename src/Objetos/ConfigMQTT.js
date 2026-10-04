const variaveisAmbiente = import.meta.env ?? {};
const prefixoTopico =
  variaveisAmbiente.VITE_MQTT_TOPIC_PREFIX || "6080821-2026.2";
const sala = variaveisAmbiente.VITE_SNR_ROOM || "arena-01";

const configMQTT = {
  brokerUrl:
    variaveisAmbiente.VITE_MQTT_BROKER_URL ||
    "wss://snr.feira-de-jogos.dev.br:9091/mqtt",
  topicPrefix: `${prefixoTopico}/SNR/${sala}`,
};

export default configMQTT;