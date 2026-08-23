import ControleEntrada from "../Objetos/ControleEntrada.js";

export default class CenaStart extends Phaser.Scene {
  constructor() {
    super({ key: "CenaStart" });
  }

  create() {
    this.cameras.main.setBackgroundColor("#05050a");

    this.conteudoMenu = this.add.container(0, 0);
    this.conteudoMenu.scaleY = 0;
    this.tweens.add({
      targets: this.conteudoMenu,
      scaleY: 1,
      duration: 600,
      ease: "Cubic.easeOut"
    });

    const fundo = this.add.image(0, 0, "Start_menu").setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    this.conteudoMenu.add(fundo);

    this.opcoesMenu = [
      { id: "1v1", chaveSprite: "Start_VSbuton", x: 300, y: 480, disponivel: true },
      { id: "story", chaveSprite: "Start_Storybuton", x: 300, y: 640, disponivel: true }
    ];

    this.emSelecaoPlayers = false;
    this.numPlayersHistoria = 1;

    this.indiceOpcao = 0;
    this.botoesSprites = [];

    this.opcoesMenu.forEach((opcao) => {
      const btnSprite = this.add.image(opcao.x, opcao.y, opcao.chaveSprite).setOrigin(0, 0.5);
      this.botoesSprites.push(btnSprite);
      this.conteudoMenu.add(btnSprite);
    });

    // Submenu para quantidade de jogadores no modo História
    this.textoNumPlayers = this.add.text(300, 720, "1 JOGADOR", { fontSize: "36px", fill: "#00ff88", fontStyle: "bold" }).setOrigin(0, 0.5);
    this.textoNumPlayers.setVisible(false);
    this.conteudoMenu.add(this.textoNumPlayers);

    const teclasP1 = this.input.keyboard.addKeys({
      cima: Phaser.Input.Keyboard.KeyCodes.W,
      baixo: Phaser.Input.Keyboard.KeyCodes.S,
      esquerda: Phaser.Input.Keyboard.KeyCodes.A,
      direita: Phaser.Input.Keyboard.KeyCodes.D,
      atack: Phaser.Input.Keyboard.KeyCodes.F,
      special: Phaser.Input.Keyboard.KeyCodes.ENTER
    });

    this.teclasSetas = this.input.keyboard.addKeys({
      cima: Phaser.Input.Keyboard.KeyCodes.UP,
      baixo: Phaser.Input.Keyboard.KeyCodes.DOWN,
      esquerda: Phaser.Input.Keyboard.KeyCodes.LEFT,
      direita: Phaser.Input.Keyboard.KeyCodes.RIGHT
    });

    this.controleP1 = new ControleEntrada(this, teclasP1, 0);

    this.atualizarDestaque();
    this.bloqueado = false;
  }

  update() {
    if (this.bloqueado) return;

    this.controleP1.atualizar();

    if (this.emSelecaoPlayers) {
      const apertouEsq = this.controleP1.acabouDeApertar("esquerda") || Phaser.Input.Keyboard.JustDown(this.teclasSetas.esquerda);
      const apertouDir = this.controleP1.acabouDeApertar("direita") || Phaser.Input.Keyboard.JustDown(this.teclasSetas.direita);

      if (apertouEsq || apertouDir) {
        this.numPlayersHistoria = this.numPlayersHistoria === 1 ? 2 : 1;
        this.textoNumPlayers.setText(`${this.numPlayersHistoria} JOGADOR${this.numPlayersHistoria > 1 ? "ES" : ""}`);
      }

      const apertouConfirmar = this.controleP1.acabouDeApertar("atack") || this.controleP1.acabouDeApertar("special");
      if (apertouConfirmar) {
        this.bloqueado = true;
        this.fecharAbaEAvancar("Charmenu", { modo: "historia", numPlayers: this.numPlayersHistoria });
      }
    } else {
      const apertouCima = this.controleP1.acabouDeApertar("cima") || Phaser.Input.Keyboard.JustDown(this.teclasSetas.cima);
      const apertouBaixo = this.controleP1.acabouDeApertar("baixo") || Phaser.Input.Keyboard.JustDown(this.teclasSetas.baixo);

      if (apertouCima) {
        this.indiceOpcao = (this.indiceOpcao - 1 + this.opcoesMenu.length) % this.opcoesMenu.length;
        this.atualizarDestaque();
      } else if (apertouBaixo) {
        this.indiceOpcao = (this.indiceOpcao + 1) % this.opcoesMenu.length;
        this.atualizarDestaque();
      }

      const apertouConfirmar = this.controleP1.acabouDeApertar("atack") || this.controleP1.acabouDeApertar("special");
      if (apertouConfirmar) {
        this.confirmarSelecao();
      }
    }

    this.controleP1.salvarAnterior();
  }

  atualizarDestaque() {
    this.botoesSprites.forEach((sprite, idx) => {
      const eOSelecionado = idx === this.indiceOpcao;
      this.tweens.add({
        targets: sprite,
        scaleX: eOSelecionado ? 1.15 : 1.0,
        scaleY: eOSelecionado ? 1.15 : 1.0,
        duration: 120
      });
    });
  }

  confirmarSelecao() {
    const opcao = this.opcoesMenu[this.indiceOpcao];

    if (opcao.id === "story") {
      this.emSelecaoPlayers = true;
      this.textoNumPlayers.setVisible(true);
      return;
    }

    this.bloqueado = true;
    const spriteSelecionada = this.botoesSprites[this.indiceOpcao];

    this.tweens.add({
      targets: spriteSelecionada,
      alpha: 0.2,
      yoyo: true,
      repeat: 3,
      duration: 80,
      onComplete: () => {
        this.fecharAbaEAvancar("Charmenu", { modo: "1v1" });
      }
    });
  }

  fecharAbaEAvancar(proximaCena, dados) {
    this.tweens.add({
      targets: this.conteudoMenu,
      scaleY: 0,
      y: this.scale.height / 2,
      duration: 400,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.scene.start(proximaCena, dados);
      }
    });
  }
}