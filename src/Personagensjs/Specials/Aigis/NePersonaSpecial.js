import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class AigisPersonaNeSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.persona = null;
    this.hitbox = null;
    this.ataque = null;
    this.efeitoCorte = null;
    this.corteDisparado = false;
    this.timerCorte = null;
    this.alvosAtingidos = new Set();
    this.velocidadeMaximaOriginal = null;
    this.finalizado = false;
    this.aoAtualizarPersona = this.aoAtualizarPersona.bind(this);
    this.aoCompletarPersona = this.aoCompletarPersona.bind(this);
  }

  executar() {
    const aigis = this.personagem.sprite;
    this.direcao = aigis.flipX ? -1 : 1;
    if (this.special.aereo) this.limitarMovimentoAereo();

    this.persona = this.scene.add.sprite(
      aigis.x + this.direcao * this.special.offsetInicialPersonaX,
      aigis.y + this.special.offsetPersonaY,
      "p_neSpecial",
      0,
    )
      .setOrigin(0.5, 1)
      .setScale(this.special.escalaPersona)
      .setFlipX(aigis.flipX)
      .setDepth(aigis.depth + 1);
    this.scene.camHUD?.ignore(this.persona);
    this.persona.on("animationupdate", this.aoAtualizarPersona);
    this.persona.once("animationcomplete-ai_p_neSpecial", this.aoCompletarPersona);
    this.persona.play("ai_p_neSpecial");
    this.atualizarPersona(this.persona.anims.currentFrame);
  }

  limitarMovimentoAereo() {
    const body = this.personagem.sprite.body;
    this.velocidadeMaximaOriginal = { x: body.maxVelocity.x, y: body.maxVelocity.y };
    body.setMaxVelocity(this.special.velocidadeMaximaPose, this.special.velocidadeMaximaPose);
  }

  aoAtualizarPersona(animacao, frame) {
    if (this.finalizado || animacao?.key !== "ai_p_neSpecial") return;
    this.atualizarPersona(frame);
  }

  atualizarPersona(frame) {
    if (!frame || !this.persona?.active) return;
    const numeroQuadro = Number(frame.textureFrame);
    const quadroFimAvanco = this.special.quadroAvancoPersona ?? this.special.quadroAtaque;
    const quadroRelativo = numeroQuadro - (this.special.quadroInicioAnimacao ?? 0);
    const progressoAvanco = Phaser.Math.Clamp(quadroRelativo / quadroFimAvanco, 0, 1);
    const aigis = this.personagem.sprite;
    this.persona.setPosition(
      aigis.x + this.direcao * (
        this.special.offsetInicialPersonaX + this.special.distanciaAvancoPersona * progressoAvanco
      ),
      aigis.y + this.special.offsetPersonaY,
    );
    this.persona.setFlipX(aigis.flipX).setDepth(aigis.depth + 1);

    if (numeroQuadro >= this.special.quadroAtaque && numeroQuadro <= this.special.quadroFimAtaque) {
      if (!this.hitbox) this.criarHitbox();
      this.atualizarHitbox();
      if (!this.corteDisparado) {
        this.corteDisparado = true;
        this.mostrarEfeitoCorte();
      }
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

  mostrarEfeitoCorte() {
    if (!this.persona?.active) return;
    this.efeitoCorte = this.scene.add.image(
      this.persona.x + this.direcao * this.special.offsetCorteX,
      this.persona.y + this.special.offsetCorteY,
      "Per_cut",
    )
      .setScale(this.special.escalaCorte)
      .setFlipX(this.direcao < 0)
      .setAlpha(0.85)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(this.persona.depth + 1);
    this.scene.camHUD?.ignore(this.efeitoCorte);
    this.timerCorte = this.scene.time.delayedCall(this.special.duracaoCorte, () => {
      this.efeitoCorte?.destroy();
      this.efeitoCorte = null;
      this.timerCorte = null;
    });
  }

  aoCompletarPersona() {
    if (this.finalizado) return;
    this.finalizar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
  }

  atualizar() {
    if (this.finalizado || this.personagem.maquinaEstados.estadoAtual !== this.estado) return;
    if (this.persona?.anims.currentAnim?.key === "ai_p_neSpecial") {
      this.atualizarPersona(this.persona.anims.currentFrame);
    }
  }

  destruirHitbox() {
    this.ataque?.remover();
    this.ataque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  restaurarMovimentoAereo() {
    if (!this.velocidadeMaximaOriginal || !this.personagem.sprite?.body) return;
    this.personagem.sprite.body.setMaxVelocity(
      this.velocidadeMaximaOriginal.x,
      this.velocidadeMaximaOriginal.y,
    );
    this.velocidadeMaximaOriginal = null;
  }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.persona?.off("animationupdate", this.aoAtualizarPersona);
    this.persona?.off("animationcomplete-ai_p_neSpecial", this.aoCompletarPersona);
    this.destruirHitbox();
    this.timerCorte?.remove(false);
    this.timerCorte = null;
    this.efeitoCorte?.destroy();
    this.efeitoCorte = null;
    this.persona?.destroy();
    this.persona = null;
    this.restaurarMovimentoAereo();
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    this.finalizar();
  }
}

const criarConfiguracao = (aereo) => ({
  animacao: aereo ? "ai_invoc2_special" : "ai_invoc1_special",
  configuracaoAnimacao: aereo ? "NeSpecialUltAir" : "NeSpecialUlt",
  logica: AigisPersonaNeSpecial,
  cooldown: 1000,
  aereo,
  quadroInicioAnimacao: 8,
  quadroAvancoPersona: 3,
  quadroAtaque: 14,
  quadroFimAtaque: 20,
  offsetInicialPersonaX: 80,
  offsetPersonaY: -5,
  distanciaAvancoPersona: 55,
  escalaPersona: 0.33,
  velocidadeMaximaPose: 85,
  hitbox: {
    largura: 145,
    altura: 58,
    offsetX: 78,
    offsetY: -100,
  },
  offsetCorteX: 95,
  offsetCorteY: -90,
  escalaCorte: 0.32,
  duracaoCorte: 85,
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

AigisPersonaNeSpecial.configuracaoChao = criarConfiguracao(false);
AigisPersonaNeSpecial.configuracaoAr = criarConfiguracao(true);
