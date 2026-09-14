export function criarIndicador(personagem, texturaNormal, texturaCima) {
  const indicador = this.add.image(0, 0, texturaNormal)
    .setOrigin(0.5, 1)
    .setScrollFactor(0)
    .setDepth(1500);
  Object.assign(indicador, { personagem, texturaNormal, texturaCima });
  this.camJogo.ignore(indicador);
  return indicador;
}

export function atualizarIndicador(indicador) {
  const personagem = indicador?.personagem;
  const sprite = personagem?.sprite;
  if (!sprite?.active || !sprite.visible || personagem.eliminado) {
    indicador?.setVisible(false);
    return;
  }
  const cam = this.camJogo;
  const corpo = sprite.body;
  const centroX = corpo?.center?.x ?? sprite.x;
  const topo = corpo?.top ?? sprite.getBounds().top;
  // worldView so e atualizado no render; scroll e zoom ja refletem a camera
  // deste frame. A projecao conserva o alinhamento durante zoom e movimento.
  const origemX = cam.width * cam.originX;
  const origemY = cam.height * cam.originY;
  const xTela = cam.x + origemX + (centroX - cam.scrollX - origemX) * cam.zoom;
  const yTela = cam.y + origemY + (topo - cam.scrollY - origemY) * cam.zoom;
  indicador.setTexture(yTela < 0 ? indicador.texturaCima : indicador.texturaNormal);
  const margemX = indicador.displayWidth / 2 + 12;
  const margemY = indicador.displayHeight + 12;
  indicador.setVisible(true).setPosition(
    Math.round(Phaser.Math.Clamp(xTela, margemX, this.scale.width - margemX)),
    Math.round(Phaser.Math.Clamp(yTela - 22, margemY, this.scale.height - 12)),
  );
}
