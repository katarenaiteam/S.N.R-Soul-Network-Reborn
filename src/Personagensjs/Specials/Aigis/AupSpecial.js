import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export function obterTexturaAuraAigis(scene) {
  const chave = "aigis_up_special_aura";
  if (scene.textures.exists(chave)) return chave;
  const textura = scene.textures.createCanvas(chave, 144, 208);
  const contexto = textura.getContext();
  const desenharBrilho = (x, y, raioX, raioY, alpha) => {
    contexto.save();
    contexto.translate(x, y);
    contexto.scale(raioX / 64, raioY / 64);
    const gradiente = contexto.createRadialGradient(0, 0, 2, 0, 0, 64);
    gradiente.addColorStop(0, `rgba(63, 166, 255, ${alpha})`);
    gradiente.addColorStop(0.48, `rgba(24, 116, 255, ${alpha * 0.42})`);
    gradiente.addColorStop(1, "rgba(8, 74, 255, 0)");
    contexto.fillStyle = gradiente;
    contexto.beginPath();
    contexto.arc(0, 0, 64, 0, Math.PI * 2);
    contexto.fill();
    contexto.restore();
  };
  desenharBrilho(72, 104, 52, 96, 0.42);
  desenharBrilho(45, 64, 35, 49, 0.28);
  desenharBrilho(99, 143, 33, 52, 0.24);
  desenharBrilho(103, 78, 26, 39, 0.2);
  textura.refresh();
  return chave;
}

export default class AigisAupSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.quadroAtual = -1;
    this.gravidadeExtraOriginal = null;
    this.flutuando = false;
    this.aura = null;
    this.tweenAura = null;
    this.overcharge = null;
    this.choques = [];
    this.timerPersonaFinal = null;
    this.alvosAtingidosPersona = new Set();
    this.personaConcluida = false;
    this.finalizado = false;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
    this.aoAtualizarPersona = this.aoAtualizarPersona.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    if (this.special.persona) this.criarPersona();
    this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  criarPersona() {
    const sprite = this.personagem.sprite;
    const config = this.special.persona;
    this.persona = this.scene.add.sprite(
      sprite.x + (sprite.flipX ? -1 : 1) * config.offsetX,
      sprite.y + config.offsetY,
      "p_AupSpecial",
      0,
    )
      .setOrigin(0.5, 1)
      .setScale(config.escala)
      .setFlipX(sprite.flipX)
      .setDepth(sprite.depth + 1);
    this.scene.camHUD?.ignore(this.persona);
    this.persona.on("animationupdate", this.aoAtualizarPersona);
    this.persona.once("animationcomplete-ai_p_AupSpecial", () => {
      if (!this.persona?.active) return;
      this.personaConcluida = true;
      this.persona.anims.stop();
      this.persona.setTexture("p_AupSpecial", 14);
      this.destruirHitboxPersona();
      this.timerPersonaFinal = this.scene.time.delayedCall(config.duracaoPoseFinal, () => {
        this.timerPersonaFinal = null;
        this.persona?.destroy();
        this.persona = null;
      });
    });
    this.persona.play("ai_p_AupSpecial");
    this.atualizarPersona(this.persona.anims.currentFrame);
  }

  aoAtualizarPersona(animacao, frame) {
    if (this.finalizado || animacao?.key !== "ai_p_AupSpecial") return;
    this.atualizarPersona(frame);
  }

  atualizarPersona(frame) {
    if (!frame || !this.persona?.active) return;
    const config = this.special.persona;
    const aigis = this.personagem.sprite;
    const direcao = aigis.flipX ? -1 : 1;
    const quadro = Number(frame.textureFrame);
    const progressoSubida = Phaser.Math.Clamp(quadro / config.quadroFimSubida, 0, 1);
    this.persona
      .setPosition(
        aigis.x + direcao * config.offsetX,
        aigis.y + config.offsetY - config.deslocamentoY * progressoSubida,
      )
      .setFlipX(aigis.flipX)
      .setDepth(aigis.depth + 1);

    if (quadro >= config.quadroInicioAtaque && quadro <= config.quadroFimAtaque) {
      if (!this.hitboxPersona) this.criarHitboxPersona();
      this.atualizarHitboxPersona();
    } else {
      this.destruirHitboxPersona();
    }
  }

  criarHitboxPersona() {
    const config = this.special.persona.hitbox;
    this.hitboxPersona = this.scene.add.zone(0, 0, config.largura, config.altura);
    this.scene.physics.add.existing(this.hitboxPersona);
    this.hitboxPersona.body.setAllowGravity(false);
    this.hitboxPersona.body.setImmovable(true);
    this.hitboxPersona.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitboxPersona);
    this.ataquePersona = registrarAtaqueEspecial(this, this.hitboxPersona, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.atingirAlvoPersona(alvo),
    });
  }

  atualizarHitboxPersona() {
    if (!this.hitboxPersona?.active || !this.persona?.active) return;
    const config = this.special.persona.hitbox;
    const direcao = this.personagem.sprite.flipX ? -1 : 1;
    this.hitboxPersona.setPosition(
      this.persona.x + direcao * config.offsetX,
      this.persona.y + config.offsetY,
    );
    this.hitboxPersona.body.updateFromGameObject();
  }

  atingirAlvoPersona(alvo) {
    if (this.finalizado || this.alvosAtingidosPersona.has(alvo)) return;
    this.alvosAtingidosPersona.add(alvo);
    const sprite = this.personagem.sprite;
    alvo.receberDano(this.special.persona.propriedadesAtaque.dano,
      this.special.persona.propriedadesAtaque, {
        x: this.persona?.x ?? sprite.x,
        direcao: sprite.flipX ? -1 : 1,
        atacante: this.personagem,
      });
  }

  destruirHitboxPersona() {
    this.ataquePersona?.remover();
    this.ataquePersona = null;
    this.hitboxPersona?.destroy();
    this.hitboxPersona = null;
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || animacao?.key !== this.special.animacao || !frame) return;
    const quadro = Number(frame.textureFrame);
    if (quadro === this.quadroAtual) return;
    this.quadroAtual = quadro;

    if (quadro >= this.special.quadroInicioFlutuacao &&
        quadro <= this.special.quadroFimFlutuacao) {
      if (!this.flutuando) this.iniciarFlutuacao();
    } else if (this.flutuando) {
      this.encerrarFlutuacao();
    }
  }

  iniciarFlutuacao() {
    this.flutuando = true;
    const sprite = this.personagem.sprite;
    const body = sprite.body;
    this.gravidadeExtraOriginal = body.gravity.y;
    const gravidadeMundo = this.scene.physics.world.gravity.y ?? 900;
    body.setGravityY(this.special.gravidadeFlutuacao - gravidadeMundo);
    this.criarAura();
    this.criarOvercharge();
    this.criarChoques();
  }

  criarAura() {
    const sprite = this.personagem.sprite;
    const texturaAura = this.obterTexturaAura();
    this.aura = this.scene.add.image(
      sprite.x,
      sprite.y + this.special.offsetAuraY,
      texturaAura,
    )
      .setScale(this.special.escalaAuraX, this.special.escalaAuraY)
      .setAlpha(0.68)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(sprite.depth - 1);
    this.scene.camHUD?.ignore(this.aura);
    this.tweenAura = this.scene.tweens.add({
      targets: this.aura,
      alpha: { from: 0.5, to: 0.76 },
      scaleX: { from: this.special.escalaAuraX * 0.94, to: this.special.escalaAuraX * 1.06 },
      scaleY: { from: this.special.escalaAuraY * 0.96, to: this.special.escalaAuraY * 1.04 },
      duration: 170,
      yoyo: true,
      repeat: -1,
    });
  }

  obterTexturaAura() {
    return obterTexturaAuraAigis(this.scene);
  }

  criarOvercharge() {
    const sprite = this.personagem.sprite;
    this.overcharge = this.scene.add.sprite(
      sprite.x,
      sprite.y + this.special.offsetOverchargeY,
      "overcharge",
      0,
    )
      .setScale(this.special.escalaOvercharge)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(sprite.depth + 1);
    this.scene.camHUD?.ignore(this.overcharge);
    this.overcharge.anims.play("ai_overcharge");
    this.overcharge.once("animationcomplete-ai_overcharge", () => {
      this.overcharge?.destroy();
      this.overcharge = null;
    });
  }

  criarChoques() {
    for (let indice = 0; indice < this.special.quantidadeChoques; indice++) {
      const sprite = this.personagem.sprite;
      const visual = this.scene.add.sprite(sprite.x, sprite.y, "ai_upEfect", 0)
        .setScale(this.special.escalaChoque)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(sprite.depth + 2);
      this.scene.camHUD?.ignore(visual);
      visual.anims.play("ai_upEfect_choque");

      const hitbox = this.scene.add.zone(0, 0, this.special.larguraHitboxChoque, this.special.alturaHitboxChoque);
      this.scene.physics.add.existing(hitbox);
      hitbox.body.setAllowGravity(false);
      hitbox.body.setImmovable(true);
      hitbox.body.debugBodyColor = 0xff0000;
      this.scene.camHUD?.ignore(hitbox);

      const registro = {
        visual,
        hitbox,
        alvosAtingidos: new Set(),
        anguloInicial: indice * Math.PI * 2 / this.special.quantidadeChoques,
        ataque: null,
      };
      registro.ataque = registrarAtaqueEspecial(this, hitbox, {
        categoria: "corpo",
        contraAtacarDono: true,
        aoAtingirAlvo: (alvo) => this.atingirAlvo(registro, alvo),
      });
      this.choques.push(registro);
    }
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }

    const sprite = this.personagem.sprite;
    const animacao = sprite.anims;
    if (animacao.currentAnim?.key === this.special.animacao && animacao.currentFrame) {
      this.quadroAtual = Number(animacao.currentFrame.textureFrame);
    }
    if (this.flutuando) {
      const progresso = Phaser.Math.Clamp(
        (this.quadroAtual - this.special.quadroInicioFlutuacao) /
          (this.special.quadroFimFlutuacao - this.special.quadroInicioFlutuacao),
        0,
        1,
      );
      sprite.setVelocity(
        this.direcao * this.special.velocidadeLateralFlutuacao * Math.sin(Math.PI * progresso),
        -this.special.velocidadeVerticalFlutuacao,
      );
      this.atualizarAura();
      this.atualizarOvercharge();
      this.atualizarChoques(progresso);
    }
    if (!this.personaConcluida && this.persona?.active && animacao.currentAnim?.key === this.special.animacao) {
      this.atualizarPersona(this.persona.anims.currentFrame);
    }
  }

  bloqueiaMovimentoLateral() {
    return this.flutuando;
  }

  atualizarAura() {
    if (!this.aura?.active) return;
    const sprite = this.personagem.sprite;
    this.aura.setPosition(sprite.x, sprite.y + this.special.offsetAuraY);
  }

  atualizarOvercharge() {
    if (!this.overcharge?.active) return;
    const sprite = this.personagem.sprite;
    this.overcharge.setPosition(sprite.x, sprite.y + this.special.offsetOverchargeY);
  }

  atualizarChoques(progresso) {
    const personagem = this.personagem.sprite;
    const anguloPercorrido = Math.PI * 2 * this.special.voltasChoque * progresso;
    for (const registro of this.choques) {
      const angulo = registro.anguloInicial + anguloPercorrido;
      const x = personagem.x + Math.cos(angulo) * this.special.raioChoqueX +
        Math.sin(angulo * 2.3 + registro.anguloInicial) * this.special.variacaoChoque;
      const y = personagem.y + this.special.offsetChoqueY +
        Math.sin(angulo * 0.82) * this.special.raioChoqueY +
        Math.cos(angulo * 2.7 + registro.anguloInicial) * this.special.variacaoChoque * 0.8;
      registro.visual.setPosition(x, y);
      registro.hitbox.setPosition(x, y);
      registro.hitbox.body.updateFromGameObject();
    }
  }

  atingirAlvo(registro, alvo) {
    if (this.finalizado || !registro.hitbox?.active || registro.alvosAtingidos.has(alvo)) return;
    registro.alvosAtingidos.add(alvo);
    alvo.receberDano(this.special.propriedadesAtaque.dano, this.special.propriedadesAtaque, {
      x: registro.hitbox.x,
      direcao: alvo.sprite.x >= registro.hitbox.x ? 1 : -1,
      atacante: this.personagem,
    });
  }

  encerrarFlutuacao() {
    if (!this.flutuando) return;
    this.flutuando = false;
    this.restaurarGravidade();
    this.tweenAura?.stop();
    this.tweenAura = null;
    this.aura?.destroy();
    this.aura = null;
    this.destruirChoques();
  }

  restaurarGravidade() {
    if (this.gravidadeExtraOriginal === null || !this.personagem.sprite?.body) return;
    this.personagem.sprite.body.setGravityY(this.gravidadeExtraOriginal);
    this.gravidadeExtraOriginal = null;
  }

  destruirChoques() {
    for (const registro of this.choques) {
      registro.ataque?.remover();
      registro.hitbox?.destroy();
      registro.visual?.destroy();
    }
    this.choques = [];
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
    this.persona?.off("animationupdate", this.aoAtualizarPersona);
    this.timerPersonaFinal?.remove(false);
    this.timerPersonaFinal = null;
    this.destruirHitboxPersona();
    this.persona?.destroy();
    this.persona = null;
    this.encerrarFlutuacao();
    this.restaurarGravidade();
    this.overcharge?.destroy();
    this.overcharge = null;
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

AigisAupSpecial.configuracao = {
  animacao: "ai_AupSpecial",
  logica: AigisAupSpecial,
  configuracaoAnimacao: "AupSpecial",
  cooldown: 1000,
  quadroInicioFlutuacao: 3,
  quadroFimFlutuacao: 11,
  gravidadeFlutuacao: 90,
  velocidadeVerticalFlutuacao: 125,
  velocidadeLateralFlutuacao: 42,
  offsetAuraY: -70,
  escalaAuraX: 1.05,
  escalaAuraY: 1.05,
  offsetOverchargeY: -70,
  escalaOvercharge: 0.16,
  quantidadeChoques: 3,
  escalaChoque: 0.75,
  offsetChoqueY: -70,
  raioChoqueX: 58,
  raioChoqueY: 72,
  variacaoChoque: 16,
  voltasChoque: 1.35,
  larguraHitboxChoque: 36,
  alturaHitboxChoque: 40,
  propriedadesAtaque: {
    tipoSomImpacto: "light",
    dano: 5,
    knockbackX: 160,
    knockbackY: -80,
    knockbackFixo: true,
    tumbling: false,
  },
};

AigisAupSpecial.configuracaoPersona = {
  ...AigisAupSpecial.configuracao,
  persona: {
    offsetX: 85,
    offsetY: -5,
    escala: 0.33,
    deslocamentoY: 28,
    quadroFimSubida: 7,
    quadroInicioAtaque: 10,
    quadroFimAtaque: 14,
    duracaoPoseFinal: 600,
    hitbox: {
      largura: 70,
      altura: 82,
      offsetX: 12,
      offsetY: -190,
    },
    propriedadesAtaque: {
      ...AigisAupSpecial.configuracao.propriedadesAtaque,
    },
  },
};
