const cargasCompletas = new WeakMap();

export default class NotaCarregada {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.notas = [];
    this.carregando = false;
    this.lancado = false;
    this.cancelado = false;
    this.armazenada = false;
    this.somSek = null;
    this.sonsE = [];
    this.timerProximaVogal = null;
    this.timerFimPose = null;
    this.timerProximaNota = null;
    this.aoRepetirCarregamento = null;
    this.inicioCarga = 0;
    this.timerPausaAerea = null;
    this.gravidadeSuspensa = false;
    this.audioLancamentoGerenciado = false;
  }

  executar() {
    if (this.carregando || this.lancado) return;

    const cargaGuardada = cargasCompletas.get(this.personagem);
    if (cargaGuardada && cargaGuardada !== this) {
      this.notas = cargaGuardada.notas;
      cargaGuardada.notas = [];
      cargaGuardada.armazenada = false;
      cargaGuardada.cancelado = true;
      cargaGuardada.removerDaListaAtiva();
      cargasCompletas.delete(this.personagem);

      this.carregando = true;
      if (this.special.aereo) this.aplicarPausaAerea();
      this.soltar();
      return;
    }

    if (this.special.aereo) {
      this.carregando = true;
      this.criarNotaCarregada();
      this.criarNotaCarregada();
      this.atualizarNotasCarregadas();
      this.aplicarPausaAerea();
      this.audioLancamentoGerenciado = true;
      this.soltar();
      this.tocarAudioAereoSemCarga();
      return;
    }

    this.carregando = true;
    this.inicioCarga = this.scene.time.now;
    this.personagem.sprite.setVelocityX(0);
    this.criarNotaCarregada();
    this.agendarProximaNota();
    this.iniciarCancao();
  }

  aplicarPausaAerea() {
    const corpo = this.personagem.sprite.body;
    if (!corpo) return;

    this.timerPausaAerea?.remove(false);
    corpo.setVelocityY(0);
    corpo.setAllowGravity(false);
    this.gravidadeSuspensa = true;
    this.timerPausaAerea = this.scene.time.delayedCall(
      this.special.tempoPausaAerea ?? 180,
      () => {
        this.timerPausaAerea = null;
        if (!this.gravidadeSuspensa || !this.personagem.sprite?.body) return;
        this.personagem.sprite.body.setAllowGravity(true);
        this.gravidadeSuspensa = false;
      }
    );
  }

  restaurarGravidadeAerea() {
    this.timerPausaAerea?.remove(false);
    this.timerPausaAerea = null;
    if (this.gravidadeSuspensa && this.personagem.sprite?.body) {
      this.personagem.sprite.body.setAllowGravity(true);
    }
    this.gravidadeSuspensa = false;
  }

  agendarProximaNota() {
    this.timerProximaNota?.remove(false);
    this.timerProximaNota = this.scene.time.delayedCall(
      this.special.tempoEntreNotas ?? 1200,
      () => {
        this.timerProximaNota = null;
        if (!this.carregando || this.cancelado) return;
        this.criarNotaCarregada();
        if (this.notas.length >= 3) {
          this.concluirCargaCompleta();
        } else {
          this.agendarProximaNota();
        }
      }
    );
  }

  concluirCargaCompleta() {
    if (!this.carregando || this.notas.length < 3) return;
    this.carregando = false;
    this.armazenada = true;
    this.pararEscutaCarregamento();
    this.pararCargaSonora();
    cargasCompletas.set(this.personagem, this);

    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
  }

  tocarAudioAereoSemCarga() {
    const volume = this.special.volumeSom ?? 0.7;
    if (!this.scene.cache.audio.exists("sek")) {
      if (this.scene.cache.audio.exists("kai")) {
        this.scene.sound.play("kai", { volume });
      }
      return;
    }

    const sek = this.scene.sound.add("sek", { volume });
    sek.once("complete", () => {
      sek.destroy();
      if (this.scene.cache.audio.exists("kai")) {
        this.scene.sound.play("kai", { volume });
      }
    });
    sek.play();
  }

  iniciarCancao() {
    if (this.scene.cache.audio.exists("sek")) {
      this.somSek = this.scene.sound.add("sek", {
        volume: this.special.volumeSom ?? 0.7,
      });
      this.somSek.once("complete", () => {
        if (this.carregando && !this.cancelado) this.iniciarVogal();
      });
      this.somSek.play();
    } else {
      this.iniciarVogal();
    }
  }

  iniciarVogal() {
    if (!this.carregando || !this.scene.cache.audio.exists("e")) return;
    this.tocarVogalContinua(true);
  }

  tocarVogalContinua(primeira = false) {
    if (!this.carregando || this.cancelado) return;

    const volume = this.special.volumeSom ?? 0.7;
    const sobreposicao = this.special.crossfadeVogal ?? 0.12;
    const som = this.scene.sound.add("e", { volume: primeira ? volume : 0 });
    this.sonsE.push(som);
    som.play();

    if (!primeira) {
      this.scene.tweens.add({
        targets: som,
        volume,
        duration: sobreposicao * 1000,
      });
    }

    const anterior = this.sonsE.at(-2);
    if (anterior?.isPlaying) {
      this.scene.tweens.add({
        targets: anterior,
        volume: 0,
        duration: sobreposicao * 1000,
        onComplete: () => {
          anterior.stop();
          anterior.destroy();
          this.sonsE = this.sonsE.filter((item) => item !== anterior);
        },
      });
    }

    const duracao = som.duration || 0.5;
    const espera = Math.max(0.05, duracao - sobreposicao);
    this.timerProximaVogal = this.scene.time.delayedCall(
      espera * 1000,
      () => this.tocarVogalContinua()
    );
  }

  criarNotaCarregada() {
    if (!this.carregando || this.notas.length >= 3) return;
    const indice = this.notas.length;
    const animacao = indice % 2 === 0
      ? "miku_nota_especial_1"
      : "miku_nota_especial_2";
    const nota = this.scene.add.sprite(
      this.personagem.sprite.x,
      this.personagem.sprite.y - 85,
      "Miku_effects"
    );
    nota.setScale(this.special.escalaNota ?? 0.8);
    nota.setDepth(this.personagem.sprite.depth + 1);
    nota.setBlendMode(Phaser.BlendModes.ADD);
    nota.setAlpha(0.85);
    nota.play(animacao);
    this.scene.camHUD?.ignore(nota);
    this.notas.push({ sprite: nota, overlaps: [], collider: null, timerVida: null });
  }

  atualizarNotasCarregadas() {
    const posicoes = [
      { x: -30, y: -82, fase: 0 },
      { x: 8, y: -102, fase: 1.8 },
      { x: 38, y: -76, fase: 3.6 },
    ];
    this.notas.forEach((entrada, indice) => {
      const ponto = posicoes[indice];
      const flutuar = Math.sin(this.scene.time.now * 0.006 + ponto.fase) * 6;
      entrada.sprite.setPosition(
        this.personagem.sprite.x + ponto.x,
        this.personagem.sprite.y + ponto.y + flutuar
      );
    });
  }

  soltar() {
    if (!this.carregando || this.lancado) return;
    this.carregando = false;
    this.lancado = true;
    this.pararEscutaCarregamento();
    this.pararCargaSonora();

    if (!this.audioLancamentoGerenciado && this.scene.cache.audio.exists("kai")) {
      this.scene.sound.play("kai", { volume: this.special.volumeSom ?? 0.7 });
    }

    this.personagem.sprite.play("miku_specialSing2", true);
    this.personagem.aplicarConfiguracao("specialSing2");

    const direcao = this.personagem.sprite.flipX ? -1 : 1;
    this.notas.forEach((entrada) => this.lancarNota(entrada, direcao));

    this.timerFimPose = this.scene.time.delayedCall(
      this.special.tempoPoseLancamento ?? 560,
      () => {
        this.timerFimPose = null;
        if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
          this.estado.finalizarSpecial();
        }
      }
    );
  }

  lancarNota(entrada, direcao) {
    const nota = entrada.sprite;
    if (!nota?.active) return;
    this.scene.physics.add.existing(nota);
    nota.body.setAllowGravity(false);
    nota.body.debugBodyColor = 0xff0000;
    nota.body.setSize(
      this.special.larguraNota ?? 70,
      this.special.alturaNota ?? 70
    );
    nota.body.setVelocity(
      (this.special.velocidadeNota ?? 520) * direcao,
      this.special.quedaNota ?? 0
    );

    const oponentes = this.scene.scene.key === "CenaHistoria"
      ? (this.personagem === this.scene.boss
        ? [this.scene.jogador1]
        : [this.scene.boss])
      : [this.scene.jogador1, this.scene.jogador2].filter(
        (jogador) => jogador && jogador !== this.personagem
      );

    entrada.overlaps = oponentes.filter(Boolean).map((oponente) =>
      this.scene.physics.add.overlap(
        nota,
        oponente.grupoHurtbox,
        () => this.acertar(entrada, oponente, direcao),
        null,
        this
      )
    );

    const plataformas = this.scene.mapaAtual?.plataformas;
    if (plataformas) {
      entrada.collider = this.scene.physics.add.collider(
        nota,
        plataformas,
        () => this.destruirNota(entrada)
      );
    }

    entrada.timerVida = this.scene.time.delayedCall(
      this.special.tempoNota ?? 3500,
      () => this.destruirNota(entrada)
    );
  }

  acertar(entrada, alvo, direcao) {
    if (!entrada.sprite?.active) return;
    const propriedades = this.special.propriedades ?? {};
    alvo.receberDano(
      propriedades.dano ?? 4,
      propriedades,
      { x: entrada.sprite.x, direcao }
    );
    this.destruirNota(entrada);
  }

  destruirNota(entrada) {
    entrada.overlaps.forEach((overlap) => overlap?.destroy());
    entrada.overlaps = [];
    entrada.collider?.destroy();
    entrada.collider = null;
    entrada.timerVida?.remove(false);
    entrada.timerVida = null;
    entrada.sprite?.destroy();
    entrada.sprite = null;

    if (this.lancado && this.notas.every((item) => !item.sprite?.active)) {
      this.removerDaListaAtiva();
    }
  }

  pararEscutaCarregamento() {
    if (this.aoRepetirCarregamento) {
      this.personagem.sprite.off("animationrepeat", this.aoRepetirCarregamento);
      this.aoRepetirCarregamento = null;
    }
    this.timerProximaNota?.remove(false);
    this.timerProximaNota = null;
    this.inicioCarga = 0;
  }

  pararCargaSonora() {
    if (this.somSek) {
      this.somSek.stop();
      this.somSek.destroy();
      this.somSek = null;
    }
    this.timerProximaVogal?.remove(false);
    this.timerProximaVogal = null;
    this.sonsE.forEach((som) => {
      this.scene.tweens.killTweensOf(som);
      som.stop();
      som.destroy();
    });
    this.sonsE = [];
  }

  atualizar() {
    if (this.cancelado) return;
    if (this.armazenada) {
      this.atualizarNotasCarregadas();
      return;
    }
    if (this.carregando) {
      this.personagem.sprite.setVelocityX(0);
      this.atualizarNotasCarregadas();
      const botaoSolto =
        this.personagem.inputJustUp("special") ||
        !this.personagem.inputDown("special");
      const cargaMinimaCompleta =
        this.scene.time.now - this.inicioCarga >=
        (this.special.tempoMinimoCarga ?? 50);
      if (botaoSolto && cargaMinimaCompleta) this.soltar();
    }
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    this.restaurarGravidadeAerea();
    this.pararEscutaCarregamento();
    this.pararCargaSonora();
    if (this.armazenada) return;

    this.timerFimPose?.remove(false);
    this.timerFimPose = null;
    if (this.lancado) return;

    this.cancelado = true;
    this.carregando = false;
    this.notas.forEach((entrada) => this.destruirNota(entrada));
    this.removerDaListaAtiva();
  }
}


















