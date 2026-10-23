import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";

const apresentacaoPersonagens = {
  FJ: { nome: "FREDERICK", taunt: "fj_taunt", stun: "fj_stun" },
  Frederick: { nome: "FREDERICK", taunt: "fj_taunt", stun: "fj_stun" },
  SpiderMan: { nome: "SPIDER-MAN", taunt: "spy_taunt", stun: "spy_stun" },
  Miku: { nome: "MIKU", taunt: "miku_taunt1", stun: "miku_stun" },
  Ken: { nome: "KEN", taunt: "ken_taunt", stun: "ken_stun" },
  Slenderman: { nome: "SLENDERMAN", taunt: "slan_taunt", stun: "slan_stun" },
  Pingu: { nome: "PINGU", taunt: "pingu_taunt", stun: "pingu_stun" },
  TH30: { nome: "TH30", taunt: "th_taunt", stun: "th_stun" },
  Madotsuki: { nome: "MADOTSUKI", taunt: "ken_taunt", stun: "ken_stun" },
};

const AUDIO_NOME_VENCEDOR = {
  FJ: "narrador-fj",
  Frederick: "narrador-fj",
  SpiderMan: "narrador-spiderman",
  Miku: "narrador-miku",
  Ken: "narrador-ken",
  Slenderman: "narrador-slenderman",
  Pingu: "narrador-pingu",
  TH30: "narrador-th30",
  Goku: "narrador-goku",
  Storm: "narrador-storm",
};

export default class CenaGameOver extends Phaser.Scene {
  constructor() {
    super({ key: "CenaGameOver" });
  }

  init(dados = {}) {
    this.resultado = dados;
  }

  create() {
    encerrarOutrasCenas(this);
    const mqtt = this.registry.get("clienteMQTT");
    this.events.once("shutdown", () => {
      if (mqtt?.papel === "host") mqtt.clearState();
    });

    const largura = this.scale.width;
    const altura = this.scale.height;
    const escala = largura / 1920;
    this.cameras.main.setBackgroundColor("#05050a");
    this.conteudo = this.add.container(0, 0);
    this.ataqueControleAnterior = [false, false];

    if (!this.resultado.vencedor || !this.resultado.perdedor) {
      this.criarMenuSemResultado(largura, altura, escala);
      return;
    }
    document.fonts?.load?.("100px SmashBros");

    this.conteudo.add(
      this.add.image(0, 0, "victoryFundo")
        .setOrigin(0, 0)
        .setDisplaySize(largura, altura)
        .setDepth(0),
    );

    const vencedor = this.resultado.vencedor || {};
    const perdedor = this.resultado.perdedor || {};
    const infoVencedor = apresentacaoPersonagens[vencedor.id] || apresentacaoPersonagens.Ken;
    const infoPerdedor = apresentacaoPersonagens[perdedor.id] || apresentacaoPersonagens.Ken;
    this.camadaVencedor = this.add.container(0, 0).setDepth(10);

    this.spriteVencedor = this.adicionarPersonagemAnimado(
      infoVencedor.taunt,
      largura * 0.70,
      altura * 0.98,
      altura * 0.80,
      2,
      { container: this.camadaVencedor },
    );

    this.bloqueado = true;
    this.iniciarIntroducaoVitoria(infoVencedor, infoPerdedor, escala);
  }

  adicionarPersonagemAnimado(animacao, x, y, alturaAlvo, profundidade, opcoes = {}) {
    if (!this.anims.exists(animacao)) return;
    const definicao = this.anims.get(animacao);
    const primeiroFrame = definicao.frames[0];
    const sprite = this.add.sprite(
      x,
      y,
      primeiroFrame.frame.texture.key,
      primeiroFrame.frame.name,
    ).setDepth(profundidade);
    const limites = this.medirAreaVisivel(definicao, sprite.texture, sprite.frame.height);
    const alturaVisivel = Math.max(1, limites.yMax - limites.yMin);
    const larguraVisivel = Math.max(1, limites.xMax - limites.xMin);
    let escalaSprite = alturaAlvo / alturaVisivel;
    if (opcoes.larguraMaxima) {
      escalaSprite = Math.min(escalaSprite, opcoes.larguraMaxima / larguraVisivel);
    }
    sprite.setScale(escalaSprite).setOrigin(0.5, opcoes.centralizar ? 0.5 : 1);
    const centroVisivelX = (limites.xMin + limites.xMax) / 2;
    const xSprite = x - (centroVisivelX - sprite.frame.width / 2) * escalaSprite;
    if (opcoes.centralizar) {
      const centroVisivelY = (limites.yMin + limites.yMax) / 2;
      sprite.setPosition(xSprite, y - (centroVisivelY - sprite.frame.height / 2) * escalaSprite);
    } else {
      const espacoAbaixo = sprite.frame.height - limites.yMax;
      sprite.setPosition(xSprite, y + espacoAbaixo * escalaSprite);
    }
    sprite.play(animacao);
    (opcoes.container || this.conteudo).add(sprite);
    sprite.setData("centroVisivel", {
      x,
      y: opcoes.centralizar
        ? y
        : y - alturaVisivel * escalaSprite * 0.75,
    });
    return sprite;
  }

  iniciarIntroducaoVitoria(infoVencedor, infoPerdedor, escala) {
    const camera = this.cameras.main;
    const foco = this.spriteVencedor.getData("centroVisivel");
    camera.setBackgroundColor("#000000").setZoom(1).centerOn(foco.x, foco.y);
    const cortina = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
    ).setScrollFactor(0).setDepth(20);
    this.tweens.add({
      targets: camera,
      zoom: 2.3,
      duration: 250,
      ease: "Cubic.easeOut",
      onUpdate: () => camera.centerOn(foco.x, foco.y),
    });
    this.tweens.add({
      targets: cortina,
      alpha: 0,
      duration: 250,
      ease: "Linear",
      onComplete: () => {
        cortina.destroy();
        this.tocarEfeitoVitoria(infoVencedor, infoPerdedor, escala);
      },
    });
  }

  tocarEfeitoVitoria(infoVencedor, infoPerdedor, escala) {
    const camera = this.cameras.main;
    const foco = this.spriteVencedor.getData("centroVisivel");
    const larguraMundo = camera.width / camera.zoom;
    const alturaMundo = camera.height / camera.zoom;
    const animacao = this.obterAnimacaoEfeito();

    const efeito = this.add.sprite(foco.x, foco.y, "vitEfect")
      .setDisplaySize(larguraMundo, alturaMundo)
      .setDepth(5);
    efeito.play(animacao.key);

    let congelamentoConcluido = false;
    let efeitoConcluido = false;
    let saidaIniciada = false;
    const iniciarSaidaSePronto = () => {
      if (!congelamentoConcluido || !efeitoConcluido || saidaIniciada) return;
      saidaIniciada = true;
      this.tweens.add({
        targets: efeito,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          efeito.destroy();
          this.voltarCameraAoNormal(() => this.mostrarResultado(infoVencedor, infoPerdedor, escala));
        },
      });
    };
    const animacaoVencedor = this.spriteVencedor.anims;
    const vencedorEstavaTocando = animacaoVencedor.isPlaying;
    animacaoVencedor.pause();
    this.time.delayedCall(1000, () => {
      if (vencedorEstavaTocando) animacaoVencedor.resume();
      congelamentoConcluido = true;
      iniciarSaidaSePronto();
    });
    efeito.once(`animationcomplete-${animacao.key}`, () => {
      efeitoConcluido = true;
      iniciarSaidaSePronto();
    });
  }

  obterAnimacaoEfeito() {
    const key = "gameover-vitEfect";
    if (!this.anims.exists(key)) {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers("vitEfect"),
        frameRate: 30,
        repeat: 0,
      });
    }
    return this.anims.get(key);
  }

  voltarCameraAoNormal(aoCompletar) {
    const camera = this.cameras.main;
    this.tweens.add({
      targets: camera,
      zoom: 1,
      duration: 400,
      ease: "Cubic.easeInOut",
      onUpdate: () => camera.centerOn(this.scale.width / 2, this.scale.height / 2),
      onComplete: () => {
        camera.setScroll(0, 0);
        aoCompletar();
      },
    });
  }

  mostrarResultado(infoVencedor, infoPerdedor, escala) {
    const largura = this.scale.width;
    const altura = this.scale.height;
    const quadro = this.add.image(0, 0, "second")
      .setOrigin(0, 0)
      .setDisplaySize(largura, altura)
      .setAlpha(0);
    this.conteudo.add(quadro);

    const spritePerdedor = this.adicionarPersonagemAnimado(
      infoPerdedor.stun,
      largura * 0.245,
      altura * 0.84,
      altura * 0.40,
      4,
      { larguraMaxima: largura * 0.38, centralizar: true },
    );
    const retratoPerdedor = this.criarRetratoRecortado(spritePerdedor, largura, altura);
    retratoPerdedor.setAlpha(0);

    const estiloNome = {
      fontFamily: "SmashBros, Georgia, serif",
      fontSize: `${Math.min(220 * escala, largura * 0.16)}px`,
      color: "#000000",
    };
    const nome = this.add.text(55 * escala, 62 * escala, infoVencedor.nome, estiloNome).setAlpha(0);
    const wins = this.add.text(105 * escala, 340 * escala, "WINS", {
      ...estiloNome,
      fontSize: `${Math.min(190 * escala, largura * 0.145)}px`,
    }).setAlpha(0);
    this.conteudo.add([nome, wins]);

    this.tweens.add({ targets: [quadro, retratoPerdedor, nome, wins], alpha: 1, duration: 450 });
    this.tocarVozVencedor(this.resultado.vencedor?.id);
    this.bloqueado = false;
    this.input.keyboard.once("keydown-ENTER", () => this.reiniciarPartida());
    this.input.keyboard.once("keydown-F", () => this.reiniciarPartida());
    this.input.keyboard.once("keydown-J", () => this.reiniciarPartida());
    this.input.keyboard.once("keydown-SPACE", () => this.reiniciarPartida());
  }

  tocarVozVencedor(idPersonagem) {
    const audioNome = AUDIO_NOME_VENCEDOR[idPersonagem];
    if (!audioNome || !this.cache.audio.exists(audioNome)) {
      if (this.cache.audio.exists("narrador-wins")) this.sound.play("narrador-wins");
      return;
    }

    const voz = this.sound.add(audioNome);
    voz.once("complete", () => {
      if (this.cache.audio.exists("narrador-wins")) this.sound.play("narrador-wins");
    });
    voz.play();
  }

  update() {
    const gamepads = this.input.gamepad?.gamepads ?? [];
    let ataqueNovo = false;

    for (let indice = 0; indice < 2; indice += 1) {
      const pressionado = !!gamepads[indice]?.buttons?.[2]?.pressed;
      if (pressionado && !this.ataqueControleAnterior[indice]) ataqueNovo = true;
      this.ataqueControleAnterior[indice] = pressionado;
    }

    if (!this.bloqueado && ataqueNovo) this.reiniciarPartida();
  }

  criarRetratoRecortado(sprite, largura, altura) {
    const pontos = [
      [largura * 0.045, altura * 0.697],
      [largura * 0.168, altura * 0.616],
      [largura * 0.428, altura * 0.642],
      [largura * 0.440, altura * 0.931],
      [largura * 0.046, altura * 0.956],
    ];
    const graficoMascara = this.make.graphics({ x: 0, y: 0, add: false });
    graficoMascara
      .fillStyle(0xffffff, 1)
      .fillPoints(pontos.map(([x, y]) => ({ x, y })), true);
    const mascara = graficoMascara.createGeometryMask();
    sprite.setMask(mascara).setDepth(4).setVisible(true);

    this.events.once("shutdown", () => {
      sprite.clearMask(false);
      mascara.destroy();
      graficoMascara.destroy();
    });
    return sprite;
  }

  medirAreaVisivel(definicao, textura, limiteY) {
    const origem = textura.getSourceImage();
    const canvas = document.createElement("canvas");
    canvas.width = origem.width;
    canvas.height = origem.height;
    const contexto = canvas.getContext("2d", { willReadFrequently: true });
    contexto.drawImage(origem, 0, 0);
    const pixels = contexto.getImageData(0, 0, canvas.width, canvas.height).data;
    const limites = { xMin: Infinity, yMin: Infinity, xMax: -Infinity, yMax: -Infinity };

    for (const animFrame of definicao.frames) {
      const quadro = animFrame.frame;
      const corteY = Math.min(quadro.cutHeight, limiteY);
      for (let y = 0; y < corteY; y += 1) {
        const linha = (quadro.cutY + y) * canvas.width;
        for (let x = 0; x < quadro.cutWidth; x += 1) {
          const indiceAlpha = (linha + quadro.cutX + x) * 4 + 3;
          if (pixels[indiceAlpha] <= 8) continue;
          limites.xMin = Math.min(limites.xMin, x);
          limites.yMin = Math.min(limites.yMin, y);
          limites.xMax = Math.max(limites.xMax, x + 1);
          limites.yMax = Math.max(limites.yMax, y + 1);
        }
      }
    }

    if (!Number.isFinite(limites.yMin)) {
      return { xMin: 0, yMin: 0, xMax: definicao.frames[0].frame.cutWidth, yMax: limiteY };
    }
    return limites;
  }

  criarMenuSemResultado(largura, altura, escala) {
    this.conteudo.add(
      this.add.image(0, 0, "Start_menu")
        .setOrigin(0, 0)
        .setDisplaySize(largura, altura),
    );
    this.botaoReset = this.add.image(largura / 2, altura / 2, "ReZero")
      .setOrigin(0.5)
      .setScale(escala);
    this.conteudo.add(this.botaoReset);
    this.tweens.add({
      targets: this.botaoReset,
      scaleX: 1.1 * escala,
      scaleY: 1.1 * escala,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    this.botaoReset.setInteractive({ useHandCursor: true });
    this.botaoReset.on("pointerdown", () => this.reiniciarPartida());
    this.bloqueado = false;
    this.input.keyboard.once("keydown-ENTER", () => this.reiniciarPartida());
    this.input.keyboard.once("keydown-F", () => this.reiniciarPartida());
    this.input.keyboard.once("keydown-J", () => this.reiniciarPartida());
    this.input.keyboard.once("keydown-SPACE", () => this.reiniciarPartida());
  }

  reiniciarPartida() {
    if (this.bloqueado) return;
    this.bloqueado = true;
    this.tweens.add({
      targets: [this.conteudo, this.camadaVencedor].filter(Boolean),
      scaleY: 0,
      y: this.scale.height / 2,
      duration: 400,
      ease: "Cubic.easeIn",
      onComplete: () => this.scene.start("CenaStart"),
    });
  }
}
