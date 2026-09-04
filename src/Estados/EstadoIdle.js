import EstadoBase from "./EstadoBase.js";

export default class EstadoIdle extends EstadoBase {
  enter() {
    this.personagem.sprite.setVelocityX(0);
    this.personagem.tocarAnimacao("idle");
  }

  execute() {
    // 1. Transição para AGACHADO
    // Nao troca para crouch antes de consumir baixo + ataque/special.
    // Caso as teclas cheguem no mesmo frame, a troca antecipada fazia o
    // JustDown da acao ser perdido no frame seguinte.
    if (
      this.personagem.inputDown("baixo") &&
      !this.personagem.inputJustDown("special") &&
      !this.personagem.inputJustDown("atack")
    ) {
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

    // ⚡ 4. ULTIMATE
    const apertouAtack = this.personagem.inputJustDown("atack") || this.personagem.inputDown("atack");
    const apertouSpecial = this.personagem.inputJustDown("special") || this.personagem.inputDown("special");
    const intencaoUlt = (this.personagem.inputJustDown("atack") || this.personagem.inputJustDown("special")) && apertouAtack && apertouSpecial;

    const podeUsar = typeof this.personagem.podeUsarUlt === "function" 
      ? this.personagem.podeUsarUlt() 
      : true;

    // Só entra aqui se realmente TIVER a intenção E PUDER usar a Ult!
    if (intencaoUlt && podeUsar) {
      this.personagem.maquinaEstados.mudarEstado("ult");
      return;
    }

    // 5. SPECIAL (Se a Ult não executou, tenta o Especial)
    if (this.personagem.inputJustDown("special")) {
      const tipoSpecial = this.personagem.obterTipoSpecial ? this.personagem.obterTipoSpecial() : "neutro";

      if (this.personagem.podeUsarSpecial(tipoSpecial)) {
        this.personagem.maquinaEstados.mudarEstado("special", { tipo: tipoSpecial });
        return;
      }
    }

    // 6. ATAQUE NORMAL (Se a Ult não executou, tenta o Ataque)
    if (this.personagem.inputJustDown("atack")) {
      const tipoAtaque = this.personagem.obterTipoAtaque ? this.personagem.obterTipoAtaque() : "neutro1";

      if (this.personagem.podeUsarAtaque(tipoAtaque)) {
        this.personagem.maquinaEstados.mudarEstado("atack", { tipo: tipoAtaque });
        return;
      }
    }

    // 7. ANDAR
    if (this.personagem.inputDown("esquerda") || this.personagem.inputDown("direita")) {
      this.personagem.maquinaEstados.mudarEstado("walk");
      return;
    }

    // 8. QUEDA DA PLATAFORMA
    if (!this.personagem.sprite.body.blocked.down && !this.personagem.sprite.body.touching.down) {
      this.personagem.maquinaEstados.mudarEstado("jump");
      return;
    }

    // 9. TAUNT E GUARD
    if (this.personagem.inputJustDown("taunt")) {
      this.personagem.maquinaEstados.mudarEstado("taunt");
      return;
    }

    if (this.personagem.inputDown("guard")) {
      this.personagem.maquinaEstados.mudarEstado("guard");
      return;
    }
  }
}
