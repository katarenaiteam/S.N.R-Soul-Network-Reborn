import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class AigisNeSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.granadasIniciaisLancadas = false;
    this.granadasExtrasCarregadas = 0;
    this.cargaIniciadaEm = null;
    this.cargaConcluida = false;
    this.colisoresGranada = new Map();
    this.listenersLimiteMundo = new Map();
    this.registrosGranada = new Map();
    this.finalizado = false;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
    personagem.sprite.on("animationupdate", this.aoAtualizarAnimacao);
    personagem.sprite.once(`animationcomplete-${special.animacao}`, this.aoCompletarAnimacao);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || animacao?.key !== this.special.animacao || !frame) return;
    const quadro = Number(frame.textureFrame);
    if (quadro >= this.special.quadroCarga &&
        this.cargaIniciadaEm === null &&
        !this.cargaConcluida &&
        this.personagem.inputDown("special")) {
      this.cargaIniciadaEm = this.scene.time.now;
      this.personagem.sprite.anims.pause();
      return;
    }
    if (
      quadro >= this.special.quadroProjetil &&
      (this.cargaConcluida || this.cargaIniciadaEm === null)
    ) {
      this.lancarGranadasIniciais();
    }
  }

  aoCompletarAnimacao() {
    if (this.finalizado) return;
    this.finalizar();
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }

    if (this.cargaIniciadaEm !== null && !this.cargaConcluida) {
      const tempoCarga = this.scene.time.now - this.cargaIniciadaEm;
      if (!this.personagem.inputDown("special") ||
          tempoCarga >= this.special.tempoMaximoCarga) {
        this.concluirCarga(tempoCarga);
      }
    }
  }

  concluirCarga(tempoCarga) {
    if (this.cargaConcluida) return;
    this.cargaConcluida = true;
    this.granadasExtrasCarregadas = Math.min(
      this.special.quantidadeGranadasExtras,
      Math.floor(tempoCarga / this.special.intervaloGranadasExtras),
    );
    if (tempoCarga >= this.special.tempoMaximoCarga) {
      this.granadasExtrasCarregadas = this.special.quantidadeGranadasExtras;
    }
    const animacao = this.personagem.sprite.anims;
    if (animacao.currentAnim?.key === this.special.animacao && animacao.isPaused) {
      animacao.resume();
    }
  }

  lancarGranadasIniciais() {
    if (this.granadasIniciaisLancadas) return;
    this.granadasIniciaisLancadas = true;
    this.lancarGranada(0);
    this.lancarGranada(1);
    for (let indice = 0; indice < this.granadasExtrasCarregadas; indice++) {
      this.lancarGranada(indice + 2);
    }
  }

  lancarGranada(indice) {
    const sprite = this.personagem.sprite;
    if (!sprite?.active) return;

    const velocidades = this.special.velocidadesGranadas[indice] ??
      this.special.velocidadesGranadas[this.special.velocidadesGranadas.length - 1];
    const granada = this.scene.physics.add.sprite(
      sprite.x + this.special.offsetProjetilX * this.direcao,
      sprite.y + this.special.offsetProjetilY,
      this.special.texturaProjetil,
      0,
    );
    granada
      .setFlipX(this.direcao < 0)
      .setScale(this.special.escalaProjetil)
      .setDepth(sprite.depth + 1)
      .setCollideWorldBounds(true);
    granada.body.setSize(this.special.larguraProjetil, this.special.alturaProjetil);
    granada.body.setVelocity(
      velocidades.x * this.direcao,
      velocidades.y,
    );
    granada.anims.play("ai_granade_voo");
    this.scene.camHUD?.ignore(granada);
    granada.body.debugBodyColor = 0xff0000;

    const registroAtaque = registrarAtaqueEspecial(this, granada, {
      categoria: "projetil",
      aoColidir: () => this.removerGranada(granada),
      aoAtingirAlvo: () => this.explodir(granada),
    });
    this.registrosGranada.set(granada, registroAtaque);

    const plataformas = this.scene.mapaAtual?.plataformas
      || this.scene.plataformas
      || this.scene.chao;
    if (plataformas) {
      const colisor = this.scene.physics.add.collider(
        granada,
        plataformas,
        () => this.iniciarExplosao(granada),
      );
      this.colisoresGranada.set(granada, colisor);
    }
    granada.body.onWorldBounds = true;
    const aoAtingirLimite = (body, cima, baixo) => {
      if (body.gameObject === granada && baixo) this.iniciarExplosao(granada);
    };
    this.scene.physics.world.on("worldbounds", aoAtingirLimite);
    this.listenersLimiteMundo.set(granada, aoAtingirLimite);
  }

  iniciarExplosao(granada) {
    if (!granada.active || granada.getData("fusivelIniciado")) return;
    granada.setData("fusivelIniciado", true);
    granada.body.setVelocity(0, 0);
    granada.body.setAllowGravity(false);
    granada.anims.pause();
    granada.scene.time.delayedCall(
      Phaser.Math.Between(this.special.atrasoExplosaoMin, this.special.atrasoExplosaoMax),
      () => this.explodir(granada),
    );
  }

  removerGranada(granada) {
    if (!granada.active) return;
    const colisor = this.colisoresGranada.get(granada);
    if (colisor) this.scene.physics.world.removeCollider(colisor);
    this.colisoresGranada.delete(granada);
    const aoAtingirLimite = this.listenersLimiteMundo.get(granada);
    if (aoAtingirLimite) this.scene.physics.world.off("worldbounds", aoAtingirLimite);
    this.listenersLimiteMundo.delete(granada);
    this.registrosGranada.get(granada)?.remover();
    this.registrosGranada.delete(granada);
    granada.destroy();
  }

  explodir(granada) {
    if (!granada.active) return;
    const colisor = this.colisoresGranada.get(granada);
    if (colisor) this.scene.physics.world.removeCollider(colisor);
    this.colisoresGranada.delete(granada);
    const aoAtingirLimite = this.listenersLimiteMundo.get(granada);
    if (aoAtingirLimite) this.scene.physics.world.off("worldbounds", aoAtingirLimite);
    this.listenersLimiteMundo.delete(granada);
    this.registrosGranada.get(granada)?.remover();
    this.registrosGranada.delete(granada);
    const x = granada.x;
    const y = granada.y;
    const profundidade = granada.depth;
    granada.destroy();

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
        const direcao = alvo.sprite.x >= x ? 1 : -1;
        alvo.receberDano(this.special.propriedades.dano, this.special.propriedades, {
          x,
          direcao,
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

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.personagem.sprite.off("animationupdate", this.aoAtualizarAnimacao);
    this.personagem.sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    if (this.personagem.sprite.anims.isPaused &&
        this.personagem.sprite.anims.currentAnim?.key === this.special.animacao) {
      this.personagem.sprite.anims.resume();
    }
    const logicas = this.personagem.logicasEspeciaisAtivas;
    const indice = logicas.indexOf(this);
    if (indice >= 0) logicas.splice(indice, 1);
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.personagem.sprite.off("animationupdate", this.aoAtualizarAnimacao);
    this.personagem.sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    const logicas = this.personagem.logicasEspeciaisAtivas;
    const indice = logicas.indexOf(this);
    if (indice >= 0) logicas.splice(indice, 1);
  }
}

AigisNeSpecial.configuracao = {
  animacao: "ai_neSpecial",
  logica: AigisNeSpecial,
  cooldown: 1000,
  quadroCarga: 2,
  quadroProjetil: 4,
  tempoMaximoCarga: 3000,
  quantidadeGranadasExtras: 3,
  intervaloGranadasExtras: 1000,
  texturaProjetil: "granade",
  escalaProjetil: 0.55,
  larguraProjetil: 26,
  alturaProjetil: 32,
  offsetProjetilX: 54,
  offsetProjetilY: -90,
  velocidadesGranadas: [
    { x: 420, y: -205 },
    { x: 480, y: -225 },
    { x: 455, y: -215 },
    { x: 500, y: -235 },
    { x: 440, y: -210 },
  ],
  atrasoExplosaoMin: 200,
  atrasoExplosaoMax: 500,
  escalaExplosao: 1.25,
  larguraExplosao: 120,
  alturaExplosao: 130,
  duracaoHitboxExplosao: 400,
  propriedades: {
    dano: 15,
    knockbackX: 250,
    knockbackY: -400,
    knockbackFixo: false,
  },
};
