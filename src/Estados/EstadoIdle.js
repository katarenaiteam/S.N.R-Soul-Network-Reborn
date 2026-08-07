//import * as Phaser from "phaser";
import EstadoBase from "./EstadoBase.js";

export default class EstadoIdle extends EstadoBase {
  /**
   * Executado quando o personagem entra no estado Parado
   */
  enter() {
    // 1. Zera o movimento horizontal para o personagem parar na hora
    this.personagem.sprite.setVelocityX(0);

    // 2. Toca a animação de "idle" (parado)
    this.personagem.tocarAnimacao("idle");
  }

  /**
   * Loop executado a cada frame
   */
  execute() {
    // 1. Transição para AGACHADO (Subiu para o topo para ter prioridade!)
    if (this.personagem.inputDown("baixo")) {
      this.personagem.maquinaEstados.mudarEstado("crouch");
      return;
    }

    // 2. Transição para DASH
    if (this.personagem.inputJustDown("dash") && this.personagem.podeDash) {
      this.personagem.maquinaEstados.mudarEstado("dash");
      return;
    }

    // 3. Transição para PULO
    if (this.personagem.inputJustDown("cima")) {
      this.personagem.pular();
      return;
    }

    if (this.personagem.inputJustDown("atack")) {
      this.personagem.maquinaEstados.mudarEstado("atack", { tipo: "neutro" });
      return;
    }

    // 4. Transição para ANDAR
    if (
      this.personagem.inputDown("esquerda") ||
      this.personagem.inputDown("direita")
    ) {
      this.personagem.maquinaEstados.mudarEstado("walk");
      return;
    }

    // 5. Segurança: se o personagem caiu de uma plataforma sem pular
    if (
      !this.personagem.sprite.body.blocked.down &&
      !this.personagem.sprite.body.touching.down
    ) {
      this.personagem.maquinaEstados.mudarEstado("jump");
      return;
    }
  }
}
