export default class CenaInserirFicha extends Phaser.Scene {
  constructor() {
    super({ key: "CenaInserirFicha" });
  }

  preload() {
    this.load.spritesheet("insira-ficha", "assets/Menus/pagamento/insira.png", {
      frameWidth: 970,
      frameHeight: 970,
    });
  }

  create() {
    document.fonts.load('28px "RetroFont"').then(() => this.criarTela());
  }

  criarTela() {
    const escala = this.scale.width / 1366;
    const margemX = 40 * escala;
    const margemY = 48 * escala;
    const larguraBarra = this.scale.width - margemX * 2;
    const footerY = this.scale.height - 55 * escala;
    const textoStyle = {
      fontFamily: "RetroFont, monospace",
      fontSize: `${28 * escala}px`,
      color: "#00ff00",
    };
    const footerStyle = {
      fontFamily: "RetroFont, monospace",
      fontSize: `${22 * escala}px`,
      color: "#000000",
      fontStyle: "bold",
    };

    this.cameras.main.setBackgroundColor("#000000");
    this.add.text(margemX, margemY, "RomSNR HBIOS v3.5.1, 4154-06-07", textoStyle);
    this.add.text(margemX, margemY + 40 * escala, "Soul Network Computer [RCZ80_msx2] Z80 @ 3.579MHz", textoStyle);
    this.add.text(margemX, margemY + 70 * escala, "0 MEM W/S, 1 I/O W/S, INT MODE 1, MSX MMU", textoStyle);
    this.add.text(margemX, margemY + 100 * escala, "0KB ROM, 448KB RAM, HEAP=0x321A", textoStyle);

    this.add.rectangle(margemX, footerY, larguraBarra, 45 * escala, 0x00ff00).setOrigin(0, 0);
    this.add.text(
      margemX + 20 * escala,
      footerY + 10 * escala,
      "CTRL-A Z for help | 115200 8N1 | NOR | Minicom 6.7 | VT102 | Offline",
      footerStyle,
    );

    const centroX = this.scale.width / 2;
    const centroY = this.scale.height / 2 - 10 * escala;
    if (!this.anims.exists("insira-ficha-loop")) {
      this.anims.create({
        key: "insira-ficha-loop",
        frames: this.anims.generateFrameNumbers("insira-ficha", { start: 0, end: 13 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    const brilhoFicha = this.add.sprite(centroX, centroY, "insira-ficha")
      .play("insira-ficha-loop")
      .setTint(0x48ff78)
      .setAlpha(0.2)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(390 * escala, 390 * escala);
    const ficha = this.add.sprite(centroX, centroY, "insira-ficha")
      .play("insira-ficha-loop")
      .setTint(0x78ff98)
      .setAlpha(0.68)
      .setDisplaySize(360 * escala, 360 * escala);
    this.tweens.add({
      targets: [ficha, brilhoFicha],
      alpha: { from: 0.55, to: 0.78 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.textoFicha = this.add.text(
      centroX,
      centroY + 220 * escala,
      "INSIRA UMA FICHA",
      {
        ...textoStyle,
        fontSize: `${34 * escala}px`,
        align: "center",
      },
    ).setOrigin(0.5);
    this.fichaInserida = false;
    this.input.keyboard.once("keydown-SPACE", () => this.inserirFicha());
  }

  inserirFicha() {
    if (this.fichaInserida) return;
    this.fichaInserida = true;
    this.textoFicha.setText("FICHA INSERIDA");
    this.time.delayedCall(800, () => this.scene.start("CenaPreload"));
  }
}
