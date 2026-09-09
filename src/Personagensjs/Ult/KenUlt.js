import {
  obterAlvosCombate,
  registrarAtaqueEspecial
} from "../../Objetos/SistemaCombateEspecial.js";


// ============================================================
// AJUSTES
// ============================================================

const INTRO = {
  zoom: 1.6,
  tempoZoom: 200,
  tempoTravado: 900
};

const SHORYUKEN = {
  impulsoX1: 150,
  impulsoY1: -650,

  impulsoX2: 180,
  impulsoY2: -900,

  intervaloHit: 500,

  danoHit1: 4,
  danoHit2: 5,

  // primeiro shoryuken prende no combo
  knockHit1X: 35,
  knockHit1Y: -90,

  // hits normais do segundo
  knockHit2X: 45,
  knockHit2Y: -120,

  // último impacto
  danoFinal: 14,
  knockFinalX: 180,
  knockFinalY: -1500,

  hitStopNormal: 90,
  hitStopFinal: 650
};


const HITBOX = {
  largura: 80,
  altura: 145,
  offsetX: 30,
  offsetY: -100
};


const VFX_FRAMES = {
  "ken-pose1": null,
  "ken-pose2": null,
  "ken-pose3": null,
  "ken-launch": null,

  // efeitos reutilizados do Spider
  "2impact": 5,
  "3impact": 10,
  "4impact": 11,
  "finalImpact": 9
};


// ============================================================
// KEN ULT
// ============================================================

export default class KenUlt {

  constructor(personagem, configUlt, estadoFSM) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.estadoFSM = estadoFSM;

    this.direcao =
      personagem.sprite.flipX ? -1 : 1;

    this.cancelada = false;
    this.finalizada = false;

    this.etapa = "intro";
    this.numeroShoryuken = 0;

    this.funcaoCamOriginal = null;

    this.hitbox = null;
    this.alvosCarregados = new Set();
    this.ultimoHit = new Map();

    this.emHitStop = false;
    this.velocidadeKenAntesStop = null;
    this.alvoHitStop = null;

    this.fundoUlt = null;
    this.fundoOriginal = null;
    this.fundoOriginalVisivel = true;
    this.visibilidadePlataformas = [];

    this.efeitos = new Set();
    this.timers = new Set();

    this.fnAnimComplete = null;
  }


  // ============================================================
  // INÍCIO
  // ============================================================

  executar() {
    const sprite = this.personagem.sprite;
    const body = sprite?.body;

    if (!sprite?.active || !body) {
      this.estadoFSM.finalizarUlt();
      return;
    }

    this.cancelada = false;
    this.etapa = "intro";

    this.direcao =
      sprite.flipX ? -1 : 1;


    // ==========================================================
    // FUNDO
    // ==========================================================

    this.ativarFundoUltimate();


    // ==========================================================
    // TRAVA A CENA
    // ==========================================================

    this.travarCamera();

    this.scene.physics.pause();

    body.setVelocity(0, 0);


    // ==========================================================
    // KEN PARADO NO FRAME 0
    // ==========================================================

    sprite.anims.stop();

    sprite.setTexture(
      "Ken_ult",
      0
    );


    // ==========================================================
    // EFEITOS DE POSE
    // todos tocam UMA vez
    // ==========================================================

    this.criarVFX(
      "ken-pose1",
      sprite.x,
      sprite.y - 70,
      {
        escala: 0.85
      }
    );

    this.criarVFX(
      "ken-pose2",
      sprite.x,
      sprite.y - 65,
      {
        escala: 0.85
      }
    );

    this.criarVFX(
      "ken-pose3",
      sprite.x,
      sprite.y - 45,
      {
        escala: 0.9
      }
    );


    // ==========================================================
    // CAMERA
    // ==========================================================

    const cam =
      this.scene.cameras.main;

    const zoomOriginal =
      cam.zoom;

    cam.pan(
      sprite.x,
      sprite.y - 55,
      INTRO.tempoZoom,
      "Power2"
    );

    cam.zoomTo(
      zoomOriginal * INTRO.zoom,
      INTRO.tempoZoom
    );


    // ==========================================================
    // LIBERA INTRO
    // ==========================================================

    this.agendar(
      INTRO.tempoTravado,
      () => {

        if (this.cancelada) {
          return;
        }

        this.scene.physics.resume();

        this.restaurarCamera();

        this.iniciarPrimeiroShoryuken();
      }
    );
  }


  // ============================================================
  // PRIMEIRO SHORYUKEN
  // ============================================================

  iniciarPrimeiroShoryuken() {
    if (this.cancelada) return;

    this.numeroShoryuken = 1;
    this.etapa = "shoryuken1";

    this.ultimoHit.clear();
    this.alvosCarregados.clear();

    const sprite =
      this.personagem.sprite;

    const body =
      sprite.body;

    body.setAllowGravity(true);

    sprite.anims.play(
      "ken_ult",
      true
    );


    // faísca do lançamento
    this.criarLaunch();


    body.setVelocity(
      SHORYUKEN.impulsoX1 *
        this.direcao,

      SHORYUKEN.impulsoY1
    );


    this.ativarHitbox();


    this.aguardarFimAnimacao(
      () => this.finalizarPrimeiroShoryuken()
    );
  }


  finalizarPrimeiroShoryuken() {
    if (this.cancelada) return;

    this.destruirHitbox();

    /*
      Não joga os inimigos para longe.
      Quem foi pego fica perto do Ken para
      poder entrar no segundo Shoryuken.
    */

    for (
      const alvo of
      this.alvosCarregados
    ) {
      if (!alvo?.sprite?.body) continue;

      alvo.sprite.body.setVelocity(
        0,
        40
      );
    }


    // pequeno intervalo entre os dois
    this.agendar(
      180,
      () => {
        this.iniciarSegundoShoryuken();
      }
    );
  }


  // ============================================================
  // SEGUNDO SHORYUKEN
  // ============================================================

  iniciarSegundoShoryuken() {
    if (this.cancelada) return;

    this.numeroShoryuken = 2;
    this.etapa = "shoryuken2";

    this.ultimoHit.clear();

    const sprite =
      this.personagem.sprite;

    const body =
      sprite.body;


    sprite.anims.play(
      "ken_ult",
      true
    );


    this.criarLaunch();


    // SEGUNDO É MAIOR
    body.setVelocity(
      SHORYUKEN.impulsoX2 *
        this.direcao,

      SHORYUKEN.impulsoY2
    );


    this.ativarHitbox();


    this.aguardarFimAnimacao(
      () => this.finalizarSegundoShoryuken()
    );
  }


  finalizarSegundoShoryuken() {
    if (this.cancelada) return;

    this.destruirHitbox();

    /*
      Se ninguém foi pego no segundo,
      simplesmente termina.
      O impacto final acontece quando
      o segundo Shoryuken realmente acerta.
    */

    this.agendar(
      150,
      () => this.finalizarUlt()
    );
  }


  // ============================================================
  // UPDATE
  // ============================================================

  atualizar() {
    if (
      this.cancelada ||
      this.finalizada
    ) {
      return;
    }

    this.ajustarFundoNaCamera();

    if (this.emHitStop) {
      return;
    }

    this.atualizarHitbox();

    this.atualizarAlvosCarregados();
  }


  // ============================================================
  // HITBOX
  // ============================================================

  ativarHitbox() {
    if (this.hitbox) {
      return;
    }

    this.hitbox =
      this.scene.add.zone(
        0,
        0,
        HITBOX.largura,
        HITBOX.altura
      );

    this.scene.physics.add.existing(
      this.hitbox
    );

    this.hitbox.body.setAllowGravity(
      false
    );

    this.hitbox.body.setImmovable(
      true
    );

    this.hitbox.body.debugBodyColor =
      0xff0000;

    this.scene.camHUD?.ignore(
      this.hitbox
    );


    registrarAtaqueEspecial(
      this,
      this.hitbox,
      {
        categoria: "corpo",

        contraAtacarDono: true,

        aoAtingirAlvo:
          (alvo) =>
            this.processarAcerto(alvo)
      }
    );


    this.atualizarHitbox();
  }


  atualizarHitbox() {
    if (!this.hitbox?.active) {
      return;
    }

    const sprite =
      this.personagem.sprite;

    this.hitbox.setPosition(
      sprite.x +
        HITBOX.offsetX *
        this.direcao,

      sprite.y +
        HITBOX.offsetY
    );

    this.hitbox.body
      ?.updateFromGameObject();
  }


  destruirHitbox() {
    if (
      this.hitbox?.active
    ) {
      this.hitbox.destroy();
    }

    this.hitbox = null;
  }


  // ============================================================
  // ACERTO
  // ============================================================

  processarAcerto(alvo) {
    if (
      !alvo ||
      this.cancelada ||
      this.finalizada ||
      this.emHitStop
    ) {
      return;
    }


    const agora =
      this.scene.time.now;

    const ultimo =
      this.ultimoHit.get(alvo)
      ?? -Infinity;


    // UM HIT A CADA 0,5 SEGUNDO
    if (
      agora - ultimo <
      SHORYUKEN.intervaloHit
    ) {
      return;
    }


    this.ultimoHit.set(
      alvo,
      agora
    );


    if (
      this.numeroShoryuken === 1
    ) {
      this.acertoPrimeiro(
        alvo
      );

      return;
    }


    this.acertoSegundo(
      alvo
    );
  }


  // ============================================================
  // PRIMEIRO SHORYUKEN
  // ============================================================

  acertoPrimeiro(alvo) {
    this.alvosCarregados.add(
      alvo
    );


    alvo.receberDano(
      SHORYUKEN.danoHit1,

      {
        tipoSomImpacto:
          "light",

        knockbackX:
          SHORYUKEN.knockHit1X,

        knockbackY:
          SHORYUKEN.knockHit1Y,

        knockbackFixo:
          true,

        tumbling:
          false,

        // segura no combo
        hitstunFixoFrames:
          22,

        ignorarHitstunDecay:
          true
      },

      {
        direcao:
          this.direcao,

        x:
          this.personagem.sprite.x
      }
    );


    this.criarImpactoNormal(
      alvo
    );


    this.aplicarHitStop(
      alvo,
      SHORYUKEN.hitStopNormal
    );
  }


  // ============================================================
  // SEGUNDO SHORYUKEN
  // ============================================================

  acertoSegundo(alvo) {
    this.alvosCarregados.add(
      alvo
    );


    /*
      Enquanto o segundo Shoryuken ainda
      está subindo, os golpes continuam
      prendendo o inimigo.
    */

    alvo.receberDano(
      SHORYUKEN.danoHit2,

      {
        tipoSomImpacto:
          "heavy",

        knockbackX:
          SHORYUKEN.knockHit2X,

        knockbackY:
          SHORYUKEN.knockHit2Y,

        knockbackFixo:
          true,

        tumbling:
          false,

        hitstunFixoFrames:
          24,

        ignorarHitstunDecay:
          true
      },

      {
        direcao:
          this.direcao,

        x:
          this.personagem.sprite.x
      }
    );


    this.criarImpactoNormal(
      alvo
    );


    /*
      Se o Ken já está na parte alta da subida,
      transforma esse impacto no finalizador.

      Assim o último golpe do segundo Shoryuken
      é que joga o inimigo para cima.
    */

    const body =
      this.personagem.sprite.body;

    if (
      body.velocity.y > -350
    ) {
      this.executarImpactoFinal(
        alvo
      );

      return;
    }


    this.aplicarHitStop(
      alvo,
      SHORYUKEN.hitStopNormal
    );
  }


  // ============================================================
  // INIMIGO SEGUE O KEN
  // ============================================================

  atualizarAlvosCarregados() {
    if (this.emHitStop) {
      return;
    }

    const ken =
      this.personagem.sprite;

    for (
      const alvo of
      this.alvosCarregados
    ) {
      const sprite =
        alvo?.sprite;

      const body =
        sprite?.body;

      if (
        !sprite?.active ||
        !body
      ) {
        this.alvosCarregados.delete(
          alvo
        );

        continue;
      }


      /*
        Mesma ideia do Shoryuken normal:
        inimigo é puxado junto com o Ken.
      */

      const xDesejado =
        ken.x +
        32 *
        this.direcao;

      const yDesejado =
        ken.y - 35;


      const dx =
        xDesejado -
        sprite.x;

      const dy =
        yDesejado -
        sprite.y;


      body.setVelocity(
        (ken.body?.velocity.x ?? 0) +
          Phaser.Math.Clamp(
            dx * 10,
            -250,
            250
          ),

        (ken.body?.velocity.y ?? 0) +
          Phaser.Math.Clamp(
            dy * 9,
            -220,
            220
          )
      );
    }
  }


  // ============================================================
  // HIT STOP NORMAL
  // ============================================================

  aplicarHitStop(
    alvo,
    duracao
  ) {
    if (
      this.emHitStop ||
      this.cancelada
    ) {
      return;
    }


    const sprite =
      this.personagem.sprite;

    const body =
      sprite.body;


    this.emHitStop = true;


    this.velocidadeKenAntesStop = {
      x: body.velocity.x,
      y: body.velocity.y
    };


    sprite.anims.pause();

    alvo.sprite?.anims?.pause();


    body.setVelocity(
      0,
      0
    );


    alvo.sprite?.body
      ?.setVelocity(
        0,
        0
      );


    // pequena travada da câmera
    const cam =
      this.scene.cameras.main;

    cam.shake(
      duracao,
      0.004
    );


    this.agendar(
      duracao,
      () => {

        if (this.cancelada) {
          return;
        }


        sprite.anims.resume();

        alvo.sprite?.anims
          ?.resume();


        if (
          this.velocidadeKenAntesStop
        ) {
          body.setVelocity(
            this.velocidadeKenAntesStop.x,
            this.velocidadeKenAntesStop.y
          );
        }


        this.velocidadeKenAntesStop =
          null;

        this.emHitStop =
          false;
      }
    );
  }


  // ============================================================
  // IMPACTO FINAL
  // ============================================================

  executarImpactoFinal(alvo) {
    if (
      this.etapa ===
      "impactoFinal"
    ) {
      return;
    }

    this.etapa =
      "impactoFinal";


    const ken =
      this.personagem.sprite;

    const alvoSprite =
      alvo.sprite;

    const cam =
      this.scene.cameras.main;


    this.destruirHitbox();


    // efeito pesado igual ao Spider
    this.criarVFX(
      "finalImpact",
      alvoSprite.x,
      alvoSprite.y - 45,
      {
        escala: 1.15,

        rotacao:
          -Math.PI / 2
      }
    );


    // ==========================================================
    // CLOSE
    // ==========================================================

    this.travarCamera();

    cam.stopFollow();

    cam.centerOn(
      ken.x,
      ken.y - 70
    );

    cam.setZoom(
      3.0
    );


    // ==========================================================
    // CONGELA
    // ==========================================================

    this.scene.physics.pause();

    ken.anims.pause();

    alvoSprite.anims?.pause();


    cam.shake(
      350,
      0.012
    );


    /*
      Usa setTimeout aqui pelo mesmo motivo
      do SpiderUlt: se o relógio da cena for
      congelado, delayedCall também congela.
    */

    setTimeout(
      () => {

        if (
          this.cancelada ||
          !this.scene
        ) {
          return;
        }


        this.scene.physics.resume();


        ken.anims.resume();

        alvoSprite.anims
          ?.resume();


        // ======================================================
        // GRANDE LANÇAMENTO PARA CIMA
        // ======================================================

        alvoSprite.body
          ?.setAllowGravity(
            true
          );


        alvo.receberDano(
          SHORYUKEN.danoFinal,

          {
            tipoSomImpacto:
              "heavy",

            knockbackX:
              SHORYUKEN.knockFinalX,

            knockbackY:
              SHORYUKEN.knockFinalY,

            knockbackFixo:
              true,

            tumbling:
              true,

            hitstunFixoFrames:
              35,

            ignorarHitstunDecay:
              true
          },

          {
            direcao:
              this.direcao,

            x:
              ken.x
          }
        );


        this.alvosCarregados.delete(
          alvo
        );


        cam.setZoom(
          1
        );


        this.restaurarCamera();


        this.finalizarUlt();

      },

      SHORYUKEN.hitStopFinal
    );
  }


  // ============================================================
  // IMPACTO NORMAL
  // ============================================================

  criarImpactoNormal(alvo) {
    const lista = [
      "2impact",
      "3impact",
      "4impact"
    ];

    const textura =
      Phaser.Utils.Array
        .GetRandom(lista);


    this.criarVFX(
      textura,

      alvo.sprite.x,

      alvo.sprite.y - 45,

      {
        escala: 0.55
      }
    );
  }


  // ============================================================
  // EFEITO DE LANÇAMENTO
  // ============================================================

  criarLaunch() {
    const sprite =
      this.personagem.sprite;

    this.criarVFX(
      "ken-launch",

      sprite.x -
        5 *
        this.direcao,

      sprite.y - 10,

      {
        escala: 0.9
      }
    );
  }


  // ============================================================
  // VFX
  // ============================================================

  criarVFX(
    textura,
    x,
    y,
    opcoes = {}
  ) {
    if (
      !this.scene.textures
        .exists(textura)
    ) {
      return null;
    }


    const animKey =
      `ken_ult_vfx_${textura}`;


    if (
      !this.scene.anims
        .exists(animKey)
    ) {

      const frameTotal =
        this.scene.textures
          .get(textura)
          .frameTotal;


      const ultimoConfigurado =
        VFX_FRAMES[textura];


      const ultimoFrame =
        Number.isInteger(
          ultimoConfigurado
        )
          ? ultimoConfigurado
          : Math.max(
              0,
              frameTotal - 2
            );


      this.scene.anims.create({
        key: animKey,

        frames:
          this.scene.anims
            .generateFrameNumbers(
              textura,
              {
                start: 0,
                end: ultimoFrame
              }
            ),

        frameRate: 28,

        repeat: 0
      });
    }


    const efeito =
      this.scene.add.sprite(
        x,
        y,
        textura,
        0
      );


    efeito.setOrigin(
      opcoes.origemX ?? 0.5,
      opcoes.origemY ?? 0.5
    );


    efeito.setScale(
      opcoes.escala ?? 0.85
    );


    efeito.setDepth(
      this.personagem.sprite.depth +
      2
    );


    efeito.setFlipX(
      this.personagem.sprite.flipX
    );


    efeito.setRotation(
      opcoes.rotacao ?? 0
    );


    // MESMO FILTRO DAS OUTRAS ULTS
    efeito.setBlendMode(
      Phaser.BlendModes.ADD
    );


    this.scene.camHUD
      ?.ignore(efeito);


    this.efeitos.add(
      efeito
    );


    efeito.once(
      "destroy",
      () =>
        this.efeitos.delete(
          efeito
        )
    );


    efeito.once(
      "animationcomplete",
      () => {
        if (efeito.active) {
          efeito.destroy();
        }
      }
    );


    efeito.play(
      animKey
    );


    return efeito;
  }


  // ============================================================
  // ANIMAÇÃO PRINCIPAL
  // ============================================================

  aguardarFimAnimacao(callback) {
    const sprite =
      this.personagem.sprite;


    if (this.fnAnimComplete) {
      sprite.off(
        "animationcomplete-ken_ult",
        this.fnAnimComplete
      );
    }


    this.fnAnimComplete = () => {

      sprite.off(
        "animationcomplete-ken_ult",
        this.fnAnimComplete
      );


      this.fnAnimComplete =
        null;


      callback();
    };


    sprite.once(
      "animationcomplete-ken_ult",
      this.fnAnimComplete
    );
  }


  // ============================================================
  // FUNDO IGUAL SPIDERULT
  // ============================================================

  ativarFundoUltimate() {
    if (
      this.fundoUlt?.active ||
      !this.scene.textures
        .exists("ultimateback")
    ) {
      return;
    }


    const fundoFase =
      this.scene.mapaAtual
        ?.imagemFundo;


    this.fundoOriginal =
      fundoFase ?? null;


    this.fundoOriginalVisivel =
      fundoFase?.visible ?? true;


    if (
      !this.scene.anims
        .exists(
          "ken_ultimateback"
        )
    ) {
      this.scene.anims.create({
        key:
          "ken_ultimateback",

        frames:
          this.scene.anims
            .generateFrameNumbers(
              "ultimateback",
              {
                start: 0,
                end: 115
              }
            ),

        frameRate: 36,

        repeat: -1
      });
    }


    this.fundoUlt =
      this.scene.add.sprite(
        0,
        0,
        "ultimateback",
        0
      );


    this.fundoUlt.setDepth(
      (fundoFase?.depth ?? -100)
      + 1
    );


    this.fundoUlt.setScrollFactor(
      1
    );


    this.fundoUlt.play(
      "ken_ultimateback"
    );


    fundoFase?.setVisible(
      false
    );


    const plataformas =
      this.scene.mapaAtual
        ?.plataformas
        ?.getChildren?.()
      ?? [];


    this.visibilidadePlataformas =
      plataformas.map(
        plataforma => ({
          plataforma,
          visivel:
            plataforma.visible
        })
      );


    plataformas.forEach(
      plataforma =>
        plataforma.setVisible(
          false
        )
    );


    this.scene.camHUD
      ?.ignore(
        this.fundoUlt
      );


    this.ajustarFundoNaCamera();
  }


  ajustarFundoNaCamera() {
    if (
      !this.fundoUlt?.active
    ) {
      return;
    }


    const cam =
      this.scene.cameras.main;


    this.fundoUlt.setPosition(
      cam.midPoint.x,
      cam.midPoint.y
    );


    this.fundoUlt.setDisplaySize(
      cam.width / cam.zoom,
      cam.height / cam.zoom
    );
  }


  restaurarFundo() {
    if (
      this.fundoOriginal?.active
    ) {
      this.fundoOriginal.setVisible(
        this.fundoOriginalVisivel
      );
    }


    this.fundoUlt?.destroy();

    this.fundoUlt = null;


    for (
      const item of
      this.visibilidadePlataformas
    ) {
      if (
        item.plataforma?.active
      ) {
        item.plataforma.setVisible(
          item.visivel
        );
      }
    }


    this.visibilidadePlataformas =
      [];
  }


  // ============================================================
  // CAMERA
  // ============================================================

  travarCamera() {
    if (
      !this.funcaoCamOriginal &&
      typeof this.scene
        .atualizarCamera ===
        "function"
    ) {
      this.funcaoCamOriginal =
        this.scene.atualizarCamera;


      this.scene.atualizarCamera =
        () => {};
    }
  }


  restaurarCamera() {
    if (
      this.funcaoCamOriginal
    ) {
      this.scene.atualizarCamera =
        this.funcaoCamOriginal;


      this.funcaoCamOriginal =
        null;
    }
  }


  // ============================================================
  // TIMER
  // ============================================================

  agendar(
    tempo,
    callback
  ) {
    const timer =
      this.scene.time.delayedCall(
        tempo,
        () => {
          this.timers.delete(
            timer
          );

          if (
            !this.cancelada
          ) {
            callback();
          }
        }
      );


    this.timers.add(
      timer
    );


    return timer;
  }


  // ============================================================
  // FINALIZAÇÃO
  // ============================================================

  finalizarUlt() {
    if (
      this.finalizada
    ) {
      return;
    }


    this.finalizada =
      true;


    this.destruirHitbox();


    this.restaurarCamera();

    this.restaurarFundo();


    this.personagem.sprite.body
      ?.setAllowGravity(
        true
      );


    this.alvosCarregados.clear();


    if (
      this.estadoFSM &&
      typeof this.estadoFSM
        .finalizarUlt ===
        "function"
    ) {
      this.estadoFSM
        .finalizarUlt();
    }
  }


  // ============================================================
  // CANCELAMENTO
  // ============================================================

  cancelar() {
    this.cancelada = true;


    this.scene.physics.resume();


    this.destruirHitbox();


    this.timers.forEach(
      timer =>
        timer.remove(false)
    );

    this.timers.clear();


    if (
      this.fnAnimComplete
    ) {
      this.personagem.sprite.off(
        "animationcomplete-ken_ult",
        this.fnAnimComplete
      );

      this.fnAnimComplete =
        null;
    }


    this.personagem.sprite
      .anims?.resume();


    this.alvoHitStop
      ?.sprite
      ?.anims
      ?.resume();


    this.efeitos.forEach(
      efeito => {
        if (efeito?.active) {
          efeito.destroy();
        }
      }
    );

    this.efeitos.clear();


    this.restaurarFundo();

    this.restaurarCamera();


    this.personagem.sprite.body
      ?.setAllowGravity(
        true
      );


    for (
      const alvo of
      this.alvosCarregados
    ) {
      alvo?.sprite?.body
        ?.setAllowGravity(
          true
        );
    }


    this.alvosCarregados.clear();
  }
}