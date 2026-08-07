//import * as Phaser from "phaser";
import EstadoBase from "./EstadoBase.js";

export default class EstadoWalk extends EstadoBase {
  enter() {
    this.personagem.tocarAnimacao("walk");
  }

  execute() {
    // Pulo
    if (this.personagem.inputJustDown("cima")) {
      this.personagem.pular();
      return;
    }

    // Dash
    if (this.personagem.inputJustDown("dash") && this.personagem.podeDash) {
      this.personagem.maquinaEstados.mudarEstado("dash");
      return;
    }

    // atack
    if (this.personagem.inputJustDown("atack")) {
      this.personagem.maquinaEstados.mudarEstado("atack");
      return;
    }

    //  Movimentação no chão
    if (this.personagem.inputDown("esquerda")) {
      this.personagem.sprite.setVelocityX(-this.personagem.velocidade);
      this.personagem.sprite.setFlipX(true);
    } else if (this.personagem.inputDown("direita")) {
      this.personagem.sprite.setVelocityX(this.personagem.velocidade);
      this.personagem.sprite.setFlipX(false);
    } else {
      // Se soltou as teclas, volta para o Idle
      this.personagem.maquinaEstados.mudarEstado("idle");
      return;
    }

    //  Se caiu de uma plataforma sem pular
    if (!this.personagem.sprite.body.blocked.down) {
      this.personagem.maquinaEstados.mudarEstado("jump");
      return;
    }

    if (this.personagem.inputDown("baixo")) {
      this.personagem.maquinaEstados.mudarEstado("crouch"); // ou "agachado", dependendo de como registrou
      return;
    }
  }
}
