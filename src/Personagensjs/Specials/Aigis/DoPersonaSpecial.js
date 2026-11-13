import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class AigisPersonaDoSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.persona = null;
    this.hitbox = null;
    this.ataque = null;
    this.alvosAtingidos = new Set();
    this.gravidadePermitidaOriginal = null;
    this.timerPausaFinal = null;
    this.finalizado = false;
    this.aoAtualizarPersona = this.aoAtualizarPersona.bind(this);
    this.aoCompletarPersona = this.aoCompletarPersona.bind(this);
  }

  executar() {
    const aigis = this.personagem.sprite;
    this.direcao = aigis.flipX ? -1 : 1;
    if (this.special.aereo) this.pararAigisNoAr();
    this.persona = this.scene.add.sprite(
      aigis.x + this.direcao * this.special.offsetPersonaX,
      aigis.y + this.special.offsetPersonaY,
      "p_doSpecial",
      0,
    )
      .setOrigin(0.5, 1)
      .setScale(this.special.escalaPersona)
      .setFlipX(aigis.flipX)
      .setDepth(aigis.depth + 1);
    this.scene.camHUD?.ignore(this.persona);
    this.persona.on("animationupdate", this.aoAtualizarPersona);
    this.persona.once("animationcomplete-ai_p_doSpecial", this.aoCompletarPersona);
    this.persona.play("ai_p_doSpecial");
    this.atualizarPersona(this.persona.anims.currentFrame);
  }

  pararAigisNoAr() {
    const sprite = this.personagem.sprite;
    const body = sprite.body;
    this.gravidadePermitidaOriginal = body.allowGravity;
    body.setAllowGravity(false);
    sprite.setVelocity(0, 0);
  }

  aoAtualizarPersona(animacao, frame) {
    if (this.finalizado || animacao?.key !== "ai_p_doSpecial") return;
    this.atualizarPersona(frame);
  }

  atualizarPersona(frame) {
    if (!frame || !this.persona?.active) return;
    const numeroQuadro = Number(frame.textureFrame);
    const progressoDeslocamento = this.special.deslocamentoVerticalPersona
      ? Phaser.Math.Clamp(numeroQuadro / this.special.quadroAtaque, 0, 1)
      : 0;
    const aigis = this.personagem.sprite;
    this.persona
      .setPosition(
        aigis.x + this.direcao * this.special.offsetPersonaX,
        aigis.y + this.special.offsetPersonaY +
          this.special.deslocamentoVerticalPersona * progressoDeslocamento,
      )
      .setFlipX(aigis.flipX)
      .setDepth(aigis.depth + 1);

    if (numeroQuadro >= this.special.quadroAtaque && numeroQuadro <= this.special.quadroFimAtaque) {
      if (!this.hitbox) this.criarHitbox();
      this.atualizarHitbox();
    } else if (numeroQuadro > this.special.quadroFimAtaque) {
      this.destruirHitbox();
    }
  }

  criarHitbox() {
    const hitbox = this.scene.add.zone(
      0,
      0,
      this.special.hitbox.largura,
      this.special.hitbox.altura,
    );
    this.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(hitbox);
    this.hitbox = hitbox;
    this.ataque = registrarAtaqueEspecial(this, hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.atingirAlvo(alvo),
    });
  }

  atualizarHitbox() {
    if (!this.hitbox?.active || !this.persona?.active) return;
    this.hitbox.setPosition(
      this.persona.x + this.direcao * this.special.hitbox.offsetX,
      this.persona.y + this.special.hitbox.offsetY,
    );
    this.hitbox.body.updateFromGameObject();
  }

  atingirAlvo(alvo) {
    if (this.finalizado || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    alvo.receberDano(this.special.propriedadesAtaque.dano, this.special.propriedadesAtaque, {
      x: this.persona?.x ?? this.personagem.sprite.x,
      direcao: this.direcao,
      atacante: this.personagem,
    });
  }

  aoCompletarPersona() {
    if (this.finalizado) return;
    if (this.special.pausaFrameFinal) {
      this.persona?.anims.stop();
      this.persona?.setTexture("p_doSpecial", 11);
      this.destruirHitbox();
      this.timerPausaFinal = this.scene.time.delayedCall(this.special.pausaFrameFinal, () => {
        this.timerPausaFinal = null;
        this.encerrarSpecial();
      });
      return;
    }
    this.encerrarSpecial();
  }

  encerrarSpecial() {
    if (this.finalizado) return;
    this.finalizar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      if (this.special.finalizarComoAtaque) {
        this.estado.finalizarAtaque();
      } else {
        this.estado.finalizarSpecial();
      }
    }
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }
    if (this.persona?.anims.currentAnim?.key === "ai_p_doSpecial") {
      this.atualizarPersona(this.persona.anims.currentFrame);
    }
  }

  destruirHitbox() {
    this.ataque?.remover();
    this.ataque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.persona?.off("animationupdate", this.aoAtualizarPersona);
    this.persona?.off("animationcomplete-ai_p_doSpecial", this.aoCompletarPersona);
    this.timerPausaFinal?.remove(false);
    this.timerPausaFinal = null;
    this.destruirHitbox();
    this.persona?.destroy();
    this.persona = null;
    if (this.gravidadePermitidaOriginal !== null && this.personagem.sprite?.body) {
      this.personagem.sprite.body.setAllowGravity(this.gravidadePermitidaOriginal);
      this.gravidadePermitidaOriginal = null;
    }
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    this.finalizar();
  }
}

const criarConfiguracao = (aereo) => ({
  animacao: aereo ? "ai_invoc2_special" : "ai_invoc3_special",
  configuracaoAnimacao: aereo ? "DoSpecialUltAir" : "DoSpecialUlt",
  logica: AigisPersonaDoSpecial,
  cooldown: 1000,
  deslocamentoVerticalPersona: aereo ? 70 : 0,
  pausaFrameFinal: aereo ? 500 : 0,
  quadroAtaque: 9,
  quadroFimAtaque: 11,
  offsetPersonaX: 80,
  offsetPersonaY: -5,
  escalaPersona: 0.33,
  hitbox: {
    largura: 140,
    altura: 82,
    offsetX: 84,
    offsetY: -82,
  },
  propriedades: aereo ? { travarMovimentoAir: true } : {},
  propriedadesAtaque: {
    tipoSomImpacto: "heavy",
    dano: 25,
    knockbackX: 480,
    knockbackY: -350,
    knockbackFixo: false,
    tumbling: true,
  },
});

AigisPersonaDoSpecial.configuracaoChao = criarConfiguracao(false);
AigisPersonaDoSpecial.configuracaoAr = criarConfiguracao(true);
AigisPersonaDoSpecial.configuracaoAtaqueNormal = {
  ...criarConfiguracao(false),
  cooldown: 700,
  duracao: 550,
  frameHitbox: -1,
  cancelavel: false,
  propriedades: {},
  finalizarComoAtaque: true,
};
