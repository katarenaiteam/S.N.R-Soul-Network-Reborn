import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";

const ASSETS = {
  backStart: ["image", "assets/Menus/Start_menu/backStart.png"],
  logo: ["image", "assets/Menus/Start_menu/logo.png"],
  KatarenaiLogo: ["image", "assets/Menus/Preload/KatarenaiLogo.png"],
  campos: ["image", "assets/Menus/creditos/campospfp.png"],
  theo: ["image", "assets/Menus/creditos/theopfp.webp"],
  marcos: ["image", "assets/Menus/creditos/marcospfp.webp"],
  musica: ["audio", "assets/Menus/Char_menu/Audio/katarenai8bit.mp3"],
  Miku_idle: ["sheet", "assets/personagens/Miku/Sprites/Miku_idle.png", 334, 360],
  Miku_walk: ["sheet", "assets/personagens/Miku/Sprites/Miku_walk.png", 467, 357],
  Miku_jump: ["sheet", "assets/personagens/Miku/Sprites/Miku_jump.png", 490, 342],
  Miku_taunt1: ["sheet", "assets/personagens/Miku/Sprites/Miku_taunt1.png", 304, 374],
  Miku_airplosion: ["sheet", "assets/personagens/Miku/Sprites/Miku_airplosion.png", 490, 342],
  Miku_hurtSide: ["sheet", "assets/personagens/Miku/Sprites/Miku_hurtSide.png", 334, 351],
  Pingu_idle: ["sheet", "assets/personagens/Pingu/Sprites/Pingu_idle.png", 39, 62],
  Pingu_walk: ["sheet", "assets/personagens/Pingu/Sprites/Pingu_walk.png", 40, 61],
  Pingu_jump: ["sheet", "assets/personagens/Pingu/Sprites/Pingu_jump.png", 59, 101],
  Pingu_downAtack: ["sheet", "assets/personagens/Pingu/Sprites/Pingu_downAtack.png", 203, 146],
  Pingu_doLaunch: ["sheet", "assets/personagens/Pingu/Sprites/Pingu_doLaunch.png", 147, 145],
  Pingu_hurt: ["sheet", "assets/personagens/Pingu/Sprites/Pingu_hurt.png", 181, 190],
  Pingu_taunt2: ["sheet", "assets/personagens/Pingu/Sprites/Pingu_taunt2.png", 41, 69],
  Slan_idle: ["sheet", "assets/personagens/Slenderman/Sprites/Slan_idle.png", 91, 124],
  Slan_walk: ["sheet", "assets/personagens/Slenderman/Sprites/Slan_walk.png", 88, 118],
  Slan_jump: ["sheet", "assets/personagens/Slenderman/Sprites/Slan_jump.png", 51, 124],
  Slan_sideAtack: ["sheet", "assets/personagens/Slenderman/Sprites/Slan_sideAtack.png", 128, 126],
  Slan_hurt1: ["sheet", "assets/personagens/Slenderman/Sprites/Slan_hurt1.png", 114, 109],
  Slan_taunt: ["sheet", "assets/personagens/Slenderman/Sprites/Slan_taunt.png", 103, 122],
};

const FOTOS_DESENVOLVEDORES = {
  campos: "assets/Menus/creditos/campospfp.png",
  theo: "assets/Menus/creditos/theopfp.webp",
  marcos: "assets/Menus/creditos/marcospfp.webp",
};

export default class CenaCreditos extends Phaser.Scene {
  constructor() { super({ key: "CenaCreditos" }); }

  preload() {
    Object.entries(ASSETS).forEach(([key, [type, path, fw, fh]]) => {
      if (type === "audio") {
        if (!this.cache.audio.exists("katarenai8bit")) this.load.audio("katarenai8bit", path);
      } else if (!this.textures.exists(key)) {
        if (type === "image") this.load.image(key, path);
        else this.load.spritesheet(key, path, { frameWidth: fw, frameHeight: fh });
      }
    });
  }

  iniciarVideosCreditos(indices, proximo, spritesParaOcultar = []) {
    const anteriores = [this.pfp, this.nome, this.funcao, ...spritesParaOcultar]
      .filter((elemento) => elemento?.visible);
    const iniciar = () => {
      anteriores.forEach((elemento) => elemento.setVisible(false));
      this.tocarSequenciaVideos(indices, proximo);
    };
    if (anteriores.length === 0) iniciar();
    else this.tweens.add({ targets: anteriores, alpha: 0, duration: 300, onComplete: iniciar });
  }

  tocarSequenciaVideos(indices, proximo) {
    let posicao = 0;
    const proximoVideo = () => {
      if (posicao >= indices.length) { proximo(); return; }
      const video = document.createElement("video");
      this.videoCreditos = video;
      const numeroCredito = indices[posicao++];
      video.src = `assets/Menus/creditos/credito${numeroCredito}.mp4`;
      video.playsInline = true;
      video.preload = "auto";
      video.muted = true;
      const quadroVideo = document.createElement("div");
      this.videoCreditosContainer = quadroVideo;
      quadroVideo.style.cssText = "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:12px;width:min(46vw,620px);z-index:10000;opacity:0;transition:opacity 650ms ease;pointer-events:none";
      video.style.cssText = "display:block;width:100%;height:min(34vh,300px);object-fit:contain;background:#000";
      const legenda = document.createElement("div");
      legenda.textContent = "Fases do desenvolvimento";
      legenda.style.cssText = "color:#00ff36;background:rgba(0,0,0,.9);padding:8px 18px;font-family:'RetroFont',monospace;font-size:clamp(16px,2vw,25px);letter-spacing:.04em;text-align:center";
      quadroVideo.append(video, legenda);
      document.body.appendChild(quadroVideo);
      video.addEventListener("loadeddata", () => { quadroVideo.style.opacity = "1"; }, { once: true });
      video.playbackRate = 1;
      video.addEventListener("loadedmetadata", () => {
        if (!Number.isFinite(video.duration)) return;
        const duracao = Math.max(1, video.duration - 2);
        video.creditosTimeout = setTimeout(finalizar, duracao * 1000);
      }, { once: true });
      let finalizando = false;
      const finalizar = () => {
        if (finalizando) return;
        finalizando = true;
        clearTimeout(video.creditosTimeout);
        quadroVideo.style.opacity = "0";
        video.creditosFadeTimeout = setTimeout(() => {
          video.pause();
          quadroVideo.remove();
          if (this.videoCreditos === video) this.videoCreditos = null;
          if (this.videoCreditosContainer === quadroVideo) this.videoCreditosContainer = null;
          this.time.delayedCall(100, proximoVideo);
        }, 650);
      };
      video.addEventListener("ended", finalizar, { once: true });
      video.addEventListener("error", finalizar, { once: true });
      video.play().catch(finalizar);
    };
    proximoVideo();
  }

  limparVideoCreditos() {
    this.limparCartaoDesenvolvedor();
    if (!this.videoCreditos) return;
    clearTimeout(this.videoCreditos.creditosTimeout);
    clearTimeout(this.videoCreditos.creditosFadeTimeout);
    this.videoCreditos.pause();
    this.videoCreditos.remove();
    this.videoCreditosContainer?.remove();
    this.videoCreditosContainer = null;
    this.videoCreditos = null;
  }

  limparCartaoDesenvolvedor() {
    clearTimeout(this.cartaoDevTimer);
    this.cartaoDev?.remove();
    this.cartaoDev = null;
  }

  create() {
    encerrarOutrasCenas(this);
    this.inicioCreditos = this.time.now;
    const w = this.scale.width, h = this.scale.height, s = w / 1366;
    this.cameras.main.setBackgroundColor("#000000");
    this.fundo = this.add.image(w / 2, h / 2, "backStart").setDisplaySize(w, h).setAlpha(0);
    this.conteudo = this.add.container(0, 0).setAlpha(0);
    this.logo = this.add.image(w / 2, h * 0.245, "logo").setDisplaySize(w * 0.6, w * 0.6 * (365 / 683));
    this.conteudo.add(this.logo);
    const txt = (x, y, text, size, opts = {}) => this.add.text(x, y, text, {
      fontFamily: "RetroFont, monospace", fontSize: `${size * s}px`, color: "#00ff36", align: "center", ...opts,
    }).setOrigin(0.5);
    this.txt = txt;

    // Cartela de autoria no alto, com a imagem do time sem distorcer a proporção original.
    this.escrita = txt(w / 2, h * 0.13, "um jogo por", 38).setAlpha(0);
    const larguraLogoEquipe = Math.min(w * 0.34, h * 0.68);
    this.logoTeam = this.add.image(w / 2, h * 0.53, "KatarenaiLogo")
      .setDisplaySize(larguraLogoEquipe, larguraLogoEquipe * 0.8).setAlpha(0);
    // Os retratos são quadrados e ocupam o mesmo espaço da referência.
    this.pfp = this.add.image(w * 0.36, h * 0.31, "campos").setVisible(false);
    this.ajustarPfp(h * 0.34, h * 0.34);
    this.nome = txt(w * 0.445, h * 0.28, "Campos", 56, { color: "#00ff36" })
      .setOrigin(0, 0.5).setVisible(false);
    this.funcao = txt(w * 0.445, h * 0.38, "programação", 29, { color: "#00ff36" })
      .setOrigin(0, 0.5).setVisible(false);
    this.personagens = {};

    this.tocarMusica();
    this.cameras.main.fadeIn(900, 0, 0, 0);
    this.tweens.add({ targets: this.fundo, alpha: 1, duration: 900 });
    this.tweens.add({ targets: this.conteudo, alpha: 1, duration: 900,
      onComplete: () => this.time.delayedCall(4000, () => this.mostrarEquipe()) });
    this.events.once("shutdown", this.limparVideoCreditos, this);
  }

  tocarMusica() {
    let musica = this.registry.get("musicaCreditos");
    if (!musica || !musica.isPlaying) {
      musica = this.sound.add("katarenai8bit", { loop: false, volume: 0.8 });
      this.registry.set("musicaCreditos", musica);
    }
    musica.once("complete", () => {
      this.registry.remove("musicaCreditos");
      this.scene.start("CenaAvaliacao");
    });
    if (!musica.isPlaying) musica.play();
  }

  quadro(sprite, textura, primeiro, ultimo, fps, loop = false, aoTerminar = null) {
    sprite.creditosTimer?.remove(false);
    let frame = primeiro;
    sprite.setTexture(textura, frame);
    this.ajustarAlturaSprite(sprite);
    const avancar = () => {
      if (!sprite.active) return;
      if (frame === ultimo) {
        if (!loop) { sprite.creditosTimer = null; aoTerminar?.(); return; }
        frame = primeiro;
      } else frame += 1;
      sprite.setTexture(textura, frame);
      this.ajustarAlturaSprite(sprite);
      sprite.creditosTimer = this.time.delayedCall(1000 / fps, avancar);
    };
    sprite.creditosTimer = this.time.delayedCall(1000 / fps, avancar);
  }

  personagem(id, textura, x, y, largura, altura, flip = false) {
    const sprite = this.add.sprite(x, y, textura, 0).setFlipX(flip);
    sprite.alturaCreditos = altura;
    this.ajustarAlturaSprite(sprite);
    this.personagens[id] = sprite;
    return sprite;
  }

  ajustarAlturaSprite(sprite) {
    if (sprite.texture.key === "Pingu_doLaunch") {
      // O quadro da esfera tem bastante transparência; amplie a arte, sem alterar proporção.
      sprite.setScale(this.scale.height / 768 * 3);
      return;
    }
    const frame = this.textures.get(sprite.texture.key).get(0);
    if (frame?.height && sprite.alturaCreditos) sprite.setScale(sprite.alturaCreditos / frame.height);
  }

  ajustarPfp(larguraMaxima, alturaMaxima) {
    const imagem = this.pfp.texture.getSourceImage();
    const escala = Math.min(larguraMaxima / imagem.width, alturaMaxima / imagem.height);
    this.pfp.setScale(escala);
  }

  mostrarEquipe() {
    this.tweens.add({ targets: this.conteudo, alpha: 0, duration: 500, onComplete: () => {
      this.conteudo.setVisible(false);
      this.escrita.setVisible(true).setAlpha(0);
      this.logoTeam.setVisible(true).setAlpha(0);
      this.tweens.add({ targets: [this.escrita, this.logoTeam], alpha: 1, duration: 700 });
      this.time.delayedCall(5000, () => this.tweens.add({ targets: [this.escrita, this.logoTeam], alpha: 0, duration: 500,
        onComplete: () => { this.escrita.setVisible(false); this.logoTeam.setVisible(false); this.iniciarVideosCreditos([1, 2], () => this.apresentarMiku()); } }));
    }});
  }

  apresentarMiku() {
    const { width: w, height: h } = this.scale;
    const miku = this.personagem("miku", "Miku_jump", w * 0.18, -h * 0.35, h * 0.39, h * 0.43);
    this.quadro(miku, "Miku_jump", 0, 1, 12, true);
    this.tweens.add({ targets: miku, y: h * 0.69, duration: 650, ease: "Cubic.easeIn", onComplete: () => {
      miku.creditosTimer?.remove(false);
      this.quadro(miku, "Miku_idle", 0, 13, 12, true);
      this.time.delayedCall(450, () => this.mikuFeita());
    }});
  }

  mikuFeita() {
    this.quadro(this.personagens.miku, "Miku_taunt1", 0, 28, 8, false,
      () => this.quadro(this.personagens.miku, "Miku_idle", 0, 13, 12, true));
    this.apresentar("campos", "Campos", "programação", () => this.entradaPingu(), 5000);
  }

  apresentar(foto, nome, funcao, proximo, tempoTela = 5000) {
    this.limparCartaoDesenvolvedor();
    this.pfp.setVisible(false); this.nome.setVisible(false); this.funcao.setVisible(false);
    const cartao = document.createElement("div");
    this.cartaoDev = cartao;
    cartao.style.cssText = "position:fixed;left:50%;top:31%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;gap:28px;width:min(72vw,900px);z-index:10020;opacity:0;transition:opacity 600ms ease;pointer-events:none";
    const imagem = document.createElement("img");
    imagem.src = FOTOS_DESENVOLVEDORES[foto];
    imagem.alt = nome;
    imagem.style.cssText = "display:block;flex:0 0 auto;width:clamp(150px,20vw,240px);height:clamp(150px,20vw,240px);object-fit:contain";
    const textos = document.createElement("div");
    textos.style.cssText = "display:flex;flex-direction:column;gap:10px;color:#00ff36;font-family:'RetroFont',monospace;text-shadow:2px 2px #001a08";
    const nomeDev = document.createElement("div");
    nomeDev.textContent = nome;
    nomeDev.style.cssText = "font-size:clamp(38px,5vw,68px);line-height:1.1";
    const funcaoDev = document.createElement("div");
    funcaoDev.textContent = funcao;
    funcaoDev.style.cssText = "font-size:clamp(22px,2.7vw,36px);line-height:1.2";
    textos.append(nomeDev, funcaoDev);
    cartao.append(imagem, textos);
    document.body.appendChild(cartao);
    requestAnimationFrame(() => {
      if (this.cartaoDev !== cartao) return;
      cartao.style.opacity = "1";
      this.cartaoDevTimer = setTimeout(() => {
        cartao.style.opacity = "0";
        this.cartaoDevTimer = setTimeout(() => {
          cartao.remove();
          if (this.cartaoDev === cartao) this.cartaoDev = null;
          proximo();
        }, 600);
      }, tempoTela);
    });
  }

  entradaPingu() {
    const { width: w, height: h } = this.scale;
    // O Pingu cruza a tela da esquerda rolando no spin dash e colide com a Miku.
    const pingu = this.personagem("pingu", "Pingu_doLaunch", -h * 0.2, h * 0.79, h * 0.27, h * 0.27);
    this.quadro(pingu, "Pingu_doLaunch", 0, 4, 24, true);
    this.tweens.add({ targets: pingu, x: w * 0.82, duration: 700, onUpdate: () => {
      if (!pingu.acertouMiku && pingu.x >= w * 0.2) {
        pingu.acertouMiku = true;
        const miku = this.personagens.miku;
        miku.setPosition(w * 0.2, h * 0.69);
        this.quadro(miku, "Miku_hurtSide", 0, 1, 18, false);
        this.tweens.add({ targets: miku, x: -h * 0.34, y: h * 0.76, duration: 360, ease: "Cubic.easeOut" });
      }
    }, onComplete: () => {
      this.quadro(pingu, "Pingu_taunt2", 0, 24, 12, false,
        () => this.quadro(pingu, "Pingu_idle", 0, 5, 12, true));
      this.apresentar("theo", "Theo", "direção de arte", () => {
        pingu.creditosTimer?.remove(false);
        this.entradaSlender();
      }, 5000);
    }});
  }

  entradaSlender() {
    const { width: w, height: h } = this.scale;
    const pingu = this.personagens.pingu;
    pingu.setPosition(w * 0.78, h * 0.79).setVisible(true).setAlpha(0);
    this.tweens.add({ targets: pingu, alpha: 1, duration: 300 });
    const slender = this.personagem("slender", "Slan_sideAtack", w + h * 0.22, h * 0.72, h * 0.4, h * 0.4, true);
    this.quadro(slender, "Slan_sideAtack", 0, 5, 18, false);
    this.tweens.add({ targets: slender, x: w * 0.52, duration: 720, onComplete: () => {
      this.quadro(slender, "Slan_taunt", 0, 25, 12, false,
        () => this.quadro(slender, "Slan_idle", 0, 38, 12, true));
      this.apresentar("marcos", "Marcos", "direção e áudio", () => {
        slender.creditosTimer?.remove(false);
        this.iniciarVideosCreditos([3, 5], () => this.finalJuntos(), [slender]);
      }, 5000);
    }});
    // O encontro alinha os sprites no contato antes de projetar o Pingu para fora.
    this.time.delayedCall(420, () => {
      this.quadro(pingu, "Pingu_hurt", 0, 1, 16, false);
      this.tweens.add({ targets: pingu, x: w + h * 0.4, y: h * 0.79, duration: 480, ease: "Cubic.easeOut" });
    });
  }

  finalJuntos() {
    const { width: w, height: h } = this.scale;
    this.pfp.setVisible(false); this.nome.setVisible(false); this.funcao.setVisible(false);
    const miku = this.personagens.miku, pingu = this.personagens.pingu, slender = this.personagens.slender;
    [miku, pingu, slender].forEach((sprite) => sprite.setVisible(true).setAlpha(1));
    miku.setPosition(w * 0.4, h + h * 0.25); miku.alturaCreditos = h * 0.35;
    pingu.setPosition(-h * 0.25, h * 0.79); pingu.alturaCreditos = h * 0.27;
    slender.setPosition(w + h * 0.22, h * 0.72); slender.alturaCreditos = h * 0.4;
    this.quadro(miku, "Miku_jump", 0, 1, 12, true);
    this.quadro(pingu, "Pingu_walk", 0, 8, 16, true);
    this.tweens.add({ targets: miku, y: h * 0.745, duration: 850, ease: "Cubic.easeOut", onComplete: () => {
      this.quadro(miku, "Miku_walk", 1, 10, 12, true);
      this.tweens.add({ targets: miku, x: w * 0.51, duration: 500 });
    }});
    this.tweens.add({ targets: pingu, x: w * 0.27, duration: 1300 });
    this.quadro(slender, "Slan_walk", 0, 24, 18, true);
    this.tweens.add({ targets: slender, x: w * 0.75, duration: 1300 });
    this.time.delayedCall(1450, () => {
      // Congela as três ações no mesmo instante do salto, já lado a lado.
      pingu.setX(w * 0.27); miku.setX(w * 0.51); slender.setX(w * 0.75);
      this.quadro(miku, "Miku_jump", 0, 1, 12, true);
      this.quadro(pingu, "Pingu_jump", 0, 11, 14, true);
      this.quadro(slender, "Slan_jump", 0, 7, 16, true);
      this.tweens.add({ targets: [miku, pingu, slender], y: `-=${h * 0.12}`, duration: 250 });
      this.tweens.add({ targets: this.cameras.main, zoom: 1.18, duration: 650 });
      this.time.delayedCall(500, () => {
        this.quadro(miku, "Miku_airplosion", 0, 5, 14, false);
        this.quadro(pingu, "Pingu_taunt2", 0, 24, 12, true);
        this.quadro(slender, "Slan_taunt", 0, 25, 12, true);
        this.time.delayedCall(2100, () => this.obrigado());
      });
    });
  }

  obrigado() {
    const { width: w, height: h } = this.scale;
    const texto = this.txt(w / 2, h * 0.19, "OBRIGADO POR\nJOGAR!", 64, { color: "#00ff36", stroke: "#001a08", strokeThickness: 5 }).setDepth(10).setAlpha(0);
    this.tweens.add({ targets: texto, alpha: 1, duration: 500 });
  }
}
