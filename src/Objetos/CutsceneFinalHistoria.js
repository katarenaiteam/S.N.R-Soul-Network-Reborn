import DialogoHistoria from "./DialogoHistoria.js";

const FALAS_MIKU = [
  { personagem: "Miku", retrato: "Mk_sad", texto: "Parece que é o fim." },
  { personagem: "Miku", retrato: "Mk_sad", texto: "Você se provou mais forte do que eu. Espero que encontre o que procura no fim de sua jornada." },
];
const FALAS_PUPPET = [
  { personagem: "Puppet", personagemCamera: "Puppet", zoom: 2.8, retrato: "puppet", texto: "MAMÃE!!!" },
  { personagem: "Miku", retrato: "Mk_sad", texto: "Não me olhe dessa forma, pequena, ou vou ficar ainda mais triste por ter abandonado você." },
];
const FALAS_FJ = [
  { personagem: "FJ", retrato: "FJ_N", texto: "Eu juro que encontrarei um jeito de mudar esse mundo para que tragédias como essas não precisem mais ocorrer." },
  { personagem: "FJ", retrato: "FJ_N", texto: "Adeus, せかいでいちばんおひめさま." },
];

export default class CutsceneFinalHistoria {
  constructor(scene) {
    this.scene = scene;
    this.ativa = true;
    this.efeitos = [];
    this.ocultarHUD();
    scene.botIA?.soltarTudo();
    scene.camJogo.useBounds = false;
    scene.physics.world.pause();

    const fj = scene.jogador1;
    const miku = scene.boss;
    const inicioFJ = scene.mapaAtual.spawnsIniciais.p1;
    const centroMapa = { x: 1300, y: 800 };
    this.centroMiku = centroMapa;
    scene.camJogo.setZoom(3.3).centerOn(centroMapa.x, centroMapa.y - 150);
    fj.sprite.setPosition(inicioFJ.x, inicioFJ.y).setVelocity(0, 0).setFlipX(false);
    fj.aplicarConfiguracao("idle");
    this.tocarAnimacaoSeExistir(fj, "idle");
    this.sincronizar(fj);

    miku.sprite.setPosition(centroMapa.x, centroMapa.y - 150).setVelocity(0, 0)
      .setVisible(true).setActive(true).setFlipX(true);
    miku.sprite.body.enable = true;
    miku.sprite.body.setAllowGravity(false);
    miku.aplicarConfiguracao("dano");
    miku.sprite.play("miku_dano", true);
    this.sincronizar(miku);
    scene.camJogo.centerOn(miku.sprite.x, miku.sprite.y - miku.sprite.displayHeight / 2);

    this.pose = scene.add.sprite(miku.sprite.x + 15, miku.sprite.y - 55, "miku_pose")
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(miku.sprite.depth + 5);
    this.ignorarCamHUD(this.pose);
    if (!scene.anims.exists("miku_vfx_miku_pose_loop")) {
      scene.anims.create({ key: "miku_vfx_miku_pose_loop",
        frames: scene.anims.generateFrameNumbers("miku_pose", { start: 0, end: scene.textures.get("miku_pose").frameTotal - 2 }),
        frameRate: 28, repeat: -1 });
    }
    this.pose.play("miku_vfx_miku_pose_loop");

    this.fadeoutMusica = scene.tweens.add({ targets: scene.mapaAtual.musica, volume: 0, duration: 1000,
      onComplete: () => scene.mapaAtual.musica?.stop() });
    this.sayonara = scene.sound.add("Sayonara", { volume: 0, loop: false });
    if (scene.sound.locked) scene.sound.once("unlocked", () => this.iniciarSayonara());
    else this.iniciarSayonara();

    scene.time.delayedCall(250, () => this.iniciarExplosao());
    scene.time.delayedCall(3800, () => this.mikuCai());
    scene.events.once("shutdown", this.destruir, this);
  }

  iniciarSayonara() {
    if (!this.ativa || this.sayonara.isPlaying) return;
    this.sayonara.play();
    this.scene.tweens.add({ targets: this.sayonara, volume: 0.55, duration: 900 });
  }

  ocultarHUD() {
    const scene = this.scene;
    scene.containerHUD?.setVisible(false);
    [scene.indicadorP1, scene.indicadorP2, scene.indicadorCPU].filter(Boolean)
      .forEach(indicador => indicador.setVisible(false));
  }

  sincronizar(jogador) {
    jogador.atualizarOffsetFisica();
    jogador.sprite.body.updateFromGameObject();
    jogador.sprite.body.prev.copy(jogador.sprite.body.position);
    jogador.sprite.body.prevFrame.copy(jogador.sprite.body.position);
    jogador.sincronizarHurtbox();
  }

  tocarAnimacaoSeExistir(jogador, nome) {
    const chave = `${jogador.prefixoAnim}${nome}`;
    if (this.scene.anims.exists(chave)) jogador.sprite.play(chave, true);
  }

  ignorarCamHUD(objeto) {
    this.scene.camHUD?.ignore(objeto);
    return objeto;
  }

  iniciarExplosao() {
    if (!this.ativa) return;
    const miku = this.scene.boss.sprite;
    this.tempoNotas = this.scene.time.addEvent({ delay: 125, repeat: 15, callback: () => {
      for (let i = 0; i < 3; i++) this.criarNota(miku.x, miku.y - 50);
    }});
  }

  criarNota(x, y) {
    const scene = this.scene;
    const animacao = Math.random() < 0.5 ? "miku_nota_ataque_1" : "miku_nota_ataque_2";
    const angulo = Math.random() * Math.PI * 2;
    const distancia = 170 + Math.random() * 230;
    const nota = scene.add.sprite(x, y, "Miku_effects")
      .setBlendMode(Phaser.BlendModes.ADD).setTint(0xffffff).setAlpha(1).setScale(0.78).setDepth(scene.boss.sprite.depth + 8);
    this.ignorarCamHUD(nota);
    nota.play(animacao);
    this.efeitos.push(nota);
    scene.tweens.add({ targets: nota, x: x + Math.cos(angulo) * distancia, y: y + Math.sin(angulo) * distancia,
      alpha: 0, scale: 0.3, duration: 1100 + Math.random() * 450, ease: "Cubic.Out",
      onComplete: () => nota.destroy() });
  }

  mikuCai() {
    if (!this.ativa) return;
    const sprite = this.scene.boss.sprite;
    this.pose?.destroy();
    this.pose = null;
    this.scene.tweens.add({ targets: sprite, y: this.centroMiku.y,
      duration: 1800, ease: "Cubic.In", onUpdate: () => {
        this.sincronizar(this.scene.boss);
        this.scene.camJogo.centerOn(sprite.x, sprite.y - sprite.displayHeight / 2);
      },
      onComplete: () => {
        sprite.anims.stop();
        sprite.setTexture("Mk_deaf", 0).setOrigin(0.5, 1);
        this.sincronizar(this.scene.boss);
        this.dialogo(FALAS_MIKU, () => this.chamarPuppet());
      } });
  }

  dialogo(falas, aoConcluir, alvosCamera = null) {
    this.scene.dialogoHistoria = new DialogoHistoria(this.scene, () => {
      this.scene.dialogoHistoria = null;
      aoConcluir?.();
    }, { falas, alvosCamera, prepararPersonagens: false, restaurarEstado: false });
  }

  chamarPuppet() {
    const scene = this.scene;
    this.puppet = scene.add.sprite(1850, 800, "Miku_puppet", 0)
      .setOrigin(0.5, 1).setScale(0.55).setFlipX(true).setDepth(scene.boss.sprite.depth + 1);
    this.ignorarCamHUD(this.puppet);
    this.dialogo(FALAS_PUPPET, () => this.dissolverMiku(), { Puppet: this.puppet });
  }

  dissolverMiku() {
    const sprite = this.scene.boss.sprite;
    const caracteres = "アイウエオカキクケコ0123456789";
    for (let i = 0; i < 84; i++) {
      const x = sprite.x + Phaser.Math.Between(-55, 55);
      const y = sprite.y - Phaser.Math.Between(15, 145);
      const part = this.scene.add.text(x, y, caracteres[Math.floor(Math.random() * caracteres.length)], {
        fontFamily: "monospace", fontSize: `${Phaser.Math.Between(19, 31)}px`,
        color: i % 3 ? "#ff35e6" : "#fff0ff", stroke: "#ff00be", strokeThickness: 2,
      }).setDepth(sprite.depth + 15).setBlendMode(Phaser.BlendModes.ADD).setShadow(0, 0, "#ff00d4", 15);
      this.ignorarCamHUD(part);
      this.efeitos.push(part);
      this.scene.tweens.add({ targets: part,
        x: x + Phaser.Math.Between(-190, 190), y: y + Phaser.Math.Between(-200, 65),
        alpha: 0, duration: 1100 + Math.random() * 700, ease: "Cubic.Out", onComplete: () => part.destroy() });
    }
    sprite.setVisible(false).setActive(false);
    sprite.body.enable = false;
    this.puppet?.destroy();
    this.scene.time.delayedCall(900, () => this.dialogoFinalFJ());
  }

  dialogoFinalFJ() {
    const falas = FALAS_FJ.map(fala => ({ ...fala }));
    falas[1].aoMostrar = () => this.scene.tweens.add({ targets: this.sayonara, volume: 0, duration: 1400,
      onComplete: () => this.sayonara.stop() });
    this.dialogo(falas, () => this.fjVaiEmbora());
  }

  fjVaiEmbora() {
    const fj = this.scene.jogador1;
    fj.sprite.setVisible(true).setActive(true).setFlipX(false);
    fj.aplicarConfiguracao("idle");
    this.tocarAnimacaoSeExistir(fj, "walk");
    this.sincronizar(fj);
    const distancia = this.scene.camJogo.width / this.scene.camJogo.zoom / 2 + 250;
    this.scene.tweens.add({ targets: fj.sprite, x: fj.sprite.x + distancia, duration: 2400, ease: "Linear",
      onUpdate: () => this.sincronizar(fj), onComplete: () => {
        fj.sprite.setVisible(false);
        const cam = this.scene.camJogo;
        cam.once("camerafadeoutcomplete", () => {
          this.scene.sound.stopAll();
          this.scene.scene.start("CenaCreditos");
        });
        cam.fadeOut(900, 0, 0, 0);
      } });
  }

  destruir() {
    this.ativa = false;
    this.tempoNotas?.remove();
    this.pose?.destroy();
    this.puppet?.destroy();
    this.efeitos.forEach(obj => obj.destroy());
    this.sayonara?.stop();
  }
}
