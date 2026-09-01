import EstadoBase from "./EstadoBase.js";

export default class EstadoAtack extends EstadoBase {
  enter(dados = {}) {
   const noChao = this.personagem.sprite.body.blocked.down;
   const direcaoOlhar = this.personagem.sprite.flipX ? -1 : 1;

   this.intentCancel = false;
   this.intentCancelAgachar = false;

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
 
     //diz qual ataque usar a depender da direÃ§ao
    if (!tipoAtaque) {
     tipoAtaque = this.personagem.obterTipoAtaque();
     }

     //checagem de ataque na tabela de golpes do personagem, ?>verdadeiro mantem tipoAtaque / :>falso manda executar neutro1
     const tipoAtaqueEfetivo = tipoAtaque;
   
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

     // verifica se jÃ¡ foi acertado o inimigo
     this.jaAcertou = false;
      // verifica se jÃ¡ foi criada a hitbox
     this.hitboxCriada = false;
     //define o tempo para imediato no relogio interno do phaser
     this.tempoInicio = this.personagem.scene.time.now;
     //trava que verifica instancia a finalizaÃ§ao no chao
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

    // ANIMAÃ‡ÃƒO
    const animChave = this.golpeAtual?.animacao || "mado_atack";

    if (this.personagem.scene.anims.exists(animChave)) {
      this.personagem.sprite.anims.play(animChave, true);
      const nomeConfigAnimacao = animChave.startsWith(this.personagem.prefixoAnim)
        ? animChave.slice(this.personagem.prefixoAnim.length)
        : animChave;
      this.personagem.aplicarConfiguracao(nomeConfigAnimacao);
    } else {
      console.warn(`AnimaÃ§Ã£o ${animChave} nÃ£o existe!`);
      const animacaoGenerica = `${this.personagem.prefixoAnim}atack`;
      if (this.personagem.scene.anims.exists(animacaoGenerica)) {
        this.personagem.tocarAnimacao("atack");
      } else {
        this.personagem.tocarAnimacao("idle");
      }
    }

    // HITBOX
    this.personagem.sprite.on("animationupdate", this.atualizarHitbox, this);

    // IMPULSO
     this.direcaoMovimento = direcaoOlhar;

      this.movimentoAtaqueXAtivo = false;
      this.movimentoAtaqueYAtivo = false;

       if (
        noChao &&
         !this.golpeAtual?.movimento?.x
         ) { this.personagem.sprite.setVelocityX(0);
          }
         }

  execute() {
    const noChao = this.personagem.sprite.body.blocked.down;
    const agora = this.personagem.scene.time.now;
    const tempoDecorrido = agora - this.tempoInicio;

    this.atualizarMovimentoAtaque(tempoDecorrido);


   // CANCELAMENTO INSTANTÃ‚NEO PÃ“S-HIT
    // ==========================================
    if (this.golpeAtual?.cancelavel) {
      if (noChao && this.personagem.inputJustDown("baixo")) {
        this.intentCancelAgachar = true;
      }

      // Regra: Se pressionar qualquer botÃ£o de cancelamento, salva a intenÃ§Ã£o
      if (
        (this.personagem.inputJustDown("dash") && this.personagem.podeDash && this.personagem.dashs < this.personagem.maxDash) ||
        (this.personagem.inputJustDown("cima") && this.personagem.pulos < this.personagem.maxPulos) ||
        this.personagem.inputJustDown("special")
      ) {
        this.intentCancel = true;
      }

      // Assim que o acerto acontecer (jaAcertou == true), executa o cancelamento na hora
      if (this.jaAcertou) {
        if (
          noChao &&
          (
            this.personagem.inputJustDown("baixo") ||
            (this.intentCancelAgachar && this.personagem.inputDown("baixo"))
          )
        ) {
          this.personagem.maquinaEstados.mudarEstado("crouch", {
            vindoDeAtaque: true,
          });
          return;
        }

        if (
          this.personagem.inputJustDown("dash") ||
          (this.intentCancel && this.personagem.inputDown("dash"))
        ) {
          if (this.personagem.podeDash && this.personagem.dashs < this.personagem.maxDash) {
            this.personagem.maquinaEstados.mudarEstado("dash");
            return;
          }
        }
        
        if (
          this.personagem.inputJustDown("cima") ||
          (this.intentCancel && this.personagem.inputDown("cima"))
        ) {
          if (this.personagem.pulos < this.personagem.maxPulos) {
            this.personagem.pular();
            return;
          }
        }

        if (
          this.personagem.inputJustDown("special") ||
          (this.intentCancel && this.personagem.inputDown("special"))
        ) {
          this.personagem.maquinaEstados.mudarEstado("special");
          return;
        }
      }
    }
    // ==========================================
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
    // PROGRESSÃƒO DO COMBO
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
    // FINALIZAÃ‡ÃƒO POR DURAÃ‡ÃƒO
    // =========================
    if (
      this.golpeAtual?.duracao !== undefined &&
      tempoDecorrido >= this.golpeAtual.duracao
    ) {
      this.finalizarAtaque();
      return;
    }

    // =========================
    // FINALIZAÃ‡ÃƒO AO TOCAR CHÃƒO
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

  }


   atualizarMovimentoAtaque(tempoDecorrido) {
  const movimento =
    this.golpeAtual?.movimento;

  const body =
    this.personagem.sprite.body;

  // Por padrÃ£o nenhum eixo estÃ¡ sendo
  // controlado pelo movimento do golpe.
  this.movimentoAtaqueXAtivo = false;
  this.movimentoAtaqueYAtivo = false;

  if (!movimento || !body) {
    return;
  }

  const inicio =
    movimento.inicio ?? 0;

  const fim =
    movimento.fim ??
    this.golpeAtual.duracao ??
    inicio;

  // Ainda nÃ£o comeÃ§ou ou jÃ¡ terminou.
  if (
    tempoDecorrido < inicio ||
    tempoDecorrido > fim
  ) {
    return;
  }

  const duracao =
    Math.max(1, fim - inicio);

  let t =
    (tempoDecorrido - inicio) /
    duracao;

  t = Phaser.Math.Clamp(
    t,
    0,
    1
  );

  // -------------------------
  // X
  // -------------------------

  if (movimento.x) {
    const curvaX =
      movimento.x.curva ??
      movimento.curva ??
      "linear";

    const progressoX =
      this.calcularCurvaMovimento(
        t,
        curvaX
      );

    const velocidadeInicialX =
      movimento.x.de ?? 0;

    const velocidadeFinalX =
      movimento.x.para ??
      velocidadeInicialX;

    const velocidadeX =
      Phaser.Math.Linear(
        velocidadeInicialX,
        velocidadeFinalX,
        progressoX
      );

    body.setVelocityX(
      this.direcaoMovimento *
      velocidadeX
    );

    this.movimentoAtaqueXAtivo = true;
  }

  // -------------------------
  // Y
  // -------------------------

  if (movimento.y) {
    const curvaY =
      movimento.y.curva ??
      movimento.curva ??
      "linear";

    const progressoY =
      this.calcularCurvaMovimento(
        t,
        curvaY
      );

    const velocidadeInicialY =
      movimento.y.de ?? 0;

    const velocidadeFinalY =
      movimento.y.para ??
      velocidadeInicialY;

    const velocidadeY =
      Phaser.Math.Linear(
        velocidadeInicialY,
        velocidadeFinalY,
        progressoY
      );

    body.setVelocityY(
      velocidadeY
    );

    this.movimentoAtaqueYAtivo = true;
  }
}

 calcularCurvaMovimento(t, curva) {
  switch (curva) {

    // ComeÃ§a devagar e acelera
    case "easeIn":
      return t * t;

    // Muda bastante no comeÃ§o
    // e suaviza perto do final
    case "easeOut":
      return 1 - Math.pow(1 - t, 2);

    // Suave no comeÃ§o e no final
    case "easeInOut":
      return t * t * (3 - 2 * t);

    // MudanÃ§a constante
    case "linear":
    default:
      return t;
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

    // ðŸ”Š SOM DE VENTO (No ar, quando o ataque Ã© gerado)
    const somVento = this.golpeAtual.somVento || this.personagem.sons?.wind;
    if (somVento) {
      this.personagem.tocarSomSorteado(somVento, { volume: 0.1 });
    }

    this.hitboxAtual = this.personagem.criarHitboxAtaque(
      this.golpeAtual.offsetX,
      this.golpeAtual.offsetY,
      this.golpeAtual.largura,
      this.golpeAtual.altura
    );
    // VFX opcional criado junto da hitbox de ataques normais.
    // Specials usam EstadoSpecial e nÃ£o passam por este bloco.
    const configVFXAtaque = this.personagem.vfxAtaqueNormal;
    const configDesteAtaque = configVFXAtaque?.porAtaque?.[this.tipoAtaqueAtual];
    if (configDesteAtaque) {
      const direcao = this.personagem.sprite.flipX ? -1 : 1;
      const quantidade = configDesteAtaque.quantidade ?? 1;
      const formacao =
        configDesteAtaque.formacao ??
        configVFXAtaque.formacoes?.[quantidade] ??
        [{ x: 0, y: 0, distancia: 0, escala: 1, angulo: 0 }];
      const duracao = configDesteAtaque.duracao ?? configVFXAtaque.duracao ?? 300;
      const movimentoX =
        (configDesteAtaque.movimentoX ?? configVFXAtaque.distancia ?? 0) * direcao;
      const movimentoY = configDesteAtaque.movimentoY ?? 0;
      const tamanhoVetor = Math.hypot(movimentoX, movimentoY) || 1;
      const fatorCompensacao =
        configDesteAtaque.fatorCompensacaoMovimento ?? 1;
      const compensacaoX = configDesteAtaque.compensarMovimento
        ? this.personagem.sprite.body.velocity.x * (duracao / 1000) * fatorCompensacao
        : 0;
      const compensacaoY = configDesteAtaque.compensarMovimento
        ? this.personagem.sprite.body.velocity.y * (duracao / 1000) * fatorCompensacao
        : 0;

      for (let indice = 0; indice < quantidade; indice += 1) {
        const ponto = formacao[indice] ?? formacao[formacao.length - 1];
        const efeito = this.personagem.vfx?.tocar(configDesteAtaque.efeito, {
          offsetX:
            this.golpeAtual.offsetX +
            (configVFXAtaque.offsetX ?? 0) +
            (configDesteAtaque.offsetX ?? 0) +
            ponto.x,
          offsetY:
            this.golpeAtual.offsetY +
            (configVFXAtaque.offsetY ?? 0) +
            (configDesteAtaque.offsetY ?? 0) +
            ponto.y,
        });

        if (efeito) {
          efeito.setScale(efeito.scaleX * ponto.escala);
          efeito.setAngle(ponto.angulo * direcao);
          this.personagem.scene.tweens.add({
            targets: efeito,
            x:
              efeito.x + movimentoX +
              (movimentoX / tamanhoVetor) * ponto.distancia +
              compensacaoX,
            y:
              efeito.y + movimentoY +
              (movimentoY / tamanhoVetor) * ponto.distancia +
              ponto.y * 0.25 + compensacaoY,
            duration: duracao,
            ease: "Quad.easeOut",
          });
        }
      }
    }
    if (this.personagem.scene.camHUD) {
      this.personagem.scene.camHUD.ignore(this.hitboxAtual);
    }

    const cena = this.personagem.scene;
    let alvos = [];

    // MODO HISTÃ“RIA: P1 e P2 batem sÃ³ no Boss. Boss bate nos dois.
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
        (hitbox, hurtboxAtingida) => {
          if (this.jaAcertou) return;

          this.jaAcertou = true;

          // ðŸ”Š SOM DE IMPACTO (Apenas se atingir um alvo)
          const tipoImpacto = this.golpeAtual.tipoSomImpacto || "light";
          const somImpacto = this.golpeAtual.somImpacto || this.personagem.sons?.[tipoImpacto];
          if (somImpacto) {
            this.personagem.tocarSomSorteado(somImpacto, { volume: 0.15 });
          }

          const valorDano = this.golpeAtual.propriedades?.dano || 0;
          const origem = {
            direcao: this.personagem.sprite.flipX ? -1 : 1,
          };

          // VFX acionar
           this.personagem.vfx?.tocarListaImpacto(
           this.golpeAtual.vfxAcerto,
           alvo,
           hitbox
           );

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
    // Limpa o evento de colisÃ£o da fÃ­sica do Phaser
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

