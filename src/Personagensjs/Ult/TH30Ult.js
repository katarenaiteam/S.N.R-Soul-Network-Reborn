import { obterAlvosCombate } from "../../Objetos/SistemaCombateEspecial.js";
import { gerarQuadrosUltimateBackground } from "../../Objetos/QuadrosUltimateBackground.js";

const CAMPOS_COPIADOS = [
  "nomePersonagem", "prefixoAnim", "configAnimacoes", "golpes", "specials",
  "ult", "velocidade", "forcaPulo", "maxPulos", "maxDash", "sons",
];

export default class TH30Ult {
  constructor(personagem, _config, estadoFSM) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.estadoFSM = estadoFSM;
    this.alvo = obterAlvosCombate(personagem)
      .filter((alvo) => alvo?.sprite?.active && alvo.maquinaEstados)
      .sort((a, b) => Math.abs(a.sprite.x - personagem.sprite.x) - Math.abs(b.sprite.x - personagem.sprite.x))[0];
    this.camera = this.scene.cameras.main;
    this.cameraOriginal = { x: this.camera.scrollX, y: this.camera.scrollY, zoom: this.camera.zoom };
    this.atualizarCameraOriginal = this.scene.atualizarCamera;
    this.visibilidadeCenario = [];
    this.finalizada = false;
  }

  executar() {
    if (!this.alvo) return this.finalizarUlt();
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
    this.camera.pan(sprite.x, sprite.y - 55, 300, "Power2");
    this.camera.zoomTo(this.cameraOriginal.zoom * 1.4, 300);
    this.timerPose = this.scene.time.delayedCall(750, () => {
      if (this.finalizada) return;
      sprite.anims.pause();
      this.timerPose = this.scene.time.delayedCall(450, () => this.iniciarDive());
    });
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
    sprite.anims.play("th_dive", true);
    const duracao = this.scene.anims.get("th_dive")?.duration || 450;
    this.timerDive = this.scene.time.delayedCall(duracao, () => this.transformar());
  }

  transformar() {
    if (this.finalizada || !this.alvo?.sprite?.active) return this.finalizarUlt();
    const personagem = this.personagem;
    this.limparCenarioUltimate();
    this.camposOriginais = Object.fromEntries(CAMPOS_COPIADOS.map((campo) => [campo, personagem[campo]]));
    this.ultEstaCarregadaOriginal = personagem.ultEstaCarregada;
    this.spriteOriginal = { textura: personagem.sprite.texture.key, frame: personagem.sprite.frame.name };
    this.escalaOriginal = { x: personagem.sprite.scaleX, y: personagem.sprite.scaleY };
    const escalaConfigurada = this.alvo.configAnimacoes?.idle?.escala;
    const escalaAlvo = escalaConfigurada
      ? { x: escalaConfigurada, y: escalaConfigurada }
      : { x: this.alvo.sprite.scaleX, y: this.alvo.sprite.scaleY };
    for (const campo of CAMPOS_COPIADOS) personagem[campo] = this.alvo[campo];
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

  atualizar() {
    this.ajustarFundoUltimate();
    if (!this.camposOriginais) return;
    if (this.personagem.maquinaEstados.estadoAtual?.nome === "dead") {
      this.restaurarForma();
      return;
    }
    if (this.transformacaoAtiva) this.personagem.sprite.setTint(0x399cff);
  }

  restaurarForma() {
    if (!this.camposOriginais) return;
    this.tweenEmergencia?.stop();
    this.timerForma?.remove();
    const personagem = this.personagem;
    const cargaRestante = personagem.ultCarga > 0;
    for (const campo of CAMPOS_COPIADOS) personagem[campo] = this.camposOriginais[campo];
    personagem.ultEstaCarregada = this.ultEstaCarregadaOriginal;
    personagem.sprite.clearTint();
    personagem.sprite.setScale(this.escalaOriginal.x, this.escalaOriginal.y);
    personagem.ultCarga = cargaRestante ? personagem.ultCargaMax * 0.5 : 0;
    personagem.transformacaoTH30 = null;
    personagem.sprite.setTexture(this.spriteOriginal.textura, this.spriteOriginal.frame);
    if (personagem.maquinaEstados.estadoAtual?.nome !== "dead") personagem.tocarAnimacao("idle");
    this.camposOriginais = null;
    this.finalizarUlt();
  }

  finalizarUlt() {
    if (this.finalizada) return;
    this.finalizada = true;
    this.timerPose?.remove();
    this.timerDive?.remove();
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
