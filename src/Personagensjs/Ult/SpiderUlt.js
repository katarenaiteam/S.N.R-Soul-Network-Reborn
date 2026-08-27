export default class SpiderUlt {
  constructor(personagem, configUlt, estadoFSM) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.config = configUlt;
    this.estadoFSM = estadoFSM;
    this.oponente = personagem.oponente ||
      (this.scene.jogador1 === personagem ? this.scene.jogador2 : this.scene.jogador1);
    this.conectou = false;
    this.funcaoCamOriginal = null;
    this.etapaAtual = 0;
    this.etapas = [];
    this.congelado = false; // Flag para cortar o movimento manual no update
  }

  executar() {
    if (!this.oponente) {
      this.estadoFSM.finalizarUlt();
      return;
    }

    const cam = this.scene.cameras.main;
    const dir = this.personagem.sprite.flipX ? -1 : 1;

    this.desativarCameraCena();
    this.scene.physics.pause();

    if (this.scene.anims.exists("spy_idle")) {
      this.personagem.sprite.anims.play("spy_idle", true);
      this.personagem.sprite.anims.pause();
    }

    if (this.oponente.sprite && this.oponente.sprite.anims) {
      this.oponente.sprite.anims.pause();
    }

    const tempoZoom = 200;
    const tempoPausaExtra = 500;
    const tempoTotalFreeze = tempoZoom + tempoPausaExtra;

    const zoomAtual = cam.zoom;
    cam.pan(this.personagem.sprite.x, this.personagem.sprite.y, tempoZoom, "Power2");
    cam.zoomTo(zoomAtual * 1.4, tempoZoom);

    this.scene.time.delayedCall(tempoTotalFreeze, () => {
      this.scene.physics.resume();

      if (this.personagem.sprite.anims) {
        this.personagem.sprite.anims.resume();
      }

      if (this.oponente.sprite && this.oponente.sprite.anims) {
        this.oponente.sprite.anims.resume();
      }

      this.restaurarCameraSeNecessario();
      this.iniciarAvançoTrigger(dir);
    });
  }

  desativarCameraCena() {
    if (!this.funcaoCamOriginal && typeof this.scene.atualizarCamera === "function") {
      this.funcaoCamOriginal = this.scene.atualizarCamera;
      this.scene.atualizarCamera = () => {};
    }
  }

  restaurarCameraSeNecessario() {
    if (this.funcaoCamOriginal) {
      this.scene.atualizarCamera = this.funcaoCamOriginal;
      this.funcaoCamOriginal = null;
    }
  }

  iniciarAvançoTrigger(dir) {
    this.emAvanço = true;
    this.conectou = false;
    this.tempoAvançoInicio = this.scene.time.now;
    this.duracaoAvanço = 300;

    this.posInicialAvançoX = this.personagem.sprite.x;
    this.distanciaAvanço = 250 * dir;

    if (this.scene.anims.exists("spy_ult0")) {
      this.personagem.sprite.anims.play("spy_ult0", true);
    }

    this.personagem.sprite.body.setAllowGravity(false);
    this.personagem.sprite.body.setVelocity(0, 0);
  }

  atualizar() {
    // SE ESTIVER CONGELADO NO GOLPE FINAL, BLOQUEIA QUALQUER MOVIMENTO POR CÓDIGO
    if (this.congelado) return;

    // 1. INVESTIDA RETA DO TRIGGER
    if (this.emAvanço && !this.conectou) {
      const decorrido = this.scene.time.now - this.tempoAvançoInicio;
      const progresso = Math.min(decorrido / this.duracaoAvanço, 1);

      const novoX = Phaser.Math.Linear(
        this.posInicialAvançoX,
        this.posInicialAvançoX + this.distanciaAvanço,
        progresso
      );
      this.personagem.sprite.setPosition(novoX, this.personagem.sprite.y);

      const distX = Math.abs(this.personagem.sprite.x - this.oponente.sprite.x);
      const distY = Math.abs(this.personagem.sprite.y - this.oponente.sprite.y);

      if (distX < 50 && distY < 60) {
        this.conectou = true;
        this.emAvanço = false;
        this.iniciarComboCinematico();
        return;
      }

      if (progresso >= 1) {
        this.emAvanço = false;
        this.finalizarCinematica();
        return;
      }
      return;
    }

    // 2. FASE DO COMBO CINEMÁTICO COM ACELERAÇÃO (EASE)
    if (this.conectou && this.etapas && this.etapas[this.etapaAtual]) {
      const etapa = this.etapas[this.etapaAtual];
      const decorrido = this.scene.time.now - this.tempoEtapaInicio;
      
      const tempoAranha = etapa.tempoMovimentoAranha || etapa.duracao;
      const tempoOponente = etapa.tempoMovimentoOponente || etapa.duracao;

      const progressoAranha = Math.min(decorrido / tempoAranha, 1);
      const progressoOponente = Math.min(decorrido / tempoOponente, 1);

      // Movimento do Homem-Aranha
      if (etapa.targetAranha) {
        const easeFunc = this.obterFuncaoEase(etapa.easeAranha || 'Power2');
        const tA = easeFunc(progressoAranha);

        const novoX = Phaser.Math.Linear(this.posInicialAranha.x, etapa.targetAranha.x, tA);
        let novoY = Phaser.Math.Linear(this.posInicialAranha.y, etapa.targetAranha.y, tA);

        if (etapa.movimentoCurva && etapa.movimentoCurva.aranha) {
          novoY -= Math.sin(progressoAranha * Math.PI) * etapa.movimentoCurva.aranha;
        }

        this.personagem.sprite.setPosition(novoX, novoY);
      }

      // Movimento do Oponente
      if (etapa.targetOponente) {
        const easeFunc = this.obterFuncaoEase(etapa.easeOponente || 'Power2');
        const tO = easeFunc(progressoOponente);

        const novoX = Phaser.Math.Linear(this.posInicialOponente.x, etapa.targetOponente.x, tO);
        let novoY = Phaser.Math.Linear(this.posInicialOponente.y, etapa.targetOponente.y, tO);

        if (etapa.movimentoCurva && etapa.movimentoCurva.oponente) {
          novoY -= Math.sin(progressoOponente * Math.PI) * etapa.movimentoCurva.oponente;
        }

        this.oponente.sprite.setPosition(novoX, novoY);
      }
    }
  }

  obterFuncaoEase(nomeEase) {
    const mapa = {
      'Linear': Phaser.Math.Easing.Linear,
      'Power1': Phaser.Math.Easing.Quadratic.Out,
      'Power2': Phaser.Math.Easing.Cubic.Out,
      'Power3': Phaser.Math.Easing.Quartic.Out,
      'Quad.easeIn': Phaser.Math.Easing.Quadratic.In,
      'Quad.easeOut': Phaser.Math.Easing.Quadratic.Out,
      'Quad.easeInOut': Phaser.Math.Easing.Quadratic.InOut,
      'Cubic.easeIn': Phaser.Math.Easing.Cubic.In,
      'Cubic.easeOut': Phaser.Math.Easing.Cubic.Out,
      'Cubic.easeInOut': Phaser.Math.Easing.Cubic.InOut,
      'Bounce.easeOut': Phaser.Math.Easing.Bounce.Out,
      'Back.easeOut': Phaser.Math.Easing.Back.Out
    };

    return mapa[nomeEase] || Phaser.Math.Easing.Quadratic.Out;
  }

  iniciarComboCinematico() {
    const dir = this.personagem.sprite.flipX ? -1 : 1;
    const hitX = this.personagem.sprite.x;
    const hitY = this.personagem.sprite.y;

    if (this.oponente) {
      this.podeUsarAtaqueOriginal = this.oponente.podeUsarAtaque;
      this.podeUsarSpecialOriginal = this.oponente.podeUsarSpecial;

      this.oponente.podeUsarAtaque = () => false;
      this.oponente.podeUsarSpecial = () => false;
      this.oponente.podeAtacar = false;

      if (this.oponente.maquinaEstados?.estadoAtual?.finalizarAtaque) {
        this.oponente.maquinaEstados.estadoAtual.finalizarAtaque();
      } else if (this.oponente.maquinaEstados?.estadoAtual?.finalizarSpecial) {
        this.oponente.maquinaEstados.estadoAtual.finalizarSpecial();
      }

      if (this.oponente.hitboxAtiva && this.oponente.hitboxAtiva.body) {
        this.oponente.hitboxAtiva.body.enable = false;
      }
    }

    [this.personagem, this.oponente].forEach((p) => {
      if (p && p.sprite && p.sprite.body) {
        p.sprite.body.setAllowGravity(false);
        p.sprite.body.setVelocity(0, 0);
      }
    });

    if (this.oponente.maquinaEstados) {
      this.oponente.maquinaEstados.mudarEstado("hit");
    }

    this.etapas = [
      {
        duracao: 500,
        animAranha: "spy_ult00",
        animOponente: "danoSide",
        dano: 5,
        targetAranha: { x: hitX + (180 * dir), y: hitY },
        targetOponente: { x: hitX + (225 * dir), y: hitY - 15 },
        velocidadeAranha: 0.5,   
        velocidadeOponente: 0.5
      },
      {
        duracao: 360,
        animAranha: "spy_ult1",
        animOponente: "danoUp",
        dano: 5,
        targetAranha: { x: hitX + (180 * dir), y: hitY },
        targetOponente: { x: hitX + (230 * dir), y: hitY - 25 },
        movimentoCurva: { aranha: 0, oponente: 10 },
        velocidadeAranha: 3.5,   
        velocidadeOponente: 2
      },
      {
        duracao: 380,
        animAranha: "spy_ult2",
        delayAnimAranha: 50,
        animOponente: "danoUp",
        dano: 5,
        targetAranha: { x: hitX + (180 * dir), y: hitY },
        targetOponente: { x: hitX + (240 * dir), y: hitY - 160 },
        velocidadeAranha: 3.5,   
        velocidadeOponente: 1.4,
        easeOponente: "Cubic.easeOut"
      },
      {
        duracao: 120,
        animAranha: "spy_ult3",
        animOponente: "danoUp",
        dano: 8,
        targetAranha: { x: hitX + (220 * dir), y: hitY - 90 },
        targetOponente: { x: hitX + (240 * dir), y: hitY - 160 },
        velocidadeAranha: 0.5,   
        velocidadeOponente: 0.5,
        easeAranha: "Cubic.easeOut",
      },
      {
        duracao: 800,
        animAranha: "spy_ult35",
        animOponente: "danoUp",
        dano: 8,
        targetAranha: { x: hitX + (220 * dir), y: hitY - 90 },
        targetOponente: { x: hitX + (250 * dir), y: hitY - 220 },
        movimentoCurva: { aranha: 80, oponente: 200 },
        velocidadeAranha: 3.5,   
        velocidadeOponente: 1.4
      },
      {
        duracao: 350,
        animAranha: "spy_ult4",
        delayAnimAranha: 0,
        animOponente: "danoDown",
        dano: 8,
        targetAranha: { x: hitX + (220 * dir), y: hitY - 90 },
        targetOponente: { x: hitX + (300 * dir), y: hitY - 20 },
        velocidadeAranha: 3.5,   
        velocidadeOponente: 0.5
      },
      {
        duracao: 250,
        animAranha: "spy_ult5",
        animOponente: "dano",
        dano: 2,
        targetAranha: { x: hitX + (180 * dir), y: hitY - 120 },
        targetOponente: { x: hitX + (300 * dir), y: hitY - 20 },
        velocidadeAranha: 2.5,   
        velocidadeOponente: 0.5
      },
      {
        duracao: 200,
        animAranha: "spy_ult55",
        animOponente: "dano",
        dano: 2,
        targetAranha: { x: hitX + (180 * dir), y: hitY - 120 },
        targetOponente: { x: hitX + (300 * dir), y: hitY - 20 },
        velocidadeAranha: 3.5,   
        velocidadeOponente: 0.5
      },
      {
        duracao: 1000,
        animAranha: "spy_ult6",
        animOponente: "dano",
        dano: 12,
        trajetoriaPorFrame: [
          { x:   85, y: -125 }, { x:  104, y: -100 }, { x:  116, y:  -71 },
          { x:  120, y:  -40 }, { x:  116, y:   -9 }, { x:  104, y:   20 },
          { x:   85, y:   45 }, { x:   60, y:   64 }, { x:   31, y:   76 },
          { x:    0, y:   80 }, { x:  -31, y:   76 }, { x:  -60, y:   64 },
          { x:  -85, y:   45 }, { x: -104, y:   20 }, { x: -116, y:   -9 },
          { x: -120, y:  -40 }, { x: -116, y:  -71 }, { x: -104, y: -100 },
          { x:  -85, y: -125 }, { x:  -60, y: -144 }, { x:  -31, y: -156 },
          { x:    0, y: -160 }, { x:   31, y: -156 }, { x:   60, y: -144 },
          { x:   85, y: -125 }, { x:  104, y: -100 }, { x:  116, y:  -71 },
          { x:  120, y:  -40 }, { x:  116, y:   -9 }, { x:  104, y:   20 },
          { x:   85, y:   45 }, { x:   60, y:   64 }, { x:   31, y:   76 },
          { x:    0, y:   80 }, { x:  -31, y:   76 }, { x:  -60, y:   64 },
          { x:  -85, y:   45 }
        ]
      },
      {
        duracao: 400,
        animAranha: "spy_ult7",
        animOponente: "danoDown",
        dano: 10,
        trajetoriaPorFrame: [
          { x:  -85, y:   45 }, { x: -101, y:   25 }, { x: -112, y:    3 },
          { x: -119, y:  -21 }, { x: -120, y:  -46 }, { x: -116, y:  -71 },
          { x: -107, y:  -94 }, { x:  -93, y: -116 }, { x:  -76, y: -133 },
          { x:  -54, y: -147 }, { x:  -31, y: -156 }, { x:   -6, y: -160 },
          { x:   19, y: -119 }, { x:   43, y:  -32 }, { x:   65, y:   40 },
          { x:   85, y:   90 }
        ]
      },
      {
        duracao: 400,
        animAranha: "spy_ult3",
        animOponente: "dano",
        dano: 0,
        targetAranha: { x: hitX + (180 * dir), y: hitY - 120 },
        targetOponente: { x: hitX + (300 * dir), y: hitY - 20 },
        velocidadeAranha: 3.5,
        velocidadeOponente: 0.5
      },
      {
        duracao: 400,
        animAranha: "spy_ult8",
        animOponente: "danoSide",
        dano: 20,
        targetAranha: { x: hitX + (290 * dir), y: hitY - 30 },
        targetOponente: { x: hitX + (300 * dir), y: hitY - 20 },
        velocidadeAranha: 4.0,
        velocidadeOponente: 0.5,
        easeAranha: "Quad.easeIn",
        onStart: () => {
          // Ativa o freeze 200ms após o início da animação spy_ult8 para pegar o momento exato do chute
          this.scene.time.delayedCall(200, () => {
            this.executarImpactoFinal(dir);
          });
        }
      }
    ];

    this.etapaAtual = 0;
    this.proximaEtapa();
  }

  proximaEtapa() {
    if (this.etapaAtual >= this.etapas.length) {
      this.finalizarCinematica();
      return;
    }

    const etapa = this.etapas[this.etapaAtual];
    this.tempoEtapaInicio = this.scene.time.now;

    this.posInicialAranha = { x: this.personagem.sprite.x, y: this.personagem.sprite.y };
    this.posInicialOponente = { x: this.oponente.sprite.x, y: this.oponente.sprite.y };

    if (this.oponente && this.oponente.sprite && this.oponente.sprite.body) {
      this.oponente.sprite.body.setVelocity(0, 0);
      this.oponente.sprite.body.setAllowGravity(false);
    }

    if (this.fnUpdateFrame) {
      this.personagem.sprite.off('animationupdate', this.fnUpdateFrame);
      this.fnUpdateFrame = null;
    }

    if (etapa.animAranha && this.scene.anims.exists(etapa.animAranha)) {
      this.personagem.sprite.anims.play(etapa.animAranha, true);

      if (etapa.trajetoriaPorFrame && Array.isArray(etapa.trajetoriaPorFrame)) {
        this.fnUpdateFrame = (anim, frame) => {
          if (anim.key !== etapa.animAranha || !this.oponente || !this.oponente.sprite) return;

          const dir = this.personagem.sprite.flipX ? -1 : 1;
          const totalPontos = etapa.trajetoriaPorFrame.length;
          const index = (frame.index - 1) % totalPontos;
          const offset = etapa.trajetoriaPorFrame[index];

          if (offset) {
            this.oponente.sprite.setPosition(
              this.personagem.sprite.x + (offset.x * dir),
              this.personagem.sprite.y + offset.y
            );
          }
        };

        this.personagem.sprite.on('animationupdate', this.fnUpdateFrame);
      }
    }

    if (etapa.animOponente) {
      const prefixoOp = this.oponente.prefixo || "";
      const animComPrefixo = prefixoOp + etapa.animOponente;
      const animFinal = this.scene.anims.exists(animComPrefixo) ? animComPrefixo : etapa.animOponente;

      if (this.scene.anims.exists(animFinal)) {
        this.oponente.sprite.anims.play(animFinal, true);
      }
    }

    if (etapa.dano && typeof this.oponente.receberDano === "function") {
      this.oponente.receberDano(etapa.dano, {
        knockbackX: 0,
        knockbackY: 0,
        semEmpurrao: true,
        apenasDano: true
      });
    }

    if (typeof etapa.onStart === "function") {
      etapa.onStart();
    }

    this.timerEtapa = this.scene.time.delayedCall(etapa.duracao, () => {
      this.etapaAtual++;
      this.proximaEtapa();
    });
  }

  restaurarOponente() {
    if (!this.oponente) return;

    if (this.podeUsarAtaqueOriginal) this.oponente.podeUsarAtaque = this.podeUsarAtaqueOriginal;
    if (this.podeUsarSpecialOriginal) this.oponente.podeUsarSpecial = this.podeUsarSpecialOriginal;
    this.oponente.podeAtacar = true;

    if (this.oponente.sprite && this.oponente.sprite.body) {
      this.oponente.sprite.body.setAllowGravity(true);
    }
  }

  executarImpactoFinal(dir) {
    const cam = this.scene.cameras.main;
    const aranhaSprite = this.personagem.sprite;
    const oponenteSprite = this.oponente?.sprite;

    // 1. ATIVA FLAG DE CONTROLE
    this.congelado = true;

    // 2. PAUSA O TEMPORIZADOR DA ETAPA ATUAL
    if (this.timerEtapa) {
      this.timerEtapa.paused = true;
    }

    // 3. DESATIVA CÂMERA DA CENA E APLICA ZOOM DIRETO
    this.desativarCameraCena();
    cam.stopFollow();
    cam.centerOn(aranhaSprite.x, aranhaSprite.y);
    cam.setZoom(3.2);

    // 4. PAUSA A FÍSICA E O CLOCK DO PHASER (CONGELA NO FRAME)
    this.scene.physics.pause();
    this.scene.time.paused = true;

    // 5. TREMOR EM MEIO-TERMO (0.005) DURANTE TODO O CONGELAMENTO (1500ms)
    cam.shake(900, 0.01, true);

    // 6. DESCONGELA APÓS 1,5 SEGUNDOS (1500ms)
    setTimeout(() => {
      if (!this.scene || !this.scene.time) return;

      // PARA QUALQUER EFEITO SOBRANTE DA CÂMERA
      cam.resetFX();

      // REATIVAR O CLOCK DO PHASER E A FÍSICA
      this.scene.time.paused = false;
      this.scene.physics.resume();

      if (this.timerEtapa) {
        this.timerEtapa.paused = false;
      }

      // RESTAURA O ZOOM NORMAL
      cam.setZoom(1.0);

      // APLICA O KNOCKBACK E DANO FINAL NO OPONENTE
      if (this.oponente && oponenteSprite && oponenteSprite.body) {
        oponenteSprite.body.setAllowGravity(true);

        const pctDano = this.oponente.porcentagemDano || this.oponente.danoAcumulado || 0;
        const multPorcentagem = 1 + (pctDano / 100);

        const forcaX = 500 * dir * multPorcentagem;
        const forcaY = 1600 * multPorcentagem;

        if (this.oponente.maquinaEstados && typeof this.oponente.maquinaEstados.mudarEstado === "function") {
          this.oponente.maquinaEstados.mudarEstado("hit", {
            knockbackX: forcaX,
            knockbackY: forcaY
          });
        }

        oponenteSprite.body.setVelocity(forcaX, forcaY);

        if (typeof this.oponente.receberDano === "function") {
          this.oponente.receberDano(25, {
            knockbackX: forcaX,
            knockbackY: forcaY,
            semEmpurrao: false
          });
        }
      }

      this.finalizarCinematica();
    }, 900); // 1500ms (1.5 segundos)
  }

  finalizarCinematica() {
    this.congelado = false;

    // Garante que o clock do Phaser não fique pausado se a Ult acabar
    if (this.scene && this.scene.time) {
      this.scene.time.paused = false;
    }

    if (this.timerEtapa) {
      this.timerEtapa.remove();
      this.timerEtapa = null;
    }

    if (this.personagem && this.personagem.sprite && this.personagem.sprite.body) {
      this.personagem.sprite.body.setAllowGravity(true);
    }

    this.restaurarOponente();
    this.restaurarCameraSeNecessario();

    if (this.estadoFSM && typeof this.estadoFSM.finalizarUlt === "function") {
      this.estadoFSM.finalizarUlt();
    }
  }
  cancelar() {
    this.congelado = false;

    if (this.timerEtapa) {
      this.timerEtapa.remove();
      this.timerEtapa = null;
    }

    if (this.personagem && this.personagem.sprite && this.personagem.sprite.body) {
      this.personagem.sprite.body.setAllowGravity(true);
    }
    if (this.oponente && this.oponente.sprite && this.oponente.sprite.body) {
      this.oponente.sprite.body.setAllowGravity(true);
    }

    this.restaurarCameraSeNecessario();
  }
}