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
      onComplete: () => this.time.delayedCall(3500, () => this.mostrarEquipe()) });
  }

  tocarMusica() {
    let musica = this.registry.get("musicaCreditos");
    if (!musica || !musica.isPlaying) {
      musica = this.sound.add("katarenai8bit", { loop: false, volume: 0.8 });
      this.registry.set("musicaCreditos", musica);
      musica.play();
    }
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
      this.time.delayedCall(3600, () => this.tweens.add({ targets: [this.escrita, this.logoTeam], alpha: 0, duration: 700,
        onComplete: () => { this.escrita.setVisible(false); this.logoTeam.setVisible(false); this.apresentarMiku(); } }));
    }});
  }

  apresentarMiku() {
    const { width: w, height: h } = this.scale;
    this.pfp.setVisible(true); this.nome.setVisible(true); this.funcao.setVisible(true);
    const miku = this.personagem("miku", "Miku_jump", w * 0.18, -h * 0.35, h * 0.39, h * 0.43);
    this.quadro(miku, "Miku_jump", 0, 1, 12, true);
    this.tweens.add({ targets: miku, y: h * 0.69, duration: 650, ease: "Cubic.easeIn", onComplete: () => {
      miku.creditosTimer?.remove(false);
      this.quadro(miku, "Miku_idle", 0, 13, 12, true);
      this.time.delayedCall(1200, () => this.mikuFeita());
    }});
  }

  mikuFeita() {
    this.quadro(this.personagens.miku, "Miku_taunt1", 0, 28, 8, true);
    this.apresentar("campos", "Campos", "programação", () => this.entradaPingu());
  }

  apresentar(foto, nome, funcao, proximo) {
    this.pfp.setTexture(foto);
    this.ajustarPfp(this.scale.height * 0.34, this.scale.height * 0.34);
    this.nome.setText(nome); this.funcao.setText(funcao);
    this.pfp.setAlpha(0); this.nome.setAlpha(0); this.funcao.setAlpha(0);
    this.tweens.add({ targets: [this.pfp, this.nome, this.funcao], alpha: 1, duration: 800,
      onComplete: () => this.time.delayedCall(8500, proximo) });
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
      this.apresentar("theo", "Theo", "direção de arte", () => this.entradaSlender());
    }});
  }

  entradaSlender() {
    const { width: w, height: h } = this.scale;
    const pingu = this.personagens.pingu;
    const slender = this.personagem("slender", "Slan_sideAtack", w + h * 0.22, h * 0.72, h * 0.4, h * 0.4, true);
    this.quadro(slender, "Slan_sideAtack", 0, 5, 18, false);
    this.tweens.add({ targets: slender, x: w * 0.52, duration: 720, onComplete: () => {
      this.quadro(slender, "Slan_taunt", 0, 25, 12, false,
        () => this.quadro(slender, "Slan_idle", 0, 38, 12, true));
      this.apresentar("marcos", "Marcos", "direção e áudio", () => this.finalJuntos());
    }});
    // O encontro alinha os sprites no contato antes de projetar o Pingu para fora.
    this.time.delayedCall(420, () => {
      pingu.setPosition(w * 0.78, h * 0.79);
      this.quadro(pingu, "Pingu_hurt", 0, 1, 16, false);
      this.tweens.add({ targets: pingu, x: w + h * 0.4, y: h * 0.79, duration: 480, ease: "Cubic.easeOut" });
    });
  }

  finalJuntos() {
    const { width: w, height: h } = this.scale;
    this.pfp.setVisible(false); this.nome.setVisible(false); this.funcao.setVisible(false);
    const miku = this.personagens.miku, pingu = this.personagens.pingu, slender = this.personagens.slender;
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
      this.time.delayedCall(700, () => {
        this.quadro(miku, "Miku_airplosion", 0, 5, 14, false);
        this.quadro(pingu, "Pingu_taunt2", 0, 24, 12, true);
        this.quadro(slender, "Slan_taunt", 0, 25, 12, true);
        this.time.delayedCall(2100, () => this.obrigado());
      });
    });
  }

  obrigado() {
    const { width: w, height: h } = this.scale;
    [this.personagens.miku, this.personagens.pingu, this.personagens.slender].forEach((sprite) => sprite.creditosTimer?.remove(false));
    const texto = this.txt(w / 2, h * 0.19, "OBRIGADO POR\nJOGAR!", 64, { color: "#00ff36", stroke: "#001a08", strokeThickness: 5 }).setDepth(10).setAlpha(0);
    this.tweens.add({ targets: texto, alpha: 1, duration: 500, onComplete: () => {
      const tempoRestante = Math.max(0, 62000 - (this.time.now - this.inicioCreditos) - 1400);
      this.time.delayedCall(tempoRestante, () => {
      const musica = this.registry.get("musicaCreditos");
      if (musica?.isPlaying) {
        this.tweens.add({ targets: musica, volume: 0, duration: 1400, onComplete: () => musica.stop() });
      }
      this.registry.remove("musicaCreditos");
      this.cameras.main.fadeOut(1400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("CenaStart"));
      });
    } });
  }
}
