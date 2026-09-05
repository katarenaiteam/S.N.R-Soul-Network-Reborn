import { obterAlvosCombate, registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class Hadouken {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.ehAereo = special?.animacao === "ken_AneSpecial";
    this.projetil = null;
    this.timerCriacao = null;
    this.timerVida = null;
    this.colisorCenario = null;
    this.overlaps = [];
    this.finalizando = false;
  }

  executar() {
  if (this.projetil || this.timerCriacao) return;

  if (
    this.special?.animacao === "ken_AneSpecial" &&
    !this.personagem.sprite.body.blocked.down
  ) {
    this.personagem.sprite.setVelocityX(0);
    this.personagem.sprite.setVelocityY(40);
  }

  this.personagem.tocarSomSorteado(this.special?.som, {
    volume: this.special?.volumeSom ?? 0.8,
  });

  const atraso = this.special?.atrasoProjetil ?? 350;

  this.timerCriacao = this.scene.time.delayedCall(atraso, () => {
    this.timerCriacao = null;
    this.criarProjetil();
  });
}

  criarProjetil() {
    const lutador = this.personagem?.sprite;
    if (!lutador?.active) return;
    const direcao = lutador.flipX ? -1 : 1;
    const x = lutador.x + (this.special?.offsetProjetilX ?? 65) * direcao;
    const y = lutador.y + (this.special?.offsetProjetilY ?? -45);

    this.projetil = this.scene.physics.add.sprite(x, y, "hadouken1", 0);
    this.projetil.setFlipX(direcao < 0);
    this.projetil.setScale(this.special?.escalaProjetil ?? 1.5);
    this.projetil.setDepth(lutador.depth + 1);
    this.scene.camHUD?.ignore(this.projetil);
    this.projetil.body.setAllowGravity(false);
    this.projetil.body.debugBodyColor = 0xff0000;
    this.projetil.body.setSize(
      this.special?.larguraProjetil ?? 52,
      this.special?.alturaProjetil ?? 38
    );
    this.projetil.body.setVelocityX(
      (this.special?.velocidadeProjetil ?? 550) * direcao
    );

    this.projetil.anims.play("ken_hadouken_inicio");
    this.projetil.once("animationcomplete-ken_hadouken_inicio", () => {
      if (this.projetil?.active && !this.finalizando) {
        this.projetil.anims.play("ken_hadouken_loop");
      }
    });

    registrarAtaqueEspecial(this, this.projetil, {
      categoria: "projetil",
      aoColidir: () => this.finalizarProjetil(true),
    });

    this.criarColisoes();
    this.timerVida = this.scene.time.delayedCall(
      this.special?.tempoProjetil ?? 5000,
      () => this.finalizarProjetil(false)
    );
  }

  criarColisoes() {
    const oponentes = obterAlvosCombate(this.personagem);

    this.overlaps = oponentes.map((oponente) =>
      this.scene.physics.add.overlap(
        this.projetil,
        oponente.grupoHurtbox,
        () => this.processarAcerto(oponente),
        null,
        this
      )
    );

    const plataformas = this.scene.mapaAtual?.plataformas
      || this.scene.plataformas
      || this.scene.chao;

    if (plataformas) {
      this.colisorCenario = this.scene.physics.add.collider(
        this.projetil,
        plataformas,
        () => this.finalizarProjetil(true)
      );
    }
  }

  processarAcerto(alvo) {
    if (this.finalizando) return;
    const propriedades = this.special?.propriedades || {};
    const direcao = this.projetil?.flipX ? -1 : 1;

    // Coloca a explosao visual dentro da hurtbox, em vez de deixa-la na borda.
    this.projetil.x += (this.special?.profundidadeImpacto ?? 20) * direcao;
    alvo.receberDano(
      propriedades.dano ?? 8,
      propriedades,
      { x: this.projetil.x, direcao }
    );
    this.finalizarProjetil(true);
  }

  finalizarProjetil(tocarImpacto) {
    if (this.finalizando) return;
    this.finalizando = true;
    this.limparColisoes();
    this.timerVida?.remove(false);
    this.timerVida = null;

    if (!this.projetil?.active) {
      this.removerDaListaAtiva();
      return;
    }

    this.projetil.body.stop();
    this.projetil.body.enable = false;

    if (tocarImpacto) {
      this.projetil.setTexture("hadouken2", 0);
      this.projetil.anims.play("ken_hadouken_impacto");
      this.projetil.once("animationcomplete-ken_hadouken_impacto", () => {
        this.destruirProjetil();
      });
    } else {
      this.destruirProjetil();
    }
  }

  limparColisoes() {
    this.overlaps.forEach((overlap) => {
      if (overlap?.active) overlap.destroy();
    });
    this.overlaps = [];
    if (this.colisorCenario?.active) this.colisorCenario.destroy();
    this.colisorCenario = null;
  }

  destruirProjetil() {
    if (this.projetil?.active) this.projetil.destroy();
    this.projetil = null;
    this.removerDaListaAtiva();
  }

  removerDaListaAtiva() {
    const lista = this.personagem?.logicasEspeciaisAtivas;
    if (!lista) return;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  atualizar() {
    // O estado special e reutilizado; o projetil antigo nao controla o golpe seguinte.
    if (
      this.ehAereo &&
      this.personagem.maquinaEstados.estadoAtual === this.estado &&
      this.estado.logicaSpecial === this &&
      !this.personagem.sprite.body.blocked.down
    ) {
      this.personagem.sprite.setVelocityX(0);
      this.personagem.sprite.setVelocityY(40);
    }

    if (
      this.projetil?.active
      && Math.abs(this.projetil.x - this.personagem.sprite.x) > 1400
    ) {
      this.finalizarProjetil(false);
    }
  }
}
