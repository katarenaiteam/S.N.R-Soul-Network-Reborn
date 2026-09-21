
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
      ...configBase,
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
      efeito.once("destroy", () => this.destruirEfeito(camada));
    }

    return efeito;
  }

  // ============================================================
  // POSIÇÃO
  // ============================================================

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
