export default class CongelamentoPingu {
  constructor(personagem) {
    this.personagem = personagem;
    this.valor = 0;
    this.congelado = false;
    this.ultimaAplicacao = 0;
    this.ultimoUpdate = personagem.scene.time.now;
    this.tintAtual = null;
    this.velocidadeBase = personagem.velocidade;
  }

  adicionar(quantidade) {
    if (!Number.isFinite(quantidade) || quantidade <= 0 || this.congelado) return;
    this.valor = Math.min(100, this.valor + quantidade);
    this.ultimaAplicacao = this.personagem.scene.time.now;
    this.atualizarVisual();
    if (this.valor >= 100) this.congelar();
  }

  atualizar() {
    const agora = this.personagem.scene.time.now;
    const delta = Math.min(Math.max(0, agora - this.ultimoUpdate) / 1000, 0.1);
    this.ultimoUpdate = agora;

    if (this.personagem.eliminado || this.personagem.emMorteVS || !this.personagem.sprite.active) {
      this.limpar();
      return;
    }

    this.atualizarVelocidade();
    if (this.valor <= 0 || agora - this.ultimaAplicacao < CongelamentoPingu.ATRASO_DECAIMENTO) return;
    this.valor = Math.max(0, this.valor - CongelamentoPingu.DECAIMENTO_POR_SEGUNDO * delta);
    if (this.valor <= 0) {
      this.limpar();
      return;
    }
    if (this.congelado && this.valor <= CongelamentoPingu.LIMITE_DESCONGELAR) {
      this.descongelar();
    }
    this.atualizarVisual();
    this.atualizarVelocidade();
  }

  congelar() {
    if (this.congelado) return;
    const { sprite } = this.personagem;
    const body = sprite.body;
    this.congelado = true;
    this.estadoSalvo = {
      gravidade: body.allowGravity,
      imovel: body.immovable,
      velocidadeX: body.velocity.x,
      velocidadeY: body.velocity.y,
      animacaoPausada: sprite.anims.isPaused,
    };
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setVelocity(0, 0);
    sprite.anims.pause();
    this.atualizarVisual();
  }

  manterCongelado() {
    if (!this.congelado) return;
    const sprite = this.personagem.sprite;
    const body = sprite.body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
    body.setImmovable(true);
    sprite.anims.pause();
    this.atualizarVisual(true);
  }

  descongelar() {
    if (!this.congelado) return;
    const { sprite } = this.personagem;
    const body = sprite.body;
    const salvo = this.estadoSalvo;
    this.congelado = false;
    this.estadoSalvo = null;
    if (body && salvo) {
      body.setAllowGravity(salvo.gravidade);
      body.setImmovable(salvo.imovel);
      body.setVelocity(salvo.velocidadeX, salvo.velocidadeY);
    }
    if (sprite?.active && !salvo?.animacaoPausada) sprite.anims.resume();
  }

  atualizarVisual(forcar = false) {
    const sprite = this.personagem.sprite;
    if (!sprite?.active || this.valor <= 0) return;
    const progresso = Phaser.Math.Clamp(this.valor / 100, 0, 1) ** 0.7;
    const vermelho = Math.round(255 - 155 * progresso);
    const verde = Math.round(255 - 66 * progresso);
    const azul = 255;
    const cor = (vermelho << 16) | (verde << 8) | azul;
    if (!forcar && cor === this.tintAtual) return;
    this.tintAtual = cor;
    sprite.setTint(cor).setTintMode(Phaser.TintModes.NORMAL);
  }

  atualizarVelocidade() {
    const progresso = Phaser.Math.Clamp(this.valor / 100, 0, 1);
    this.personagem.velocidade = this.velocidadeBase * (1 - 0.65 * progresso);
  }

  limpar() {
    this.valor = 0;
    this.ultimaAplicacao = 0;
    this.personagem.velocidade = this.velocidadeBase;
    if (this.congelado) this.descongelar();
    const sprite = this.personagem.sprite;
    this.tintAtual = null;
    if (sprite?.active) {
      if (this.personagem.estadoInvencible?.ativo) {
        this.personagem.estadoInvencible.atualizarBrilho(0, 0);
      } else {
        sprite.clearTint();
      }
    }
  }
}

CongelamentoPingu.ATRASO_DECAIMENTO = 1500;
CongelamentoPingu.DECAIMENTO_POR_SEGUNDO = 6;
CongelamentoPingu.LIMITE_DESCONGELAR = 80;
