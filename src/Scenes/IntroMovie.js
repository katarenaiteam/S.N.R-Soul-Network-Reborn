import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";
import { carregarAssetsHistoria } from "../Objetos/CarregarAssetsPartida.js";

export default class IntroMovie extends Phaser.Scene {
  constructor() {
    super({ key: "IntroMovie" });
  }

  init(dados = {}) {
    this.dadosHistoria = dados;
    this.assetsProntos = false;
    this.videoTerminou = false;
    this.transicionando = false;
  }

  create() {
    encerrarOutrasCenas(this);
    const musicaMenu = this.registry.get("musicaMenu");
    musicaMenu?.stop();
    musicaMenu?.destroy();
    this.registry.remove("musicaMenu");
    this.cameras.main.setBackgroundColor("#000000");
    this.criarVideo();
    this.criarAviso();

    this.teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.input.keyboard.on("keydown-ESC", this.pular, this);
    this.video.addEventListener("ended", this.aoTerminarVideo);
    this.events.once("shutdown", this.limparVideo, this);

    const quantidade = carregarAssetsHistoria(this);
    this.load.once("complete", this.aoCarregarAssets, this);
    if (quantidade > 0) this.load.start();
    else this.aoCarregarAssets();
  }

  criarVideo() {
    this.video = document.createElement("video");
    this.video.src = "assets/Menus/IntroMovie/historia-hold.mp4";
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.preload = "auto";
    this.video.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;z-index:9998";
    document.body.appendChild(this.video);
    const tentativa = this.video.play();
    tentativa?.catch(() => {
      this.video.muted = true;
      this.video.play().catch(() => {});
    });
  }

  criarAviso() {
    this.aviso = document.createElement("div");
    this.aviso.textContent = "CARREGANDO HISTÓRIA...";
    this.aviso.style.cssText = "position:fixed;left:50%;bottom:5vh;transform:translateX(-50%);color:#8cffaa;font:24px monospace;text-shadow:0 0 8px #28ff88;z-index:9999;white-space:nowrap";
    document.body.appendChild(this.aviso);
  }

  aoCarregarAssets() {
    if (this.assetsProntos) return;
    this.assetsProntos = true;
    this.aviso.textContent = "PRESSIONE ESC PARA PULAR";
    if (this.videoTerminou) this.irParaSelecaoDePersonagem();
  }

  aoTerminarVideo = () => {
    this.videoTerminou = true;
    if (this.assetsProntos) this.irParaSelecaoDePersonagem();
  };

  pular() {
    if (this.assetsProntos) this.irParaSelecaoDePersonagem();
  }

  irParaSelecaoDePersonagem() {
    if (this.transicionando) return;
    this.transicionando = true;
    this.scene.start("Charmenu", { ...this.dadosHistoria, modo: "historia" });
  }

  limparVideo() {
    this.video?.removeEventListener("ended", this.aoTerminarVideo);
    this.video?.pause();
    this.video?.remove();
    this.aviso?.remove();
    this.input.keyboard.off("keydown-ESC", this.pular, this);
  }
}
