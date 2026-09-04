import {
  obterAlvosCombate,
  registrarAtaqueEspecial,
} from "../../../Objetos/SistemaCombateEspecial.js";

export default class MikuSpin {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;

    this.iniciado = false;
    this.finalizando = false;
    this.finalizado = false;
    this.cancelado = false;
    this.inicio = 0;
    this.direcao = 1;
    this.direcaoDesejada = 1;
    this.velocidadeAtual = 0;

    this.hitbox = null;
    this.overlaps = [];
    this.alvo = null;
    this.somRolagem = null;
    this.efeitoSpine = null;
    this.timerFinal = null;
    this.aoCompletarFinal = null;
    this.aoCompletarInicio = null;
  }

  executar() {
    if (this.iniciado) return;
    this.iniciado = true;
    this.inicio = this.scene.time.now;

    const esquerda = this.personagem.inputDown("esquerda");
    const direita = this.personagem.inputDown("direita");
    this.direcao = esquerda && !direita
      ? -1
      : direita && !esquerda
        ? 1
        : (this.personagem.sprite.flipX ? -1 : 1);
    this.direcaoDesejada = this.direcao;
    this.velocidadeAtual = MikuSpin.VELOCIDADE_INICIAL;

    this.personagem.sprite.setFlipX(this.direcao < 0);
    this.personagem.sprite.setVelocityX(this.velocidadeAtual * this.direcao);
    this.criarHitbox();
    this.iniciarSom();

    this.aoCompletarInicio = (animacao) => {
      if (animacao.key !== "miku_spin" || this.finalizando) return;
      this.personagem.sprite.play("miku_spinLoop", true);
      this.personagem.aplicarConfiguracao("spinLoop");
      this.aoCompletarInicio = null;
    };
    this.personagem.sprite.once("animationcomplete", this.aoCompletarInicio);
  }

  iniciarSom() {
    if (!this.scene.cache.audio.exists("RollingGirl")) return;
    this.somRolagem = this.scene.sound.add("RollingGirl", {
      volume: 0.55,
      loop: true,
    });
    this.somRolagem.play();
  }

  criarHitbox() {
    const sprite = this.personagem.sprite;
    this.hitbox = this.scene.add.zone(sprite.x, sprite.y - 80, 100, 60);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);

    registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoColidir: () => this.cancelar(),
    });

    this.obterOponentes().forEach((oponente) => {
      const overlap = this.scene.physics.add.overlap(
        this.hitbox,
        oponente.grupoHurtbox,
        () => this.acertar(oponente),
        null,
        this
      );
      this.overlaps.push(overlap);
    });
  }

  obterOponentes() {
    return obterAlvosCombate(this.personagem);
  }

  acertar(alvo) {
    if (this.finalizando || !alvo?.sprite?.active) return;

    this.alvo = alvo;
    this.limparHitbox();
    this.iniciarFinal();
  }

  atualizarDirecao(delta) {
    const esquerda = this.personagem.inputDown("esquerda");
    const direita = this.personagem.inputDown("direita");

    if (esquerda !== direita) {
      this.direcaoDesejada = esquerda ? -1 : 1;
    }

    if (this.direcaoDesejada !== this.direcao) {
      this.velocidadeAtual = Math.max(
        0,
        this.velocidadeAtual - MikuSpin.DESACELERACAO_REVERSAO * delta
      );
      if (this.velocidadeAtual <= 0) {
        this.direcao = this.direcaoDesejada;
        this.personagem.sprite.setFlipX(this.direcao < 0);
      }
    } else {
      this.velocidadeAtual = Math.min(
        MikuSpin.VELOCIDADE_MAXIMA,
        this.velocidadeAtual + MikuSpin.ACELERACAO * delta
      );
    }

    this.personagem.sprite.setVelocityX(this.velocidadeAtual * this.direcao);
  }

  aplicarQuedaLenta() {
    const body = this.personagem.sprite.body;
    if (!body || body.blocked.down) return;
    if (body.velocity.y > MikuSpin.VELOCIDADE_MAXIMA_QUEDA) {
      body.setVelocityY(MikuSpin.VELOCIDADE_MAXIMA_QUEDA);
    }
  }

  iniciarFinal() {
    if (this.finalizando || this.cancelado) return;
    this.finalizando = true;
    this.personagem.sprite.off("animationcomplete", this.aoCompletarInicio);
    this.aoCompletarInicio = null;
    this.limparHitbox();
    this.pararSom();

    const sprite = this.personagem.sprite;
    const body = sprite.body;
    const corpoXAntes = body.x;
    const encostadaNaParede =
      body.blocked.left || body.blocked.right ||
      body.touching.left || body.touching.right;
    const velocidadeFinalX = encostadaNaParede
      ? 0
      : body.velocity.x * 0.35;

    sprite.play("miku_spinFinal", true);
    this.personagem.aplicarConfiguracao("spinFinal");

    // A troca de spritesheet altera o offset interno do Arcade Body.
    // Mantem a hitbox fisica no mesmo X mundial para ela nao saltar para a parede.
    body.updateFromGameObject();
    sprite.x += corpoXAntes - body.x;
    body.updateFromGameObject();
    body.setVelocityX(velocidadeFinalX);
    body.setVelocityY(MikuSpin.IMPULSO_FINAL_Y);
    this.criarSpine();

    if (this.alvo) this.aplicarGolpeFinal();

    this.aoCompletarFinal = (animacao) => {
      if (animacao.key === "miku_spinFinal") this.finalizar();
    };
    sprite.once("animationcomplete", this.aoCompletarFinal);
    this.timerFinal = this.scene.time.delayedCall(850, () => this.finalizar());
  }

  criarSpine() {
    const sprite = this.personagem.sprite;
    this.efeitoSpine = this.scene.add.sprite(
      sprite.x,
      sprite.y - 70,
      "Miku_spine"
    );
    this.efeitoSpine.setDepth(sprite.depth + 1);
    this.efeitoSpine.setScale(0.85);
    this.efeitoSpine.setBlendMode(Phaser.BlendModes.ADD);
    this.efeitoSpine.setAlpha(0.9);
    this.efeitoSpine.play("miku_spine");
    this.scene.camHUD?.ignore(this.efeitoSpine);
    this.efeitoSpine.once("animationcomplete", () => {
      this.efeitoSpine?.destroy();
      this.efeitoSpine = null;
    });
  }

  aplicarGolpeFinal() {
    const alvo = this.alvo;
    if (!alvo) return;
    this.alvo = null;

    const propriedades = this.special.propriedades ?? {};
    alvo.receberDano(
      propriedades.dano ?? 18,
      propriedades,
      { x: this.personagem.sprite.x, direcao: this.direcao }
    );
  }

  atualizar() {
    if (!this.iniciado || this.cancelado || this.finalizado) return;

    if (this.efeitoSpine?.active) {
      this.efeitoSpine.setPosition(
        this.personagem.sprite.x,
        this.personagem.sprite.y - 70
      );
    }

    if (this.finalizando) return;

    const delta = Math.min(this.scene.game.loop.delta / 1000, 0.05);
    this.atualizarDirecao(delta);
    this.aplicarQuedaLenta();
    if (this.hitbox?.active) {
      this.hitbox.setPosition(
        this.personagem.sprite.x + 12 * this.direcao,
        this.personagem.sprite.y - 80
      );
    }

    const tempoDecorrido = this.scene.time.now - this.inicio;
    const passouTempoMinimo = tempoDecorrido >= MikuSpin.DURACAO_MINIMA;
    const passouLimite = tempoDecorrido >= MikuSpin.DURACAO_MAXIMA;
    const soltouDepoisDoMinimo =
      !this.personagem.inputDown("special") && passouTempoMinimo;
    if (soltouDepoisDoMinimo || passouLimite) {
      this.iniciarFinal();
    }
  }

  limparHitbox() {
    this.overlaps.forEach((overlap) => overlap?.destroy());
    this.overlaps = [];
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  pararSom() {
    if (!this.somRolagem) return;
    this.somRolagem.stop();
    this.somRolagem.destroy();
    this.somRolagem = null;
  }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.timerFinal?.remove(false);
    this.timerFinal = null;
    this.efeitoSpine?.destroy();
    this.efeitoSpine = null;

    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
    this.removerDaListaAtiva();
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    this.cancelado = true;
    this.limparHitbox();
    this.pararSom();
    this.timerFinal?.remove(false);
    this.timerFinal = null;
    this.personagem.sprite.off("animationcomplete", this.aoCompletarInicio);
    this.personagem.sprite.off("animationcomplete", this.aoCompletarFinal);
    this.efeitoSpine?.destroy();
    this.efeitoSpine = null;
    this.alvo = null;
    this.removerDaListaAtiva();
  }
}

MikuSpin.VELOCIDADE_INICIAL = 150;
MikuSpin.VELOCIDADE_MAXIMA = 645;
MikuSpin.ACELERACAO = 520;
MikuSpin.DESACELERACAO_REVERSAO = 760;
MikuSpin.DURACAO_MINIMA = 800;
MikuSpin.DURACAO_MAXIMA = 20000;
MikuSpin.VELOCIDADE_MAXIMA_QUEDA = 85;
MikuSpin.IMPULSO_FINAL_Y = -330;








