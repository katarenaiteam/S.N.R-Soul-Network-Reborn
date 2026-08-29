const VELOCIDADE_AVANCO = 500;
const MULTIPLICADOR_IMPULSO = 1.2;
const VELOCIDADE_FINAL = 0.25;
const FRAME_INICIO_MOVIMENTO = 3;
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
  largura: 95,
  altura: 65,
  offsetX: 48,
  offsetY: -45,
};

const CORPO_FISICO = {
  largura: 80,
  altura: 110,
  offsetX: 36,
  offsetY: 9,
};

export default class Tatsumaki {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;

    this.direcao = 1;
    this.hitbox = null;
    this.overlaps = [];
    this.ultimoHitPorAlvo = new Map();
    this.alvosCarregados = new Set();
    this.indiceHitAtivo = -1;
    this.movimentoAtivo = false;
    this.velocidadeMovimento = 0;
    this.finalizado = false;
    this.corpoOriginal = null;

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
    this.corpoOriginal = {
      largura: body.width,
      altura: body.height,
      offsetX: body.offset.x,
      offsetY: body.offset.y,
    };

    this.aplicarCorpoFisico();
    this.movimentoAtivo = false;
    this.velocidadeMovimento = 0;
    body.setVelocityX(0);
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once("animationcomplete-ken_siSpecial", this.aoCompletarAnimacao);
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (animacao.key !== "ken_siSpecial" || this.finalizado) return;

    const frameAtual = frame.index;

    this.indiceHitAtivo = FRAMES_DOS_HITS.reduce(
      (indiceAtual, frameHit, indice) =>
        frameAtual >= frameHit ? indice : indiceAtual,
      -1
    );

    this.movimentoAtivo =
      frameAtual >= FRAME_INICIO_MOVIMENTO &&
      frameAtual <= FRAME_FIM_MOVIMENTO;

    if (this.movimentoAtivo) {
      if (frameAtual < FRAME_INICIO_IMPULSO) {
        // Pequena antecipação; ainda não existe hitbox.
        this.velocidadeMovimento = VELOCIDADE_AVANCO * 0.3;
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
    this.hitbox.body.setImmovable(true);
    this.scene.camHUD?.ignore(this.hitbox);

    this.atualizarPosicaoHitbox();

    this.obterOponentes().forEach((oponente) => {
      if (!oponente?.grupoHurtbox) return;

      const overlap = this.scene.physics.add.overlap(
        this.hitbox,
        oponente.grupoHurtbox,
        () => this.processarAcerto(oponente),
        null,
        this
      );

      this.overlaps.push(overlap);
    });
  }

  obterOponentes() {
    if (this.scene.scene.key === "CenaHistoria") {
      const souJogador =
        this.personagem === this.scene.jogador1 ||
        this.personagem === this.scene.jogador2;

      return souJogador
        ? [this.scene.boss].filter(Boolean)
        : [this.scene.jogador1, this.scene.jogador2].filter(Boolean);
    }

    return [
      this.scene.jogador1,
      this.scene.jogador2,
      this.scene.jogador3,
      this.scene.jogador4,
    ].filter(
      (lutador) => lutador && lutador !== this.personagem
    );
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

      // Impede que uma queda de frames deixe o alvo escapar da área do golpe.
      if (Math.abs(distancia) > 75) {
        spriteAlvo.setX(xDesejado - 75 * Math.sign(distancia));
      }
    });
  }
  atualizar() {
    const sprite = this.personagem?.sprite;
    const body = sprite?.body;

    if (this.finalizado || !sprite?.active || !body) return;

    this.aplicarCorpoFisico();

    if (this.movimentoAtivo) {
      body.setVelocityX(this.velocidadeMovimento * this.direcao);
    } else {
      // Conserva parte do impulso e freia suavemente durante o pouso.
      body.setVelocityX(body.velocity.x * 0.9);
    }

    this.atualizarPosicaoHitbox();
    this.atualizarAlvosCarregados();

    const bateuNaParede =
      (this.direcao > 0 && body.blocked.right) ||
      (this.direcao < 0 && body.blocked.left);

    if (bateuNaParede) {
      this.finalizar();
    }
  }

  aplicarCorpoFisico() {
    const sprite = this.personagem.sprite;
    const body = sprite.body;
    if (!body) return;

    body.setSize(
      CORPO_FISICO.largura,
      CORPO_FISICO.altura,
      false
    );

    const offsetX = sprite.flipX
      ? sprite.frame.realWidth
        - CORPO_FISICO.offsetX
        - CORPO_FISICO.largura
      : CORPO_FISICO.offsetX;

    body.setOffset(offsetX, CORPO_FISICO.offsetY);
  }

  atualizarPosicaoHitbox() {
    if (!this.hitbox?.active) return;

    this.hitbox.setPosition(
      this.personagem.sprite.x + HITBOX.offsetX * this.direcao,
      this.personagem.sprite.y + HITBOX.offsetY
    );
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

  restaurarCorpoFisico() {
    const body = this.personagem?.sprite?.body;
    if (!body || !this.corpoOriginal) return;

    body.setSize(
      this.corpoOriginal.largura,
      this.corpoOriginal.altura,
      false
    );
    body.setOffset(
      this.corpoOriginal.offsetX,
      this.corpoOriginal.offsetY
    );
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
      "animationcomplete-ken_siSpecial",
      this.aoCompletarAnimacao
    );

    this.destruirHitbox();
    this.alvosCarregados.clear();

    if (sprite?.body) sprite.body.setVelocityX(0);
    this.restaurarCorpoFisico();
    this.removerDaListaAtiva();
    this.finalizado = true;
  }
}
