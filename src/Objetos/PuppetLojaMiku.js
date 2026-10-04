import {
  obterAlvosCombate,
  registrarAtaqueEspecial,
} from "./SistemaCombateEspecial.js";

export default class PuppetLojaMiku {
  constructor(scene) {
    this.scene = scene;
    this.dono = scene.personagemAmbientalLoja ??= {
      scene,
      nomePersonagem: "Miku",
      estadoInvencible: null,
    };
    this.vida = 50;
    this.ativo = true;
    this.proximoAtaque = 0;
    this.alvosAtingidos = new Set();

    const x = (scene.mapaAtual.spawnsIniciais.p1.x + scene.mapaAtual.spawnsIniciais.p2.x) / 2;
    const y = Math.min(scene.mapaAtual.spawnsIniciais.p1.y, scene.mapaAtual.spawnsIniciais.p2.y) - 250;
    this.sprite = scene.physics.add.sprite(x, y, "Miku_puppet", 0);
    this.sprite.setOrigin(0.5, 1).setScale(1.8).setDepth(20).play("miku_puppet_move");
    this.sprite.body.setSize(58, 88);
    this.sprite.body.setOffset(51, 58);
    this.sprite.body.debugShowBody = false;
    this.sprite.body.debugShowVelocity = false;
    scene.camHUD?.ignore(this.sprite);

    this.grupoHurtbox = scene.physics.add.group({ allowGravity: false, immovable: true });
    this.hurtbox = scene.add.zone(this.sprite.x, this.sprite.y - 95, 118, 176);
    this.grupoHurtbox.add(this.hurtbox);
    this.hurtbox.body.setAllowGravity(false);
    this.hurtbox.body.setImmovable(true);
    scene.camHUD?.ignore(this.hurtbox);

    this.colliderMapa = scene.mapaAtual?.plataformas
      ? scene.physics.add.collider(this.sprite, scene.mapaAtual.plataformas)
      : null;
    scene.alvosAtaqueExtras ??= [];
    scene.alvosAtaqueExtras.push(this);

    this.atualizarNoPostUpdate = () => this.atualizar();
    this.limparAoEncerrar = () => this.destruir();
    scene.events.on("postupdate", this.atualizarNoPostUpdate);
    scene.events.once("shutdown", this.limparAoEncerrar);
  }

  receberDano(quantidade, propriedades = {}, origem = null) {
    if (!this.ativo || quantidade <= 0) return false;
    this.vida = Math.max(0, this.vida - quantidade);
    const direcao = origem?.direcao ?? (
      origem?.x !== undefined && this.sprite.x >= origem.x ? 1 : -1
    );
    this.sprite.body.setVelocity(
      direcao * Math.abs(propriedades.knockbackX ?? 180),
      propriedades.knockbackY ?? -120,
    );
    if (this.vida === 0) this.destruir();
    return false;
  }

  atualizar() {
    if (!this.ativo || !this.sprite?.active) return;
    this.hurtbox.setPosition(this.sprite.x, this.sprite.y - 95);
    if (this.hitbox?.active) {
      this.hitbox.setPosition(this.sprite.x + 88 * this.direcaoAtaque, this.sprite.y - 96);
      this.hitbox.body?.updateFromGameObject();
    }

    const alvos = [this.scene.jogador1, this.scene.jogador2].filter(
      (jogador) => jogador?.sprite?.active && !jogador.emMorteVS && !jogador.eliminado,
    );
    if (!alvos.length || this.hitbox?.active) return;

    const alvo = alvos.reduce((maisPerto, jogador) => (
      !maisPerto || Math.abs(jogador.sprite.x - this.sprite.x) < Math.abs(maisPerto.sprite.x - this.sprite.x)
        ? jogador
        : maisPerto
    ), null);
    const dx = alvo.sprite.x - this.sprite.x;
    const dy = alvo.sprite.y - this.sprite.y;
    this.direcaoAtaque = dx >= 0 ? 1 : -1;
    this.sprite.setFlipX(this.direcaoAtaque < 0);

    if (Math.abs(dx) <= 145 && Math.abs(dy) <= 175) {
      this.sprite.setVelocityX(0);
      if (this.scene.time.now >= this.proximoAtaque) this.atacar();
      return;
    }

    if (this.sprite.body.blocked.down) {
      this.sprite.setVelocityX(150 * this.direcaoAtaque);
      if (dy < -150) this.sprite.setVelocityY(-340);
    }
  }

  atacar() {
    this.proximoAtaque = this.scene.time.now + 1300;
    this.alvosAtingidos.clear();
    this.hitbox = this.scene.add.zone(
      this.sprite.x + 88 * this.direcaoAtaque,
      this.sprite.y - 96,
      150,
      160,
    );
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.scene.camHUD?.ignore(this.hitbox);
    this.registroAtaque = registrarAtaqueEspecial(
      { scene: this.scene, personagem: this.dono },
      this.hitbox,
      {
        categoria: "corpo",
        contraAtacarDono: false,
        aoAtingirAlvo: (alvo) => this.acertar(alvo),
      },
    );
    this.timerAtaque = this.scene.time.delayedCall(200, () => this.limparAtaque());
  }

  acertar(alvo) {
    if (
      this.alvosAtingidos.has(alvo) ||
      !alvo?.sprite?.active ||
      (alvo !== this.scene.jogador1 && alvo !== this.scene.jogador2)
    ) return;
    this.alvosAtingidos.add(alvo);
    const direcao = alvo.sprite.x >= this.sprite.x ? 1 : -1;
    alvo.receberDano(
      10,
      { tipoSomImpacto: "heavy", knockbackX: 300, knockbackY: -160 },
      { x: this.sprite.x, direcao, atacante: this.dono },
    );
  }

  limparAtaque() {
    this.timerAtaque?.remove(false);
    this.timerAtaque = null;
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
    this.alvosAtingidos.clear();
  }

  destruir() {
    if (!this.ativo) return;
    this.ativo = false;
    this.scene.events.off("postupdate", this.atualizarNoPostUpdate);
    this.scene.events.off("shutdown", this.limparAoEncerrar);
    this.limparAtaque();
    this.colliderMapa?.destroy();
    this.colliderMapa = null;
    if (this.hurtbox?.body) this.hurtbox.body.enable = false;
    this.grupoHurtbox?.clear(true, true);
    this.grupoHurtbox = null;
    this.hurtbox = null;
    this.scene.alvosAtaqueExtras = (this.scene.alvosAtaqueExtras ?? []).filter(
      (alvo) => alvo !== this,
    );
    this.sprite?.destroy();
    this.sprite = null;
  }
}