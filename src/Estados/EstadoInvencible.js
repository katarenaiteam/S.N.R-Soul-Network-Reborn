// Estado temporario paralelo: nao substitui movimento, ataques ou especiais.
export default class EstadoInvencible {
  constructor(personagem) {
    this.personagem = personagem;
    this.ativo = false;
    this.encerrarNaSaida = () => this.sair(false);
    this.atualizarBrilho = (_tempo, delta) => {
      // O emissor pode ainda executar um callback removido durante este frame.
      if (!this.ativo) return;
      this.tempoBrilho += delta;
      const intensidade = (1 - Math.cos(this.tempoBrilho * Math.PI * 2 / 300)) / 2;
      const canal = Math.round(intensidade * 235);
      this.personagem.sprite
        .setTint((canal << 16) | (canal << 8) | canal)
        .setTintMode(Phaser.TintModes.SCREEN);
    };
  }

  entrar(duracao = 5000) {
    this.sair(false);
    this.ativo = true;
    const { scene, sprite } = this.personagem;
    this.personagem.destruirHurtboxes();
    this.tempoBrilho = 0;
    this.atualizarBrilho(0, 0);
    scene.events.on("update", this.atualizarBrilho);
    this.expiracao = scene.time.delayedCall(duracao, () => this.sair());
    scene.events.once("shutdown", this.encerrarNaSaida);
  }

  aoAcertarAtaque() {
    this.sair();
  }

  sair(restaurarHurtboxes = true) {
    if (!this.ativo) return;
    this.ativo = false;
    this.expiracao?.remove(false);
    this.expiracao = null;
    const { scene, sprite } = this.personagem;
    scene.events.off("shutdown", this.encerrarNaSaida);
    scene.events.off("update", this.atualizarBrilho);
    sprite?.clearTint();
    if (sprite?.active && restaurarHurtboxes && !this.personagem.eliminado) {
      this.personagem.sincronizarHurtbox();
    }
  }
}
