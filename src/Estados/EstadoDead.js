import EstadoBase from "./EstadoBase.js";

export default class EstadoDead extends EstadoBase {
  enter() {
    this.personagem.sprite.setVelocityX(0);
    this.levantando = false;

    // Toca a animação do personagem caído no chão
    this.personagem.tocarAnimacao("dead");
  }

  execute() {
    // Se já iniciou o processo de levantar, aguarda o fim da animação
    if (this.levantando) return;

    // 1. COMANDO DE ANDAR: Toca animação de levantar (getup)
    if (
      this.personagem.inputDown("esquerda") ||
      this.personagem.inputDown("direita")
    ) {
      this.levantando = true;
      const sprite = this.personagem.sprite;

      this.personagem.tocarAnimacao("getup");

      sprite.once("animationcomplete", () => {
        if (this.personagem.maquinaEstados.estadoAtual === this) {
          this.personagem.maquinaEstados.mudarEstado("idle");
        }
      });
      return;
    }

    // 2. OUTROS COMANDOS: Transicionam direto sem tocar "getup"
    if (this.personagem.inputJustDown("atack")) {
      let tipoAtaque = "neutro1";
      if (this.personagem.obterTipoAtaque) {
        tipoAtaque = this.personagem.obterTipoAtaque();
      }
      if (this.personagem.podeUsarAtaque(tipoAtaque)) {
        this.personagem.maquinaEstados.mudarEstado("atack", { tipo: tipoAtaque });
        return;
      }
    }

    if (this.personagem.inputJustDown("special")) {
      const tipoSpecial = this.personagem.obterTipoSpecial
        ? this.personagem.obterTipoSpecial()
        : "neutro";

      if (this.personagem.podeUsarSpecial(tipoSpecial)) {
        this.personagem.maquinaEstados.mudarEstado("special", { tipo: tipoSpecial });
        return;
      }
    }

    if (this.personagem.inputJustDown("cima")) {
      this.personagem.pular();
      return;
    }

    if (this.personagem.inputJustDown("dash") && this.personagem.podeDash) {
      this.personagem.maquinaEstados.mudarEstado("dash");
      return;
    }

    if (this.personagem.inputDown("guard")) {
      this.personagem.maquinaEstados.mudarEstado("guard");
      return;
    }

    if (this.personagem.inputDown("baixo")) {
      this.personagem.maquinaEstados.mudarEstado("crouch");
      return;
    }
  }

  exit() {
    this.levantando = false;
    this.personagem.sprite.off("animationcomplete");
  }
}
