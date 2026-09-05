const IMPULSO_X = 190;
const IMPULSO_Y = -580;
const IMPULSO_AEREO_X = 250;
const IMPULSO_AEREO_Y = -720;
const FRAME_IMPULSO = 4;
const FRAMES_DOS_HITS = [5, 9, 13];
const FRAME_INICIO_HITBOX = 4;
const FRAME_FIM_HITBOX = 13;
const FRAME_INICIO_EFEITOS = 4;
const DURACAO_HIT_STOP = 55;
const INTERVALO_RASTRO = 45;

const HITBOX = {
  largura: 60,
  altura: 120,
  offsetX: 30,
  offsetY: -90,
};

const PROPRIEDADES_HITS_INICIAIS = {
  tipoSomImpacto: "light",
  dano: 3,
  knockbackX: 40,
  knockbackY: -90,
  knockbackFixo: true,
  tumbling: false,
};

import { obterAlvosCombate, registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class Shoryuken {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.chaveAnimacao = special?.animacao || "ken_doSpecial";
    this.ehAereo = this.chaveAnimacao === "ken_AupSpecial";

    this.direcao = 1;
    this.hitbox = null;
    this.overlaps = [];
    this.ultimoHitPorAlvo = new Map();
    this.alvosCarregados = new Set();
    this.indiceHitAtivo = -1;
    this.impulsoAplicado = false;
    this.chamas = null;
    this.chamasCriadas = false;
    this.ultimoRastroEm = 0;
    this.emHitStop = false;
    this.timerHitStop = null;
    this.velocidadeAntesHitStop = null;
    this.oponenteHitStop = null;
    this.finalizado = false;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem?.sprite;
    const body = sprite?.body;
    if (!sprite?.active || !body) return;

    this.direcao = sprite.flipX ? -1 : 1;
    this.personagem.tocarSomSorteado(this.special?.som, {
      volume: this.special?.volumeSom ?? 0.7,
    });

    body.setVelocity(0, 0);

    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(
      `animationcomplete-${this.chaveAnimacao}`,
      this.aoCompletarAnimacao
    );
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (animacao.key !== this.chaveAnimacao || this.finalizado) return;

    const frameAtual = frame.index;
    const frameReal = Number(frame.textureFrame);

    if (!this.impulsoAplicado && frameReal === FRAME_IMPULSO) {
      this.impulsoAplicado = true;
      this.personagem.sprite.body.setVelocity(
        (this.ehAereo ? IMPULSO_AEREO_X : IMPULSO_X) * this.direcao,
        this.ehAereo ? IMPULSO_AEREO_Y : IMPULSO_Y
      );
    }

    this.indiceHitAtivo = FRAMES_DOS_HITS.reduce(
      (indiceAtual, frameHit, indice) =>
        frameAtual >= frameHit ? indice : indiceAtual,
      -1
    );

    if (
      frameAtual >= FRAME_INICIO_HITBOX &&
      frameAtual <= FRAME_FIM_HITBOX
    ) {
      this.criarHitbox();
    } else {
      this.destruirHitbox();
    }

    if (frameAtual >= FRAME_INICIO_EFEITOS) {
      this.criarChamas();
    }
  }

  criarHitbox() {
    if (this.hitbox) return;

    this.hitbox = this.scene.add.zone(
      0,
      0,
      HITBOX.largura,
      HITBOX.altura
    );
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.hitbox.body.setImmovable(true);
    this.scene.camHUD?.ignore(this.hitbox);
    registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.processarAcerto(alvo),
    });

    this.atualizarPosicaoHitbox();

  }

  obterOponentes() {
    return obterAlvosCombate(this.personagem);
  }

  processarAcerto(oponente) {
    if (this.finalizado || this.indiceHitAtivo < 0) return;

    const ultimoHit = this.ultimoHitPorAlvo.get(oponente) ?? -1;
    if (ultimoHit >= this.indiceHitAtivo) return;

    this.ultimoHitPorAlvo.set(oponente, this.indiceHitAtivo);

    const ehUltimoHit =
      this.indiceHitAtivo === FRAMES_DOS_HITS.length - 1;

    const propriedades = ehUltimoHit
      ? {
          ...(this.special?.propriedades || {}),
          knockbackFixo: false,
        }
      : PROPRIEDADES_HITS_INICIAIS;

    if (ehUltimoHit) {
      this.alvosCarregados.delete(oponente);
    } else {
      this.alvosCarregados.add(oponente);
    }

    oponente.receberDano(
      propriedades.dano ?? 0,
      propriedades,
      { direcao: this.direcao, x: this.personagem.sprite.x }
    );

    const somImpacto =
      this.personagem.sons?.[propriedades.tipoSomImpacto || "heavy"];

    if (somImpacto) {
      this.personagem.tocarSomSorteado(somImpacto, { volume: 0.15 });
    }

    this.aplicarHitStop(oponente);
  }

  aplicarHitStop(oponente) {
    if (this.emHitStop || this.finalizado) return;

    const sprite = this.personagem.sprite;
    const body = sprite.body;

    this.emHitStop = true;
    this.velocidadeAntesHitStop = {
      x: body.velocity.x,
      y: body.velocity.y,
    };

    sprite.anims.pause();
    body.setVelocity(0, 0);
    this.oponenteHitStop = oponente;
    oponente.sprite?.anims?.pause();

    this.timerHitStop = this.scene.time.delayedCall(
      DURACAO_HIT_STOP,
      () => {
        this.timerHitStop = null;
        if (this.finalizado || !sprite?.active) return;

        sprite.anims.resume();
        oponente.sprite?.anims?.resume();
        this.oponenteHitStop = null;

        if (this.velocidadeAntesHitStop) {
          body.setVelocity(
            this.velocidadeAntesHitStop.x,
            this.velocidadeAntesHitStop.y
          );
        }

        this.velocidadeAntesHitStop = null;
        this.emHitStop = false;
      }
    );
  }

  criarChamas() {
    if (this.chamasCriadas || this.chamas?.active) return;

    this.chamasCriadas = true;

    const sprite = this.personagem.sprite;
    this.chamas = this.scene.add.sprite(
      sprite.x,
      sprite.y - 65,
      "flames",
      0
    );

    this.chamas.setFlipX(this.direcao < 0);
    this.chamas.setDepth(sprite.depth + 1);
    this.scene.camHUD?.ignore(this.chamas);
    this.chamas.anims.play("ken_shoryuken_chamas");

    this.chamas.once("animationcomplete-ken_shoryuken_chamas", () => {
      if (this.chamas?.active) this.chamas.destroy();
      this.chamas = null;
    });
  }

  criarRastro() {
    const sprite = this.personagem.sprite;
    const agora = this.scene.time.now;

    if (
      this.emHitStop ||
      agora - this.ultimoRastroEm < INTERVALO_RASTRO
    ) {
      return;
    }

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

  atualizarAlvosCarregados() {
    const spriteKen = this.personagem?.sprite;
    if (!spriteKen || this.emHitStop) return;

    this.alvosCarregados.forEach((oponente) => {
      const spriteAlvo = oponente?.sprite;
      const bodyAlvo = spriteAlvo?.body;

      if (!spriteAlvo?.active || !bodyAlvo) {
        this.alvosCarregados.delete(oponente);
        return;
      }

      const xDesejado = spriteKen.x + 28 * this.direcao;
      const yDesejado = spriteKen.y - 18;
      const distanciaX = xDesejado - spriteAlvo.x;
      const distanciaY = yDesejado - spriteAlvo.y;

      bodyAlvo.setVelocity(
        (spriteKen.body?.velocity.x ?? 0) +
          Phaser.Math.Clamp(distanciaX * 10, -220, 220),
        (spriteKen.body?.velocity.y ?? 0) +
          Phaser.Math.Clamp(distanciaY * 8, -180, 180)
      );
    });
  }

  atualizar() {
    const sprite = this.personagem?.sprite;
    const body = sprite?.body;
    if (this.finalizado || !sprite?.active || !body) return;

    this.atualizarPosicaoHitbox();
    this.atualizarPosicaoChamas();
    this.atualizarAlvosCarregados();

    if (!this.emHitStop && this.indiceHitAtivo >= 0) {
      this.criarRastro();
    }

    if (this.emHitStop) {
      body.setVelocity(0, 0);
    }
  }

  atualizarPosicaoHitbox() {
    if (!this.hitbox?.active) return;

    this.hitbox.setPosition(
      this.personagem.sprite.x + HITBOX.offsetX * this.direcao,
      this.personagem.sprite.y + HITBOX.offsetY
    );
    this.hitbox.body?.updateFromGameObject();
  }

  atualizarPosicaoChamas() {
    if (!this.chamas?.active) return;

    this.chamas.setPosition(
      this.personagem.sprite.x + 8 * this.direcao,
      this.personagem.sprite.y - 65
    );
  }

  aoCompletarAnimacao() {
    this.finalizar();
  }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;

    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    } else {
      this.cancelar();
    }
  }

  destruirHitbox() {
    this.overlaps.forEach((overlap) => {
      if (overlap?.active) overlap.destroy();
    });
    this.overlaps = [];

    if (this.hitbox?.active) this.hitbox.destroy();
    this.hitbox = null;
  }

  removerDaListaAtiva() {
    const lista = this.personagem?.logicasEspeciaisAtivas;
    if (!lista) return;

    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    const sprite = this.personagem?.sprite;

    sprite?.off("animationupdate", this.aoAtualizarAnimacao);
    sprite?.off(
      `animationcomplete-${this.chaveAnimacao}`,
      this.aoCompletarAnimacao
    );

    if (this.timerHitStop) {
      this.timerHitStop.remove(false);
      this.timerHitStop = null;
    }

    if (this.emHitStop) {
      sprite?.anims?.resume();
      this.oponenteHitStop?.sprite?.anims?.resume();
      this.oponenteHitStop = null;

      if (sprite?.body && this.velocidadeAntesHitStop) {
        sprite.body.setVelocity(
          this.velocidadeAntesHitStop.x,
          this.velocidadeAntesHitStop.y
        );
      }
    }

    this.destruirHitbox();
    this.alvosCarregados.forEach((oponente) => {
      oponente.sprite?.anims?.resume();
    });
    this.alvosCarregados.clear();

    if (this.chamas?.active) this.chamas.destroy();
    this.chamas = null;

    this.removerDaListaAtiva();
    this.finalizado = true;
    this.emHitStop = false;
  }
}
