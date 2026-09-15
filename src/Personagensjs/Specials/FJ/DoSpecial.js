import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

const DANO_BASE = 20;
const HITBOX = { largura: 65, altura: 125, offsetX: 32, offsetY: -85 };

export default class DoSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.finalizado = false;
    this.dano = DANO_BASE;
    this.hitbox = null;
    this.alvosAtingidos = new Set();
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    sprite.setVelocityX(0);
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    if (sprite.anims.currentFrame) {
      this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
    }
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || animacao?.key !== this.special.animacao) return;
    const indice = Number(frame.textureFrame);
    if (indice === 1) this.criarHitbox();
    if (indice === 4) this.destruirHitbox();
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
    this.hitbox = this.scene.add.zone(0, 0, HITBOX.largura, HITBOX.altura);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.atualizarHitbox();
    registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.acertar(alvo),
    });
  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const sprite = this.personagem.sprite;
    this.hitbox.setPosition(sprite.x + HITBOX.offsetX * this.direcao, sprite.y + HITBOX.offsetY);
    this.hitbox.body.updateFromGameObject();
  }

  acertar(alvo) {
    if (this.finalizado || !this.hitbox?.active || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    alvo.receberDano(this.dano, {
      dano: this.dano,
      tipoSomImpacto: "heavy",
      knockbackX: 240,
      knockbackY: -430,
      tumbling: true,
    }, { direcao: this.direcao, x: this.personagem.sprite.x });
    const som = this.personagem.sons?.heavy;
    if (som) this.personagem.tocarSomSorteado(som, { volume: 0.15 });
  }

  destruirHitbox() {
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  aoCompletarAnimacao() {
    if (this.finalizado) return;
    this.cancelar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) this.estado.finalizarSpecial();
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizado = true;
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.aoAtualizarAnimacao);
    sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    if (sprite.anims.currentAnim?.key === this.special.animacao && sprite.anims.isPaused) {
      sprite.anims.resume();
    }
    this.destruirHitbox();
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}
