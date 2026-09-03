export function tocarSomSeguro(scene, chave, config = {}) {
  if (!scene?.sound || !chave || !scene.cache.audio.exists(chave)) return null;

  const tocar = () => scene.sound.play(chave, config);
  if (!scene.sound.locked) return tocar();

  scene.sound.once("unlocked", tocar);
  return null;
}

export function tocarMusicaSegura(scene, chave, config = {}) {
  if (!scene?.sound || !chave || !scene.cache.audio.exists(chave)) return null;

  const musica = scene.sound.add(chave, config);
  if (scene.sound.locked) {
    scene.sound.once("unlocked", () => musica.play());
  } else {
    musica.play();
  }
  return musica;
}