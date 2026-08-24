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
      // Como está no EstadoWalk, se está segurando esquerda ou direita, é ataque de lado (side)
      const esq = this.personagem.inputDown("esquerda");
      const dir = this.personagem.inputDown("direita");
      
      let tipoAtaque = "neutro1";
      
      if (this.personagem.obterTipoAtaque) {
        tipoAtaque = this.personagem.obterTipoAtaque();
      } else if (esq || dir) {
        tipoAtaque = "side"; // Força o ataque lateral se estiver andando
      }

      // SÓ entra no estado de atack se NÃO estiver em cooldown!
      if (this.personagem.podeUsarAtaque(tipoAtaque)) {
        this.personagem.maquinaEstados.mudarEstado("atack", { tipo: tipoAtaque });
        return;
      }
    }

    //special
     if (this.personagem.inputJustDown("special")) {
      const tipoSpecial = this.personagem.obterTipoSpecial ? this.personagem.obterTipoSpecial() : "neutro";

      if (this.personagem.podeUsarSpecial(tipoSpecial)) {
        this.personagem.maquinaEstados.mudarEstado("special");
        return;
      }
    }


    // Movimentação no chão
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

    if (this.personagem.inputDown("guard")) {
    this.personagem.maquinaEstados.mudarEstado("guard");
    return;
    }

    // Se caiu de uma plataforma sem pular
    if (!this.personagem.sprite.body.blocked.down) {
      this.personagem.maquinaEstados.mudarEstado("jump");
      return;
    }

    if (this.personagem.inputDown("baixo")) {
      this.personagem.maquinaEstados.mudarEstado("crouch");
      return;
    }
  }
}