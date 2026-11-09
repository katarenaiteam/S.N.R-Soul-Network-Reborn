import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

const PROPRIEDADES_KIB = {
  semCargaKi: true,
  tipoSomImpacto: "heavy",
  dano: 6,
  knockbackX: 174,
  knockbackY: -66,
  hitstunBaseFrames: 12,
};

export default class GokuNeSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.fase = "decidindo";
    this.finalizado = false;
    this.proximoKiBallSolicitado = false;
    this.disparosAtivos = new Set();
    this.hitboxesProjetil = [];
    this.registrosKame = [];
    this.partesKame = [];
    this.alvosAtingidosKame = new Set();
    this.noAr = estado.tipoSpecialAtual === "air_neutro" &&
      !personagem.sprite.body.blocked.down;
    this.flutuarAtivo = false;
    this.gravidadeOriginal = personagem.sprite.body.allowGravity;
    this.inicioPressao = this.scene.time.now;
    this.aoFimAnimacaoKib = this.aoFimAnimacaoKib.bind(this);
    this.aoAtualizarAnimacaoKib = this.aoAtualizarAnimacaoKib.bind(this);
    this.aoFimPreparacao = this.aoFimPreparacao.bind(this);
    this.aoFimLancamento = this.aoFimLancamento.bind(this);
    this.aoAtualizarAnimacaoLancamento = this.aoAtualizarAnimacaoLancamento.bind(this);
    this.aoFimExplosaoKib = this.aoFimExplosaoKib.bind(this);
  }

  executar() {
    if (this.noAr) this.personagem.sprite.setVelocityX(0);
  }

  bloqueiaMovimentoLateral() {
    return this.noAr && [
      "decidindo",
      "preparacaoKame",
      "carregandoKame",
      "animacaoLancamentoKame",
      "raioKame",
    ].includes(this.fase);
  }

  iniciarFlutuar() {
    if (!this.noAr) return;
    this.flutuarAtivo = true;
    this.personagem.sprite.setVelocity(0, 20);
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.fase !== "projetilKib" && this.fase !== "raioKame" && !this.estaAtivo()) {
      this.cancelar();
      return;
    }

    this.atualizarFlutuar();
    if (this.fase === "decidindo") this.atualizarDecisao();
    else if (
      this.fase === "animacaoKiBall" &&
      this.numeroKiBall < 3 &&
      this.personagem.inputJustDown("special")
    ) {
      if (this.kibFoiLancada) this.substituirAnimacaoKiBall();
      else this.proximoKiBallSolicitado = true;
    }
    else if (this.fase === "carregandoKame") this.atualizarCargaKame();
    else if (this.fase === "projetilKib" || (this.fase === "animacaoKiBall" && this.kibFoiLancada)) this.atualizarProjetilKib();
    else if (this.fase === "raioKame") this.atualizarRaioKame();
  }

  substituirAnimacaoKiBall() {
    this.aoFimAnimacaoKib();
    if (this.estaAtivo()) return;
    const tipo = this.personagem.sprite.body.blocked.down ? "neutro" : "air_neutro";
    this.personagem.maquinaEstados.mudarEstado("special", { tipo });
  }

  atualizarFlutuar() {
    if (!this.noAr || !this.flutuarAtivo || !this.estaAtivo()) return;
    const sprite = this.personagem.sprite;
    if (!sprite.body.blocked.down) {
      sprite.setVelocityY(20);
      if (
        this.bloqueiaMovimentoLateral() ||
        (!this.personagem.inputDown("esquerda") && !this.personagem.inputDown("direita"))
      ) {
        sprite.setVelocityX(0);
      }
    }
  }

  atualizarDecisao() {
    const segurando = this.personagem.inputDown("special");
    const tempoSegurado = this.scene.time.now - this.inicioPressao;
    if (
      segurando &&
      tempoSegurado >= this.special.esperaKamehameha &&
      (this.personagem.kaiokenAtivo || this.personagem.cargaKi >= this.special.custoKamehameha) &&
      this.scene.time.now >= this.personagem.cooldownKamehamehaAte
    ) {
      this.iniciarKamehameha();
      return;
    }
    if (
      segurando &&
      tempoSegurado >= this.special.esperaKamehameha &&
      !this.personagem.kaiokenAtivo &&
      this.personagem.cargaKi < this.special.custoKamehameha
    ) {
      this.finalizarEstado();
      return;
    }
    if (!segurando) {
      if (this.scene.time.now < this.personagem.cooldownKiBallAte) {
        this.finalizarEstado();
        return;
      }
      this.iniciarKiBall();
    }
  }

  iniciarKiBall() {
    if (!this.personagem.consumirCargaKi(this.special.custoKiBall)) {
      this.finalizarEstado();
      return;
    }
    this.iniciarFlutuar();
    const agora = this.scene.time.now;
    if (agora - this.personagem.ultimaKiBallAte > this.special.intervaloKiBall) {
      this.personagem.sequenciaKiBall = 0;
    }
    this.personagem.sequenciaKiBall += 1;
    this.personagem.ultimaKiBallAte = agora;
    this.numeroKiBall = Math.min(3, this.personagem.sequenciaKiBall);
    if (this.noAr && this.numeroKiBall === 1) {
      this.personagem.registrarUsoNeutroAereoConfirmado();
    }
    this.fase = "animacaoKiBall";
    const sprite = this.personagem.sprite;
    const nomeAnimacao = this.special.animacoes.kiBall[this.numeroKiBall - 1];
    this.nomeAnimacaoKiBall = nomeAnimacao;
    this.kibFoiLancada = false;
    sprite.play(nomeAnimacao, true);
    this.personagem.aplicarConfiguracao(`kib${this.numeroKiBall}`);
    sprite.on("animationupdate", this.aoAtualizarAnimacaoKib);
    sprite.once(`animationcomplete-${nomeAnimacao}`, this.aoFimAnimacaoKib);
  }

  aoAtualizarAnimacaoKib(animacao, frame) {
    if (
      this.fase !== "animacaoKiBall" ||
      animacao?.key !== this.nomeAnimacaoKiBall ||
      this.kibFoiLancada ||
      Number(frame?.textureFrame) < 3
    ) return;
    this.kibFoiLancada = true;
    this.criarProjetilKiBall();
    if (this.proximoKiBallSolicitado) {
      this.proximoKiBallSolicitado = false;
      this.substituirAnimacaoKiBall();
    }
  }

  aoFimAnimacaoKib() {
    if (!this.estaAtivo() || !["animacaoKiBall", "explosaoKiBall"].includes(this.fase)) return;
    this.personagem.sprite.off("animationupdate", this.aoAtualizarAnimacaoKib);
    this.personagem.sprite.off(
      `animationcomplete-${this.nomeAnimacaoKiBall}`,
      this.aoFimAnimacaoKib,
    );
    if (!this.kibFoiLancada) this.criarProjetilKiBall();
    if (this.numeroKiBall === 3) {
      this.personagem.sequenciaKiBall = 0;
      this.personagem.cooldownKiBallAte = this.scene.time.now + this.special.cooldownKiBall;
    }
    if (this.fase === "animacaoKiBall") this.fase = "projetilKib";
    this.finalizarEstado();
  }

  criarProjetilKiBall() {
    const somKiBall = this.personagem.proximoSomKiBall === 1 ? "kib2" : "kib1";
    this.personagem.tocarSomSorteado(somKiBall, { volume: 0.4, detune: 0 });
    this.personagem.proximoSomKiBall = somKiBall === "kib1" ? 1 : 0;
    const spriteGoku = this.personagem.sprite;
    this.direcao = spriteGoku.flipX ? -1 : 1;
    const projetil = this.scene.physics.add.sprite(
      spriteGoku.x + this.direcao * 55,
      spriteGoku.y - 54,
      "kib",
      0,
    ).setFlipX(this.direcao < 0).setDepth(spriteGoku.depth + 1);
    this.scene.camHUD?.ignore(projetil);
    projetil.anims.play("goku_kib");
    projetil.body.setAllowGravity(false);
    projetil.body.setVelocityX(this.direcao * this.special.velocidadeKiBall);
    projetil.body.debugBodyColor = 0xff00ff;
    projetil.body.setSize(26, 28).setOffset(6, 10);
    this.projetilKib = projetil;
    this.hitboxKib = this.criarHitbox(projetil.x, projetil.y, 28, 28);
    this.registroKib = registrarAtaqueEspecial(this, this.hitboxKib, {
      categoria: "projetil",
      aoColidir: () => this.explodirKiBall(),
      aoAtingirAlvo: (alvo) => this.explodirKiBall(alvo),
    });
    const plataformas = this.obterPlataformas();
    if (plataformas) {
      this.colisorKiBall = this.scene.physics.add.collider(
        projetil,
        plataformas,
        () => this.explodirKiBall(),
      );
    }
    this.timerVidaKib = this.scene.time.delayedCall(
      this.special.alcanceKiBall / this.special.velocidadeKiBall * 1000,
      () => this.explodirKiBall(),
    );
  }

  atualizarProjetilKib() {
    if (!this.projetilKib?.active) return;
    this.hitboxKib?.setPosition(this.projetilKib.x, this.projetilKib.y);
    this.hitboxKib?.body?.updateFromGameObject();
  }

  explodirKiBall(alvoInicial = null) {
    if (
      this.fase !== "projetilKib" &&
      !(this.fase === "animacaoKiBall" && this.kibFoiLancada)
    ) return;
    this.fase = "explosaoKiBall";
    this.timerVidaKib?.remove(false);
    this.colisorKiBall?.destroy();
    this.colisorKiBall = null;
    this.registroKib?.remover();
    this.registroKib = null;
    this.hitboxKib?.destroy();
    this.hitboxKib = null;
    if (this.projetilKib?.body) {
      this.projetilKib.body.stop();
      this.projetilKib.body.enable = false;
    }
    const x = this.projetilKib?.x ?? this.scene.scale.width / 2;
    const y = this.projetilKib?.y ?? 0;
    this.projetilKib?.setVisible(false);
    const explosao = this.scene.add.sprite(x, y, "kib_exp", 0)
      .setDepth((this.projetilKib?.depth ?? 1) + 1);
    this.scene.camHUD?.ignore(explosao);
    explosao.anims.play("goku_kib_exp");
    this.explosaoKiBall = explosao;
    this.hitboxExplosaoKib = this.criarHitbox(x, y, 74, 74);
    this.alvosAtingidosKib = new Set();
    if (alvoInicial) this.acertarKiBall(alvoInicial);
    this.registroExplosaoKib = registrarAtaqueEspecial(this, this.hitboxExplosaoKib, {
      categoria: "corpo",
      aoAtingirAlvo: (alvo) => this.acertarKiBall(alvo),
    });
    explosao.once("animationcomplete-goku_kib_exp", this.aoFimExplosaoKib);
  }

  acertarKiBall(alvo) {
    if (this.alvosAtingidosKib.has(alvo)) return;
    this.alvosAtingidosKib.add(alvo);
    const xImpacto = this.explosaoKiBall?.x ?? this.projetilKib?.x ?? this.personagem.sprite.x;
    const direcao = alvo.sprite.x < xImpacto ? -1 : 1;
    const propriedades = this.personagem.aplicarBonusDanoKaioken(
      this.special.danoKiBall,
      PROPRIEDADES_KIB,
    );
    alvo.receberDano(propriedades.dano, propriedades, {
      atacante: this.personagem,
      x: xImpacto,
      direcao,
    });
  }

  aoFimExplosaoKib() {
    this.limpar();
  }

  iniciarKamehameha() {
    if (this.scene.time.now < this.personagem.cooldownKamehamehaAte) return;
    if (!this.personagem.consumirCargaKi(this.special.custoKamehameha)) {
      this.finalizarEstado();
      return;
    }
    this.personagem.tocarSomSorteado("gk-carga", { volume: 0.4, detune: 0 });
    this.personagem.tocarSomSorteado("kame-inicio", { volume: 0.35, detune: 0 });
    if (this.noAr) this.personagem.registrarUsoNeutroAereoConfirmado();
    this.tiersCarga = 0;
    this.direcao = this.personagem.sprite.flipX ? -1 : 1;
    if (this.noAr) {
      this.fase = "animacaoLancamentoKame";
      this.animacaoKameAtual = this.special.animacoes.preparacaoKame;
      this.iniciarFlutuar();
      this.personagem.sprite.play(this.animacaoKameAtual, true);
      this.personagem.aplicarConfiguracao("neSpecialAr");
      this.personagem.sprite.on("animationupdate", this.aoAtualizarAnimacaoLancamento);
      this.personagem.sprite.once(
        `animationcomplete-${this.animacaoKameAtual}`,
        this.aoFimLancamento,
      );
      return;
    }
    this.fase = "preparacaoKame";
    this.iniciarFlutuar();
    this.personagem.sprite.setVelocityX(0).play(this.special.animacoes.preparacaoKame, true);
    this.personagem.aplicarConfiguracao("neSpecial");
    this.personagem.sprite.once(
      `animationcomplete-${this.special.animacoes.preparacaoKame}`,
      this.aoFimPreparacao,
    );
  }

  aoFimPreparacao() {
    if (this.fase !== "preparacaoKame" || !this.estaAtivo()) return;
    this.fase = "carregandoKame";
    const sprite = this.personagem.sprite;
    sprite.play(this.special.animacoes.cargaKame, true);
    this.personagem.aplicarConfiguracao("kamecharg");
    this.criarEfeitosCargaKame();
    this.somKameMeio = this.scene.sound.add("kame-meio", { volume: 0, loop: true });
    this.somKameMeio.play();
    this.scene.tweens.add({ targets: this.somKameMeio, volume: 0.35, duration: 650 });
    this.proximaCobrancaKi = this.scene.time.now + 1000;
  }

  criarEfeitosCargaKame() {
    const sprite = this.personagem.sprite;
    this.auraKame = this.scene.add.sprite(sprite.x, sprite.y, "kame_aura")
      .setOrigin(0.5, 0.5).setScale(1).setDepth(sprite.depth + 2);
    this.auraKame.anims.play("goku_kame_aura");
    this.bolaCargaKame = this.scene.add.sprite(
      sprite.x - this.direcao * 38,
      sprite.y - 59,
      "kame_charg",
    ).setScale(1.1).setDepth(sprite.depth + 3);
    this.bolaCargaKame.anims.play("goku_kame_charg");
    this.scene.camHUD?.ignore([this.auraKame, this.bolaCargaKame]);
  }

  atualizarCargaKame() {
    this.atualizarEfeitosCargaKame();
    const segurando = this.personagem.inputDown("special");
    const agora = this.scene.time.now;
    if (segurando && agora >= this.proximaCobrancaKi) {
      if (this.personagem.consumirCargaKi(5)) {
        this.tiersCarga += 1;
        this.proximaCobrancaKi += 1000;
      } else {
        this.proximaCobrancaKi = agora + 1000;
      }
    }
    if (!segurando) this.iniciarAnimacaoLancamento();
  }

  atualizarEfeitosCargaKame() {
    const sprite = this.personagem.sprite;
    if (this.auraKame?.active) {
      this.auraKame
        .setPosition(sprite.x, sprite.y - 48)
        .setScale(1 + this.tiersCarga * 0.05)
        .setDepth(sprite.depth + 2);
    }
    if (this.bolaCargaKame?.active) {
      this.bolaCargaKame
        .setPosition(sprite.x - this.direcao * 38, sprite.y - 59)
        .setScale(1.1 + this.tiersCarga * 0.06)
        .setDepth(sprite.depth + 3);
    }
  }

  iniciarAnimacaoLancamento() {
    if (this.fase !== "carregandoKame") return;
    this.fase = "animacaoLancamentoKame";
    this.auraKame?.destroy();
    this.bolaCargaKame?.destroy();
    this.somKameMeio?.stop();
    this.somKameMeio?.destroy();
    this.somKameMeio = null;
    this.scene.sound.play("kame-fim", { volume: 0.65 });
    this.scene.sound.play("kame-fim1", { volume: 0.35 });
    const sprite = this.personagem.sprite;
    this.animacaoKameAtual = this.special.animacoes.lancamentoKame;
    sprite.play(this.animacaoKameAtual, true);
    this.personagem.aplicarConfiguracao("kamelauch");
    sprite.on("animationupdate", this.aoAtualizarAnimacaoLancamento);
    sprite.once(
      `animationcomplete-${this.animacaoKameAtual}`,
      this.aoFimLancamento,
    );
  }

  aoAtualizarAnimacaoLancamento(animacao, frame) {
    const quadroDeLancamento = this.noAr
      ? this.special.frameLancamentoAereo
      : (this.tiersCarga === 0 ? 4 : 6);
    if (
      this.fase === "animacaoLancamentoKame" &&
      animacao?.key === this.animacaoKameAtual &&
      Number(frame?.textureFrame) >= quadroDeLancamento
    ) this.aoFimLancamento();
  }

  aoFimLancamento() {
    if (this.fase !== "animacaoLancamentoKame") return;
    this.personagem.sprite.off("animationupdate", this.aoAtualizarAnimacaoLancamento);
    this.personagem.sprite.off(
      `animationcomplete-${this.animacaoKameAtual}`,
      this.aoFimLancamento,
    );
    this.criarRaioKame();
    this.fase = "raioKame";
    this.personagem.cooldownKamehamehaAte =
      this.scene.time.now + this.special.cooldownKamehameha;
    if (this.noAr) return;
    this.personagem.sprite.play(this.special.animacoes.loopLancamentoKame, true);
    this.personagem.aplicarConfiguracao("kamelauch");
  }

  criarRaioKame() {
    const sprite = this.personagem.sprite;
    this.inclinacaoKame = this.noAr ? this.special.inclinacaoKameAerea : 0;
    this.rotacaoKame = Math.atan(this.inclinacaoKame) * this.direcao;
    this.origemKameX = sprite.x + this.direcao * (
      this.noAr ? this.special.origemKameAereaX : 70
    );
    this.origemKameY = sprite.y + (
      this.noAr ? this.special.origemKameAereaY : -53
    );
    const escala = 0.48 + this.tiersCarga * this.special.larguraKamehamehaPorCarga;
    this.escalaKame = escala;
    this.alcanceKame = this.special.alcanceBaseKamehameha +
      this.tiersCarga * this.special.alcancePorCargaKamehameha;
    this.deslocamentoPontaFinal = 3 * escala;
    const deslocamentoBaseKame = -12 + (escala - 0.48) * 25;
    const xBaseKame = this.origemKameX + this.direcao * deslocamentoBaseKame;
    this.baseKame = this.scene.add.sprite(
      xBaseKame,
      this.origemKameY + deslocamentoBaseKame * this.inclinacaoKame,
      "kame_base",
    ).setScale(escala).setFlipX(this.direcao < 0).setRotation(this.rotacaoKame)
      .setDepth(sprite.depth + 1);
    this.scene.camHUD?.ignore(this.baseKame);
    this.baseKame.anims.play("goku_kame_base");
    this.criarHitboxDanoKame(this.baseKame, 74 * escala, 78 * escala);

    this.deslocamentoPontaInicial = 90 * escala;
    this.deslocamentoPrimeiroCaule = deslocamentoBaseKame +
      (86.5 * escala) / Math.sqrt(1 + this.inclinacaoKame ** 2);
    this.posicaoInicialPontaX = this.origemKameX + this.direcao * this.deslocamentoPontaInicial;
    this.pointKame = this.scene.physics.add.sprite(
      this.posicaoInicialPontaX,
      this.origemKameY + this.deslocamentoPontaInicial * this.inclinacaoKame,
      "kame_point",
      0,
    ).setScale(escala).setFlipX(this.direcao < 0).setRotation(this.rotacaoKame)
      .setDepth(sprite.depth + 20);
    this.scene.camHUD?.ignore(this.pointKame);
    this.pointKame.anims.play("goku_kame_point");
    this.pointKame.body.setAllowGravity(false);
    this.pointKame.body.debugBodyColor = 0xff00ff;
    this.pointKame.body.setSize(80, 60).setOffset(25, 37);
    this.velocidadePontaKame = 2200;
    this.pointKame.body.setVelocity(
      this.direcao * this.velocidadePontaKame,
      this.velocidadePontaKame * this.inclinacaoKame,
    );
    this.hitboxPointKame = this.criarHitbox(this.pointKame.x, this.pointKame.y, 110 * escala, 80 * escala);
    this.registrarHitboxKame(this.hitboxPointKame);

    const plataformas = this.obterPlataformas();
    if (plataformas) {
      this.colisorPointKame = this.scene.physics.add.collider(
        this.pointKame,
        plataformas,
        () => {
          if (
            !this.pointKame?.body ||
            (this.direcao > 0 && !this.pointKame.body.blocked.right) ||
            (this.direcao < 0 && !this.pointKame.body.blocked.left)
          ) return;
          this.pointKame.body.setVelocity(0, 0);
          this.pointParado = true;
          this.pointParadoNaParede = true;
        },
      );
    }
    this.tamanhoCauleKame = 70 * escala;
    this.caulesCriadosKame = 0;
    this.deslocamentoCauleFinal = 5 * escala;
    this.maxCaulesKame = Math.max(1, Math.ceil(
      (this.alcanceKame - this.deslocamentoCauleFinal - this.deslocamentoPrimeiroCaule) /
        this.tamanhoCauleKame,
    ) + 1);
  }

  atualizarRaioKame() {
    if (!this.pointKame?.active) return;
    const alcancePonta = this.alcanceKame - this.deslocamentoPontaFinal;
    const pontoFinalX = this.origemKameX + this.direcao * alcancePonta;
    const pontoFinalY = this.origemKameY + alcancePonta * this.inclinacaoKame;
    const chegouAoFim = this.direcao > 0
      ? this.pointKame.x >= pontoFinalX
      : this.pointKame.x <= pontoFinalX;
    if (!this.pointParado && chegouAoFim) {
      this.pointKame.setPosition(
        pontoFinalX,
        pontoFinalY,
      );
      this.pointKame.body.setVelocity(0, 0);
      this.pointParado = true;
    }
    this.hitboxPointKame?.setPosition(this.pointKame.x, this.pointKame.y);
    this.hitboxPointKame?.body?.updateFromGameObject();

    const ultimoCaule = this.caulesCriadosKame === this.maxCaulesKame - 1;
    const distanciaProximoCaule = ultimoCaule
      ? this.alcanceKame - this.deslocamentoCauleFinal
      : this.deslocamentoPrimeiroCaule + this.caulesCriadosKame * this.tamanhoCauleKame;
    const distanciaPonta = Math.abs(this.pointKame.x - this.origemKameX);
    const pontaAlcancouCaule = distanciaPonta >= distanciaProximoCaule;
    if (
      this.caulesCriadosKame < this.maxCaulesKame &&
      (pontaAlcancouCaule || this.pointParadoNaParede)
    ) {
      this.criarCauleKame(this.caulesCriadosKame);
      this.caulesCriadosKame += 1;
    }
    const caulesConcluidos = this.caulesCriadosKame >= this.maxCaulesKame;
    if (caulesConcluidos && !this.timerFimRaio) {
      this.timerFimRaio = this.scene.time.delayedCall(650, () => this.finalizarRaioKame());
    }
  }

  criarCauleKame(indice) {
    const distancia = indice === this.maxCaulesKame - 1
        ? this.alcanceKame - this.deslocamentoCauleFinal
        : this.deslocamentoPrimeiroCaule + indice * this.tamanhoCauleKame;
    const x = this.pointParadoNaParede
      ? this.pointKame.x
      : this.origemKameX + this.direcao * distancia;
    const y = this.pointParadoNaParede
      ? this.pointKame.y
      : this.origemKameY + distancia * this.inclinacaoKame;
    const caule = this.scene.add.sprite(x, y, "kame_caule")
      .setScale(this.escalaKame).setFlipX(this.direcao < 0).setRotation(this.rotacaoKame)
      .setDepth(this.personagem.sprite.depth + 10);
    this.scene.camHUD?.ignore(caule);
    caule.anims.play("goku_kame_caule");
    this.partesKame.push(caule);
    const hitbox = this.criarHitbox(x, y, 76 * this.escalaKame, 42 * this.escalaKame);
    this.hitboxesKame ??= [];
    this.hitboxesKame.push(hitbox);
    this.registrarHitboxKame(hitbox);
  }

  criarHitboxDanoKame(parte, largura, altura) {
    const hitbox = this.criarHitbox(parte.x, parte.y, largura, altura);
    this.hitboxesKame ??= [];
    this.hitboxesKame.push(hitbox);
    this.registrarHitboxKame(hitbox);
  }

  registrarHitboxKame(hitbox) {
    const registro = registrarAtaqueEspecial(this, hitbox, {
      categoria: "projetil",
      persistirAoColidirProjetil: true,
      aoColidirProjetil: (outro) => this.colidirRaioKame(outro, registro),
      aoAtingirAlvo: (alvo, objeto) => this.acertarRaioKame(alvo, objeto),
    });
    if (registro) this.registrosKame.push(registro);
  }

  colidirRaioKame(outro, registro) {
    const outraLogica = outro?.logica;
    if (!(outraLogica instanceof GokuNeSpecial && outraLogica.fase === "raioKame")) {
      outro?.aoColidir?.(registro);
    }
    return false;
  }

  acertarRaioKame(alvo) {
    if (this.alvosAtingidosKame.has(alvo)) return;
    this.alvosAtingidosKame.add(alvo);
    const propriedades = this.personagem.aplicarBonusDanoKaioken(
      this.special.danoBaseKamehameha + this.tiersCarga * 6,
      {
      ...this.special.logicaPropriedades,
      semCargaKi: true,
      knockbackX: this.special.knockbackBaseKamehameha +
        this.tiersCarga * this.special.knockbackPorCargaKamehameha,
      },
    );
    alvo.receberDano(propriedades.dano, propriedades, {
      atacante: this.personagem,
      x: this.origemKameX,
      direcao: this.direcao,
    });
  }

  finalizarRaioKame() {
    if (this.fase !== "raioKame") return;
    this.finalizarEstado();
    this.limpar();
  }

  criarHitbox(x, y, largura, altura) {
    const hitbox = this.scene.add.zone(x, y, largura, altura);
    this.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(hitbox);
    return hitbox;
  }

  obterPlataformas() {
    return this.scene.mapaAtual?.plataformas || this.scene.plataformas || this.scene.chao;
  }

  estaAtivo() { return this.personagem.maquinaEstados.estadoAtual === this.estado; }

  finalizarEstado() {
    if (this.estaAtivo()) this.estado.finalizarSpecial();
  }

  cancelar() {
    if (this.fase === "projetilKib" || this.fase === "explosaoKiBall" || this.fase === "raioKame") {
      this.restaurarFlutuar();
      return;
    }
    this.limpar();
  }

  restaurarFlutuar() {
    if (!this.noAr) return;
    this.personagem.sprite.body.setAllowGravity(this.gravidadeOriginal);
    this.noAr = false;
  }

  limpar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.somKameMeio?.stop();
    this.somKameMeio?.destroy();
    this.somKameMeio = null;
    this.restaurarFlutuar();
    this.personagem.sprite.off(
      `animationcomplete-${this.special.animacoes.preparacaoKame}`,
      this.aoFimPreparacao,
    );
    this.personagem.sprite.off(
      `animationcomplete-${this.special.animacoes.lancamentoKame}`,
      this.aoFimLancamento,
    );
    this.personagem.sprite.off("animationupdate", this.aoAtualizarAnimacaoLancamento);
    this.special.animacoes.kiBall.forEach((animacao) => {
      this.personagem.sprite.off(`animationcomplete-${animacao}`, this.aoFimAnimacaoKib);
    });
    this.personagem.sprite.off("animationupdate", this.aoAtualizarAnimacaoKib);
    this.timerVidaKib?.remove(false);
    this.timerFimRaio?.remove(false);
    this.colisorKiBall?.destroy();
    this.colisorPointKame?.destroy();
    this.registroKib?.remover();
    this.registroExplosaoKib?.remover();
    this.registrosKame.forEach((registro) => registro.remover());
    this.registrosKame = [];
    [this.hitboxKib, this.hitboxExplosaoKib, this.hitboxPointKame, ...(this.hitboxesKame ?? [])]
      .forEach((hitbox) => hitbox?.destroy());
    [this.projetilKib, this.explosaoKiBall, this.auraKame, this.bolaCargaKame,
      this.baseKame, this.pointKame, ...this.partesKame]
      .forEach((objeto) => objeto?.destroy());
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}
