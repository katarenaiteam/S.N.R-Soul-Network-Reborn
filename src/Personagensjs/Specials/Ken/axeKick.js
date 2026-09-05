const FRAME_INICIO_QUEDA = 7;
const IMPULSO_SUBIDA = -360;
const AVANCO_INICIAL = 115;
const VELOCIDADE_QUEDA = 720;
const AVANCO_QUEDA = 70;
const IMPULSO_QUIQUE = -330;
const RECUO_QUIQUE = 75;
const INTERVALO_RASTRO = 45;

const HITBOX = {
  largura: 80,
  altura: 45,
  offsetX: 25,
  offsetY: -30,
};

import { obterAlvosCombate, registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class AxeKick {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = 1;
    this.emQueda = false;
    this.finalizado = false;
    this.hitbox = null;
    this.overlaps = [];
    this.ultimoRastroEm = 0;
    this.gravidadeOriginal = true;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem?.sprite;
    const body = sprite?.body;
    if (!sprite?.active || !body) return;

    this.direcao = sprite.flipX ? -1 : 1;
    this.gravidadeOriginal = body.allowGravity;
    body.setAllowGravity(false);
    body.setVelocity(
      AVANCO_INICIAL * this.direcao,
      IMPULSO_SUBIDA
    );

    // Um único golpe causa dano, mas não interrompe este special.
    this.personagem.hiperArmaduraHits = 1;
    this.personagem.hiperArmaduraFonte = this;
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (animacao.key !== "ken_AdoSpecial" || this.finalizado) return;

    const frameSpritesheet = Number(frame.textureFrame);
    if (!this.emQueda && frameSpritesheet >= FRAME_INICIO_QUEDA) {
      this.emQueda = true;
      this.personagem.sprite.body.setVelocity(
        AVANCO_QUEDA * this.direcao,
        VELOCIDADE_QUEDA
      );
      this.criarHitbox();
    }
  }

  atualizar() {
    const sprite = this.personagem?.sprite;
    const body = sprite?.body;
    if (this.finalizado || !sprite?.active || !body) return;

    // Responde ao contato antes de voltar a aplicar a velocidade de descida.
    if (this.emQueda && body.blocked.down) {
      this.finalizarComQuique();
      return;
    }

    // Impede input ou gravidade de alterar os impulsos próprios do golpe.
    if (this.emQueda) {
      body.setVelocity(
        AVANCO_QUEDA * this.direcao,
        VELOCIDADE_QUEDA
      );
      this.atualizarPosicaoHitbox();
    }

    this.criarRastro();

  }

  criarHitbox() {
    if (this.hitbox) return;

    this.hitbox = this.scene.add.zone(0, 0, HITBOX.largura, HITBOX.altura);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.hitbox.body.setImmovable(true);
    this.scene.camHUD?.ignore(this.hitbox);
    registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
    });
    this.atualizarPosicaoHitbox();

    this.obterOponentes().forEach((oponente) => {
      if (!oponente?.grupoHurtbox) return;
      const overlap = this.scene.physics.add.overlap(
        this.hitbox,
        oponente.grupoHurtbox,
        () => this.acertarOponente(oponente),
        null,
        this
      );
      this.overlaps.push(overlap);
    });
  }

  obterOponentes() {
    return obterAlvosCombate(this.personagem);
  }

  acertarOponente(oponente) {
    if (this.finalizado || !this.emQueda) return;

    oponente.receberDano(
      this.special?.propriedades?.dano ?? 16,
      this.special?.propriedades || {},
      { direcao: this.direcao, x: this.personagem.sprite.x }
    );

    const tipoImpacto =
      this.special?.propriedades?.tipoSomImpacto || "heavy";
    const somImpacto = this.personagem.sons?.[tipoImpacto];
    if (somImpacto) {
      this.personagem.tocarSomSorteado(somImpacto, { volume: 0.15 });
    }

    this.finalizarComQuique();
  }

  atualizarPosicaoHitbox() {
    if (!this.hitbox?.active) return;
    this.hitbox.setPosition(
      this.personagem.sprite.x + HITBOX.offsetX * this.direcao,
      this.personagem.sprite.y + HITBOX.offsetY
    );
  }

  criarRastro() {
    const sprite = this.personagem.sprite;
    const agora = this.scene.time.now;
    if (agora - this.ultimoRastroEm < INTERVALO_RASTRO) return;
    this.ultimoRastroEm = agora;

    const rastro = this.scene.add.sprite(
      sprite.x,
      sprite.y,
      sprite.texture.key,
      sprite.frame.name
    );
    rastro
      .setFlipX(sprite.flipX)
      .setScale(sprite.scaleX, sprite.scaleY)
      .setOrigin(sprite.originX, sprite.originY)
      .setDepth(sprite.depth - 1)
      .setTint(0x7fa8c4)
      .setTintMode(Phaser.TintModes.FILL)
      .setAlpha(0.65);
    this.scene.camHUD?.ignore(rastro);
    this.scene.tweens.add({
      targets: rastro,
      alpha: 0,
      duration: 240,
      ease: "Quad.easeOut",
      onComplete: () => rastro.destroy(),
    });
  }

  finalizarComQuique() {
    if (this.finalizado) return;
    const body = this.personagem.sprite.body;
    this.limpar();
    body.setVelocity(
      -RECUO_QUIQUE * this.direcao,
      IMPULSO_QUIQUE
    );

    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.personagem.maquinaEstados.mudarEstado("jump");
    }
  }

  destruirHitbox() {
    this.overlaps.forEach((overlap) => overlap?.destroy());
    this.overlaps = [];
    if (this.hitbox?.active) this.hitbox.destroy();
    this.hitbox = null;
  }

  limpar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.personagem.sprite.off("animationupdate", this.aoAtualizarAnimacao);
    this.destruirHitbox();
    this.personagem.sprite.body.setAllowGravity(this.gravidadeOriginal);
    if (this.personagem.hiperArmaduraFonte === this) {
      this.personagem.hiperArmaduraHits = 0;
      this.personagem.hiperArmaduraFonte = null;
    }
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    this.limpar();
  }
}
