import { obterAtaquesEspeciaisInimigos } from "../../../Objetos/SistemaCombateEspecial.js";
import { tocarSomSeguro } from "../../../Objetos/AudioSeguro.js";

export default class SpiderCounter {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;

    this.counterAtivo = false;
    this.hitboxCounter = null;
    this.timerBrilho = null;
    this.timerCounter = null;
    this.invulnerabilidadeAnterior = false;
  }

  executar() {
    // Garante reset de instâncias passadas
    this.desativarCounter();

    this.counterAtivo = true;
    tocarSomSeguro(this.scene, "sp-close", { volume: 0.2 });

    if (this.personagem) {
      this.invulnerabilidadeAnterior = this.personagem.invulneravel;
      this.personagem.invulneravel = true;
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

    // Cria a Zone do Counter
    this.hitboxCounter = this.scene.add.zone(sprite.x -5, sprite.y -80, 55, 110);
    this.scene.physics.add.existing(this.hitboxCounter);
    if (this.hitboxCounter.body) {
      this.hitboxCounter.body.allowGravity = false;
      this.hitboxCounter.body.debugBodyColor = 0xffff00;
    }

    // Timer limite de duração do counter (600ms)
    this.timerCounter = this.scene.time.delayedCall(600, () => this.desativarCounter());
  }

  atualizar() {
    const hitboxCounter = this.hitboxCounter;
    if (!this.counterAtivo || !hitboxCounter?.active) return;

    const sprite = this.personagem.sprite;
    if (!sprite?.active || !hitboxCounter.active) return;
    hitboxCounter.setPosition(sprite.x -5, sprite.y - 60);

    // =========================================================
    // CHECAGEM GEOMÉTRICA MANUAL (Sem travas de overlap do Phaser)
    // =========================================================
    const oponente = this.scene.jogador1 === this.personagem ? this.scene.jogador2 : this.scene.jogador1;
    if (!oponente) return;

    const estadoOponente = oponente.maquinaEstados?.estadoAtual;
    
    // Busca a hitbox de ataque do oponente (suporta hitbox única ou grupo de hitboxes)
    let hitboxInimiga = estadoOponente?.hitboxAtual;
    if (!hitboxInimiga?.active && estadoOponente?.grupoHitbox) {
      hitboxInimiga = estadoOponente.grupoHitbox.getChildren().find(h => h.active);
    }

    // Se houver uma hitbox de ataque ATIVA no oponente
    if (hitboxInimiga && hitboxInimiga.active) {
      const boundsCounter = hitboxCounter.getBounds();
      const boundsAtaque = hitboxInimiga.getBounds ? hitboxInimiga.getBounds() : hitboxInimiga.body;

      // Teste de interseção entre os retângulos
      if (Phaser.Geom.Intersects.RectangleToRectangle(boundsCounter, boundsAtaque)) {
        this.dispararContraAtaque(oponente);
        return;
      }
    }

    if (!this.counterAtivo || !hitboxCounter.active) return;
    const boundsCounter = hitboxCounter.getBounds();
    const ataqueEspecial = obterAtaquesEspeciaisInimigos(this.scene, this.personagem)
      .find((ataque) => {
        const boundsAtaque = ataque.objeto.getBounds?.() ?? ataque.objeto.body;
        return boundsAtaque && Phaser.Geom.Intersects.RectangleToRectangle(
          boundsCounter,
          boundsAtaque
        );
      });

    if (ataqueEspecial) {
      ataqueEspecial.aoColidir?.();
      ataqueEspecial.remover?.();
      this.dispararContraAtaque(
        oponente,
        ataqueEspecial.contraAtacarDono
      );
    }
  }

  dispararContraAtaque(oponente, causarDano = true) {
    if (!this.counterAtivo) return;

    this.desativarCounter();

    const sprite = this.personagem.sprite;
    const oponenteEsquerda = oponente.sprite.x < sprite.x;

    sprite.setFlipX(oponenteEsquerda);

    if (sprite.body) {
      sprite.body.setVelocity(0, 0);
    }

    if (this.scene.anims.exists("spy_counter")) {
      sprite.anims.play("spy_counter", true);
      if (typeof this.personagem.aplicarConfiguracao === 'function') {
        this.personagem.aplicarConfiguracao("counter");
      }
    }

    if (causarDano && typeof oponente.receberDano === 'function') {
      oponente.receberDano(15, { 
        knockbackX: 650, 
        knockbackY: -350, 
        tumbling: true 
      });
    }
  }

  desativarCounter() {
    const estavaAtivo = this.counterAtivo;
    this.counterAtivo = false;

    if (this.timerCounter) {
      this.timerCounter.remove(false);
      this.timerCounter = null;
    }

    if (estavaAtivo && this.personagem) {
      this.personagem.invulneravel = this.invulnerabilidadeAnterior;
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
