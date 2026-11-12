import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";

export default class CenaAvaliacao extends Phaser.Scene {
  constructor() {
    super({ key: "CenaAvaliacao" });
  }

  preload() {
    if (!this.textures.exists("avaliarQrcode")) {
      this.load.image("avaliarQrcode", "assets/Menus/avaliar/qrcode.PNG");
    }
  }

  create() {
    encerrarOutrasCenas(this);
    const { width, height } = this.scale;
    const escala = width / 1366;

    this.add.image(width / 2, height / 2, "backStart")
      .setDisplaySize(width, height);
    this.add.image(width / 2, height * 0.34, "avaliarQrcode")
      .setDisplaySize(250 * escala, 250 * escala);
    this.add.text(width / 2, height * 0.66,
      "gostou do nosso jogo?\navalie sua experiência!", {
        fontFamily: "RetroFont, monospace",
        fontSize: `${32 * escala}px`,
        color: "#00ff36",
        align: "center",
        lineSpacing: 12 * escala,
        stroke: "#001507",
        strokeThickness: 4 * escala,
      }).setOrigin(0.5);

    this.avancar = () => {
      if (this.encerrando) return;
      this.encerrando = true;
      this.scene.start("CenaStart");
    };
    this.input.keyboard?.once("keydown", this.avancar);
    this.input.on("pointerdown", this.avancar);
    this.input.gamepad?.on("down", this.avancar);
    this.events.once("shutdown", () => {
      this.input.off("pointerdown", this.avancar);
      this.input.gamepad?.off("down", this.avancar);
    });
  }
}
