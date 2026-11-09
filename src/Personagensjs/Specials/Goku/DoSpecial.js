import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

const PROPRIEDADES_DANO = {
  tipoSomImpacto: "heavy",
  dano: 11,
  knockbackX: 75,
  knockbackY: -65,
  hitstunBaseFrames: 10,
};

const PROPRIEDADES_FINALIZACAO = {
  ...PROPRIEDADES_DANO,
  knockbackX: 97.5,
  knockbackY: -84.5,
};

export default class GokuDoSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.finalizado = false;
    this.fase = "inicio";
    this.alvosAtingidos = new Set();
    this.aoInicioCompleto = this.aoInicioCompleto.bind(this);
    this.aoCargaCompleta = this.aoCargaCompleta.bind(this);
    this.aoPoeiraCompleta = this.aoPoeiraCompleta.bind(this);
    this.aoCargaFinalCompleta = this.aoCargaFinalCompleta.bind(this);
    this.aoKaiokenCargaCompleta = this.aoKaiokenCargaCompleta.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    sprite.setVelocityX(0);
    sprite.once("animationcomplete-gk_doSpecial_inicio", this.aoInicioCompleto);
    this.criarEfeitos();
    this.criarHitbox();
    this.poeira.play("goku_charge_dust");
    this.poeira.once("animationcomplete-goku_charge_dust", this.aoPoeiraCompleta);
  }

  criarEfeitos() {
    const { sprite } = this.personagem;
    this.aura = this.scene.add.sprite(sprite.x, sprite.y, "charge_1")
      .setOrigin(0.5, 1).setScale(1.2).setDepth(sprite.depth - 1).setFlipX(sprite.flipX);
    this.poeira = this.scene.add.sprite(sprite.x, sprite.y, "charge_dust")
      .setOrigin(0.5, 1).setDepth(sprite.depth + 1).setFlipX(sprite.flipX);
    this.cargaFinal = this.scene.add.sprite(sprite.x, sprite.y, "charge_2")
      .setOrigin(0.5, 1).setScale(1.2).setDepth(sprite.depth - 1).setFlipX(sprite.flipX).setVisible(false);
    this.scene.camHUD?.ignore([this.aura, this.poeira, this.cargaFinal]);
  }

  aoInicioCompleto() {
    if (this.finalizado || !this.estaAtivo()) return;
    if (
      this.personagem.cargaKi >= this.personagem.cargaKiMaxima &&
      this.personagem.kaioken?.podeAtivar()
    ) {
      this.iniciarTransformacaoKaioken();
      return;
    }
    this.fase = "carregando";
    this.personagem.carregandoKi = true;
    this.personagem.tocarSomSorteado("gk-carga", { volume: 0.65, detune: 0 });
    this.somCargaKi = this.scene.sound.add("ki-carga", { volume: 0.3, loop: true });
    this.somCargaKi.play();
    this.aura.play("goku_charge_inicio");
    this.aura.once("animationcomplete-goku_charge_inicio", this.aoCargaCompleta);
    this.personagem.sprite.play("gk_doSpecial_loop");
    this.ultimoTempo = this.scene.time.now;
  }

  aoCargaCompleta() {
    if (!this.finalizado && this.fase === "carregando") this.aura.play("goku_charge_loop");
  }

  iniciarTransformacaoKaioken() {
    this.fase = "transformandoKaioken";
    this.personagem.carregandoKi = false;
    this.aura.setScale(2.1).setTint(0xff3028).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.9);
    this.cargaFinal.setScale(2.2).setTint(0xff3028).setBlendMode(Phaser.BlendModes.ADD);
    this.aura.play("goku_charge_inicio");
    this.aura.once("animationcomplete-goku_charge_inicio", () => {
      if (this.finalizado || this.fase !== "transformandoKaioken") return;
      this.aura.play("goku_charge_loop");
    });
    this.personagem.sprite.play("gk_doSpecial_loop", true);
    this.scene.time.delayedCall(1200, () => {
      if (this.finalizado || this.fase !== "transformandoKaioken") return;
      this.aura.setVisible(false);
      this.cargaFinal.setVisible(true).play("goku_charge_fim");
      this.cargaFinal.once("animationcomplete-goku_charge_fim", this.aoKaiokenCargaCompleta);
    });
  }

  aoKaiokenCargaCompleta() {
    if (this.finalizado || this.fase !== "transformandoKaioken") return;
    this.fase = "explosaoKaioken";
    const sprite = this.personagem.sprite;
    const explosao = this.scene.add.sprite(sprite.x, sprite.y - 70, "genk-e", 23)
      .setOrigin(0.5, 0.5)
      .setScale(1.2)
      .setDepth(sprite.depth + 2);
    this.scene.camHUD?.ignore(explosao);
    explosao.play("goku_genk_e_explosao");
    this.scene.tweens.add({
      targets: explosao,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 650,
      ease: "Cubic.easeOut",
      onComplete: () => explosao.destroy(),
    });
    this.scene.cameras.main.flash(300, 255, 90, 90);
    this.scene.time.delayedCall(180, () => {
      if (this.finalizado) return;
      this.finalizar();
      if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
        this.personagem.maquinaEstados.mudarEstado(
          this.personagem.sprite.body.blocked.down ? "idle" : "jump",
        );
      }
      const body = this.personagem.sprite.body;
      body.moves = true;
      body.setAllowGravity(true);
      body.setVelocityX(0);
      this.personagem.kaioken?.ativar();
    });
  }

  aoPoeiraCompleta() {
    if (!this.finalizado) this.poeira.setVisible(false);
  }

  atualizar() {
    if (this.finalizado) return;
    if (!this.estaAtivo()) return this.cancelar();
    this.personagem.sprite.setVelocityX(0);
    this.atualizarEfeitos();
    this.atualizarHitbox();
    if (this.fase !== "carregando") return;

    const agora = this.scene.time.now;
    const delta = Math.max(0, agora - (this.ultimoTempo ?? agora));
    this.ultimoTempo = agora;
    if (this.personagem.inputDown("special")) {
      this.personagem.cargaKi = Math.min(
        this.personagem.cargaKiMaxima,
        this.personagem.cargaKi + delta * this.special.taxaCargaPorMs,
      );
    } else {
      this.encerrarCarga();
      return;
    }
    if (this.personagem.cargaKi >= this.personagem.cargaKiMaxima) this.encerrarCarga();
  }

  atualizarEfeitos() {
    const { sprite } = this.personagem;
    [this.aura, this.poeira, this.cargaFinal].forEach((efeito) => {
      if (efeito?.active) efeito.setPosition(sprite.x, sprite.y).setFlipX(sprite.flipX);
    });
  }

  criarHitbox() {
    this.hitbox = this.scene.add.zone(0, 0, 120, 125);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false).setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.registroHitbox = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.acertar(alvo),
    });
  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const sprite = this.personagem.sprite;
    this.hitbox.setPosition(sprite.x, sprite.y - 55);
    this.hitbox.body.updateFromGameObject();
  }

  acertar(alvo) {
    if (this.finalizado || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    const propriedades = this.personagem.aplicarBonusDanoKaioken(11, PROPRIEDADES_DANO);
    alvo.receberDano(propriedades.dano, propriedades, {
      atacante: this.personagem,
      x: this.personagem.sprite.x,
      direcao: this.direcao,
    });
  }

  encerrarCarga() {
    if (this.fase !== "carregando") return;
    this.fase = "finalizando";
    this.personagem.carregandoKi = false;
    this.aura?.setVisible(false);
    this.cargaFinal?.setVisible(true).play("goku_charge_fim");
    this.cargaFinal?.once("animationcomplete-goku_charge_fim", this.aoCargaFinalCompleta);
    this.explodir();
  }

  explodir() {
    const zona = this.scene.add.zone(this.personagem.sprite.x, this.personagem.sprite.y - 55, 175, 175);
    this.scene.physics.add.existing(zona);
    zona.body.setAllowGravity(false).setImmovable(true);
    zona.body.debugBodyColor = 0xff0000;
    const registro = registrarAtaqueEspecial(this, zona, {
      categoria: "corpo",
      aoAtingirAlvo: (alvo) => {
        if (this.alvosAtingidos.has(alvo)) return;
        this.alvosAtingidos.add(alvo);
        const direcao = alvo.sprite.x < this.personagem.sprite.x ? -1 : 1;
        const propriedades = this.personagem.aplicarBonusDanoKaioken(11, PROPRIEDADES_FINALIZACAO);
        alvo.receberDano(propriedades.dano, propriedades, {
          atacante: this.personagem,
          x: this.personagem.sprite.x,
          direcao,
        });
      },
    });
    this.scene.time.delayedCall(120, () => {
      registro?.remover();
      zona.destroy();
    });
  }

  aoCargaFinalCompleta() {
    this.finalizar();
  }

  estaAtivo() { return this.personagem.maquinaEstados.estadoAtual === this.estado; }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.estado.finalizarSpecial();
    this.limpar();
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.limpar();
  }

  limpar() {
    this.personagem.carregandoKi = false;
    this.somCargaKi?.stop();
    this.somCargaKi?.destroy();
    this.somCargaKi = null;
    const sprite = this.personagem.sprite;
    sprite.off("animationcomplete-gk_doSpecial_inicio", this.aoInicioCompleto);
    this.cargaFinal?.off("animationcomplete-goku_charge_fim", this.aoCargaFinalCompleta);
    this.cargaFinal?.off("animationcomplete-goku_charge_fim", this.aoKaiokenCargaCompleta);
    this.registroHitbox?.remover();
    this.hitbox?.destroy();
    this.aura?.destroy();
    this.poeira?.destroy();
    this.cargaFinal?.destroy();
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}

GokuDoSpecial.configuracao = {
  animacao: "gk_doSpecial_inicio",
  logica: GokuDoSpecial,
  cooldown: 500,
  taxaCargaPorMs: 0.026,
};
