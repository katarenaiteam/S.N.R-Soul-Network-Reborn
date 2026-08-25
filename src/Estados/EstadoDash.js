//import * as Phaser from "phaser";
import EstadoBase from "./EstadoBase.js";

export default class EstadoDash extends EstadoBase {
  enter() {
    this.personagem.tocarSomSorteado(this.personagem.sons.dash, { volume: 0.5 });
    // Registra o tempo do dash atual
    this.personagem.tempoUltimoDash = this.personagem.scene.time.now;
    this.personagem.podeDash = false;
    this.personagem.estaEmDash = true;
    this.personagem.dashs++; // Incrementa para respeitar o maxDash!

    this.personagem.tocarAnimacao("dash");

    let direcao = this.personagem.inputDown("esquerda")
      ? -1
      : this.personagem.inputDown("direita")
        ? 1
        : this.personagem.sprite.flipX
          ? -1
          : 1;

    this.personagem.sprite.body.setAllowGravity(false);
    this.personagem.sprite.setVelocityY(0);
    this.personagem.sprite.setVelocityX(direcao * 700);

    // Timer de 250ms do Dash
    this.personagem.scene.time.delayedCall(250, () => {
      this.personagem.estaEmDash = false;
      this.personagem.sprite.body.setAllowGravity(true);

      if (!this.personagem.sprite.body.blocked.down) {
        this.personagem.maquinaEstados.mudarEstado("jump");
      } else if (
        this.personagem.inputDown("esquerda") ||
        this.personagem.inputDown("direita")
      ) {
        // No chão andando: desacelera suavemente o excesso de velocidade do dash
        const velAtual = this.personagem.sprite.body.velocity.x;
        this.personagem.sprite.setVelocityX(velAtual * 0.5);
        this.personagem.maquinaEstados.mudarEstado("walk");
      } else {
        // No chão parado: aplica desaceleração leve (menos brusca que zerar direto)
        const velAtual = this.personagem.sprite.body.velocity.x;
        this.personagem.sprite.setVelocityX(velAtual * 0.3);
        this.personagem.maquinaEstados.mudarEstado("idle");
      }
    });

    // Libera a flag do cooldown após o tempo limite
    this.personagem.scene.time.delayedCall(this.personagem.cooldownDash, () => {
      this.personagem.podeDash = true;
    });
  }

  execute() {
    // Mantém a velocidade constante durante o dash sem interferência externa
    if (this.personagem.estaEmDash) {
      let direcao = this.personagem.sprite.flipX ? -1 : 1;
      this.personagem.sprite.setVelocityX(direcao * 700);
      this.personagem.sprite.setVelocityY(0);
    }
  }
}