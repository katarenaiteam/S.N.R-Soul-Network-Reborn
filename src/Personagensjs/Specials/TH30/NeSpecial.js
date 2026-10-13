import {
  destruirColisor,
  registrarAtaqueEspecial,
} from "../../../Objetos/SistemaCombateEspecial.js";

export default class TH30NeSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.projeteis = new Set();
    this.efeito = null;
    this.gravidadeOriginal = null;
    this.aoAtualizarPose = this.aoAtualizarPose.bind(this);
    this.atualizarEfeito = this.atualizarEfeito.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    if (this.special.propriedades?.travarMovimentoAir && !sprite.body.blocked.down) {
      this.gravidadeOriginal = sprite.body.allowGravity;
      sprite.body.setAllowGravity(false);
      sprite.setVelocity(0, 0);
      sprite.setVelocityX(0);
    }
    sprite.on("animationupdate", this.aoAtualizarPose);
    this.aoAtualizarPose(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarPose(animacao, frame) {
    if (
      animacao?.key !== this.special.animacao ||
      Number(frame?.textureFrame) < this.special.quadroProjetil
    ) return;

    this.personagem.sprite.off("animationupdate", this.aoAtualizarPose);
    this.criarEfeitoAbdomen();
    this.criarProjeteis();
  }

  obterPosicaoAbdomen() {
    const sprite = this.personagem.sprite;
    const direcao = sprite.flipX ? -1 : 1;
    return {
      x: sprite.x + this.special.offsetEfeitoX * direcao,
      y: sprite.y + this.special.offsetEfeitoY,
    };
  }

  criarEfeitoAbdomen() {
    const sprite = this.personagem.sprite;
    const posicao = this.obterPosicaoAbdomen();
    this.efeito = this.scene.add.sprite(posicao.x, posicao.y, "th_proj", 18);
    this.efeito
      .setScale(this.special.escalaEfeito)
      .setAlpha(this.special.alphaProjetil)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(sprite.depth + 5);
    this.scene.camHUD?.ignore(this.efeito);
    this.efeito.anims.play("th_proj_explosao");
    this.scene.events.on("postupdate", this.atualizarEfeito);
    this.efeito.once("animationcomplete-th_proj_explosao", () => this.limparEfeito());
  }

  atualizarEfeito() {
    if (!this.efeito?.active || !this.personagem.sprite?.active) {
      this.limparEfeito();
      return;
    }
    const posicao = this.obterPosicaoAbdomen();
    this.efeito.setPosition(posicao.x, posicao.y);
    this.efeito.setFlipX(this.personagem.sprite.flipX);
  }

  limparEfeito() {
    this.scene.events.off("postupdate", this.atualizarEfeito);
    this.efeito?.destroy();
    this.efeito = null;
    this.encerrarSeVazio();
  }

  criarProjeteis() {
    const sprite = this.personagem.sprite;
    if (!sprite?.active) return;
    const direcao = sprite.flipX ? -1 : 1;
    const quantidade = this.special.quantidadeProjeteis ?? 1;
    for (let indice = 0; indice < quantidade; indice++) {
      this.criarProjetil(sprite, direcao, indice);
    }
  }

  criarProjetil(sprite, direcao, indice) {
    const projetil = this.scene.physics.add.sprite(
      sprite.x + this.special.offsetProjetilX * direcao,
      sprite.y + this.special.offsetProjetilY,
      "th_proj",
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
    projetil.body.setSize(this.special.larguraProjetil, this.special.alturaProjetil, false);
    projetil.body.setOffset(
      direcao < 0 ? 108 - this.special.larguraProjetil : 0,
      this.special.offsetCorpoProjetilY ?? 44,
    );
    const velocidadesY = this.special.velocidadesProjetilY;
    projetil.body.setVelocity(
      this.special.velocidadeProjetil * direcao,
      velocidadesY?.[indice] ?? 0,
    );
    projetil.anims.play("th_proj_voo");

    const registro = { projetil, ataque: null, colisor: null, timer: null };
    this.projeteis.add(registro);
    registro.ataque = registrarAtaqueEspecial(this, projetil, {
      categoria: "projetil",
      aoColidir: () => this.finalizarProjetil(registro),
      aoAtingirAlvo: (alvo) => this.atingirAlvo(registro, alvo, direcao),
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
      this.special.tempoMaximoProjetil,
      () => this.finalizarProjetil(registro),
    );
  }

  atingirAlvo(registro, alvo, direcao) {
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
    registro.timer?.remove(false);
    registro.ataque?.remover();
    registro.projetil.destroy();
    this.projeteis.delete(registro);
    this.encerrarSeVazio();
  }

  encerrarSeVazio() {
    if (this.projeteis.size > 0 || this.efeito?.active) return;
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    this.personagem.sprite.off("animationupdate", this.aoAtualizarPose);
    if (this.gravidadeOriginal !== null && this.personagem.sprite?.body) {
      this.personagem.sprite.body.setAllowGravity(this.gravidadeOriginal);
      this.gravidadeOriginal = null;
    }
    // Projéteis já lançados continuam, como nos outros specials de projétil.
    this.encerrarSeVazio();
  }
}
