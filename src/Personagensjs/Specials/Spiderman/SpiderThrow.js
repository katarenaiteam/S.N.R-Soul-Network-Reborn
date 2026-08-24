export default class SpiderThrow {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;

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
        sprite.setX(sprite.x + 70 * direcao);

        sprite.anims.play("spy_teia_side", true);
        this.criarHitboxTeia();

        this.fnTeia = (animTeia) => {
          if (animTeia.key === "spy_teia_side") {
            sprite.off("animationcomplete", this.fnTeia);
            this.limparHitbox();

            if (!this.acertou) {
              sprite.setX(sprite.x - 80 * direcao);
              sprite.anims.play("spy_siSpecial_miss", true);

              this.fnMiss = (animMiss) => {
                if (animMiss.key === "spy_siSpecial_miss") {
                  sprite.off("animationcomplete", this.fnMiss);
                  sprite.setX(sprite.x - 10 * direcao);
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

    const posX = sprite.x + 120 * direcao;
    const posY = sprite.y - 35;

    this.hitboxTeia = this.scene.add.zone(posX, posY, 160, 40);
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
  }

  processarAgarre(alvo) {
    if (this.acertou || !alvo) return;
    this.acertou = true;
    this.alvoAtual = alvo;
    this.limparHitbox();

    this.alvoAtual.podeAtacar = false;

    // 1. DESATIVA A COLISÃO DE ATAQUE E CORPO DO INIMIGO
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

    sprite.anims.play("spy_spider_throw", true);

    if (alvo.sprite && alvo.sprite.body) {
      alvo.sprite.body.setVelocity(0, 0);
      alvo.sprite.body.setAllowGravity(false);
      alvo.sprite.body.moves = false;

      if (typeof alvo.forcarEstado === "function") {
        alvo.forcarEstado("preso");
      }
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

      alvo.podeAtacar = false;

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

        if (alvo.sprite && alvo.sprite.body) {
          alvo.sprite.body.setAllowGravity(true);
          alvo.sprite.body.moves = true;
        }

        // 2. REATIVA AS CAIXAS DE FÍSICA PARA O INIMIGO RECEBER DANO/KNOCKBACK
        if (alvo.grupoHurtbox) {
          alvo.grupoHurtbox.getChildren().forEach((child) => {
            if (child.body) child.body.enable = true;
          });
        }
        alvo.podeAtacar = true;

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

        this.finalizar();
      }
    };

    sprite.on("animationcomplete", this.fnThrow);
  }

  cancelarInterrupcao() {
    this.limparHitbox();
    this.removerListeners();

    if (this.alvoAtual && this.alvoAtual.sprite) {
      this.alvoAtual.podeAtacar = true;

      // Restaura a físicas do inimigo caso o Aranha tome hit no meio
      if (this.alvoAtual.grupoHurtbox) {
        this.alvoAtual.grupoHurtbox.getChildren().forEach((child) => {
          if (child.body) child.body.enable = true;
        });
      }

      if (this.alvoAtual.sprite.body) {
        this.alvoAtual.sprite.body.setAllowGravity(true);
        this.alvoAtual.sprite.body.moves = true;
      }
      if (typeof this.alvoAtual.forcarEstado === "function") {
        this.alvoAtual.forcarEstado("idle");
      }
    }

    const sprite = this.personagem.sprite;
    if (sprite && sprite.body) {
      sprite.body.moves = true;
      sprite.body.setAllowGravity(true);
    }

    this.alvoAtual = null;
    this.acertou = false;
  }

  cancelarInterrupcao() {
    this.limparHitbox();
    this.removerListeners();

    // Restaura o oponente se ele ficou preso no ar
    if (this.alvoAtual && this.alvoAtual.sprite) {
      if (this.alvoAtual.sprite.body) {
        this.alvoAtual.sprite.body.setAllowGravity(true);
        this.alvoAtual.sprite.body.moves = true;
      }
      if (typeof this.alvoAtual.forcarEstado === "function") {
        this.alvoAtual.forcarEstado("idle");
      }
    }

    // Restaura a física do Aranha
    const sprite = this.personagem.sprite;
    if (sprite && sprite.body) {
      sprite.body.moves = true;
      sprite.body.setAllowGravity(true);
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