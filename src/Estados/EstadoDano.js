import EstadoBase from "./EstadoBase.js";

export default class EstadoDano extends EstadoBase {
  enter() {
    this.tempoInicial = this.personagem.scene.time.now;

    const body = this.personagem.sprite.body;
    const acumulado = this.personagem.porcentagemDano || 0;

    // 1. CALCULA A FORÇA REAL DO IMPACTO DO GOLPE
    let velImpacto = 0;
    if (body) {
      velImpacto = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
    }

    // 2. DURAÇÃO DINÂMICA:
    // - Golpes fracos (pouca velocidade): Duração base curta (ex: 120ms + escala leve).
    // - Golpes fortes (muita velocidade): Duram proporcionalmente à força enviada na física.
    const stunPorVelocidade = velImpacto * 0.45; 
    const stunPorPorcentagem = 120 + (acumulado * 1.5);

    // Usa o maior valor entre a força do golpe e o dano acumulado, limitando o teto
    let stunCalculado = Math.max(stunPorVelocidade, stunPorPorcentagem);

    // TETO MÁXIMO (CAP):
    // Se a velocidade for baixa (golpe fraco em local fechado/sem projeção), limita o stun a no máximo 280ms
    if (velImpacto < 400) {
      stunCalculado = Math.min(stunCalculado, 280);
    }

    this.duracaoStun = stunCalculado;

    // 🔒 Trava de controle para transição vertical sem passar pelo neutro
    this.trocaVerticalAtiva = false;

    // Virar o personagem para o oponente
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
      const animacaoAtual = this.personagem.sprite.anims.currentAnim?.key;
      const estaEmDanoSide =
        animacaoAtual === `${this.personagem.prefixoAnim}danoSide`;

      // 1. ATIVA O MODO VERTICAL: Se o golpe inicial te jogou forte para cima
      if (velY < -limiarMinimoVertical && absY > absX) {
        this.trocaVerticalAtiva = true;
      }

      // 2. Ataques laterais tambem passam para danoDown ao iniciar a queda
      if (estaEmDanoSide && velY > 80 && !noChao) {
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

    // CHECAGEM DE SEGURANÇA: Se encostou no chão e a velocidade zera, cancela o stun restante
    const velTotal = body ? Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2) : 0;
    const parouNoChao = body && body.blocked.down && velTotal < 30 && tempoPassado > 100;

    // Se o tempo de Stun ainda não acabou e não parou no chão, continua travado
    if (tempoPassado < this.duracaoStun && !parouNoChao) {
      return;
    }

    // -------------------------------------------------------------
    // A PARTIR DAQUI, O STUN JÁ ACABOU (tempoPassado >= duracaoStun)
    // -------------------------------------------------------------

    // 1. GOLPES COMUNS (sem tumbling) -> Volta pro IDLE se tiver no chão
    if (!this.personagem.isTumbling) {
      if (body && body.blocked.down) {
        this.personagem.maquinaEstados.mudarEstado("idle");
      } else {
        this.personagem.maquinaEstados.mudarEstado("jump");
      }
      return;
    }

    // 2. GOLPES FORTES (com tumbling) -> Quando toca o chão, entra no DEAD
    const limitesArena = this.personagem.scene.limitesArena;
    const x = this.personagem.sprite.x;
    const y = this.personagem.sprite.y;
    const foraDaArena = limitesArena && (
      x < (limitesArena.minX ?? limitesArena.esquerda) ||
      x > (limitesArena.maxX ?? limitesArena.direita) ||
      y < (limitesArena.minY ?? limitesArena.topo) ||
      y > (limitesArena.maxY ?? limitesArena.baixo)
    );

    if (body && body.blocked.down && !foraDaArena) {
      this.personagem.isTumbling = false;
      this.personagem.maquinaEstados.mudarEstado("dead");
      return;
    }

    // Recuperação aérea por input após o término do Stun (apenas para golpes fortes no ar)
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
    const body = this.personagem.sprite.body;
    if (body) {
      // 1. Zera o quique nos dois eixos (X e Y) imediatamente
      body.setBounce(0, 0);

      // 2. Reseta o coeficiente de restituição (garante no motor físico do Phaser)
      body.bounce.x = 0;
      body.bounce.y = 0;
    }

    // Reseta o estado vertical ao sair do dano
    this.trocaVerticalAtiva = false;
  }
}