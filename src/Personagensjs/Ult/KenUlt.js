import { conduzirAlvoShoryuken } from "../Specials/Ken/shoryuken.js";
import {
  obterAlvosCombate,
  registrarAtaqueEspecial
} from "../../Objetos/SistemaCombateEspecial.js";


const INTRO = {
  zoom: 1.9,
  tempoZoom: 250,
  duracaoPose: 650,
  pausaFinal: 250
};


const SHORYUKEN = {
  impulsoX1: 350,
  impulsoY1: -680,

  impulsoX2: 370,
  impulsoY2: -740,

  gravidadeExtra: 900,
  frameRate: 30,
  danoMaximo: 50,

  dano1: 12,
  dano2: 12,

  knock1X: 25,
  knock1Y: -45,

  knock2X: 30,
  knock2Y: -60,

  knockFinalX: 650,
  knockFinalY: -1700,

  hitStop: 180,
  freezeFinal: 1300
};


const HITBOX = {
  largura: 95,
  altura: 115,
  offsetX: 25,
  offsetY: -65
};


const FRAME_HITBOX_INICIO = 4;
const FRAME_HITBOX_FIM = 22;
const FRAME_FINAL = 18;
const FRAME_PULO = 7;
const FRAMES_DOS_HITS = [4, 11, FRAME_FINAL];


const VFX_FRAMES = {
  "ken-pose1": null,
  "ken-pose2": null,
  "ken-pose3": null,
  "ken-launch": null,

  "2impact": 5,
  "3impact": 10,
  "4impact": 11,
  "finalImpact": 9
};


export default class KenUlt {

  constructor(personagem, configUlt, estadoFSM) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.config = configUlt;
    this.estadoFSM = estadoFSM;

    this.direcao =
      personagem.sprite.flipX ? -1 : 1;

    this.oponente =
      obterAlvosCombate(personagem)[0] ?? null;

    this.cancelada = false;
    this.finalizada = false;

    this.numeroShoryuken = 0;
    this.frameUltAtual = 0;

    this.hitbox = null;

    this.ultimoHit = new Map();
    this.alvosCarregados = new Set();
    this.danoPorAlvo = new Map();
    this.corposCongelados = new Map();
    this.aguardandoPouso = false;
    this.origemOriginal = null;
    this.puloIniciado = false;

    this.emHitStop = false;

    this.velocidadeKenAntesStop = null;
    this.velocidadeAlvoAntesStop = null;

    this.funcaoCamOriginal = null;
    this.zoomOriginal = null;

    this.estadoOponenteSalvo = null;

    this.fundoUlt = null;
    this.fundoOriginal = null;
    this.fundoOriginalVisivel = true;
    this.visibilidadePlataformas = [];

    this.efeitos = new Set();
    this.timers = new Set();

    this.fnAnimUpdate = null;
    this.fnAnimComplete = null;

    this.launchCriado = false;

    this.impactoFinalAtivado = false;
  }


  // ============================================================
  // INÍCIO
  // ============================================================

  executar() {
    const sprite =
      this.personagem.sprite;

    const body =
      sprite?.body;

    if (!sprite?.active || !body) {
      this.estadoFSM.finalizarUlt();
      return;
    }

    this.cancelada = false;
    this.origemOriginal = { x: sprite.originX, y: sprite.originY };
    // Compensa o espaco reservado ao fogo abaixo dos pes no spritesheet.
    sprite.setOrigin(0.5, 155 / 233);
    this.personagem.atualizarOffsetFisica();
    body.updateFromGameObject();

    this.direcao =
      sprite.flipX ? -1 : 1;


    this.ativarFundoUltimate();

    this.travarCamera();

    this.bloquearOponente();

    this.scene.physics.pause();

    body.setVelocity(0, 0);


    // Ken parado no frame 0 da Ult
    sprite.anims.stop();

    sprite.setTexture(
      "Ken_ult",
      0
    );


    const cam =
      this.scene.cameras.main;

    this.zoomOriginal =
      cam.zoom;


    cam.pan(
      sprite.x,
      sprite.y - 70,
      INTRO.tempoZoom,
      "Power2"
    );


    cam.zoomTo(
      this.zoomOriginal *
        INTRO.zoom,

      INTRO.tempoZoom
    );


    // espera o close chegar antes das poses
    this.agendar(
      INTRO.tempoZoom,
      () => {
        this.tocarPose1();
      }
    );
  }


  // ============================================================
  // POSES
  // ============================================================

  tocarPose1() {
    if (this.cancelada) return;

    const sprite =
      this.personagem.sprite;

    this.criarVFX(
      "ken-pose1",

      sprite.x,
      sprite.y - 70,

      {
        escala: 1.8,
        duracao: INTRO.duracaoPose,

        aoCompletar:
          () => this.tocarPose2()
      }
    );
  }


  tocarPose2() {
    if (this.cancelada) return;

    const sprite =
      this.personagem.sprite;

    this.criarVFX(
      "ken-pose2",

      sprite.x,
      sprite.y - 65,

      {
        escala: 1.8,
        duracao: INTRO.duracaoPose,

        aoCompletar:
          () => this.tocarPose3()
      }
    );
  }


  tocarPose3() {
    if (this.cancelada) return;

    const sprite =
      this.personagem.sprite;

    this.criarVFX(
      "ken-pose3",

      sprite.x,
      sprite.y - 55,

      {
        escala: 1.9,
        duracao: INTRO.duracaoPose,

        aoCompletar: () => {

          this.agendar(
            INTRO.pausaFinal,
            () => this.liberarIntro()
          );
        }
      }
    );
  }


  liberarIntro() {
    if (this.cancelada) return;

    const cam =
      this.scene.cameras.main;


    this.scene.physics.resume();

    this.restaurarOponente();


    if (this.zoomOriginal !== null) {
      cam.setZoom(
        this.zoomOriginal
      );
    }


    this.restaurarCamera();


    this.iniciarPrimeiroShoryuken();
  }


  // ============================================================
  // PRIMEIRO SHORYUKEN
  // ============================================================

  iniciarPrimeiroShoryuken() {
    if (this.cancelada) return;

    this.numeroShoryuken = 1;

    this.ultimoHit.clear();
    this.danoPorAlvo.clear();
    this.ultimoAlvoDoImpulso = null;
    this.frameUltAtual = 2;
    this.alvosCarregados.clear();

    this.launchCriado = false;

    this.impactoFinalAtivado = false;


    const sprite =
      this.personagem.sprite;

    const body =
      sprite.body;


    body.setAllowGravity(true);


    this.ativarControleAnimacao();


    sprite.anims.play(
      { key: "ken_ult", frameRate: SHORYUKEN.frameRate },
      true
    );


    this.puloIniciado = false;
    body.setVelocity(body.velocity.x, 0);


    this.aguardarFimAnimacao(
      () =>
        this.finalizarPrimeiroShoryuken()
    );
  }


  finalizarPrimeiroShoryuken() {
    if (this.cancelada) return;
    this.destruirHitbox();
    this.aguardandoPouso = true;
    if (this.personagem.sprite.body.blocked.down) this.iniciarSegundoShoryuken();
  }


  // ============================================================
  // SEGUNDO SHORYUKEN
  // ============================================================

  iniciarSegundoShoryuken() {
    if (this.cancelada) return;

    this.numeroShoryuken = 2;
    this.aguardandoPouso = false;

    this.ultimoHit.clear();
    this.danoPorAlvo.clear();
    this.ultimoAlvoDoImpulso = null;
    this.frameUltAtual = 2;

    this.launchCriado = false;

    this.impactoFinalAtivado = false;


    const sprite =
      this.personagem.sprite;

    const body =
      sprite.body;


    sprite.anims.play(
      { key: "ken_ult", frameRate: SHORYUKEN.frameRate },
      true
    );


    this.puloIniciado = false;
    body.setVelocity(0, 0);


    this.aguardarFimAnimacao(
      () => {

        if (
          !this.impactoFinalAtivado
        ) {
          if (this.ultimoAlvoDoImpulso?.sprite?.active) this.executarImpactoFinal(this.ultimoAlvoDoImpulso);
          else this.finalizarUlt();
        }
      }
    );
  }


  // ============================================================
  // CONTROLE DA ANIMAÇÃO
  // ============================================================

  ativarControleAnimacao() {
    if (this.fnAnimUpdate) return;


    const sprite =
      this.personagem.sprite;


    this.fnAnimUpdate =
      (animacao, frame) => {
        if (this.cancelada || this.finalizada || this.impactoFinalAtivado) return;

        if (
          animacao.key !==
          "ken_ult"
        ) {
          return;
        }


        this.frameUltAtual =
          Number(
            frame.textureFrame ??
            frame.index
          );


        if (!this.puloIniciado && this.frameUltAtual >= FRAME_PULO) {
          this.puloIniciado = true;
          const segundo = this.numeroShoryuken === 2;
          sprite.body.setVelocity(
            (segundo ? SHORYUKEN.impulsoX2 : SHORYUKEN.impulsoX1) * this.direcao,
            segundo ? SHORYUKEN.impulsoY2 : SHORYUKEN.impulsoY1
          );
        }
        if (this.numeroShoryuken === 1 && this.frameUltAtual >= FRAME_FINAL) {
          for (const alvo of this.alvosCarregados) {
            if (alvo.sprite?.active) this.processarAcerto(alvo);
          }
        }
        if (this.numeroShoryuken === 2 && this.frameUltAtual >= FRAME_FINAL) {
          const alvo = [...this.alvosCarregados].find(alvo => alvo.sprite?.active)
            ?? this.ultimoAlvoDoImpulso;
          if (alvo) {
            this.executarImpactoFinal(alvo);
            return;
          }
        }

        if (
          !this.launchCriado &&
          this.frameUltAtual >= FRAME_PULO
        ) {
          this.launchCriado = true;

          this.criarLaunch();
        }


        // Hitbox só durante os frames do golpe
        if (
          this.frameUltAtual >=
            FRAME_HITBOX_INICIO &&

          this.frameUltAtual <=
            FRAME_HITBOX_FIM
        ) {

          this.ativarHitbox();

        } else {

          this.destruirHitbox();
        }
      };


    sprite.on(
      "animationupdate",
      this.fnAnimUpdate
    );
  }


  // ============================================================
  // HITBOX
  // ============================================================

  ativarHitbox() {
    if (this.hitbox) return;


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


    this.hitbox.body
      .setAllowGravity(false);


    this.hitbox.body
      .setImmovable(true);


    this.hitbox.body.debugBodyColor =
      0xff0000;


    this.scene.camHUD
      ?.ignore(
        this.hitbox
      );


    registrarAtaqueEspecial(
      this,

      this.hitbox,

      {
        categoria: "corpo",

        contraAtacarDono: true,

        aoAtingirAlvo:
          alvo =>
            this.processarAcerto(
              alvo
            )
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
  // HIT
  // ============================================================

  processarAcerto(alvo) {
    if (!alvo || this.cancelada || this.finalizada || this.emHitStop || this.impactoFinalAtivado) return;
    const indice = FRAMES_DOS_HITS.reduce(
      (atual, frame, i) => this.frameUltAtual >= frame ? i : atual, -1
    );
    if (indice < 0 || (this.ultimoHit.get(alvo) ?? -1) >= indice) return;
    this.ultimoHit.set(alvo, indice);
    if (this.numeroShoryuken === 2 && this.frameUltAtual >= FRAME_FINAL) {
      if (!alvo.invulneravel && alvo.maquinaEstados?.estadoAtual?.nome !== 'guard') {
        this.executarImpactoFinal(alvo);
      }
      return;
    }
    if (this.numeroShoryuken === 1) this.acertoPrimeiro(alvo);
    else this.acertoSegundo(alvo);
  }

  aplicarDanoLimitado(alvo, quantidade, propriedades, origem) {
    const acumulado = this.danoPorAlvo.get(alvo) ?? 0;
    const dano = Math.min(quantidade, Math.max(0, SHORYUKEN.danoMaximo - acumulado));
    if (dano <= 0) return true;
    const bloqueado = alvo.receberDano(dano, propriedades, origem);
    if (!bloqueado) this.danoPorAlvo.set(alvo, acumulado + dano);
    return bloqueado;
  }


  // ============================================================
  // HIT PRIMEIRO SHORYUKEN
  // ============================================================

  acertoPrimeiro(alvo) {
    const bloqueado = this.aplicarDanoLimitado(alvo,
      this.frameUltAtual >= FRAME_FINAL
        ? SHORYUKEN.danoMaximo - (this.danoPorAlvo.get(alvo) ?? 0)
        : SHORYUKEN.dano1,

      {
        tipoSomImpacto:
          "light",

        knockbackX:
          SHORYUKEN.knock1X,

        knockbackY:
          SHORYUKEN.knock1Y,

        knockbackFixo:
          true,

        tumbling:
          false,

        hitstunFixoFrames:
          75,

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


    if (bloqueado) return;
    this.ultimoAlvoDoImpulso = alvo;
    this.prenderAlvo(alvo);
    this.tocarSomImpacto(this.numeroShoryuken === 1 ? "light" : "heavy");
    this.criarImpactoNormal(alvo);


    this.aplicarHitStop(
      alvo
    );
  }


  // ============================================================
  // HIT SEGUNDO SHORYUKEN
  // ============================================================

  acertoSegundo(alvo) {
    // Último hit do segundo
    if (
      this.frameUltAtual >=
      FRAME_FINAL
    ) {

      this.executarImpactoFinal(
        alvo
      );

      return;
    }


    const bloqueado = this.aplicarDanoLimitado(alvo,
      SHORYUKEN.dano2,

      {
        tipoSomImpacto:
          "heavy",

        knockbackX:
          SHORYUKEN.knock2X,

        knockbackY:
          SHORYUKEN.knock2Y,

        knockbackFixo:
          true,

        tumbling:
          false,

        hitstunFixoFrames:
          75,

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


    if (bloqueado) return;
    this.ultimoAlvoDoImpulso = alvo;
    this.prenderAlvo(alvo);
    this.tocarSomImpacto(this.numeroShoryuken === 1 ? "light" : "heavy");
    this.criarImpactoNormal(alvo);


    this.aplicarHitStop(
      alvo
    );
  }


  // ============================================================
  // SEGURA INIMIGO NO COMBO
  // ============================================================

  prenderAlvo(alvo) {
    this.alvosCarregados.add(alvo);
  }

  liberarAlvos() {
    this.alvosCarregados.clear();
  }

  atualizarAlvosCarregados() {
    if (this.emHitStop || this.impactoFinalAtivado) return;
    for (const alvo of this.alvosCarregados) {
      if (!alvo.sprite?.active || !alvo.sprite.body || alvo.invulneravel) {
        this.alvosCarregados.delete(alvo);
        continue;
      }
      conduzirAlvoShoryuken(this.personagem.sprite, alvo.sprite, this.direcao);
      // Mantem o hitstun entre os saltos sem desligar a maquina de estados.
      const estado = alvo.maquinaEstados?.estadoAtual;
      if (estado?.nome === 'dano') {
        estado.duracaoStun = Math.max(estado.duracaoStun,
          this.scene.time.now - estado.tempoInicial + 350);
      }
    }
  }

  congelarCorpo(sprite, alvo = null) {
    if (!sprite?.body || this.corposCongelados.has(sprite)) return;
    this.corposCongelados.set(sprite, {
      moves: sprite.body.moves,
      x: sprite.body.velocity.x,
      y: sprite.body.velocity.y,
      animacaoPausada: sprite.anims.isPaused,
      alvo,
      updateFSM: alvo?.maquinaEstados?.update,
      inicio: this.scene.time.now
    });
    sprite.body.moves = false;
    sprite.body.setVelocity(0, 0);
    sprite.anims.pause();
    if (alvo?.maquinaEstados) alvo.maquinaEstados.update = () => {};
  }

  descongelarCorpos() {
    for (const [sprite, salvo] of this.corposCongelados) {
      if (salvo.alvo?.maquinaEstados) {
        salvo.alvo.maquinaEstados.update = salvo.updateFSM;
        const estado = salvo.alvo.maquinaEstados.estadoAtual;
        if (estado?.nome === 'dano') estado.tempoInicial += this.scene.time.now - salvo.inicio;
      }
      if (!sprite.active || !sprite.body) continue;
      sprite.body.moves = salvo.moves;
      sprite.body.setVelocity(salvo.x, salvo.y);
      if (!salvo.animacaoPausada) sprite.anims.resume();
    }
    this.corposCongelados.clear();
  }

  // ============================================================
  // HIT STOP NORMAL
  // ============================================================

  aplicarHitStop(alvo) {
    if (this.emHitStop || this.cancelada) return;
    this.emHitStop = true;
    this.travarCamera();
    this.congelarCorpo(this.personagem.sprite);
    this.congelarCorpo(alvo.sprite, alvo);
    this.agendar(SHORYUKEN.hitStop, () => {
      if (this.impactoFinalAtivado) return;
      this.descongelarCorpos();
      this.restaurarCamera();
      this.emHitStop = false;
    });
  }


  // ============================================================
  // IMPACTO FINAL
  // ============================================================

  executarImpactoFinal(alvo) {
    if (this.impactoFinalAtivado || this.cancelada || !alvo.sprite?.active) return;
    this.impactoFinalAtivado = true;
    this.destruirHitbox();
    this.travarCamera();
    const ken = this.personagem.sprite;
    const cam = this.scene.cameras.main;
    this.zoomAntesFinal = cam.zoom;
    this.congelarCorpo(ken);
    this.congelarCorpo(alvo.sprite, alvo);
    // Mesmo close direto do SpiderUlt: nao depende do termino de pan/zoomTo.
    cam.panEffect?.reset();
    cam.zoomEffect?.reset();
    cam.stopFollow();
    cam.setZoom(3.2);
    cam.centerOn((ken.x + alvo.sprite.x) / 2, (ken.y + alvo.sprite.y) / 2 - 65);
    this.ajustarFundoNaCamera();
    // Duas passadas aditivas, origem e deslocamentos iguais ao SpiderUlt.
    for (let camada = 0; camada < 2; camada++) {
      this.criarVFX('finalImpact', alvo.sprite.x - 20 * this.direcao, alvo.sprite.y - 70, {
        origemX: 0.75, escala: 1.15, direcao: 1,
        rotacao: Math.atan2(SHORYUKEN.knockFinalY, SHORYUKEN.knockFinalX * this.direcao)
      });
    }
    this.tocarSomImpacto('heavy', 0.45);
    this.clockAntesFinal = this.scene.time.paused;
    this.scene.physics.pause();
    this.scene.time.paused = true;
    this.iniciarTremorFinal(cam);
    // Timer real: o clock do Phaser esta congelado, como na ult do Aranha.
    this.agendarFinal(SHORYUKEN.freezeFinal, () => {
      this.pararTremorFinal();
      cam.resetFX();
      this.scene.time.paused = this.clockAntesFinal;
      this.clockAntesFinal = null;
      this.scene.physics.resume();
      this.descongelarCorpos();
      this.liberarAlvos();
      if (alvo.sprite?.active && alvo.sprite.body) {
        // Completa os 50 deste impulso mesmo se algum acerto intermediario falhou.
        const danoRestante = SHORYUKEN.danoMaximo - (this.danoPorAlvo.get(alvo) ?? 0);
        this.aplicarDanoLimitado(alvo, danoRestante, {
          tipoSomImpacto: 'heavy',
          knockbackX: SHORYUKEN.knockFinalX,
          knockbackY: SHORYUKEN.knockFinalY,
          knockbackFixo: true,
          tumbling: true,
          hitstunFixoFrames: 60,
          ignorarHitstunDecay: true
        }, { direcao: this.direcao, x: ken.x });
      }
      cam.setZoom(this.zoomAntesFinal);
      this.restaurarCamera();
      this.finalizarUlt();
    });
  }


  // ============================================================
  // EFEITOS DE IMPACTO
  // ============================================================

  tocarSomImpacto(tipo, volume = 0.22) {
    const sons = this.personagem.sons?.[tipo];
    if (sons) this.personagem.tocarSomSorteado(sons, { volume });
  }

  agendarFinal(tempo, callback) {
    this.timerFinal = setTimeout(() => {
      this.timerFinal = null;
      if (!this.cancelada && !this.finalizada) callback();
    }, tempo);
  }

  iniciarTremorFinal(cam) {
    this.pararTremorFinal();
    const inicio = performance.now();
    this.posCameraAntesTremor = { x: cam.scrollX, y: cam.scrollY };
    this.intervaloTremorFinal = setInterval(() => {
      const progresso = Math.min((performance.now() - inicio) / 800, 1);
      const amplitude = (150 / cam.zoom) * Math.pow(1 - progresso, 0.65);
      const base = this.posCameraAntesTremor;
      cam.setScroll(
        base.x + Phaser.Math.FloatBetween(-amplitude, amplitude),
        base.y + Phaser.Math.FloatBetween(-amplitude, amplitude)
      );
      this.ajustarFundoNaCamera();
      if (progresso >= 1) this.pararTremorFinal();
    }, 45);
  }

  pararTremorFinal() {
    if (this.intervaloTremorFinal) clearInterval(this.intervaloTremorFinal);
    this.intervaloTremorFinal = null;
    if (this.posCameraAntesTremor) {
      const { x, y } = this.posCameraAntesTremor;
      this.scene.cameras.main.setScroll(x, y);
      this.posCameraAntesTremor = null;
    }
  }

  criarImpactoNormal(alvo) {
    const textura =
      Phaser.Utils.Array.GetRandom(
        [
          "2impact",
          "3impact",
          "4impact"
        ]
      );


    this.criarVFX(
      textura,

      alvo.sprite.x,
      alvo.sprite.y - 45,

      {
        escala: 0.55
      }
    );
  }


  criarLaunch() {
    const sprite =
      this.personagem.sprite;


    this.criarVFX(
      "ken-launch",

      sprite.x -
        5 *
        this.direcao,

      sprite.y - 25,

      {
        escala: 0.95
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
      !this.scene.textures.exists(
        textura
      )
    ) {

      console.warn(
        `[KenUlt] textura não encontrada: ${textura}`
      );

      opcoes.aoCompletar?.();

      return null;
    }


    const animKey =
      `ken_ult_vfx_${textura}`;


    if (
      !this.scene.anims.exists(
        animKey
      )
    ) {

      const texturaObj =
        this.scene.textures.get(
          textura
        );


      const frameTotal =
        texturaObj.frameTotal;


      const configurado =
        VFX_FRAMES[textura];


      const ultimoFrame =
        Number.isInteger(
          configurado
        )

          ? configurado

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
      opcoes.direcao !== undefined ? opcoes.direcao < 0 : this.personagem.sprite.flipX
    );


    efeito.setRotation(
      opcoes.rotacao ?? 0
    );


    efeito.setBlendMode(
      Phaser.BlendModes.ADD
    );


    this.scene.camHUD
      ?.ignore(
        efeito
      );


    this.efeitos.add(
      efeito
    );


    efeito.once(
      "destroy",
      () => {
        this.efeitos.delete(
          efeito
        );
      }
    );


    efeito.once(
      "animationcomplete",
      () => {

        opcoes.aoCompletar?.();


        if (efeito.active) {
          efeito.destroy();
        }
      }
    );


    efeito.play(
      animKey
    );


    if (
      opcoes.duracao &&
      efeito.anims.currentAnim
    ) {

      efeito.anims.timeScale =
        efeito.anims.currentAnim.duration /
        opcoes.duracao;
    }


    return efeito;
  }


  // ============================================================
  // FIM DA ANIMAÇÃO
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


    this.fnAnimComplete =
      () => {

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
  // OPONENTE TRAVADO NO INTRO
  // ============================================================

  bloquearOponente() {
    const alvo =
      this.oponente;

    if (!alvo) return;


    this.estadoOponenteSalvo = {
      podeMover:
        alvo.podeMover,

      podeAtacar:
        alvo.podeAtacar,

      podeUsarAtaque:
        alvo.podeUsarAtaque,

      podeUsarSpecial:
        alvo.podeUsarSpecial,

      updateFSM:
        alvo.maquinaEstados?.update
    };


    alvo.podeMover = false;
    alvo.podeAtacar = false;


    if (
      typeof alvo.podeUsarAtaque ===
      "function"
    ) {

      alvo.podeUsarAtaque =
        () => false;
    }


    if (
      typeof alvo.podeUsarSpecial ===
      "function"
    ) {

      alvo.podeUsarSpecial =
        () => false;
    }


    if (
      alvo.maquinaEstados
    ) {

      alvo.maquinaEstados.update =
        () => {};
    }


    alvo.sprite?.body
      ?.setVelocity(
        0,
        0
      );


    alvo.sprite?.anims
      ?.pause();
  }


  restaurarOponente() {
    const alvo =
      this.oponente;

    const salvo =
      this.estadoOponenteSalvo;


    if (
      !alvo ||
      !salvo
    ) {
      return;
    }


    alvo.podeMover =
      salvo.podeMover;


    alvo.podeAtacar =
      salvo.podeAtacar;


    if (
      salvo.podeUsarAtaque
    ) {

      alvo.podeUsarAtaque =
        salvo.podeUsarAtaque;
    }


    if (
      salvo.podeUsarSpecial
    ) {

      alvo.podeUsarSpecial =
        salvo.podeUsarSpecial;
    }


    if (
      alvo.maquinaEstados &&
      salvo.updateFSM
    ) {

      alvo.maquinaEstados.update =
        salvo.updateFSM;
    }


    alvo.sprite?.anims
      ?.resume();


    this.estadoOponenteSalvo =
      null;
  }


  // ============================================================
  // FUNDO
  // ============================================================

  ativarFundoUltimate() {
    if (
      this.fundoUlt?.active ||
      !this.scene.textures.exists(
        "ultimateback"
      )
    ) {
      return;
    }


    const fundo =
      this.scene.mapaAtual
        ?.imagemFundo;


    this.fundoOriginal =
      fundo ?? null;


    this.fundoOriginalVisivel =
      fundo?.visible ?? true;


    if (
      !this.scene.anims.exists(
        "ken_ultimateback"
      )
    ) {

      this.scene.anims.create({
        key: "ken_ultimateback",

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
      (fundo?.depth ?? -100) + 1
    );


    this.fundoUlt
      .setScrollFactor(1);


    this.fundoUlt.play(
      "ken_ultimateback"
    );


    fundo?.setVisible(
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
        plataforma.setVisible(false)
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


    if (
      this.emHitStop ||
      this.impactoFinalAtivado
    ) {
      return;
    }


    const body = this.personagem.sprite.body;
    if (this.puloIniciado) {
      body.setGravityY(SHORYUKEN.gravidadeExtra);
      // Desacelera gradualmente; conserva um pequeno avanco na descida.
      const delta = Math.min(this.scene.game.loop.delta, 50) / 1000;
      const velocidadeAlvo = body.blocked.down ? 0 : body.velocity.y >= 0 ? 65 * this.direcao : body.velocity.x;
      body.setVelocityX(velocidadeAlvo + (body.velocity.x - velocidadeAlvo) * Math.exp(-8 * delta));
    }
    if (this.aguardandoPouso && body.blocked.down) this.iniciarSegundoShoryuken();
    this.atualizarHitbox();
    this.atualizarAlvosCarregados();
  }


  // ============================================================
  // FINAL
  // ============================================================

  finalizarUlt() {
    if (
      this.finalizada
    ) {
      return;
    }


    this.finalizada = true;


    this.destruirHitbox();


    this.restaurarOponente();

    this.restaurarCamera();

    this.restaurarFundo();


    this.personagem.sprite.body
      ?.setAllowGravity(
        true
      );


    this.liberarAlvos();


    if (
      this.estadoFSM &&
      typeof this.estadoFSM
        .finalizarUlt ===
        "function"
    ) {

      this.estadoFSM.finalizarUlt();
    }
  }


  // ============================================================
  // CANCELAR
  // ============================================================

  cancelar() {
    this.cancelada = true;
    if (this.timerFinal) clearTimeout(this.timerFinal);
    this.timerFinal = null;
    this.pararTremorFinal();
    if (this.clockAntesFinal != null) {
      this.scene.time.paused = this.clockAntesFinal;
      this.clockAntesFinal = null;
    }
    this.descongelarCorpos();
    this.emHitStop = false;


    this.scene.physics.resume();


    this.destruirHitbox();


    this.timers.forEach(
      timer =>
        timer.remove(false)
    );


    this.timers.clear();


    if (
      this.fnAnimUpdate
    ) {

      this.personagem.sprite.off(
        "animationupdate",
        this.fnAnimUpdate
      );


      this.fnAnimUpdate =
        null;
    }


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


    this.efeitos.forEach(
      efeito => {

        if (
          efeito?.active
        ) {

          efeito.destroy();
        }
      }
    );


    this.efeitos.clear();


    this.restaurarOponente();

    this.restaurarFundo();

    this.restaurarCamera();


    this.personagem.sprite.body
      ?.setAllowGravity(
        true
      );


    this.liberarAlvos();
    const sprite = this.personagem.sprite;
    sprite.body.setGravityY(0);
    if (this.origemOriginal) {
      sprite.setOrigin(this.origemOriginal.x, this.origemOriginal.y);
      this.origemOriginal = null;
    }
    if (this.zoomOriginal !== null) this.scene.cameras.main.setZoom(this.zoomOriginal);
  }
}
