export default class SpiderCounter {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;

    this.counterAtivo = false;
    this.hitboxCounter = null;
    this.timerBrilho = null;
    this.colliderOverlap = null;
  }

  executar() {
    this.counterAtivo = true;

    if (this.personagem) {
      // 1. Apaga as hurtboxes para ficar invulnerável
      this.personagem.destruirHurtboxes();

      // 2. Trava a chave do especial para garantir que a FSM saiba que é o agachado
      if (this.special) {
        this.special.tipo = "agachado";
      }

      // 3. Aplica o cooldown especificamente no container do agachado
      this.personagem.iniciarCooldownSpecial("agachado");
    }

    const sprite = this.personagem.sprite;
    if (sprite) {
      this.timerBrilho = this.scene.time.addEvent({
        delay: 70,
        callback: () => {
          if (!this.counterAtivo) return;
          if (sprite.isTinted) sprite.clearTint();
          else sprite.setTint(0x88ffff);
        },
        loop: true
      });
    }

    // Cria a hitbox amarela do counter
    this.hitboxCounter = this.scene.add.zone(sprite.x, sprite.y - 60, 80, 110);
    this.scene.physics.add.existing(this.hitboxCounter);
    if (this.hitboxCounter.body) {
      this.hitboxCounter.body.allowGravity = false;
      this.hitboxCounter.body.debugBodyColor = 0xffff00;
    }

    const oponente = this.scene.jogador1 === this.personagem ? this.scene.jogador2 : this.scene.jogador1;

    if (oponente) {
      this.colliderOverlap = this.scene.physics.add.overlap(
        this.hitboxCounter,
        oponente.sprite,
        () => this.dispararContraAtaque(oponente),
        () => oponente.maquinaEstados?.estadoAtual?.hitboxAtual?.active === true,
        this
      );
    }

    this.scene.time.delayedCall(600, () => this.desativarCounter());
  }

  atualizar() {
    // Apenas mantém a zone colada no Aranha
    if (!this.counterAtivo || !this.hitboxCounter?.active) return;

    if (this.personagem) {
      this.personagem.destruirHurtboxes();
    }

    const sprite = this.personagem.sprite;
    this.hitboxCounter.setPosition(sprite.x, sprite.y - 60);
  }

  dispararContraAtaque(oponente) {
    if (!this.counterAtivo) return;

    this.desativarCounter();

    const sprite = this.personagem.sprite;
    const oponenteEsquerda = oponente.sprite.x < sprite.x;

    // Vira o Aranha para o lado do oponente
    sprite.setFlipX(oponenteEsquerda);

    if (sprite.body) {
      sprite.body.setVelocity(0, 0);
    }

    // Toca a animação spy_counter
    if (this.scene.anims.exists("spy_counter")) {
      sprite.anims.play("spy_counter", true);
      if (typeof this.personagem.aplicarConfiguracao === 'function') {
        this.personagem.aplicarConfiguracao("counter");
      }
    }

    // Envia o dano (Personagem.js calcula a direção do empurrão automaticamente)
    if (typeof oponente.receberDano === 'function') {
      oponente.receberDano(15, { 
        knockbackX: 650, 
        knockbackY: -350, 
        tumbling: true 
      });
    }
  }

  desativarCounter() {
    this.counterAtivo = false;

    if (this.colliderOverlap) {
      this.scene.physics.world.removeCollider(this.colliderOverlap);
      this.colliderOverlap = null;
    }

    if (this.timerBrilho) {
      this.timerBrilho.remove(false);
      this.timerBrilho = null;
    }

    if (this.personagem?.sprite) {
      this.personagem.sprite.clearTint();
    }

    if (this.hitboxCounter?.active) {
      this.hitboxCounter.destroy();
      this.hitboxCounter = null;
    }
  }
}