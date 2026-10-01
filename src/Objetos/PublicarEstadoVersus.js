export function publicarEstadoVersus(scene, cena, dados) {
  if (scene.modoEspectador) return;

  const mqtt = scene.registry.get("clienteMQTT");
  if (mqtt?.papel !== "host") return;

  if (mqtt.statusDesejado !== "ao-vivo") {
    mqtt.publicarStatus("ao-vivo");
  }
  mqtt.publicarEstado({ cena, modo: "1v1", dados });
}