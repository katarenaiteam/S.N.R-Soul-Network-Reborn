import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class PinguDoSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.fase = "preparacao";
    this.velocidadeGiro = special.velocidadeGiroInicial;
    this.velocidadeAvanco = 0;
    this.limiteVelocidadeAvanco = 0;
    this.progressoCarga = 0;
    this.ultimoUpdate = this.scene.time.now;
    this.ultimoApertoSpecial = this.scene.time.now;
    this.alvosAtingidos = new Set();
    this.hitbox = null;
    this.registroHitbox = null;
    this.aoCompletarPreparacao = this.aoCompletarPreparacao.bind(this);
    this.aoCompletarLaunch = this.aoCompletarLaunch.bind(this);
    this.aoCompletarAcerto = this.aoCompletarAcerto.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    sprite.setVelocityX(0);
    sprite.once("animationcomplete-pingu_doSpecial", this.aoCompletarPreparacao);
  }

  aoCompletarPreparacao() {
    if (this.fase !== "preparacao" || !this.estaAtivo()) return;
    this.fase = "carga";
    this.velocidadeGiro = this.special.velocidadeGiroInicial;
    this.ultimoUpdate = this.scene.time.now;
    this.ultimoApertoSpecial = this.scene.time.now;
    const sprite = this.personagem.sprite;
    sprite.setVelocityX(0);
    sprite.anims.play("pingu_doCharg", true);
    this.personagem.aplicarConfiguracao("doCharg");
    sprite.anims.timeScale = this.velocidadeGiro;
  }

  atualizar() {
    if (this.fase === "finalizado") return;
    if (!this.estaAtivo()) {
      this.cancelar();
      return;
    }

    if (
      this.fase !== "acerto" &&
      this.personagem.inputJustDown("cima") &&
      this.personagem.pulos < this.personagem.maxPulos
    ) {
      this.cancelar();
      this.personagem.pular();
      return;
    }

    const sprite = this.personagem.sprite;
    const agora = this.scene.time.now;
    const delta = Math.max(0, agora - this.ultimoUpdate);
    const deltaSegundos = Math.min(delta / 1000, 0.05);
    this.ultimoUpdate = agora;

    if (this.fase === "preparacao" || this.fase === "carga") {
      sprite.setVelocityX(0);
    }

    if (this.fase === "carga") {
      const specialApertado = this.personagem.inputDown("special");
      if (specialApertado) {
        this.velocidadeGiro = Math.min(
          this.special.velocidadeGiroMaxima,
          this.velocidadeGiro + this.special.aceleracaoPorAperto * deltaSegundos,
        );
        this.ultimoApertoSpecial = agora;
      } else if (agora - this.ultimoApertoSpecial > this.special.atrasoPerdaVelocidade) {
        this.velocidadeGiro = Math.max(
          this.special.velocidadeGiroInicial,
          this.velocidadeGiro - this.special.perdaVelocidadePorSegundo * delta / 1000,
        );
      }

      sprite.anims.timeScale = this.velocidadeGiro;
      if (!this.personagem.inputDown("baixo")) this.iniciarAvanco();
      return;
    }

    if (this.fase === "avanco") {
      if (sprite.body.blocked.down && sprite.body.velocity.y > 0) {
        sprite.setVelocityY(0);
      }
      this.atualizarAvanco(deltaSegundos);
      this.atualizarHitbox();
    }
  }

  iniciarAvanco() {
    if (this.fase !== "carga") return;
    this.fase = "avanco";
    const progresso = Phaser.Math.Clamp(
      (this.velocidadeGiro - this.special.velocidadeGiroInicial) /
        (this.special.velocidadeGiroMaxima - this.special.velocidadeGiroInicial),
      0,
      1,
    );
    this.progressoCarga = progresso;
    const sprite = this.personagem.sprite;
    this.direcaoDesejada = this.direcao;
    sprite.anims.timeScale = 1;
    sprite.anims.play("pingu_doLaunch", true);
    this.personagem.aplicarConfiguracao("doLaunch");
    sprite.once("animationcomplete-pingu_doLaunch", this.aoCompletarLaunch);
    this.velocidadeAvanco = this.special.impulsoXInicial + this.special.impulsoXMaximo * progresso;
    this.limiteVelocidadeAvanco = this.velocidadeAvanco;
    sprite.body.setVelocity(
      this.direcao * this.velocidadeAvanco,
      -(this.special.impulsoYInicial + this.special.impulsoYMaximo * progresso),
    );
    this.criarHitbox();
  }

  aoCompletarLaunch() {
    if (this.fase !== "avanco" || !this.estaAtivo()) return;
    const sprite = this.personagem.sprite;
    sprite.anims.play("pingu_doCharg", true);
    this.personagem.aplicarConfiguracao("doCharg");
    sprite.anims.timeScale = this.special.velocidadeAnimAvanco;
  }

  atualizarAvanco(delta) {
    const esquerda = this.personagem.inputDown("esquerda");
    const direita = this.personagem.inputDown("direita");
    const sprite = this.personagem.sprite;
    this.limiteVelocidadeAvanco = Math.max(
      0,
      this.limiteVelocidadeAvanco - this.special.desaceleracaoAvanco * delta,
    );
    if (esquerda !== direita) this.direcaoDesejada = esquerda ? -1 : 1;

    if (this.direcaoDesejada !== this.direcao) {
      this.velocidadeAvanco = Math.max(
        0,
        this.velocidadeAvanco - this.special.desaceleracaoReversao * delta,
      );
      if (this.velocidadeAvanco <= 0) {
        this.direcao = this.direcaoDesejada;
        sprite.setFlipX(this.direcao < 0);
      }
    } else if (esquerda || direita) {
      this.velocidadeAvanco = Math.min(
        this.special.velocidadeAvancoMaxima,
        this.velocidadeAvanco + this.special.aceleracaoAvanco * delta,
      );
    } else {
      this.velocidadeAvanco = Math.max(
        0,
        this.velocidadeAvanco - this.special.desaceleracaoAvanco * delta,
      );
    }

    this.velocidadeAvanco = Math.min(this.velocidadeAvanco, this.limiteVelocidadeAvanco);
    sprite.setVelocityX(this.direcao * this.velocidadeAvanco);
    if (this.limiteVelocidadeAvanco <= this.special.velocidadeMinimaAvanco) {
      this.finalizarAvanco();
    }
  }

  criarHitbox() {
    const cfg = this.special.hitbox;
    this.hitbox = this.scene.add.zone(0, 0, cfg.largura, cfg.altura);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.setSize(cfg.largura, cfg.altura);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.atualizarHitbox();
    this.registroHitbox = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.acertar(alvo),
    });

  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const sprite = this.personagem.sprite;
    const cfg = this.special.hitbox;
    this.hitbox.setPosition(
      sprite.x + cfg.offsetX * this.direcao,
      sprite.y + cfg.offsetY,
    );
    this.hitbox.body.updateFromGameObject();
  }

  acertar(alvo) {
    if (this.fase !== "avanco" || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    const propriedades = {
      ...this.special.propriedades,
      dano: Phaser.Math.Linear(
        this.special.danoMinimo,
        this.special.danoMaximo,
        this.progressoCarga,
      ),
      knockbackX: Phaser.Math.Linear(
        this.special.knockbackXMinimo,
        this.special.knockbackXMaximo,
        this.progressoCarga,
      ),
      knockbackY: Phaser.Math.Linear(
        this.special.knockbackYMinimo,
        this.special.knockbackYMaximo,
        this.progressoCarga,
      ),
    };
    alvo.receberDano(propriedades.dano, propriedades, {
      direcao: this.direcao,
      x: this.personagem.sprite.x,
      atacante: this.personagem,
    });
    this.limparHitbox();

    this.fase = "acerto";
    const sprite = this.personagem.sprite;
    sprite.off("animationcomplete-pingu_doLaunch", this.aoCompletarLaunch);
    if (sprite.body.blocked.down) sprite.setVelocityY(0);
    sprite.setVelocityX(-this.direcao * this.special.recuoX);
    sprite.anims.play("pingu_doStrike", true);
    this.personagem.aplicarConfiguracao("doStrike");
    sprite.once("animationcomplete-pingu_doStrike", this.aoCompletarAcerto);
    const som = this.personagem.sons?.[propriedades.tipoSomImpacto];
    if (som) this.personagem.tocarSomSorteado(som, { volume: 0.15 });
  }

  finalizarAvanco() {
    this.limparHitbox();
    this.personagem.sprite.off("animationcomplete-pingu_doLaunch", this.aoCompletarLaunch);
    this.personagem.sprite.setVelocityX(0);
    this.finalizarEstado();
  }

  aoCompletarAcerto() {
    if (this.fase !== "acerto") return;
    this.personagem.sprite.off("animationcomplete-pingu_doStrike", this.aoCompletarAcerto);
    this.finalizarEstado();
  }

  finalizarEstado() {
    this.fase = "finalizado";
    this.personagem.sprite.anims.timeScale = 1;
    if (this.estaAtivo()) this.estado.finalizarSpecial();
    this.removerDaListaAtiva();
  }

  estaAtivo() {
    return this.personagem.maquinaEstados.estadoAtual === this.estado;
  }

  limparHitbox() {
    this.registroHitbox?.remover();
    this.registroHitbox = null;
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    if (this.fase === "finalizado") return;
    const sprite = this.personagem.sprite;
    sprite.off("animationcomplete-pingu_doSpecial", this.aoCompletarPreparacao);
    sprite.off("animationcomplete-pingu_doLaunch", this.aoCompletarLaunch);
    sprite.off("animationcomplete-pingu_doStrike", this.aoCompletarAcerto);
    sprite.anims.timeScale = 1;
    this.limparHitbox();
    this.fase = "finalizado";
    this.removerDaListaAtiva();
  }
}

PinguDoSpecial.configuracao = {
  animacao: "pingu_doSpecial",
  logica: PinguDoSpecial,
  cooldown: 1200,
  velocidadeGiroInicial: 2.5,
  velocidadeGiroMaxima: 8,
  aceleracaoPorAperto: 8,
  atrasoPerdaVelocidade: 500,
  perdaVelocidadePorSegundo: 0.8,
  impulsoXInicial: 500,
  impulsoXMaximo: 1000,
  aceleracaoAvanco: 900,
  desaceleracaoReversao: 1200,
  velocidadeAvancoMaxima: 1000,
  desaceleracaoAvanco: 290,
  velocidadeMinimaAvanco: 0,
  velocidadeAnimAvanco: 5,
  impulsoYInicial: 90,
  impulsoYMaximo: 60,
  recuoX: 90,
  hitbox: {
    largura: 60,
    altura: 40,
    offsetX: 10,
    offsetY: -20,
  },
  danoMinimo: 10,
  danoMaximo: 25,
  knockbackXMinimo: 390,
  knockbackXMaximo: 780,
  knockbackYMinimo: -156,
  knockbackYMaximo: -390,
  propriedades: {
    dano: 10,
    tipoSomImpacto: "heavy",
    knockbackX: 234,
    knockbackY: -104,
    knockbackFixo: false,
    hitstunFrames: 25,
    travarMovimentoAir: true,
  },
};
