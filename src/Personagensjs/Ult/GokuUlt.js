import { gerarQuadrosUltimateBackground } from "../../Objetos/QuadrosUltimateBackground.js";
import { obterAlvosCombate, registrarAtaqueEspecial } from "../../Objetos/SistemaCombateEspecial.js";

const TEMPO_FOCO = 250;
const TEMPO_CARGA_KI = 1500;
const TEMPO_ZOOM_ARENA = 850;
const TEMPO_RETORNO_CAMERA = 600;

export default class GokuUlt {
  constructor(personagem, config, estadoFSM) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.config = config;
    this.estadoFSM = estadoFSM;
    this.camera = this.scene.cameras.main;
    this.cancelada = false;
    this.finalizando = false;
    this.finalizada = false;
    this.fase = "foco";
    this.timers = new Set();
    this.sprites = new Set();
    this.alvosAtingidos = new Set();
    this.listenersAnimacao = [];
    this.estadoAtores = [];
    this.estadoCenario = [];
    this.hitbox = null;
    this.registroAtaque = null;
    this.fundoUlt = null;
    this.efeitoGenk = null;
    this.genkidama = null;
    this.ult2Concluida = false;
    this.efeitoConcluido = false;
    this.lancouGenkidama = false;
    this.ult3Concluida = false;
    this.explosaoConcluida = false;
    this.frameUlt1Processado = new Set();
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.atualizarFrame = this.atualizarFrame.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    if (!sprite?.active || !sprite.body) {
      this.estadoFSM.finalizarUlt();
      return;
    }

    this.centroOriginal = { x: this.camera.midPoint.x, y: this.camera.midPoint.y };
    this.zoomOriginal = this.camera.zoom;
    this.atualizarCameraOriginal = this.scene.atualizarCamera;
    this.physicsPausadaAntes = this.scene.physics.world.isPaused;
    this.configAnimacaoOverrideOriginal = this.personagem.configAnimacaoOverride;
    this.gravidadeOriginal = {
      permitida: sprite.body.allowGravity,
      x: sprite.body.gravity.x,
      y: sprite.body.gravity.y,
    };
    this.scene.atualizarCamera = () => {};
    this.camera.stopFollow();
    this.congelarAtores();
    this.esconderCenario();
    this.ativarFundoUltimate();

    sprite.body.setAllowGravity(false);
    sprite.body.setVelocity(0, 0);
    sprite.body.moves = false;
    sprite.anims.play("gk_idle", true);
    sprite.anims.pause();
    this.camera.pan(sprite.x, sprite.y - 35, TEMPO_FOCO, "Power2");
    this.camera.zoomTo(this.zoomOriginal * 1.45, TEMPO_FOCO);
    this.agendar(TEMPO_FOCO, () => this.iniciarCargaKi());
  }

  atualizar() {
    if (this.cancelada || this.finalizada) return;
    this.personagem.sprite.body?.setAllowGravity(false);
    this.ajustarFundoUltimate();

    if (this.fase === "carregando") {
      const progresso = Phaser.Math.Clamp(
        (this.scene.time.now - this.inicioCargaKi) / TEMPO_CARGA_KI,
        0,
        1,
      );
      this.personagem.cargaKi = this.cargaKiInicial +
        (this.personagem.cargaKiMaxima - this.cargaKiInicial) * progresso;
      if (progresso >= 1) this.finalizarCargaKi();
    }

    if (this.genkidama?.active) {
      this.genkidama.rotation += this.scene.game.loop.delta * 0.00012;
      this.atualizarHitboxGenkidama();
    }
    if (this.efeitoGenk?.active && this.fase === "ult2") {
      const centroGenkidama = this.obterPosicaoCentroGenkidama();
      this.efeitoGenk.setPosition(centroGenkidama.x, centroGenkidama.y);
    }
    this.atualizarEfeitosCarga();
  }

  iniciarCargaKi() {
    if (this.cancelada) return;
    this.fase = "inicioCarga";
    this.personagem.configAnimacaoOverride = "doSpecial";
    this.personagem.aplicarConfiguracao("doSpecial");
    this.criarEfeitosCarga();
    this.personagem.carregandoKi = true;
    this.personagem.tocarSomSorteado("gk-carga", { volume: 0.65, detune: 0 });
    this.somCargaKi = this.scene.sound.add("ki-carga", { volume: 0.3, loop: true });
    this.somCargaKi.play();
    this.aoInicioCargaCompleto = () => {
      if (!this.cancelada && this.fase === "inicioCarga") this.iniciarCargaKiReal();
    };
    this.personagem.sprite.once("animationcomplete-gk_doSpecial_inicio", this.aoInicioCargaCompleto);
    this.personagem.sprite.play("gk_doSpecial_inicio", true);
    this.poeiraCarga.play("goku_charge_dust");
    this.poeiraCarga.once("animationcomplete-goku_charge_dust", () => this.poeiraCarga?.setVisible(false));
  }

  criarEfeitosCarga() {
    const sprite = this.personagem.sprite;
    this.auraCarga = this.scene.add.sprite(sprite.x, sprite.y, "charge_1")
      .setOrigin(0.5, 1).setScale(1.2).setDepth(sprite.depth - 1).setFlipX(sprite.flipX);
    this.poeiraCarga = this.scene.add.sprite(sprite.x, sprite.y, "charge_dust")
      .setOrigin(0.5, 1).setDepth(sprite.depth + 1).setFlipX(sprite.flipX);
    this.cargaFinal = this.scene.add.sprite(sprite.x, sprite.y, "charge_2")
      .setOrigin(0.5, 1).setScale(1.2).setDepth(sprite.depth - 1).setFlipX(sprite.flipX).setVisible(false);
    this.scene.camHUD?.ignore([this.auraCarga, this.poeiraCarga, this.cargaFinal]);
    this.sprites.add(this.auraCarga);
    this.sprites.add(this.poeiraCarga);
    this.sprites.add(this.cargaFinal);
  }

  atualizarEfeitosCarga() {
    const sprite = this.personagem.sprite;
    [this.auraCarga, this.poeiraCarga, this.cargaFinal].forEach((efeito) => {
      if (efeito?.active) efeito.setPosition(sprite.x, sprite.y).setFlipX(sprite.flipX);
    });
  }

  iniciarCargaKiReal() {
    this.fase = "carregando";
    this.cargaKiInicial = this.personagem.cargaKi ?? 0;
    this.inicioCargaKi = this.scene.time.now;
    this.auraCarga.play("goku_charge_inicio");
    this.auraCarga.once("animationcomplete-goku_charge_inicio", () => {
      if (!this.cancelada && this.fase === "carregando") this.auraCarga.play("goku_charge_loop");
    });
    this.personagem.sprite.play("gk_doSpecial_loop", true);
  }

  finalizarCargaKi() {
    this.personagem.cargaKi = this.personagem.cargaKiMaxima;
    this.personagem.carregandoKi = false;
    this.fase = "finalizandoCarga";
    this.iniciarZoomArena();
    this.auraCarga?.setVisible(false);
    this.cargaFinal?.setVisible(true).play("goku_charge_fim");
    this.cargaFinal?.once("animationcomplete-goku_charge_fim", () => {
      if (!this.cancelada && this.fase === "finalizandoCarga") this.iniciarSequencia();
    });
  }

  iniciarSequencia() {
    if (this.cancelada || this.fase !== "finalizandoCarga") return;
    this.personagem.cargaKi = this.personagem.cargaKiMaxima;
    this.personagem.carregandoKi = false;
    this.fase = "ult0";
    this.limparEfeitosCarga();
    this.somCargaKi?.stop();
    this.somCargaKi?.destroy();
    this.somCargaKi = null;
    this.restaurarConfiguracaoAnimacao();
    this.personagem.sprite.body.moves = true;
    this.tocarAnimacao("goku_ult0", () => this.iniciarUlt1());
  }

  iniciarUlt1() {
    if (this.cancelada) return;
    this.fase = "ult1";
    this.frameUlt1Processado.clear();
    this.personagem.sprite.setVelocity(0, 0);
    this.adicionarListenerAnimacao("animationupdate", this.atualizarFrame);
    this.adicionarListenerAnimacao("animationcomplete-goku_ult1", () => {
      this.personagem.sprite.setVelocityX(0);
      this.removerListenerFrame();
      this.iniciarUlt2();
    });
    this.personagem.sprite.anims.play("goku_ult1", true);
  }

  atualizarFrame(animacao, frame) {
    if (this.cancelada || animacao?.key !== "goku_ult1") return;
    const quadro = Number(frame?.textureFrame);
    if (this.frameUlt1Processado.has(quadro)) return;
    this.frameUlt1Processado.add(quadro);
    if (quadro === 0) {
      this.personagem.tocarSomSorteado(this.personagem.sons?.dash, { volume: 0.4 });
      this.personagem.sprite.setVelocityX(-this.direcao * 500);
    } else if (quadro === 3 || quadro === 6) {
      this.personagem.tocarSomSorteado(this.personagem.sons?.dash, { volume: 0.4 });
      this.personagem.sprite.setVelocityX(-this.direcao * 850);
    } else if (quadro === 8) {
      this.personagem.sprite.setVelocityX(0);
    }
  }

  iniciarUlt2() {
    if (this.cancelada) return;
    this.fase = "ult2";
    const sprite = this.personagem.sprite;
    sprite.setVelocity(0, 0);
    sprite.body.moves = false;
    sprite.anims.play("goku_ult2", true);
    this.personagem.tocarSomSorteado(this.personagem.sons?.pulo, { volume: 0.4 });
    this.personagem.tocarSomSorteado("força", { volume: 0.45, detune: 0 });
    this.personagem.tocarSomSorteado("genk", { volume: 0.45, detune: 0 });
    this.ult2Concluida = false;
    this.efeitoConcluido = false;

    const centroGenkidama = this.obterPosicaoCentroGenkidama();
    this.efeitoGenk = this.scene.add.sprite(centroGenkidama.x, centroGenkidama.y, "genk-e", 23)
      .setOrigin(0.5, 0.5)
      .setRotation(0)
      .setScale(3)
      .setDepth(sprite.depth + 2);
    this.sprites.add(this.efeitoGenk);
    this.scene.camHUD?.ignore(this.efeitoGenk);
    this.efeitoGenk.once("animationcomplete-goku_genk_e_reverso", () => {
      this.efeitoConcluido = true;
      this.verificarFimCarregamentoEsfera();
    });
    this.efeitoGenk.play("goku_genk_e_reverso");

    this.adicionarListenerAnimacao("animationcomplete-goku_ult2", () => {
      this.ult2Concluida = true;
      this.verificarFimCarregamentoEsfera();
    });

    const limites = this.scene.mapaAtual?.configCamera?.limites;
    const destinoY = limites
      ? limites.y + limites.altura / 2
      : this.scene.limitesArena.minY +
        (this.scene.limitesArena.maxY - this.scene.limitesArena.minY) / 2;
    this.scene.tweens.add({
      targets: sprite,
      x: sprite.x - this.direcao * 90,
      y: destinoY,
      duration: 650,
      ease: "Cubic.easeOut",
      onUpdate: () => sprite.body.updateFromGameObject(),
      onComplete: () => {
        sprite.body.updateFromGameObject();
        sprite.body.prev.copy(sprite.body.position);
        sprite.body.prevFrame.copy(sprite.body.position);
        sprite.body.autoFrame?.copy(sprite.body.position);
        sprite.body.moves = true;
      },
    });
  }

  verificarFimCarregamentoEsfera() {
    if (!this.ult2Concluida || !this.efeitoConcluido || this.cancelada || this.genkidama) return;
    this.efeitoGenk?.destroy();
    this.efeitoGenk = null;
    const centroGenkidama = this.obterPosicaoCentroGenkidama();
    this.genkidama = this.scene.add.sprite(centroGenkidama.x, centroGenkidama.y, "genk", 0)
      .setScale(0.16)
      .setDepth(this.personagem.sprite.depth + 2);
    this.genkidama.setOrigin(0.5, 0.5);
    this.genkidama.play("goku_genk");
    this.sprites.add(this.genkidama);
    this.scene.camHUD?.ignore(this.genkidama);
    this.scene.tweens.add({
      targets: this.genkidama,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 1700,
      ease: "Cubic.easeOut",
      onComplete: () => this.iniciarUlt3(),
    });
  }

  iniciarUlt3() {
    if (this.cancelada) return;
    this.fase = "ult3";
    this.personagem.tocarSomSorteado("final", { volume: 0.5, detune: 0 });
    this.personagem.sprite.anims.play("goku_ult3", true);
    this.adicionarListenerAnimacao("animationupdate", (animacao, frame) => {
      if (animacao?.key === "goku_ult3" && Number(frame?.textureFrame) >= 3) {
        this.lancarGenkidama();
      }
    });
    this.adicionarListenerAnimacao("animationcomplete-goku_ult3", () => {
      this.ult3Concluida = true;
      this.verificarFimUlt();
    });
  }

  lancarGenkidama() {
    if (this.lancouGenkidama || this.cancelada || !this.genkidama?.active) return;
    this.lancouGenkidama = true;
    this.personagem.tocarSomSorteado("genk-impact", { volume: 0.5, detune: 0 });
    this.fase = "queda";
    const limites = this.scene.mapaAtual?.configCamera?.limites;
    const destinoX = Phaser.Math.Clamp(
      this.personagem.sprite.x + this.direcao * 450,
      limites?.x ?? -Infinity,
      limites ? limites.x + limites.largura : Infinity,
    );
    const chaoY = this.obterAlturaChao(destinoX, this.genkidama.y);
    this.scene.tweens.add({
      targets: this.genkidama,
      x: destinoX,
      y: chaoY,
      duration: 1100,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (this.cancelada || !this.genkidama?.active) return;
        this.genkidama.setPosition(destinoX, chaoY).setDepth(this.personagem.sprite.depth + 1);
        this.criarHitbox(destinoX, chaoY);
        this.fase = "impacto";
        this.agendar(500, () => this.explodirGenkidama(chaoY));
      },
    });
  }

  explodirGenkidama(chaoY) {
    if (this.cancelada || !this.genkidama?.active) return;
    this.fase = "explosao";
    this.camera.flash(900, 255, 255, 255);
    this.camera.shake(350, 0.006);
    const explosao = this.scene.add.sprite(this.genkidama.x, chaoY, "genk-e", 23)
      .setScale(1.6)
      .setDepth(this.genkidama.depth + 1);
    this.sprites.add(explosao);
    this.scene.camHUD?.ignore(explosao);
    explosao.play("goku_genk_e_explosao");
    this.scene.tweens.add({
      targets: this.genkidama,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 1400,
      ease: "Cubic.easeOut",
      onComplete: () => this.genkidama?.destroy(),
    });
    this.scene.tweens.add({
      targets: explosao,
      scaleX: 7.5,
      scaleY: 7.5,
      alpha: 0,
      duration: 1200,
      ease: "Cubic.easeOut",
      onComplete: () => {
        explosao.destroy();
        this.sprites.delete(explosao);
      },
    });
    this.agendar(1400, () => {
      this.explosaoConcluida = true;
      this.verificarFimUlt();
    });
  }

  criarHitbox(centroX, centroY) {
    const largura = Math.max(1, this.genkidama.displayWidth * 0.68);
    const altura = Math.max(1, this.genkidama.displayHeight * 0.68);
    this.hitbox = this.scene.add.zone(
      this.genkidama.x ?? centroX,
      this.genkidama.y ?? centroY,
      largura,
      altura,
    );
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.registroAtaque = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.atingirAlvo(alvo, centroX, centroY),
    });
    this.atualizarHitboxGenkidama();
  }

  atualizarHitboxGenkidama() {
    if (!this.hitbox?.active || !this.hitbox.body) return;
    if (!this.genkidama?.active) return;
    const largura = Math.max(1, this.genkidama.displayWidth * 0.68);
    const altura = Math.max(1, this.genkidama.displayHeight * 0.68);
    this.hitbox.setPosition(this.genkidama.x, this.genkidama.y);
    this.hitbox.setSize(largura, altura);
    this.hitbox.body.setSize(largura, altura);
    this.hitbox.body.updateFromGameObject();
  }

  atingirAlvo(alvo, centroX, centroY) {
    if (this.alvosAtingidos.has(alvo) || alvo.invulneravel) return;
    this.alvosAtingidos.add(alvo);
    alvo.receberDano(this.config.dano, this.config.propriedades, {
      direcao: alvo.sprite.x < centroX ? -1 : 1,
      x: centroX,
      y: centroY,
      atacante: this.personagem,
    });
  }

  iniciarZoomArena() {
    if (this.zoomArenaIniciado) return;
    this.zoomArenaIniciado = true;
    const limites = this.scene.mapaAtual?.configCamera?.limites;
    const margem = 70 * (this.scene.scale.width / 1920);
    const zoomMapa = limites
      ? Math.min(
          (this.camera.width - margem * 2) / limites.largura,
          (this.camera.height - margem * 2) / limites.altura,
        ) * 1.45
      : this.zoomOriginal * 0.65;
    const x = limites ? limites.x + limites.largura / 2 : this.personagem.sprite.x;
    const y = limites ? limites.y + limites.altura / 2 : this.personagem.sprite.y;
    if (this.fundoUlt?.active) {
      this.scene.tweens.add({ targets: this.fundoUlt, alpha: 0, duration: TEMPO_ZOOM_ARENA });
    }
    this.restaurarCenario();
    this.camera.pan(x, y, TEMPO_ZOOM_ARENA, "Cubic.easeInOut");
    this.camera.zoomTo(zoomMapa, TEMPO_ZOOM_ARENA);
    this.agendar(TEMPO_ZOOM_ARENA, () => {
      this.fundoUlt?.destroy();
      this.fundoUlt = null;
      this.restaurarAtores();
      this.retomarFisica();
    });
  }

  obterPosicaoMaos() {
    const sprite = this.personagem.sprite;
    return {
      x: sprite.x + this.direcao * 8,
      y: sprite.y - 145,
    };
  }

  obterPosicaoCentroGenkidama() {
    const maos = this.obterPosicaoMaos();
    const alturaQuadroGenkidama = 678;
    const escalaFinalGenkidama = 1.15;
    return {
      x: maos.x,
      y: maos.y - (alturaQuadroGenkidama * escalaFinalGenkidama) / 2,
    };
  }

  obterAlturaChao(x, yOrigem) {
    const plataformas = this.scene.mapaAtual?.plataformas?.getChildren?.() ?? [];
    const abaixo = plataformas
      .map((plataforma) => ({
        topo: plataforma.body?.top,
        esquerda: plataforma.body?.left,
        direita: plataforma.body?.right,
      }))
      .filter((plataforma) => Number.isFinite(plataforma.topo) && plataforma.topo > yOrigem);
    const sobEsfera = abaixo
      .filter((plataforma) => x >= plataforma.esquerda && x <= plataforma.direita)
      .sort((a, b) => a.topo - b.topo)[0];
    if (sobEsfera) return sobEsfera.topo;
    const maisProxima = abaixo.sort((a, b) => {
      const distA = x < a.esquerda ? a.esquerda - x : x > a.direita ? x - a.direita : 0;
      const distB = x < b.esquerda ? b.esquerda - x : x > b.direita ? x - b.direita : 0;
      return distA - distB || a.topo - b.topo;
    })[0];
    return maisProxima?.topo ?? this.scene.limitesArena.maxY;
  }

  congelarAtores() {
    const atores = [
      this.scene.jogador1,
      this.scene.jogador2,
      this.scene.jogador3,
      this.scene.jogador4,
      this.scene.boss,
    ].filter((ator, indice, lista) => ator && ator !== this.personagem && lista.indexOf(ator) === indice);
    atores.forEach((ator) => {
      const sprite = ator.sprite;
      this.estadoAtores.push({
        ator,
        moves: sprite?.body?.moves,
        velocityX: sprite?.body?.velocity.x ?? 0,
        velocityY: sprite?.body?.velocity.y ?? 0,
        animacaoPausada: sprite?.anims?.isPaused ?? false,
        updateFSM: ator.maquinaEstados?.update,
      });
      sprite?.body?.setVelocity(0, 0);
      if (sprite?.body) sprite.body.moves = false;
      sprite?.anims?.pause();
      if (ator.maquinaEstados) ator.maquinaEstados.update = () => {};
    });
    if (!this.physicsPausadaAntes) this.scene.physics.pause();
  }

  restaurarAtores() {
    this.estadoAtores.forEach(({ ator, moves, velocityX, velocityY, animacaoPausada, updateFSM }) => {
      const sprite = ator.sprite;
      if (sprite?.body) {
        sprite.body.moves = moves;
        sprite.body.setVelocity(velocityX, velocityY);
      }
      if (ator.maquinaEstados) ator.maquinaEstados.update = updateFSM;
      if (!animacaoPausada) sprite?.anims?.resume();
    });
    this.estadoAtores = [];
  }

  esconderCenario() {
    const mapa = this.scene.mapaAtual;
    const visuais = [
      mapa?.imagemFundo,
      ...(mapa?.objetosTeloes ?? []),
      mapa?.suportePlataforma,
      ...(mapa?.plataformas?.getChildren?.() ?? []),
      ...(this.scene.sistemaPlataformasAtravessaveis?.grupo?.getChildren?.() ?? []),
    ].filter(Boolean);
    visuais.forEach((objeto) => {
      this.estadoCenario.push({ objeto, visible: objeto.visible });
      objeto.setVisible(false);
    });
  }

  restaurarCenario() {
    this.estadoCenario.forEach(({ objeto, visible }) => {
      if (objeto?.active) objeto.setVisible(visible);
    });
    this.estadoCenario = [];
  }

  ativarFundoUltimate() {
    if (!this.scene.textures.exists("ultimateback1")) return;
    if (!this.scene.anims.exists("goku_ultimateback")) {
      this.scene.anims.create({
        key: "goku_ultimateback",
        frames: gerarQuadrosUltimateBackground(this.scene),
        frameRate: 36,
        repeat: -1,
      });
    }
    this.fundoUlt = this.scene.add.sprite(0, 0, "ultimateback1", 0)
      .setDepth(-90)
      .setScrollFactor(1);
    this.fundoUlt.play("goku_ultimateback");
    this.ajustarFundoUltimate();
    this.scene.camHUD?.ignore(this.fundoUlt);
  }

  ajustarFundoUltimate() {
    if (!this.fundoUlt?.active) return;
    this.fundoUlt.setPosition(this.camera.midPoint.x, this.camera.midPoint.y)
      .setDisplaySize(this.camera.width / this.camera.zoom, this.camera.height / this.camera.zoom);
  }

  retomarFisica() {
    if (!this.physicsPausadaAntes && this.scene.physics.world.isPaused) this.scene.physics.resume();
  }

  tocarAnimacao(chave, callback) {
    const sprite = this.personagem.sprite;
    const evento = `animationcomplete-${chave}`;
    const listener = () => callback();
    this.adicionarListenerAnimacao(evento, listener);
    sprite.anims.play(chave, true);
  }

  adicionarListenerAnimacao(evento, listener) {
    this.personagem.sprite.on(evento, listener);
    this.listenersAnimacao.push({ evento, listener });
  }

  removerListenerFrame() {
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.atualizarFrame);
    this.listenersAnimacao = this.listenersAnimacao.filter(
      ({ evento, listener }) => !(evento === "animationupdate" && listener === this.atualizarFrame),
    );
  }

  agendar(duracao, callback) {
    let timer;
    timer = this.scene.time.delayedCall(duracao, () => {
      this.timers.delete(timer);
      if (!this.cancelada && !this.finalizada) callback();
    });
    this.timers.add(timer);
    return timer;
  }

  verificarFimUlt() {
    if (!this.ult3Concluida || !this.explosaoConcluida || this.finalizando || this.cancelada) return;
    this.finalizando = true;
    this.removerListenersAnimacao();
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
    this.restaurarCenario();
    this.restaurarAtores();
    this.retomarFisica();
    this.camera.pan(this.centroOriginal.x, this.centroOriginal.y, TEMPO_RETORNO_CAMERA, "Cubic.easeInOut");
    this.camera.zoomTo(this.zoomOriginal, TEMPO_RETORNO_CAMERA);
    this.agendar(TEMPO_RETORNO_CAMERA, () => {
      this.scene.atualizarCamera = this.atualizarCameraOriginal;
      this.scene.atualizarCamera?.();
      this.limparSprites();
      this.restaurarCorpoGoku();
      this.finalizada = true;
      this.estadoFSM.finalizarUlt();
    });
  }

  restaurarCorpoGoku() {
    const body = this.personagem.sprite?.body;
    if (body) {
      body.moves = true;
      body.setAllowGravity(this.gravidadeOriginal?.permitida ?? true);
      body.setGravity(this.gravidadeOriginal?.x ?? 0, this.gravidadeOriginal?.y ?? 0);
      body.setVelocity(0, 0);
      body.updateFromGameObject();
      body.prev.copy(body.position);
      body.prevFrame.copy(body.position);
      body.autoFrame?.copy(body.position);
    }
    this.restaurarConfiguracaoAnimacao();
  }

  restaurarConfiguracaoAnimacao() {
    this.personagem.configAnimacaoOverride = this.configAnimacaoOverrideOriginal ?? null;
    this.personagem.aplicarConfiguracao(
      this.configAnimacaoOverrideOriginal ??
        this.personagem.sprite?.anims?.currentAnim?.key?.replace(this.personagem.prefixoAnim, ""),
    );
  }

  limparSprites() {
    this.sprites.forEach((sprite) => {
      if (sprite?.active) {
        this.scene.tweens.killTweensOf(sprite);
        sprite.destroy();
      }
    });
    this.sprites.clear();
    this.fundoUlt?.destroy();
    this.fundoUlt = null;
  }

  limparEfeitosCarga() {
    this.personagem.carregandoKi = false;
    [this.auraCarga, this.poeiraCarga, this.cargaFinal].forEach((sprite) => {
      sprite?.destroy();
      this.sprites.delete(sprite);
    });
    this.auraCarga = null;
    this.poeiraCarga = null;
    this.cargaFinal = null;
  }

  removerListenersAnimacao() {
    this.listenersAnimacao.forEach(({ evento, listener }) => {
      this.personagem.sprite?.off(evento, listener);
    });
    this.listenersAnimacao = [];
  }

  cancelar() {
    if (this.cancelada || this.finalizada) return;
    this.cancelada = true;
    this.timers.forEach((timer) => timer.remove(false));
    this.timers.clear();
    this.removerListenersAnimacao();
    this.removerListenerFrame();
    this.scene.tweens.killTweensOf(this.personagem.sprite);
    this.personagem.sprite?.off("animationcomplete-gk_doSpecial_inicio", this.aoInicioCargaCompleto);
    this.limparEfeitosCarga();
    this.somCargaKi?.stop();
    this.somCargaKi?.destroy();
    this.somCargaKi = null;
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
    this.restaurarCenario();
    this.restaurarAtores();
    this.retomarFisica();
    this.scene.tweens.killTweensOf(this.camera);
    this.camera.resetFX();
    this.limparSprites();
    this.camera.stopFollow();
    this.camera.setZoom(this.zoomOriginal ?? this.camera.zoom);
    if (this.centroOriginal) this.camera.centerOn(this.centroOriginal.x, this.centroOriginal.y);
    this.scene.atualizarCamera = this.atualizarCameraOriginal;
    this.restaurarCorpoGoku();
  }
}

GokuUlt.configuracao = {
  animacao: "gk_idle",
  logica: GokuUlt,
  dano: 80,
  propriedades: {
    tipoSomImpacto: "heavy",
    knockbackX: 1500,
    knockbackY: -1300,
    knockbackFixo: false,
    tumbling: true,
  },
};
