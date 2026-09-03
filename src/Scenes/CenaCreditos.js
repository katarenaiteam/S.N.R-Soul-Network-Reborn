export default class CenaCreditos extends Phaser.Scene {
  constructor() {
    super({ key: "CenaCreditos" });
  }

  create() {
    this.add.image(0, 0, "backStart")
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height);
    this.add.image(0, 0, "frontStart")
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height);

    this.add.text(this.scale.width / 2, this.scale.height * 0.3, "CRÉDITOS", {
      fontFamily: "RetroFont, monospace",
      fontSize: "48px",
      color: "#b8ffca",
      letterSpacing: 10,
    }).setOrigin(0.5).setShadow(0, 0, "#36ff72", 12);

    this.add.text(this.scale.width / 2, this.scale.height * 0.58, "SOUL NETWORK REBORN\n\nPRESSIONE ENTER OU ESC PARA VOLTAR", {
      fontFamily: "RetroFont, monospace",
      fontSize: "24px",
      color: "#43d96b",
      align: "center",
      lineSpacing: 14,
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", () => this.scene.start("CenaStart"));
    this.input.keyboard.once("keydown-ESC", () => this.scene.start("CenaStart"));
  }
}
