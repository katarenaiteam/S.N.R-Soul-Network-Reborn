import { registrarAtaqueEspecial } from "./SistemaCombateEspecial.js";

function obterDonoAmbiental(scene) {
  return scene.personagemAmbientalLoja ??= {
    scene,
    nomePersonagem: "Miku",
    estadoInvencible: null,
  };
}

function obterIdEfeito(prefixo) {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class RaioLoja {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.dono = obterDonoAmbiental(scene);
    this.alvosAtingidos = new Set();
    this.encerrado = false;
    this.sprite = scene.physics.add.sprite(x, 0, "Loja_raio", 0)
      .setOrigin(0.5)
      .setDepth(1500);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);
    scene.camHUD?.ignore(this.sprite);

    if (!scene.anims.exists("loja-raio")) {
      scene.anims.create({
        key: "loja-raio",
        frames: scene.anims.generateFrameNumbers("Loja_raio", { start: 0, end: 6 }),
        frameRate: 14,
        repeat: 0,
      });
    }

    const limites = scene.limitesArena;
    const topo = limites.minY ?? limites.topo;
    this.sprite.y = topo - 330;
    this.sprite.play("loja-raio");
    this.tween = scene.tweens.add({
      targets: this.sprite,
      y: y - 120,
      duration: 480,
      ease: "Quad.easeIn",
      onComplete: () => this.impactar(),
    });
    this.aoEncerrar = () => this.destruir();
    scene.events.once("shutdown", this.aoEncerrar);
  }

  impactar() {
    if (this.encerrado) return;
    this.scene.reproduzirAudioLoja("shop-raio", obterIdEfeito("raio"));
    this.hitbox = this.scene.add.zone(this.x, this.y - 110, 220, 260);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.scene.camHUD?.ignore(this.hitbox);
    this.ataque = registrarAtaqueEspecial(
      { scene: this.scene, personagem: this.dono },
      this.hitbox,
      {
        categoria: "corpo",
        contraAtacarDono: false,
        aoAtingirAlvo: (alvo) => this.acertar(alvo),
      },
    );
    this.timer = this.scene.time.delayedCall(150, () => this.destruir());
  }

  acertar(alvo) {
    if (
      (alvo !== this.scene.jogador1 && alvo !== this.scene.jogador2) ||
      this.alvosAtingidos.has(alvo) ||
      !alvo?.sprite?.active
    ) return;
    this.alvosAtingidos.add(alvo);
    const direcao = alvo.sprite.x >= this.x ? 1 : -1;
    alvo.receberDano(
      50,
      {
        tipoSomImpacto: "heavy",
        knockbackX: 1500,
        knockbackY: -850,
        knockbackFixo: true,
        tumbling: true,
      },
      { x: this.x, direcao, atacante: this.dono },
    );
  }

  destruir() {
    if (this.encerrado) return;
    this.encerrado = true;
    this.scene.events.off("shutdown", this.aoEncerrar);
    this.tween?.stop();
    this.timer?.remove(false);
    this.ataque?.remover();
    this.hitbox?.destroy();
    this.sprite?.destroy();
    this.hitbox = null;
    this.sprite = null;
  }
}

export class MaoDeadLoja {
  constructor(scene, jogador, numeroJogador) {
    this.scene = scene;
    this.jogador = jogador;
    this.numeroJogador = numeroJogador;
    this.encerrado = false;
    this.sprite = scene.add.sprite(
      jogador.sprite.x,
      (scene.limitesArena.minY ?? scene.limitesArena.topo) - 280,
      "Loja_mao",
      0,
    )
      .setOrigin(0.5)
      .setDepth(1600);
    scene.camHUD?.ignore(this.sprite);
    this.atualizarX = () => {
      if (this.jogador?.sprite?.active) this.sprite?.setX(this.jogador.sprite.x);
      else this.destruir();
    };
    this.aoEncerrar = () => this.destruir();
    scene.events.on("postupdate", this.atualizarX);
    scene.events.once("shutdown", this.aoEncerrar);
    this.tween = scene.tweens.add({
      targets: this.sprite,
      y: jogador.sprite.y - 115,
      duration: 850,
      ease: "Quad.easeIn",
      onComplete: () => this.atingir(),
    });
  }

  atingir() {
    if (this.encerrado || !this.jogador?.sprite?.active) {
      this.destruir();
      return;
    }
    this.sprite.setFrame(1);
    this.scene.reproduzirAudioLoja(
      "shop-dead",
      obterIdEfeito(`dead-${this.numeroJogador}`),
    );
    this.scene.processarQueda(
      this.jogador,
      this.numeroJogador === 1 ? this.scene.pontoRespawnP1 : this.scene.pontoRespawnP2,
      this.numeroJogador,
    );
    this.timer = this.scene.time.delayedCall(350, () => this.destruir());
  }

  destruir() {
    if (this.encerrado) return;
    this.encerrado = true;
    this.scene.events.off("postupdate", this.atualizarX);
    this.scene.events.off("shutdown", this.aoEncerrar);
    this.tween?.stop();
    this.timer?.remove(false);
    this.sprite?.destroy();
    this.sprite = null;
  }
}