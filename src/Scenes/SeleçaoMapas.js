import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";
import ControleEntrada from "../Objetos/ControleEntrada.js";
import Cidade from "../Mapasjs/Cidade.js";
import MapaTeste from "../Mapasjs/MapaTeste.js";
import MikuMap from "../Mapasjs/MikuMap.js";
import { publicarEstadoVersus } from "../Objetos/PublicarEstadoVersus.js";

export default class CenaSelecaoMapa extends Phaser.Scene {
  constructor() {
    super({ key: "CenaSelecaoMapa" });
    // Inicializar variáveis para armazenar escolha de personagens
    this.escolhaPersonagens = null;
  }

  init(data) {
    // Receber os dados dos personagens selecionados do Charmenu
    this.escolhaPersonagens = data;
    this.modoEspectador = data?.espectador === true;
  }

  create() {
    encerrarOutrasCenas(this);
    if (this.modoEspectador) {
      this.mqtt = this.registry.get("clienteMQTT");
      this.aoReceberEstadoMQTT = (estado) => this.aplicarEstadoEspectador(estado);
      this.mqtt?.on("message:state", this.aoReceberEstadoMQTT);
      this.events.once("shutdown", () => {
        this.mqtt?.off("message:state", this.aoReceberEstadoMQTT);
      });
    }
    this.cameras.main.setBackgroundColor("#000000");
    this.cameras.main.fadeIn(350, 0, 0, 0);
    this.criarChuvaMatrix();

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

    // 2. ARRAY DOS MAPAS COM AS SUAS RESPECTIVAS IMAGENS (SPRITES/PREVIEWS)
    this.mapas = [
      { id: "cidade", nome: "Cidade", classe: Cidade, chaveSprite: "thumb_cidade" },
      { id: "mapaTeste", nome: "Mapa Teste", classe: MapaTeste, chaveSprite: "thumb_teste" },
      { id: "MikuMap", nome: "MikuMap", classe: MikuMap, chaveSprite: "thumb_mikushow" },
    ];

    this.indiceOpcao = 0; // Começa no primeiro mapa
    this.spritesMapas = [];

    // Cria as imagens de preview dos mapas
    this.mapas.forEach((mapa) => {
      const spriteMapa = this.add.image(this.scale.width / 2, this.scale.height / 2, mapa.chaveSprite);
      this.spritesMapas.push(spriteMapa);
      this.conteudoMenu.add(spriteMapa);
    });

    // 3. SUPORTE A TECLADO (A/D e SETAS ESQUERDA/DIREITA) + CONTROLEENTRADA
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
    if (this.modoEspectador) {
      this.time.delayedCall(0, () => this.aplicarEstadoEspectador(this.registry.get("estadoEspectador")));
    } else {
      this.publicarEstadoMQTT(0, true);
    }
  }

  update(_tempo, delta) {
    this.atualizarChuvaMatrix(delta);
    if (this.modoEspectador) return;

    this.publicarEstadoMQTT(_tempo);
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

  publicarEstadoMQTT(tempo, forcar = false) {
    if (tempo - (this.ultimaPublicacaoMQTT || 0) < 100 && !forcar) return;
    this.ultimaPublicacaoMQTT = tempo;
    publicarEstadoVersus(this, "selecao-mapa", {
      p1: this.escolhaPersonagens?.p1,
      p2: this.escolhaPersonagens?.p2,
      indiceOpcao: this.indiceOpcao,
      mapa: this.mapas[this.indiceOpcao]?.classe.name,
    });
  }

  aplicarEstadoEspectador(estado) {
    if (estado?.cena !== "selecao-mapa" || estado.modo !== "1v1") return;
    const indice = estado.dados?.indiceOpcao;
    if (!Number.isInteger(indice) || indice < 0 || indice >= this.mapas.length) return;
    if (indice === this.indiceOpcao) return;
    this.indiceOpcao = indice;
    this.atualizarCarrossel(true);
  }

  criarChuvaMatrix() {
    this.colunasMatrix = [];
    const escala = this.scale.width / 1920;
    const espacamento = Math.max(26, 34 * escala);
    const quantidade = Math.ceil(this.scale.width / espacamento);
    const alfabeto = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let i = 0; i < quantidade; i += 1) {
      if (Phaser.Math.FloatBetween(0, 1) < 0.18) continue;
      const tamanho = Phaser.Math.Between(10, 18) * escala;
      const caracteres = Array.from({ length: Phaser.Math.Between(8, 18) }, () =>
        alfabeto[Phaser.Math.Between(0, alfabeto.length - 1)]
      );
      const x = i * espacamento;
      const y = Phaser.Math.Between(-this.scale.height, this.scale.height);
      const cauda = this.add.text(x, y, caracteres.join("\n"), {
        fontFamily: "monospace", fontSize: `${tamanho}px`, color: "#159447", lineSpacing: 1,
      }).setDepth(-2).setAlpha(0.5);
      const cabeca = this.add.text(x, y, caracteres[0], {
        fontFamily: "monospace", fontSize: `${tamanho}px`, color: "#c5ffd8",
      }).setDepth(-1).setAlpha(0.9);
      this.colunasMatrix.push({ cauda, cabeca, caracteres, y, velocidade: Phaser.Math.Between(60, 150) * escala, altura: tamanho * caracteres.length });
    }
  }

  atualizarChuvaMatrix(delta) {
    for (const coluna of this.colunasMatrix || []) {
      coluna.y += coluna.velocidade * (delta / 1000);
      if (coluna.y > this.scale.height + coluna.altura) {
        coluna.y = Phaser.Math.Between(-coluna.altura, -20);
        coluna.caracteres = coluna.caracteres.map(() =>
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Phaser.Math.Between(0, 35)]
        );
        coluna.cauda.setText(coluna.caracteres.join("\n"));
        coluna.cabeca.setText(coluna.caracteres[0]);
        coluna.altura = coluna.cauda.height;
      }
      coluna.cauda.setPosition(coluna.cauda.x, coluna.y);
      coluna.cabeca.setPosition(coluna.cabeca.x, coluna.y);
    }
  }

  // Disposição e animação estilo catálogo/carrossel
  atualizarCarrossel(comAnimacao = true) {
    const total = this.mapas.length;
    const centroX = this.scale.width / 2;
    const centroY = this.scale.height / 2;
    const escalaResolucao = this.scale.width / 1920;

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
        escala = 1.15 * escalaResolucao;
        profundidade = 30;
        alpha = 1.0;
      } else if (offset === -1 || (offset === total - 1 && total > 2)) {
        // MAPA À ESQUERDA (MENOR E ATRÁS)
        alvoX = centroX - 450 * escalaResolucao;
        alvoY = centroY + 20 * escalaResolucao;
        escala = 0.65 * escalaResolucao;
        profundidade = 20;
        alpha = 0.6;
      } else if (offset === 1 || (offset === -(total - 1) && total > 2)) {
        // MAPA À DIREITA (MENOR E ATRÁS)
        alvoX = centroX + 450 * escalaResolucao;
        alvoY = centroY + 20 * escalaResolucao;
        escala = 0.65 * escalaResolucao;
        profundidade = 20;
        alpha = 0.6;
      } else {
        // OUTROS MAPAS ESCONDIDOS
        alvoX = offset < 0 ? centroX - 800 * escalaResolucao : centroX + 800 * escalaResolucao;
        alvoY = centroY;
        escala = 0.3 * escalaResolucao;
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
    // Animamos o container diretamente
    this.tweens.add({
      targets: this.conteudoMenu,
      scaleY: 0,
      y: this.scale.height / 2,
      duration: 400,
      ease: "Cubic.easeIn",
      onComplete: () => {
        // Inicia a arena repassando a classe do mapa selecionado e os personagens
        this.scene.start("CenaPreloadVersus", {
          ClasseMapa: this.mapas[this.indiceOpcao].classe,
          mapa: this.mapas[this.indiceOpcao].classe.name,
          p1: this.escolhaPersonagens?.p1,
          p2: this.escolhaPersonagens?.p2,
          modo: "1v1"
        });
      }
    });
  }
}
