export default class SpiderAupSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.teia = null;
    this.extra = null;
    this.ponta = null;
    this.colliders = [];
    this.timerDisparo = null;
    this.timerFim = null;
    this.fase = "pose";
    this.finalizado = false;
  }

  executar() {
    const sprite = this.personagem?.sprite;
    if (!sprite?.body || sprite.body.blocked.down) {
      this.estado?.finalizarSpecial?.();
      return;
    }

    sprite.body.setVelocity(0, 0);
    this.timerDisparo = this.scene.time.delayedCall(
      this.special.atrasoDisparo ?? 100,
      () => this.dispararTeia()
    );
  }

  dispararTeia() {
    if (this.finalizado || !this.personagem?.sprite?.active) return;
    this.timerDisparo = null;
    this.fase = "grow";

    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    const x = sprite.x + 28 * this.direcao;
    const y = sprite.y - 72;

    this.teia = this.criarVisual(x, y, "teiagrow", "spy_teia_grow");
    this.ponta = this.scene.add.zone(x, y, 28, 28);
    this.scene.physics.add.existing(this.ponta);
    this.ponta.body.setAllowGravity(false);
    this.ponta.body.setVelocity(540 * this.direcao, -720);
    this.ponta.body.debugBodyColor = 0x00ffff;

    this.obterEstruturas().forEach((estrutura) => {
      this.colliders.push(
        this.scene.physics.add.collider(this.ponta, estrutura, () => this.ancorar())
      );
    });

    this.teia.once("animationcomplete-spy_teia_grow", () => {
      if (!this.finalizado && this.fase === "grow") this.estenderTeia();
    });
  }

  estenderTeia() {
    if (!this.ponta?.active || !this.teia?.active) return;
    this.fase = "extra";

    const offset = this.obterOffsetSegmento();
    this.extra = this.criarVisual(
      this.ponta.x + offset.x,
      this.ponta.y + offset.y,
      "extragrow",
      "spy_extra_grow"
    );
    this.extra.once("animationcomplete-spy_extra_grow", () => {
      if (!this.finalizado && this.fase === "extra") this.falhar();
    });
  }

  criarVisual(x, y, textura, animacao) {
    const visual = this.scene.add.sprite(x, y, textura, 0)
      .setOrigin(this.direcao > 0 ? 1 : 0, 0.5)
      .setFlipX(this.direcao < 0)
      .setAngle(this.direcao > 0 ? -52 : 52)
      .setDepth(this.personagem.sprite.depth - 1);
    visual.play(animacao, true);
    this.ignorarNoHud(visual);
    return visual;
  }

  obterOffsetSegmento() {
    // Um pouco de sobreposição evita o vão transparente entre os sprites.
    return { x: -108 * this.direcao, y: 139 };
  }

  obterEstruturas() {
    return [
      this.scene.mapaAtual?.plataformas,
      this.scene.plataformas,
      this.scene.chao,
    ].filter((estrutura, indice, lista) =>
      estrutura && lista.indexOf(estrutura) === indice
    );
  }

  ancorar() {
    if (this.finalizado || !this.ponta?.active) return;
    this.finalizado = true;
    this.fase = "ancorada";
    this.ponta.body.setVelocity(0, 0);
    this.tocarQuebra();

    const sprite = this.personagem.sprite;
    const props = this.special.propriedades || {};
    sprite.body.setVelocity(
      (props.impulsoAoAncorarX ?? 230) * this.direcao,
      props.impulsoAoAncorarY ?? -780
    );
    sprite.anims.play("spy_jump", true);
    this.agendarFinalizacao();
  }

  falhar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.fase = "falhou";
    if (this.ponta?.body) this.ponta.body.setVelocity(0, 0);
    this.tocarQuebra();
    this.agendarFinalizacao();
  }

  tocarQuebra() {
    [this.teia, this.extra].forEach((visual) => {
      if (!visual?.active) return;
      visual.setTexture("teiabroke", 0);
      visual.play("spy_teia_broke", true);
    });
  }

  agendarFinalizacao() {
    this.removerColliders();
    this.timerFim = this.scene.time.delayedCall(170, () => {
      this.timerFim = null;
      this.limpar();
      if (this.personagem.maquinaEstados?.estadoAtual === this.estado) {
        this.estado.finalizarSpecial();
      }
    });
  }

  atualizar() {
    if (!this.ponta?.active) return;
    this.teia?.setPosition(this.ponta.x, this.ponta.y);
    if (this.extra?.active) {
      const offset = this.obterOffsetSegmento();
      this.extra.setPosition(this.ponta.x + offset.x, this.ponta.y + offset.y);
    }
  }

  ignorarNoHud(objeto) {
    const hud = this.scene.camHUD || this.scene.cameraHUD || this.scene.hudCamera;
    hud?.ignore?.(objeto);
  }

  removerColliders() {
    this.colliders.forEach((collider) => collider?.destroy());
    this.colliders = [];
  }

  limpar() {
    this.removerColliders();
    this.teia?.destroy();
    this.extra?.destroy();
    this.ponta?.destroy();
    this.teia = null;
    this.extra = null;
    this.ponta = null;
  }

  cancelar() {
    this.timerDisparo?.remove(false);
    this.timerFim?.remove(false);
    this.timerDisparo = null;
    this.timerFim = null;
    this.limpar();
  }
}
