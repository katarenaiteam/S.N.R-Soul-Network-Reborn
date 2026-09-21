import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";
import ControleEntrada from "../Objetos/ControleEntrada.js";
import { tocarMusicaSegura } from "../Objetos/AudioSeguro.js";

const PERSONAGENS = [
  {
    id: "Aigis",
    icon: "aigis-icon",
    banner: "Aig_baner",

    bannerConfig: {
      escala: 1,

      p1: {
        x: -140,
        y: 0
      },

      p2: {
        x: 135,
        y: 0
      }
    }
  },

  {
    id: "FJ",
    icon: "fj-icon",
    banner: "FJ_baner",

    bannerConfig: {
      escala: 0.58,

      p1: {
        x: -320,
        y: 0
      },

      p2: {
        x: 315,
        y: 0
      }
    }
  },

  {
    id: "SpiderMan",
    icon: "spider-icon",
    banner: "Spy_baner",

    bannerConfig: {
      escala: 0.3,

      p1: {
        x: -70,
        y: 200
      },

      p2: {
        x: 65,
        y: 200
      }
    }
  },

  {
    id: "Pingu",
    icon: "pingu-icon",
    banner: "Pin_baner",

    bannerConfig: {
      escala: 1.8,

      p1: {
        x: -130,
        y: 0
      },

      p2: {
        x: 125,
        y: 0
      }
    }
  },

  {
    id: "Storm",
    icon: "storm-icon",
    banner: "Stor_baner",

    bannerConfig: {
      escala: 2.5,

      p1: {
        x: -150,
        y: 0
      },

      p2: {
        x: 145,
        y: 0
      }
    }
  },

  {
    id: "Miku",
    icon: "miku-icon",
    banner: "Miku_baner",

    bannerConfig: {
      escala: 1.1,

      p1: {
        x: -105,
        y: 40
      },

      p2: {
        x: 100,
        y: 40
      }
    }
  },

  {
    id: "Ken",
    icon: "ken-icon",
    banner: "Ken_baner",

    bannerConfig: {
      escala: 1.9,

      p1: {
        x: 30,
        y: 0
      },

      p2: {
        x: -30,
        y: 0
      }
    }
  },

  {
    id: "Slenderman",
    icon: "slender-icon",
    banner: "Slen_baner",

    bannerConfig: {
      escala: 1,

      p1: {
        x: -230,
        y: 250
      },

      p2: {
        x: 230,
        y: 250
      }
    }
  },

  {
    id: "Goku",
    icon: "goku-icon",
    banner: "GK_baner",

    bannerConfig: {
      escala: 0.3,

      p1: {
        x: -110,
        y: 120
      },

      p2: {
        x: 1,
        y: 130
      }
    }
  },

  {
    id: "TH",
    icon: "th-icon",
    banner: "TH_baner",

    bannerConfig: {
      escala: 1.2,

      p1: {
        x: -80,
        y: 500
      },

      p2: {
        x: 70,
        y: 500
      }
    }
  }
];

const VELOCIDADE_MAO = 900;
const ESCALA_MAO = 0.22;
const ESCALA_FICHA = 0.17;

export default class Charmenu extends Phaser.Scene {
  constructor() {
    super({ key: "Charmenu" });
  }

  init(data) {
    this.modoJogo = data?.modo || "1v1";
    this.numPlayers = data?.numPlayers || 2;
  }

  create() {
    encerrarOutrasCenas(this);

    this.cameras.main.setBackgroundColor("#000000");

    this.musica = tocarMusicaSegura(this, "katarenai8bit", {
      loop: true,
      volume: 0.1
    });

    this.menuPronto = false;
    this.transicaoAtiva = false;

    this.criarChuvaCaracteres();
    this.criarBloqueioCentral();
    this.criarMascaras();
    this.criarGrade();
    this.criarIcons();
    this.criarControles();
    this.criarJogadores();

    this.avisoAvancar = this.add
      .image(this.scale.width / 2, this.scale.height / 2, "space-to")
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(70)
      .setVisible(false);

    this.teclaAvancar = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    this.puloAnteriorP1 = false;
    this.puloAnteriorP2 = false;
  }

  // ============================================================
  // GRADE
  // ============================================================

  criarGrade() {
    if (!this.anims.exists("charmenu_grade")) {
      this.anims.create({
        key: "charmenu_grade",
        frames: this.anims.generateFrameNumbers("grade", {
          start: 0,
          end: 40
        }),
        frameRate: 24,
        repeat: 0
      });
    }

    this.grade = this.add
      .sprite(
        this.scale.width / 2,
        this.scale.height / 2,
        "grade",
        0
      )
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(20);

    this.grade.play("charmenu_grade");

    this.grade.once("animationcomplete-charmenu_grade", () => {
      this.grade.setFrame(40);
      this.menuPronto = true;
    });
  }

  // ============================================================
  // ICONS
  // ============================================================

  criarIcons() {
    this.icons = PERSONAGENS.map((p) => {
      const icon = this.add
        .image(0, 0, p.icon)
        .setOrigin(0, 0)
        .setDisplaySize(this.scale.width, this.scale.height)
        .setDepth(15)
        .setAlpha(0);

      icon.personagem = p;

      return icon;
    });

    this.tweens.add({
      targets: this.icons,
      alpha: 1,
      duration: 120,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.icons.forEach((i) => i.setAlpha(1));
      }
    });
  }

  // ============================================================
  // CONTROLES
  // ============================================================

  criarControles() {
    this.teclasP1 = this.input.keyboard.addKeys({
      esquerda: Phaser.Input.Keyboard.KeyCodes.A,
      direita: Phaser.Input.Keyboard.KeyCodes.D,
      cima: Phaser.Input.Keyboard.KeyCodes.W,
      baixo: Phaser.Input.Keyboard.KeyCodes.S,
      atack: Phaser.Input.Keyboard.KeyCodes.F,
      special: Phaser.Input.Keyboard.KeyCodes.G
    });

    this.teclasP2 = this.input.keyboard.addKeys({
      esquerda: Phaser.Input.Keyboard.KeyCodes.LEFT,
      direita: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      cima: Phaser.Input.Keyboard.KeyCodes.UP,
      baixo: Phaser.Input.Keyboard.KeyCodes.DOWN,
      atack: Phaser.Input.Keyboard.KeyCodes.J,
      special: Phaser.Input.Keyboard.KeyCodes.K
    });

    this.controleP1 = new ControleEntrada(this, this.teclasP1, 0);
    this.controleP2 = new ControleEntrada(this, this.teclasP2, 1);
  }

  criarBloqueioCentral() {
  const w = this.scale.width;
  const h = this.scale.height;

  this.bloqueioCentral = this.add.graphics();

  this.bloqueioCentral
    .fillStyle(0x000000, 1)
    .fillPoints(
      [
        { x: w * 0.370, y: 0 },
        { x: w * 0.618, y: 0 },
        { x: w * 0.8237, y: h },
        { x: w * 0.175, y: h }
      ],
      true
    )
    .setDepth(5);
}

  // ============================================================
  // JOGADORES
  // ============================================================

  criarJogadores() {
    this.p1 = this.criarJogador(
      1,
      this.scale.width * 0.38,
      this.scale.height * 0.72,
      "P1maoCficha",
      "P1maoSficha",
      "P1_ficha"
    );

    if (this.modoJogo === "historia" && this.numPlayers === 1) {
      this.p2 = null;
      return;
    }

    this.p2 = this.criarJogador(
      2,
      this.scale.width * 0.62,
      this.scale.height * 0.72,
      "P2maoCficha",
      "P2maoSficha",
      "P2_ficha"
    );
  }

  criarJogador(numero, x, y, comFicha, semFicha, fichaKey) {
    const mao = this.add
      .image(x, y, comFicha)
      .setOrigin(0.18, 0.14)
      .setScale(ESCALA_MAO)
      .setDepth(60 + numero);

    return {
      numero,
      mao,
      comFicha,
      semFicha,
      fichaKey,
      selecionado: null,
      ficha: null,
      hover: null,
      banner: null,
      tweenBanner: null
    };
  }

  // ============================================================
  // UPDATE
  // ============================================================

  update(_time, delta) {
    this.atualizarChuvaCaracteres(delta);

    this.controleP1.atualizar();

    if (this.p2) {
      this.controleP2.atualizar();
    }

    if (!this.menuPronto || this.transicaoAtiva) {
      this.salvarInputs();
      return;
    }

    this.atualizarJogador(this.p1, this.teclasP1, this.controleP1, delta);

    if (this.p2) {
      this.atualizarJogador(this.p2, this.teclasP2, this.controleP2, delta);
    }

    const todosSelecionados = this.todosSelecionados();
    this.atualizarAvisoAvancar(todosSelecionados);

    if (todosSelecionados && this.apertouAvancar()) {
      this.avancar();
    }

    this.salvarInputs();
  }

  atualizarJogador(jogador, teclas, controle, delta) {
    this.moverMao(jogador, teclas, controle, delta);
    this.atualizarHover(jogador);

    if (
      controle.acabouDeApertar("atack") &&
      !jogador.selecionado
    ) {
      this.confirmar(jogador);
    }

    if (
      controle.acabouDeApertar("special") &&
      jogador.selecionado
    ) {
      this.cancelar(jogador);
    }
  }

  // ============================================================
  // MOVIMENTO
  // ============================================================

  moverMao(jogador, teclas, controle, delta) {
    let x = 0;
    let y = 0;

    if (teclas.esquerda.isDown) x--;
    if (teclas.direita.isDown) x++;
    if (teclas.cima.isDown) y--;
    if (teclas.baixo.isDown) y++;

    const pad = controle.pad;

    if (pad?.axes?.length >= 2) {
      const ax = pad.axes[0].getValue();
      const ay = pad.axes[1].getValue();

      if (Math.abs(ax) > controle.deadZone) x = ax;
      if (Math.abs(ay) > controle.deadZone) y = ay;
    }

    const tamanho = Math.hypot(x, y);

    if (tamanho > 1) {
      x /= tamanho;
      y /= tamanho;
    }

    const s = Math.min(delta, 50) / 1000;

    jogador.mao.x += x * VELOCIDADE_MAO * s;
    jogador.mao.y += y * VELOCIDADE_MAO * s;

    jogador.mao.x = Phaser.Math.Clamp(
      jogador.mao.x,
      0,
      this.scale.width
    );

    jogador.mao.y = Phaser.Math.Clamp(
      jogador.mao.y,
      0,
      this.scale.height
    );
  }

  // ============================================================
  // HOVER
  // ============================================================

  atualizarHover(jogador) {
    if (jogador.selecionado) return;

    const personagem = this.obterPersonagem(
      jogador.mao.x,
      jogador.mao.y
    );

    if (!personagem) {
      jogador.hover = null;
      this.destruirBanner(jogador);
      return;
    }

    if (jogador.hover?.id === personagem.id) return;

    jogador.hover = personagem;

    this.mostrarBanner(jogador, personagem);
  }

  obterPersonagem(x, y) {
    const px = Math.floor(
      x / this.scale.width * 1920
    );

    const py = Math.floor(
      y / this.scale.height * 1080
    );

    for (const p of PERSONAGENS) {
      const alpha = this.textures.getPixelAlpha(
        px,
        py,
        p.icon
      );

      if (alpha >= 35) {
        return p;
      }
    }

    return null;
  }

  // ============================================================
  // BANNERS
  // ============================================================

  mostrarBanner(jogador, personagem) {
  this.destruirBanner(jogador);

  const config = personagem.bannerConfig ?? {};
  const configLado =
    jogador.numero === 1
      ? config.p1 ?? {}
      : config.p2 ?? {};

  const escala =
    config.escala ?? 1;

  const banner = this.add
    .image(0, 0, personagem.banner)
    .setScale(escala)
    .setDepth(10);

  if (jogador.numero === 1) {
    const destinoX =
      configLado.x ?? 0;

    const destinoY =
      this.scale.height +
      (configLado.y ?? 0);

    banner
      .setOrigin(0, 1)
      .setPosition(
        -banner.displayWidth - 80,
        destinoY
      );

    this.aplicarMascaraBanner(
      banner,
      this.mascaraP1
    );

    jogador.tweenBanner =
      this.tweens.add({
        targets: banner,
        x: destinoX,
        duration: 300,
        ease: "Cubic.easeOut"
      });

  } else {
    const destinoX =
      this.scale.width +
      (configLado.x ?? 0);

    const destinoY =
      this.scale.height +
      (configLado.y ?? 0);

    banner
      .setOrigin(1, 1)
      .setFlipX(true)
      .setPosition(
        this.scale.width +
          banner.displayWidth +
          80,
        destinoY
      );

    this.aplicarMascaraBanner(
      banner,
      this.mascaraP2
    );

    jogador.tweenBanner =
      this.tweens.add({
        targets: banner,
        x: destinoX,
        duration: 300,
        ease: "Cubic.easeOut"
      });
  }

  jogador.banner = banner;
}
  destruirBanner(jogador) {
    jogador.tweenBanner?.stop();

    if (jogador.banner?.active) {
      jogador.banner.destroy();
    }

    jogador.banner = null;
    jogador.tweenBanner = null;
  }

  // ============================================================
  // MÁSCARAS PHASER 4
  // ============================================================

  criarMascaras() {
  const w = this.scale.width;
  const h = this.scale.height;

  // Não adiciona os gráficos na tela.
  // Eles existem apenas como fonte das máscaras.
  this.mascaraP1 = this.make.graphics({
    x: 0,
    y: 0,
    add: false
  });

  this.mascaraP1
    .fillStyle(0xffffff, 1)
    .fillPoints(
      [
        { x: 0, y: 0 },
        { x: w * 0.370, y: 0 },
        { x: w * 0.175, y: h },
        { x: 0, y: h }
      ],
      true
    );


  this.mascaraP2 = this.make.graphics({
    x: 0,
    y: 0,
    add: false
  });

  this.mascaraP2
    .fillStyle(0xffffff, 1)
    .fillPoints(
      [
        { x: w * 0.618, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: w * 0.8237, y: h }
      ],
      true
    );
}

  aplicarMascaraBanner(banner, mascara) {
  banner.enableFilters();

  const filtro =
    banner.filters.external.addMask(
      mascara,
      false,
      this.cameras.main
    );

  filtro.autoUpdate = false;
  filtro.needsUpdate = true;
}

  // ============================================================
  // CONFIRMAR / CANCELAR
  // ============================================================

  confirmar(jogador) {
    if (!jogador.hover) return;

    jogador.selecionado = jogador.hover;

    jogador.ficha = this.add
      .image(
        jogador.mao.x,
        jogador.mao.y,
        jogador.fichaKey
      )
      .setScale(ESCALA_FICHA)
      .setDepth(50 + jogador.numero);

    jogador.mao
      .setTexture(jogador.semFicha)
      .setScale(ESCALA_MAO)
      .setOrigin(0.18, 0.14);
  }

  cancelar(jogador) {
    jogador.selecionado = null;

    jogador.ficha?.destroy();
    jogador.ficha = null;

    jogador.mao
      .setTexture(jogador.comFicha)
      .setScale(ESCALA_MAO)
      .setOrigin(0.18, 0.14);

    this.atualizarHover(jogador);
  }

  // ============================================================
  // AVANÇAR
  // ============================================================

  atualizarAvisoAvancar(visivel) {
    const aviso = this.avisoAvancar;
    if (aviso.visible === visivel) return;

    this.tweens.killTweensOf(aviso);
    aviso.setVisible(visivel);

    if (!visivel) return;

    aviso
      .setAlpha(0)
      .setDisplaySize(this.scale.width * 0.94, this.scale.height * 0.94);

    this.tweens.add({
      targets: aviso,
      alpha: 1,
      scaleX: this.scale.width / aviso.width,
      scaleY: this.scale.height / aviso.height,
      duration: 180,
      ease: "Cubic.easeOut"
    });
  }

  todosSelecionados() {
    if (!this.p1?.selecionado) return false;

    if (
      this.modoJogo === "historia" &&
      this.numPlayers === 1
    ) {
      return true;
    }

    return !!this.p2?.selecionado;
  }

  apertouAvancar() {
    if (
      Phaser.Input.Keyboard.JustDown(
        this.teclaAvancar
      )
    ) {
      return true;
    }

    const p1 = !!this.controleP1.pad?.buttons?.[2]?.pressed;
    const p2 = !!this.controleP2.pad?.buttons?.[2]?.pressed;

    const apertou =
      (p1 && !this.puloAnteriorP1) ||
      (p2 && !this.puloAnteriorP2);

    this.puloAnteriorP1 = p1;
    this.puloAnteriorP2 = p2;

    return apertou;
  }

  avancar() {
    this.transicaoAtiva = true;

    this.musica?.stop();

    const escolhas = {
      p1: this.p1.selecionado.id,
      p2: this.p2?.selecionado?.id ?? null,
      numPlayers: this.numPlayers,
      modo: this.modoJogo
    };

    if (this.modoJogo === "historia") {
      this.scene.start(
        "CenaHistoria",
        escolhas
      );
    } else {
      this.scene.start(
        "CenaSelecaoMapa",
        escolhas
      );
    }
  }

  salvarInputs() {
    this.controleP1.salvarAnterior();

    if (this.p2) {
      this.controleP2.salvarAnterior();
    }
  }

  // ============================================================
  // MATRIX
  // ============================================================

  criarChuvaCaracteres() {
    this.containerChuva = this.add.container(0, 0);
    this.containerChuva.setDepth(0);

    this.colunasChuva = [];

    this.alfabetoChuva =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト";

    const largura = 30;
    const total = Math.ceil(
      this.scale.width / largura
    );

    for (let i = 0; i < total; i++) {
      if (Math.random() < 0.14) continue;

      const fonte = Phaser.Math.Between(14, 23);
      const qtd = Phaser.Math.Between(7, 20);

      const chars = Array.from(
        { length: qtd },
        () => this.caractereChuva()
      );

      const fluxo = {
        x: i * largura + largura / 2,
        y: Phaser.Math.Between(
          -this.scale.height,
          this.scale.height
        ),
        velocidade: Phaser.Math.Between(65, 185),
        altura: fonte * 1.12,
        chars,
        tempo: 0,
        intervalo: Phaser.Math.Between(140, 280)
      };

      fluxo.cauda = this.add
        .text(
          fluxo.x,
          fluxo.y + fluxo.altura,
          chars.slice(1).join("\n"),
          {
            fontFamily: "monospace",
            fontSize: `${fonte}px`,
            color: "#28ff88"
          }
        )
        .setOrigin(0.5, 0)
        .setAlpha(0.62);

      fluxo.cabeca = this.add
        .text(
          fluxo.x,
          fluxo.y,
          chars[0],
          {
            fontFamily: "monospace",
            fontSize: `${fonte}px`,
            color: "#e2fff0"
          }
        )
        .setOrigin(0.5, 0)
        .setAlpha(0.95);

      this.containerChuva.add([
        fluxo.cauda,
        fluxo.cabeca
      ]);

      this.colunasChuva.push(fluxo);
    }
  }

  caractereChuva() {
    return this.alfabetoChuva[
      Phaser.Math.Between(
        0,
        this.alfabetoChuva.length - 1
      )
    ];
  }

  atualizarChuvaCaracteres(delta) {
    const dt = Math.min(delta, 50);

    for (const fluxo of this.colunasChuva) {
      fluxo.y +=
        fluxo.velocidade *
        (dt / 1000);

      fluxo.cabeca.y =
        fluxo.y;

      fluxo.cauda.y =
        fluxo.y + fluxo.altura;

      fluxo.tempo += dt;

      if (
        fluxo.tempo >=
        fluxo.intervalo
      ) {
        const index =
          Phaser.Math.Between(
            0,
            fluxo.chars.length - 1
          );

        fluxo.chars[index] =
          this.caractereChuva();

        fluxo.cabeca.setText(
          fluxo.chars[0]
        );

        fluxo.cauda.setText(
          fluxo.chars
            .slice(1)
            .join("\n")
        );

        fluxo.tempo = 0;
      }

      if (
        fluxo.y >
        this.scale.height + 30
      ) {
        fluxo.y =
          -fluxo.chars.length *
          fluxo.altura;
      }
    }
  }
}
