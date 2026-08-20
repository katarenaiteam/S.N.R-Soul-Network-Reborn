import EstadoBase from "./EstadoBase.js";

export default class EstadoDano extends EstadoBase {
  enter() {
    this.tempoInicial = this.personagem.scene.time.now;

    const acumulado = this.personagem.porcentagemDano || 0;
    this.duracaoStun = 200 + acumulado * 3.5;

    const body = this.personagem.sprite.body;

    // 🔒 Trava de controle para transição vertical sem passar pelo neutro
    this.trocaVerticalAtiva = false;

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

    // Aplica o quique
    if (body) {
      body.setBounce(0.5, 0.4);
    }

    // Inicializa a animação
    this.atualizarAnimacaoDano();
  }

  atualizarAnimacaoDano() {
    const body = this.personagem.sprite.body;
    let sulfixoDano = "dano";

    if (body) {
      const absX = Math.abs(body.velocity.x);
      const absY = Math.abs(body.velocity.y);
      const velY = body.velocity.y;
      const noChao = body.blocked.down;

      const limiarMinimoVertical = 300;
      const limiarMinimoHorizontal = 500;

      // 1. ATIVA O MODO VERTICAL: Se o golpe inicial te jogou forte para cima
      if (velY < -limiarMinimoVertical && absY > absX) {
        this.trocaVerticalAtiva = true;
      }

      // 🔴 MODO VERTICAL ATIVO (Garante a troca UP ➡️ DOWN sem passar pelo Neutro)
      if (this.trocaVerticalAtiva && !noChao) {
        if (velY < 0) {
          sulfixoDano = "danoUp";   // Subindo
        } else {
          sulfixoDano = "danoDown"; // Descendo (Troca direto, ZERO neutro)
        }
      } 
      // 🟢 MODO PADRÃO (Golpes normais/horizontais continuam usando neutro normalmente)
      else {
        if (absX >= absY && absX > limiarMinimoHorizontal) {
          sulfixoDano = "danoSide";
        } else {
          sulfixoDano = "dano"; // Neutro reservado para golpes fracos
        }
      }
    }

    // Toca a animação apenas se for diferente da atual
    const chaveTotal = `${this.personagem.prefixoAnim}${sulfixoDano}`;
    const animAtual = this.personagem.sprite.anims.currentAnim?.key;

    if (animAtual !== chaveTotal) {
      if (this.personagem.scene.anims.exists(chaveTotal)) {
        this.personagem.tocarAnimacao(sulfixoDano, true);
      } else {
        this.personagem.tocarAnimacao("dano", true);
      }
    }
  }

  execute() {
    const body = this.personagem.sprite.body;
    const agora = this.personagem.scene.time.now;
    const tempoPassado = agora - this.tempoInicial;

    if (body) {
      body.setVelocityX(body.velocity.x * 0.96);
    }

    // Atualiza a animação dinamicamente
    this.atualizarAnimacaoDano();

    // REGRA ABSOLUTA: Enquanto o tempo de Stun não acabar, o personagem permanece no Estado de Dano
    if (tempoPassado < this.duracaoStun) {
      return;
    }

    // -------------------------------------------------------------
    // A PARTIR DAQUI, O STUN JÁ ACABOU (tempoPassado >= duracaoStun)
    // -------------------------------------------------------------

    // GOLPES COMUNS (tumbling = false ou undefined)
    if (!this.personagem.isTumbling) {
      if (body && body.blocked.down) {
        this.personagem.maquinaEstados.mudarEstado("idle");
      } else {
        this.personagem.maquinaEstados.mudarEstado("jump");
      }
      return;
    }

    // GOLPES FORTES (tumbling = true)
    if (body && body.blocked.down) {
      this.personagem.isTumbling = false;
      this.personagem.maquinaEstados.mudarEstado("idle");
      return;
    }

    // Recuperação aérea por input após o término do Stun
    const p = this.personagem;
    const apertouComando =
      p.inputJustDown("cima") ||
      p.inputJustDown("baixo") ||
      p.inputJustDown("esquerda") ||
      p.inputJustDown("direita") ||
      p.inputJustDown("atack") ||
      p.inputJustDown("special") ||
      p.inputJustDown("dash");

    if (apertouComando) {
      p.isTumbling = false;
      p.maquinaEstados.mudarEstado("jump");
    }
  }

  exit() {
    if (this.personagem.sprite.body) {
      this.personagem.sprite.body.setBounce(0, 0);
    }
    // Reseta o estado vertical ao sair do dano
    this.trocaVerticalAtiva = false;
  }
}