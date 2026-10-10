import DialogoHistoria from "./DialogoHistoria.js";

const FALAS_INICIAIS = [
  { personagem: "FJ", retrato: "FJ_N", texto: "Finalmente. Paerece que é o fim." },
];
const FALAS_APARICAO = [
  { personagem: "FJ", retrato: "FJ_N", texto: "Mas como?" },
];
const FALAS_CONFRONTO = [
  { personagem: "FJ", retrato: "FJ_N", texto: "Afinal, oque voce quer?" },
  { personagem: "FJ", retrato: "FJ_N", texto: "Todos que entraram nesse torneio." },
  { personagem: "FJ", retrato: "FJ_N", texto: "Eles, eu. Nos so queriamos uma vida melhor." },
  { personagem: "FJ", retrato: "FJ_N", texto: "Mas se voce esta aqui agora, entao voce acabou com eles." },
  { personagem: "FJ", retrato: "FJ_N", texto: "Como se a vida deles nao importasse." },
  { personagem: "FJ", retrato: "FJ_N", texto: "Como se voce fosse ..." },
  { personagem: "FJ", retrato: "FJ_N", texto: "Como se voce fosse como..." },
  { personagem: "FJ", retrato: "FJ_N", texto: "como eu..." },
  { personagem: "FJ", retrato: "FJ_N", texto: "..." },
];
const FALAS_FINAL = [
  { personagem: "FJ", retrato: "FJ_N", texto: "Oque eu estou fazendo afinal." },
];

export default class CutsceneFinalSlenderman {
  constructor(scene) {
    this.scene = scene;
    this.ativa = true;
    scene.botIA?.soltarTudo();
    scene.containerHUD?.setVisible(false);
    [scene.indicadorP1, scene.indicadorP2, scene.indicadorCPU]
      .filter(Boolean).forEach(indicador => indicador.setVisible(false));
    scene.camJogo.useBounds = false;
    scene.physics.world.pause();
    scene.sound.stopAll();

    this.fj = scene.jogador1;
    this.slan = scene.boss;
    const mapa = scene.mapaAtual;
    // A posicao inicial da arena fica acima da plataforma; na cena pausada,
    // alinhe o corpo do FJ diretamente ao topo para ele caminhar apoiado.
    const plataforma = mapa.plataformas.getChildren()
      .find(item => mapa.spawnsIniciais.p1.x >= item.body.left && mapa.spawnsIniciais.p1.x <= item.body.right);
    const inicioX = plataforma ? plataforma.body.left + 130 : mapa.spawnsIniciais.p1.x;
    this.fj.sprite.setPosition(inicioX, mapa.spawnsIniciais.p1.y)
      .setVelocity(0, 0).setVisible(true).setActive(true).setFlipX(false);
    this.fj.sprite.body.enable = true;
    this.fj.sprite.body.setAllowGravity(false);
    this.aplicarAnim(this.fj, "idle");
    this.sincronizar(this.fj);
    if (plataforma) {
      // Alinha usando os limites Arcade reais; os offsets visuais do FJ variam por animação.
      this.fj.sprite.y += plataforma.body.top - this.fj.sprite.body.bottom;
      this.sincronizar(this.fj);
    }
    this.plataformaFinal = plataforma;
    scene.camJogo.setZoom(1.5 * (scene.scale.width / 1920))
      .centerOn(this.fj.sprite.x + 120, this.fj.sprite.y - 70);

    this.slan.sprite.setVisible(false).setActive(true).setVelocity(0, 0);
    this.slan.sprite.body.enable = false;
    scene.events.once("shutdown", this.destruir, this);
    scene.time.delayedCall(3000, () => this.dialogo(FALAS_INICIAIS, () => this.fjComecaAndar()));
  }

  dialogo(falas, concluir) {
    if (!this.ativa) return;
    this.scene.dialogoHistoria = new DialogoHistoria(this.scene, () => {
      this.scene.dialogoHistoria = null;
      concluir?.();
    }, { falas, prepararPersonagens: false, restaurarEstado: false });
  }

  aplicarAnim(personagem, nome) {
    personagem.aplicarConfiguracao(nome);
    const chave = `${personagem.prefixoAnim}${nome}`;
    if (this.scene.anims.exists(chave)) personagem.sprite.play(chave, true);
  }

  sincronizar(personagem) {
    personagem.atualizarOffsetFisica();
    const body = personagem.sprite.body;
    body.updateFromGameObject();
    body.prev.copy(body.position);
    body.prevFrame.copy(body.position);
    personagem.sincronizarHurtbox();
  }

  alinharNoChao(personagem) {
    if (!this.plataformaFinal) return;
    personagem.sprite.y += this.plataformaFinal.body.top - personagem.sprite.body.bottom;
    this.sincronizar(personagem);
  }

  fjComecaAndar() {
    if (!this.ativa) return;
    this.aplicarAnim(this.fj, "walk");
    const plataforma = this.scene.mapaAtual.plataformas.getChildren()
      .find(item => this.fj.sprite.x >= item.body.left && this.fj.sprite.x <= item.body.right);
    const destinoX = plataforma
      ? Math.min(this.fj.sprite.x + 150, plataforma.body.right - 130)
      : this.fj.sprite.x + 150;
    this.scene.tweens.add({ targets: this.fj.sprite, x: destinoX,
      duration: 1500, ease: "Linear", onUpdate: () => this.alinharNoChao(this.fj),
      onComplete: () => this.aparecerSlenderman() });
  }

  aparecerSlenderman() {
    if (!this.ativa) return;
    const cena = this.scene;
    const fj = this.fj.sprite;
    const slan = this.slan.sprite;
    fj.setVelocity(0, 0);
    this.aplicarAnim(this.fj, "idle");

    if (!cena.anims.exists("slan_final_tv")) cena.anims.create({
      key: "slan_final_tv", frames: cena.anims.generateFrameNumbers("Slan_tv"),
      frameRate: 18, repeat: 0,
    });
    slan.setPosition(fj.x + 110, fj.y).setVisible(true).setActive(true).setFlipX(true);
    slan.body.enable = true;
    slan.body.setAllowGravity(false);
    this.aplicarAnim(this.slan, "idle");
    this.sincronizar(this.slan);
    this.alinharNoChao(this.slan);
    this.tocarEfeitoTV(() => this.recuarFJ());
  }

  tocarEfeitoTV(aoConcluir) {
    const cena = this.scene;
    if (!cena.anims.exists("slan_final_tv")) cena.anims.create({
      key: "slan_final_tv", frames: cena.anims.generateFrameNumbers("Slan_tv"),
      frameRate: 18, repeat: 0,
    });
    this.tv = cena.add.sprite(cena.scale.width / 2, cena.scale.height / 2, "Slan_tv")
      .setScrollFactor(0).setDisplaySize(cena.scale.width, cena.scale.height)
      .setDepth(3200).play("slan_final_tv");
    cena.camJogo.ignore(this.tv);
    this.somTV = cena.sound.add("tv-static");
    this.somTV.play();
    cena.time.delayedCall(500, () => {
      this.tv?.destroy();
      this.tv = null;
      this.somTV?.stop();
      this.somTV?.destroy();
      this.somTV = null;
      aoConcluir?.();
    });
  }

  recuarFJ() {
    if (!this.ativa) return;
    const fj = this.fj.sprite;
    fj.setFlipX(false);
    this.aplicarAnim(this.fj, "jump");
    this.alinharNoChao(this.fj);
    const pousoY = fj.y;
    const pousoX = this.plataformaFinal
      ? Math.max(this.plataformaFinal.body.left + 45, fj.x - 140)
      : fj.x - 140;
    this.scene.tweens.add({ targets: fj, x: fj.x - 85, y: pousoY - 70, duration: 240,
      ease: "Sine.Out", onUpdate: () => this.sincronizar(this.fj),
      onComplete: () => this.scene.tweens.add({ targets: fj, x: pousoX, y: pousoY,
        duration: 260, ease: "Sine.In", onUpdate: () => this.sincronizar(this.fj),
        onComplete: () => {
        this.aplicarAnim(this.fj, "idle");
        this.alinharNoChao(this.fj);
        this.dialogo(FALAS_APARICAO, () => this.animarAtaque());
      } }) });
  }

  animarAtaque() {
    if (!this.ativa) return;
    const chave = "slan_final_attack1";
    if (!this.scene.anims.exists(chave)) this.scene.anims.create({ key: chave,
      frames: this.scene.anims.generateFrameNumbers("Slan_attack1", { start: 0, end: 4 }),
      frameRate: 5, repeat: 0 });
    const sprite = this.slan.sprite;
    sprite.play(chave, true);
    sprite.once(`animationcomplete-${chave}`, () => this.dialogo(FALAS_CONFRONTO, () => this.slanVaiEmbora()));
  }

  slanVaiEmbora() {
    if (!this.ativa) return;
    this.aplicarAnim(this.slan, "walk");
    const sprite = this.slan.sprite;
    sprite.setFlipX(true);
    this.scene.camJogo.centerOn(sprite.x - 80, sprite.y - 55);
    const destinoX = this.plataformaFinal
      ? Math.max(this.plataformaFinal.body.left + 45, sprite.x - 650)
      : sprite.x - 650;
    this.scene.tweens.add({ targets: sprite, x: destinoX, duration: 2500,
      ease: "Linear", onUpdate: () => this.alinharNoChao(this.slan), onComplete: () => {
        sprite.setVisible(false);
        this.tocarEfeitoTV(() => this.dialogo(FALAS_FINAL, () => this.fjSai()));
      } });
  }

  fjSai() {
    if (!this.ativa) return;
    const sprite = this.fj.sprite;
    sprite.setFlipX(false);
    this.aplicarAnim(this.fj, "walk");
    const distancia = this.scene.camJogo.width / this.scene.camJogo.zoom / 2 + 250;
    const destinoX = this.plataformaFinal
      ? Math.min(sprite.x + distancia, this.plataformaFinal.body.right - 45)
      : sprite.x + distancia;
    this.scene.tweens.add({ targets: sprite, x: destinoX, duration: 2400,
      ease: "Linear", onUpdate: () => this.alinharNoChao(this.fj), onComplete: () => {
        sprite.setVisible(false);
        this.scene.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.sound.stopAll();
          this.scene.scene.start("CenaCreditos");
        });
        this.scene.cameras.main.fadeOut(900, 0, 0, 0);
      } });
  }

  destruir() {
    this.ativa = false;
    this.scene.events.off("shutdown", this.destruir, this);
    this.tv?.destroy();
    this.somTV?.stop();
  }
}
