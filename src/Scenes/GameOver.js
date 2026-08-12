export default class CenaGameOver extends Phaser.Scene {
  constructor() {
    super({ key: "CenaGameOver" });
  }

  create() {
    this.cameras.main.setBackgroundColor("#05050a");

    // 1. MÁSCARA DA ABA DO NAVEGADOR (Animação de entrada)
    const rectJanela = this.add.graphics();
    rectJanela.fillStyle(0xffffff);
    rectJanela.fillRect(0, 0, this.scale.width, this.scale.height);
    this.mascara = rectJanela.createGeometryMask();

    this.conteudoMenu = this.add.container(0, 0);
    this.conteudoMenu.setMask(this.mascara);

    rectJanela.scaleY = 0;
    rectJanela.y = this.scale.height / 2;
    this.tweens.add({
      targets: rectJanela,
      scaleY: 1,
      y: 0,
      duration: 600,
      ease: "Cubic.easeOut"
    });

    // 2. FUNDO (Mesmo fundo da CenaStart)
    const fundo = this.add.image(0, 0, "Start_menu").setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    this.conteudoMenu.add(fundo);

    // 3. BOTÃO REZERO
    this.botaoReset = this.add.image(this.scale.width / 2, this.scale.height / 2, "ReZero").setOrigin(0.5, 0.5);
    this.conteudoMenu.add(this.botaoReset);

    // Efeito de pulsação no botão ReZero
    this.tweens.add({
      targets: this.botaoReset,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // 4. MÉTODOS DE ENTRADA (Mudar para CenaStart)
    this.bloqueado = false;

    // Clique do mouse/touch no botão
    this.botaoReset.setInteractive({ useHandCursor: true });
    this.botaoReset.on("pointerdown", () => this.reiniciarPartida());

    // Teclado/Gamepad via ControleEntrada (F ou ENTER)
    this.input.keyboard.once("keydown-ENTER", () => this.reiniciarPartida());
    this.input.keyboard.once("keydown-F", () => this.reiniciarPartida());
    this.input.keyboard.once("keydown-SPACE", () => this.reiniciarPartida());
  }

  reiniciarPartida() {
    if (this.bloqueado) return;
    this.bloqueado = true;

    // Transição de saída fechando a aba
    const rectJanela = this.mascara.template;
    this.tweens.add({
      targets: rectJanela,
      scaleY: 0,
      y: this.scale.height / 2,
      duration: 400,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.scene.start("CenaStart");
      }
    });
  }
}