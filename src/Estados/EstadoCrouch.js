//import * as Phaser from "phaser";
import EstadoBase from "./EstadoBase.js";

export default class EstadoCrouch extends EstadoBase {
  enter() {
    this.personagem.tocarAnimacao("crouch");

    this.personagem.sprite.setVelocityX(0);
  }

  execute() {
    if (this.personagem.inputDown("esquerda")) {
      this.personagem.sprite.setFlipX(true);
    } else if (this.personagem.inputDown("direita")) {
      this.personagem.sprite.setFlipX(false);
    }

    // ! e tipo uma pergunta negativa: "se nao tiver pra baixo"
    if (!this.personagem.inputDown("baixo")) {
      this.personagem.maquinaEstados.mudarEstado("idle");
      return;
    }

    // Atacar agachado
    if (this.personagem.inputJustDown("atack")) {
      let tipoAtaque = "agachado";

      if (this.personagem.obterTipoAtaque) {
        tipoAtaque = this.personagem.obterTipoAtaque();
      }

      // SÓ entra no estado de atack se NÃO estiver em cooldown!
      if (this.personagem.podeUsarAtaque(tipoAtaque)) {
        this.personagem.maquinaEstados.mudarEstado("atack", { tipo: tipoAtaque });
        return;
      }
    }

    // Transição pro dash
    if (this.personagem.inputJustDown("dash") && this.personagem.podeDash) {
      this.personagem.maquinaEstados.mudarEstado("dash");
      return;
    }

    // Transição pro pulo usando a função pular
    if (this.personagem.inputJustDown("cima")) {
      this.personagem.pular();
      return;
    }

    // Se sair da plataforma sem pular
    if (
      !this.personagem.sprite.body.blocked.down &&
      !this.personagem.sprite.body.touching.down
    ) {
      this.personagem.maquinaEstados.mudarEstado("jump");
      return;
    }
  }

  exit() {}
}