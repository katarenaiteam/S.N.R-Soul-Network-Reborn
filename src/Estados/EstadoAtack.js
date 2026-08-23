import EstadoBase from "./EstadoBase.js";

export default class EstadoAtack extends EstadoBase {
  enter(dados = {}) {
   const noChao = this.personagem.sprite.body.blocked.down;
   const direcaoOlhar = this.personagem.sprite.flipX ? -1 : 1;

   // reseta o combro pra 1, se o ataque vier sem dados(cima,baxo) ou se tiver combo false ! -> se nao for
   if (!dados?.combo) {
      this.comboIndex = 1;
    }
     //guarda o tipo de ataque
     let tipoAtaque = dados?.tipo;

     // Se for como true neutro+ o numero do combo
     if (dados?.combo) {
      tipoAtaque = `neutro${this.comboIndex}`;
     }
 
     // dita as constantes de imput direcionais
     if (!tipoAtaque) {
      const apertandoLado =
        this.personagem.inputDown("esquerda") ||
        this.personagem.inputDown("direita");

      const apertandoCima = this.personagem.inputDown("cima");
      const apertandoBaixo = this.personagem.inputDown("baixo");
     // cria as variaçoes de ataque que uso na tabela de golpes
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

     //checagem de ataque na tabela de golpes do personagem, ?>verdadeiro mantem tipoAtaque / :>falso manda executar neutro1
     const tipoAtaqueEfetivo = this.personagem.golpes?.[tipoAtaque]
      ? tipoAtaque
      : "neutro1";
   
     // Pega o objeto com todos os dados do golpe de dentro da tabela do personagem e guarda dentro da classe do Estado de Ataque, 
     // depois guarda o ataqueAtual como ataque efetivo, que vai ser usado
     this.golpeAtual = this.personagem.golpes?.[tipoAtaqueEfetivo];
     this.tipoAtaqueAtual = tipoAtaqueEfetivo;

     //impede de atacar se o boneco nao puder
     if (
      !this.golpeAtual ||
      !this.personagem.podeUsarAtaque(tipoAtaqueEfetivo)
     ) {
      this.finalizarAtaque();
      return;
      }

     // verifica se já foi acertado o inimigo
     this.jaAcertou = false;
      // verifica se já foi criada a hitbox
     this.hitboxCriada = false;
     //define o tempo para imediato no relogio interno do phaser
     this.tempoInicio = this.personagem.scene.time.now;
     //trava que verifica instancia a finalizaçao no chao
     this.timerFinalizacaoChao = null;
     this.finalizandoPorChao = false;
     this.timerFinalizacaoAcerto = null;
     this.finalizandoPorAcerto = false;
     this.comboBuffer = false;
    
     // Zera o buffer apenas na entrada do estado
     this.inputBuffer = null;

     // COOLDOWN
     this.personagem.iniciarCooldownAtaque(tipoAtaqueEfetivo);

     // GRAVIDADE
     if (this.golpeAtual?.propriedades?.anularGravidade) {
      this.anulouGravidade = true;
      this.personagem.sprite.body.setAllowGravity(false);
      this.personagem.sprite.body.setVelocityY(0);
     } else {
      this.anulouGravidade = false;
     }

    // ANIMAÇÃO
    const animChave = this.golpeAtual?.animacao || "mado_atack";

    if (this.personagem.scene.anims.exists(animChave)) {
      this.personagem.tocarAnimacao("atack");
      this.personagem.sprite.anims.play(animChave, true);
    } else {
      console.warn(`Animação ${animChave} não existe!`);
      this.personagem.tocarAnimacao("atack");
    }

    // HITBOX
    this.personagem.sprite.on("animationupdate", this.atualizarHitbox, this);

    // IMPULSO
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
    const tempoDecorrido = agora - this.tempoInicio;

    // =========================
    // INPUT DO COMBO DE ATAQUE
    // =========================
    if (
      this.golpeAtual?.comboProximo &&
      this.personagem.inputJustDown("atack")
    ) {
      this.comboBuffer = true;
    }

    // =========================
    // BUFFER DE OUTROS INPUTS (PULO)
    // =========================
    if (this.golpeAtual?.bufferInputs) {
      const inicio = this.golpeAtual.bufferJanelaInicio ?? 0;
      const fim = this.golpeAtual.bufferJanelaFim ?? this.golpeAtual.duracao;

      // Se estamos dentro da janela do buffer
      if (tempoDecorrido >= inicio && tempoDecorrido <= fim) {
        // Se a tecla de pulo for apertada OU mantida pressionada
        if (
          this.personagem.inputJustDown("cima") ||
          this.personagem.inputDown("cima")
        ) {
          this.inputBuffer = "pulo";
        }
      }
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
      if (
        tempoDecorrido >= this.golpeAtual.comboJanelaInicio &&
        tempoDecorrido <= this.golpeAtual.comboJanelaFim
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
      tempoDecorrido >= this.golpeAtual.duracao
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
      this.golpeAtual.altura
    );

    if (this.personagem.scene.camHUD) {
      this.personagem.scene.camHUD.ignore(this.hitboxAtual);
    }

    const cena = this.personagem.scene;
    let alvos = [];

    // MODO HISTÓRIA: P1 e P2 batem só no Boss. Boss bate nos dois.
    if (cena.scene.key === "CenaHistoria") {
      const souPlayer = (this.personagem === cena.jogador1 || this.personagem === cena.jogador2);
      alvos = souPlayer 
        ? [cena.boss] 
        : [cena.jogador1].filter(Boolean);
    } 
    // DEMAIS MODOS (Versus / Luta normal): Ataca qualquer outro personagem da cena
    else {
      alvos = [cena.jogador1, cena.jogador2, cena.jogador3, cena.jogador4]
        ? [cena.jogador1, cena.jogador2, cena.jogador3, cena.jogador4].filter(p => p && p !== this.personagem)
        : [];
    }

    alvos.forEach((alvo) => {
      if (!alvo || !alvo.grupoHurtbox) return;

      const colisor = cena.physics.add.overlap(
        this.hitboxAtual,
        alvo.grupoHurtbox,
        () => {
          if (this.jaAcertou) return;

          this.jaAcertou = true;
          const valorDano = this.golpeAtual.propriedades?.dano || 0;
          const origem = {
            direcao: this.personagem.sprite.flipX ? -1 : 1,
          };

          alvo.receberDano(valorDano, this.golpeAtual.propriedades, origem);

          if (this.golpeAtual.finalizarAoAcertarOponente && !this.finalizandoPorAcerto) {
            this.finalizandoPorAcerto = true;
            const atraso = this.golpeAtual.atrasoFinalizacaoAcerto ?? 0;

            this.timerFinalizacaoAcerto = cena.time.delayedCall(atraso, () => {
              if (this.personagem.maquinaEstados.estadoAtual === this) {
                this.finalizarAtaque();
              }
            });
          }
        }
      );

      this.colisorOverlap = colisor;
    });
  }

  // =========================
  // FINALIZA ATAQUE
  // =========================
  finalizarAtaque() {
    // Se registrou o pulo durante o ataque, executa o pulo ao sair do ataque
    if (this.inputBuffer === "pulo") {
      this.inputBuffer = null;
      this.personagem.pular();
      return;
    }

    if (this.personagem.sprite.body.blocked.down) {
      const segurandoBaixo = this.personagem.inputDown("baixo");

      if (segurandoBaixo) {
        // Passa a flag para o EstadoCrouch ir direto pro crouch_idle
        this.personagem.maquinaEstados.mudarEstado("crouch", { vindoDeAtaque: true });
      } else {
        this.personagem.maquinaEstados.mudarEstado("idle");
      }
    } else {
      this.personagem.maquinaEstados.mudarEstado("jump");
    }
  }

  exit() {
    // Limpa o evento de colisão da física do Phaser
    if (this.colisorOverlap) {
      this.personagem.scene.physics.world.removeCollider(this.colisorOverlap);
      this.colisorOverlap = null;
    }

    if (this.hitboxAtual) {
      this.hitboxAtual.destroy();
      this.hitboxAtual = null;
    }

    if (this.anulouGravidade) {
      this.personagem.sprite.body.setAllowGravity(true);
      this.anulouGravidade = false;
    }

    this.personagem.sprite.off("animationupdate", this.atualizarHitbox, this);

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