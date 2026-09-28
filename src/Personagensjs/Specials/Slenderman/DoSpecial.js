import NeSpecial from "./NeSpecial.js";

export default class DoSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.special = special;
    this.estado = estado;
    this.proximoCorte = 0;
    this.aoAtualizarPose = this.aoAtualizarPose.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    sprite.on("animationupdate", this.aoAtualizarPose);
    this.aoAtualizarPose(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarPose(animacao, frame) {
    if (animacao?.key !== this.special.animacao || !frame) return;
    const corte = this.special.cortes[this.proximoCorte];
    if (!corte || Number(frame.textureFrame) < corte.frameProjetil) return;
    const logica = new NeSpecial(this.personagem, {
      ...this.special,
      frameProjetil: corte.frameProjetil,
      propriedades: { ...this.special.propriedades, ...corte.propriedades },
    }, this.estado);
    this.personagem.logicasEspeciaisAtivas.push(logica);
    logica.executar();
    this.proximoCorte += 1;
    if (this.proximoCorte === this.special.cortes.length) this.cancelar();
  }

  cancelar() {
    this.personagem.sprite.off("animationupdate", this.aoAtualizarPose);
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}
