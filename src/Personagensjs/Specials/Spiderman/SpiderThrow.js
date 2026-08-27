export default class SpiderThrow {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;

    this.deslocamentoAcumuladoX = 0;

    this.hitboxTeia = null;
    this.acertou = false;
    this.overlap = null;

    this.alvoAtual = null;

    // Guardar funções para remoção limpa
    this.fnSiSpecial = null;
    this.fnTeia = null;
    this.fnMiss = null;
    this.fnThrow = null;
    this.fnUpdate = null;
    this.fnMonitorHit = null;
  }

  executar() {
    const sprite = this.personagem.sprite;
    if (!sprite) return;

    this.acertou = false;
    this.alvoAtual = null;

    if (sprite.body) {
      sprite.body.setVelocity(0, 0);
      sprite.body.moves = false;
    }

    // Monitora se o Homem-Aranha mudou de animação (tomou dano/interrupção)
    this.fnMonitorHit = (anim) => {
      const animsDoGolpe = [
        "spy_siSpecial",
        "spy_teia_side",
        "spy_siSpecial_miss",
        "spy_spider_throw",
      ];
      if (!animsDoGolpe.includes(anim.key)) {
        this.cancelarInterrupcao();
      }
    };
    sprite.on("animationstart", this.fnMonitorHit);

    sprite.anims.play("spy_siSpecial", true);

    this.fnSiSpecial = (anim) => {
      if (anim.key === "spy_siSpecial") {
        sprite.off("animationcomplete", this.fnSiSpecial);
        if (this.acertou) return;

        const direcao = sprite.flipX ? -1 : 1;
        const deslocamento = 70 * direcao;
        sprite.setX(sprite.x + deslocamento);
        this.deslocamentoAcumuladoX += deslocamento;

        sprite.anims.play("spy_teia_side", true);
        this.criarHitboxTeia();

        this.fnTeia = (animTeia) => {
          if (animTeia.key === "spy_teia_side") {
            sprite.off("animationcomplete", this.fnTeia);
            this.limparHitbox();

            if (!this.acertou) {
              const recuoMiss = 80 * direcao;
              sprite.setX(sprite.x - recuoMiss);
              this.deslocamentoAcumuladoX -= recuoMiss;

              sprite.anims.play("spy_siSpecial_miss", true);

              this.fnMiss = (animMiss) => {
                if (animMiss.key === "spy_siSpecial_miss") {
                  sprite.off("animationcomplete", this.fnMiss);
                  const ajusteFinal = 10 * direcao;
                  sprite.setX(sprite.x - ajusteFinal);
                  this.deslocamentoAcumuladoX -= ajusteFinal;
                  this.finalizar();
                }
              };
              sprite.on("animationcomplete", this.fnMiss);
            }
          }
        };
        sprite.on("animationcomplete", this.fnTeia);
      }
    };

    sprite.on("animationcomplete", this.fnSiSpecial);
  }

  criarHitboxTeia() {
    const sprite = this.personagem.sprite;
    const direcao = sprite.flipX ? -1 : 1;

    const posY = sprite.y - 35;
    const larguraMaxima = 140; // Largura final desejada
    const altura = 40;
    const offsetOrigemX = 10 * direcao; // Ponto inicial da teia (próximo à mão)

    // Cria a zona inicialmente com largura 1 (evita bugs de escala 0 no Phaser Physics)
    this.hitboxTeia = this.scene.add.zone(
      sprite.x + offsetOrigemX,
      posY,
      1,
      altura
    );
    this.scene.physics.add.existing(this.hitboxTeia);
    this.hitboxTeia.body.setAllowGravity(false);

    const oponentes =
      this.scene.scene.key === "CenaHistoria"
        ? this.personagem === this.scene.boss
          ? [this.scene.jogador1]
          : [this.scene.boss]
        : [this.scene.jogador1, this.scene.jogador2].filter(
            (j) => j && j !== this.personagem
          );

    oponentes.forEach((oponente) => {
      if (!oponente) return;
      this.overlap = this.scene.physics.add.overlap(
        this.hitboxTeia,
        oponente.grupoHurtbox,
        () => this.processarAgarre(oponente)
      );
    });

    // Tween para fazer a hitbox esticar horizontalmente acompanhando o disparo
    this.tweenTeia = this.scene.tweens.addCounter({
      from: 1,
      to: larguraMaxima,
      duration: 180, // Tempo do disparo em ms (ajuste se quiser mais rápido ou devagar)
      onUpdate: (tween) => {
        if (!this.hitboxTeia || !this.hitboxTeia.active || !sprite) return;

        const larguraAtual = tween.getValue();

        // Recalcula o centro da hitbox conforme ela se estica para frente
        const centroX = sprite.x + offsetOrigemX + (larguraAtual / 2) * direcao;

        this.hitboxTeia.setPosition(centroX, posY);
        this.hitboxTeia.setSize(larguraAtual, altura);

        if (this.hitboxTeia.body) {
          this.hitboxTeia.body.setSize(larguraAtual, altura);
          this.hitboxTeia.body.x = centroX - larguraAtual / 2;
          this.hitboxTeia.body.y = posY - altura / 2;
        }
      },
    });
  }

  processarAgarre(alvo) {
    if (this.acertou || !alvo) return;
    this.acertou = true;
    this.alvoAtual = alvo;
    this.limparHitbox();

    // 1. GUARDA AS FUNÇÕES ORIGINAIS DE CHECAGEM DO INIMIGO
    this.podeUsarAtaqueOriginal = alvo.podeUsarAtaque;
    this.podeUsarSpecialOriginal = alvo.podeUsarSpecial;

    // 2. BLOQUEIA QUALQUER TENTATIVA DE ATAQUE/SPECIAL DO INIMIGO
    alvo.podeUsarAtaque = () => false;
    alvo.podeUsarSpecial = () => false;
    alvo.podeAtacar = false;

    // 3. SE O INIMIGO JÁ ESTIVER EM ESTADO DE ATAQUE, FORÇA A FINALIZAÇÃO
    if (alvo.maquinaEstados?.estadoAtual?.finalizarAtaque) {
      alvo.maquinaEstados.estadoAtual.finalizarAtaque();
    } else if (alvo.maquinaEstados?.estadoAtual?.finalizarSpecial) {
      alvo.maquinaEstados.estadoAtual.finalizarSpecial();
    }

    // 4. DESATIVA HURTBOXES E HITBOXES DO INIMIGO
    if (this.alvoAtual.grupoHurtbox) {
      this.alvoAtual.grupoHurtbox.getChildren().forEach((child) => {
        if (child.body) child.body.enable = false;
      });
    }

    if (this.alvoAtual.hitboxAtiva && this.alvoAtual.hitboxAtiva.body) {
      this.alvoAtual.hitboxAtiva.body.enable = false;
    }

    const sprite = this.personagem.sprite;
    const direcao = sprite.flipX ? -1 : 1;

    const recuoThrow = 110 * direcao;
    sprite.setX(sprite.x - recuoThrow);
    this.deslocamentoAcumuladoX -= recuoThrow;

    sprite.anims.play("spy_spider_throw", true);

    if (alvo.sprite && alvo.sprite.body) {
      alvo.sprite.body.setVelocity(0, 0);
      alvo.sprite.body.setAllowGravity(false);
      alvo.sprite.body.moves = false;
    }

    const trajetoriaManual = [
      { x: 300 * direcao, y: -10 },
      { x: 300 * direcao, y: -10 },
      { x: 300 * direcao, y: -10 },
      { x: 268 * direcao, y: -10 },
      { x: 268 * direcao, y: -10 },
      { x: 280 * direcao, y: -10 },
      { x: 285 * direcao, y: -10 },
      { x: 240 * direcao, y: -10 },
      { x: 230 * direcao, y: -10 },
      { x: 140 * direcao, y: -10 },
      { x: 60 * direcao, y: -10 },
      { x: -75 * direcao, y: -10 },
      { x: -105 * direcao, y: -10 },
      { x: -105 * direcao, y: -10 },
      { x: -90 * direcao, y: -10 },
      { x: 40 * direcao, y: -10 },
      { x: 110 * direcao, y: -10 },
      { x: 140 * direcao, y: -10 },
      { x: 100 * direcao, y: -10 },
      { x: 40 * direcao, y: -10 },
      { x: -90 * direcao, y: -10 },
      { x: -120 * direcao, y: -10 },
      { x: -90 * direcao, y: -10 },
      { x: 60 * direcao, y: -10 },
      { x: 140 * direcao, y: -10 },
      { x: 230 * direcao, y: -10 },
      { x: 240 * direcao, y: -10 },
      { x: 270 * direcao, y: -10 },
      { x: -250 * direcao, y: -10 },
      { x: -180 * direcao, y: -10 },
      { x: -180 * direcao, y: -10 },
      { x: -120 * direcao, y: -10 },
    ];

    let jaLancouOponente = false;

    this.fnUpdate = (anim, frame) => {
      if (anim.key !== "spy_spider_throw" || !alvo.sprite) return;

      const index = frame.index - 1;

      if (index < 29 && !jaLancouOponente) {
        const ponto =
          trajetoriaManual[index] ||
          trajetoriaManual[trajetoriaManual.length - 1];
        if (ponto) {
          alvo.sprite.setPosition(sprite.x + ponto.x, sprite.y + ponto.y);
        }
      } else if (index >= 29 && !jaLancouOponente) {
        jaLancouOponente = true;

        // RESTAURA AS PERMISSÕES DO INIMIGO NO MOMENTO DO LANÇAMENTO
        if (this.podeUsarAtaqueOriginal) alvo.podeUsarAtaque = this.podeUsarAtaqueOriginal;
        if (this.podeUsarSpecialOriginal) alvo.podeUsarSpecial = this.podeUsarSpecialOriginal;
        alvo.podeAtacar = true;

        if (alvo.sprite && alvo.sprite.body) {
          alvo.sprite.body.setAllowGravity(true);
          alvo.sprite.body.moves = true;
        }

        if (alvo.grupoHurtbox) {
          alvo.grupoHurtbox.getChildren().forEach((child) => {
            if (child.body) child.body.enable = true;
          });
        }

        const props = this.special?.propriedades || {};
        alvo.receberDano(props.dano || 18, {
          knockbackX: 700 * direcao,
          knockbackY: -350,
          tumbling: true,
        });
      }
    };

    sprite.on("animationupdate", this.fnUpdate);

    this.fnThrow = (anim) => {
      if (anim.key === "spy_spider_throw") {
        const devolucaoIdeal = 40 * direcao;
        sprite.setX(sprite.x + devolucaoIdeal);
        this.deslocamentoAcumuladoX += devolucaoIdeal;

        this.finalizar();
      }
    };

    sprite.on("animationcomplete", this.fnThrow);
  }

  cancelarInterrupcao() {
    this.limparHitbox();
    this.removerListeners();

    const sprite = this.personagem.sprite;
    if (sprite) {
      // Devolve o deslocamento acumulado antes da pancada
      if (this.deslocamentoAcumuladoX !== 0) {
        sprite.setX(sprite.x - this.deslocamentoAcumuladoX);
        this.deslocamentoAcumuladoX = 0;
      }

      if (sprite.body) {
        sprite.body.moves = true;
        sprite.body.setAllowGravity(true);
        // Zera o impulso instantaneamente para evitar o salto/recuo gigante
        sprite.body.setVelocity(0, 0); 
      }
    }

    // Restaura o oponente se ele ficou preso no agarre
    if (this.alvoAtual) {
      if (this.podeUsarAtaqueOriginal) this.alvoAtual.podeUsarAtaque = this.podeUsarAtaqueOriginal;
      if (this.podeUsarSpecialOriginal) this.alvoAtual.podeUsarSpecial = this.podeUsarSpecialOriginal;
      this.alvoAtual.podeAtacar = true;

      if (this.alvoAtual.sprite && this.alvoAtual.sprite.body) {
        this.alvoAtual.sprite.body.setAllowGravity(true);
        this.alvoAtual.sprite.body.moves = true;
      }
    }

    this.alvoAtual = null;
    this.acertou = false;
  }

  removerListeners() {
    const sprite = this.personagem.sprite;
    if (!sprite) return;

    if (this.fnSiSpecial) sprite.off("animationcomplete", this.fnSiSpecial);
    if (this.fnTeia) sprite.off("animationcomplete", this.fnTeia);
    if (this.fnMiss) sprite.off("animationcomplete", this.fnMiss);
    if (this.fnThrow) sprite.off("animationcomplete", this.fnThrow);
    if (this.fnUpdate) sprite.off("animationupdate", this.fnUpdate);
    if (this.fnMonitorHit) sprite.off("animationstart", this.fnMonitorHit);
  }

  finalizar() {
    this.deslocamentoAcumuladoX = 0;
    this.limparHitbox();
    this.removerListeners();

    const sprite = this.personagem.sprite;
    if (sprite && sprite.body) {
      sprite.body.moves = true;
      sprite.body.setAllowGravity(true);
      sprite.body.setVelocity(0, 0);
    }

    if (this.estado && typeof this.estado.finalizarSpecial === "function") {
      this.estado.finalizarSpecial();
    }
  }

  limparHitbox() {
    if (this.tweenTeia) {
      this.tweenTeia.stop();
      this.tweenTeia = null;
    }
    if (this.overlap && this.overlap.active) {
      this.overlap.destroy();
      this.overlap = null;
    }
    if (this.hitboxTeia && this.hitboxTeia.active) {
      this.hitboxTeia.destroy();
      this.hitboxTeia = null;
    }
  }

  atualizar() {}
}