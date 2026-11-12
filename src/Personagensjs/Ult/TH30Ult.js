import { obterAlvosCombate } from "../../Objetos/SistemaCombateEspecial.js";
import { gerarQuadrosUltimateBackground } from "../../Objetos/QuadrosUltimateBackground.js";
import BotController from "../../Objetos/BotController.js";
import TH30_IA from "../../Objetos/TH30_IA.js";
import GokuKaioken from "../Specials/Goku/Kaioken.js";

const CAMPOS_COPIADOS = [
  "nomePersonagem", "prefixoAnim", "configAnimacoes", "golpes", "specials",
  "ult", "velocidade", "forcaPulo", "maxPulos", "maxDash", "sons",
  "acertosSpecialStun", "cargaKi", "cargaKiMaxima", "kaioken",
  "kaiokenAtivo", "kaiokenDisponivelEm", "tempoCargaKi", "sequenciaKiBall",
  "ultimaKiBallAte", "cooldownKiBallAte", "cooldownKamehamehaAte", "carregandoKi",
];
const METODOS_COPIADOS = [
  "aplicarDanoSpecialStun", "obterIndicadorHabilidade", "update",
  "adicionarCargaKiPorDano", "aplicarBonusDanoKaioken", "iniciarCooldownSpecial",
  "podeUsarSpecial", "registrarUsoSpecialAereo", "registrarUsoNeutroAereoConfirmado",
  "consumirCargaKi",
];

export default class TH30Ult {
  constructor(personagem, _config, estadoFSM) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.estadoFSM = estadoFSM;
    this.alvo = this.obterAlvo();
    this.camera = this.scene.cameras.main;
    this.cameraOriginal = { x: this.camera.scrollX, y: this.camera.scrollY, zoom: this.camera.zoom };
    this.atualizarCameraOriginal = this.scene.atualizarCamera;
    this.visibilidadeCenario = [];
    this.finalizada = false;
    this.efeitoPoseUlt = null;
  }

  obterAlvo() {
    const candidatos = [
      ...obterAlvosCombate(this.personagem),
      ...(this.scene.participantes ?? []).map(({ jogador }) => jogador),
      this.scene.jogador1,
      this.scene.jogador2,
      this.scene.jogador3,
      this.scene.jogador4,
      this.scene.boss,
    ];
    return [...new Set(candidatos)]
      .filter((alvo) => alvo && alvo !== this.personagem && !alvo.eliminado &&
        alvo.sprite?.active && alvo.maquinaEstados)
      .sort((a, b) => Math.abs(a.sprite.x - this.personagem.sprite.x) -
        Math.abs(b.sprite.x - this.personagem.sprite.x))[0] ?? null;
  }

  cancelarSemAlvo() {
    this.personagem.ultCarga = this.personagem.ultCargaMax;
    this.finalizarUlt();
  }

  executar() {
    this.alvo = this.obterAlvo();
    if (!this.alvo) return this.cancelarSemAlvo();
    const sprite = this.personagem.sprite;
    this.scene.atualizarCamera = () => {};
    this.camera.stopFollow();
    this.ocultarCenario();
    this.ativarFundoUltimate();
    this.physicsPausadaAntes = this.scene.physics.world.isPaused;
    this.scene.physics.pause();
    this.estadoAlvo = {
      update: this.alvo.maquinaEstados.update,
      animacaoPausada: this.alvo.sprite.anims.isPaused,
      velocityX: this.alvo.sprite.body.velocity.x,
      velocityY: this.alvo.sprite.body.velocity.y,
    };
    this.alvo.maquinaEstados.update = () => {};
    this.alvo.sprite.anims.pause();
    this.animsPausadas = sprite.anims.isPaused;
    sprite.setVelocity(0, 0);
    sprite.body.setAllowGravity(false);
    sprite.anims.stop();
    sprite.anims.play("th_taunt", true);
    this.personagem.tocarSomSorteado("th-taunt", { volume: 0.4, detune: 0 });
    this.iniciarEfeitoPose();
    this.camera.pan(sprite.x, sprite.y - 55, 300, "Power2");
    this.camera.zoomTo(this.cameraOriginal.zoom * 1.4, 300);
    this.timerPose = this.scene.time.delayedCall(750, () => {
      if (this.finalizada) return;
      sprite.anims.pause();
      this.timerPose = this.scene.time.delayedCall(450, () => this.iniciarDive());
    });
  }

  iniciarEfeitoPose() {
    const sprite = this.personagem.sprite;
    this.limparEfeitoPose();
    this.efeitoPoseUlt = this.scene.add.sprite(sprite.x + 15, sprite.y - 75, "ult_f1")
      .setOrigin(0.5, 0.5)
      .setScale(0.9)
      .setDepth(sprite.depth - 1);
    this.scene.camHUD?.ignore(this.efeitoPoseUlt);
    this.efeitoPoseUlt.once("animationcomplete-th_ult_f1", () => {
      if (!this.efeitoPoseUlt?.active || this.finalizada) return;
      this.efeitoPoseUlt.setTexture("ult_f2");
      this.efeitoPoseUlt.play("th_ult_f2");
      this.efeitoPoseUlt.once("animationcomplete-th_ult_f2", () => this.limparEfeitoPose());
    });
    this.efeitoPoseUlt.play("th_ult_f1");
  }

  limparEfeitoPose() {
    this.efeitoPoseUlt?.destroy();
    this.efeitoPoseUlt = null;
  }

  ativarFundoUltimate() {
    const texturasFundo = ["ultimateback1", "ultimateback2", "ultimateback3", "ultimateback4"];
    if (texturasFundo.some((textura) => !this.scene.textures.exists(textura))) return;
    const fundoFase = this.scene.mapaAtual?.imagemFundo;
    this.fundoFase = fundoFase;
    const visibilidadeOriginal = this.visibilidadeCenario
      .find(({ objeto }) => objeto === fundoFase)?.visible;
    this.fundoFaseVisivel = visibilidadeOriginal ?? fundoFase?.visible ?? true;
    if (!this.scene.anims.exists("th30_ultimateback")) {
      const frames = gerarQuadrosUltimateBackground(this.scene);
      if (frames.length === 0) return;
      this.scene.anims.create({
        key: "th30_ultimateback",
        frames,
        frameRate: 36,
        repeat: -1,
      });
    }
    this.fundoUlt = this.scene.add.sprite(0, 0, "ultimateback1", 0)
      .setDepth((fundoFase?.depth ?? -100) + 1).setScrollFactor(1);
    this.fundoUlt.play("th30_ultimateback");
    this.scene.camHUD?.ignore(this.fundoUlt);
    this.ajustarFundoUltimate();
    fundoFase?.setVisible(false);
  }

  ajustarFundoUltimate() {
    if (!this.fundoUlt?.active) return;
    this.fundoUlt.setPosition(this.camera.midPoint.x, this.camera.midPoint.y)
      .setDisplaySize(this.camera.width / this.camera.zoom, this.camera.height / this.camera.zoom);
  }

  ocultarCenario() {
    const objetos = [
      ...(this.scene.mapaAtual?.objetosTeloes ?? []),
      ...(this.scene.mapaAtual?.fundos ?? []),
      this.scene.mapaAtual?.imagemPlataforma,
      this.scene.mapaAtual?.suportePlataforma,
      ...(this.scene.mapaAtual?.plataformas?.getChildren?.() ?? []),
      ...(this.scene.sistemaPlataformasAtravessaveis?.grupo?.getChildren?.() ?? []),
    ].filter(Boolean);
    this.visibilidadeCenario = objetos.map((objeto) => ({ objeto, visible: objeto.visible }));
    objetos.forEach((objeto) => objeto.setVisible(false));
  }

  iniciarDive() {
    if (this.finalizada) return;
    this.liberarPose();
    this.restaurarCamera();
    const sprite = this.personagem.sprite;
    this.personagem.tocarSomSorteado("th-ult", { volume: 0.4, detune: 0 });
    sprite.anims.play("th_dive", true);
    const duracao = this.scene.anims.get("th_dive")?.duration || 450;
    this.timerDive = this.scene.time.delayedCall(duracao, () => this.transformar());
  }

  transformar() {
    if (this.finalizada) return;
    this.alvo = this.obterAlvo();
    if (!this.alvo) return this.cancelarSemAlvo();
    if (this.alvo.nomePersonagem === "TH30") {
      this.limparCenarioUltimate();
      this.criarCloneTH30();
      this.finalizarUlt();
      return;
    }
    const personagem = this.personagem;
    this.limparCenarioUltimate();
    this.camposOriginais = Object.fromEntries(CAMPOS_COPIADOS.map((campo) => [campo, personagem[campo]]));
    this.ultEstaCarregadaOriginal = personagem.ultEstaCarregada;
    this.spriteOriginal = { textura: personagem.sprite.texture.key, frame: personagem.sprite.frame.name };
    this.escalaOriginal = { x: personagem.sprite.scaleX, y: personagem.sprite.scaleY };
    this.metodosOriginais = new Map(METODOS_COPIADOS.map((metodo) => [
      metodo,
      Object.getOwnPropertyDescriptor(personagem, metodo),
    ]));
    const escalaConfigurada = this.alvo.configAnimacoes?.idle?.escala;
    const escalaAlvo = escalaConfigurada
      ? { x: escalaConfigurada, y: escalaConfigurada }
      : { x: this.alvo.sprite.scaleX, y: this.alvo.sprite.scaleY };
    for (const campo of CAMPOS_COPIADOS) personagem[campo] = this.alvo[campo];
    for (const metodo of METODOS_COPIADOS) {
      if (this.alvo.nomePersonagem !== "Goku" &&
          !["aplicarDanoSpecialStun", "obterIndicadorHabilidade"].includes(metodo)) continue;
      if (typeof this.alvo[metodo] === "function") {
        personagem[metodo] = this.alvo[metodo].bind(personagem);
      }
    }
    if (this.alvo.nomePersonagem === "Goku") {
      personagem.kaioken = new GokuKaioken(personagem);
      personagem.kaiokenAtivo = false;
      this.adicionarBarraKiHud();
    }
    personagem.sprite.setScale(escalaAlvo.x, escalaAlvo.y);
    personagem.sprite.setTint(0x399cff);
    personagem.ultCarga = personagem.ultCargaMax * 0.9;
    personagem.ultEstaCarregada = () => personagem.ultCarga >= personagem.ultCargaMax * 0.9;
    personagem.transformacaoTH30 = this;
    personagem.podeMover = true;
    personagem.podeAtacar = true;
    const sprite = personagem.sprite;
    const destinoY = sprite.y;
    const origemY = destinoY + 105 * escalaAlvo.y;
    sprite.setY(origemY);
    sprite.body.updateFromGameObject();
    sprite.body.setVelocity(0, 0);
    sprite.body.setAllowGravity(false);
    personagem.aplicarConfiguracao("idle");
    personagem.sprite.anims.play(`${personagem.prefixoAnim}idle`, true);
    personagem.sprite.setTint(0x399cff);
    this.transformacaoAtiva = true;
    this.tweenEmergencia = this.scene.tweens.add({
      targets: sprite,
      y: destinoY,
      duration: 500,
      ease: "Cubic.easeOut",
      onUpdate: () => sprite.body.updateFromGameObject(),
      onComplete: () => {
        if (!this.camposOriginais || this.finalizada) return;
        sprite.body.setAllowGravity(true);
        personagem.podeMover = true;
        personagem.podeAtacar = true;
        this.timerForma = this.scene.time.delayedCall(30000, () => this.restaurarForma());
        this.estadoFSM.finalizarUlt();
      },
    });
  }

  adicionarBarraKiHud() {
    const cena = this.scene;
    const jogador = this.personagem;
    const entrada = cena.participantes?.find(({ jogador: participante }) => participante === jogador);
    const hud = entrada?.hud ?? (jogador === cena.jogador1 ? cena.hudP1_Nome :
      jogador === cena.jogador2 ? cena.hudP2_Nome : null);
    if (!hud || hud.barraKi || !cena.textures.exists("Gk_portrait-bar")) return;
    const barra = cena.add.image(0, 0, "Gk_portrait-bar", 0)
      .setOrigin(hud.retrato?.originX ?? 0, hud.retrato?.originY ?? 0)
      .setDisplaySize(hud.retrato?.displayWidth ?? 440, hud.retrato?.displayHeight ?? 357.5);
    hud.add(barra);
    hud.barraKi = barra;
    hud.frameKiAtual = -1;
    this.barraKiHudTemporaria = { hud, barra };
  }

  criarCloneTH30() {
    const cena = this.scene;
    const personagem = this.personagem;
    if (this.alvo?.nomePersonagem === "TH30" && cena.scene?.key === "CenaHistoria4") {
      const texto = cena.add.text(cena.scale.width / 2, cena.scale.height * 0.18,
        "Você não pode copiar o poder de um verdadeiro Deus", {
          fontFamily: "RetroFont, monospace", fontSize: `${32 * cena.scale.width / 1920}px`,
          color: "#ffffff", stroke: "#000000", strokeThickness: 6, align: "center",
        }).setOrigin(0.5).setScrollFactor(0).setDepth(3000);
      cena.time.delayedCall(2500, () => texto.destroy());
    }
    const controle = new BotController(cena);
    const clone = cena.criarPersonagem("TH30", personagem.sprite.x + (personagem.sprite.flipX ? -75 : 75),
      personagem.sprite.y, controle.teclas, 0, 0, controle);
    clone.controle = null;
    clone.donoClone = personagem;
    clone.vidas = 1;
    clone.eliminado = false;
    clone.cloneTH30 = true;
    clone.podeUsarUlt = () => false;
    const cerebro = new TH30_IA(controle);
    controle.setCerebro(cerebro);
    controle.bot = clone;
    cena.sistemaPlataformasAtravessaveis?.registrar(clone, false);
    cena.physics.add.collider(clone.sprite, cena.mapaAtual.plataformas);
    const entrada = { jogador: clone, escolha: "TH30", vidas: null, cloneTH30: true,
      spawn: { x: clone.sprite.x, y: clone.sprite.y }, rotulo: "CLONE", controle, cerebro };
    (cena.alvosAtaqueExtras ??= []).push(clone);
    cena.camHUD?.ignore([clone.sprite, clone.grupoHurtbox, clone.textoDano].filter(Boolean));
    entrada.atualizar = (time, delta) => {
      if (!clone.sprite.active || clone.eliminado) return;
      controle.update(time, delta);
      clone.atualizarCargaUlt(delta);
      clone.update();
      clone.maquinaEstados.estados.atack?.verificarAcertoManual?.();
      const arena = cena.limitesArena;
      if (arena && (clone.sprite.x < arena.minX || clone.sprite.x > arena.maxX ||
          clone.sprite.y < arena.minY || clone.sprite.y > arena.maxY)) this.removerCloneTH30(entrada);
    };
    cena.events.on("update", entrada.atualizar);
    entrada.timerDesaparecer = cena.time.delayedCall(20000, () => this.removerCloneTH30(entrada));
    clone.aoMorrerCloneTH30 = () => this.removerCloneTH30(entrada);
  }

  removerCloneTH30(entrada) {
    if (!entrada) return;
    entrada.timerDesaparecer?.remove();
    this.scene.events.off("update", entrada.atualizar);
    this.scene.sistemaPlataformasAtravessaveis?.desregistrar(entrada.jogador);
    entrada.jogador.eliminado = true;
    entrada.jogador.sprite.destroy();
    this.scene.alvosAtaqueExtras = (this.scene.alvosAtaqueExtras ?? []).filter((alvo) => alvo !== entrada.jogador);
  }

  atualizar() {
    this.ajustarFundoUltimate();
    if (!this.camposOriginais) return;
    if (this.transformacaoAtiva) this.personagem.sprite.setTint(0x399cff);
  }

  restaurarForma() {
    if (!this.camposOriginais) return;
    this.tweenEmergencia?.stop();
    this.timerForma?.remove();
    const personagem = this.personagem;
    const cargaRestante = personagem.ultCarga > 0;
    personagem.kaioken?.encerrar?.();
    this.barraKiHudTemporaria?.barra?.destroy();
    if (this.barraKiHudTemporaria?.hud) {
      this.barraKiHudTemporaria.hud.barraKi = null;
      this.barraKiHudTemporaria.hud.frameKiAtual = -1;
    }
    this.barraKiHudTemporaria = null;
    for (const campo of CAMPOS_COPIADOS) personagem[campo] = this.camposOriginais[campo];
    for (const [metodo, descriptor] of this.metodosOriginais ?? []) {
      if (descriptor) Object.defineProperty(personagem, metodo, descriptor);
      else delete personagem[metodo];
    }
    this.metodosOriginais = null;
    personagem.ultEstaCarregada = this.ultEstaCarregadaOriginal;
    personagem.sprite.clearTint();
    personagem.sprite.setScale(this.escalaOriginal.x, this.escalaOriginal.y);
    personagem.ultCarga = cargaRestante ? personagem.ultCargaMax * 0.5 : 0;
    personagem.transformacaoTH30 = null;
    personagem.sprite.setTexture(this.spriteOriginal.textura, this.spriteOriginal.frame);
    personagem.tocarAnimacao(
      personagem.maquinaEstados.estadoAtual?.nome === "dead" ? "dead" : "idle"
    );
    this.camposOriginais = null;
    this.finalizarUlt();
  }

  finalizarUlt() {
    if (this.finalizada) return;
    this.finalizada = true;
    this.timerPose?.remove();
    this.timerDive?.remove();
    this.limparEfeitoPose();
    this.liberarPose();
    this.limparCenarioUltimate();
    this.restaurarCamera();
    if (!this.camposOriginais && !this.transformacaoAtiva) this.estadoFSM.finalizarUlt();
  }

  liberarPose() {
    if (this.estadoAlvo && this.alvo?.maquinaEstados) {
      this.alvo.maquinaEstados.update = this.estadoAlvo.update;
      if (!this.estadoAlvo.animacaoPausada) this.alvo.sprite.anims.resume();
      this.alvo.sprite.setVelocity(this.estadoAlvo.velocityX, this.estadoAlvo.velocityY);
      this.estadoAlvo = null;
    }
    if (!this.physicsPausadaAntes && this.scene.physics.world.isPaused) this.scene.physics.resume();
    if (this.personagem.sprite?.body) this.personagem.sprite.body.setAllowGravity(true);
    if (this.personagem.sprite?.anims && !this.animsPausadas) this.personagem.sprite.anims.resume();
  }

  limparCenarioUltimate() {
    if (this.fundoFase?.active) this.fundoFase.setVisible(this.fundoFaseVisivel);
    this.fundoUlt?.destroy();
    this.fundoUlt = null;
    this.visibilidadeCenario.forEach(({ objeto, visible }) => { if (objeto?.active) objeto.setVisible(visible); });
    this.visibilidadeCenario = [];
  }

  restaurarCamera() {
    if (this.cameraRestaurada) return;
    this.cameraRestaurada = true;
    this.scene.atualizarCamera = this.atualizarCameraOriginal;
    if (!this.camera?.active) return;
    this.camera.stopFollow();
    this.camera.resetFX();
    this.camera.setZoom(this.cameraOriginal.zoom);
    this.camera.setScroll(this.cameraOriginal.x, this.cameraOriginal.y);
  }

  cancelar() {
    if (this.transformacaoAtiva && this.camposOriginais) return;
    if (this.camposOriginais) this.restaurarForma();
    else this.finalizarUlt();
  }
}
