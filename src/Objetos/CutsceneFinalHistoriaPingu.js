import DialogoHistoria from "./DialogoHistoria.js";

const FALAS_FINAIS = [
  { personagem: "Pingu", retrato: "Pg_deaf", texto: "NUU ... not." },
  { personagem: "FJ", retrato: "FJ_N", texto: "..." },
];

export default class CutsceneFinalHistoriaPingu {
  constructor(scene) {
    this.scene = scene;
    this.ativa = true;
    this.efeitos = [];
    this.ocultarHUD();
    scene.botIA?.soltarTudo();
    scene.camJogo.useBounds = false;
    scene.physics.world.pause();

    this.pingu = scene.boss;
    this.fj = scene.jogador1;
    this.centro = { x: 720, y: 936 };
    const spawnFJ = scene.mapaAtual.spawnsIniciais.p1;
    scene.camJogo.setZoom(3.1 * (scene.scale.width / 1920))
      .centerOn(this.centro.x, this.centro.y - 250);

    this.fj.sprite.setPosition(spawnFJ.x, spawnFJ.y).setVelocity(0, 0)
      .setVisible(true).setActive(true).setFlipX(false);
    this.fj.sprite.body.enable = true;
    this.fj.sprite.body.setAllowGravity(false);
    this.fj.aplicarConfiguracao("idle");
    this.tocarAnimacaoSeExistir(this.fj, "idle");
    this.sincronizar(this.fj);

    const sprite = this.pingu.sprite;
    sprite.setPosition(this.centro.x, this.centro.y - 330).setVelocity(0, 0)
      .setVisible(true).setActive(true).setFlipX(false);
    sprite.body.enable = true;
    sprite.body.setAllowGravity(false);
    this.pingu.aplicarConfiguracao("danoSide");
    this.tocarAnimacaoSeExistir(this.pingu, "danoSide");
    this.sincronizar(this.pingu);

    this.ignorarCamHUD(sprite);
    this.criarAnimacaoDanca();
    scene.time.delayedCall(250, () => this.criarFaiscas());
    scene.time.delayedCall(3800, () => this.pinguCai());
    scene.events.once("shutdown", this.destruir, this);
  }

  ocultarHUD() {
    const scene = this.scene;
    scene.containerHUD?.setVisible(false);
    [scene.indicadorP1, scene.indicadorP2, scene.indicadorCPU]
      .filter(Boolean).forEach(indicador => indicador.setVisible(false));
  }

  ignorarCamHUD(objeto) {
    this.scene.camHUD?.ignore(objeto);
  }

  sincronizar(personagem) {
    personagem.atualizarOffsetFisica();
    const body = personagem.sprite.body;
    body.updateFromGameObject();
    body.prev.copy(body.position);
    body.prevFrame.copy(body.position);
    personagem.sincronizarHurtbox();
  }

  tocarAnimacaoSeExistir(personagem, nome) {
    const chave = `${personagem.prefixoAnim}${nome}`;
    if (this.scene.anims.exists(chave)) personagem.sprite.play(chave, true);
  }

  criarAnimacaoDanca() {
    const scene = this.scene;
    if (scene.anims.exists("story-pingu-dance-loop")) return;
    scene.anims.create({
      key: "story-pingu-dance-loop",
      frames: scene.anims.generateFrameNumbers("pingu-dance").slice(0, -1),
      frameRate: 12,
      repeat: -1,
    });
  }

  criarFaiscas() {
    if (!this.ativa) return;
    const sprite = this.pingu.sprite;
    const caracteres = "01NOOT{}[]<>";
    for (let i = 0; i < 84; i++) {
      const x = sprite.x + Phaser.Math.Between(-55, 55);
      const y = sprite.y - Phaser.Math.Between(15, 145);
      const parte = this.scene.add.text(x, y,
        caracteres[Math.floor(Math.random() * caracteres.length)], {
          fontFamily: "monospace",
          fontSize: `${Phaser.Math.Between(19, 31)}px`,
          color: i % 3 ? "#ff9d32" : "#fff0cf",
          stroke: "#ff5c00",
          strokeThickness: 2,
        }).setDepth(sprite.depth + 15).setBlendMode(Phaser.BlendModes.ADD)
        .setShadow(0, 0, "#ff7200", 15);
      this.ignorarCamHUD(parte);
      this.efeitos.push(parte);
      this.scene.tweens.add({
        targets: parte,
        x: x + Phaser.Math.Between(-190, 190),
        y: y + Phaser.Math.Between(-200, 65),
        alpha: 0,
        duration: 1100 + Math.random() * 700,
        ease: "Cubic.Out",
        onComplete: () => parte.destroy(),
      });
    }
  }

  pinguCai() {
    if (!this.ativa) return;
    const sprite = this.pingu.sprite;
    this.scene.tweens.add({
      targets: sprite,
      y: this.centro.y,
      duration: 1800,
      ease: "Cubic.In",
      onUpdate: () => {
        this.sincronizar(this.pingu);
        this.scene.camJogo.centerOn(sprite.x, sprite.y - 40);
      },
      onComplete: () => this.mostrarPoseMorta(),
    });
  }

  mostrarPoseMorta() {
    if (!this.ativa) return;
    const sprite = this.pingu.sprite;
    this.pingu.aplicarConfiguracao("dead");
    sprite.setOrigin(0.5, 1).play("pingu_dead", true);
    sprite.body.enable = false;
    sprite.body.setAllowGravity(false);
    sprite.once("animationcomplete-pingu_dead", () => {
      if (!this.ativa) return;
      sprite.setTexture("Pingu_dead", 2).setOrigin(0.5, 1);
      this.sincronizar(this.pingu);
      this.dialogoFinal();
    });
    this.sincronizar(this.pingu);
  }

  dialogoFinal() {
    this.scene.dialogoHistoria = new DialogoHistoria(this.scene, () => {
      this.scene.dialogoHistoria = null;
      this.fjVaiEmbora();
    }, {
      falas: FALAS_FINAIS,
      prepararPersonagens: false,
      restaurarEstado: false,
    });
  }

  fjVaiEmbora() {
    if (!this.ativa) return;
    this.fj.sprite.setVisible(true).setActive(true).setFlipX(false);
    this.fj.aplicarConfiguracao("idle");
    this.tocarAnimacaoSeExistir(this.fj, "walk");
    this.sincronizar(this.fj);
    const distancia = this.scene.camJogo.width / this.scene.camJogo.zoom / 2 + 250;
    this.scene.tweens.add({
      targets: this.fj.sprite,
      x: this.fj.sprite.x + distancia,
      duration: 2400,
      ease: "Linear",
      onUpdate: () => this.sincronizar(this.fj),
      onComplete: () => {
        this.fj.sprite.setVisible(false);
        this.scene.time.delayedCall(1000, () => this.focarDanca());
      },
    });
  }

  focarDanca() {
    if (!this.ativa) return;
    const cam = this.scene.camJogo;
    const de = { x: cam.midPoint.x, y: cam.midPoint.y, zoom: cam.zoom };
    const para = {
      x: this.pingu.sprite.x,
      y: this.pingu.sprite.y - 10,
      zoom: 3.1 * (this.scene.scale.width / 1920),
    };
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 750,
      ease: "Sine.easeInOut",
      onUpdate: tween => {
        const t = tween.getValue();
        cam.setZoom(Phaser.Math.Linear(de.zoom, para.zoom, t))
          .centerOn(Phaser.Math.Linear(de.x, para.x, t),
            Phaser.Math.Linear(de.y, para.y, t));
      },
      onComplete: () => this.iniciarDanca(),
    });
  }

  iniciarDanca() {
    if (!this.ativa) return;
    const sprite = this.pingu.sprite;
    sprite.setPosition(sprite.x, sprite.y - 40)
      .setTexture("pingu-dance", 0).setOrigin(0.5, 0.5).setScale(1.15)
      .play("story-pingu-dance-loop");
    this.sincronizar(this.pingu);
    this.cat = this.scene.sound.add("cat");
    this.cat.play();
    this.scene.time.delayedCall(9000, () => this.pinguLevanta());
  }

  pinguLevanta() {
    if (!this.ativa) return;
    const cam = this.scene.camJogo;
    const sprite = this.pingu.sprite;
    const distancia = cam.height / cam.zoom + sprite.displayHeight + 120;
    this.scene.tweens.add({
      targets: sprite,
      y: sprite.y - distancia,
      duration: 3600,
      ease: "Sine.In",
      onComplete: () => this.scene.time.delayedCall(700, () => this.encerrarHistoria()),
    });
  }

  encerrarHistoria() {
    if (!this.ativa) return;
    this.scene.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.sound.stopAll();
      this.scene.scene.start("CenaCreditos");
    });
    this.scene.cameras.main.fadeOut(900, 0, 0, 0);
  }

  destruir() {
    this.ativa = false;
    this.scene.events.off("shutdown", this.destruir, this);
    this.efeitos.forEach(efeito => efeito.destroy());
    this.cat?.stop();
  }
}
