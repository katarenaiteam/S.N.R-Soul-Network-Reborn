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
    this.multiplicadorRitmo = 1.2;
    this.timeScaleAranhaOriginal = null;
    this.timeScaleOponenteOriginal = null;
    this.fundoUlt = null;
    this.fundoFaseOriginal = null;
    this.fundoFaseEraVisivel = true;
    this.visibilidadePlataformas = [];
    this.timerFalhaUlt = null;
    this.intervaloTremorFinal = null;
    this.posCameraAntesTremor = null;
  }

  executar() {
    if (!this.oponente) {
      this.estadoFSM.finalizarUlt();
      return;
    }

    const cam = this.scene.cameras.main;
    const dir = this.personagem.sprite.flipX ? -1 : 1;

    this.ativarFundoUltimate();
    this.personagem.tocarSomSorteado("sp_ShowTime", {
      volume: 0.8,
      detune: 0
    });

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
    this.aplicarRitmoAnimacoes();
    this.emAvanço = true;
    this.conectou = false;
    this.tempoAvançoInicio = this.scene.time.now;
    this.duracaoAvanço = 300 * this.multiplicadorRitmo;

    this.posInicialAvançoX = this.personagem.sprite.x;
    this.distanciaAvanço = 250 * dir;

    if (this.scene.anims.exists("spy_ult0")) {
      this.personagem.sprite.anims.play("spy_ult0", true);
    }

    this.personagem.sprite.body.setAllowGravity(false);
    this.personagem.sprite.body.setVelocity(0, 0);
  }

  atualizar() {
    this.ajustarFundoNaCamera();

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
        this.timerFalhaUlt = this.scene.time.delayedCall(500, () => {
          this.timerFalhaUlt = null;
          this.finalizarCinematica();
        });
        return;
      }
      return;
    }

    // 2. FASE DO COMBO CINEMÁTICO COM ACELERAÇÃO (EASE)
    if (this.conectou && this.etapas && this.etapas[this.etapaAtual]) {
      const etapa = this.etapas[this.etapaAtual];
      const decorrido = this.scene.time.now - this.tempoEtapaInicio;
      
      const tempoAranha = etapa.tempoMovimentoAranha || etapa.duracao;
      const delayMovimentoOponente = etapa.delayMovimentoOponente ?? 0;
      const tempoDisponivelOponente = Math.max(
        1,
        etapa.duracao - delayMovimentoOponente
      );
      const tempoOponente = etapa.tempoMovimentoOponente || tempoDisponivelOponente;

      const progressoAranha = Math.min(decorrido / tempoAranha, 1);
      const progressoOponente = Phaser.Math.Clamp(
        (decorrido - delayMovimentoOponente) / tempoOponente,
        0,
        1
      );

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

      if (!this.updateEstadoOponenteOriginal && this.oponente.maquinaEstados) {
        this.updateEstadoOponenteOriginal = this.oponente.maquinaEstados.update;
        this.oponente.maquinaEstados.update = () => {};
      }

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
        targetAranha: { x: hitX + (175 * dir), y: hitY },
        targetOponente: { x: hitX + (220 * dir), y: hitY  },
        movimentoCurva: { aranha: 0, oponente: 50 },
        velocidadeAranha: 0.5,   
        velocidadeOponente: 0.5
      },
      {
        duracao: 400,
        animAranha: "spy_ult1",
        animOponente: "danoUp",
        dano: 5,
        targetAranha: { x: hitX + (175 * dir), y: hitY },
        targetOponente: { x: hitX + (230 * dir), y: hitY - 25 },
        movimentoCurva: { aranha: 0, oponente: 40 },
        velocidadeAranha: 3.5,   
        velocidadeOponente: 2
      },
      {
        duracao: 380,
         delayMovimentoOponente: 60,
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
        duracao: 300,
        animAranha: "spy_ult3",
        animOponente: "danoUp",
        dano: 8,
        frameFeedbackImpacto: 4,
        targetAranha: { x: hitX + (220 * dir), y: hitY - 90 },
        targetOponente: { x: hitX + (240 * dir), y: hitY - 160 },
        tempoMovimentoAranha: 300,
        velocidadeAranha: 0.4,   
        velocidadeOponente: 0.5,
        easeAranha: "Cubic.easeOut",
      },
      {
        duracao: 800,
        animAranha: "spy_ult35",
        animOponente: "danoUp",
        dano: 8,
        targetAranha: { x: hitX + (190 * dir), y: hitY - 90 },
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
        targetOponente: { x: hitX + (300 * dir), y: hitY +10 },
        velocidadeAranha: 3.50,   
        velocidadeOponente: 0.8
      },
      {
        duracao: 400,
        animAranha: "spy_ult5",
        animOponente: "dano",
        dano: 2,
        targetAranha: { x: hitX + (190 * dir), y: hitY - 110 },
        targetOponente: { x: hitX + (300 * dir), y: hitY - 55 },
        velocidadeAranha: 2.5,   
        velocidadeOponente: 0.3
      },
      {
        duracao: 200,
        animAranha: "spy_ult55",
        animOponente: "dano",
        dano: 2,
        targetAranha: { x: hitX + (190 * dir), y: hitY - 110 },
        targetOponente: { x: hitX + (300 * dir), y: hitY - 55 },
        velocidadeAranha: 3.5,   
        velocidadeOponente: 0.5
      },
      {
        duracao: 1000,
        animAranha: "spy_ult6",
        animOponente: "dano",
        dano: 12,
        frameFeedbackImpacto: 2,
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
        // A etapa dura 400 ms (cerca de 9 frames a 22 fps).
        // Toca no último frame visível e após atualizar a posição do alvo.
        frameFeedbackImpacto: 9,
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
        targetOponente: { x: hitX + (310 * dir), y: hitY  },
        velocidadeAranha: 3.5,
        velocidadeOponente: 0.5
      },
      {
        duracao: 400,
        animAranha: "spy_ult8",
        animOponente: "danoSide",
        dano: 20,
        atrasoFeedbackImpacto: 200,
        impactoPesado: true,
        somImpacto: "finish",
        targetAranha: { x: hitX + (290 * dir), y: hitY - 10 },
        targetOponente: { x: hitX + (300 * dir), y: hitY - 5 },
        velocidadeAranha: 4.0,
        velocidadeOponente: 0.5,
        easeAranha: "Quad.easeIn",
        onStart: () => {
          // Ativa o freeze 200ms após o início da animação spy_ult8 para pegar o momento exato do chute
          this.scene.time.delayedCall(200 * this.multiplicadorRitmo, () => {
            this.executarImpactoFinal(dir);
          });
        }
      }
    ];

    const camposTemporais = [
      "duracao",
      "tempoMovimentoAranha",
      "tempoMovimentoOponente",
      "delayMovimentoOponente",
      "delayAnimAranha",
      "atrasoFeedbackImpacto"
    ];
    this.etapas.forEach((etapa) => {
      camposTemporais.forEach((campo) => {
        if (typeof etapa[campo] === "number") {
          etapa[campo] *= this.multiplicadorRitmo;
        }
      });
    });

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

      if (
        (etapa.trajetoriaPorFrame && Array.isArray(etapa.trajetoriaPorFrame)) ||
        etapa.frameFeedbackImpacto
      ) {
        let feedbackTocado = false;
        this.fnUpdateFrame = (anim, frame) => {
          if (anim.key !== etapa.animAranha || !this.oponente || !this.oponente.sprite) return;

          if (etapa.trajetoriaPorFrame) {
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
          }

          if (
            !feedbackTocado &&
            etapa.frameFeedbackImpacto &&
            frame.index >= etapa.frameFeedbackImpacto
          ) {
            feedbackTocado = true;
            this.tocarFeedbackImpacto(etapa);
          }
        };

        this.personagem.sprite.on('animationupdate', this.fnUpdateFrame);
      }
    }

    if (etapa.dano && typeof this.oponente.receberDano === "function") {
      this.oponente.receberDano(etapa.dano, {
        knockbackX: 0,
        knockbackY: 0,
        semEmpurrao: true,
        apenasDano: true
      });

      if (!etapa.frameFeedbackImpacto) {
        const tocarFeedback = () => this.tocarFeedbackImpacto(etapa);
        if (etapa.atrasoFeedbackImpacto) {
          this.scene.time.delayedCall(etapa.atrasoFeedbackImpacto, tocarFeedback);
        } else {
          tocarFeedback();
        }
      }
    }

    if (etapa.animOponente) {
      const prefixoOp = this.oponente.prefixoAnim || "";
      const animComPrefixo = prefixoOp + etapa.animOponente;
      const animFinal = this.scene.anims.exists(animComPrefixo) ? animComPrefixo : etapa.animOponente;

      if (this.scene.anims.exists(animFinal)) {
        this.oponente.sprite.anims.play(animFinal, true);
      }
    }

    if (typeof etapa.onStart === "function") {
      etapa.onStart();
    }

    this.timerEtapa = this.scene.time.delayedCall(etapa.duracao, () => {
      this.etapaAtual++;
      this.proximaEtapa();
    });
  }

  tocarFeedbackImpacto(etapa) {
    if (!this.oponente?.sprite) return;

    const impactoPesado = etapa.impactoPesado || etapa.dano >= 8;
    const efeitos = impactoPesado
      ? ["punch2", "punch3"]
      : ["punch1", "punch2", "punch3"];

    this.personagem.vfx?.tocarListaImpacto(
      [{ escolherUm: efeitos, escala: impactoPesado ? 1.15 : 0.85 }],
      this.oponente
    );

    const tipoSom = impactoPesado ? "heavy" : "light";
    const sonsImpacto = etapa.somImpacto || this.personagem.sons?.[tipoSom];
    if (sonsImpacto) {
      const configSom = {
        volume: etapa.somImpacto ? 0.85 : (impactoPesado ? 0.22 : 0.15)
      };
      if (etapa.somImpacto) configSom.detune = 0;
      this.personagem.tocarSomSorteado(sonsImpacto, configSom);
    }
  }

  ativarFundoUltimate() {
    if (this.fundoUlt?.active || !this.scene.textures.exists("ultimateback")) return;

    const fundoFase = this.scene.mapaAtual?.imagemFundo;
    this.fundoFaseOriginal = fundoFase || null;
    this.fundoFaseEraVisivel = fundoFase?.visible ?? true;

    if (!this.scene.anims.exists("spider_ultimateback")) {
      this.scene.anims.create({
        key: "spider_ultimateback",
        frames: this.scene.anims.generateFrameNumbers("ultimateback", {
          start: 0,
          end: 115
        }),
        frameRate: 36,
        repeat: -1
      });
    }

    this.fundoUlt = this.scene.add.sprite(0, 0, "ultimateback", 0);
    this.fundoUlt.setDepth((fundoFase?.depth ?? -100) + 1);
    this.fundoUlt.setScrollFactor(1);
    this.ajustarFundoNaCamera();
    this.fundoUlt.play("spider_ultimateback");
    fundoFase?.setVisible(false);

    const plataformas = this.scene.mapaAtual?.plataformas?.getChildren?.() || [];
    this.visibilidadePlataformas = plataformas.map((plataforma) => ({
      plataforma,
      visivel: plataforma.visible
    }));
    plataformas.forEach((plataforma) => plataforma.setVisible(false));

    this.scene.camHUD?.ignore(this.fundoUlt);
  }

  ajustarFundoNaCamera() {
    if (!this.fundoUlt?.active) return;

    const cam = this.scene.cameras.main;
    this.fundoUlt.setPosition(cam.midPoint.x, cam.midPoint.y);
    this.fundoUlt.setDisplaySize(
      cam.width / cam.zoom,
      cam.height / cam.zoom
    );
  }

  restaurarFundoFase() {
    if (this.fundoFaseOriginal?.active) {
      this.fundoFaseOriginal.setVisible(this.fundoFaseEraVisivel);
    }
    this.fundoUlt?.destroy();
    this.fundoUlt = null;
    this.fundoFaseOriginal = null;

    this.visibilidadePlataformas.forEach(({ plataforma, visivel }) => {
      if (plataforma?.active) plataforma.setVisible(visivel);
    });
    this.visibilidadePlataformas = [];
  }

  iniciarTremorFinal(cam) {
    this.pararTremorFinal();

    const duracao = 800;
    const intervalo = 45;
    const amplitudeInicial = 150 / cam.zoom;
    const inicio = performance.now();
    this.posCameraAntesTremor = { x: cam.scrollX, y: cam.scrollY };

    this.intervaloTremorFinal = setInterval(() => {
      const progresso = Math.min((performance.now() - inicio) / duracao, 1);
      const quedaSuave = Math.pow(1 - progresso, 0.65);
      const amplitude = amplitudeInicial * quedaSuave;
      const base = this.posCameraAntesTremor;

      cam.setScroll(
        base.x + Phaser.Math.FloatBetween(-amplitude, amplitude),
        base.y + Phaser.Math.FloatBetween(-amplitude, amplitude)
      );
      this.ajustarFundoNaCamera();

      if (progresso >= 1) this.pararTremorFinal();
    }, intervalo);
  }

  pararTremorFinal() {
    if (this.intervaloTremorFinal) {
      clearInterval(this.intervaloTremorFinal);
      this.intervaloTremorFinal = null;
    }

    if (this.posCameraAntesTremor && this.scene?.cameras?.main) {
      this.scene.cameras.main.setScroll(
        this.posCameraAntesTremor.x,
        this.posCameraAntesTremor.y
      );
      this.posCameraAntesTremor = null;
      this.ajustarFundoNaCamera();
    }
  }

  aplicarRitmoAnimacoes() {
    const animsAranha = this.personagem?.sprite?.anims;
    const animsOponente = this.oponente?.sprite?.anims;

    if (animsAranha && this.timeScaleAranhaOriginal === null) {
      this.timeScaleAranhaOriginal = animsAranha.timeScale;
      animsAranha.timeScale = this.timeScaleAranhaOriginal / this.multiplicadorRitmo;
    }

    if (animsOponente && this.timeScaleOponenteOriginal === null) {
      this.timeScaleOponenteOriginal = animsOponente.timeScale;
      animsOponente.timeScale = this.timeScaleOponenteOriginal / this.multiplicadorRitmo;
    }
  }

  restaurarRitmoAnimacoes() {
    if (this.timeScaleAranhaOriginal !== null && this.personagem?.sprite?.anims) {
      this.personagem.sprite.anims.timeScale = this.timeScaleAranhaOriginal;
      this.timeScaleAranhaOriginal = null;
    }

    if (this.timeScaleOponenteOriginal !== null && this.oponente?.sprite?.anims) {
      this.oponente.sprite.anims.timeScale = this.timeScaleOponenteOriginal;
      this.timeScaleOponenteOriginal = null;
    }
  }

  restaurarOponente() {
    if (!this.oponente) return;

    if (this.podeUsarAtaqueOriginal) this.oponente.podeUsarAtaque = this.podeUsarAtaqueOriginal;
    if (this.podeUsarSpecialOriginal) this.oponente.podeUsarSpecial = this.podeUsarSpecialOriginal;
    this.oponente.podeAtacar = true;

    if (this.updateEstadoOponenteOriginal && this.oponente.maquinaEstados) {
      this.oponente.maquinaEstados.update = this.updateEstadoOponenteOriginal;
      this.updateEstadoOponenteOriginal = null;
    }

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

    // Tremor controlado, com baixa frequência e queda gradual de intensidade.
    this.iniciarTremorFinal(cam);

    // Mantém o close congelado depois do tremor para destacar a pose final.
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
        const forcaY = 1200 * multPorcentagem;  //1600 original

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
    }, 1300);
  }

  finalizarCinematica() {
    this.congelado = false;
    this.pararTremorFinal();
    if (this.timerFalhaUlt) {
      this.timerFalhaUlt.remove();
      this.timerFalhaUlt = null;
    }
    if (this.fnUpdateFrame) {
      this.personagem.sprite.off("animationupdate", this.fnUpdateFrame);
      this.fnUpdateFrame = null;
    }

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

    this.restaurarFundoFase();
    this.restaurarRitmoAnimacoes();
    this.restaurarOponente();
    this.restaurarCameraSeNecessario();

    if (this.estadoFSM && typeof this.estadoFSM.finalizarUlt === "function") {
      this.estadoFSM.finalizarUlt();
    }
  }
  cancelar() {
    this.congelado = false;
    this.pararTremorFinal();
    if (this.timerFalhaUlt) {
      this.timerFalhaUlt.remove();
      this.timerFalhaUlt = null;
    }
    if (this.fnUpdateFrame) {
      this.personagem.sprite.off("animationupdate", this.fnUpdateFrame);
      this.fnUpdateFrame = null;
    }

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

    this.restaurarFundoFase();
    this.restaurarRitmoAnimacoes();
    this.restaurarOponente();
    this.restaurarCameraSeNecessario();
  }
}
