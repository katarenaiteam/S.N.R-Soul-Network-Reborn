import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";
import ControleEntrada from "../Objetos/ControleEntrada.js";

const FALAS_INICIAIS = [
  { texto: "Meus parabéns, campeão! Você conquistou a vitória e levou incontáveis mundos à loucura!" },
  { texto: "Poucos tiveram o privilégio de presenciar tamanha grandeza. Hoje, todos testemunharam sua glória." },
  { texto: "Mas chega de celebrações... vamos ao que realmente importa." },
];

const FALAS_MATRIZ = [
  { texto: "...", fundo: null },
  { texto: "Devo admitir, você foi impressionante.\n\nSuperou grandes desafios.", fundoDepois: "slen-back1" },
  { texto: "Enfrentou inimigos inesperados.", fundoDepois: "ice-back" },
  { texto: "E fez grandes sacrifícios para chegar até aqui.", fundoDepois: "show-back" },
  { texto: "Você merece sua recompensa.", fundoDepois: null },
  { texto: "Eu lhe ofereço a essência do sucesso. A chance de mudar de vida no estalar de um dedo. Ser o que você sempre sonhou.", fundo: null },
  { texto: "Só há uma condição: você precisa escolhê-lo por livre e espontânea vontade. Mas não se preocupe com isso. Siga minha sugestão e sua vida mudará para sempre... para melhor, é claro.", fundo: null },
];

const FALAS_RECUSA = [
  "...Como é?",
  "Você tem ideia do que fiz para preparar isso?! De tudo o que passei para trazer você até aqui?! E você simplesmente... RECUSA?!",
  "NÃO! Não, não, não! Você não pode fazer isso! Você TEM que aceitar! TEM QUE—",
  "...Muito bem, campeão. Se é assim que deseja...",
  "Então vou te tirar desse jogo eu mesmo.",
];

export default class CenaEscolhaFinal extends Phaser.Scene {
  constructor() {
    super({ key: "CenaEscolhaFinal" });
  }

  init(dados = {}) {
    this.dadosHistoria = dados;
    this.etapa = "abertura";
    this.indiceFala = 0;
    this.opcao = 0;
    this.confirmacao = 0;
  }

  create() {
    encerrarOutrasCenas(this);
    const escala = this.scale.width / 1920;
    const teclado = this.input.keyboard.addKeys({
      esquerda: Phaser.Input.Keyboard.KeyCodes.A,
      direita: Phaser.Input.Keyboard.KeyCodes.D,
      atack: Phaser.Input.Keyboard.KeyCodes.F,
    });
    this.controle = new ControleEntrada(this, teclado, 0);
    this.teclasSetas = this.input.keyboard.addKeys({
      esquerda: Phaser.Input.Keyboard.KeyCodes.LEFT,
      direita: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      atack: Phaser.Input.Keyboard.KeyCodes.ENTER,
    });

    this.fundoPreto = this.add.rectangle(
      this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height, 0x000000,
    ).setDepth(-10);
    this.fundoVitoria = this.add.image(0, 0, "venceu")
      .setOrigin(0).setDisplaySize(this.scale.width, this.scale.height).setDepth(-9);
    this.cameras.main.fadeIn(1600, 0, 0, 0);

    this.chris = this.add.image(this.scale.width / 2, this.scale.height * 0.52, "Chris")
      .setDepth(5).setAlpha(0);
    this.ajustarChris(0.65);
    this.texto = this.add.text(this.scale.width / 2, this.scale.height * 0.9, "", {
      fontFamily: "RetroFont, monospace",
      fontSize: `${Math.round(30 * escala)}px`,
      color: "#00a832",
      align: "center",
      lineSpacing: 10 * escala,
      stroke: "#001507",
      strokeThickness: Math.max(2, 3 * escala),
      wordWrap: { width: this.scale.width * 0.76 },
    }).setOrigin(0.5).setDepth(8).setShadow(2, 2, "#000000", 5 * escala);
    this.ajudaEscolha = this.add.text(this.scale.width / 2, this.scale.height * 0.96,
      "USE  ← / →  PARA ESCOLHER", {
        fontFamily: "RetroFont, monospace",
        fontSize: `${Math.round(20 * escala)}px`,
        color: "#39ff63",
      }).setOrigin(0.5).setDepth(9).setVisible(false);

    this.time.delayedCall(1800, () => {
      this.tweens.add({ targets: this.chris, alpha: 1, duration: 1100, ease: "Sine.Out" });
      this.mostrarFalaInicial();
    });
  }

  update(_time, delta) {
    for (const coluna of this.colunasMatrix || []) {
      coluna.y += coluna.velocidade * (delta / 1000);
      if (coluna.y > this.scale.height + coluna.cauda.height) {
        coluna.y = Phaser.Math.Between(-coluna.cauda.height, -20);
        coluna.caracteres = coluna.caracteres.map(() =>
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Phaser.Math.Between(0, 35)]);
        coluna.cauda.setText(coluna.caracteres.join("\n"));
        coluna.cabeca.setText(coluna.caracteres[0]);
      }
      coluna.cauda.setY(coluna.y);
      coluna.cabeca.setY(coluna.y);
    }
    if (!this.controle || this.etapa === "transicao" || this.etapa === "fim") return;
    this.controle.atualizar();
    const esquerda = this.controle.acabouDeApertar("esquerda") || Phaser.Input.Keyboard.JustDown(this.teclasSetas.esquerda);
    const direita = this.controle.acabouDeApertar("direita") || Phaser.Input.Keyboard.JustDown(this.teclasSetas.direita);
    const confirmarTeclado = Phaser.Input.Keyboard.JustDown(this.teclasSetas.atack);
    const confirmar = this.controle.acabouDeApertar("atack") || confirmarTeclado;

    if (this.etapa === "escolha") {
      if (esquerda || direita) {
        this.prepararMaos();
        this.selecionarOpcao(esquerda ? 0 : 1);
      }
      if (confirmar) {
        this.prepararMaos();
        this.atualizarEscolha();
        this.etapa = "confirmacao";
        this.atualizarConfirmacao();
      }
    } else if (this.etapa === "confirmacao") {
      if (esquerda || direita) this.confirmacao = this.confirmacao ? 0 : 1;
      this.atualizarConfirmacao();
      if (confirmar) {
        if (this.confirmacao === 1) {
          this.etapa = "escolha";
          this.confirmacao = 0;
          this.texto.setText("");
          this.atualizarEscolha();
        } else if (this.opcao === 0) {
          this.aceitarDestino();
        } else {
          this.recusarDestino();
        }
      }
    } else if (confirmar) {
      this.avancarDialogo();
    }
    this.controle.salvarAnterior();
  }

  mostrarFalaInicial() {
    this.etapa = "abertura";
    this.indiceFala = 0;
    this.escreverTexto(FALAS_INICIAIS[0].texto);
  }

  escreverTexto(texto, aoTerminar = null) {
    this.timerDigitacao?.remove(false);
    this.timerDigitacao = null;
    this.textoCompleto = texto;
    this.indiceDigitacao = 0;
    this.aoTerminarDigitacao = aoTerminar;
    this.digitando = true;
    this.texto.setText("");
    const terminar = () => {
      this.texto.setText(this.textoCompleto);
      this.digitando = false;
      this.timerDigitacao = null;
      const callback = this.aoTerminarDigitacao;
      this.aoTerminarDigitacao = null;
      callback?.();
    };
    if (!texto.length) {
      terminar();
      return;
    }
    this.timerDigitacao = this.time.addEvent({
      delay: 24,
      repeat: texto.length - 1,
      callback: () => {
        this.indiceDigitacao += 1;
        this.texto.setText(this.textoCompleto.slice(0, this.indiceDigitacao));
        if (this.indiceDigitacao >= this.textoCompleto.length) terminar();
      },
    });
  }

  completarDigitacao() {
    if (!this.digitando) return false;
    this.timerDigitacao?.remove(false);
    this.timerDigitacao = null;
    this.texto.setText(this.textoCompleto);
    this.digitando = false;
    const callback = this.aoTerminarDigitacao;
    this.aoTerminarDigitacao = null;
    callback?.();
    return true;
  }

  ajustarChris(posicaoY = 0.56) {
    const altura = this.scale.height * 0.86;
    const largura = altura * (this.chris.width / this.chris.height);
    this.chris.setDisplaySize(largura, altura);
    this.chris.setPosition(this.scale.width / 2, this.scale.height * posicaoY);
  }

  avancarDialogo() {
    if (this.completarDigitacao()) return;
    if (this.etapa === "abertura") {
      this.indiceFala += 1;
      if (this.indiceFala < FALAS_INICIAIS.length) {
        this.escreverTexto(FALAS_INICIAIS[this.indiceFala].texto);
      } else {
        this.iniciarInterferencia();
      }
      return;
    }
    if (this.etapa === "monologo") {
      this.indiceFala += 1;
      if (this.indiceFala < FALAS_MATRIZ.length) {
        const fala = FALAS_MATRIZ[this.indiceFala];
        this.escreverTexto(fala.texto, () => {
          if (Object.prototype.hasOwnProperty.call(fala, "fundoDepois")) {
            this.mudarFundo(fala.fundoDepois);
          }
        });
      } else {
        this.iniciarEscolha();
      }
      return;
    }
    if (this.etapa === "recusa") {
      this.indiceFala += 1;
      if (this.indiceFala < FALAS_RECUSA.length) {
      this.escreverTexto(FALAS_RECUSA[this.indiceFala]);
      } else {
        this.iniciarBranqueamento();
      }
    }
  }

  iniciarInterferencia() {
    this.etapa = "transicao";
    this.texto.setText("");
    this.chris.setDepth(21);
    this.texto.setDepth(22);
    this.sound.play("tv-static", { volume: 0.85 });
    if (!this.anims.exists("escolha-tv")) {
      this.anims.create({
        key: "escolha-tv",
        frames: this.anims.generateFrameNumbers("TVefect"),
        frameRate: 18,
        repeat: 0,
      });
    }
    this.tv = this.add.sprite(this.scale.width / 2, this.scale.height / 2, "TVefect")
      .setDisplaySize(this.scale.width, this.scale.height).setDepth(20).play("escolha-tv");
    this.tv.once("animationcomplete", () => {
      this.tv.destroy();
      this.sound.stopByKey("tv-static");
      this.fundoVitoria.setVisible(false);
      this.chris.setDepth(5);
      this.texto.setDepth(8);
      this.criarChuvaMatrix();
      this.etapa = "monologo";
      this.indiceFala = 0;
      this.escreverTexto(FALAS_MATRIZ[0].texto, () => this.mudarFundo(null));
    });
  }

  criarChuvaMatrix() {
    this.colunasMatrix = [];
    const espacamento = Math.max(26, 34 * this.scale.width / 1920);
    const quantidade = Math.ceil(this.scale.width / espacamento);
    const alfabeto = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let indice = 0; indice < quantidade; indice += 1) {
      if (Phaser.Math.FloatBetween(0, 1) < 0.18) continue;
      const tamanho = Phaser.Math.Between(10, 18) * this.scale.width / 1920;
      const caracteres = Array.from({ length: Phaser.Math.Between(8, 18) }, () =>
        alfabeto[Phaser.Math.Between(0, alfabeto.length - 1)]);
      const x = indice * espacamento;
      const y = Phaser.Math.Between(-this.scale.height, this.scale.height);
      const cauda = this.add.text(x, y, caracteres.join("\n"), {
        fontFamily: "monospace", fontSize: `${tamanho}px`, color: "#159447", lineSpacing: 1,
      }).setDepth(-2).setAlpha(0.5);
      const cabeca = this.add.text(x, y, caracteres[0], {
        fontFamily: "monospace", fontSize: `${tamanho}px`, color: "#c5ffd8",
      }).setDepth(-1).setAlpha(0.9);
      this.colunasMatrix.push({ cauda, cabeca, caracteres, y, velocidade: Phaser.Math.Between(60, 150) });
    }
  }

  mudarFundo(chave) {
    if (!this.fundos) this.fundos = {};
    if (!chave) {
      Object.values(this.fundos).forEach(item => this.tweens.add({ targets: item, alpha: 0, duration: 500 }));
      this.tweens.add({ targets: this.fundoPreto, alpha: 1, duration: 500 });
      return;
    }
    let fundo = this.fundos[chave];
    if (!fundo) {
      fundo = this.add.image(this.scale.width / 2, this.scale.height / 2, chave, 0)
        .setDisplaySize(this.scale.width, this.scale.height).setDepth(-8).setAlpha(0);
      this.fundos[chave] = fundo;
    }
    Object.entries(this.fundos).forEach(([nome, item]) => {
      if (nome === chave) this.tweens.add({ targets: item, alpha: 1, duration: 500 });
      else this.tweens.add({ targets: item, alpha: 0, duration: 500 });
    });
    this.fundoPreto.setAlpha(chave ? 0 : 1);
    this.fundoPreto.setDepth(-10);
  }

  iniciarEscolha() {
    this.etapa = "escolha";
    this.opcao = 0;
    this.chris.setTexture("Chris3");
    this.ajustarChris(0.62);
    this.ajudaEscolha.setVisible(true);
    this.rotuloEsquerdo = this.add.text(this.scale.width * 0.12, this.scale.height * 0.69,
      "ACEITAR O DESTINO\nIMPOSTO", this.estiloRotulo("left"))
      .setOrigin(0, 0.5).setDepth(9).setVisible(false);
    this.rotuloDireito = this.add.text(this.scale.width * 0.88, this.scale.height * 0.69,
      "RECUSAR O DESTINO\nIMPOSTO", this.estiloRotulo("right"))
      .setOrigin(1, 0.5).setDepth(9).setVisible(false);
    this.texto.setText("");
    this.maosPreparadas = false;
  }

  prepararMaos() {
    if (this.maosPreparadas) return;
    this.maosPreparadas = true;
    this.chris.setTexture("Chris3.1");
    this.ajustarChris(0.62);
    this.ajudaEscolha.setVisible(false);
    const alturaChris = this.scale.height * 0.86;
    this.maoEsquerda = this.add.image(this.chris.x, this.chris.y, "Chris23")
      .setDisplaySize(this.chris.displayWidth, alturaChris).setDepth(6);
    this.maoDireita = this.add.image(this.chris.x, this.chris.y, "Chris32")
      .setDisplaySize(this.chris.displayWidth, alturaChris).setDepth(6);
  }

  estiloRotulo(align) {
    const escala = this.scale.width / 1920;
    return {
      fontFamily: "RetroFont, monospace", fontSize: `${Math.round(25 * escala)}px`,
      color: "#39ff63", align, lineSpacing: 8 * escala,
      wordWrap: { width: this.scale.width * 0.27 },
    };
  }

  selecionarOpcao(opcao) {
    if (this.opcao === opcao) return;
    this.opcao = opcao;
    this.atualizarEscolha();
  }

  atualizarEscolha() {
    this.rotuloEsquerdo.setVisible(this.opcao === 0);
    this.rotuloDireito.setVisible(this.opcao === 1);
    const sobeEsquerda = this.opcao === 0 ? -24 : 18;
    const sobeDireita = this.opcao === 1 ? -24 : 18;
    this.tweens.add({ targets: this.maoEsquerda, y: this.chris.y + sobeEsquerda, duration: 280, ease: "Sine.Out" });
    this.tweens.add({ targets: this.maoDireita, y: this.chris.y + sobeDireita, duration: 280, ease: "Sine.Out" });
  }

  atualizarConfirmacao() {
    this.texto.setText("Você tem certeza?\n\n" + (this.confirmacao === 0 ? "> SIM       NÃO" : "  SIM      > NÃO"));
  }

  aceitarDestino() {
    this.etapa = "fim";
    this.escreverTexto("Excelente. Sabia que você não iria me decepcionar.\nO futuro será glorioso para você.",
      () => this.time.delayedCall(2500, () => this.scene.start("CenaCreditos")));
  }

  recusarDestino() {
    this.etapa = "recusa";
    this.indiceFala = 0;
    this.chris.setTexture("Chris2");
    this.ajustarChris();
    this.ajudaEscolha.setVisible(false);
    this.maoEsquerda?.destroy();
    this.maoDireita?.destroy();
    this.rotuloEsquerdo?.destroy();
    this.rotuloDireito?.destroy();
    this.escreverTexto(FALAS_RECUSA[0]);
    this.agendarTremor();
  }

  agendarTremor() {
    if (this.etapa !== "recusa") return;
    this.time.delayedCall(Phaser.Math.Between(3000, 5000), () => {
      if (this.etapa !== "recusa") return;
      const x = this.chris.x;
      this.tweens.add({ targets: this.chris, x: x + 7, duration: 55, yoyo: true, repeat: 3,
        onComplete: () => { this.chris.x = x; this.agendarTremor(); } });
    });
  }

  iniciarBranqueamento() {
    this.etapa = "transicao";
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2,
      this.scale.width, this.scale.height, 0xffffff).setDepth(100).setAlpha(0);
    const branco = this.children.list.at(-1);
    this.tweens.add({ targets: branco, alpha: 1, duration: 1700,
      onComplete: () => this.scene.start("CenaHistoria4", this.dadosHistoria) });
  }
}
