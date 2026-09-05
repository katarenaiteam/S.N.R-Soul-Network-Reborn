export function tocarSomSeguro(scene, chave, config = {}) {
  if (!scene?.sound || !chave || !scene.cache.audio.exists(chave)) return null;

  const cancelar = () => scene.sound.off("unlocked", tocar);
  const tocar = () => {
    scene.events.off("shutdown", cancelar);
    return scene.sound.play(chave, config);
  };
  if (!scene.sound.locked) return tocar();

  scene.sound.once("unlocked", tocar);
  scene.events.once("shutdown", cancelar);
  return null;
}

export function tocarMusicaSegura(scene, chave, config = {}) {
  if (!scene?.sound || !chave || !scene.cache.audio.exists(chave)) return null;

  const musica = scene.sound.add(chave, config);
  const tocar = () => musica.play();
  const desvincular = () => {
    scene.sound.off("unlocked", tocar);
    scene.events.off("shutdown", encerrar);
  };
  const encerrar = () => {
    desvincular();
    musica.destroy();
  };
  scene.events.once("shutdown", encerrar);
  musica.once("destroy", desvincular);
  // Parar antes do desbloqueio tambem cancela a reproducao pendente.
  musica.once("stop", () => scene.sound.off("unlocked", tocar));
  if (scene.sound.locked) {
    scene.sound.once("unlocked", tocar);
  } else {
    musica.play();
  }
  return musica;
}
