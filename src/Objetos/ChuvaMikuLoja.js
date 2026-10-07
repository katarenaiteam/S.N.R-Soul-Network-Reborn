import {
  obterAlvosCombate,
  registrarAtaqueEspecial,
} from "./SistemaCombateEspecial.js";

export default class ChuvaMikuLoja {
  constructor(scene) {
    this.scene = scene;
    this.personagemAmbiental = scene.personagemAmbientalLoja ??= {
      scene,
      nomePersonagem: "Miku",
      estadoInvencible: null,
    };
    this.levaTimers = [];
    this.puppets = [];
    this.encerrado = false;
    this.limparAoEncerrar = () => this.destruir();
    scene.events.once("shutdown", this.limparAoEncerrar);
  }

  executar() {
    if (this.encerrado) return;
    for (let leva = 0; leva < 3; leva += 1) {
      this.levaTimers.push(
        this.scene.time.delayedCall(leva * 900, () => this.criarLeva(leva)),
      );
    }
  }

  criarLeva(numeroLeva) {
    if (this.encerrado) return;
    const limites = this.scene.limitesArena;
    const minX = limites.minX ?? limites.esquerda;
    const maxX = limites.maxX ?? limites.direita;
    const minY = limites.minY ?? limites.topo;
    const profundidade = Math.max(
      this.scene.jogador1.sprite.depth,
      this.scene.jogador2.sprite.depth,
    ) + 1;

    for (let indice = 0; indice < 20; indice += 1) {
      const fracao = (indice + 0.5) / 20;
      const posicaoX = Phaser.Math.Linear(minX, maxX, fracao)
        + Phaser.Math.Between(-22, 22);
      const posicaoY = minY - Phaser.Math.Between(140, 440);
      const sprite = this.scene.physics.add.sprite(posicaoX, posicaoY, "Miku_puppet", 0);
      sprite.setOrigin(0.5, 1);
      sprite.setScale(0.25);
      sprite.setDepth(profundidade);
      sprite.setFlipX(Phaser.Math.Between(0, 1) === 1);
      sprite.play("miku_puppet_move");
      sprite.body.setSize(55, 75);
      sprite.body.setVelocity(Phaser.Math.Between(-24, 24), Phaser.Math.Between(80, 160));
      sprite.setCollideWorldBounds(false);
      this.scene.camHUD?.ignore(sprite);

      const grupoHurtbox = this.scene.physics.add.group({
        allowGravity: false,
        immovable: true,
      });
      const hurtbox = this.scene.add.zone(sprite.x, sprite.y - 18, 34, 38);
      grupoHurtbox.add(hurtbox);
      hurtbox.body.setAllowGravity(false);
      hurtbox.body.setImmovable(true);
      const collider = this.scene.mapaAtual?.plataformas
        ? this.scene.physics.add.collider(sprite, this.scene.mapaAtual.plataformas)
        : null;
      const puppet = {
        sprite,
        collider,
        grupoHurtbox,
        hurtbox,
        timer: null,
        destruido: false,
        ativo: true,
        dono: this.personagemAmbiental,
        colisoresRecebidos: new Set(),
      };
      puppet.receberDano = () => {
        this.remover(puppet);
        return false;
      };
      puppet.registrarColisorRecebido = (colisorRecebido) => {
        if (colisorRecebido) puppet.colisoresRecebidos.add(colisorRecebido);
      };
      this.scene.alvosAtaqueExtras ??= [];
      this.scene.alvosAtaqueExtras.push(puppet);
      const logicaAtaque = {
        scene: this.scene,
        personagem: this.personagemAmbiental,
      };
      registrarAtaqueEspecial(logicaAtaque, sprite, {
        categoria: "projetil",
        aoColidir: () => this.remover(puppet),
        aoAtingirAlvo: (alvo) => this.acertar(puppet, alvo),
      });
      puppet.numeroLeva = numeroLeva;
      puppet.timer = this.scene.time.delayedCall(15000, () => this.remover(puppet));
      this.puppets.push(puppet);
    }
  }

  acertar(puppet, alvo) {
    if (puppet.destruido || !alvo?.sprite?.active) return;
    const direcao = alvo.sprite.x >= puppet.sprite.x ? 1 : -1;
    alvo.receberDano(
      1,
      {
        tipoSomImpacto: "light",
        dano: 1,
        knockbackX: 80,
        knockbackY: -45,
        knockbackFixo: true,
      },
      { x: puppet.sprite.x, direcao },
    );
    this.remover(puppet);
  }

  atualizar() {
    this.puppets.forEach((puppet) => {
      const sprite = puppet.sprite;
      if (puppet.destruido || !sprite?.active) return;
      puppet.hurtbox?.setPosition(sprite.x, sprite.y - 18);
      if (!sprite.body.blocked.down) return;

      const alvo = obterAlvosCombate(this.personagemAmbiental)
        .reduce((maisPerto, candidato) => {
          if (!maisPerto) return candidato;
          return Math.abs(candidato.sprite.x - sprite.x) < Math.abs(maisPerto.sprite.x - sprite.x)
            ? candidato
            : maisPerto;
        }, null);
      if (!alvo) {
        sprite.setVelocityX(0);
        return;
      }
      const direcao = alvo.sprite.x >= sprite.x ? 1 : -1;
      sprite.setFlipX(direcao < 0);
      sprite.setVelocityX(210 * direcao);
    });
  }

  remover(puppet) {
    if (puppet.destruido) return;
    puppet.destruido = true;
    puppet.ativo = false;
    puppet.timer?.remove(false);
    puppet.collider?.destroy();
    if (puppet.sprite?.body) puppet.sprite.body.enable = false;
    if (puppet.hurtbox?.body) puppet.hurtbox.body.enable = false;
    if (this.scene.alvosAtaqueExtras) {
      this.scene.alvosAtaqueExtras = this.scene.alvosAtaqueExtras.filter(
        (alvo) => alvo !== puppet,
      );
    }
    this.scene.time.delayedCall(0, () => {
      puppet.grupoHurtbox?.clear(true, true);
      puppet.grupoHurtbox = null;
      puppet.hurtbox = null;
      puppet.sprite?.destroy();
      puppet.sprite = null;
    });
  }

  destruir() {
    if (this.encerrado) return;
    this.encerrado = true;
    this.scene.events.off("shutdown", this.limparAoEncerrar);
    this.levaTimers.forEach((timer) => timer.remove(false));
    this.levaTimers.length = 0;
    this.puppets.forEach((puppet) => this.remover(puppet));
    this.puppets.length = 0;
  }
}