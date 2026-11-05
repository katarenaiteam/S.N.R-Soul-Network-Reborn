import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class GokuSiSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.fase = "mirando";
    this.finalizado = false;
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.inicio = this.scene.time.now;
    this.ultimaAtualizacao = this.inicio;
    this.distanciaMira = special.distanciaInicialMira;
    this.alvosAtingidos = new Set();
    this.hitbox = null;
    this.registroAtaque = null;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    sprite.setVelocityX(0);
    this.mira = this.scene.add.sprite(
      sprite.x + this.direcao * this.distanciaMira,
      sprite.y - this.special.offsetMiraY,
      "mira",
      0,
    ).setDepth(sprite.depth + 1);
    this.mira.anims.play("goku_mira");
    this.scene.camHUD?.ignore(this.mira);
  }

  atualizar() {
    if (this.finalizado) return;
    if (
      !this.personagem.sprite?.active ||
      this.personagem.maquinaEstados.estadoAtual !== this.estado
    ) {
      this.cancelar();
      return;
    }

    if (this.fase === "mirando") {
      this.atualizarMira();
      if (this.scene.time.now - this.inicio >= this.special.tempoMira) {
        this.iniciarChute();
      }
      return;
    }

    this.atualizarHitbox();
  }

  atualizarMira() {
    const agora = this.scene.time.now;
    const delta = Math.max(0, (agora - this.ultimaAtualizacao) / 1000);
    this.ultimaAtualizacao = agora;
    if (this.personagem.inputDown("special")) {
      this.distanciaMira = Math.min(
        this.special.distanciaMaximaMira,
        this.distanciaMira + this.special.velocidadeMira * delta,
      );
    }
    this.mira?.setPosition(
      this.personagem.sprite.x + this.direcao * this.distanciaMira,
      this.personagem.sprite.y - this.special.offsetMiraY,
    );
  }

  iniciarChute() {
    if (this.fase !== "mirando") return;
    this.fase = "chute";
    const sprite = this.personagem.sprite;
    const destinoX = this.mira?.x ?? sprite.x + this.direcao * this.distanciaMira;
    this.mira?.destroy();
    this.mira = null;
    sprite.setPosition(destinoX, sprite.y);
    sprite.body.updateFromGameObject();
    sprite.body.prev.copy(sprite.body.position);
    sprite.body.prevFrame.copy(sprite.body.position);
    sprite.body.autoFrame?.copy(sprite.body.position);
    sprite.setVelocity(0, 0);
    sprite.play(this.special.animacaoChute, true);
    this.personagem.configAnimacaoOverride = "siSpecial";
    this.personagem.aplicarConfiguracao("siSpecial");
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacaoChute}`, this.aoCompletarAnimacao);
    this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || this.fase !== "chute" || animacao?.key !== this.special.animacaoChute) return;
    const quadro = Number(frame?.textureFrame);
    if (quadro >= this.special.hitbox.frameInicio && quadro <= this.special.hitbox.frameFim) {
      this.criarHitbox();
    } else {
      this.destruirHitbox();
    }
  }

  criarHitbox() {
    if (this.hitbox) return;
    const cfg = this.special.hitbox;
    this.hitbox = this.scene.add.zone(0, 0, cfg.largura, cfg.altura);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.registroAtaque = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.acertar(alvo),
    });
    this.atualizarHitbox();
  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const cfg = this.special.hitbox;
    this.hitbox.setPosition(
      this.personagem.sprite.x + cfg.offsetX * this.direcao,
      this.personagem.sprite.y + cfg.offsetY,
    );
    this.hitbox.body.updateFromGameObject();
  }

  acertar(alvo) {
    if (this.finalizado || this.alvosAtingidos.has(alvo) || alvo.invulneravel) return;
    this.alvosAtingidos.add(alvo);
    const progresso = Phaser.Math.Clamp(
      (this.distanciaMira - this.special.distanciaInicialMira) /
        (this.special.distanciaMaximaMira - this.special.distanciaInicialMira),
      0,
      1,
    );
    const propriedades = {
      ...this.special.propriedades,
      dano: this.special.danoInicial + progresso * this.special.aumentoDanoDistancia,
    };
    alvo.receberDano(propriedades.dano, propriedades, {
      direcao: this.direcao,
      x: this.personagem.sprite.x,
      atacante: this.personagem,
    });
  }

  aoCompletarAnimacao() {
    if (this.finalizado) return;
    this.cancelar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
  }

  destruirHitbox() {
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizado = true;
    const sprite = this.personagem.sprite;
    sprite?.off("animationupdate", this.aoAtualizarAnimacao);
    sprite?.off(`animationcomplete-${this.special.animacaoChute}`, this.aoCompletarAnimacao);
    this.mira?.destroy();
    this.mira = null;
    this.destruirHitbox();
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}

GokuSiSpecial.configuracao = {
  animacao: "gk_siSpecial_prepare",
  configuracaoAnimacao: "siSpecialPrepare",
  logica: GokuSiSpecial,
  animacaoChute: "gk_siSpecial",
  tempoMira: 400,
  distanciaInicialMira: 80,
  distanciaMaximaMira: 440,
  velocidadeMira: 450,
  offsetMiraY: 50,
  danoInicial: 17,
  aumentoDanoDistancia: 1.2,
  propriedades: {
    tipoSomImpacto: "heavy",
    knockbackX: 420,
    knockbackY: -100,
    knockbackFixo: false,
    tumbling: true,
  },
  hitbox: {
    frameInicio: 2,
    frameFim: 5,
    largura: 100,
    altura: 72,
    offsetX: 48,
    offsetY: -58,
  },
};
