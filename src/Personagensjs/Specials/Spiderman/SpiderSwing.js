export default class SpiderSwing {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem ? personagem.scene : null;
    this.special = special;
    this.estado = estado;

    this.hitboxAtaque = null;
    this.overlap = null;
    this.teia = null;
    this.acertou = false;
    this.tweenMovimento = null;
    this.timerHitbox = null; // Timer do delay da hitbox
    this.listenerAnimacao = null;
    this.alvoListenerAnimacao = null;
    this.timerFlip = null;
    this.tweenFlip = null;
    this.flipSprite = null;
    this.ancoraX = null;
    this.ancoraY = null;
    this.fase = "idle";

    // --- CONFIGURAÇÃO DA HITBOX E DELAY ---
    this.hitboxOffsetX = 22;   // Posição X (frente/trás)
    this.hitboxOffsetY = -40;  // Posição Y (cima/baixo)
    this.hitboxWidth = 105;    // Largura
    this.hitboxHeight = 25;    // Altura
    this.hitboxDelayMs = 300;  // DELAY EM MILISSEGUNDOS (ajuste para atrasar o surgimento da hitbox)
  }

  ignorarNoHud(objeto) {
    if (!this.scene || !objeto) return;
    const hudCam = this.scene.cameraHUD || this.scene.hudCamera || this.scene.camerasHUD;
    if (hudCam && typeof hudCam.ignore === "function") {
      hudCam.ignore(objeto);
    } else if (this.scene.cameras && this.scene.cameras.cameras) {
      const cameras = this.scene.cameras.cameras;
      for (let i = 1; i < cameras.length; i++) {
        if (cameras[i] && typeof cameras[i].ignore === "function") {
          cameras[i].ignore(objeto);
        }
      }
    }
  }

  executar() {
    const sprite = this.personagem ? this.personagem.sprite : null;
    if (!sprite || !sprite.body) return;

    this.acertou = false;
    this.fase = "swing";
    const direcao = sprite.flipX ? -1 : 1;
    const keyAnim = this.special?.animacao || "spy_AsiSpecial";

    sprite.body.setAllowGravity(false);
    sprite.body.setVelocity(0, 0);

    const animacao = this.scene.anims.get(keyAnim);
    if (!animacao) {
      this.finalizar();
      return;
    }

    const inicioX = sprite.x;
    const inicioY = sprite.y;
    const distanciaX = 300 * direcao;
    const duracaoMs = animacao.duration || (animacao.frames.length / animacao.frameRate) * 1000;

    // Teia e Hitbox inicial
    this.ancoraX = sprite.x + 200 * direcao;
    this.ancoraY = sprite.y - 300;
    this.teia = this.scene.add.graphics();
    this.teia.setDepth(sprite.depth - 1);
    this.ignorarNoHud(this.teia);
    this.atualizarTeia(direcao);

    this.timerHitbox = this.scene.time.delayedCall(this.hitboxDelayMs, () => {
      this.timerHitbox = null;
      if (this.fase === "swing") {
        this.criarHitbox();
      }
    });

    sprite.anims.play(keyAnim, true);

    // --- OPÇÃO 2 AQUI: TWEEN COM VERIFICAÇÃO DE SOBREPOSIÇÃO/COLISÃO ---
    this.tweenMovimento = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: duracaoMs,
      ease: "Sine.easeInOut",
      onUpdate: (tween) => {
        if (this.fase !== "swing") return;

        const progresso = tween.getValue();
        const proximoX = inicioX + distanciaX * progresso;
        const proximoY = inicioY + Math.sin(progresso * Math.PI) * 55;

        // 1. Move o sprite e atualiza o corpo físico para a nova posição
        sprite.setPosition(proximoX, proximoY);
        sprite.body.updateFromGameObject();

        // 2. Pega o grupo REAL de plataformas do mapa instanciado
        const plataformas = 
          (this.scene.mapaAtual && this.scene.mapaAtual.plataformas) || 
          this.scene.plataformas;

        // 3. Testa se encostou em qualquer bloco do mapa
        if (plataformas && this.scene.physics.overlap(sprite, plataformas)) {
          this.tweenMovimento.stop();
          this.finalizar();
          return;
        }

        this.atualizarTeia(direcao);

        // Atualiza a hitbox de ataque
        if (this.hitboxAtaque && this.hitboxAtaque.active) {
          const posX = sprite.x + this.hitboxOffsetX * direcao;
          const posY = sprite.y + this.hitboxOffsetY;

          this.hitboxAtaque.setPosition(posX, posY);
          if (this.hitboxAtaque.body) {
            this.hitboxAtaque.body.x = posX - this.hitboxWidth / 2;
            this.hitboxAtaque.body.y = posY - this.hitboxHeight / 2;
          }
        }
      },
      onComplete: () => {
        if (this.fase !== "swing") return;
        this.acertou ? this.executarFlipAtras() : this.finalizar();
      },
    });
  }

  criarHitbox() {
    const sprite = this.personagem ? this.personagem.sprite : null;
    if (!sprite || !this.scene || !sprite.active) return;

    const direcao = sprite.flipX ? -1 : 1;
    const posX = sprite.x + this.hitboxOffsetX * direcao;
    const posY = sprite.y + this.hitboxOffsetY;

    this.hitboxAtaque = this.scene.add.rectangle(
      posX,
      posY,
      this.hitboxWidth,
      this.hitboxHeight,
      0x000000,
      0
    );
    this.scene.physics.add.existing(this.hitboxAtaque);

    if (this.hitboxAtaque.body) {
      this.hitboxAtaque.body.setAllowGravity(false);
      this.hitboxAtaque.body.setSize(this.hitboxWidth, this.hitboxHeight);
      this.hitboxAtaque.body.x = posX - this.hitboxWidth / 2;
      this.hitboxAtaque.body.y = posY - this.hitboxHeight / 2;
    }

    const oponentes =
      this.scene.scene && this.scene.scene.key === "CenaHistoria"
        ? this.personagem === this.scene.boss
          ? [this.scene.jogador1]
          : [this.scene.boss]
        : [this.scene.jogador1, this.scene.jogador2].filter(
            (j) => j && j !== this.personagem
          );

    oponentes.forEach((oponente) => {
      if (!oponente || !oponente.grupoHurtbox) return;
      this.overlap = this.scene.physics.add.overlap(
        this.hitboxAtaque,
        oponente.grupoHurtbox,
        () => this.processarAcerto(oponente)
      );
    });
  }

  atualizarTeia(direcao) {
    if (!this.teia || !this.teia.active || !this.personagem?.sprite) return;

    const sprite = this.personagem.sprite;
    const mainCam = this.scene.cameras.main;

    const topoCam = mainCam ? mainCam.worldView.y - 100 : sprite.y - 300;
    const meoAncoraY = Math.min(this.ancoraY, topoCam);

    // Ajustado de (+ 10 * direcao) para (- 15 * direcao) para mover o início mais para trás
    const maoX = sprite.x - 15 * direcao;
    const maoY = sprite.y - 60;
    const controleX = (this.ancoraX + maoX) / 2 + 45 * direcao;
    const controleY = (meoAncoraY + maoY) / 2 + 20;

    const ponto = (progresso) => {
      const inverso = 1 - progresso;
      return {
        x: inverso * inverso * this.ancoraX + 2 * inverso * progresso * controleX + progresso * progresso * maoX,
        y: inverso * inverso * meoAncoraY + 2 * inverso * progresso * controleY + progresso * progresso * maoY,
      };
    };

    this.teia.clear();
    this.teia.lineStyle(3, 0x4e9fb5, 1);
    this.teia.beginPath();
    this.teia.moveTo(this.ancoraX, meoAncoraY);
    for (let indice = 1; indice <= 24; indice += 1) {
      const posicao = ponto(indice / 24);
      this.teia.lineTo(posicao.x, posicao.y);
    }
    this.teia.strokePath();
    this.teia.lineStyle(1.5, 0xffffff, 1);
    this.teia.beginPath();
    this.teia.moveTo(this.ancoraX, meoAncoraY);
    for (let indice = 1; indice <= 24; indice += 1) {
      const posicao = ponto(indice / 24);
      this.teia.lineTo(posicao.x, posicao.y);
    }
    this.teia.strokePath();
  }

  processarAcerto(alvo) {
    if (this.acertou || !alvo) return;
    this.acertou = true;

    if (this.overlap && this.overlap.active) {
      this.overlap.destroy();
      this.overlap = null;
    }

    const props = this.special ? this.special.propriedades || {} : {};
    const sprite = this.personagem ? this.personagem.sprite : null;
    const direcao = sprite && sprite.flipX ? -1 : 1;

    if (typeof alvo.receberDano === "function") {
      alvo.receberDano(props.dano || 18, {
        knockbackX: (props.knockbackX || 550) * direcao,
        knockbackY: props.knockbackY || -240,
        tumbling: true,
      });
    }
  }

  executarFlipAtras() {
    const sprite = this.personagem ? this.personagem.sprite : null;
    if (!sprite || !sprite.body) {
      this.finalizar();
      return;
    }

    this.limparHitbox();
    this.fase = "flip";
    sprite.setVisible(true);
    sprite.anims.stop();

    if (this.tweenMovimento) {
      this.tweenMovimento.stop();
      this.tweenMovimento = null;
    }

    if (this.listenerAnimacao) {
      this.alvoListenerAnimacao?.off("animationcomplete", this.listenerAnimacao);
      this.listenerAnimacao = null;
      this.alvoListenerAnimacao = null;
    }

    const direcaoAtaque = sprite.flipX ? -1 : 1;

    sprite.body.setAllowGravity(true);
    sprite.body.setVelocity(-350 * direcaoAtaque, -450);

    const keyFlip = "spy_spiderflip";

    sprite.setVisible(false);
    this.flipSprite = this.scene.add.sprite(sprite.x, sprite.y, "Spiderflip", 0);
    this.flipSprite.setOrigin(0.5, 1);
    this.flipSprite.setFlipX(sprite.flipX);
    this.flipSprite.setDepth(sprite.depth + 1);
    this.ignorarNoHud(this.flipSprite);

    this.flipSprite.anims.play(keyFlip, true);
    const animacaoFlip = this.scene.anims.get(keyFlip);
    const duracaoFlip = animacaoFlip?.duration ||
      (animacaoFlip?.frames.length / animacaoFlip?.frameRate) * 1000 || 500;
    this.timerFlip = this.scene.time.delayedCall(duracaoFlip, () => {
      this.timerFlip = null;
      if (this.fase === "flip") this.finalizar();
    });
    this.tweenFlip = this.scene.tweens.addCounter({
      from: 0,
      to: 8,
      duration: duracaoFlip,
      onUpdate: (tween) => {
        if (this.fase === "flip" && this.flipSprite?.active) {
          this.flipSprite.setPosition(sprite.x, sprite.y);
          this.flipSprite.setFrame(Math.floor(tween.getValue()));
        }
      },
    });
  }

  limparHitbox() {
    if (this.timerHitbox) {
      this.timerHitbox.remove(false);
      this.timerHitbox = null;
    }
    if (this.overlap && this.overlap.active) {
      this.overlap.destroy();
      this.overlap = null;
    }
    if (this.hitboxAtaque && this.hitboxAtaque.active) {
      this.hitboxAtaque.destroy();
      this.hitboxAtaque = null;
    }
    if (this.teia && this.teia.active) this.teia.destroy();
    this.teia = null;
    if (this.flipSprite && this.flipSprite.active) this.flipSprite.destroy();
    this.flipSprite = null;
    this.ancoraX = null;
    this.ancoraY = null;
  }

  cancelar() {
    if (this.fase === "fim") return;
    this.fase = "fim";

    if (this.tweenMovimento) {
      this.tweenMovimento.stop();
      this.tweenMovimento = null;
    }
    if (this.timerFlip) {
      this.timerFlip.remove(false);
      this.timerFlip = null;
    }
    if (this.tweenFlip) {
      this.tweenFlip.stop();
      this.tweenFlip = null;
    }

    this.limparHitbox();

    const sprite = this.personagem?.sprite;
    if (sprite?.body) {
      sprite.body.setAllowGravity(true);
      sprite.setVisible(true);

      // --- RESTAURA A HITBOX PADRÃO AO CANCELAR ---
      if (typeof this.personagem.configurarHitboxPadrao === "function") {
        this.personagem.configurarHitboxPadrao();
      } else {
        sprite.body.setSize(sprite.width, sprite.height);
        sprite.body.setOffset(0, 0);
      }
      sprite.body.updateFromGameObject();
    }

    if (this.listenerAnimacao) {
      this.alvoListenerAnimacao?.off("animationcomplete", this.listenerAnimacao);
      this.listenerAnimacao = null;
      this.alvoListenerAnimacao = null;
    }
  }

  finalizar() {
    if (this.fase === "fim") return;
    this.fase = "fim";

    if (this.tweenMovimento) {
      this.tweenMovimento.stop();
      this.tweenMovimento = null;
    }
    if (this.timerFlip) {
      this.timerFlip.remove(false);
      this.timerFlip = null;
    }
    if (this.tweenFlip) {
      this.tweenFlip.stop();
      this.tweenFlip = null;
    }

    this.limparHitbox();

    const sprite = this.personagem ? this.personagem.sprite : null;
    if (sprite && sprite.body) {
      sprite.body.setAllowGravity(true);
      sprite.setVisible(true);

      // --- RESTAURA A HITBOX PADRÃO AO FINALIZAR ---
      if (typeof this.personagem.configurarHitboxPadrao === "function") {
        this.personagem.configurarHitboxPadrao();
      } else {
        // Redefine a hitbox para o tamanho padrão do sprite do Homem-Aranha
        sprite.body.setSize(sprite.width, sprite.height);
        sprite.body.setOffset(0, 0);
      }
      sprite.body.updateFromGameObject();
    }

    if (this.listenerAnimacao) {
      this.alvoListenerAnimacao?.off("animationcomplete", this.listenerAnimacao);
      this.listenerAnimacao = null;
      this.alvoListenerAnimacao = null;
    }

    if (this.estado && typeof this.estado.finalizarSpecial === "function") {
      this.estado.finalizarSpecial();
    }
  }

  atualizar() {}
}