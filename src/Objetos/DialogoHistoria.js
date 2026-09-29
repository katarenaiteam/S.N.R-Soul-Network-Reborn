const FALAS = [
  {
    personagem: "Miku",
    retrato: "Mk_rage",
    texto: "Sinto muito, mas você não passará por mim.",
  },
  {
    personagem: "Miku",
    retrato: "Mk_N",
    texto: "Jurei a mim mesma que venceria este torneio e me tornaria a princesa número um de todos os mundos.",
  },
  {
    personagem: "Miku",
    retrato: "Mk_N",
    texto: "Quando finalmente eu ascender, trarei paz a esse mundo através da minha música.",
  },
  {
    personagem: "FJ",
    retrato: "FJ_N",
    texto: "Me recuso a acreditar apenas em palavras, seguirei em frente até o fim e descobrirei por mim mesmo do que o mundo realmente precisa.",
  },
];

const TEMPO_MOVIMENTO_CAMERA = 650;
const COR_CIANO_TXTBOX = 0x72dce8;
const ZOOM_CAMERA_DIALOGO = 3.2;

export default class DialogoHistoria {
  constructor(scene, aoConcluir, opcoes = {}) {
    this.scene = scene;
    this.aoConcluir = aoConcluir;
    this.falas = opcoes.falas ?? FALAS;
    this.alvosCamera = opcoes.alvosCamera ?? null;
    this.prepararPersonagens = opcoes.prepararPersonagens ?? true;
    this.restaurarEstado = opcoes.restaurarEstado ?? true;
    this.indice = 0;
    this.tempoMovimento = TEMPO_MOVIMENTO_CAMERA;
    this.transicaoParaIntro = false;
    this.ativa = true;

    this.jogadores = { Miku: scene.boss, FJ: scene.jogador1 };
    this.usarLimitesCamera = scene.camJogo.useBounds;
    scene.camJogo.useBounds = false;
    for (const { jogador } of (this.prepararPersonagens ? scene.participantes : [])) {
      jogador.sprite.setVelocity(0, 0);
      jogador.sprite.setFlipX(jogador === scene.boss);
      // A intro aplica o idle de todos antes da pausa para acertar suas escalas.
      jogador.aplicarConfiguracao("idle");
      jogador.atualizarOffsetFisica();
      const body = jogador.sprite.body;
      body.updateFromGameObject();
      body.prev.copy(body.position);
      body.prevFrame.copy(body.position);
      jogador.sincronizarHurtbox();
    }

    if (this.prepararPersonagens) {
      scene.physics.world.pause();
      scene.containerHUD?.setVisible(false);
      [scene.indicadorP1, scene.indicadorP2, scene.indicadorCPU]
        .filter(Boolean)
        .forEach(indicador => indicador.setVisible(false));
    }

    this.container = scene.add.container(0, 0)
      .setScrollFactor(0)
      .setDepth(3000);
    scene.camJogo.ignore(this.container);

    const escala = Math.min(scene.scale.width / 1920, scene.scale.height / 1080);
    const larguraCaixa = scene.scale.width * 0.9;
    const alturaCaixa = larguraCaixa * (697 / 1296);
    const esquerdaCaixa = (scene.scale.width - larguraCaixa) / 2;
    const topoPainel = scene.scale.height - alturaCaixa + alturaCaixa * (387 / 697);
    const fundoPainel = scene.add.graphics();
    fundoPainel.fillStyle(0x176571, 0.9)
      .fillRect(
        esquerdaCaixa + 10 * escala,
        topoPainel + 8 * escala,
        larguraCaixa - 20 * escala,
        scene.scale.height - topoPainel - 16 * escala,
      );
    const caixa = scene.add.image(
      scene.scale.width / 2,
      scene.scale.height,
      "txtbox",
    )
      .setOrigin(0.5, 1)
      .setDisplaySize(larguraCaixa, alturaCaixa)
      .setTint(COR_CIANO_TXTBOX);

    this.retrato = scene.add.image(0, 0, "Mk_rage")
      .setOrigin(0, 1)
      .setDisplaySize(550 * escala, 550 * escala);
    this.retrato.setPosition(esquerdaCaixa + 18 * escala, scene.scale.height - 15 * escala);

    this.texto = scene.add.text(
      esquerdaCaixa + larguraCaixa * 0.36,
      topoPainel + alturaCaixa * 0.12,
      "",
      {
        fontFamily: "RetroFont, monospace",
        fontSize: `${Math.round(34 * escala)}px`,
        color: "#e7ffff",
        align: "left",
        lineSpacing: 9 * escala,
        wordWrap: { width: larguraCaixa * 0.60 },
      },
    );
    this.container.add([fundoPainel, caixa, this.retrato, this.texto]);

    this.aoTeclar = evento => {
      const tecla = evento.keyCode;
      if (tecla === Phaser.Input.Keyboard.KeyCodes.SPACE ||
          tecla === Phaser.Input.Keyboard.KeyCodes.ENTER ||
          tecla === Phaser.Input.Keyboard.KeyCodes.NUMPAD_ENTER) {
        this.avancar();
      }
    };
    this.aoClicar = () => this.avancar();
    scene.input.keyboard.on("keydown", this.aoTeclar);
    scene.input.on("pointerdown", this.aoClicar);
    scene.events.once("shutdown", this.destruir, this);

    this.mostrarFala();
  }

  obterAlvoCamera() {
    const fala = this.falas[this.indice];
    const personagemCamera = fala.personagemCamera ?? fala.personagem;
    const alvo = fala.personagemCamera
      ? (this.alvosCamera?.[personagemCamera] ?? this.jogadores[personagemCamera]?.sprite)
      : (this.alvosCamera?.[fala.personagem] ?? this.jogadores[fala.personagem]?.sprite);
    const falante = alvo?.sprite ?? alvo;
    if (!falante) throw new Error(`Alvo de camera ausente para a fala de ${fala.personagem}.`);
    const zoom = fala.zoom ?? ZOOM_CAMERA_DIALOGO;
    return {
      x: falante.x,
      y: falante.y - 55,
      zoom,
    };
  }

  mostrarFala() {
    const fala = this.falas[this.indice];
    this.retrato.setTexture(fala.retrato);
    this.texto.setText(fala.texto);
    fala.aoMostrar?.();

    this.cameraDe = {
      x: this.scene.camJogo.midPoint.x,
      y: this.scene.camJogo.midPoint.y,
      zoom: this.scene.camJogo.zoom,
    };
    this.cameraPara = this.obterAlvoCamera();
    this.tempoMovimento = 0;
  }

  atualizar(delta) {
    if (!this.ativa) return;
    if (this.transicaoParaIntro) {
      this.tempoMovimento = Math.min(TEMPO_MOVIMENTO_CAMERA, this.tempoMovimento + delta);
      this.moverCamera(this.cameraDe, this.cameraPara, this.tempoMovimento / TEMPO_MOVIMENTO_CAMERA);
      if (this.tempoMovimento >= TEMPO_MOVIMENTO_CAMERA) {
        const aoConcluir = this.aoConcluir;
        this.destruir();
        aoConcluir?.();
      }
      return;
    }
    if (this.tempoMovimento >= TEMPO_MOVIMENTO_CAMERA) return;
    this.tempoMovimento = Math.min(TEMPO_MOVIMENTO_CAMERA, this.tempoMovimento + delta);
    this.moverCamera(this.cameraDe, this.cameraPara, this.tempoMovimento / TEMPO_MOVIMENTO_CAMERA);
  }

  moverCamera(de, para, progresso) {
    const t = Math.max(0, Math.min(1, progresso));
    const suave = t * t * (3 - 2 * t);
    const cam = this.scene.camJogo;
    cam.setZoom(Phaser.Math.Linear(de.zoom, para.zoom, suave))
      .centerOn(
        Phaser.Math.Linear(de.x, para.x, suave),
        Phaser.Math.Linear(de.y, para.y, suave),
      );
  }

  avancar() {
    if (!this.ativa || this.tempoMovimento < TEMPO_MOVIMENTO_CAMERA) return;
    this.indice++;
    if (this.indice >= this.falas.length) {
      if (!this.prepararPersonagens) {
        const aoConcluir = this.aoConcluir;
        this.destruir();
        aoConcluir?.();
        return;
      }
      this.transicaoParaIntro = true;
      this.container.setVisible(false);
      this.cameraDe = {
        x: this.scene.camJogo.midPoint.x,
        y: this.scene.camJogo.midPoint.y,
        zoom: this.scene.camJogo.zoom,
      };
      const primeiroLutador = this.scene.jogador1.sprite;
      this.cameraPara = {
        x: primeiroLutador.x,
        y: primeiroLutador.y - 55,
        zoom: this.scene.mapaAtual.configCamera?.maxZoom ?? 2,
      };
      this.tempoMovimento = 0;
      return;
    }
    this.mostrarFala();
  }

  destruir() {
    if (!this.ativa) return;
    this.ativa = false;
    this.scene.input.keyboard.off("keydown", this.aoTeclar);
    this.scene.input.off("pointerdown", this.aoClicar);
    this.scene.events.off("shutdown", this.destruir, this);
    this.container.destroy();
    if (this.restaurarEstado) {
      this.scene.camJogo.useBounds = this.usarLimitesCamera;
      this.scene.containerHUD?.setVisible(true);
      [this.scene.indicadorP1, this.scene.indicadorP2, this.scene.indicadorCPU]
        .filter(Boolean)
        .forEach(indicador => indicador.setVisible(true));
      this.scene.physics.world.resume();
    }
  }
}
