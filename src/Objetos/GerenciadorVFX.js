
const VFX_GLOBAIS = {
  guard: {
    blendMode: "ADD",
    camadas: 3,
    textura: "guard-efect",
    animacao: "guard-efect",
    escala: 130 / 499,
    alpha: 1,
    seguir: true,
    offsetY: -60,
    depthOffset: 2,
  },
  midguard: {
    blendMode: "ADD",
    camadas: 3,
    textura: "mid-guard",
    animacao: "mid-guard",
    escala: 130 / 632,
    alpha: 1,
    seguir: true,
    offsetY: -60,
    depthOffset: 2,
  },
  brokeguard: {
    blendMode: "ADD",
    camadas: 3,
    textura: "brokeguard-efect",
    animacao: "brokeguard-efect",
    escala: 130 / 616,
    alpha: 1,
    seguir: true,
    offsetY: -60,
    depthOffset: 2,
  },
  fumacaDash: {
    blendMode: "ADD",
    textura: "dash-effect",
    animacao: "dash-effect",
    escala: 0.33,
    offsetX: -15,
    offsetY: -13,
    seguir: false,
    depthOffset: 1,
  },
  fumacaPulo: {
    blendMode: "ADD",
    textura: "jump-effect",
    animacao: "jump-effect",
    escala: 0.25,
    offsetX: 10,
    offsetY: -10,
    seguir: false,
    espelharSprite: false,
    depthOffset: 1,
  },
  stun: {
    textura: "Stun_Effect",
    animacao: "stun_effect",
    escala: 1,
    seguir: true,
    offsetX: 0,
    offsetY: -125,
    espelharSprite: false,
    loop: true,
    depthOffset: 2
  }
};

export default class GerenciadorVFX {
  constructor(personagem) {
    this.personagem = personagem;
    this.scene = personagem.scene;

    // Efeitos que precisam acompanhar o personagem.
    this.efeitosSeguindo = [];
    this.criarAnimacoesGlobais();
  }

  // ============================================================
  // TOCAR EFEITO
  // ============================================================

  tocar(nome, opcoes = {}) {
    const configBase =
  this.personagem.configVFX?.[nome] ??
   VFX_GLOBAIS[nome];

   if (!configBase) return null;

    // Permite alterar alguma propriedade apenas naquela chamada.
    const config = {
      ...VFX_GLOBAIS[nome],
      ...this.obterEnquadramentoDefesa(nome),
      ...this.personagem.configVFX?.[nome],
      ...opcoes,
    };

    if (config.ativo === false) return null;

    const textura = config.textura;

    const pos = this.calcularPosicao(config);

    const efeito = this.scene.add.sprite(
      pos.x,
      pos.y,
      textura,
      config.frameInicial ?? 0
    );

    // ============================================================
    // DIREÇÃO
    // ============================================================

    const direcao =
      config.direcao ??
      (this.personagem.sprite.flipX ? -1 : 1);

    if (config.espelharSprite !== false) {
      efeito.setFlipX(direcao === -1);
    }

    // ============================================================
    // VISUAL
    // ============================================================

    if (config.escala !== undefined) {
      efeito.setScale(config.escala);
    }

    if (config.escalaX !== undefined) {
      efeito.setScale(
        config.escalaX,
        config.escalaY ?? config.escalaX
      );
    }

    if (config.alpha !== undefined) {
      efeito.setAlpha(config.alpha);
    }

    if (config.blendMode !== undefined) {
      efeito.setBlendMode(config.blendMode);
    }

    if (config.angulo !== undefined) {
      efeito.setAngle(config.angulo * direcao);
    }

    const depthBase = this.personagem.sprite.depth ?? 0;

    efeito.setDepth(
      config.depth !== undefined
        ? config.depth
        : depthBase + (config.depthOffset ?? 1)
    );

    // Impede que apareça na câmera de HUD.
    this.ignorarNoHUD(efeito);

    // ============================================================
    // ANIMAÇÃO
    // ============================================================

    if (config.animacao) {
      efeito.anims.play(config.animacao, true);

      if (!config.loop) {
        efeito.once("animationcomplete", () => {
          this.destruirEfeito(efeito);
        });
      }
    }

    if (config.desgasteGuard !== undefined) {
      // O filtro trabalha somente no frame desenhado, sem copiar a spritesheet.
      efeito.enableFilters();
      efeito.filtroGuard = efeito.filters?.internal.addColorMatrix();
      this.atualizarCorGuard(efeito, config.desgasteGuard);
    }

    // ============================================================
    // EFEITO SEGUINDO PERSONAGEM
    // ============================================================

    if (config.seguir) {
      this.efeitosSeguindo.push({
        objeto: efeito,
        config,
      });
    }

    // ============================================================
    // TEMPO DE VIDA MANUAL
    // ============================================================

    if (config.duracao) {
      this.scene.time.delayedCall(config.duracao, () => {
        this.destruirEfeito(efeito);
      });
    }

    // Sobrepor as camadas aditivas reforca a luz mesmo com alpha no maximo.
    for (let i = 1; i < (config.camadas ?? 1); i++) {
      const camada = this.tocar(nome, { ...config, camadas: 1 });
      if (config.desgasteGuard !== undefined) {
        (efeito.camadasGuard ??= []).push(camada);
      }
      efeito.once("destroy", () => this.destruirEfeito(camada));
    }

    return efeito;
  }

  // ============================================================
  // POSIÇÃO
  // ============================================================

  atualizarCorGuard(efeito, desgaste) {
    if (!efeito?.active) return;
    const progresso = Math.round(Math.max(0, Math.min(1, desgaste)) * 20) / 20;
    if (efeito.filtroGuard) {
      efeito.filtroGuard.colorMatrix.set([
        1 - progresso, 0, progresso, 0, 0,
        0, 1 - 0.65 * progresso, 0, 0, 0,
        progresso, 0, 1 - progresso, 0, 0,
        0, 0, 0, 1, 0,
      ]);
    }
    for (const camada of efeito.camadasGuard ?? []) {
      this.atualizarCorGuard(camada, desgaste);
    }
  }

  obterEnquadramentoDefesa(nome) {
    if (!["guard", "midguard", "brokeguard", "stun"].includes(nome)) return {};
    const cfg = this.personagem.configAnimacoes?.[nome === "stun" ? "stun" : "guard"];
    const caixas = cfg?.hurtboxes;
    if (!caixas?.length) return {};

    // As hurtboxes ja usam medidas de mundo, inclusive nos sprites reduzidos.
    let esquerda = Infinity, direita = -Infinity, topo = Infinity, base = -Infinity;
    for (const caixa of caixas) {
      const x = caixa.offsetX ?? 0;
      const y = caixa.offsetY ?? 0;
      esquerda = Math.min(esquerda, x - caixa.largura / 2);
      direita = Math.max(direita, x + caixa.largura / 2);
      topo = Math.min(topo, y - caixa.altura / 2);
      base = Math.max(base, y + caixa.altura / 2);
    }
    const frame = this.scene.textures.getFrame(VFX_GLOBAIS[nome].textura, 0);
    if (nome === "stun") {
      return {
        // As estrelas ocupam aproximadamente 64px do frame de 128px.
        escala: Math.max(40, (direita - esquerda) * 0.9) / 64,
        offsetX: (esquerda + direita) / 2,
        offsetY: topo - 12,
      };
    }
    // Desconta a margem vazia ao redor da barreira nos frames sustentados.
    const larguraVisual = nome === "guard" ? 220 : frame.realWidth;
    const alturaVisual = nome === "guard" ? 330 : frame.realHeight;
    return {
      escalaX: (direita - esquerda + 20) / larguraVisual,
      escalaY: (base - topo + 16) / alturaVisual,
      offsetX: (esquerda + direita) / 2,
      offsetY: (topo + base) / 2,
    };
  }

  calcularPosicao(config, alvo = this.personagem) {
    const sprite = alvo.sprite;

    const direcao =
      config.direcao ??
      (sprite.flipX ? -1 : 1);

    let ponto = {
      x: 0,
      y: 0,
    };

    if (config.ponto) {
      ponto =
        alvo.pontosVFX?.[config.ponto] ??
        ponto;
    }

    let offsetX =
      (ponto.x ?? 0) +
      (config.offsetX ?? 0);

    const offsetY =
      (ponto.y ?? 0) +
      (config.offsetY ?? 0);

    // Por padrão tudo que está "na frente" acompanha flipX.
    if (config.espelharOffset !== false) {
      offsetX *= direcao;
    }

    return {
      x: sprite.x + offsetX,
      y: sprite.y + offsetY,
    };
  }



  tocarListaImpacto(lista, alvo, hitbox = null) {
  if (!Array.isArray(lista)) return;

  lista.forEach((entrada) => {

    // Efeito específico
    if (entrada.efeito) {
      this.tocarImpacto(
        entrada.efeito,
        alvo,
        hitbox,
        entrada
      );

      return;
    }

    // Escolhe um efeito aleatório
    if (
      Array.isArray(entrada.escolherUm) &&
      entrada.escolherUm.length > 0
    ) {
      const escolhido =
        Phaser.Utils.Array.GetRandom(
          entrada.escolherUm
        );

      this.tocarImpacto(
        escolhido,
        alvo,
        hitbox,
        entrada
      );
    }
  });
}





  // ============================================================
  // IMPACTO ENTRE ATAQUE E PERSONAGEM
  // ============================================================

  tocarImpacto(nome, alvo, hitbox = null, opcoes = {}) {
    const configBase = this.personagem.configVFX?.[nome];

    if (!configBase || !alvo?.sprite) return null;

    const config = {
      ...configBase,
      ...opcoes,
    };

    let x = alvo.sprite.x;
    let y = alvo.sprite.y - 50;

    // Se temos a hitbox ofensiva, calcula aproximadamente
    // o ponto de contato entre ataque e vítima.
    if (hitbox?.getBounds) {
      const boundsHitbox = hitbox.getBounds();
      const boundsAlvo = alvo.sprite.getBounds();

      const esquerda = Math.max(
        boundsHitbox.left,
        boundsAlvo.left
      );

      const direita = Math.min(
        boundsHitbox.right,
        boundsAlvo.right
      );

      const cima = Math.max(
        boundsHitbox.top,
        boundsAlvo.top
      );

      const baixo = Math.min(
        boundsHitbox.bottom,
        boundsAlvo.bottom
      );

      if (direita >= esquerda && baixo >= cima) {
        x = (esquerda + direita) / 2;
        y = (cima + baixo) / 2;
      }
    }

    return this.tocarEmPosicao(nome, x, y, config);
  }

  tocarEmPosicao(nome, x, y, opcoes = {}) {
    const configBase = this.personagem.configVFX?.[nome];

    if (!configBase) return null;

    const config = {
      ...configBase,
      ...opcoes,
    };

    if (!config.textura) return null;

    const efeito = this.scene.add.sprite(
      x,
      y,
      config.textura,
      config.frameInicial ?? 0
    );

    const direcao =
      config.direcao ??
      (this.personagem.sprite.flipX ? -1 : 1);

    if (config.espelharSprite !== false) {
      efeito.setFlipX(direcao === -1);
    }

    efeito.setScale(config.escala ?? 1);

    efeito.setDepth(
      config.depth ??
      (this.personagem.sprite.depth + 2)
    );

    this.ignorarNoHUD(efeito);

    if (config.animacao) {
      efeito.play(config.animacao);

      if (!config.loop) {
        efeito.once("animationcomplete", () => {
          this.destruirEfeito(efeito);
        });
      }
    }

    if (config.duracao) {
      this.scene.time.delayedCall(
        config.duracao,
        () => this.destruirEfeito(efeito)
      );
    }

    return efeito;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  atualizar() {
    for (let i = this.efeitosSeguindo.length - 1; i >= 0; i--) {
      const item = this.efeitosSeguindo[i];

      if (!item.objeto?.active) {
        this.efeitosSeguindo.splice(i, 1);
        continue;
      }

      const pos = this.calcularPosicao(item.config);

      item.objeto.setPosition(
        pos.x,
        pos.y
      );

      if (item.config.espelharSprite !== false) {
        item.objeto.setFlipX(
          this.personagem.sprite.flipX
        );
      }
    }
  }

  // ============================================================
  // LIMPEZA
  // ============================================================

  destruirEfeito(efeito) {
    if (!efeito) return;

    const index = this.efeitosSeguindo.findIndex(
      (item) => item.objeto === efeito
    );

    if (index !== -1) {
      this.efeitosSeguindo.splice(index, 1);
    }

    if (efeito.active) {
      efeito.destroy();
    }
  }

  ignorarNoHUD(objeto) {
    const camHUD =
      this.scene.camHUD ||
      this.scene.cameraHUD ||
      this.scene.hudCamera;

    if (camHUD?.ignore) {
      camHUD.ignore(objeto);
    }
  }

  criarAnimacoesGlobais() {
  // Repete apenas a barreira formada, sem os frames em que ela desaparece.
  if (!this.scene.anims.exists("guard-sustentada")) {
    this.scene.anims.create({
      key: "guard-sustentada",
      frames: this.scene.anims.generateFrameNumbers("guard-efect", { start: 6, end: 12 }),
      frameRate: 18,
      yoyo: true,
      repeat: -1,
    });
  }
  for (const { key, end, frameRate } of [
    { key: "guard-efect", end: 30, frameRate: 60 },
    { key: "mid-guard", end: 24, frameRate: 60 },
    { key: "brokeguard-efect", end: 22, frameRate: 60 },
    { key: "dash-effect", end: 11, frameRate: 48 },
    // A ultima linha possui somente dois frames desenhados.
    { key: "jump-effect", end: 25, frameRate: 60 },
  ]) {
    if (!this.scene.anims.exists(key)) {
      this.scene.anims.create({
        key,
        frames: this.scene.anims.generateFrameNumbers(key, { start: 0, end }),
        frameRate,
        repeat: 0,
      });
    }
  }
  if (
    !this.scene.anims.exists("stun_effect")
  ) {
    this.scene.anims.create({
      key: "stun_effect",

      frames:
        this.scene.anims.generateFrameNumbers(
          "Stun_Effect"
        ),

      frameRate: 18,
      repeat: -1
    });
  }
}
}
