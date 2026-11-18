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
      this.scene.start("CenaInserirFicha");
    };
    this.botoesControleAnteriores = [[], []];
    this.avancarTeclado = (evento) => {
      if (["Enter", "f", "F", "j", "J", " "].includes(evento.key)) {
        this.avancar();
      }
    };
    this.input.keyboard?.once("keydown", this.avancar);
    this.input.keyboard?.on("keydown-ENTER", this.avancar);
    this.input.keyboard?.on("keydown-F", this.avancar);
    this.input.keyboard?.on("keydown-J", this.avancar);
    this.input.keyboard?.on("keydown-SPACE", this.avancar);
    window.addEventListener("keydown", this.avancarTeclado);
    this.input.on("pointerdown", this.avancar);
    this.input.gamepad?.once("down", this.avancar);
    this.events.once("shutdown", () => {
      this.input.keyboard?.off("keydown", this.avancar);
      this.input.keyboard?.off("keydown-ENTER", this.avancar);
      this.input.keyboard?.off("keydown-F", this.avancar);
      this.input.keyboard?.off("keydown-J", this.avancar);
      this.input.keyboard?.off("keydown-SPACE", this.avancar);
      window.removeEventListener("keydown", this.avancarTeclado);
      this.input.off("pointerdown", this.avancar);
      this.input.gamepad?.off("down", this.avancar);
    });
  }

  update() {
    const gamepads = this.input.gamepad?.gamepads ?? [];
    for (let indice = 0; indice < this.botoesControleAnteriores.length; indice += 1) {
      const botoes = gamepads[indice]?.buttons ?? [];
      const anteriores = this.botoesControleAnteriores[indice];
      const novoBotao = botoes.some((botao, botaoIndice) =>
        !!botao?.pressed && !anteriores[botaoIndice],
      );
      if (novoBotao) this.avancar();
      this.botoesControleAnteriores[indice] = botoes.map((botao) => !!botao?.pressed);
    }
  }
}
