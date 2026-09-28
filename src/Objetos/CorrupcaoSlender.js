export default class CorrupcaoSlender {
  constructor(personagem) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.valor = 0;
    this.proximoDano = 0;
    this.proximoRuido = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.renderizadores = {};
    // Desloca somente o desenho, preservando corpo e hurtboxes.
    const efeito = this;
    const metodoWebGL = personagem.sprite.renderWebGLStep ? "renderWebGLStep" : "renderWebGL";
    for (const metodo of [metodoWebGL, "renderCanvas"]) {
      const original = personagem.sprite[metodo];
      this.renderizadores[metodo] = original;
      personagem.sprite[metodo] = function (...args) {
        const x = this.x;
        const y = this.y;
        this.x += efeito.offsetX;
        this.y += efeito.offsetY;
        try {
          return original.apply(this, args);
        } finally {
          this.x = x;
          this.y = y;
        }
      };
    }
    this.scene.events.on("postupdate", this.atualizar, this);
    this.scene.events.once("shutdown", this.destruir, this);
    personagem.sprite.once("destroy", this.destruir, this);
  }

  adicionar(quantidade) {
    const anterior = this.valor;
    this.valor = Math.min(100, this.valor + quantidade);
    if (anterior < 30 && this.valor >= 30) this.proximoDano = this.scene.time.now + 6000;
  }

  criarVisuais() {
    if (!this.tvFragments) this.tvFragments = [];
    while (this.tvFragments.length < 12) {
      const fragmento = this.scene.add.sprite(0, 0, "Slan_tv", 0)
        .setVisible(false).setBlendMode("SCREEN");
      this.tvFragments.push(fragmento);
      this.scene.camHUD?.ignore(fragmento);
    }
    const hud = this.personagem.textoDano;
    if (!hud || this.efeitoHUD) return;
    return;
    const larguraHUD = hud.list?.[0]?.displayWidth || hud.barraUlt?.displayWidth || 440;
    const alturaHUD = hud.list?.[0]?.displayHeight || hud.barraUlt?.displayHeight || 357;
    if (!this.scene.anims.exists("miku-telao-ruido")) {
      this.scene.anims.create({
        key: "miku-telao-ruido",
        frames: this.scene.anims.generateFrameNumbers("efeito-baner"),
        frameRate: 12,
        repeat: -1,
      });
    }
    this.efeitoHUD = this.scene.add.sprite(0, 0, "efeito-baner")
      .setVisible(false).setScrollFactor(0).setDepth(1100)
      .setBlendMode(Phaser.BlendModes.SCREEN).setAlpha(0.9).play("miku-telao-ruido");
    if (hud.retrato?.createBitmapMask) {
      this.efeitoHUD.setMask(hud.retrato.createBitmapMask());
    }
    hud.add(this.efeitoHUD);
    this.scene.camJogo?.ignore(this.efeitoHUD);
  }

  atualizar() {
    const p = this.personagem;
    const sprite = p.sprite;
    if (p.emMorteVS || p.eliminado || !sprite.active) {
      this.limpar();
      return;
    }
    if (this.valor < 30) return;
    this.criarVisuais();
    const agora = this.scene.time.now;
    const estagio = this.valor >= 90 ? 3 : this.valor >= 60 ? 2 : 1;
    const intensidade = (this.valor - 30) / 70;
    if (agora >= this.proximoDano) {
      const ciclos = Math.floor((agora - this.proximoDano) / 6000) + 1;
      p.porcentagemDano += [0, 2, 4, 8][estagio] * ciclos;
      p.textoDano?.setText(`${Math.floor(p.porcentagemDano)}%`);
      this.proximoDano += ciclos * 6000;
    }
    if (agora >= this.proximoRuido) {
      this.proximoRuido = agora + (estagio === 3 ? 45 : 90);
      const quantidade = estagio === 3 ? 12 : estagio === 2 ? 8 : 4;
      this.tvFragments.forEach((fragmento, indice) => {
        const ativo = indice < quantidade && sprite.visible && Math.random() < 0.45 + intensidade * 0.5;
        fragmento.setFrame(Phaser.Math.Between(0, 2)).setVisible(ativo)
          .setAlpha(0.3 + intensidade * 0.55);
        if (ativo) {
          fragmento.setPosition(
            sprite.x + Phaser.Math.Between(-sprite.displayWidth / 2, sprite.displayWidth / 2),
            sprite.y - Phaser.Math.Between(10, sprite.displayHeight - 10),
          ).setDisplaySize(
            Phaser.Math.Between(12, 30) * (1 + intensidade * 0.5),
            Phaser.Math.Between(12, 34) * (1 + intensidade * 0.5),
          ).setDepth(sprite.depth + 1);
        }
      });
      const amplitude = estagio === 3 ? 5 : estagio === 2 ? 2 : 0;
      this.offsetX = Phaser.Math.Between(-amplitude, amplitude);
      this.offsetY = Phaser.Math.Between(-amplitude, amplitude);
    }
    if (!sprite.visible) this.tvFragments?.forEach(fragmento => fragmento.setVisible(false));
  }

  limpar() {
    this.valor = 0;
    this.proximoDano = 0;
    this.proximoRuido = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.tvFragments?.forEach(fragmento => fragmento.setVisible(false));
  }

  destruir() {
    this.scene.events.off("postupdate", this.atualizar, this);
    this.scene.events.off("shutdown", this.destruir, this);
    const sprite = this.personagem.sprite;
    sprite.off("destroy", this.destruir, this);
    for (const [metodo, original] of Object.entries(this.renderizadores)) sprite[metodo] = original;
    this.tvFragments?.forEach(fragmento => fragmento.destroy());
  }
}
