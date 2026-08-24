export default class SpiderThrow {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;

    this.hitboxTeia = null;
    this.acertou = false;
    this.overlap = null;
  }

  executar() {
    const sprite = this.personagem.sprite;
    if (!sprite) return;

    this.acertou = false;

    if (sprite.body) {
      sprite.body.setVelocity(0, 0);
      sprite.body.moves = false;
    }

    sprite.anims.play("spy_siSpecial", true);

    const aoConcluirSiSpecial = (anim) => {
      if (anim.key === "spy_siSpecial") {
        sprite.off("animationcomplete", aoConcluirSiSpecial);
        if (this.acertou) return;

        const direcao = sprite.flipX ? -1 : 1;
        sprite.setX(sprite.x + 70 * direcao);

        sprite.anims.play("spy_teia_side", true);
        this.criarHitboxTeia();

        const aoConcluirTeia = (animTeia) => {
          if (animTeia.key === "spy_teia_side") {
            sprite.off("animationcomplete", aoConcluirTeia);
            this.limparHitbox();

            if (!this.acertou) {
              sprite.setX(sprite.x - 80 * direcao);
              sprite.anims.play("spy_siSpecial_miss", true);

              const aoConcluirMiss = (animMiss) => {
                if (animMiss.key === "spy_siSpecial_miss") {
                  sprite.off("animationcomplete", aoConcluirMiss);
                  sprite.setX(sprite.x - 10 * direcao);
                  this.finalizar();
                }
              };
              sprite.on("animationcomplete", aoConcluirMiss);
            }
          }
        };
        sprite.on("animationcomplete", aoConcluirTeia);
      }
    };

    sprite.on("animationcomplete", aoConcluirSiSpecial);
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
    this.limparHitbox();

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
      { x: 300* direcao, y: -10 },  // Frame 1
      { x: 300 * direcao, y: -10 }, //2
      { x: 300 * direcao, y: -10 }, //3
      { x: 268 * direcao, y: -10 }, //4
      { x: 268 * direcao, y: -10 },//5
      { x: 280 * direcao, y: -10 }, //6
      { x: 285 * direcao, y: -10 }, //7
      { x: 240 * direcao, y: -10 }, //8
      { x: 230 * direcao, y: -10 }, //9
      { x: 140 * direcao, y: -10 }, //10
      { x: 60 * direcao, y: -10 }, //11
      { x: -75 * direcao, y: -10 }, //12
      { x: -105 * direcao, y: -10 }, //13
      { x: -90 * direcao, y: -10 }, //14
      { x: 40 * direcao, y: -10 }, //15
      { x: 110 * direcao, y: -10 }, //16
      { x: 140 * direcao, y: -10 }, //17
      { x: 100 * direcao, y: -10 }, //8
      { x: 40 * direcao, y: -10 }, //9
      { x: -90 * direcao, y: -10 }, //20
      { x: -120 * direcao, y: -10 }, //1
      { x: -90 * direcao, y: -10 },//2
      { x: 60 * direcao, y: -10 },  //3
      { x: 140 * direcao, y: -10 }, //4
      { x: 230 * direcao, y: -10 }, //5
      { x: 240 * direcao, y: -10 }, //6
      { x: 270 * direcao, y: -10 }, //7
      { x: -250 * direcao, y: -10 }, //8
      { x: -180 * direcao, y: -10 }, //9
      { x: -180 * direcao, y: -10 }, //30
      { x: -120 * direcao, y: -10 }, //
    ];

    let jaLancouOponente = false;

    const atualizarTrajetoria = (anim, frame) => {
      if (anim.key !== "spy_spider_throw" || !alvo.sprite) return;

      const index = frame.index - 1;

      // FASE 1: ARREMESSO (Frames 1 ao 29)
      if (index < 29 && !jaLancouOponente) {
        const ponto = trajetoriaManual[index] || trajetoriaManual[trajetoriaManual.length - 1];
        if (ponto) {
          alvo.sprite.setPosition(sprite.x + ponto.x, sprite.y + ponto.y);
        }
      } 
      // FASE 2: SOLTURA E LANÇAMENTO (Frame 30 em diante)
      else if (index >= 29 && !jaLancouOponente) {
        jaLancouOponente = true;

        if (alvo.sprite && alvo.sprite.body) {
          alvo.sprite.body.setAllowGravity(true);
          alvo.sprite.body.moves = true;
        }

        const props = this.special?.propriedades || {};
        alvo.receberDano(props.dano || 18, {
          knockbackX: 700 * direcao,
          knockbackY: -350,
          tumbling: true,
        });
      }
    };

    sprite.on("animationupdate", atualizarTrajetoria);

    const aoConcluirThrow = (anim) => {
      if (anim.key === "spy_spider_throw") {
        sprite.off("animationcomplete", aoConcluirThrow);
        sprite.off("animationupdate", atualizarTrajetoria);

        const devolucaoIdeal = 40 * direcao;
        sprite.setX(sprite.x + devolucaoIdeal);

        this.finalizar();
      }
    };

    sprite.on("animationcomplete", aoConcluirThrow);
  }

  finalizar() {
    const sprite = this.personagem.sprite;

    this.limparHitbox();

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


