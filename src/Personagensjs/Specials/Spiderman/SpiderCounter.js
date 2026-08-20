// src/Personagensjs/Specials/SpiderMan/SpiderCounter.js
export default class SpiderCounter {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;

    this.counterAtivo = false;
    this.timerCounter = null;
    this.hitboxCounter = null;
    this.overlap = null;
  }

  executar() {
    this.counterAtivo = true;
    const sprite = this.personagem.sprite;

    if (sprite) {
      sprite.setTint(0xffffff);
    }

    this.criarHitboxCounter();

    const duracaoJanela = this.special?.propriedades?.duracaoCounter || 600;

    this.timerCounter = this.scene.time.delayedCall(duracaoJanela, () => {
      this.desativarCounter();
    });
  }

  criarHitboxCounter() {
    const sprite = this.personagem.sprite;
    const direcao = sprite.flipX ? -1 : 1;

    this.hitboxCounter = this.scene.add.zone(sprite.x + (20 * direcao), sprite.y - 30, 60, 80);
    this.scene.physics.add.existing(this.hitboxCounter);

    if (this.hitboxCounter.body) {
      this.hitboxCounter.body.debugBodyColor = 0xffff00;
    }

    const oponente = this.scene.jogador1 === this.personagem ? this.scene.jogador2 : this.scene.jogador1;
    if (!oponente) return;

    // Detecta colisão contínua a cada frame da física
    this.overlap = this.scene.physics.add.overlap(
      this.hitboxCounter,
      oponente.grupoHurtbox || oponente.sprite, // Usa a área de física do oponente para a busca
      () => {
        // Pega o estado atual de ataque do oponente
        const estadoAtaque = oponente.maquinaEstados?.estadoAtual;

        // Só aciona se o oponente estiver atacando E a hitbox de ataque dele existir na cena
        if (estadoAtaque && estadoAtaque.hitboxAtual && estadoAtaque.hitboxAtual.active) {
          
          // Confirma se a hitbox de ataque do oponente REALMENTE colidiu com a hitbox do counter
          const encostouHitbox = this.scene.physics.overlap(this.hitboxCounter, estadoAtaque.hitboxAtual);

          if (encostouHitbox) {
            const danoInimigo = estadoAtaque.golpeAtual?.propriedades?.dano || 10;
            this.processarAparada(danoInimigo, oponente);
          }
        }
      }
    );
  }

  processarAparada(danoRecebido, atacante) {
    if (!this.counterAtivo) return;

    if (this.timerCounter) {
      this.timerCounter.remove(false);
      this.timerCounter = null;
    }

    this.desativarCounter();

    const danoRetorno = danoRecebido * 1.5;
    this.executarContraAtaque(atacante, danoRetorno);
  }

  executarContraAtaque(alvo, dano) {
    const sprite = this.personagem.sprite;
    const direcao = sprite.flipX ? -1 : 1;

    if (this.scene.anims.exists("spy_counter")) {
      sprite.anims.play("spy_counter", true);
    }

    if (alvo && alvo.receberDano) {
      alvo.receberDano(dano, {
        knockbackX: 650 * direcao,
        knockbackY: -350,
        tumbling: true
      });
    }
  }

  desativarCounter() {
    this.counterAtivo = false;

    if (this.personagem?.sprite) {
      this.personagem.sprite.clearTint();
    }

    if (this.overlap && this.overlap.active) {
      this.overlap.destroy();
      this.overlap = null;
    }

    if (this.hitboxCounter && this.hitboxCounter.active) {
      this.hitboxCounter.destroy();
      this.hitboxCounter = null;
    }
  }

  atualizar() {
    if (this.hitboxCounter && this.hitboxCounter.active && this.personagem.sprite) {
      const direcao = this.personagem.sprite.flipX ? -1 : 1;
      this.hitboxCounter.setPosition(
        this.personagem.sprite.x + (20 * direcao),
        this.personagem.sprite.y - 30
      );
    }
  }
}