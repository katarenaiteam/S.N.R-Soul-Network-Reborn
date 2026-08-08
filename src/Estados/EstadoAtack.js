import EstadoBase from "./EstadoBase.js";

export default class EstadoAtack extends EstadoBase {
  enter(dados = {}) {
    const noChao = this.personagem.sprite.body.blocked.down;
    const direcaoOlhar = this.personagem.sprite.flipX ? -1 : 1;

    // =========================
    // CONTROLE DO COMBO
    // =========================

    if (!this.comboIndex) {
      this.comboIndex = 1;
    }

    let tipoAtaque = dados?.tipo;

    // Se estamos continuando um combo
    if (dados?.combo) {
      tipoAtaque = `neutro${this.comboIndex}`;
    }

    // Ataque normal
    if (!tipoAtaque) {
      const apertandoLado =
        this.personagem.inputDown("esquerda") ||
        this.personagem.inputDown("direita");

      const apertandoCima = this.personagem.inputDown("cima");

      const apertandoBaixo = this.personagem.inputDown("baixo");

      if (noChao) {
        if (apertandoCima) tipoAtaque = "cima";
        else if (apertandoBaixo) tipoAtaque = "agachado";
        else if (apertandoLado) tipoAtaque = "side";
        else tipoAtaque = "neutro1";
      } else {
        if (apertandoCima) tipoAtaque = "air_cima";
        else if (apertandoBaixo) tipoAtaque = "air_agachado";
        else if (apertandoLado) tipoAtaque = "air_side";
        else tipoAtaque = "air_neutro";
      }
    }

    // =========================
    // PEGA O GOLPE
    // =========================

    this.golpeAtual =
      this.personagem.golpes?.[tipoAtaque] ||
      this.personagem.golpes?.["neutro1"];

    this.tipoAtaqueAtual = tipoAtaque;

    this.jaAcertou = false;
    this.hitboxCriada = false;

    // =========================
    // COOLDOWN
    // =========================

    this.personagem.iniciarCooldownAtaque(tipoAtaque);

    // =========================
    // GRAVIDADE
    // =========================

    if (this.golpeAtual?.propriedades?.anularGravidade) {
      this.anulouGravidade = true;

      this.personagem.sprite.body.setAllowGravity(false);
      this.personagem.sprite.body.setVelocityY(0);
    } else {
      this.anulouGravidade = false;
    }

    // =========================
    // ANIMAÇÃO
    // =========================

    const animChave = this.golpeAtual?.animacao || "mado_atack";

    if (this.personagem.scene.anims.exists(animChave)) {
      this.personagem.tocarAnimacao("atack");

      this.personagem.sprite.anims.play(animChave, true);
    } else {
      console.warn(`Animação ${animChave} não existe!`);

      this.personagem.tocarAnimacao("atack");
    }

    // =========================
    // HITBOX
    // =========================

    this.personagem.sprite.on("animationupdate", this.atualizarHitbox, this);

    // =========================
    // IMPULSO
    // =========================

    if (this.golpeAtual?.propriedades?.impulsoX) {
      this.personagem.sprite.setVelocityX(
        direcaoOlhar * this.golpeAtual.propriedades.impulsoX,
      );
    } else if (noChao) {
      this.personagem.sprite.setVelocityX(0);
    }

    if (this.golpeAtual?.propriedades?.impulsoY) {
      this.personagem.sprite.setVelocityY(
        this.golpeAtual.propriedades.impulsoY,
      );
    }

    // =========================
    // FIM DA ANIMAÇÃO
    // =========================

    this.personagem.sprite.once("animationcomplete", () => {
      // Se o jogador apertou ataque
      // durante a janela, continua.
      if (this.comboBuffer) {
        this.comboBuffer = false;

        if (this.golpeAtual.comboProximo) {
          this.comboIndex++;

          this.personagem.maquinaEstados.mudarEstado("atack", {
            tipo: this.golpeAtual.comboProximo,
            combo: true,
          });

          return;
        }
      }

      this.comboIndex = 1;

      this.finalizarAtaque();
    });
  }

  // =========================
  // UPDATE
  // =========================

  execute() {
    const noChao = this.personagem.sprite.body.blocked.down;

    // =========================
    // INPUT DO COMBO
    // =========================

    if (
      this.golpeAtual?.comboProximo &&
      this.personagem.inputJustDown("atack")
    ) {
      this.comboBuffer = true;
    }

    // =========================
    // MOVIMENTO NO AR
    // =========================

    if (
      !noChao &&
      this.tipoAtaqueAtual !== "air_side" &&
      !this.golpeAtual?.propriedades?.impulsoX
    ) {
      const vel = this.personagem.velocidade;

      if (this.personagem.inputDown("esquerda")) {
        this.personagem.sprite.setVelocityX(-vel);
      } else if (this.personagem.inputDown("direita")) {
        this.personagem.sprite.setVelocityX(vel);
      }
    }
  }

  // =========================
  // HITBOX
  // =========================

  atualizarHitbox(anim, frame) {
    if (anim.key !== this.golpeAtual.animacao) return;

    if (this.hitboxCriada) return;

    if (frame.index !== this.golpeAtual.frameHitbox) return;

    this.hitboxCriada = true;

    this.hitboxAtual = this.personagem.criarHitboxAtaque(
      this.golpeAtual.offsetX,
      this.golpeAtual.offsetY,
      this.golpeAtual.largura,
      this.golpeAtual.altura,
    );

    const oponente =
      this.personagem.scene.jogador1 === this.personagem
        ? this.personagem.scene.jogador2
        : this.personagem.scene.jogador1;

    this.personagem.scene.physics.add.overlap(
      this.hitboxAtual,
      oponente.grupoHurtbox,
      () => {
        if (this.jaAcertou) return;

        this.jaAcertou = true;

        const valorDano = this.golpeAtual.propriedades.dano || 0;

        const origem = {
          x: this.hitboxAtual.x,
          y: this.hitboxAtual.y,
        };

        oponente.receberDano(valorDano, this.golpeAtual.propriedades, origem);
      },
    );
  }

  // =========================
  // FINALIZA
  // =========================

  finalizarAtaque() {
    if (this.personagem.sprite.body.blocked.down) {
      this.personagem.maquinaEstados.mudarEstado("idle");
    } else {
      this.personagem.maquinaEstados.mudarEstado("jump");
    }
  }

  // =========================
  // SAÍDA
  // =========================

  exit() {
    if (this.hitboxAtual && this.hitboxAtual.active) {
      this.hitboxAtual.destroy();
    }

    if (this.anulouGravidade) {
      this.personagem.sprite.body.setAllowGravity(true);

      this.anulouGravidade = false;
    }

    this.personagem.sprite.off("animationupdate", this.atualizarHitbox, this);

    this.hitboxAtual = null;
    this.hitboxCriada = false;
  }
}
