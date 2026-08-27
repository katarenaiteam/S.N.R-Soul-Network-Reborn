import EstadoBase from "./EstadoBase.js";

export default class EstadoCrouch extends EstadoBase {
  enter(dados = {}) {
    this.personagem.sprite.setVelocityX(0);
    this.saindo = false;

    // Se veio do ataque agachado, vai direto pro último frame (agachado)
    if (dados?.vindoDeAtaque) {
      this.personagem.tocarAnimacao("crouch");
      const animAtual = this.personagem.sprite.anims.currentAnim;
      if (animAtual) {
        this.personagem.sprite.anims.setCurrentFrame(animAtual.getLastFrame());
      }
    } else {
      // Veio de pé: toca a animação de abaixar normal
      this.personagem.tocarAnimacao("crouch");
    }

    const chaveCrouch2 = `${this.personagem.prefixoAnim}crouch2`;
    if (this.personagem.scene.anims.exists(chaveCrouch2)) {
      this.personagem.sprite.once("animationcomplete", () => {
        if (
          this.personagem.maquinaEstados.estadoAtual === this &&
          this.personagem.inputDown("baixo")
        ) {
          this.personagem.tocarAnimacao("crouch2");
        }
      });
    }
  }

  execute() {
    if (this.personagem.inputDown("esquerda")) {
      this.personagem.sprite.setFlipX(true);
    } else if (this.personagem.inputDown("direita")) {
      this.personagem.sprite.setFlipX(false);
    }

    // SUAS CHECAGENS ORIGINAIS DE ATAQUE (SEM ALTERAÇÕES)
    if (this.personagem.inputJustDown("atack")) {
      let tipoAtaque = "agachado";

      if (this.personagem.obterTipoAtaque) {
        tipoAtaque = this.personagem.obterTipoAtaque();
      }

      if (this.personagem.podeUsarAtaque(tipoAtaque)) {
        this.personagem.maquinaEstados.mudarEstado("atack", { tipo: tipoAtaque });
        return;
      }
    }

    if (this.personagem.inputJustDown("special")) {
      const tipoSpecial = this.personagem.obterTipoSpecial ? this.personagem.obterTipoSpecial() : "neutro";

      if (this.personagem.podeUsarSpecial(tipoSpecial)) {
        this.personagem.maquinaEstados.mudarEstado("special");
        return;
      }
    }

    if (this.personagem.inputJustDown("dash") && this.personagem.podeDash) {
      this.personagem.maquinaEstados.mudarEstado("dash");
      return;
    }

    if (this.personagem.inputJustDown("cima")) {
      this.personagem.pular();
      return;
    }

    if (this.personagem.inputDown("guard")) {
      this.personagem.maquinaEstados.mudarEstado("guard");
      return;
    }

    if (
      !this.personagem.sprite.body.blocked.down &&
      !this.personagem.sprite.body.touching.down
    ) {
      this.personagem.maquinaEstados.mudarEstado("jump");
      return;
    }

    //taunt <3
    if (this.personagem.inputJustDown("taunt")) {
    this.personagem.maquinaEstados.mudarEstado("taunt");
    return;
    }

    // LÓGICA DE LEVANTAR (APENAS QUANDO SOLTA BAIXO E NÃO APERTA MAIS NADA)
    if (!this.personagem.inputDown("baixo")) {
      if (!this.saindo) {
        this.saindo = true;
        const sprite = this.personagem.sprite;

        this.personagem.tocarAnimacao("crouch3");

        sprite.once("animationcomplete", () => {
          if (
            this.personagem.maquinaEstados.estadoAtual === this &&
            !this.personagem.inputDown("baixo")
          ) {
            this.personagem.maquinaEstados.mudarEstado("idle");
          }
        });
      }
    } else {
      // Se voltou a apertar baixo enquanto levantava
      if (this.saindo) {
        this.saindo = false;
        this.personagem.sprite.off("animationcomplete");
        this.personagem.tocarAnimacao("crouch");
        const animAtual = this.personagem.sprite.anims.currentAnim;
        if (animAtual) {
          this.personagem.sprite.anims.setCurrentFrame(animAtual.getLastFrame());
        }
      }
    }
  }

  exit() {
    this.saindo = false;
    this.personagem.sprite.off("animationcomplete");
  }
}