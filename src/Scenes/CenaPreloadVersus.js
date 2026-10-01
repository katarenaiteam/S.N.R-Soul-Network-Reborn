import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";
import { carregarAssetsVersus } from "../Objetos/CarregarAssetsPartida.js";

export default class CenaPreloadVersus extends Phaser.Scene {
  constructor() {
    super({ key: "CenaPreloadVersus" });
  }

  init(dados = {}) {
    this.dadosPartida = dados;
    this.transicionando = false;
  }

  create() {
    encerrarOutrasCenas(this);
    this.cameras.main.setBackgroundColor("#000000");
    this.criarVideo();
    this.events.once("shutdown", this.limparVideo, this);

    const quantidade = carregarAssetsVersus(this, this.dadosPartida);
    this.load.once("complete", this.iniciarPartida, this);
    if (quantidade > 0) this.load.start();
    else this.iniciarPartida();
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
    this.scene.start("cenaPrincipal", this.dadosPartida);
  }

  limparVideo() {
    this.video?.pause();
    this.video?.remove();
  }
}
