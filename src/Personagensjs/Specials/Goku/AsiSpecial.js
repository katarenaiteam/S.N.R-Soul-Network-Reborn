import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

const PROPRIEDADES_MONTADO = {
  tipoSomImpacto: "heavy",
  dano: 18,
  knockbackX: 520,
  knockbackY: -250,
  tumbling: true,
};

const PROPRIEDADES_NUVEM = {
  tipoSomImpacto: "heavy",
  dano: 9,
  knockbackX: 280,
  knockbackY: -150,
  tumbling: true,
};

export default class GokuAsiSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.fase = "inicio";
    this.inicio = 0;
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.alvosAtingidos = new Set();
    this.nuvem = null;
    this.hitbox = null;
    this.registroAtaque = null;
    this.tweenNuvem = null;
    this.finalizado = false;
    this.cancelado = false;
    this.aguardandoSoltarInicial = true;
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.inicio = this.scene.time.now;
    this.personagem.aplicarConfiguracao("Asi_Special");
    sprite.setVelocityX(this.direcao * this.special.velocidadeAvanco);
    sprite.setVelocityY(this.special.impulsoPulo);

    const nuvem = this.scene.physics.add.sprite(
      sprite.x - this.direcao * this.special.offsetNuvemInicio,
      sprite.y + this.special.offsetNuvemY,
      "nuvem",
      0,
    );
    this.nuvem = nuvem
      .setOrigin(0.5)
      .setScale(0.05)
      .setDepth(sprite.depth + 1)
      .setFlipX(this.direcao < 0)
      .play("goku_nuvem");
    nuvem.body.setAllowGravity(false);
    nuvem.body.setImmovable(true);
    nuvem.body.setSize(120, 36);
    this.scene.camHUD?.ignore(nuvem);

    this.tweenNuvem = this.scene.tweens.add({
      targets: nuvem,
      scale: this.special.escalaNuvem,
      duration: this.special.tempoAparecerNuvem,
      ease: "Cubic.easeOut",
      onComplete: () => {
        if (this.fase !== "inicio") return;
        this.fase = "montado";
        this.somNuvem = this.scene.sound.add("nuvem", { volume: 0.4, loop: true });
        this.somNuvem.play();
        this.inicioMontaria = this.inicio;
        sprite.body.setAllowGravity(false);
        sprite.setVelocityY(this.special.velocidadeQueda);
        sprite.play("gk_Asi_Special", true);
        this.criarHitbox();
      },
    });
  }

  criarHitbox() {
    this.hitbox = this.scene.add.zone(0, 0, 100, 90);
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
    this.atualizarHitboxNuvem();
  }

  atualizar() {
    if (this.fase === "nuvemSolta" || this.fase === "encerrando") {
      this.atualizarNuvemSolta();
      return;
    }
    if (this.cancelado || this.finalizado || this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }

    if (this.fase === "inicio") {
      this.atualizarAparecimento();
      return;
    }

    this.atualizarMontaria();
  }

  atualizarAparecimento() {
    const sprite = this.personagem.sprite;
    sprite.setVelocityX(this.direcao * this.special.velocidadeAvanco);
    const progresso = Phaser.Math.Clamp(
      (this.scene.time.now - this.inicio) / this.special.tempoAparecerNuvem,
      0,
      1,
    );
    this.nuvem?.setPosition(
      Phaser.Math.Linear(
        sprite.x - this.direcao * this.special.offsetNuvemInicio,
        sprite.x,
        progresso,
      ),
      sprite.y + this.special.offsetNuvemY,
    );
    if (sprite.body.velocity.y > this.special.velocidadeMaximaQuedaInicial) {
      sprite.setVelocityY(this.special.velocidadeMaximaQuedaInicial);
    }
  }

  atualizarMontaria() {
    const sprite = this.personagem.sprite;
    if (this.aguardandoSoltarInicial) {
      if (!this.personagem.inputDown("special")) this.aguardandoSoltarInicial = false;
    } else if (this.personagem.inputJustDown("special")) {
      this.desmontar();
      return;
    }

    sprite.setVelocityX(this.direcao * this.special.velocidadeAvanco);
    if (!sprite.body.blocked.down) {
      sprite.body.setAllowGravity(false);
      sprite.setVelocityY(this.special.velocidadeQueda);
    } else {
      sprite.setVelocityY(0);
    }
    this.nuvem?.setPosition(sprite.x, sprite.y + this.special.offsetNuvemY);
    this.atualizarHitboxNuvem();

    const body = sprite.body;
    if (
      (this.direcao > 0 && body.blocked.right) ||
      (this.direcao < 0 && body.blocked.left) ||
      this.scene.time.now - this.inicioMontaria >= this.special.duracaoMontaria
    ) {
      this.encerrarMontaria();
    }

  }

  atualizarHitboxNuvem() {
    if (!this.hitbox?.active || !this.nuvem?.active) return;
    const largura = this.special.larguraHitboxNuvem;
    const altura = this.special.alturaHitboxNuvem;
    this.hitbox.setSize(largura, altura);
    this.hitbox.body?.setSize(largura, altura);
    this.hitbox.setPosition(this.nuvem.x, this.nuvem.y);
    this.hitbox.body?.updateFromGameObject();
  }

  acertar(alvo) {
    if (!alvo?.sprite?.active || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    const propriedades = this.fase === "montado"
      ? PROPRIEDADES_MONTADO
      : PROPRIEDADES_NUVEM;
    const propriedadesKaioken = this.personagem.aplicarBonusDanoKaioken(
      propriedades.dano,
      propriedades,
    );
    alvo.receberDano(propriedadesKaioken.dano, propriedadesKaioken, {
      x: this.personagem.sprite.x,
      direcao: this.direcao,
      atacante: this.personagem,
    });
    this.personagem.tocarSomSorteado(this.personagem.sons?.heavy, { volume: 0.15 });
    if (this.fase === "montado") {
      this.encerrarMontaria();
    } else if (this.fase === "nuvemSolta") {
      this.iniciarFadeNuvemSolta();
    }
  }

  desmontar() {
    const sprite = this.personagem.sprite;
    this.fase = "nuvemSolta";
    this.somNuvem?.stop();
    this.somNuvem?.destroy();
    this.somNuvem = null;
    this.personagem.bloquearSpecialAteSoltar = true;
    this.nuvem.setPosition(
      this.nuvem.x - this.direcao * this.special.recuoLancamentoNuvem,
      this.personagem.sprite.y + this.special.offsetLancamentoNuvemY,
    );
    this.atualizarHitboxNuvem();
    this.hitbox.body?.updateFromGameObject();
    this.personagem.sprite.body.setAllowGravity(true);
    sprite.setVelocity(-this.direcao * this.special.velocidadeSaltoTras, this.special.impulsoSaltoTras);
    this.estado.finalizarSpecial();
  }

  encerrarMontaria() {
    if (this.fase !== "montado") return;
    this.fase = "encerrando";
    this.personagem.sprite.body.setAllowGravity(true);
    this.personagem.sprite.setVelocityX(0);
    this.hitbox?.setActive(false).setVisible(false);
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.tweenNuvem?.stop();
    if (this.nuvem?.active) {
      this.scene.tweens.add({
        targets: this.nuvem,
        alpha: 0,
        duration: this.special.duracaoFade,
        onComplete: () => this.limpar(),
      });
    }
    this.estado.finalizarSpecial();
  }

  atualizarNuvemSolta() {
    if (this.fase === "nuvemSolta" && this.nuvem?.active) {
      const delta = Math.min(this.scene.game.loop.delta / 1000, 0.05);
      this.nuvem.x += this.direcao * this.special.velocidadeNuvemSolta * delta;
      this.nuvem.y += this.special.velocidadeQuedaNuvemSolta * delta;
      this.nuvem.body?.updateFromGameObject();
      this.atualizarHitboxNuvem();
      const limites = this.scene.physics.world.bounds;
      if (this.nuvem.x < limites.left - this.nuvem.displayWidth || this.nuvem.x > limites.right + this.nuvem.displayWidth) {
        this.iniciarFadeNuvemSolta();
      }
    }
  }

  iniciarFadeNuvemSolta() {
    if (this.fase !== "nuvemSolta") return;
    this.fase = "encerrando";
    this.hitbox?.setActive(false).setVisible(false);
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.scene.tweens.add({
      targets: this.nuvem,
      alpha: 0,
      duration: this.special.duracaoFade,
      onComplete: () => this.limpar(),
    });
  }

  limpar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.somNuvem?.stop();
    this.somNuvem?.destroy();
    this.somNuvem = null;
    if (this.special.cooldown > 0) {
      this.personagem.iniciarCooldownSpecial(this.estado.tipoSpecialAtual);
    }
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
    this.nuvem?.destroy();
    this.nuvem = null;
    this.removerDaListaAtiva();
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    if (this.fase === "nuvemSolta" || this.fase === "encerrando") return;
    if (this.cancelado || this.finalizado) return;
    this.cancelado = true;
    this.tweenNuvem?.stop();
    this.personagem.sprite.body?.setAllowGravity(true);
    this.limpar();
  }
}

GokuAsiSpecial.configuracao = {
  animacao: "gk_Asi_Special",
  configuracaoAnimacao: "Asi_Special",
  logica: GokuAsiSpecial,
  propriedades: { travarMovimentoAir: true },
  iniciarCooldownAoFinalizar: true,
  cooldown: 900,
  impulsoPulo: -220,
  tempoAparecerNuvem: 240,
  escalaNuvem: 1,
  offsetNuvemInicio: 34,
  offsetNuvemY: 18,
  velocidadeMaximaQuedaInicial: 45,
  velocidadeAvanco: 600,
  velocidadeQueda: 24,
  duracaoMontaria: 1500,
  velocidadeSaltoTras: 150,
  impulsoSaltoTras: -250,
  larguraHitboxNuvem: 115,
  alturaHitboxNuvem: 48,
  velocidadeNuvemSolta: 300,
  velocidadeQuedaNuvemSolta: 220,
  recuoLancamentoNuvem: 18,
  offsetLancamentoNuvemY: 42,
  duracaoFade: 220,
};
