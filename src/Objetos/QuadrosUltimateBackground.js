const PARTES_ULTIMATE_BACKGROUND = [
  { textura: "ultimateback1", quadros: 29 },
  { textura: "ultimateback2", quadros: 37 },
  { textura: "ultimateback3", quadros: 40 },
  { textura: "ultimateback4", quadros: 10 },
];

export function gerarQuadrosUltimateBackground(scene, inicio = 0, fim = 115) {
  const quadros = [];
  let deslocamento = 0;

  for (const parte of PARTES_ULTIMATE_BACKGROUND) {
    const primeiroLocal = Math.max(0, inicio - deslocamento);
    const ultimoLocal = Math.min(parte.quadros - 1, fim - deslocamento);

    if (primeiroLocal <= ultimoLocal) {
      quadros.push(...scene.anims.generateFrameNumbers(parte.textura, {
        start: primeiroLocal,
        end: ultimoLocal,
      }));
    }

    deslocamento += parte.quadros;
  }

  return quadros;
}
