import EstadoBase from "./EstadoBase.js";

export default class EstadoDano extends EstadoBase {
  enter() {
    const body = this.personagem.sprite.body;

    // 1. Virar o personagem para o oponente
    const oponente =
      this.personagem.scene.jogador1 === this.personagem
        ? this.personagem.scene.jogador2
        : this.personagem.scene.jogador1;

    if (oponente && oponente.sprite) {
      this.personagem.sprite.setFlipX(
        this.personagem.sprite.x > oponente.sprite.x
      );
    }

    // 2. Escolha da animação
    let sulfixoDano = "dano";

    if (body) {
      const velX = Math.abs(body.velocity.x);
      const velY = body.velocity.y;
      const noChao = body.blocked.down;

      const limiarVelocidade = 450;
      const limiarCima = 750;
      const limiarSide = 750; // Ajuste de sensibilidade do dano para cima

      if (velY < -limiarCima) {
        sulfixoDano = "danoUp";
      } else if (velY > limiarVelocidade && !noChao) { // Impede danoDown no chão
        sulfixoDano = "danoDown";
      } else if (velX > limiarSide) {
        sulfixoDano = "danoSide";
      }
    }

    // Toca a animação correspondente
    const chaveTotal = `${this.personagem.prefixoAnim}${sulfixoDano}`;
    if (this.personagem.scene.anims.exists(chaveTotal)) {
      this.personagem.tocarAnimacao(sulfixoDano, true);
    } else {
      this.personagem.tocarAnimacao("dano", true);
    }

    this.tempoInicial = this.personagem.scene.time.now;

    const acumulado = this.personagem.porcentagemDano || 0;
    this.duracaoStun = 200 + acumulado * 3.5;

    // RESTAURADO: Aplica o quique exatamente como estava no seu código original
    if (this.personagem.sprite.body) {
      this.personagem.sprite.body.setBounce(0.5, 0.4);
    }
  }

  execute() {
    const body = this.personagem.sprite.body;
    const agora = this.personagem.scene.time.now;

    if (body) {
      body.setVelocityX(body.velocity.x * 0.95);
    }

    if (agora - this.tempoInicial >= this.duracaoStun) {
      if (body && body.blocked.down) {
        this.personagem.maquinaEstados.mudarEstado("idle");
      } else {
        this.personagem.maquinaEstados.mudarEstado("jump");
      }
    }
  }

  exit() {
    // RESTAURADO: Reseta o quique ao sair do estado de dano exatamente como estava no seu código original
    if (this.personagem.sprite.body) {
      this.personagem.sprite.body.setBounce(0, 0);
    }
  }
}