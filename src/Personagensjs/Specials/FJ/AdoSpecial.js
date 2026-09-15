import DoSpecial from "./DoSpecial.js";

const VELOCIDADE_X = 460;
const VELOCIDADE_Y = 720;
const DURACAO_EXPLOSAO = 180;

export default class AdoSpecial extends DoSpecial {
  executar() {
    this.fase = "preparo";
    this.gravidadeOriginal = this.personagem.sprite.body.allowGravity;
    this.personagem.sprite.body.setAllowGravity(false);
    this.personagem.sprite.setVelocityY(0);
    super.executar();
    this.aoFimGround = () => this.finalizar();
    this.personagem.sprite.once("animationcomplete-fj_ground", this.aoFimGround);
  }

  aoAtualizarAnimacao(anim, frame) {
    if (this.finalizado || anim?.key !== this.special.animacao) return;
    if (Number(frame.textureFrame) >= 2 && this.fase === "preparo") {
      this.fase = "mergulho";
      this.criarHitbox();
    }
  }

  // A animacao termina, mas a pose de mergulho permanece ate a aterrissagem.
  aoCompletarAnimacao() {}

  atualizar() {
    if (this.finalizado) return;
    const sprite = this.personagem.sprite;
    if (!sprite?.active || this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }
    if (this.fase !== "ground" && sprite.body.blocked.down) {
      this.pousar();
    } else if (this.fase === "mergulho") {
      sprite.setVelocity(VELOCIDADE_X * this.direcao, VELOCIDADE_Y);
    }
    if (this.fase === "ground" && this.scene.time.now - this.inicioExplosao >= DURACAO_EXPLOSAO) {
      this.destruirHitbox();
    }
    this.atualizarHitbox();
  }

  pousar() {
    const sprite = this.personagem.sprite;
    this.impacto = { x: sprite.body.center.x, y: sprite.body.bottom };
    this.fase = "ground";
    sprite.setVelocity(0, 0);
    sprite.body.setAllowGravity(this.gravidadeOriginal);
    this.destruirHitbox();
    this.alvosAtingidos.clear();
    this.personagem.tocarAnimacao("ground", true);
    this.inicioExplosao = this.scene.time.now;
    this.criarHitbox();
    this.efeito = this.scene.add.sprite(this.impacto.x, this.impacto.y + 8, "ground_effect")
      .setOrigin(0.5, 0.75).setScale(0.4, 0.3).setBlendMode("ADD")
      .setDepth(Math.max(1000, sprite.depth + 1));
    this.scene.camHUD?.ignore(this.efeito);
    this.efeito.play("fj_ground_effect");
    this.efeito.once("animationcomplete", () => {
      this.efeito?.destroy();
      this.efeito = null;
    });
  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const sprite = this.personagem.sprite;
    const ground = this.fase === "ground";
    this.hitbox.setSize(ground ? 230 : 60, ground ? 65 : 55);
    this.hitbox.body.setSize(this.hitbox.width, this.hitbox.height);
    this.hitbox.setPosition(ground ? this.impacto.x : sprite.x + 38 * this.direcao,
      ground ? this.impacto.y - 25 : sprite.y - 30);
    this.hitbox.body.updateFromGameObject();
  }

  acertar(alvo) {
    if (this.finalizado || !this.hitbox?.active || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    const ground = this.fase === "ground";
    const direcao = ground ? (alvo.sprite.x < this.impacto.x ? -1 : 1) : this.direcao;
    const dano = ground ? 10 : 14;
    alvo.receberDano(dano, {
      dano, tipoSomImpacto: "heavy", tumbling: true,
      knockbackX: ground ? 360 : 180,
      knockbackY: ground ? -300 : 180,
    }, { direcao, x: ground ? this.impacto.x : this.personagem.sprite.x });
  }

  finalizar() {
    if (this.finalizado) return;
    // O efeito termina sua animacao mesmo depois da recuperacao do personagem.
    const efeito = this.efeito;
    this.efeito = null;
    if (efeito?.active) efeito.once("animationcomplete", () => efeito.destroy());
    this.cancelar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) this.estado.finalizarSpecial();
  }

  cancelar() {
    if (this.finalizado) return;
    const sprite = this.personagem.sprite;
    sprite.off("animationcomplete-fj_ground", this.aoFimGround);
    if (sprite.body) sprite.body.setAllowGravity(this.gravidadeOriginal);
    this.efeito?.destroy();
    this.efeito = null;
    super.cancelar();
  }
}
