const puppetsAtivos = new WeakMap();
const cooldownsPuppet = new WeakMap();

import {
  destruirColisor,
  registrarAtaqueEspecial,
} from "../../../Objetos/SistemaCombateEspecial.js";
import { tocarSomSeguro } from "../../../Objetos/AudioSeguro.js";

export default class MikuPuppet {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;

    this.sprite = null;
    this.grupoHurtbox = null;
    this.hurtbox = null;
    this.colliderMapa = null;
    this.overlapsAtaque = [];
    this.colisoresRecebidos = new Set();
    this.morrendo = false;
    this.hitboxAtaque = null;
    this.timerHitboxAtaque = null;
    this.recuoAte = 0;
    this.direcaoAtaque = 1;
    this.modo = "ataque";
    this.danoRecebido = 0;
    this.proximoAtaque = 0;
    this.proximaCura = 0;
    this.hitstunAte = 0;
    this.ativo = false;
    this.dono = personagem;
    this.controladorTemporario = false;
    this.timerSaidaEstado = null;
    this.timerTempoDeVida = null;
  }

  executar() {
    const existente = puppetsAtivos.get(this.personagem);
    if (existente?.ativo) {
      this.controladorTemporario = true;
      existente.alternarModo();
      this.encerrarEstadoEmBreve();
      this.scene.time.delayedCall(0, () => this.removerDaListaAtiva());
      return;
    }

    const cooldownAte = cooldownsPuppet.get(this.personagem) ?? 0;
    if (this.scene.time.now < cooldownAte) {
      this.controladorTemporario = true;
      this.encerrarEstadoEmBreve();
      this.scene.time.delayedCall(0, () => this.removerDaListaAtiva());
      return;
    }

    this.criarPuppet();
    puppetsAtivos.set(this.personagem, this);
    this.tocarAudio("soree");
    this.encerrarEstadoEmBreve();
  }

  criarPuppet() {
    const miku = this.personagem.sprite;
    const direcao = miku.flipX ? -1 : 1;
    this.sprite = this.scene.physics.add.sprite(
      miku.x + 42 * direcao,
      miku.y - 35,
      "Miku_puppet"
    );
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setScale(0.55);
    this.sprite.setDepth(miku.depth + 1);
    this.sprite.setFlipX(direcao < 0);
    this.sprite.play("miku_puppet_move");
    this.sprite.body.setSize(58, 88);
    this.sprite.body.setOffset(51, 58);
    this.sprite.body.setVelocity(190 * direcao, -310);
    // Este Body serve apenas para movimento e colisao com o mapa. A area que
    // recebe golpes e exclusivamente a hurtbox verde criada abaixo.
    this.sprite.body.debugShowBody = false;
    this.sprite.body.debugShowVelocity = false;
    this.scene.camHUD?.ignore(this.sprite);

    const plataformas = this.scene.mapaAtual?.plataformas;
    if (plataformas) {
      this.colliderMapa = this.scene.physics.add.collider(
        this.sprite,
        plataformas
      );
    }

    this.criarHurtbox();
    this.registrarComoAlvoExtra();
    this.ativo = true;
    this.timerTempoDeVida = this.scene.time.delayedCall(
      MikuPuppet.TEMPO_DE_VIDA,
      () => {
        this.timerTempoDeVida = null;
        this.destruir();
      }
    );
  }

  criarHurtbox() {
    this.grupoHurtbox = this.scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.hurtbox = this.scene.add.zone(0, 0, 48, 76).setOrigin(0.5, 1);
    this.grupoHurtbox.add(this.hurtbox);
    this.hurtbox.body.setAllowGravity(false);
    this.hurtbox.body.setImmovable(true);
    this.hurtbox.body.debugBodyColor = 0x00ff00;
  }

  criarHitboxAtaque(direcao) {
    if (this.hitboxAtaque?.active) return;
    this.direcaoAtaque = direcao;
    this.hitboxAtaque = this.scene.add.zone(
      this.sprite.x + 34 * direcao,
      this.sprite.y - 52,
      46,
      48
    );
    this.scene.physics.add.existing(this.hitboxAtaque);
    this.hitboxAtaque.body.setAllowGravity(false);
    this.hitboxAtaque.body.setImmovable(true);
    this.hitboxAtaque.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitboxAtaque);
    registrarAtaqueEspecial(this, this.hitboxAtaque, {
      categoria: "corpo",
      contraAtacarDono: false,
      aoColidir: () => this.limparHitboxAtaque(),
    });

    this.obterOponentes().forEach((oponente) => {
      const overlap = this.scene.physics.add.overlap(
        this.hitboxAtaque,
        oponente.grupoHurtbox,
        () => this.atacar(oponente),
        null,
        this
      );
      this.overlapsAtaque.push(overlap);
    });

    this.timerHitboxAtaque = this.scene.time.delayedCall(
      MikuPuppet.DURACAO_HITBOX,
      () => this.limparHitboxAtaque()
    );
  }

  limparHitboxAtaque() {
    this.timerHitboxAtaque?.remove(false);
    this.timerHitboxAtaque = null;
    this.overlapsAtaque.forEach((overlap) => destruirColisor(overlap));
    this.overlapsAtaque = [];
    this.hitboxAtaque?.destroy();
    this.hitboxAtaque = null;
  }

  registrarColisorRecebido(colisor) {
    if (colisor) this.colisoresRecebidos.add(colisor);
  }

  removerColisoresRecebidos() {
    this.colisoresRecebidos.forEach((colisor) => {
      destruirColisor(colisor);
    });
    this.colisoresRecebidos.clear();
  }

  registrarComoAlvoExtra() {
    if (!this.scene.alvosAtaqueExtras) this.scene.alvosAtaqueExtras = [];
    if (!this.scene.alvosAtaqueExtras.includes(this)) {
      this.scene.alvosAtaqueExtras.push(this);
    }
  }

  obterOponentes() {
    if (this.scene.scene.key === "CenaHistoria") {
      return [this.personagem === this.scene.boss
        ? this.scene.jogador1
        : this.scene.boss].filter(Boolean);
    }
    return [
      this.scene.jogador1,
      this.scene.jogador2,
      this.scene.jogador3,
      this.scene.jogador4,
    ].filter((jogador) => jogador && jogador !== this.personagem);
  }

  obterPlataformasValidas() {
    return (this.scene.mapaAtual?.plataformas?.getChildren?.() ?? []).filter(
      (plataforma) => plataforma?.body?.enable
    );
  }

  estaSobreAreaSegura(sprite) {
    if (!sprite?.active) return false;
    const corpo = sprite.body;
    const x = corpo?.center?.x ?? sprite.x;
    const pes = corpo?.bottom ?? sprite.y;

    return this.obterPlataformasValidas().some((plataforma) => {
      const chao = plataforma.body;
      return (
        x >= chao.left - MikuPuppet.MARGEM_AREA_SEGURA &&
        x <= chao.right + MikuPuppet.MARGEM_AREA_SEGURA &&
        pes <= chao.top + MikuPuppet.TOLERANCIA_ABAIXO_PLATAFORMA &&
        pes >= chao.top - MikuPuppet.ALTURA_MAXIMA_ALVO
      );
    });
  }

  temChaoAFrente(direcao) {
    const corpo = this.sprite?.body;
    if (!corpo?.blocked?.down) return true;

    const xSonda = direcao > 0
      ? corpo.right + MikuPuppet.DISTANCIA_SONDA_BORDA
      : corpo.left - MikuPuppet.DISTANCIA_SONDA_BORDA;
    const pes = corpo.bottom;

    return this.obterPlataformasValidas().some((plataforma) => {
      const chao = plataforma.body;
      return (
        xSonda >= chao.left &&
        xSonda <= chao.right &&
        chao.top >= pes - MikuPuppet.TOLERANCIA_SONDA_CIMA &&
        chao.top <= pes + MikuPuppet.TOLERANCIA_SONDA_BAIXO
      );
    });
  }

  obterAlvoMaisProximo() {
    return this.obterOponentes().reduce((maisPerto, atual) => {
      if (!atual?.sprite?.active || !this.estaSobreAreaSegura(atual.sprite)) return maisPerto;
      if (!maisPerto) return atual;
      const distanciaAtual = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        atual.sprite.x,
        atual.sprite.y
      );
      const distanciaAnterior = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        maisPerto.sprite.x,
        maisPerto.sprite.y
      );
      return distanciaAtual < distanciaAnterior ? atual : maisPerto;
    }, null);
  }

  alternarModo() {
    this.modo = this.modo === "ataque" ? "suporte" : "ataque";
    this.proximaCura = this.scene.time.now + MikuPuppet.INTERVALO_CURA;
    if (this.modo === "suporte") this.limparHitboxAtaque();
    this.tocarAudio(this.modo === "ataque" ? "soree" : "yata");
  }

  tocarAudio(chave) {
    if (this.scene.cache.audio.exists(chave)) {
      tocarSomSeguro(this.scene, chave, { volume: 0.65 });
    }
  }

  atualizarModoAtaque() {
    const alvo = this.obterAlvoMaisProximo();
    if (!alvo) {
      this.limparHitboxAtaque();
      this.sprite.setVelocityX(0);
      return;
    }
    const dx = alvo.sprite.x - this.sprite.x;
    const dy = alvo.sprite.y - this.sprite.y;
    const direcao = Math.sign(dx) || 1;
    this.sprite.setFlipX(direcao < 0);

    const pertoParaAtacar =
      Math.abs(dx) <= MikuPuppet.DISTANCIA_ATAQUE_X &&
      Math.abs(dy) <= MikuPuppet.DISTANCIA_ATAQUE_Y;
    if (
      pertoParaAtacar &&
      this.scene.time.now >= this.proximoAtaque &&
      !this.hitboxAtaque?.active
    ) {
      this.criarHitboxAtaque(direcao);
    }

    // A tentativa de ataque não para o puppet antes do contato real.
    // Ele só interrompe a perseguição quando atacar() confirmar o acerto.
    const podeAvancar = this.temChaoAFrente(direcao);
    if (!podeAvancar) {
      this.sprite.setVelocityX(0);
    } else if (!this.hitboxAtaque?.active) {
      this.sprite.setVelocityX(direcao * MikuPuppet.VELOCIDADE_ATAQUE);
    } else {
      this.sprite.setVelocityX(direcao * MikuPuppet.VELOCIDADE_DURANTE_ATAQUE);
    }

    const noChao = this.sprite.body.blocked.down;
    const bateuParede = this.sprite.body.blocked.left || this.sprite.body.blocked.right;
    if (noChao && (dy < -55 || bateuParede)) {
      this.sprite.setVelocityY(MikuPuppet.FORCA_PULO);
    }
  }

  atualizarModoSuporte() {
    const miku = this.personagem.sprite;
    if (!this.estaSobreAreaSegura(miku)) {
      this.sprite.setVelocityX(0);
      return;
    }
    const lado = miku.flipX ? 1 : -1;
    const destinoX = miku.x + 58 * lado;
    const dx = destinoX - this.sprite.x;
    const dy = miku.y - this.sprite.y;

    if (Math.abs(dx) > 18) {
      const direcao = Math.sign(dx);
      this.sprite.setFlipX(direcao < 0);
      this.sprite.setVelocityX(
        this.temChaoAFrente(direcao)
          ? direcao * MikuPuppet.VELOCIDADE_SUPORTE
          : 0
      );
    } else {
      this.sprite.setVelocityX(this.sprite.body.velocity.x * 0.75);
    }

    if (
      this.sprite.body.blocked.down &&
      (dy < -50 || this.sprite.body.blocked.left || this.sprite.body.blocked.right)
    ) {
      this.sprite.setVelocityY(MikuPuppet.FORCA_PULO);
    }

    const perto = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      miku.x,
      miku.y
    ) <= MikuPuppet.DISTANCIA_CURA;
    if (perto && this.scene.time.now >= this.proximaCura) {
      this.curarMiku();
      this.proximaCura = this.scene.time.now + MikuPuppet.INTERVALO_CURA;
    }
  }

  atacar(alvo) {
    if (
      this.modo !== "ataque" ||
      this.scene.time.now < this.proximoAtaque ||
      !alvo?.sprite?.active
    ) return;

    this.proximoAtaque = this.scene.time.now + MikuPuppet.INTERVALO_ATAQUE;
    this.recuoAte = this.scene.time.now + MikuPuppet.TEMPO_RECUO;
    const direcao = alvo.sprite.x >= this.sprite.x ? 1 : -1;
    alvo.receberDano(
      MikuPuppet.DANO_ATAQUE,
      {
        tipoSomImpacto: "light",
        knockbackX: MikuPuppet.KNOCKBACK_X,
        knockbackY: -80,
        tumbling: false,
      },
      { x: this.sprite.x, direcao }
    );
    this.sprite.body.setVelocity(-direcao * 190, -90);
    this.limparHitboxAtaque();
  }

  receberDano(quantidade, propriedades = {}, origem = null) {
    if (!this.ativo || this.morrendo) return false;
    this.danoRecebido += quantidade;

    const direcao = origem?.direcao ?? (
      origem?.x !== undefined && this.sprite.x >= origem.x ? 1 : -1
    );
    const knockbackX = Math.abs(propriedades.knockbackX ?? 180);
    const knockbackY = propriedades.knockbackY ?? -120;
    this.sprite.body.setVelocity(direcao * knockbackX, knockbackY);
    this.hitstunAte = this.scene.time.now + MikuPuppet.HITSTUN;

    if (this.danoRecebido >= MikuPuppet.VIDA_MAXIMA && !this.morrendo) {
      this.morrendo = true;
      if (this.hurtbox?.body) this.hurtbox.body.enable = false;
      this.scene.time.delayedCall(0, () => this.destruir());
    }
    return false;
  }

  curarMiku() {
    if (this.personagem.porcentagemDano <= 0) return;
    this.personagem.porcentagemDano = Math.max(
      0,
      this.personagem.porcentagemDano - MikuPuppet.CURA
    );
    this.personagem.textoDano?.setText(
      `${Math.floor(this.personagem.porcentagemDano)}%`
    );
    this.criarNotaCura();
  }

  criarNotaCura() {
    const nota = this.scene.add.sprite(
      this.personagem.sprite.x,
      this.personagem.sprite.y - 95,
      "Miku_effects"
    );
    nota.setScale(0.55);
    nota.setDepth(this.personagem.sprite.depth + 2);
    nota.setBlendMode(Phaser.BlendModes.ADD);
    nota.setAlpha(0.9);
    nota.play("miku_nota_especial_1");
    this.scene.camHUD?.ignore(nota);
    this.scene.tweens.add({
      targets: nota,
      y: nota.y - 55,
      alpha: 0,
      duration: 700,
      ease: "Quad.easeOut",
      onComplete: () => nota.destroy(),
    });
  }

  sincronizarHurtbox() {
    if (!this.hurtbox?.active || !this.sprite?.active) return;
    this.hurtbox.setPosition(this.sprite.x, this.sprite.y - 5);
    this.hurtbox.body.setVelocity(
      this.sprite.body.velocity.x,
      this.sprite.body.velocity.y
    );
  }

  encerrarEstadoEmBreve() {
    this.timerSaidaEstado = this.scene.time.delayedCall(320, () => {
      this.timerSaidaEstado = null;
      if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
        this.estado.finalizarSpecial();
      }
    });
  }

  saiuDaArena() {
    const limites = this.scene.limitesArena;
    if (!limites || !this.sprite) return false;
    return (
      this.sprite.x < (limites.minX ?? limites.esquerda) ||
      this.sprite.x > (limites.maxX ?? limites.direita) ||
      this.sprite.y < (limites.minY ?? limites.topo) ||
      this.sprite.y > (limites.maxY ?? limites.baixo)
    );
  }

  atualizar() {
    if (this.controladorTemporario) {
      this.removerDaListaAtiva();
      return;
    }
    if (!this.ativo || !this.sprite?.active) return;
    if (this.saiuDaArena()) {
      this.destruir();
      return;
    }

    this.sincronizarHurtbox();
    if (this.hitboxAtaque?.active) {
      const alvoAtual = this.obterAlvoMaisProximo();
      if (alvoAtual?.sprite?.active) {
        const dxAlvo = alvoAtual.sprite.x - this.sprite.x;
        this.direcaoAtaque = Math.sign(dxAlvo) || this.direcaoAtaque;
        this.sprite.setFlipX(this.direcaoAtaque < 0);
      }
      this.hitboxAtaque.setPosition(
        this.sprite.x + 34 * this.direcaoAtaque,
        this.sprite.y - 52
      );
    }
    if (
      this.scene.time.now < this.hitstunAte ||
      this.scene.time.now < this.recuoAte
    ) return;

    if (this.modo === "ataque") this.atualizarModoAtaque();
    else this.atualizarModoSuporte();
  }

  destruir() {
    if (!this.ativo && !this.morrendo) return;
    this.morrendo = false;
    this.ativo = false;
    if (puppetsAtivos.get(this.personagem) === this) {
      puppetsAtivos.delete(this.personagem);
      cooldownsPuppet.set(
        this.personagem,
        this.scene.time.now + MikuPuppet.COOLDOWN_REINVOCACAO
      );
    }

    this.timerSaidaEstado?.remove(false);
    this.timerSaidaEstado = null;
    this.timerTempoDeVida?.remove(false);
    this.timerTempoDeVida = null;
    this.limparHitboxAtaque();
    this.removerColisoresRecebidos();
    destruirColisor(this.colliderMapa);
    this.colliderMapa = null;
    this.grupoHurtbox?.clear(true, true);
    this.grupoHurtbox = null;
    this.hurtbox = null;
    this.sprite?.destroy();
    this.sprite = null;

    if (this.scene.alvosAtaqueExtras) {
      this.scene.alvosAtaqueExtras = this.scene.alvosAtaqueExtras.filter(
        (alvo) => alvo !== this
      );
    }
    this.removerDaListaAtiva();
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    if (this.controladorTemporario) {
      this.removerDaListaAtiva();
      return;
    }
    // O puppet persiste quando a curta animacao de invocacao termina.
    if (this.ativo) return;
    this.removerDaListaAtiva();
  }
}

MikuPuppet.COOLDOWN_REINVOCACAO = 30000;
MikuPuppet.TEMPO_DE_VIDA = 30000;
MikuPuppet.VIDA_MAXIMA = 15;
MikuPuppet.VELOCIDADE_ATAQUE = 190;
MikuPuppet.VELOCIDADE_DURANTE_ATAQUE = 150;
MikuPuppet.VELOCIDADE_SUPORTE = 175;
MikuPuppet.FORCA_PULO = -300;
MikuPuppet.DANO_ATAQUE = 5;
MikuPuppet.KNOCKBACK_X = 165;
MikuPuppet.INTERVALO_ATAQUE = 1500;
MikuPuppet.DURACAO_HITBOX = 130;
MikuPuppet.TEMPO_RECUO = 420;
MikuPuppet.DISTANCIA_ATAQUE_X = 62;
MikuPuppet.DISTANCIA_ATAQUE_Y = 85;
MikuPuppet.HITSTUN = 600;
MikuPuppet.CURA = 5;
MikuPuppet.INTERVALO_CURA = 5000;
MikuPuppet.DISTANCIA_CURA = 200;

MikuPuppet.MARGEM_AREA_SEGURA = 18;
MikuPuppet.TOLERANCIA_ABAIXO_PLATAFORMA = 28;
MikuPuppet.ALTURA_MAXIMA_ALVO = 520;
MikuPuppet.DISTANCIA_SONDA_BORDA = 12;
MikuPuppet.TOLERANCIA_SONDA_CIMA = 14;
MikuPuppet.TOLERANCIA_SONDA_BAIXO = 42;
