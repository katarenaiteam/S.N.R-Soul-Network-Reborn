import EstadoBase from "./EstadoBase.js";

export default class EstadoAtack extends EstadoBase {
  enter(dados = {}) {
    const noChao = this.personagem.sprite.body.blocked.down;
    const teclas = this.personagem.teclas;
    const direcaoOlhar = this.personagem.sprite.flipX ? -1 : 1;

    // 1. Identifica a direção do ataque
    let tipoAtaque = dados?.tipo;

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
        else tipoAtaque = "neutro";
      } else {
        if (apertandoCima) tipoAtaque = "air_cima";
        else if (apertandoBaixo) tipoAtaque = "air_agachado";
        else if (apertandoLado) tipoAtaque = "air_side";
        else tipoAtaque = "air_neutro";
      }
    }

    if (!this.personagem.podeUsarAtaque(tipoAtaque)) {
      // simplesmente cancela o ataque
      this.personagem.maquinaEstados.mudarEstado(
        this.personagem.sprite.body.blocked.down ? "idle" : "jump",
      );

      return;
    }

    // Salva o tipo do ataque atual
    this.tipoAtaqueAtual = tipoAtaque;
    //cooldown
    this.personagem.iniciarCooldownAtaque(tipoAtaque);

    // 2. Resgata dados do golpe
    this.golpeAtual =
      this.personagem.golpes?.[tipoAtaque] ||
      this.personagem.golpes?.["neutro"];
    this.jaAcertou = false;

    // 3. Anula a gravidade se o golpe pedir (ex: air_side)
    if (this.golpeAtual?.propriedades?.anularGravidade) {
      this.anulouGravidade = true;
      this.personagem.sprite.body.setAllowGravity(false);
      this.personagem.sprite.body.setVelocityY(0);
    } else {
      this.anulouGravidade = false;
    }

    // 4. Toca a Animação
    const animChave = this.golpeAtual?.animacao || "mado_atack";
    if (this.personagem.scene.anims.exists(animChave)) {
      this.personagem.tocarAnimacao("atack");
      this.personagem.sprite.anims.play(animChave, true);
    } else {
      console.warn(`Animação ${animChave} não existe! Usando fallback.`);
      this.personagem.tocarAnimacao("atack");
    }

    this.hitboxCriada = false;

    this.personagem.sprite.on("animationupdate", this.atualizarHitbox, this);

    // 5. Aplica Impulsos Iniciais
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

    this.personagem.sprite.once("animationcomplete", () => {
      this.finalizarAtaque();
    });
  }

  update() {
    const noChao = this.personagem.sprite.body.blocked.down;

    // Se estiver NO AR e NÃO FOR o air_side (nem golpe com impulso X fixo)
    if (
      !noChao &&
      this.tipoAtaqueAtual !== "air_side" &&
      !this.golpeAtual?.propriedades?.impulsoX
    ) {
      const vel = this.personagem.velocidade;

      const movEsquerda = this.personagem.inputDown("esquerda");
      const movDireita = this.personagem.inputDown("direita");

      if (movEsquerda) {
        this.personagem.sprite.setVelocityX(-vel);
      } else if (movDireita) {
        this.personagem.sprite.setVelocityX(vel);
      }
    }
  }

  atualizarHitbox(anim, frame) {
    if (anim.key !== this.golpeAtual.animacao) return;

    if (this.hitboxCriada) return;

    if (frame.index !== this.golpeAtual.frameHitbox) return;

    this.hitboxCriada = true;

    console.log("CRIANDO HITBOX");

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

  finalizarAtaque() {
    if (this.personagem.sprite.body.blocked.down) {
      this.personagem.maquinaEstados.mudarEstado("idle");
    } else {
      this.personagem.maquinaEstados.mudarEstado("jump");
    }
  }

  exit() {
    if (this.hitboxAtual && this.hitboxAtual.active) {
      this.hitboxAtual.destroy();
    }

    if (this.anulouGravidade) {
      this.personagem.sprite.body.setAllowGravity(true);
      this.anulouGravidade = false;
    }

    this.personagem.sprite.off("animationupdate", this.atualizarHitbox, this);
  }
}
