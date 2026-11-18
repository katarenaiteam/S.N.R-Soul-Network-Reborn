import DialogoHistoria from "./DialogoHistoria.js";

const FALAS_FINAIS = [
  { personagem: "TH30", personagemCamera: "FJ", zoom: 2.2, retrato: "TH_N", texto: "Não pode ser!" },
  { personagem: "TH30", personagemCamera: "FJ", zoom: 2.2, retrato: "TH_N", texto: "Meu mundo... minha criação!" },
];

export default class CutsceneFinalTH30 {
  constructor(scene) {
    this.scene = scene;
    this.ativa = true;
    this.efeitos = [];
    scene.botIA?.soltarTudo();
    scene.containerHUD?.setVisible(false);
    [scene.indicadorP1, scene.indicadorP2, scene.indicadorCPU]
      .filter(Boolean).forEach(indicador => indicador.setVisible(false));
    scene.camJogo.useBounds = false;
    scene.camHUD?.setVisible(true).setAlpha(1).setScroll(0, 0).setZoom(1);
    scene.physics.world.pause();

    this.fj = scene.jogador1;
    this.th = scene.boss;
    const centroX = scene.camJogo.midPoint.x;
    const centroY = scene.camJogo.midPoint.y;
    this.fj.sprite.setPosition(centroX, centroY).setVelocity(0, 0)
      .setVisible(true).setActive(true);
    this.fj.sprite.body.setAllowGravity(false);
    this.fj.aplicarConfiguracao("idle");
    this.sincronizar(this.fj);

    this.th.sprite.setPosition(centroX, centroY - 180).setVelocity(0, 0)
      .setVisible(true).setActive(true);
    this.th.sprite.body.enable = true;
    this.th.sprite.body.setAllowGravity(false);
    this.th.aplicarConfiguracao("dano");
    this.tocarAnimacao(this.th, "dano");
    this.sincronizar(this.th);
    scene.camHUD?.ignore([this.fj.sprite, this.th.sprite]);

    scene.camJogo.setZoom(2.2 * (scene.scale.width / 1920)).centerOn(centroX, centroY);
    this.flutuar = scene.tweens.add({ targets: this.fj.sprite, y: centroY - 20,
      duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    scene.events.once("shutdown", this.destruir, this);
    this.emitirMatrix(this.fj.sprite);
    scene.time.delayedCall(250, () => this.iniciarExplosaoTH());
    scene.time.delayedCall(3800, () => this.dialogoFinal());
  }

  sincronizar(personagem) {
    personagem.atualizarOffsetFisica();
    const body = personagem.sprite.body;
    body.updateFromGameObject();
    body.prev.copy(body.position);
    body.prevFrame.copy(body.position);
    personagem.sincronizarHurtbox();
  }

  tocarAnimacao(personagem, nome) {
    const chave = `${personagem.prefixoAnim}${nome}`;
    if (this.scene.anims.exists(chave)) personagem.sprite.play(chave, true);
  }

  iniciarExplosaoTH() {
    if (!this.ativa || !this.th.sprite.visible) return;
    this.tempoExplosao = this.scene.time.addEvent({
      delay: 125,
      repeat: 15,
      callback: () => {
        if (!this.ativa || !this.th.sprite.visible) return;
        for (let i = 0; i < 3; i++) this.criarParticulaMatrix(this.th.sprite);
      },
    });
  }

  dialogoFinal() {
    if (!this.ativa) return;
    this.scene.dialogoHistoria = new DialogoHistoria(this.scene, () => {
      this.scene.dialogoHistoria = null;
      this.explodirTH();
    }, { falas: FALAS_FINAIS, prepararPersonagens: false, restaurarEstado: false });
    this.scene.dialogoHistoria.container
      .setVisible(true)
      .setDepth(10000);
    this.scene.dialogoHistoria.container.cameraFilter = this.scene.camJogo.id;
  }

  explodirTH() {
    if (!this.ativa) return;
    const sprite = this.th.sprite;
    this.emitirMatrix(sprite);
    this.scene.time.delayedCall(900, () => {
      if (!this.ativa) return;
      sprite.setVisible(false).setActive(false);
      sprite.body.enable = false;
    });
    this.scene.time.delayedCall(2200, () => {
      if (this.ativa) this.scene.aoConcluirCenaFinalTH30?.();
    });
  }

  emitirMatrix(sprite) {
    for (let i = 0; i < 84; i++) this.criarParticulaMatrix(sprite);
  }

  criarParticulaMatrix(sprite) {
    const caracteres = "01{}[]<>";
    const x = sprite.x + Phaser.Math.Between(-55, 55);
    const y = sprite.y - Phaser.Math.Between(15, 145);
    const particula = this.scene.add.text(x, y,
      caracteres[Math.floor(Math.random() * caracteres.length)], {
        fontFamily: "monospace",
        fontSize: `${Phaser.Math.Between(19, 31)}px`,
        color: Math.random() < 0.75 ? "#35ff5b" : "#eaffee",
        stroke: "#00b82e",
        strokeThickness: 2,
      }).setDepth(sprite.depth + 15).setBlendMode(Phaser.BlendModes.ADD)
      .setShadow(0, 0, "#00ff3c", 15);
    this.scene.camHUD?.ignore(particula);
    this.efeitos.push(particula);
    this.scene.tweens.add({ targets: particula,
      x: x + Phaser.Math.Between(-190, 190),
      y: y + Phaser.Math.Between(-200, 65), alpha: 0,
      duration: 1100 + Math.random() * 700, ease: "Cubic.Out",
      onComplete: () => particula.destroy(),
    });
  }

  destruir() {
    this.ativa = false;
    this.scene.events.off("shutdown", this.destruir, this);
    this.tempoExplosao?.remove();
    this.flutuar?.stop();
    this.efeitos.forEach(efeito => efeito.destroy());
  }
}
