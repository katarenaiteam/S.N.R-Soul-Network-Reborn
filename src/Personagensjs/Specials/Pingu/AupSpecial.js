import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

const IMPULSO_Y = -700;
const IMPULSO_X = 140;

export default class PinguAupSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.finalizado = false;
    this.direcao = 1;
    this.hitbox = null;
    this.registroAtaque = null;
    this.alvosAtingidos = new Set();
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    sprite.setVelocityX(0);
    sprite.setVelocity(IMPULSO_X * this.direcao, IMPULSO_Y);
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    if (sprite.anims.currentFrame) {
      this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
    }
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || animacao?.key !== this.special.animacao) return;
    const indice = Number(frame.textureFrame);

    if (indice >= 0 && indice <= 7) this.criarHitbox();
    else this.destruirHitbox();
  }

  criarHitbox() {
    if (this.hitbox) return;
    const { largura, altura } = this.special.hitbox;
    this.hitbox = this.scene.add.zone(0, 0, largura, altura);
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
    const sprite = this.personagem.sprite;
    const cfg = this.special.hitbox;
    this.hitbox.setPosition(
      sprite.x + cfg.offsetX * this.direcao,
      sprite.y + cfg.offsetY,
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
    this.personagem.tocarSomSorteado?.(this.personagem.sons?.heavy, { volume: 0.15 });
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }
    this.atualizarHitbox();
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

PinguAupSpecial.configuracao = {
  animacao: "pingu_AupSpecial",
  logica: PinguAupSpecial,
  cooldown: 1500,
  propriedades: {
    dano: 16,
    tipoSomImpacto: "heavy",
    knockbackX: 240,
    knockbackY: -440,
    tumbling: true,
    travarMovimentoAir: true,
  },
  hitbox: {
    largura: 25,
    altura: 40,
    offsetX: 15,
    offsetY: -83,
  },
};
