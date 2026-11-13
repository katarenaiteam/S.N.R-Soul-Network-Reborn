import { gerarQuadrosUltimateBackground } from "../../Objetos/QuadrosUltimateBackground.js";
import { obterTexturaAuraAigis } from "../Specials/Aigis/AupSpecial.js";

export default class AigisUlt {
  constructor(personagem, config, estadoFSM) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.config = config;
    this.estadoFSM = estadoFSM;
    this.timers = new Set();
    this.visibilidadesCenario = [];
    this.cancelada = false;
  }

  executar() {
    const sprite = this.personagem.sprite;
    if (!sprite?.active || !sprite.body) return this.estadoFSM.finalizarUlt();

    const camera = this.scene.cameras.main;
    this.camera = camera;
    this.zoomOriginal = camera.zoom;
    this.atualizarCameraOriginal = this.scene.atualizarCamera;
    this.centroOriginal = { x: camera.midPoint.x, y: camera.midPoint.y };
    this.gravidadePermitidaOriginal = sprite.body.allowGravity;
    this.ocultarCenario();
    this.ativarFundoUltimate();
    this.scene.atualizarCamera = () => {};
    camera.stopFollow();

    sprite.body.setAllowGravity(false);
    sprite.setVelocity(0, -145);
    sprite.once("animationcomplete-ai_ult_intro_pose", this.manterPoseUlt, this);
    sprite.once("animationcomplete-ai_ult_intro_fim", this.ativarModo, this);
    sprite.anims.play("ai_ult_intro_pose", true);
    this.criarOvercharge();
    camera.pan(sprite.x, sprite.y - 45, 450, "Cubic.easeOut");
    camera.zoomTo(this.zoomOriginal * 1.35, 450);
    this.agendar(360, () => sprite.setVelocityY(0));
    this.agendar(this.config.atrasoOlhos, () => this.mostrarOlhos());
  }

  criarOvercharge() {
    const sprite = this.personagem.sprite;
    if (!this.scene.textures.exists("overcharge")) return;
    this.overcharge = this.scene.add.sprite(sprite.x, sprite.y - 70, "overcharge", 0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(sprite.depth + 1);
    this.scene.camHUD?.ignore(this.overcharge);
    this.overcharge.once("animationcomplete-ai_overcharge", () => {
      this.overcharge?.destroy();
      this.overcharge = null;
    });
    this.overcharge.play("ai_overcharge");
  }

  manterPoseUlt() {
    const sprite = this.personagem.sprite;
    if (!sprite?.active || this.cancelada) return;
    sprite.setVelocity(0, 0);
    sprite.anims.stop();
    sprite.setTexture("ai_AupSpecial", 11);
  }

  agendar(duracao, callback) {
    const timer = this.scene.time.delayedCall(duracao, () => {
      this.timers.delete(timer);
      if (!this.cancelada) callback();
    });
    this.timers.add(timer);
  }

  ocultarCenario() {
    const mapa = this.scene.mapaAtual;
    const objetos = [
      mapa?.imagemFundo,
      ...(mapa?.objetosTeloes ?? []),
      mapa?.suportePlataforma,
      ...(mapa?.plataformas?.getChildren?.() ?? []),
      ...(this.scene.sistemaPlataformasAtravessaveis?.grupo?.getChildren?.() ?? []),
    ].filter(Boolean);
    objetos.forEach((objeto) => {
      this.visibilidadesCenario.push({ objeto, visible: objeto.visible });
      objeto.setVisible(false);
    });
  }

  restaurarCenario() {
    this.visibilidadesCenario.forEach(({ objeto, visible }) => {
      if (objeto?.active) objeto.setVisible(visible);
    });
    this.visibilidadesCenario = [];
  }

  ativarFundoUltimate() {
    if (!this.scene.textures.exists("ultimateback1")) return;
    if (!this.scene.anims.exists("aigis_ultimateback")) {
      this.scene.anims.create({
        key: "aigis_ultimateback",
        frames: gerarQuadrosUltimateBackground(this.scene),
        frameRate: 36,
        repeat: -1,
      });
    }
    this.fundoUlt = this.scene.add.sprite(0, 0, "ultimateback1", 0)
      .setDepth(-90)
      .setScrollFactor(1);
    this.fundoUlt.play("aigis_ultimateback");
    this.scene.camHUD?.ignore(this.fundoUlt);
    this.ajustarFundoUltimate();
  }

  mostrarOlhos() {
    const camera = this.camera;
    const x = camera.midPoint.x;
    const y = camera.midPoint.y;
    const largura = camera.width / (this.zoomOriginal * 1.35) * 0.94;
    const escalaOlhos = largura / 1897;
    const altura = 279 * escalaOlhos;

    this.fundoOlhos = this.scene.add.image(x, y, "fundo_eyes")
      .setDisplaySize(largura, altura)
      .setDepth(1000);
    this.olhos = this.scene.add.sprite(x, y, "ai_eyes", 0)
      .setDisplaySize(largura, altura)
      .setDepth(1001);
    this.olhos.once("animationcomplete-ai_eyes_ult", () => this.iniciarFinalIntro());
    this.olhos.play("ai_eyes_ult");
    this.scene.camHUD?.ignore([this.fundoOlhos, this.olhos]);
    const chaveExclamacao = this.scene.textures.getTextureKeys()
      .find((chave) => chave.toLowerCase().startsWith("exclama"));
    if (!chaveExclamacao) return;
    this.exclamacao = this.scene.add.image(x + largura * 0.22, y, chaveExclamacao)
      .setDisplaySize(largura * 0.12, altura * 0.9)
      .setDepth(1002);
    this.scene.camHUD?.ignore(this.exclamacao);
    this.larguraOlhos = largura;
  }

  ajustarFundoUltimate() {
    if (!this.fundoUlt?.active) return;
    const camera = this.camera;
    this.fundoUlt.setPosition(camera.midPoint.x, camera.midPoint.y)
      .setDisplaySize(camera.width / camera.zoom, camera.height / camera.zoom);
  }

  ativarModo() {
    if (this.cancelada) return;
    this.personagem.modoUltAigisAtivo = true;
    this.personagem.aigisUltAtivando = false;
    this.personagem.guardMaximo = this.config.durabilidadeGuard;
    this.personagem.vidaGuard = this.config.durabilidadeGuard;
    this.personagem.ativarSpecialsUltAigis();
    this.personagem.criarAuraModoUlt();
    this.limparAtivacao();
    this.estadoFSM.finalizarUlt();
  }

  iniciarFinalIntro() {
    if (this.cancelada) return;
    this.fundoOlhos?.destroy();
    this.fundoOlhos = null;
    this.olhos?.destroy();
    this.olhos = null;
    this.exclamacao?.destroy();
    this.exclamacao = null;
    this.personagem.sprite.anims.play("ai_ult_intro_fim", true);
  }

  limparAtivacao() {
    this.timers.forEach((timer) => timer.remove(false));
    this.timers.clear();
    this.tweenExclamacao?.stop();
    this.personagem.sprite?.off("animationcomplete-ai_ult_intro_pose", this.manterPoseUlt, this);
    this.personagem.sprite?.off("animationcomplete-ai_ult_intro_fim", this.ativarModo, this);
    this.overcharge?.destroy();
    this.overcharge = null;
    this.fundoUlt?.destroy();
    this.fundoOlhos?.destroy();
    this.olhos?.destroy();
    this.exclamacao?.destroy();
    this.restaurarCenario();
    this.camera?.pan(this.centroOriginal.x, this.centroOriginal.y, 350, "Cubic.easeInOut");
    this.camera?.zoomTo(this.zoomOriginal, 350);
    this.scene.atualizarCamera = this.atualizarCameraOriginal;
    this.scene.atualizarCamera?.();
    const sprite = this.personagem.sprite;
    if (sprite?.body) {
      sprite.body.setAllowGravity(this.gravidadePermitidaOriginal);
      sprite.setVelocity(0, 0);
    }
  }

  atualizar() {
    this.ajustarFundoUltimate();
    if (this.overcharge?.active) {
      this.overcharge.setPosition(this.personagem.sprite.x, this.personagem.sprite.y - 70);
    }
    const x = this.camera.midPoint.x;
    const y = this.camera.midPoint.y;
    this.fundoOlhos?.setPosition(x, y);
    this.olhos?.setPosition(x, y);
    if (this.exclamacao?.active) {
      const oscilacao = Math.sin(this.scene.time.now / 1200) * this.larguraOlhos * 0.025;
      this.exclamacao.setPosition(x + this.larguraOlhos * 0.22 + oscilacao, y);
    }
  }

  cancelar() {
    if (this.cancelada || this.personagem.modoUltAigisAtivo) return;
    this.cancelada = true;
    this.personagem.aigisUltAtivando = false;
    this.limparAtivacao();
  }
}

AigisUlt.configuracao = {
  animacao: "ai_AupSpecial",
  logica: AigisUlt,
  atrasoOlhos: 1800,
  duracaoAtivacao: 3600,
  durabilidadeGuard: 250,
};
