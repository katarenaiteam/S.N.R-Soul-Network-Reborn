import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class AigisDoSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.hitbox = null;
    this.efeitoDeslize = null;
    this.rastroChao = null;
    this.inicioAvanco = null;
    this.alvosAtingidos = new Set();
    this.finalizado = false;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    this.inicioAvanco = this.scene.time.now;
    sprite.setVelocityX(this.direcao * this.special.velocidadeInicialAvanco);
    this.criarEfeitosAvanco();
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    if (sprite.anims.currentFrame) {
      this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
    }
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || animacao?.key !== this.special.animacao || !frame) return;
    const quadro = Number(frame.textureFrame);
    if (quadro >= this.special.quadroHitbox && !this.hitbox) this.criarHitbox();
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }
    this.atualizarAvanco();
    this.atualizarHitbox();
    this.atualizarEfeitoDeslize();
  }

  atualizarAvanco() {
    if (this.inicioAvanco === null) return;
    const progresso = Phaser.Math.Clamp(
      (this.scene.time.now - this.inicioAvanco) / this.special.duracaoAvanco,
      0,
      1,
    );
    const velocidade = this.special.velocidadeInicialAvanco * (1 - progresso) ** 2;
    this.personagem.sprite.setVelocityX(this.direcao * velocidade);
  }

  criarEfeitosAvanco() {
    const sprite = this.personagem.sprite;
    this.efeitoDeslize = this.scene.add.sprite(sprite.x, sprite.y, "ai_doE1", 0)
      .setOrigin(0.5, 0.5)
      .setScale(this.special.escalaEfeitoDeslize)
      .setFlipX(this.direcao < 0)
      .setDepth(sprite.depth - 1);
    this.efeitoDeslize.anims.play("ai_doE1_deslize");
    this.rastroChao = this.scene.add.sprite(
      sprite.x + this.direcao * this.special.offsetRastroChaoX,
      sprite.y - this.special.offsetRastroChaoY,
      "ai_doE2",
      0,
    )
      .setOrigin(0.5, 0.5)
      .setScale(this.special.escalaRastroChao)
      .setFlipX(this.direcao < 0)
      .setDepth(sprite.depth - 2);
    this.scene.camHUD?.ignore(this.efeitoDeslize);
    this.scene.camHUD?.ignore(this.rastroChao);
  }

  atualizarEfeitoDeslize() {
    if (!this.efeitoDeslize?.active) return;
    const sprite = this.personagem.sprite;
    this.efeitoDeslize.setPosition(
      sprite.x - this.direcao * this.special.offsetEfeitoDeslizeX,
      sprite.y - this.special.offsetEfeitoDeslizeY,
    );
  }

  criarHitbox() {
    if (this.hitbox) return;
    this.hitbox = this.scene.add.zone(0, 0, this.special.hitbox.largura, this.special.hitbox.altura);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.atualizarHitbox();

    registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.acertar(alvo),
    });
  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const sprite = this.personagem.sprite;
    this.hitbox.setPosition(
      sprite.x + this.special.hitbox.offsetX * this.direcao,
      sprite.y + this.special.hitbox.offsetY,
    );
    this.hitbox.body.updateFromGameObject();
  }

  acertar(alvo) {
    if (this.finalizado || !this.hitbox?.active || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    this.personagem.vfx?.tocarListaImpacto(
      [{ escolherUm: ["punch1", "punch2", "punch3"] }],
      alvo,
      this.hitbox,
    );
    alvo.receberDano(
      this.special.propriedadesAtaque.dano,
      this.special.propriedadesAtaque,
      {
        x: this.personagem.sprite.x,
        direcao: this.direcao,
        atacante: this.personagem,
      },
    );
  }

  destruirHitbox() {
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  destruirEfeitosAvanco() {
    this.efeitoDeslize?.destroy();
    this.efeitoDeslize = null;
    this.rastroChao?.destroy();
    this.rastroChao = null;
  }

  aoCompletarAnimacao() {
    if (this.finalizado) return;
    this.cancelar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizado = true;
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.aoAtualizarAnimacao);
    sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    sprite.setVelocityX(0);
    this.destruirHitbox();
    this.destruirEfeitosAvanco();
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}

AigisDoSpecial.configuracao = {
  animacao: "ai_doSpecial",
  logica: AigisDoSpecial,
  cooldown: 900,
  quadroHitbox: 2,
  velocidadeInicialAvanco: 850,
  duracaoAvanco: 460,
  offsetEfeitoDeslizeX: 32,
  offsetEfeitoDeslizeY: 30,
  escalaEfeitoDeslize: 0.55,
  offsetRastroChaoX: 70,
  offsetRastroChaoY: 31,
  escalaRastroChao: 0.35,
  hitbox: {
    largura: 60,
    altura: 62,
    offsetX: 25,
    offsetY: -42,
  },
  propriedadesAtaque: {
    dano: 18,
    tipoSomImpacto: "heavy",
    knockbackX: 200,
    knockbackY: -260,
    knockbackFixo: true,
    tumbling: false,
    hitstunFrames: 40,
    ignorarHitstunDecay: true,
  },
};
