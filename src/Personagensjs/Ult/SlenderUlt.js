import { obterAlvosCombate } from "../../Objetos/SistemaCombateEspecial.js";
import { gerarQuadrosUltimateBackground } from "../../Objetos/QuadrosUltimateBackground.js";

const EFEITOS_CORTE = [
  ["Slan_doSpecial-efect", "slan_doSpecial-efect", 0, 2],
  ["Slan_siSpecial-efect", "slan_siSpecial-efect", 0, 8],
  ["Slan_AsiSpecial-efect", "slan_AsiSpecial-efect", 0, 8],
  ["Slan_AneSpecial-efect", "slan_AneSpecial-efect", 0, 8],
  ["Slan_AdoSpecial-efect", "slan_AdoSpecial-efect", 0, 7],
];

export default class SlenderUlt {
  constructor(personagem, _config, estadoFSM) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.estadoFSM = estadoFSM;
    this.oponente = obterAlvosCombate(personagem)
      .filter((alvo) => alvo?.sprite?.active && alvo.maquinaEstados)
      .sort((a, b) => Math.abs(a.sprite.x - personagem.sprite.x) - Math.abs(b.sprite.x - personagem.sprite.x))[0];
    this.timers = new Set();
    this.efeitos = new Set();
    this.hitboxes = new Set();
    this.overlaps = new Set();
    this.cancelada = false;
    this.funcaoCameraOriginal = this.scene.atualizarCamera;
    this.camera = this.scene.cameras.main;
    this.zoomOriginal = this.camera.zoom;
    this.cameraOriginal = { x: this.camera.midPoint.x, y: this.camera.midPoint.y };
    this.visibilidadesCenario = [];
  }

  executar() {
    if (!this.oponente) return this.finalizar();
    const p = this.personagem.sprite;
    const alvo = this.oponente.sprite;
    this.dir = p.flipX ? -1 : 1;
    this.movesSlender = p.body.moves;
    this.movesAlvo = alvo.body?.moves;
    this.gravityAlvo = alvo.body?.allowGravity;
    this.updateAlvo = this.oponente.maquinaEstados.update;
    this.visivelSlender = p.visible;
    this.yChaoSlender = p.y;
    this.ativarFundoUltimate();
    this.scene.atualizarCamera = () => {};
    p.body.setVelocity(0, 0);
    p.body.setAllowGravity(false);
    p.body.moves = false;
    p.setFrame(0);
    p.anims.pause();
    this.oponente.maquinaEstados.update = () => {};
    alvo.body?.setVelocity(0, 0);
    alvo.body && (alvo.body.moves = false);
    alvo.anims.pause();
    this.camera.pan(p.x, p.y, 250, "Cubic.easeOut");
    this.camera.zoomTo(this.camera.zoom * 1.35, 250);
    this.tocarEfeito("poseEffect", p.x, p.y, 1000);
    this.agendar(1000, () => this.iniciarAvanco());
  }

  agendar(ms, fn) {
    const timer = this.scene.time.delayedCall(ms, () => {
      this.timers.delete(timer);
      if (!this.cancelada) fn();
    });
    this.timers.add(timer);
    return timer;
  }

  iniciarAvanco() {
    const p = this.personagem.sprite;
    p.anims.resume();
    p.body.moves = true;
    p.anims.play("slan-ult1", true);
    p.anims.setCurrentFrame(p.anims.currentAnim.frames[1]);
    p.anims.pause();
    this.tocarEfeito("dashEffect", p.x, p.y, 450, this.dir, 0.8);
    this.xInicial = p.x;
    this.tempoAvanco = this.scene.time.now;
    this.duracaoAvanco = 450;
    this.distanciaAvanco = 650 * this.dir;
    this.avancando = true;
  }

  atualizar() {
    this.ajustarFundoNaCamera();
    if (this.cancelada || (!this.avancando && !this.avancandoFinal)) return;
    const p = this.personagem.sprite;
    const alvo = this.oponente?.sprite;
    if (!p?.active || !alvo?.active) return this.finalizar();
    const t = Phaser.Math.Clamp((this.scene.time.now - this.tempoAvanco) / this.duracaoAvanco, 0, 1);
    const progresso = this.avancandoFinal ? 1 - (1 - t) ** 2 : t;
    p.x = Phaser.Math.Linear(this.xInicial, this.xInicial + this.distanciaAvanco, progresso);
    p.y = this.yChaoSlender;
    if (this.avancandoFinal) return;
    if (Math.abs(p.x - alvo.x) < 55 && Math.abs(p.y - alvo.y) < 80) {
      this.avancando = false;
      this.acertar();
    } else if (t >= 1) {
      this.avancando = false;
      this.finalizar();
    }
  }

  tocarTv(concluido) {
    const tex = this.scene.textures.get("Slan_tv");
    const fim = Math.max(0, tex?.frameTotal - 2 ?? 0);
    if (!this.scene.anims.exists("slan_ult_tv")) this.scene.anims.create({
      key: "slan_ult_tv", frames: this.scene.anims.generateFrameNumbers("Slan_tv", { start: 0, end: fim }), frameRate: 24, repeat: -1,
    });
    const s = this.scene.add.sprite(this.camera.width / 2, this.camera.height / 2, "Slan_tv")
      .setScrollFactor(0).setDepth(2000).setDisplaySize(this.camera.width, this.camera.height);
    this.scene.camHUD?.ignore(s);
    s.play("slan_ult_tv");
    this.agendar(500, () => {
      s.destroy();
      concluido?.();
    });
  }

  acertar() {
    const p = this.personagem.sprite;
    const alvo = this.oponente.sprite;
    p.setVisible(false);
    this.camera.pan(alvo.x, alvo.y - 40, 300, "Cubic.easeOut");
    this.camera.zoomTo(this.camera.zoom * 1.1, 300);
    alvo.body?.setVelocity(0, 0);
    alvo.body && (alvo.body.moves = false);
    alvo.setFrame(0);
    this.tocarTv(() => {
      const grab = this.scene.add.sprite(alvo.x, alvo.y, "slan-grab", 0).setOrigin(0.5, 1).setDepth(alvo.depth + 4);
      this.scene.camHUD?.ignore(grab);
      if (!this.scene.anims.exists("slan_ult_grab")) this.scene.anims.create({ key: "slan_ult_grab", frames: this.scene.anims.generateFrameNumbers("slan-grab", { start: 0, end: 4 }), frameRate: 8, repeat: 0 });
      grab.once("animationcomplete", () => grab.setFrame(4));
      grab.play("slan_ult_grab");
      this.efeitos.add(grab);
      this.iniciarCortes(grab);
    });
  }

  iniciarCortes(grab) {
    this.tocarCorteContinuo(this.oponente, 0);
    this.agendar(5000, () => {
      this.tocarTv(() => this.finalizarComGolpe(grab));
    });
  }

  tocarCorteContinuo(alvo, indice) {
    if (this.cancelada || indice >= 42) return;
    this.criarCorte(alvo.sprite, indice);
    this.criarHitboxAtaque(alvo, 2, this.dir);
    this.agendar(120, () => this.tocarCorteContinuo(alvo, indice + 1));
  }

  criarCorte(alvo, indice) {
    const [textura, anim, inicio, fim] = EFEITOS_CORTE[indice % EFEITOS_CORTE.length];
    if (!this.scene.textures.exists(textura)) return;
    if (!this.scene.anims.exists(anim)) this.scene.anims.create({ key: anim, frames: this.scene.anims.generateFrameNumbers(textura, { start: inicio, end: fim }), frameRate: 18, repeat: 0 });
    const corte = this.scene.add.sprite(alvo.x + Phaser.Math.Between(-25, 25), alvo.y - Phaser.Math.Between(25, 100), textura)
      .setDepth(alvo.depth + 5).setScale(Phaser.Math.FloatBetween(0.7, 1.2)).setRotation(Phaser.Math.FloatBetween(-1, 1));
    this.scene.camHUD?.ignore(corte);
    corte.play(anim);
    corte.once("animationcomplete", () => corte.destroy());
  }

  finalizarComGolpe(grab) {
    const p = this.personagem.sprite;
    const personagemAlvo = this.oponente;
    const alvo = personagemAlvo.sprite;
    grab.destroy();
    this.efeitos.delete(grab);
    alvo.body?.setVelocity(0, 0);
    alvo.body && (alvo.body.moves = this.movesAlvo ?? true);
    alvo.body?.setAllowGravity(this.gravityAlvo ?? true);
    if (this.oponente.maquinaEstados && this.updateAlvo) this.oponente.maquinaEstados.update = this.updateAlvo;
    const lado = 1;
    p.setVisible(true);
    p.setPosition(alvo.x - lado * 80, this.yChaoSlender);
    p.setFlipX(lado < 0);
    p.anims.play("slan-ult5", true);
    p.anims.setCurrentFrame(p.anims.currentAnim.frames[0]);
    p.anims.pause();
    this.dirFinal = lado;
    this.agendar(450, () => {
      p.anims.setCurrentFrame(p.anims.currentAnim.frames[7]);
      p.anims.resume();
      this.xInicial = p.x;
      this.tempoAvanco = this.scene.time.now;
      p.y = this.yChaoSlender;
      this.duracaoAvanco = 180;
      this.distanciaAvanco = lado * 150;
      this.avancandoFinal = true;
      this.criarCorte(alvo, 1);
      this.agendar(180, () => {
        if (this.cancelada) return;
        this.avancandoFinal = false;
        p.setPosition(this.xInicial + this.distanciaAvanco, this.yChaoSlender);
        this.criarHitboxAtaque(personagemAlvo, 40, lado, () => {
          if (personagemAlvo.corrupcaoSlender) {
            personagemAlvo.corrupcaoSlender.adicionar(100);
            personagemAlvo.corrupcaoSlender.valor = 100;
          }
          if (personagemAlvo.maquinaEstados?.mudarEstado("atordoado") === false) personagemAlvo.tocarAnimacao?.("stun", true);
          this.finalizar();
        });
      });
    });
  }

  criarHitboxAtaque(alvo, quantidade, direcao, aoAcertar) {
    const spriteAlvo = alvo.sprite;
    const hitbox = this.scene.add.rectangle(spriteAlvo.x, spriteAlvo.y - 65, 130, 145, 0xffffff, 0)
      .setVisible(false);
    this.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    hitbox.body.setVelocity(0, 0);
    hitbox.body.updateFromGameObject();
    this.hitboxes.add(hitbox);

    let resolvido = false;
    let timer = null;
    let overlap = null;
    const limpar = () => {
      timer?.remove(false);
      if (timer) this.timers.delete(timer);
      if (overlap?.active) overlap.destroy();
      if (overlap) this.overlaps.delete(overlap);
      if (hitbox.active) hitbox.destroy();
      this.hitboxes.delete(hitbox);
    };
    const resolver = () => {
      if (resolvido || this.cancelada || !spriteAlvo.active) return;
      resolvido = true;
      limpar();
      this.aplicarDanoSemKnock(alvo, quantidade, direcao);
      alvo.tocarAnimacao?.("dano", true);
      aoAcertar?.();
    };
    overlap = this.scene.physics.add.overlap(hitbox, alvo.grupoHurtbox, resolver);
    this.overlaps.add(overlap);
    timer = this.agendar(100, resolver);
  }

  aplicarDanoSemKnock(alvo, quantidade, direcao) {
    const danoAntes = Number.isFinite(alvo.porcentagemDano) ? alvo.porcentagemDano : 0;
    const invulneravelAntes = alvo.invulneravel;
    const tinhaPodeDefenderProprio = Object.prototype.hasOwnProperty.call(alvo, "podeDefender");
    const podeDefenderAntes = alvo.podeDefender;
    alvo.invulneravel = false;
    alvo.podeDefender = () => false;
    try {
      alvo.receberDano?.(quantidade, {
        tipoSomImpacto: "heavy",
        knockbackX: 0,
        knockbackY: 0,
        knockbackFixo: true,
        naoInterromperEstado: true,
      }, {
        atacante: this.personagem,
        direcao,
        x: this.personagem.sprite.x,
        y: this.personagem.sprite.y,
      });
    } finally {
      alvo.invulneravel = invulneravelAntes;
      if (tinhaPodeDefenderProprio) alvo.podeDefender = podeDefenderAntes;
      else delete alvo.podeDefender;
    }
    alvo.porcentagemDano = danoAntes + quantidade;
    alvo.textoDano?.setText(`${Math.floor(alvo.porcentagemDano)}%`);
  }

  tocarEfeito(chave, x, y, duracao, direcao = this.dir, origemY = 0.5) {
    if (!this.scene.textures.exists(chave)) return;
    const finais = { poseEffect: 15, dashEffect: 8 };
    const anim = `slan_ult_${chave}`;
    if (!this.scene.anims.exists(anim)) this.scene.anims.create({ key: anim, frames: this.scene.anims.generateFrameNumbers(chave, { start: 0, end: finais[chave] }), frameRate: 28, repeat: 0 });
    const ajustes = chave === "poseEffect"
      ? { x: 0, y: -10, camadas: 3 }
      : { x: 15, y: 50, camadas: 2 };
    const fx = this.scene.add.sprite(x + ajustes.x * direcao, y + ajustes.y, chave)
      .setOrigin(0.5, origemY).setScale(0.85).setDepth(this.personagem.sprite.depth + 2)
      .setFlipX(direcao < 0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(1);
    this.scene.camHUD?.ignore(fx);
    fx.play(anim);
    if (duracao) fx.anims.timeScale = fx.anims.currentAnim.duration / duracao;
    fx.once("animationcomplete", () => fx.destroy());
    this.efeitos.add(fx);
    for (let i = 1; i < ajustes.camadas; i++) {
      const reforco = this.scene.add.sprite(fx.x, fx.y, chave)
        .setOrigin(fx.originX, fx.originY).setScale(fx.scaleX, fx.scaleY)
        .setDepth(fx.depth).setFlipX(fx.flipX).setBlendMode(Phaser.BlendModes.ADD);
      this.scene.camHUD?.ignore(reforco);
      reforco.play(anim);
      if (duracao) reforco.anims.timeScale = reforco.anims.currentAnim.duration / duracao;
      fx.once("destroy", () => reforco.destroy());
    }
  }

  ativarFundoUltimate() {
    if (!this.scene.textures.exists("ultimateback1")) return;
    const fundoFase = this.scene.mapaAtual?.imagemFundo;
    this.fundoFase = fundoFase;
    this.fundoFaseVisivel = fundoFase?.visible ?? true;
    if (!this.scene.anims.exists("slender_ultimateback")) this.scene.anims.create({
      key: "slender_ultimateback",
      frames: gerarQuadrosUltimateBackground(this.scene),
      frameRate: 36,
      repeat: -1,
    });
    this.fundoUlt = this.scene.add.sprite(0, 0, "ultimateback1", 0)
      .setDepth((fundoFase?.depth ?? -100) + 1).setScrollFactor(1);
    this.fundoUlt.enableFilters();
    const filtroFundo = this.fundoUlt.filters?.internal.addColorMatrix();
    filtroFundo?.colorMatrix.set([
      0.1063, 0.3576, 0.0361, 0, 0,
      0.1063, 0.3576, 0.0361, 0, 0,
      0.1063, 0.3576, 0.0361, 0, 0,
      0, 0, 0, 1, 0,
    ]);
    this.fundoUlt.play("slender_ultimateback");
    fundoFase?.setVisible(false);
    const visuais = [
      ...(this.scene.mapaAtual?.objetosTeloes ?? []),
      this.scene.mapaAtual?.suportePlataforma,
      ...(this.scene.mapaAtual?.plataformas?.getChildren?.() ?? []),
      ...(this.scene.sistemaPlataformasAtravessaveis?.grupo?.getChildren?.() ?? []),
    ].filter(Boolean);
    this.visibilidadesCenario = visuais.map((objeto) => ({ objeto, visible: objeto.visible }));
    visuais.forEach((objeto) => objeto.setVisible(false));
    this.scene.camHUD?.ignore(this.fundoUlt);
    this.ajustarFundoNaCamera();
  }

  ajustarFundoNaCamera() {
    if (!this.fundoUlt?.active) return;
    this.fundoUlt.setPosition(this.camera.midPoint.x, this.camera.midPoint.y)
      .setDisplaySize(this.camera.width / this.camera.zoom, this.camera.height / this.camera.zoom);
  }

  restaurarFundoUltimate() {
    if (this.fundoFase?.active) this.fundoFase.setVisible(this.fundoFaseVisivel);
    this.fundoUlt?.destroy();
    this.fundoUlt = null;
    this.visibilidadesCenario.forEach(({ objeto, visible }) => {
      if (objeto?.active) objeto.setVisible(visible);
    });
    this.visibilidadesCenario = [];
  }

  restaurar() {
    const p = this.personagem.sprite;
    const alvo = this.oponente?.sprite;
    if (p?.body) { p.body.moves = this.movesSlender ?? true; p.body.setAllowGravity(true); }
    p?.setVisible(this.visivelSlender ?? true);
    if (alvo?.body) { alvo.body.moves = this.movesAlvo ?? true; alvo.body.setAllowGravity(this.gravityAlvo ?? true); }
    if (this.oponente?.maquinaEstados && this.updateAlvo) this.oponente.maquinaEstados.update = this.updateAlvo;
    this.restaurarFundoUltimate();
    this.scene.atualizarCamera = this.funcaoCameraOriginal;
    this.camera.pan(this.cameraOriginal.x, this.cameraOriginal.y, 350, "Linear");
    this.camera.zoomTo(this.zoomOriginal, 350, "Linear", false, () => {
      this.scene.atualizarCamera?.();
      this.estadoFSM.finalizarUlt();
    });
  }

  finalizar() {
    if (this.cancelada) return;
    this.cancelada = true;
    this.timers.forEach((t) => t.remove(false));
    this.timers.clear();
    this.efeitos.forEach((e) => e.destroy());
    this.efeitos.clear();
    this.overlaps.forEach((overlap) => overlap?.destroy());
    this.overlaps.clear();
    this.hitboxes.forEach((hitbox) => hitbox?.destroy());
    this.hitboxes.clear();
    this.restaurar();
  }

  cancelar() {
    if (this.cancelada) return;
    this.cancelada = true;
    this.timers.forEach((t) => t.remove(false));
    this.timers.clear();
    this.efeitos.forEach((e) => e.destroy());
    this.efeitos.clear();
    this.overlaps.forEach((overlap) => overlap?.destroy());
    this.overlaps.clear();
    this.hitboxes.forEach((hitbox) => hitbox?.destroy());
    this.hitboxes.clear();
    if (this.personagem.sprite?.body) { this.personagem.sprite.body.moves = this.movesSlender ?? true; this.personagem.sprite.body.setAllowGravity(true); }
    if (this.oponente?.sprite?.body) { this.oponente.sprite.body.moves = this.movesAlvo ?? true; this.oponente.sprite.body.setAllowGravity(this.gravityAlvo ?? true); }
    if (this.oponente?.maquinaEstados && this.updateAlvo) this.oponente.maquinaEstados.update = this.updateAlvo;
    this.personagem.sprite?.setVisible(this.visivelSlender ?? true);
    this.restaurarFundoUltimate();
    this.scene.atualizarCamera = this.funcaoCameraOriginal;
    this.camera.setZoom(this.zoomOriginal);
    this.camera.centerOn(this.cameraOriginal.x, this.cameraOriginal.y);
  }
}
