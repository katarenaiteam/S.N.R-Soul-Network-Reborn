export default class GokuKaioken {
  constructor(personagem) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.aura = null;
    this.ativo = false;
    this.ultimoUpdate = this.scene.time.now;
  }

  podeAtivar() {
    return !this.ativo &&
      this.scene.time.now >= this.personagem.kaiokenDisponivelEm &&
      this.personagem.cargaKi >= this.personagem.cargaKiMaxima;
  }

  ativar() {
    if (!this.podeAtivar()) return false;
    this.ativo = true;
    this.ultimoUpdate = this.scene.time.now;
    this.personagem.kaiokenAtivo = true;
    this.personagem.kaiokenDisponivelEm = 0;
    this.personagem.bloqueioMovimentoParry?.liberar?.();
    const sprite = this.personagem.sprite;
    sprite.setTint(0xff7777);
    sprite.body.moves = true;
    sprite.body.setAllowGravity(true);
    this.aura = this.scene.add.sprite(sprite.x, sprite.y, "charge_1")
      .setOrigin(0.5, 1)
      .setScale(0.55)
      .setTint(0xff3028)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.72)
      .setDepth(sprite.depth - 1);
    this.aura.play("goku_charge_loop");
    this.scene.camHUD?.ignore(this.aura);
    return true;
  }

  atualizar(delta) {
    if (!this.ativo) return;
    const agora = this.scene.time.now;
    const deltaReal = Math.max(0, delta || agora - this.ultimoUpdate);
    this.ultimoUpdate = agora;
    const sprite = this.personagem.sprite;
    if (!sprite?.active || this.personagem.eliminado) {
      this.encerrar();
      return;
    }

    sprite.body.moves = true;
    sprite.body.setAllowGravity(true);
    this.atualizarAura();
    this.personagem.cargaKi = Math.max(0,
      this.personagem.cargaKi - deltaReal * 0.003,
    );
    this.personagem.porcentagemDano += deltaReal * 0.002;
    if (this.personagem.textoDano) {
      this.personagem.textoDano.setText(`${Math.floor(this.personagem.porcentagemDano)}%`);
    }

    if (this.personagem.cargaKi <= 0) this.encerrar();
  }

  atualizarAura() {
    if (!this.aura?.active) return;
    const sprite = this.personagem.sprite;
    const pulso = 0.55 + Math.sin(this.scene.time.now * 0.006) * 0.025;
    this.aura.setPosition(sprite.x, sprite.y)
      .setScale(pulso)
      .setFlipX(sprite.flipX)
      .setDepth(sprite.depth - 1);
  }

  encerrar() {
    if (!this.ativo) return;
    this.ativo = false;
    this.personagem.kaiokenAtivo = false;
    this.personagem.kaiokenDisponivelEm = this.scene.time.now + 40000;
    this.personagem.sprite?.clearTint();
    this.aura?.destroy();
    this.aura = null;
  }
}
