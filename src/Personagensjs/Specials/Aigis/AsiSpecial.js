import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class AigisAsiSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.velocidadeMaximaOriginal = null;
    this.velocidadeAnimacaoOriginal = null;
    this.missilDisparado = false;
    this.disparoAgendado = false;
    this.timerDisparo = null;
    this.finalizado = false;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    this.velocidadeAnimacaoOriginal = sprite.anims.timeScale ?? 1;
    sprite.anims.timeScale = this.velocidadeAnimacaoOriginal *
      this.special.multiplicadorVelocidadeAntesDisparo;
    const body = sprite.body;
    this.velocidadeMaximaOriginal = {
      x: body.maxVelocity.x,
      y: body.maxVelocity.y,
    };
    body.setMaxVelocity(
      this.special.velocidadeMaximaPose,
      this.special.velocidadeMaximaPose,
    );
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (
      this.finalizado ||
      this.disparoAgendado ||
      this.missilDisparado ||
      animacao?.key !== this.special.animacao ||
      Number(frame?.textureFrame) !== this.special.quadroDisparo
    ) return;
    this.disparoAgendado = true;
    this.personagem.sprite.anims.pause();
    this.timerDisparo = this.scene.time.delayedCall(this.special.pausaDisparo, () => {
      this.timerDisparo = null;
      if (this.finalizado || this.personagem.maquinaEstados.estadoAtual !== this.estado) return;
      this.missilDisparado = true;
      this.criarMissil();
      const animacao = this.personagem.sprite.anims;
      animacao.timeScale = this.velocidadeAnimacaoOriginal;
      if (animacao.currentAnim?.key === this.special.animacao && animacao.isPaused) {
        animacao.resume();
      }
    });
  }

  criarMissil() {
    const sprite = this.personagem.sprite;
    if (!sprite?.active) return;
    const x = sprite.x + this.special.offsetMissilX * this.direcao;
    const y = sprite.y + this.special.offsetMissilY;
    const missil = this.scene.physics.add.sprite(
      x,
      y,
      this.special.texturaMissil,
      0,
    );
    missil
      .setFlipX(this.direcao < 0)
      .setScale(this.special.escalaMissil)
      .setDepth(sprite.depth + 1)
      .setCollideWorldBounds(true);
    missil.body.setSize(this.special.larguraMissil, this.special.alturaMissil);
    const gravidadeMundo = this.scene.physics.world.gravity.y ?? 900;
    missil.body.setGravityY(gravidadeMundo * (this.special.multiplicadorGravidadeMissil - 1));
    missil.body.setVelocity(
      this.special.velocidadeInicialMissil * this.direcao,
      this.special.impulsoVerticalMissil,
    );
    missil.anims.play("ai_missel_loop");
    this.scene.camHUD?.ignore(missil);
    this.personagem.vfx?.tocar("explosaoAtaque3", {
      offsetX: this.special.offsetMissilX,
      offsetY: this.special.offsetMissilY,
      depthOffset: 2,
    });

    const registro = {
      missil,
      colisor: null,
      ataque: null,
      aoAtingirLimite: null,
      inicioDesaceleracao: this.scene.time.now,
      atualizarVelocidade: null,
    };
    registro.ataque = registrarAtaqueEspecial(this, missil, {
      categoria: "projetil",
      aoColidir: () => this.destruirMissil(registro),
      aoAtingirAlvo: () => this.explodirMissil(registro),
    });
    registro.atualizarVelocidade = () => {
      if (!missil.active) return;
      const progresso = Phaser.Math.Clamp(
        (this.scene.time.now - registro.inicioDesaceleracao) / this.special.duracaoDesaceleracao,
        0,
        1,
      );
      const velocidade = this.special.velocidadeInicialMissil +
        (this.special.velocidadeFinalMissil - this.special.velocidadeInicialMissil) * progresso;
      missil.body.setVelocityX(velocidade * this.direcao);
    };
    this.scene.events.on("postupdate", registro.atualizarVelocidade);
    const plataformas = this.scene.mapaAtual?.plataformas
      || this.scene.plataformas
      || this.scene.chao;
    if (plataformas) {
      registro.colisor = this.scene.physics.add.collider(
        missil,
        plataformas,
        () => this.explodirMissil(registro),
      );
    }
    missil.body.onWorldBounds = true;
    registro.aoAtingirLimite = (body) => {
      if (body.gameObject === missil) this.explodirMissil(registro);
    };
    this.scene.physics.world.on("worldbounds", registro.aoAtingirLimite);
    missil.once("destroy", () => this.limparMissil(registro));
  }

  limparMissil(registro) {
    if (registro.colisor?.world) this.scene.physics.world.removeCollider(registro.colisor);
    registro.colisor = null;
    registro.ataque?.remover();
    registro.ataque = null;
    if (registro.atualizarVelocidade) {
      this.scene.events.off("postupdate", registro.atualizarVelocidade);
      registro.atualizarVelocidade = null;
    }
    if (registro.aoAtingirLimite) {
      this.scene.physics.world.off("worldbounds", registro.aoAtingirLimite);
      registro.aoAtingirLimite = null;
    }
  }

  destruirMissil(registro) {
    if (!registro.missil?.active) return;
    this.limparMissil(registro);
    registro.missil.destroy();
  }

  explodirMissil(registro) {
    const missil = registro.missil;
    if (!missil?.active) return;
    const x = missil.x;
    const y = missil.y;
    const depth = missil.depth;
    this.limparMissil(registro);
    missil.destroy();

    const efeito = this.scene.add.sprite(x, y, "ai_siExp", 0)
      .setScale(this.special.escalaExplosao)
      .setDepth(depth + 1);
    efeito.anims.play("ai_granada_explosao");
    this.scene.camHUD?.ignore(efeito);

    const hitbox = this.scene.add.zone(
      x,
      y,
      this.special.larguraExplosao,
      this.special.alturaExplosao,
    );
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
  }

  aoCompletarAnimacao() {
    if (this.finalizado) return;
    this.finalizar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
  }

  restaurarVelocidadeMaxima() {
    if (this.velocidadeAnimacaoOriginal !== null && this.personagem.sprite?.anims) {
      this.personagem.sprite.anims.timeScale = this.velocidadeAnimacaoOriginal;
      this.velocidadeAnimacaoOriginal = null;
    }
    if (!this.velocidadeMaximaOriginal || !this.personagem.sprite?.body) return;
    this.personagem.sprite.body.setMaxVelocity(
      this.velocidadeMaximaOriginal.x,
      this.velocidadeMaximaOriginal.y,
    );
    this.velocidadeMaximaOriginal = null;
  }

  finalizar() {
    this.finalizado = true;
    this.timerDisparo?.remove(false);
    this.timerDisparo = null;
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.aoAtualizarAnimacao);
    sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    this.restaurarVelocidadeMaxima();
    this.removerDaListaAtiva();
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizar();
  }
}

AigisAsiSpecial.configuracao = {
  animacao: "ai_AsiSpecial",
  logica: AigisAsiSpecial,
  configuracaoAnimacao: "AsiSpecial",
  cooldown: 1000,
  quadroDisparo: 9,
  pausaDisparo: 200,
  multiplicadorVelocidadeAntesDisparo: 30 / 18,
  velocidadeMaximaPose: 85,
  texturaMissil: "ai_missel",
  escalaMissil: 0.9,
  larguraMissil: 48,
  alturaMissil: 14,
  offsetMissilX: 95,
  offsetMissilY: -110,
  velocidadeInicialMissil: 820,
  velocidadeFinalMissil: 650,
  duracaoDesaceleracao: 600,
  impulsoVerticalMissil: -10,
  multiplicadorGravidadeMissil: 0.12,
  escalaExplosao: 1.25,
  larguraExplosao: 120,
  alturaExplosao: 130,
  duracaoHitboxExplosao: 400,
  propriedades: {
    travarMovimentoAir: true,
    dano: 15,
    knockbackX: 250,
    knockbackY: -400,
    knockbackFixo: false,
  },
};
