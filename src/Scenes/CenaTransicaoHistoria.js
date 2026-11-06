const FASES = {
  Miku: { fundo: "historia-fundo-1", barra: "historia-barra-1", larguraQuadro: 480, quadros: [0, 20], destino: "CenaHistoria" },
  Pingu: { fundo: "historia-fundo-2", barra: "historia-barra-2", larguraQuadro: 413, quadros: [0, 20], destino: "CenaHistoria2" },
  Slenderman: { fundo: "historia-fundo-3", barra: "historia-barra-3", larguraQuadro: 413, quadros: [0, 20], destino: "CenaHistoria3" },
};

export default class CenaTransicaoHistoria extends Phaser.Scene {
  constructor() {
    super("CenaTransicaoHistoria");
  }

  init(dados = {}) {
    this.dadosHistoria = dados;
    this.fase = FASES[dados.fase] ? dados.fase : "Miku";
  }

  preload() {
    this.load.image("historia-fundo-1", "assets/Menus/chaveamento/Background1.png");
    this.load.image("historia-fundo-2", "assets/Menus/chaveamento/background2.png");
    this.load.image("historia-fundo-3", "assets/Menus/chaveamento/background3.png");
    for (const [indice, larguraQuadro] of [480, 413, 413].entries()) {
      this.load.spritesheet(`historia-barra-${indice + 1}`, `assets/Menus/chaveamento/barra${indice + 1}.png`, {
        frameWidth: larguraQuadro,
        frameHeight: 1080,
      });
    }
  }

  create() {
    const config = FASES[this.fase];
    this.add.image(this.scale.width / 2, this.scale.height / 2, config.fundo)
      .setDisplaySize(this.scale.width, this.scale.height);

    const barra = this.add.sprite(this.scale.width - 24, this.scale.height / 2, config.barra)
      .setOrigin(1, 0.5)
      .setScale(Math.min(this.scale.height / 1080, 1));

    const animacao = `historia-animacao-${this.fase}`;
    if (!this.anims.exists(animacao)) {
      this.anims.create({
        key: animacao,
        frames: this.anims.generateFrameNumbers(config.barra, { start: config.quadros[0], end: config.quadros[1] }),
        frameRate: 12,
        repeat: 0,
      });
    }

    this.time.delayedCall(3000, () => {
      barra.play(animacao);
      barra.once("animationcomplete", () => {
        this.time.delayedCall(2000, () => {
          this.scene.start(config.destino, this.dadosHistoria);
        });
      });
    });
  }
}
