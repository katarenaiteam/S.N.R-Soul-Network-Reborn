import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class PinguAsiSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.inicio = 0;
    this.iniciado = false;
    this.finalizado = false;
    this.cancelado = false;
    this.direcao = 1;
    this.direcaoDesejada = 1;
    this.velocidadeAtual = 0;
    this.hitbox = null;
    this.registroAtaque = null;
  }

  executar() {
    if (this.iniciado) return;
    this.iniciado = true;
    this.personagem.tocarSomSorteado("pingu-Asi", { volume: this.personagem.sons.volumeVoz });
    this.inicio = this.scene.time.now;

    const esquerda = this.personagem.inputDown("esquerda");
    const direita = this.personagem.inputDown("direita");
    this.direcao = esquerda && !direita
      ? -1
      : direita && !esquerda
        ? 1
        : (this.personagem.sprite.flipX ? -1 : 1);
    this.direcaoDesejada = this.direcao;
    this.velocidadeAtual = this.special.velocidadeInicial;

    const sprite = this.personagem.sprite;
    sprite.setFlipX(this.direcao < 0);
    sprite.setVelocityX(this.velocidadeAtual * this.direcao);
    this.criarHitbox();
  }

  criarHitbox() {
    const sprite = this.personagem.sprite;
    this.hitbox = this.scene.add.zone(sprite.x, sprite.y, 6, this.special.alturaHitbox);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.registroAtaque = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoColidir: () => this.finalizar(),
      aoAtingirAlvo: (alvo) => this.acertar(alvo),
    });
    this.atualizarHitbox();
  }

  atualizarDirecao(delta) {
    const esquerda = this.personagem.inputDown("esquerda");
    const direita = this.personagem.inputDown("direita");
    if (esquerda !== direita) this.direcaoDesejada = esquerda ? -1 : 1;

    if (this.direcaoDesejada !== this.direcao) {
      this.velocidadeAtual = Math.max(
        0,
        this.velocidadeAtual - this.special.desaceleracaoReversao * delta,
      );
      if (this.velocidadeAtual === 0) {
        this.direcao = this.direcaoDesejada;
        this.personagem.sprite.setFlipX(this.direcao < 0);
      }
    } else {
      this.velocidadeAtual = Math.min(
        this.special.velocidadeMaxima,
        this.velocidadeAtual + this.special.aceleracao * delta,
      );
    }
    this.personagem.sprite.setVelocityX(this.velocidadeAtual * this.direcao);
  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const sprite = this.personagem.sprite;
    const progresso = Phaser.Math.Clamp(
      (this.scene.time.now - this.inicio) / this.special.tempoExpansao,
      0,
      1,
    );
    const largura = Phaser.Math.Linear(
      this.special.larguraHitboxInicial,
      this.special.larguraHitboxMaxima,
      1 - (1 - progresso) ** 2,
    );
    this.hitbox.setSize(largura, this.special.alturaHitbox);
    this.hitbox.body?.setSize(largura, this.special.alturaHitbox);
    this.hitbox.setPosition(
      sprite.x + this.special.offsetHitboxX * this.direcao,
      sprite.y + this.special.offsetHitboxY,
    );
    this.hitbox.body?.updateFromGameObject();
  }

  aplicarQuedaLenta() {
    const body = this.personagem.sprite.body;
    if (!body || body.blocked.down) return;
    if (body.velocity.y > this.special.velocidadeMaximaQueda) {
      body.setVelocityY(this.special.velocidadeMaximaQueda);
    }
  }

  acertar(alvo) {
    if (this.finalizado || !alvo?.sprite?.active) return;
    alvo.receberDano(this.special.propriedades.dano, this.special.propriedades, {
      x: this.personagem.sprite.x,
      direcao: this.direcao,
      atacante: this.personagem,
    });
    this.finalizar();
  }

  atualizar() {
    if (!this.iniciado || this.finalizado || this.cancelado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }

    const delta = Math.min(this.scene.game.loop.delta / 1000, 0.05);
    this.atualizarDirecao(delta);
    this.aplicarQuedaLenta();
    this.atualizarHitbox();

    const tempo = this.scene.time.now - this.inicio;
    const soltouSpecial = !this.personagem.inputDown("special") &&
      tempo >= this.special.duracaoMinima;
    if (soltouSpecial || tempo >= this.special.duracaoMaxima) {
      this.finalizar();
    }
  }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.limparHitbox();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
    this.removerDaListaAtiva();
  }

  limparHitbox() {
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    this.cancelado = true;
    this.limparHitbox();
    this.removerDaListaAtiva();
  }
}

PinguAsiSpecial.configuracao = {
  animacao: "pingu_AsiSpecial",
  logica: PinguAsiSpecial,
  finalizarAoTocarChao: true,
  duracaoMinima: 800,
  duracaoMaxima: 7000,
  tempoExpansao: 650,
  velocidadeInicial: 160,
  velocidadeMaxima: 645,
  aceleracao: 900,
  desaceleracaoReversao: 760,
  velocidadeMaximaQueda: 85,
  larguraHitboxInicial: 15,
  larguraHitboxMaxima: 68,
  alturaHitbox: 30,
  offsetHitboxX: 0,
  offsetHitboxY: -110,
  propriedades: {
    tipoSomImpacto: "heavy",
    dano: 18,
    knockbackX: 559,
    knockbackY: -468,
    tumbling: true,
    travarMovimentoAir: true,
  },
};
