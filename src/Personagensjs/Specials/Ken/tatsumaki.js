const VELOCIDADE_AVANCO = 500;
const MULTIPLICADOR_AVANCO_AEREO = 1.2;
const MULTIPLICADOR_IMPULSO = 1.2;
const VELOCIDADE_FINAL = 0.25;
const INTERVALO_RASTRO = 45;
const FRAME_INICIO_MOVIMENTO = 4;
const FRAME_INICIO_IMPULSO = 6;
const FRAME_FIM_MOVIMENTO = 20;
const FRAME_INICIO_HITBOX = 6;
const FRAME_FIM_HITBOX = 23;
const FRAMES_DOS_HITS = [6, 11, 16, 22];

const PROPRIEDADES_HITS_INICIAIS = {
  tipoSomImpacto: "light",
  dano: 2,
  knockbackX: 45,
  knockbackY: -110,
  knockbackFixo: true,
  tumbling: false,
};

const HITBOX = {
  largura: 65,
  altura: 50,
  offsetX: 42,
  offsetY: -60,
};

import { obterAlvosCombate, registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class Tatsumaki {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.chaveAnimacao = special?.animacao || "ken_siSpecial";
    this.ehAereo = this.chaveAnimacao === "ken_AsiSpecial";

    this.direcao = 1;
    this.hitbox = null;
    this.overlaps = [];
    this.ultimoHitPorAlvo = new Map();
    this.alvosCarregados = new Set();
    this.indiceHitAtivo = -1;
    this.ultimoRastroEm = 0;
    this.movimentoAtivo = false;
    this.velocidadeMovimento = 0;
    this.gravidadeAnulada = false;
    this.finalizado = false;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem?.sprite;
    const body = sprite?.body;
    if (!sprite?.active || !body) return;

    this.personagem.tocarSomSorteado(this.special?.som, {
      volume: this.special?.volumeSom ?? 0.8,
    });

    this.direcao = sprite.flipX ? -1 : 1;
    this.movimentoAtivo = false;
    this.velocidadeMovimento = 0;
    body.setVelocityX(0);
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(
      `animationcomplete-${this.chaveAnimacao}`,
      this.aoCompletarAnimacao
    );
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (animacao.key !== this.chaveAnimacao || this.finalizado) return;

    const frameAtual = frame.index;

    this.indiceHitAtivo = FRAMES_DOS_HITS.reduce(
      (indiceAtual, frameHit, indice) =>
        frameAtual >= frameHit ? indice : indiceAtual,
      -1
    );

    const frameInicioMovimento = this.ehAereo ? 0 : FRAME_INICIO_MOVIMENTO;
    this.movimentoAtivo =
      frameAtual >= frameInicioMovimento &&
      frameAtual <= FRAME_FIM_MOVIMENTO;

    if (this.ehAereo && this.movimentoAtivo && !this.gravidadeAnulada) {
      this.gravidadeAnulada = true;
      this.personagem.sprite.body.setAllowGravity(false);
      this.personagem.sprite.body.setVelocityY(0);
    } else if (
      this.ehAereo &&
      !this.movimentoAtivo &&
      this.gravidadeAnulada
    ) {
      this.restaurarGravidade();
    }

    if (this.movimentoAtivo) {
      if (frameAtual < FRAME_INICIO_IMPULSO) {
        // Pequena antecipação; ainda não existe hitbox.
        this.velocidadeMovimento = this.ehAereo
          ? VELOCIDADE_AVANCO * MULTIPLICADOR_IMPULSO
          : VELOCIDADE_AVANCO * 0.3;
      } else {
        const progresso = Phaser.Math.Clamp(
          (frameAtual - FRAME_INICIO_IMPULSO) /
            (FRAME_FIM_MOVIMENTO - FRAME_INICIO_IMPULSO),
          0,
          1
        );

        if (progresso < 0.2) {
          const saidaImpulso = progresso / 0.2;
          this.velocidadeMovimento = VELOCIDADE_AVANCO * (
            MULTIPLICADOR_IMPULSO - 0.2 * saidaImpulso
          );
        } else {
          const frenagem = (progresso - 0.2) / 0.8;
          this.velocidadeMovimento = VELOCIDADE_AVANCO * (
            1 - (1 - VELOCIDADE_FINAL) * frenagem
          );
        }
      }
    }


    if (
      frameAtual >= FRAME_INICIO_HITBOX &&
      frameAtual <= FRAME_FIM_HITBOX
    ) {
      this.criarHitbox();
    } else {
      this.destruirHitbox();
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

    if (!ehUltimoHit && oponente.sprite?.body) {
      // Mantém o alvo dentro do Tatsumaki para receber os próximos hits.
      const velocidadeKen = Math.abs(
        this.personagem.sprite.body?.velocity.x ?? VELOCIDADE_AVANCO
      );

      oponente.sprite.body.setVelocityX(
        Math.max(velocidadeKen, VELOCIDADE_AVANCO * 0.75) * this.direcao
      );
    }

    const somImpacto =
      this.personagem.sons?.[propriedades.tipoSomImpacto || "heavy"];

    if (somImpacto) {
      this.personagem.tocarSomSorteado(somImpacto, { volume: 0.15 });
    }
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
  atualizarAlvosCarregados() {
    const spriteKen = this.personagem?.sprite;
    const velocidadeKen = spriteKen?.body?.velocity.x ?? 0;
    if (!spriteKen) return;

    this.alvosCarregados.forEach((oponente) => {
      const spriteAlvo = oponente?.sprite;
      const bodyAlvo = spriteAlvo?.body;

      if (!spriteAlvo?.active || !bodyAlvo) {
        this.alvosCarregados.delete(oponente);
        return;
      }

      const xDesejado = spriteKen.x + 38 * this.direcao;
      const distancia = xDesejado - spriteAlvo.x;
      const correcao = Phaser.Math.Clamp(distancia * 10, -280, 280);

      bodyAlvo.setVelocityX(velocidadeKen + correcao);


    });
  }
  atualizar() {
    const sprite = this.personagem?.sprite;
    const body = sprite?.body;

    if (this.finalizado || !sprite?.active || !body) return;

    if (this.movimentoAtivo) {
      const multiplicadorAvanco = this.ehAereo
        ? MULTIPLICADOR_AVANCO_AEREO
        : 1;
      body.setVelocityX(
        this.velocidadeMovimento * multiplicadorAvanco * this.direcao
      );
    } else {
      // Conserva parte do impulso e freia suavemente durante o pouso.
      body.setVelocityX(body.velocity.x * 0.9);
    }

    this.atualizarPosicaoHitbox();
    this.atualizarAlvosCarregados();
    if (this.movimentoAtivo) this.criarRastro();

    const bateuNaParede =
      (this.direcao > 0 && body.blocked.right) ||
      (this.direcao < 0 && body.blocked.left);

    if (bateuNaParede) {
      this.finalizar();
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

  aoCompletarAnimacao() {
    this.finalizar();
  }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;

    if (
      this.personagem.maquinaEstados.estadoAtual === this.estado
    ) {
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

  restaurarGravidade() {
    const body = this.personagem?.sprite?.body;
    if (body && this.gravidadeAnulada) body.setAllowGravity(true);
    this.gravidadeAnulada = false;
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

    this.destruirHitbox();
    this.alvosCarregados.clear();

    if (sprite?.body) sprite.body.setVelocityX(0);
    this.restaurarGravidade();
    this.removerDaListaAtiva();
    this.finalizado = true;
  }
}
