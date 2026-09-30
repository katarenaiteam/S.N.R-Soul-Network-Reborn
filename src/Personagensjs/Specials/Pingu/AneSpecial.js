import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class PinguAneSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.projetil = null;
    this.registroAtaque = null;
    this.colisorCenario = null;
    this.timerVida = null;
    this.disparado = false;
    this.finalizando = false;
    this.cancelado = false;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
    this.travarNoAr();
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (
      this.disparado ||
      this.cancelado ||
      animacao?.key !== this.special.animacao ||
      Number(frame?.textureFrame) !== this.special.quadroDisparo
    ) return;

    this.disparado = true;
    this.personagem.sprite.off("animationupdate", this.aoAtualizarAnimacao);
    this.criarProjetil();
  }

  travarNoAr() {
    if (
      this.personagem.maquinaEstados.estadoAtual !== this.estado ||
      this.estado.logicaSpecial !== this ||
      this.personagem.sprite.body.blocked.down
    ) return;

    this.personagem.sprite.setVelocityX(0);
    this.personagem.sprite.setVelocityY(40);
  }

  criarProjetil() {
    const lutador = this.personagem.sprite;
    if (this.cancelado || !lutador?.active) return;

    const x = lutador.x + this.special.offsetProjetilX * this.direcao;
    const y = lutador.y + this.special.offsetProjetilY;
    const faisca = this.scene.add.sprite(x, y, "Pingu_aBall", 0);
    faisca
      .setFlipX(this.direcao < 0)
      .setScale(this.special.escalaFaisca)
      .setDepth(lutador.depth + 1)
      .play("pingu_aBall_faisca");
    this.scene.camHUD?.ignore(faisca);
    faisca.once("animationcomplete-pingu_aBall_faisca", () => faisca.destroy());

    this.origemX = x;
    this.projetil = this.scene.physics.add.sprite(x, y, "Pingu_aBall", 7);
    this.projetil
      .setFlipX(this.direcao < 0)
      .setScale(this.special.escalaProjetil)
      .setDepth(lutador.depth + 1);
    this.scene.camHUD?.ignore(this.projetil);
    this.projetil.body.setAllowGravity(false);
    this.projetil.body.setSize(this.special.larguraProjetil, this.special.alturaProjetil);
    this.projetil.body.setVelocityX(this.special.velocidadeProjetil * this.direcao);
    this.projetil.anims.play("pingu_aBall_loop");

    this.registroAtaque = registrarAtaqueEspecial(this, this.projetil, {
      categoria: "projetil",
      aoColidir: () => this.finalizarProjetil(true),
      aoAtingirAlvo: (alvo) => this.acertarAlvo(alvo),
    });

    const plataformas = this.scene.mapaAtual?.plataformas
      || this.scene.plataformas
      || this.scene.chao;
    if (plataformas) {
      this.colisorCenario = this.scene.physics.add.collider(
        this.projetil,
        plataformas,
        () => this.finalizarProjetil(true),
      );
    }

    this.timerVida = this.scene.time.delayedCall(
      this.special.tempoProjetil,
      () => this.finalizarProjetil(false),
    );
  }

  acertarAlvo(alvo) {
    if (this.finalizando || !this.projetil?.active) return;
    const direcao = this.projetil.flipX ? -1 : 1;
    alvo.receberDano(this.special.propriedades.dano, this.special.propriedades, {
      x: this.projetil.x,
      direcao,
    });
    this.finalizarProjetil(true);
  }

  finalizarProjetil(comExplosao) {
    if (this.finalizando) return;
    this.finalizando = true;
    this.limparColisores();
    this.timerVida?.remove(false);
    this.timerVida = null;
    this.registroAtaque?.remover();
    this.registroAtaque = null;

    const projetil = this.projetil;
    this.projetil = null;
    if (projetil?.active) {
      const x = projetil.x;
      const y = projetil.y;
      const depth = projetil.depth;
      projetil.body.stop();
      projetil.body.enable = false;
      projetil.destroy();

      if (comExplosao) this.criarExplosao(x, y, depth);
    }

    this.removerDaListaAtiva();
  }

  criarExplosao(x, y, depth) {
    const explosao = this.scene.add.sprite(x, y, "Pingu_aExplosion", 0);
    explosao
      .setScale(this.special.escalaExplosao)
      .setDepth(depth + 1)
      .play("pingu_aExplosion");
    this.scene.camHUD?.ignore(explosao);
    explosao.once("animationcomplete-pingu_aExplosion", () => explosao.destroy());
  }

  limparColisores() {
    if (this.colisorCenario?.active) this.colisorCenario.destroy();
    this.colisorCenario = null;
  }

  atualizar() {
    this.travarNoAr();
    if (
      this.projetil?.active &&
      Math.abs(this.projetil.x - this.origemX) > this.special.distanciaMaxima
    ) {
      this.finalizarProjetil(false);
    }
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    this.personagem.sprite.off("animationupdate", this.aoAtualizarAnimacao);
    if (this.projetil?.active) return;
    this.cancelado = true;
    this.timerVida?.remove(false);
    this.timerVida = null;
    this.limparColisores();
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.removerDaListaAtiva();
  }
}

PinguAneSpecial.configuracao = {
  animacao: "pingu_AneSpecial",
  logica: PinguAneSpecial,
  duracao: 700,
  cooldown: 2000,
  quadroDisparo: 5,
  offsetProjetilX: 50,
  offsetProjetilY: -54,
  velocidadeProjetil: 660,
  distanciaMaxima: 1400,
  tempoProjetil: 5000,
  escalaProjetil: 0.16,
  escalaFaisca: 0.12,
  larguraProjetil: 90,
  alturaProjetil: 75,
  escalaExplosao: 1,
  propriedades: {
    travarMovimentoAir: true,
    tipoSomImpacto: "heavy",
    dano: 8,
    knockbackX: 320,
    knockbackY: -230,
    tumbling: false,
  },
};
