import EstadoBase from "./EstadoBase.js";

export default class EstadoAtack extends EstadoBase {
  enter(dados = {}) {
    const noChao = this.personagem.sprite.body.blocked.down;
    const direcaoOlhar = this.personagem.sprite.flipX ? -1 : 1;
    

    // CONTROLE DO COMBO
    if (!dados?.combo) {
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

   
    // PEGA O GOLPE
    // =========================

    const tipoAtaqueEfetivo = this.personagem.golpes?.[tipoAtaque]
      ? tipoAtaque
      : "neutro1";

    this.golpeAtual = this.personagem.golpes?.[tipoAtaqueEfetivo];
    this.tipoAtaqueAtual = tipoAtaqueEfetivo;

    if (
      !this.golpeAtual ||
      !this.personagem.podeUsarAtaque(tipoAtaqueEfetivo)
    ) {
      this.finalizarAtaque();
      return;
    }

    this.jaAcertou = false;
    this.hitboxCriada = false;
    this.tempoInicio = this.personagem.scene.time.now;
    this.timerFinalizacaoChao = null;
    this.finalizandoPorChao = false;
    this.timerFinalizacaoAcerto = null;
    this.finalizandoPorAcerto = false;
    this.comboBuffer = false;
    

    // COOLDOWN
    // =========================

    this.personagem.iniciarCooldownAtaque(tipoAtaqueEfetivo);

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

  
  }

  execute() {
    const noChao = this.personagem.sprite.body.blocked.down;
    const agora = this.personagem.scene.time.now;
    const body = this.personagem.sprite.body;

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
// PROGRESSÃO DO COMBO
// =========================

if (
  this.comboBuffer &&
  this.golpeAtual?.comboProximo &&
  this.golpeAtual?.comboJanelaInicio !== undefined &&
  this.golpeAtual?.comboJanelaFim !== undefined
) {
  const tempo = agora - this.tempoInicio;

  if (
    tempo >= this.golpeAtual.comboJanelaInicio &&
    tempo <= this.golpeAtual.comboJanelaFim
  ) {
    this.comboBuffer = false;

    this.comboIndex++;

    this.personagem.maquinaEstados.mudarEstado("atack", {
      tipo: this.golpeAtual.comboProximo,
      combo: true,
    });

    return;
  }
}

    // =========================
    // FINALIZAÇÃO POR DURAÇÃO
    // =========================

    if (
      this.golpeAtual?.duracao !== undefined &&
      agora - this.tempoInicio >= this.golpeAtual.duracao
    ) {
      this.finalizarAtaque();
      return;
    }

    // =========================
    // FINALIZAÇÃO AO TOCAR CHÃO
    // =========================

    if (
      this.golpeAtual?.finalizarAoTocarChao &&
      noChao &&
      !this.finalizandoPorChao
    ) {
      this.finalizandoPorChao = true;

      const atraso = this.golpeAtual.atrasoFinalizacaoChao ?? 0;

      this.timerFinalizacaoChao = this.personagem.scene.time.delayedCall(
        atraso,
        () => {
          if (this.personagem.maquinaEstados.estadoAtual === this) {
            this.finalizarAtaque();
          }
        },
      );
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

       if (
         this.golpeAtual.finalizarAoAcertarOponente &&
         !this.finalizandoPorAcerto
       ) {
         this.finalizandoPorAcerto = true;

         const atraso = this.golpeAtual.atrasoFinalizacaoAcerto ?? 0;

         this.timerFinalizacaoAcerto = this.personagem.scene.time.delayedCall(
           atraso,
           () => {
             if (this.personagem.maquinaEstados.estadoAtual === this) {
               this.finalizarAtaque();
             }
           },
         );
       }

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

    if (this.timerFinalizacaoChao) {
      this.timerFinalizacaoChao.remove(false);
      this.timerFinalizacaoChao = null;
    }
    
    this.finalizandoPorChao = false;

    if (this.timerFinalizacaoAcerto) {
      this.timerFinalizacaoAcerto.remove(false);
      this.timerFinalizacaoAcerto = null;
    }

    this.finalizandoPorAcerto = false;
  }
}
