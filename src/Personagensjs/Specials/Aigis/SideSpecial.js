import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class AigisSideSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.iniciouSalto = false;
    this.iniciouMergulho = false;
    this.saiuDoChao = false;
    this.pousou = false;
    this.hitbox = null;
    this.alvosAtingidos = new Set();
    this.finalizado = false;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    if (sprite.anims.currentFrame) {
      this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
    }
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || animacao?.key !== this.special.animacao || !frame) return;
    const quadro = Number(frame.textureFrame);
    const sprite = this.personagem.sprite;
    if (!this.iniciouSalto && quadro >= this.special.quadroInicioAvanco) {
      this.iniciouSalto = true;
      sprite.setVelocityY(-this.special.impulsoSubida);
      sprite.body.setGravityY(this.special.gravidadeSalto);
    }
    if (!this.iniciouMergulho && quadro >= this.special.quadroInicioDescida) {
      this.iniciouMergulho = true;
      sprite.setVelocityY(this.special.impulsoDescida);
    }
    if (quadro >= this.special.quadroHitbox && !this.hitbox) {
      this.criarHitbox();
    }
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }
    this.atualizarMovimento();
    this.atualizarHitbox();
  }

  atualizarMovimento() {
    const animacao = this.personagem.sprite.anims;
    if (animacao.currentAnim?.key !== this.special.animacao || !animacao.currentFrame) return;
    const quadro = Number(animacao.currentFrame.textureFrame);
    const sprite = this.personagem.sprite;
    if (this.iniciouSalto) sprite.body.setGravityY(this.special.gravidadeSalto);
    if (this.iniciouSalto && !sprite.body.blocked.down) this.saiuDoChao = true;
    if (this.saiuDoChao && sprite.body.blocked.down && sprite.body.velocity.y >= 0) {
      this.pousou = true;
    }

    let velocidadeX = 0;
    if (quadro >= this.special.quadroInicioAvanco && quadro < this.special.quadroAceleracaoAvanco) {
      velocidadeX = this.special.velocidadeSubidaX;
    } else if (quadro >= this.special.quadroAceleracaoAvanco) {
      const progresso = Phaser.Math.Clamp(
        (quadro - this.special.quadroAceleracaoAvanco) /
          (this.special.quadroVelocidadeMaxima - this.special.quadroAceleracaoAvanco),
        0,
        1,
      );
      velocidadeX = this.special.velocidadeSubidaX +
        (this.special.velocidadeDescidaX - this.special.velocidadeSubidaX) * progresso ** 2;
    }
    if (this.pousou) velocidadeX = 0;
    sprite.setVelocityX(this.direcao * velocidadeX);
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

  aoCompletarAnimacao() {
    if (this.finalizado) return;
    this.personagem.sprite.setVelocityX(0);
    this.personagem.sprite.body.setGravityY(0);
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
    sprite.body.setGravityY(0);
    this.hitbox?.destroy();
    this.hitbox = null;
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}

AigisSideSpecial.configuracao = {
  animacao: "ai_sideSpecial",
  logica: AigisSideSpecial,
  cooldown: 1000,
  quadroHitbox: 11,
  quadroInicioAvanco: 3,
  quadroInicioDescida: 9,
  quadroAceleracaoAvanco: 8,
  quadroVelocidadeMaxima: 11,
  velocidadeSubidaX: 400,
  velocidadeDescidaX: 900,
  impulsoSubida: 850,
  impulsoDescida: 700,
  gravidadeSalto: 1500,
  hitbox: {
    largura: 65,
    altura: 55,
    offsetX: 35,
    offsetY: -85,
  },
  propriedades: {
    travarMovimentoAir: true,
  },
  propriedadesAtaque: {
    dano: 18,
    knockbackX: 480,
    knockbackY: -350,
    knockbackFixo: false,
    tumbling: true,
  },
};
