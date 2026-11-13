import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class AigisAdoSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.quadroAtual = -1;
    this.hitbox = null;
    this.registroAtaque = null;
    this.colisorChao = null;
    this.alvosAtingidos = new Set();
    this.acertouDuranteEstocada = false;
    this.recuoAplicado = false;
    this.finalizado = false;
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
    if (this.finalizado || animacao?.key !== this.special.animacao || !frame) return;
    const quadro = Number(frame.textureFrame);
    if (quadro === this.quadroAtual) return;
    this.quadroAtual = quadro;
    if (quadro === this.special.quadroRecuo && this.acertouDuranteEstocada) {
      this.aplicarRecuo();
    }
    if (quadro >= this.special.quadroHitboxInicio && quadro <= this.special.quadroHitboxFim) {
      this.criarHitbox();
      this.atualizarHitbox();
    } else {
      this.destruirHitbox();
    }
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }
    this.atualizarHitbox();
  }

  criarHitbox() {
    if (this.hitbox) return;
    this.hitbox = this.scene.add.zone(0, 0, 1, 1);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.registroAtaque = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.atingirAlvo(alvo),
    });

    const plataformas = this.scene.mapaAtual?.plataformas
      || this.scene.plataformas
      || this.scene.chao;
    if (plataformas) {
      this.colisorChao = this.scene.physics.add.overlap(
        this.hitbox,
        plataformas,
        () => {
          if (this.quadroAtual === this.special.quadroRecuo) this.aplicarRecuo();
        },
      );
    }
  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const sprite = this.personagem.sprite;
    const cfg = this.special.hitboxPorQuadro[this.quadroAtual];
    this.hitbox.setSize(cfg.largura, cfg.altura);
    this.hitbox.body.setSize(cfg.largura, cfg.altura);
    this.hitbox.setPosition(
      sprite.x + cfg.offsetX * this.direcao,
      sprite.y + cfg.offsetY,
    );
    this.hitbox.body.updateFromGameObject();
  }

  atingirAlvo(alvo) {
    if (this.finalizado || !this.hitbox?.active || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    alvo.receberDano(this.special.propriedades.dano, this.special.propriedades, {
      x: this.personagem.sprite.x,
      direcao: this.direcao,
      atacante: this.personagem,
    });
    this.acertouDuranteEstocada = true;
    if (this.quadroAtual === this.special.quadroRecuo) this.aplicarRecuo();
  }

  aplicarRecuo() {
    if (this.recuoAplicado || this.finalizado) return;
    this.recuoAplicado = true;
    this.personagem.sprite.setVelocity(
      -this.special.impulsoRecuoX * this.direcao,
      -this.special.impulsoRecuoY,
    );
  }

  destruirHitbox() {
    if (this.colisorChao?.world) this.scene.physics.world.removeCollider(this.colisorChao);
    this.colisorChao = null;
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  aoCompletarAnimacao() {
    if (this.finalizado) return;
    this.finalizar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
  }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.aoAtualizarAnimacao);
    sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    this.destruirHitbox();
    this.removerDaListaAtiva();
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    this.finalizar();
  }
}

AigisAdoSpecial.configuracao = {
  animacao: "ai_AdoSpecial",
  logica: AigisAdoSpecial,
  configuracaoAnimacao: "AdoSpecial",
  cooldown: 1000,
  quadroHitboxInicio: 7,
  quadroHitboxFim: 8,
  quadroRecuo: 8,
  impulsoRecuoX: 170,
  impulsoRecuoY: 210,
  hitboxPorQuadro: {
    7: { largura: 42, altura: 42, offsetX: 55, offsetY: -18 },
    8: { largura: 60, altura: 60, offsetX: 68, offsetY: -4 },
  },
  propriedades: {
    impulsoX: 130,
    impulsoY: -150,
    travarMovimentoAir: true,
    dano: 20,
    knockbackX: 110,
    knockbackY: 560,
    knockbackFixo: false,
    tumbling: true,
    quiqueChaoY: 400,
  },
};
