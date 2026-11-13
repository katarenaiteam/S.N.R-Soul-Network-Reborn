import {
  obterAlvosCombate,
  registrarAtaqueEspecial,
} from "../../../Objetos/SistemaCombateEspecial.js";

export default class AigisAneSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.minaLancada = false;
    this.finalizado = false;
    this.minasAtivas = personagem.minasAtivasAigis ??= new Set();
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (
      this.finalizado ||
      this.minaLancada ||
      animacao?.key !== this.special.animacao ||
      Number(frame?.textureFrame) !== this.special.quadroLancamento
    ) return;

    this.minaLancada = true;
    this.criarMina();
  }

  criarMina() {
    const lutador = this.personagem.sprite;
    if (!lutador?.active) return;

    while (this.minasAtivas.size >= this.special.limiteMinas) {
      this.minasAtivas.values().next().value?.destroy();
    }

    const x = lutador.x + this.special.offsetMinaX * this.direcao;
    const y = lutador.y + this.special.offsetMinaY;
    const mina = this.scene.physics.add.sprite(x, y, "ai_mina", 0)
      .setScale(this.special.escalaMina)
      .setDepth(lutador.depth + 1)
      .setCollideWorldBounds(true);
    mina.body.setSize(this.special.larguraMina, this.special.alturaMina);
    mina.anims.play("ai_mina_queda");
    this.scene.camHUD?.ignore(mina);

    const plataformas = this.scene.mapaAtual?.plataformas
      || this.scene.plataformas
      || this.scene.chao;
    const colisor = plataformas
      ? this.scene.physics.add.collider(mina, plataformas, () => {
          if (mina.body.blocked.down) this.ativarMina(mina, colisor);
        })
      : null;

    const registroMina = {
      colisor,
      ataque: null,
      timer: null,
      verificarProximidade: null,
    };
    this.minasAtivas.add(mina);
    mina.once("destroy", () => this.limparMina(mina, registroMina));
    mina.setData("registroMina", registroMina);
    registroMina.ataque = registrarAtaqueEspecial(this, mina, {
      categoria: "projetil",
      aoColidir: () => mina.destroy(),
    });
  }

  ativarMina(mina, colisor) {
    if (!mina.active || mina.getData("armada")) return;
    mina.setData("armada", true);
    mina.body.setVelocity(0, 0);
    mina.body.setAllowGravity(false);
    if (colisor?.world) this.scene.physics.world.removeCollider(colisor);
    mina.setFrame(3).anims.play("ai_mina_ativa");

    const registroMina = mina.getData("registroMina");
    registroMina.colisor = null;
    registroMina.verificarProximidade = () => {
      if (!mina.active) return;
      const limite = this.special.raioProximidade;
      const alvoProximo = obterAlvosCombate(this.personagem).some((alvo) =>
        Phaser.Math.Distance.Between(mina.x, mina.y, alvo.sprite.x, alvo.sprite.y) <= limite
      );
      if (alvoProximo) this.explodir(mina);
    };
    this.scene.events.on("postupdate", registroMina.verificarProximidade);
    registroMina.timer = this.scene.time.delayedCall(
      this.special.tempoAtiva,
      () => this.explodir(mina),
    );
  }

  limparMina(mina, registroMina) {
    this.minasAtivas.delete(mina);
    if (registroMina.colisor?.world) this.scene.physics.world.removeCollider(registroMina.colisor);
    registroMina.ataque?.remover();
    registroMina.timer?.remove(false);
    if (registroMina.verificarProximidade) {
      this.scene.events.off("postupdate", registroMina.verificarProximidade);
    }
    mina.setData("registroMina", null);
  }

  explodir(mina) {
    if (!mina.active || mina.getData("explodindo")) return;
    mina.setData("explodindo", true);
    const registroMina = mina.getData("registroMina");
    const x = mina.x;
    const y = mina.y;
    const profundidade = mina.depth;
    mina.destroy();

    const efeito = this.scene.add.sprite(x, y, "ai_siExp", 0)
      .setScale(this.special.escalaExplosao)
      .setDepth(profundidade + 1);
    efeito.anims.play("ai_granada_explosao");
    this.scene.camHUD?.ignore(efeito);

    const hitbox = this.scene.add.zone(x, y, this.special.larguraExplosao, this.special.alturaExplosao);
    this.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    hitbox.body.debugBodyColor = 0xff0000;
    const atingidos = new Set();
    registrarAtaqueEspecial(this, hitbox, {
      categoria: "corpo",
      aoAtingirAlvo: (alvo) => {
        if (atingidos.has(alvo)) return;
        atingidos.add(alvo);
        alvo.receberDano(this.special.propriedades.dano, this.special.propriedades, {
          x,
          direcao: alvo.sprite.x >= x ? 1 : -1,
          atacante: this.personagem,
        });
      },
    });

    const timerHitbox = this.scene.time.delayedCall(
      this.special.duracaoHitboxExplosao,
      () => hitbox.destroy(),
    );
    efeito.once("animationcomplete-ai_granada_explosao", () => {
      timerHitbox.remove(false);
      hitbox.destroy();
      efeito.destroy();
    });
    registroMina.timer?.remove(false);
  }

  aoCompletarAnimacao() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.desconectarAnimacao();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
    this.removerDaListaAtiva();
  }

  desconectarAnimacao() {
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.aoAtualizarAnimacao);
    sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.desconectarAnimacao();
    this.removerDaListaAtiva();
  }
}

AigisAneSpecial.configuracao = {
  animacao: "ai_AneSpecial",
  logica: AigisAneSpecial,
  configuracaoAnimacao: "AneSpecial",
  cooldown: 1000,
  quadroLancamento: 2,
  limiteMinas: 2,
  escalaMina: 0.5,
  offsetMinaX: 42,
  offsetMinaY: -82,
  larguraMina: 42,
  alturaMina: 42,
  raioProximidade: 48,
  tempoAtiva: 10000,
  escalaExplosao: 1.25,
  larguraExplosao: 120,
  alturaExplosao: 130,
  duracaoHitboxExplosao: 400,
  propriedades: {
    impulsoX: -220,
    impulsoY: -300,
    travarMovimentoAir: true,
    dano: 15,
    knockbackX: 250,
    knockbackY: -400,
    knockbackFixo: false,
  },
};
