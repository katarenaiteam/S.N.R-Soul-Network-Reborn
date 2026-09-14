import WebShot from "./WebShot.js";
import { tocarSomSeguro } from "../../../Objetos/AudioSeguro.js";

export default class AirWebShot extends WebShot {
  constructor(personagem, special) {
    super(personagem, special);
    this.aereo = true;
    this.disparoHorizontal = special.disparoHorizontal === true;
    this.anguloOriginal = null;
  }

  executar() {
    if (this.encerrado || this.projetil) return;
    if (this.personagem.sprite.body.blocked.down) {
      this.finalizarProjetil();
      return;
    }
    tocarSomSeguro(this.scene, "sp-WebBall_", { volume: 0.2 });
    if (this.disparoHorizontal) {
      const sprite = this.personagem.sprite;
      this.anguloOriginal = sprite.angle;
      sprite.setAngle(this.anguloOriginal - 35 * (sprite.flipX ? -1 : 1));
    }
    this.personagem.sprite.setVelocityY(40);
    this.criarProjetil();
  }

  cancelar() {
    // O disparo continua vivo depois da pose; somente a inclinacao e restaurada.
    if (this.anguloOriginal !== null && this.personagem.sprite?.active) {
      this.personagem.sprite.setAngle(this.anguloOriginal);
      this.anguloOriginal = null;
    }
  }
}
