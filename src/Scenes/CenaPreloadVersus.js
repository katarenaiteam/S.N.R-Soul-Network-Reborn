import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";
import { carregarAssetsVersus } from "../Objetos/CarregarAssetsPartida.js";
import { publicarEstadoVersus } from "../Objetos/PublicarEstadoVersus.js";

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
      this.ultimaPublicacaoEstado = this.time.now;
      this.publicarEstadoMQTT();
    }
    this.cameras.main.setBackgroundColor("#000000");
    this.criarVideo();
    if (this.modoEspectador) {
      this.load.maxParallelDownloads = 8;
      this.load.xhr.timeout = 30000;
    }
    this.events.once("shutdown", this.limparVideo, this);

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

  criarVideo() {
    this.video = document.createElement("video");
    this.video.src = "assets/Menus/IntroMovie/historia-hold.mp4";
    this.video.autoplay = true;
    this.video.loop = true;
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.preload = "auto";
    this.video.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;z-index:9998";
    document.body.appendChild(this.video);
    this.video.play().catch(() => {});
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

  limparVideo() {
    this.video?.pause();
    this.video?.remove();
  }
}
