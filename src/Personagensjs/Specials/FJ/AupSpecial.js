import DoSpecial from "./DoSpecial.js";

const IMPULSO_Y = -700;
const IMPULSO_X = 140;

export default class AupSpecial extends DoSpecial {
  executar() {
    this.impulsoAplicado = false;
    this.dano = 16;
    super.executar();
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || animacao?.key !== this.special.animacao) return;
    const indice = Number(frame.textureFrame);
    if (indice >= 5 && !this.impulsoAplicado) {
      this.impulsoAplicado = true;
      // Impulso unico: a gravidade desacelera a subida e conduz a queda.
      this.personagem.sprite.setVelocity(IMPULSO_X * this.direcao, IMPULSO_Y);
    }
    if (indice >= 5 && indice <= 9) this.criarHitbox();
    else this.destruirHitbox();
  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const sprite = this.personagem.sprite;
    this.hitbox.setPosition(sprite.x + 24 * this.direcao, sprite.y - 95);
    this.hitbox.body.updateFromGameObject();
  }
}
