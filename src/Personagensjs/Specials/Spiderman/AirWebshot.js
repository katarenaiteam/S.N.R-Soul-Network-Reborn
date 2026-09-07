import WebShot from "./WebShot.js";
import { tocarSomSeguro } from "../../../Objetos/AudioSeguro.js";

export default class AirWebShot extends WebShot {
  constructor(personagem, special) {
    super(personagem, special);
    this.aereo = true;
  }

  executar() {
    if (this.encerrado || this.projetil) return;
    if (this.personagem.sprite.body.blocked.down) {
      this.finalizarProjetil();
      return;
    }
    tocarSomSeguro(this.scene, "sp-WebBall_", { volume: 0.2 });
    this.personagem.sprite.setVelocityY(40);
    this.criarProjetil();
  }
}
