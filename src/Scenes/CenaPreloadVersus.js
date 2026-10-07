import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";
import { carregarAssetsVersus } from "../Objetos/CarregarAssetsPartida.js";
import { publicarEstadoVersus } from "../Objetos/PublicarEstadoVersus.js";
import { PERSONAGENS } from "./Charmenu.js";

export default class CenaPreloadVersus extends Phaser.Scene {
  constructor() {
    super({ key: "CenaPreloadVersus" });
  }

  init(dados = {}) {
    this.dadosPartida = dados;
    this.transicionando = false;
    this.modoEspectador = dados.espectador === true;
  }

  create() {
    encerrarOutrasCenas(this);
    if (!this.modoEspectador) {
      const musicaMenu = this.registry.get("musicaMenu");
      musicaMenu?.stop();
      musicaMenu?.destroy();
      this.registry.remove("musicaMenu");
      this.ultimaPublicacaoEstado = this.time.now;
      this.publicarEstadoMQTT();
    }
    this.cameras.main.setBackgroundColor("#000000");
    this.criarTelaVersus();
    if (this.modoEspectador) {
      this.load.maxParallelDownloads = 8;
      this.load.xhr.timeout = 30000;
    }

    const quantidade = carregarAssetsVersus(this, this.dadosPartida);
    this.load.once("complete", this.iniciarPartida, this);
    if (quantidade > 0) this.load.start();
    else this.iniciarPartida();
  }

  update() {
    if (this.modoEspectador || this.time.now - this.ultimaPublicacaoEstado < 3000) return;
    this.ultimaPublicacaoEstado = this.time.now;
    this.publicarEstadoMQTT();
  }

  publicarEstadoMQTT() {
    publicarEstadoVersus(this, "preload-versus", {
      p1: this.dadosPartida.p1,
      p2: this.dadosPartida.p2,
      mapa: this.dadosPartida.mapa || this.dadosPartida.ClasseMapa?.name,
    });
  }

  criarTelaVersus() {
    const largura = this.scale.width;
    const altura = this.scale.height;
    const escalaResolucao = largura / 1920;

    this.add.image(largura / 2, altura / 2, "Vs-back")
      .setDisplaySize(largura, altura)
      .setTint(0x555555)
      .setDepth(-2);

    if (!this.anims.exists("versus-vss-loop")) {
      this.anims.create({
        key: "versus-vss-loop",
        frames: this.anims.generateFrameNumbers("Vss", { start: 4, end: 19 }),
        frameRate: 12,
        repeat: -1,
      });
    }
    const vss = this.add.sprite(largura / 2, altura / 2, "Vss", 4)
      .setScale(3 * escalaResolucao)
      .setDepth(0)
      .setVisible(false);
    this.time.delayedCall(500, () => {
      if (!vss.active) return;
      vss.setVisible(true).play("versus-vss-loop");
    });

    if (this.dadosPartida.p1) this.criarBanner(1, this.dadosPartida.p1, escalaResolucao);
    if (this.dadosPartida.p2) this.criarBanner(2, this.dadosPartida.p2, escalaResolucao);
  }

  criarBanner(numeroJogador, idPersonagem, escalaResolucao) {
    const personagem = PERSONAGENS.find((item) => item.id === idPersonagem);
    if (!personagem?.banner || !this.textures.exists(personagem.banner)) return;

    const largura = this.scale.width;
    const altura = this.scale.height;
    const config = personagem.bannerConfig ?? {};
    const lado = numeroJogador === 1 ? config.p1 ?? {} : config.p2 ?? {};
    const escala = (config.escala ?? 1) * escalaResolucao;
    const banner = this.add.image(0, 0, personagem.banner)
      .setScale(escala)
      .setDepth(1);

    const destinoY = altura + (lado.y ?? 0) * escalaResolucao;
    let destinoX;
    if (numeroJogador === 1) {
      destinoX = (lado.x ?? 0) * escalaResolucao;
      banner.setOrigin(0, 1);
    } else {
      destinoX = largura + (lado.x ?? 0) * escalaResolucao;
      banner.setOrigin(1, 1).setFlipX(true);
    }

    banner.setPosition(destinoX, destinoY);
  }

  iniciarPartida() {
    if (this.transicionando) return;
    this.transicionando = true;

    if (this.modoEspectador) {
      this.registry.set("assetsVersusEspectadorProntos", true);
      this.game.scene.getScene("CenaEspectador")?.sincronizarCena();
      return;
    }

    this.scene.start("cenaPrincipal", this.dadosPartida);
  }
}
