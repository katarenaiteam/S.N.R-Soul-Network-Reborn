import CenaHistoria from "./CenaHistoria.js";
import SlenderMap from "../Mapasjs/SlenderMap.js";
import Slenderman_IA from "../Objetos/Slenderman_IA.js";
import DialogoHistoria from "../Objetos/DialogoHistoria.js";
import IntroPartida from "../Objetos/IntroPartida.js";
import CutsceneFinalSlenderman from "../Objetos/CutsceneFinalSlenderman.js";

const FALAS_FJ = [
  { personagem: "FJ", retrato: "FJ_N", texto: "..." },
  { personagem: "FJ", retrato: "FJ_N", texto: "Mas o que?" },
];

export default class CenaHistoria3 extends CenaHistoria {
  constructor() {
    super("CenaHistoria3");
  }

  obterNomeBoss() {
    return "Slenderman";
  }

  criarMapaHistoria() {
    return new SlenderMap(this);
  }

  criarIAHistoria(controller) {
    this.slendermanIA = new Slenderman_IA(controller);
    return this.slendermanIA;
  }

  iniciarAberturaHistoria() {
    this.boss.sprite.setVisible(false);
    this.boss.sprite.body.enable = false;
    this.hudBossHistoria3 = this.participantes.find(({ jogador }) => jogador === this.boss)?.hud;
    this.hudBossHistoria3?.setVisible(false);
    this.indicadorCPU?.setVisible(false);
    this.somSuspiro = this.sound.add("suspiro");
    this.somSuspiro.play();

    this.dialogoHistoria = new DialogoHistoria(this, () => {
      this.dialogoHistoria = null;
      this.somSuspiro?.stop();
      this.somSuspiro?.destroy();
      this.somSuspiro = null;
      this.iniciarIntroPartida();
    }, { falas: FALAS_FJ });
  }

  iniciarIntroPartida() {
    this.hudBossHistoria3?.setVisible(false);
    this.indicadorCPU?.setVisible(false);
    this.introPartida = new IntroPartida(this, {
      jogadores: [this.jogador1],
      participantes: [this.jogador1],
      nomes: [this.escolhaP1],
      alvoLuta: () => this.calcularAlvoCamera(),
      aoFimContagem: intro => this.iniciarAparicaoSlenderman(intro),
    });
  }

  iniciarAparicaoSlenderman(intro) {
    intro.visual.setVisible(false);

    if (!this.anims.exists("slan_tv_intro")) {
      this.anims.create({
        key: "slan_tv_intro",
        frames: this.anims.generateFrameNumbers("Slan_tv"),
        frameRate: 18,
        repeat: -1,
      });
    }

    const centroX = this.scale.width / 2;
    const centroY = this.scale.height / 2;
    const escalaResolucao = this.scale.width / 1920;
    this.imagemJumpscare = this.add.image(centroX, centroY, "S1")
      .setScrollFactor(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(3200);
    this.interferenciaJumpscare = this.add.sprite(centroX, centroY, "Slan_tv")
      .setScrollFactor(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setAlpha(0.16)
      .setDepth(3201)
      .play("slan_tv_intro");
    this.camJogo.ignore([this.imagemJumpscare, this.interferenciaJumpscare]);

    this.somJumpscare = this.sound.add("jumpscare", { loop: true });
    this.somJumpscare.play();

    const jogador = this.jogador1.sprite;
    const limites = this.mapaAtual.configCamera.limites;
    const ladoSpawn = jogador.x < limites.x + limites.largura / 2 ? 1 : -1;
    let xSpawn = Phaser.Math.Clamp(
      jogador.x + ladoSpawn * 160,
      limites.x + 80,
      limites.x + limites.largura - 80,
    );
    if (Math.abs(xSpawn - jogador.x) < 100) {
      xSpawn = Phaser.Math.Clamp(
        jogador.x - ladoSpawn * 160,
        limites.x + 80,
        limites.x + limites.largura - 80,
      );
    }
    this.boss.sprite.setVisible(true);
    this.boss.sprite.body.enable = true;
    this.boss.sprite.body.setAllowGravity(true);
    this.boss.sprite.body.reset(xSpawn, jogador.y);
    this.boss.sprite.setFlipX(jogador.x < xSpawn);
    this.boss.sincronizarHurtbox();

    this.time.delayedCall(2400, () => {
      this.imagemJumpscare?.destroy();
      this.interferenciaJumpscare?.destroy();
      this.somJumpscare?.stop();
      this.somJumpscare?.destroy();
      this.somJumpscare = null;
      this.hudBossHistoria3?.setVisible(true);
      this.indicadorCPU?.setVisible(true);

      intro.finalizar();
      this.boss.ultCarga = this.boss.ultCargaMax;
      this.boss.maquinaEstados.mudarEstado("ult");
    });
  }

  aoAcertoUltimateSlenderman() {
    this.mapaAtual.iniciarMusica();
  }

  aoVencerHistoria() {
    this.cutsceneFinalSlenderman = new CutsceneFinalSlenderman(this);
  }
}
