import ControleEntrada from "../Objetos/ControleEntrada.js";
import Cidade from "../Mapasjs/Cidade.js";
import SkyTowers from "../Mapasjs/SkyTowers.js";

export default class CenaSelecaoMapa extends Phaser.Scene {
  constructor() {
    super({ key: "CenaSelecaoMapa" });
    // Inicializar variáveis para armazenar escolha de personagens
    this.escolhaPersonagens = null;
  }

  init(data) {
    // Receber os dados dos personagens selecionados do Charmenu
    this.escolhaPersonagens = data;
  }

  create() {
    this.cameras.main.setBackgroundColor("#05050a");

    // 1. MÁSCARA DA ABA DO NAVEGADOR
    const rectJanela = this.add.graphics();
    rectJanela.fillStyle(0xffffff);
    rectJanela.fillRect(0, 0, this.scale.width, this.scale.height);
    this.mascara = rectJanela.createGeometryMask();

    this.conteudoMenu = this.add.container(0, 0);
    this.conteudoMenu.setMask(this.mascara);

    // Animação de entrada
    rectJanela.scaleY = 0;
    rectJanela.y = this.scale.height / 2;
    this.tweens.add({
      targets: rectJanela,
      scaleY: 1,
      y: 0,
      duration: 600,
      ease: "Cubic.easeOut"
    });

    // 2. IMAGEM DE FUNDO DO MENU DE MAPAS
    // Altere 'Start_menu' para a chave da imagem de fundo se tiver uma específica
    const fundo = this.add.image(0, 0, "Start_menu").setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);
    this.conteudoMenu.add(fundo);

    // 3. ARRAY DOS MAPAS COM AS SUAS RESPECTIVAS IMAGENS (SPRITES/PREVIEWS)
    this.mapas = [
      { id: "cidade", nome: "Cidade", classe: Cidade, chaveSprite: "thumb_cidade" },
      { id: "SkyTowers", nome: "SkyTowers", classe: SkyTowers, chaveSprite: "thumb_skytowers" },
      // Adicione outros mapas aqui informando a imagem correspondente:
      // { id: "floresta", nome: "Floresta", classe: Floresta, chaveSprite: "thumb_floresta" },
    ];

    this.indiceOpcao = 0; // Começa no primeiro mapa
    this.spritesMapas = [];

    // Cria as imagens de preview dos mapas
    this.mapas.forEach((mapa) => {
      const spriteMapa = this.add.image(this.scale.width / 2, this.scale.height / 2, mapa.chaveSprite);
      this.spritesMapas.push(spriteMapa);
      this.conteudoMenu.add(spriteMapa);
    });

    // 4. SUPORTE A TECLADO (A/D e SETAS ESQUERDA/DIREITA) + CONTROLEENTRADA
    const teclasP1 = this.input.keyboard.addKeys({
      esquerda: Phaser.Input.Keyboard.KeyCodes.A,
      direita: Phaser.Input.Keyboard.KeyCodes.D,
      atack: Phaser.Input.Keyboard.KeyCodes.F,
      special: Phaser.Input.Keyboard.KeyCodes.ENTER
    });

    this.teclasSetas = this.input.keyboard.addKeys({
      esquerda: Phaser.Input.Keyboard.KeyCodes.LEFT,
      direita: Phaser.Input.Keyboard.KeyCodes.RIGHT
    });

    this.controleP1 = new ControleEntrada(this, teclasP1, 0);

    // Renderiza o carrossel na posição inicial
    this.atualizarCarrossel(false);
    this.bloqueado = false;
  }

  update() {
    if (this.bloqueado) return;

    this.controleP1.atualizar();

    // Navegação Esquerda / Direita (Teclado + Gamepad)
    const apertouEsquerda = this.controleP1.acabouDeApertar("esquerda") || Phaser.Input.Keyboard.JustDown(this.teclasSetas.esquerda);
    const apertouDireita = this.controleP1.acabouDeApertar("direita") || Phaser.Input.Keyboard.JustDown(this.teclasSetas.direita);

    if (apertouEsquerda) {
      this.indiceOpcao = (this.indiceOpcao - 1 + this.mapas.length) % this.mapas.length;
      this.atualizarCarrossel(true);
    } else if (apertouDireita) {
      this.indiceOpcao = (this.indiceOpcao + 1) % this.mapas.length;
      this.atualizarCarrossel(true);
    }

    // Confirmar (Mesmos botões da CenaStart)
    const apertouConfirmar = this.controleP1.acabouDeApertar("atack") || this.controleP1.acabouDeApertar("special");
    if (apertouConfirmar) {
      this.confirmarSelecao();
    }

    this.controleP1.salvarAnterior();
  }

  // Disposição e animação estilo catálogo/carrossel
  atualizarCarrossel(comAnimacao = true) {
    const total = this.mapas.length;
    const centroX = this.scale.width / 2;
    const centroY = this.scale.height / 2;

    this.spritesMapas.forEach((sprite, idx) => {
      let offset = idx - this.indiceOpcao;

      // Mantém o looping
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;

      let alvoX = centroX;
      let alvoY = centroY;
      let escala = 1.0;
      let profundidade = 10;
      let alpha = 1.0;

      if (offset === 0) {
        // MAPA SELECIONADO (CENTRAL E MAIOR)
        alvoX = centroX;
        alvoY = centroY;
        escala = 1.15;
        profundidade = 30;
        alpha = 1.0;
      } else if (offset === -1 || (offset === total - 1 && total > 2)) {
        // MAPA À ESQUERDA (MENOR E ATRÁS)
        alvoX = centroX - 450;
        alvoY = centroY + 20;
        escala = 0.65;
        profundidade = 20;
        alpha = 0.6;
      } else if (offset === 1 || (offset === -(total - 1) && total > 2)) {
        // MAPA À DIREITA (MENOR E ATRÁS)
        alvoX = centroX + 450;
        alvoY = centroY + 20;
        escala = 0.65;
        profundidade = 20;
        alpha = 0.6;
      } else {
        // OUTROS MAPAS ESCONDIDOS
        alvoX = offset < 0 ? centroX - 800 : centroX + 800;
        alvoY = centroY;
        escala = 0.3;
        profundidade = 10;
        alpha = 0;
      }

      sprite.setDepth(profundidade);

      if (comAnimacao) {
        this.tweens.add({
          targets: sprite,
          x: alvoX,
          y: alvoY,
          scaleX: escala,
          scaleY: escala,
          alpha: alpha,
          duration: 180,
          ease: "Power2"
        });
      } else {
        sprite.setPosition(alvoX, alvoY);
        sprite.setScale(escala);
        sprite.setAlpha(alpha);
      }
    });
  }

  confirmarSelecao() {
    this.bloqueado = true;
    const spriteSelecionada = this.spritesMapas[this.indiceOpcao];

    // Efeito de piscar antes de transicionar a cena
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
    const rectJanela = this.mascara.template;
    this.tweens.add({
      targets: rectJanela,
      scaleY: 0,
      y: this.scale.height / 2,
      duration: 400,
      ease: "Cubic.easeIn",
      onComplete: () => {
        // Inicia a arena repassando a classe do mapa selecionado e os personagens
        this.scene.start("cenaPrincipal", {
          ClasseMapa: this.mapas[this.indiceOpcao].classe,
          p1: this.escolhaPersonagens?.p1,
          p2: this.escolhaPersonagens?.p2
        });
      }
    });
  }
}