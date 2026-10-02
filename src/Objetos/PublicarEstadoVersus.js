export function publicarEstadoVersus(scene, cena, dados) {
  if (scene.modoEspectador) return;

  const mqtt = scene.registry.get("clienteMQTT");
  if (mqtt?.papel !== "host") return;

  mqtt.publishState({ cena, modo: "1v1", dados });
}