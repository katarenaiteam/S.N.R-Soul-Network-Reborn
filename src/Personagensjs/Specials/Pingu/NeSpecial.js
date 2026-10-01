import {
  destruirColisor,
  registrarAtaqueEspecial,
} from "../../../Objetos/SistemaCombateEspecial.js";

export default class PinguNeSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.quadrosDisparados = new Set();
    this.projeteis = new Set();
    this.poseEncerrada = false;
    this.aoAtualizarPose = this.aoAtualizarPose.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    sprite.on("animationupdate", this.aoAtualizarPose);
    this.aoAtualizarPose(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarPose(animacao, frame) {
    if (animacao?.key !== this.special.animacao || !frame) return;

    const quadro = Number(frame.textureFrame);
    const quadrosPendentes = this.special.quadrosProjetil.filter(
      (quadroDisparo) => quadro >= quadroDisparo && !this.quadrosDisparados.has(quadroDisparo),
    );
    if (quadrosPendentes.length === 0) return;

    quadrosPendentes.forEach((quadroDisparo) => {
      this.quadrosDisparados.add(quadroDisparo);
      this.criarProjetil();
    });

    if (this.quadrosDisparados.size === this.special.quadrosProjetil.length) {
      this.personagem.sprite.off("animationupdate", this.aoAtualizarPose);
      this.poseEncerrada = true;
      this.encerrarSeVazio();
    }
  }

  criarProjetil() {
    const sprite = this.personagem.sprite;
    if (!sprite?.active) return;

    const direcao = sprite.flipX ? -1 : 1;
    const projetil = this.scene.physics.add.sprite(
      sprite.x + this.special.offsetProjetilX * direcao,
      sprite.y + this.special.offsetProjetilY,
      this.special.texturaProjetil,
      0,
    );
    projetil
      .setFlipX(direcao < 0)
      .setScale(this.special.escalaProjetil)
      .setAlpha(this.special.alphaProjetil)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(sprite.depth + 1);
    this.scene.camHUD?.ignore(projetil);
    projetil.body.setAllowGravity(false);
    projetil.body.setSize(this.special.larguraProjetil, this.special.alturaProjetil);
    projetil.body.setVelocityX(this.special.velocidadeProjetil * direcao);

    const registro = { projetil, colisor: null, ataque: null, timerVida: null };
    this.projeteis.add(registro);
    registro.ataque = registrarAtaqueEspecial(this, projetil, {
      categoria: "projetil",
      aoColidir: () => this.finalizarProjetil(registro),
      aoAtingirAlvo: (alvo) => this.acertarAlvo(registro, alvo, direcao),
    });

    const plataformas = this.scene.mapaAtual?.plataformas
      || this.scene.plataformas
      || this.scene.chao;
    if (plataformas) {
      registro.colisor = this.scene.physics.add.collider(
        projetil,
        plataformas,
        () => this.finalizarProjetil(registro),
      );
    }

    projetil.anims.play({ key: this.special.animacaoProjetil, repeat: -1 });
    registro.timerVida = this.scene.time.delayedCall(
      this.special.tempoMaximoProjetil,
      () => this.finalizarProjetil(registro),
    );
  }

  acertarAlvo(registro, alvo, direcao) {
    if (!registro.projetil.active) return;
    alvo.receberDano(this.special.propriedades.dano, this.special.propriedades, {
      x: registro.projetil.x,
      direcao,
      atacante: this.personagem,
    });
    this.finalizarProjetil(registro);
  }

  finalizarProjetil(registro) {
    if (!this.projeteis.has(registro)) return;
    destruirColisor(registro.colisor);
    registro.colisor = null;
    registro.timerVida?.remove(false);
    registro.timerVida = null;
    registro.ataque?.remover();
    registro.ataque = null;
    registro.projetil.destroy();
    this.projeteis.delete(registro);
    this.encerrarSeVazio();
  }

  encerrarSeVazio() {
    if (!this.poseEncerrada || this.projeteis.size > 0) return;
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    this.personagem.sprite.off("animationupdate", this.aoAtualizarPose);
    this.poseEncerrada = true;
    this.encerrarSeVazio();
  }
}

PinguNeSpecial.configuracao = {
  animacao: "pingu_neSpecial",
  logica: PinguNeSpecial,
  duracao: 1400,
  cooldown: 1600,
  quadrosProjetil: [16],
  texturaProjetil: "Pingu_som",
  animacaoProjetil: "pingu_som",
  velocidadeProjetil: 600,
  tempoMaximoProjetil: 1800,
  offsetProjetilX: 28,
  offsetProjetilY: -40,
  escalaProjetil: 0.8 ,
  alphaProjetil: 1,
  larguraProjetil: 64,
  alturaProjetil: 100,
  propriedades: {
    dano: 8,
    tipoSomImpacto: "heavy",
    knockbackX: 300,
    knockbackY: -100,
  },
};
