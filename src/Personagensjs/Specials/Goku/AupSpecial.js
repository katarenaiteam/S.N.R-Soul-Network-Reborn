import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class GokuAupSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.finalizado = false;
    this.hitbox = null;
    this.registroAtaque = null;
    this.alvosAtingidos = new Set();
    this.direcao = 1;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    sprite.setVelocity(0, this.special.propriedades.impulsoY);
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || animacao?.key !== this.special.animacao || !frame) return;
    if (Number(frame.textureFrame) >= this.special.hitbox.frameInicio) {
      this.criarHitbox();
    } else {
      this.destruirHitbox();
    }
  }

  criarHitbox() {
    if (this.hitbox) return;
    const cfg = this.special.hitbox;
    this.hitbox = this.scene.add.zone(0, 0, cfg.largura, cfg.altura);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.registroAtaque = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.acertar(alvo),
    });
    this.atualizarHitbox();
  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const cfg = this.special.hitbox;
    this.hitbox.setPosition(
      this.personagem.sprite.x + cfg.offsetX * this.direcao,
      this.personagem.sprite.y + cfg.offsetY,
    );
    this.hitbox.body.updateFromGameObject();
  }

  acertar(alvo) {
    if (this.finalizado || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    alvo.receberDano(this.special.propriedades.dano, this.special.propriedades, {
      direcao: this.direcao,
      x: this.personagem.sprite.x,
      atacante: this.personagem,
    });
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }
    this.atualizarControleLateral();
    this.atualizarHitbox();
  }

  atualizarControleLateral() {
    const sprite = this.personagem.sprite;
    const esquerda = this.personagem.inputDown("esquerda");
    const direita = this.personagem.inputDown("direita");
    if (esquerda !== direita) {
      sprite.setVelocityX((direita ? 1 : -1) * this.special.velocidadeLateral);
      return;
    }

    const delta = Math.min(this.scene.game.loop.delta / 1000, 0.05);
    const velocidade = sprite.body.velocity.x;
    const reducao = this.special.desaceleracaoLateral * delta;
    sprite.setVelocityX(
      Math.abs(velocidade) <= reducao
        ? 0
        : velocidade - Math.sign(velocidade) * reducao,
    );
  }

  aoCompletarAnimacao() {
    if (this.finalizado) return;
    this.cancelar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
  }

  destruirHitbox() {
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizado = true;
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.aoAtualizarAnimacao);
    sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    this.destruirHitbox();
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}

GokuAupSpecial.configuracao = {
  animacao: "gk_AupSpecial",
  configuracaoAnimacao: "AupSpecial",
  logica: GokuAupSpecial,
  propriedades: {
    velocidadeAerea: 100,
    impulsoY: -650,
    tipoSomImpacto: "heavy",
    dano: 15,
    knockbackX: 150,
    knockbackY: -760,
    hitstunBaseFrames: 30,
    tumbling: true,
  },
  velocidadeLateral: 100,
  desaceleracaoLateral: 700,
  hitbox: {
    frameInicio: 3,
    largura: 76,
    altura: 92,
    offsetX: 0,
    offsetY: -102,
  },
};
