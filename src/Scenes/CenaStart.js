import ControleEntrada from "../Objetos/ControleEntrada.js";

export default class CenaStart extends Phaser.Scene {
  constructor() {
    super({ key: "CenaStart" });
  }

  create() {
    this.cameras.main.setBackgroundColor("#05050a");

    // 1. CONTAINER PARA O MENU
    this.conteudoMenu = this.add.container(0, 0);
    
    // Animação de entrada (scale Y simples, sem alterar posição/origem)
    this.conteudoMenu.scaleY = 0;
    this.tweens.add({
      targets: this.conteudoMenu,
      scaleY: 1,
      duration: 600,
      ease: "Cubic.easeOut"
    });

    // 2. IMAGEM DE FUNDO DO MENU
    const fundo = this.add.image(0, 0, "Start_menu").setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    this.conteudoMenu.add(fundo);

    // 3. ESTRUTURA DOS 2 BOTÕES (SPRITES)
    this.opcoesMenu = [
      { id: "1v1", chaveSprite: "Start_VSbuton", x: 300, y: 480, disponivel: true },
      { id: "story", chaveSprite: "Start_Storybuton", x: 300, y: 640, disponivel: false }
    ];

    this.indiceOpcao = 0; // Começa no Play VS
    this.botoesSprites = [];

    // Cria as sprites dos dois botões
    this.opcoesMenu.forEach((opcao) => {
      const btnSprite = this.add.image(opcao.x, opcao.y, opcao.chaveSprite).setOrigin(0, 0.5);
      
      // Se não for o botão ativo (Play Story), deixa levemente escurecido
      if (!opcao.disponivel) {
        btnSprite.setTint(0x888888);
      }

      this.botoesSprites.push(btnSprite);
      this.conteudoMenu.add(btnSprite);
    });

    // 4. CONTROLES (P1: Teclado + Gamepad)
    const teclasP1 = this.input.keyboard.addKeys({
      cima: Phaser.Input.Keyboard.KeyCodes.W,
      baixo: Phaser.Input.Keyboard.KeyCodes.S,
      atack: Phaser.Input.Keyboard.KeyCodes.F,
      special: Phaser.Input.Keyboard.KeyCodes.ENTER
    });

    this.teclasSetas = this.input.keyboard.addKeys({
      cima: Phaser.Input.Keyboard.KeyCodes.UP,
      baixo: Phaser.Input.Keyboard.KeyCodes.DOWN
    });

    this.controleP1 = new ControleEntrada(this, teclasP1, 0);

    // Destaque inicial
    this.atualizarDestaque();
    this.bloqueado = false;
  }

  update() {
    if (this.bloqueado) return;

    this.controleP1.atualizar();

    // Navegação Cima / Baixo
    const apertouCima = this.controleP1.acabouDeApertar("cima") || Phaser.Input.Keyboard.JustDown(this.teclasSetas.cima);
    const apertouBaixo = this.controleP1.acabouDeApertar("baixo") || Phaser.Input.Keyboard.JustDown(this.teclasSetas.baixo);

    if (apertouCima) {
      this.indiceOpcao = (this.indiceOpcao - 1 + this.opcoesMenu.length) % this.opcoesMenu.length;
      this.atualizarDestaque();
    } else if (apertouBaixo) {
      this.indiceOpcao = (this.indiceOpcao + 1) % this.opcoesMenu.length;
      this.atualizarDestaque();
    }

    // Confirmar
    const apertouConfirmar = this.controleP1.acabouDeApertar("atack") || this.controleP1.acabouDeApertar("special");
    if (apertouConfirmar) {
      this.confirmarSelecao();
    }

    this.controleP1.salvarAnterior();
  }

  // Destaque visual aumentando a escala da sprite selecionada
  atualizarDestaque() {
    this.botoesSprites.forEach((sprite, idx) => {
      const eOSelecionado = idx === this.indiceOpcao;

      if (eOSelecionado) {
        this.tweens.add({
          targets: sprite,
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 120
        });
      } else {
        this.tweens.add({
          targets: sprite,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 120
        });
      }
    });
  }

  confirmarSelecao() {
    const opcao = this.opcoesMenu[this.indiceOpcao];

    // Se selecionar o Play Story, não faz nada (bloqueado)
    if (!opcao.disponivel) {
      this.cameras.main.shake(100, 0.005);
      return;
    }

    this.bloqueado = true;
    const spriteSelecionada = this.botoesSprites[this.indiceOpcao];

    // Efeito de piscar no Play VS antes de mudar de cena
    this.tweens.add({
      targets: spriteSelecionada,
      alpha: 0.2,
      yoyo: true,
      repeat: 3,
      duration: 80,
      onComplete: () => {
        this.fecharAbaEAvancar();
      }
    });
  }

  fecharAbaEAvancar() {
    this.tweens.add({
      targets: this.conteudoMenu,
      scaleY: 0,
      y: this.scale.height / 2,
      duration: 400,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.scene.start("Charmenu", { modo: "1v1" });
      }
    });
  }
}