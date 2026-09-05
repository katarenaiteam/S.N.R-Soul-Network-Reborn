import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";
import ControleEntrada from "../Objetos/ControleEntrada.js";

export default class CenaStart extends Phaser.Scene {
  constructor() {
    super({ key: "CenaStart" });
  }

  create(dados = {}) {
    encerrarOutrasCenas(this);
    this.cameras.main.setBackgroundColor("#000000");
    const entradaDoPreload = dados.entradaPreload === true;
    if (entradaDoPreload) {
      this.cameras.main.fadeIn(2200, 0, 0, 0);
    }

    this.conteudoMenu = this.add.container(0, 0);

    const fundoBack = this.add.image(0, 0, "backStart")
      .setOrigin(0, 0)
      .setDisplaySize(this.scale.width, this.scale.height);
    this.conteudoMenu.add(fundoBack);

    this.criarChuvaCaracteres();
    this.conteudoMenu.add(this.containerChuva);

    const fundoFront = this.add.image(0, 0, "frontStart")
      .setOrigin(0, 0)
      .setDisplaySize(this.scale.width, this.scale.height);
    this.conteudoMenu.add(fundoFront);

    this.criarLogo(entradaDoPreload);

    this.opcoesMenu = [
      { id: "story", rotulo: "HISTÓRIA", y: this.scale.height * 0.47, },
      { id: "1v1", rotulo: "VERSUS", y: this.scale.height * 0.565 },
      { id: "credits", rotulo: "CRÉDITOS", y: this.scale.height * 0.66 },
    ];

    this.emSelecaoPlayers = false;
    this.numPlayersHistoria = 1;

    this.indiceOpcao = 0;
    this.botoesSprites = [];

    this.opcoesMenu.forEach((opcao) => {
      const btnSprite = this.add.text(
        this.scale.width / 2,
        opcao.y,
        opcao.rotulo,
        {
          fontFamily: "RetroFont, monospace",
          fontSize: "34px",
          color: "#43d96b",
          letterSpacing: 10,
        }
      ).setOrigin(0.5);
      this.botoesSprites.push(btnSprite);
      this.conteudoMenu.add(btnSprite);
    });

    this.cursorSelecao = this.add.text(0, 0, ">", {
      fontFamily: "RetroFont, monospace",
      fontSize: "38px",
      color: "#d8ffe2",
    }).setOrigin(0.5);
    this.conteudoMenu.add(this.cursorSelecao);
    this.tweens.add({
      targets: this.cursorSelecao,
      alpha: 0.25,
      duration: 420,
      yoyo: true,
      repeat: -1,
    });

    // Submenu para quantidade de jogadores no modo História
    this.textoNumPlayers = this.add.text(this.scale.width / 2, this.scale.height * 0.76, "1 JOGADOR", { fontFamily: "RetroFont, monospace", fontSize: "28px", fill: "#8cffaa", letterSpacing: 5 }).setOrigin(0.5);
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
    this.bloqueado = entradaDoPreload;
    if (entradaDoPreload) {
      this.time.delayedCall(2200, () => { this.bloqueado = false; });
    }
  }

  update(_tempo, delta) {
    this.atualizarChuvaCaracteres(delta);
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

  criarChuvaCaracteres() {
    this.containerChuva = this.add.container(0, 0);
    this.colunasChuva = [];
    this.alfabetoChuva = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト";

    const larguraColuna = 30;
    const totalColunas = Math.ceil(this.scale.width / larguraColuna);

    for (let coluna = 0; coluna < totalColunas; coluna += 1) {
      if (Phaser.Math.FloatBetween(0, 1) < 0.14) continue;

      const tamanhoFonte = Phaser.Math.Between(14, 23);
      const quantidade = Phaser.Math.Between(7, 20);
      const caracteres = Array.from({ length: quantidade }, () => this.obterCaractereChuva());
      const fluxo = {
        x: coluna * larguraColuna + larguraColuna / 2,
        y: Phaser.Math.Between(-this.scale.height, this.scale.height),
        velocidade: Phaser.Math.Between(65, 185),
        alturaLinha: tamanhoFonte * 1.12,
        caracteres,
        tempoDesdeTroca: Phaser.Math.Between(0, 240),
        intervaloTroca: Phaser.Math.Between(140, 280),
      };

      fluxo.cauda = this.add.text(fluxo.x, fluxo.y + fluxo.alturaLinha, caracteres.slice(1).join("\n"), {
        fontFamily: "monospace",
        fontSize: `${tamanhoFonte}px`,
        color: "#28ff88",
        lineSpacing: Math.max(0, Math.round(tamanhoFonte * 0.12)),
      }).setOrigin(0.5, 0).setAlpha(0.62);
      fluxo.cabeca = this.add.text(fluxo.x, fluxo.y, caracteres[0], {
        fontFamily: "monospace",
        fontSize: `${tamanhoFonte}px`,
        color: "#e2fff0",
      }).setOrigin(0.5, 0).setAlpha(0.95);
      this.containerChuva.add([fluxo.cauda, fluxo.cabeca]);

      this.colunasChuva.push(fluxo);
    }
  }

  obterCaractereChuva() {
    return this.alfabetoChuva.charAt(
      Phaser.Math.Between(0, this.alfabetoChuva.length - 1)
    );
  }

  atualizarChuvaCaracteres(delta = 16.67) {
    if (!this.colunasChuva) return;
    const passo = Math.min(delta, 50);

    this.colunasChuva.forEach((fluxo) => {
      fluxo.y += fluxo.velocidade * (passo / 1000);

      fluxo.cabeca.setY(fluxo.y);
      fluxo.cauda.setY(fluxo.y + fluxo.alturaLinha);

      fluxo.tempoDesdeTroca += passo;
      if (fluxo.tempoDesdeTroca >= fluxo.intervaloTroca) {
        const trocas = Phaser.Math.Between(1, 2);
        let mudouCabeca = false;
        let mudouCauda = false;
        for (let i = 0; i < trocas; i += 1) {
          const indice = Phaser.Math.Between(0, fluxo.caracteres.length - 1);
          fluxo.caracteres[indice] = this.obterCaractereChuva();
          mudouCabeca ||= indice === 0;
          mudouCauda ||= indice > 0;
        }
        if (mudouCabeca) fluxo.cabeca.setText(fluxo.caracteres[0]);
        if (mudouCauda) fluxo.cauda.setText(fluxo.caracteres.slice(1).join("\n"));
        fluxo.tempoDesdeTroca = 0;
      }

      if (fluxo.y > this.scale.height + 30) {
        fluxo.y = -fluxo.caracteres.length * fluxo.alturaLinha - Phaser.Math.Between(30, this.scale.height);
        fluxo.velocidade = Phaser.Math.Between(65, 185);
      }
    });
  }

  criarLogo(entrarComGlitch = false) {
    if (!this.anims.exists("start_logo_glitch")) {
      this.anims.create({
        key: "start_logo_glitch",
        frames: this.anims.generateFrameNumbers("glitch", {
          start: 0,
          end: 3,
        }),
        frameRate: 12,
        repeat: 0,
      });
    }

    this.logoPosicao = {
      x: this.scale.width / 2,
      y: this.scale.height * 0.245,
    };
    const larguraLogo = this.scale.width * 0.6;
    const alturaLogo = larguraLogo * (365 / 683);
    this.logo = this.add.sprite(
      this.logoPosicao.x,
      this.logoPosicao.y,
      "logo"
    ).setOrigin(0.5).setDisplaySize(larguraLogo, alturaLogo);
    this.conteudoMenu.add(this.logo);
    if (entrarComGlitch) {
      this.logo.setVisible(false);
      this.time.delayedCall(1000, () => {
        if (!this.logo?.active) return;
        this.logo.setVisible(true);
        this.tocarGlitchLogo();
      });
    } else {
      this.agendarProximoGlitch();
    }
  }

  agendarProximoGlitch() {
    this.timerGlitchLogo?.remove(false);
    this.timerGlitchLogo = this.time.delayedCall(
      Phaser.Math.Between(5000, 15000),
      () => this.tocarGlitchLogo()
    );
  }

  tocarGlitchLogo() {
    if (!this.logo?.active) return;

    this.logo.setTexture("glitch", 0);
    this.logo.play("start_logo_glitch");

    const deslocamentoX = Phaser.Math.Between(3, 7) * (Math.random() < 0.5 ? -1 : 1);
    const deslocamentoY = Phaser.Math.Between(-3, 3);
    this.tweens.add({
      targets: this.logo,
      x: this.logoPosicao.x + deslocamentoX,
      y: this.logoPosicao.y + deslocamentoY,
      duration: 35,
      yoyo: true,
      repeat: 3,
      ease: "Stepped",
    });

    this.logo.once("animationcomplete-start_logo_glitch", () => {
      if (!this.logo?.active) return;
      this.logo.setTexture("logo");
      this.logo.setPosition(this.logoPosicao.x, this.logoPosicao.y);
      this.agendarProximoGlitch();
    });
  }

  atualizarDestaque() {
    this.botoesSprites.forEach((sprite, idx) => {
      const eOSelecionado = idx === this.indiceOpcao;
      sprite.setColor(eOSelecionado ? "#d8ffe2" : "#43d96b");
      sprite.setAlpha(eOSelecionado ? 1 : 0.72);
      sprite.setShadow(0, 0, eOSelecionado ? "#36ff72" : "#143c20", eOSelecionado ? 10 : 2);
    });

    const selecionado = this.botoesSprites[this.indiceOpcao];
    this.cursorSelecao.setPosition(
      selecionado.x - selecionado.displayWidth / 2 - 38,
      selecionado.y
    );
  }

  confirmarSelecao() {
    const opcao = this.opcoesMenu[this.indiceOpcao];

    this.animarConfirmacao(() => {
      if (opcao.id === "story") {
        this.emSelecaoPlayers = true;
        this.textoNumPlayers.setVisible(true);
        this.cursorSelecao.setVisible(false);
        this.bloqueado = false;
      } else if (opcao.id === "credits") {
        this.fecharAbaEAvancar("CenaCreditos");
      } else {
        this.fecharAbaEAvancar("Charmenu", { modo: "1v1" });
      }
    });
  }

  animarConfirmacao(aoConcluir) {
    this.bloqueado = true;
    this.cursorSelecao.setVisible(false);
    const selecionado = this.botoesSprites[this.indiceOpcao];
    selecionado.setColor("#ffffff");
    selecionado.setShadow(0, 0, "#66ff99", 22);

    this.tweens.add({
      targets: selecionado,
      alpha: 0.25,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 75,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        selecionado.setScale(1);
        selecionado.setAlpha(1);
        aoConcluir();
      },
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
