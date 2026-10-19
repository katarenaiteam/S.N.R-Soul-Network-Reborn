import CenaHistoria from "./CenaHistoria.js";
import MikuMap from "../Mapasjs/MikuMap.js";
import TH30_IA from "../Objetos/TH30_IA.js";
import DialogoHistoria from "../Objetos/DialogoHistoria.js";

export default class CenaHistoria4 extends CenaHistoria {
  constructor() {
    super("CenaHistoria4");
  }

  obterNomeBoss() {
    return "TH30";
  }

  init(dados = {}) {
    super.init(dados);
    this.entradaFinalCompleta = dados.entradaFinalCompleta === true;
    this.musicaHistoriaSeek = dados.musicaHistoriaSeek ?? 0;
    this.aguardandoEntradaFinal = this.entradaFinalCompleta;
    if (this.entradaFinalCompleta) this.manterAssetsParaHistoria2 = false;
  }

  criarMapaHistoria() {
    const mapa = new MikuMap(this);
    if (this.entradaFinalCompleta && this.musicaHistoriaSeek > 0) {
      mapa.musica?.setSeek(this.musicaHistoriaSeek);
    }
    return mapa;
  }

  criarIAHistoria(controller) {
    return new TH30_IA(controller);
  }

  update(time, delta) {
    if (this.aguardandoEntradaFinal) return;
    super.update(time, delta);
  }

  iniciarAberturaHistoria() {
    if (this.entradaFinalCompleta) {
      this.physics.world.pause();
      this.cameras.main.fadeIn(700, 255, 255, 255);
      this.sound.play("ding");
      const escala = Math.min(this.scale.width / 1920, this.scale.height / 1080);
      const retratoFJ = this.add.image(18 * escala, this.scale.height - 15 * escala, "FJ_true")
        .setOrigin(0, 1)
        .setDisplaySize(550 * escala, 550 * escala)
        .setScrollFactor(0)
        .setDepth(2500);
      this.camJogo.ignore(retratoFJ);
      this.time.delayedCall(3000, () => {
        retratoFJ.destroy();
        this.aguardandoEntradaFinal = false;
        this.iniciarIntroPartida();
      });
      return;
    }

    this.dialogoHistoria = new DialogoHistoria(this, () => {
      // A entrada da luta e iniciada junto com a fala final, antes de aceitar input.
    }, {
      falas: [
        {
          personagem: "TH30",
          texto: "Você não pode lutar contra o seu destino.",
        },
        {
          personagem: "FJ",
          retrato: "FJ_N",
          texto: "Quem faz meu destino...",
        },
        {
          personagem: "FJ",
          retrato: "FJ_N",
          texto: "Sou EU",
          aoTerminarDigitacao: () => this.revelarFJTrue(),
        },
      ],
    });
  }

  revelarFJTrue() {
    if (this.transicaoFJAtiva) return;
    this.transicaoFJAtiva = true;
    if (this.dialogoHistoria) this.dialogoHistoria.bloquearAvanco = true;
    const flash = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0xffffff,
    ).setScrollFactor(0).setDepth(5000).setAlpha(0);
    this.tweens.add({
      targets: flash,
      alpha: 1,
      duration: 180,
      onComplete: () => {
        this.dialogoHistoria?.retrato.setTexture("FJ_true").setVisible(true);
        if (this.escolhaP1 === "FJ" || this.escolhaP1 === "Frederick") {
          this.sound.play("ding");
          this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 280,
            onComplete: () => {
              this.dialogoHistoria?.destruir();
              this.dialogoHistoria = null;
              flash.destroy();
              this.time.delayedCall(3000, () => this.iniciarIntroPartida());
            },
          });
          return;
        }

        this.manterAssetsParaHistoria2 = true;
        const musicaHistoriaSeek = this.mapaAtual.musica?.seek ?? 0;
        this.time.delayedCall(120, () => {
          this.scene.restart({
            p1: "FJ",
            p2: this.escolhaP2,
            numPlayers: this.numPlayers,
            entradaFinalCompleta: true,
            musicaHistoriaSeek,
          });
        });
      },
    });
  }

  aoVencerHistoria() {
    this.sound.stopAll();
    this.scene.start("CenaCreditos");
  }
}
