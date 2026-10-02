import {
  destruirColisor,
  registrarAtaqueEspecial,
} from "../../../Objetos/SistemaCombateEspecial.js";

export default class PinguSiSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.quadrosDisparados = new Set();
    this.projeteis = new Set();
    this.totalProjeteis = 0;
    this.poseEncerrada = false;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    sprite.setVelocityX(0);
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.poseEncerrada || animacao?.key !== this.special.animacao || !frame) return;

    const quadro = Number(frame.textureFrame);
    if (this.quadrosDisparados.has(quadro)) return;

    const primeiro = quadro === this.special.quadroPrimeiroProjetil;
    const segundo = quadro === this.special.quadroSegundoProjetil;
    const enxurrada = quadro >= this.special.inicioEnxurrada &&
      ((quadro - this.special.inicioEnxurrada) % this.special.intervaloEnxurrada === 0 ||
        quadro === this.special.fimEnxurrada);
    if (!primeiro && !segundo && !enxurrada) return;

    if (!this.personagem.inputDown("special")) return;

    this.quadrosDisparados.add(quadro);
    this.criarProjetil(!primeiro && !segundo);
  }

  criarProjetil(enxurrada) {
    const sprite = this.personagem.sprite;
    if (!sprite?.active) return;

    const direcao = sprite.flipX ? -1 : 1;
    const offsetY = this.special.offsetsYProjetil[
      this.totalProjeteis % this.special.offsetsYProjetil.length
    ];
    this.totalProjeteis += 1;
    const projetil = this.scene.physics.add.sprite(
      sprite.x + this.special.offsetProjetilX * direcao,
      sprite.y + offsetY,
      this.special.texturaProjetil,
      0,
    );
    projetil
      .setFlipX(direcao < 0)
      .setScale(this.special.escalaProjetil)
      .setDepth(sprite.depth + 1);
    this.scene.camHUD?.ignore(projetil);
    projetil.body.setAllowGravity(false);
    projetil.body.setSize(this.special.larguraProjetil, this.special.alturaProjetil);
    projetil.body.setVelocityX(this.special.velocidadeProjetil * direcao);
    projetil.anims.play(this.special.animacaoProjetil);

    const propriedades = {
      ...this.special.propriedades,
      dano: enxurrada ? this.special.danoEnxurrada : this.special.propriedades.dano,
      preservarCongelamentoPingu: enxurrada,
      congelamentoPingu: enxurrada
        ? this.special.acumuloCongelamentoEnxurrada
        : this.special.acumuloCongelamentoBolaGrande,
    };
    const registro = {
      projetil,
      origemX: projetil.x,
      colisor: null,
      ataque: null,
      timer: null,
    };
    this.projeteis.add(registro);
    registro.ataque = registrarAtaqueEspecial(this, projetil, {
      categoria: "projetil",
      aoColidir: () => this.finalizarProjetil(registro),
      aoAtingirAlvo: (alvo) => this.acertarAlvo(registro, alvo, direcao, propriedades),
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

    registro.timer = this.scene.time.delayedCall(
      this.special.tempoProjetil,
      () => this.finalizarProjetil(registro),
    );
  }

  acertarAlvo(registro, alvo, direcao, propriedades) {
    if (!registro.projetil.active) return;
    alvo.receberDano(propriedades.dano, propriedades, {
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
    registro.timer?.remove(false);
    registro.timer = null;
    registro.ataque?.remover();
    registro.ataque = null;
    registro.projetil.destroy();
    this.projeteis.delete(registro);
    this.encerrarSeVazio();
  }

  aoCompletarAnimacao() {
    this.personagem.sprite.off("animationupdate", this.aoAtualizarAnimacao);
    this.personagem.sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    this.poseEncerrada = true;
    this.encerrarSeVazio();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.personagem.maquinaEstados.mudarEstado("atordoado");
    }
  }

  encerrarSeVazio() {
    if (!this.poseEncerrada || this.projeteis.size > 0) return;
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  atualizar() {
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      if (!this.personagem.inputDown("special")) {
        this.estado.finalizarSpecial();
        return;
      }
      this.personagem.sprite.setVelocityX(0);
    }

    for (const registro of this.projeteis) {
      if (Math.abs(registro.projetil.x - registro.origemX) > this.special.distanciaMaximaProjetil) {
        this.finalizarProjetil(registro);
      }
    }
  }

  cancelar() {
    this.personagem.sprite.off("animationupdate", this.aoAtualizarAnimacao);
    this.personagem.sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    this.poseEncerrada = true;
    this.encerrarSeVazio();
  }
}

PinguSiSpecial.configuracao = {
  animacao: "pingu_siSpecial",
  logica: PinguSiSpecial,
  duracao: 4917,
  cooldown: 1100,
  quadroPrimeiroProjetil: 5,
  quadroSegundoProjetil: 11,
  inicioEnxurrada: 12,
  intervaloEnxurrada: 2,
  fimEnxurrada: 58,
  texturaProjetil: "Pingu_siBall",
  animacaoProjetil: "pingu_siBall",
  tempoProjetil: 5000,
  distanciaMaximaProjetil: 1100,
  velocidadeProjetil: 600,
  offsetProjetilX: -12,
  offsetsYProjetil: [-58, -43, -30, -52, -36, -24],
  escalaProjetil: 1.3,
  larguraProjetil: 10,
  alturaProjetil: 6,
  danoEnxurrada: 0.5,
  acumuloCongelamentoBolaGrande: 18,
  acumuloCongelamentoEnxurrada: 8,
  propriedades: {
    dano: 6,
    tipoSomImpacto: "light",
    knockbackX: 20,
    knockbackY: -20,
    knockbackFixo: true,
    hitstunFrames: 25,
    travarMovimentoAir: true,
  },
};
