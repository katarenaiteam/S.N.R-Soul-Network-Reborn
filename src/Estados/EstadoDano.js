import EstadoBase from "./EstadoBase.js";

export default class EstadoDano extends EstadoBase {
  enter() {
    this.tempoInicial = this.personagem.scene.time.now;

    const body = this.personagem.sprite.body;
    const acumulado = this.personagem.porcentagemDano || 0;

    // =====================================================
    // HITSTUN GLOBAL
    // =====================================================
    // A velocidade do impacto ainda influencia o stun, mas com limite.
    // Assim golpes fortes seguram um pouco mais sem prender o jogador
    // durante toda a viagem até a blast zone.
    let velocidadeImpacto = 0;
    if (body) {
      velocidadeImpacto = Math.sqrt(
        body.velocity.x ** 2 + body.velocity.y ** 2
      );
    }

    // Até 180% o hitstun cresce normalmente. Depois continua crescendo
    // só um pouco para não ficar infinito.
    const danoEscalado = acumulado <= 180
      ? acumulado
      : 180 + (acumulado - 180) * 0.15;

    // Tempo mínimo obrigatório: bom para combo já em porcentagem baixa
    // e realmente perigoso perto de 180%.
    const stunMinimo = 360 + danoEscalado * 2.0;

    // Golpes de lançamento muito forte recebem no máximo +120ms.
    const bonusImpacto = Phaser.Math.Clamp(
      (velocidadeImpacto - 400) * 0.12,
      0,
      120
    );

    this.duracaoStun = Phaser.Math.Clamp(
      stunMinimo + bonusImpacto,
      360,
      840
    );

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

  // DESACELERAÇÃO DO KNOCKBACK
  // Preserva a sensação original: o lançamento começa forte e
  // perde velocidade horizontal progressivamente, sem zerar do nada.
  if (body) {
    body.setVelocityX(body.velocity.x * 0.965);
  }

  this.atualizarAnimacaoDano();

    // Enquanto o tempo mínimo não terminou,
    // o jogador NÃO possui controle.
    if (tempoPassado < this.duracaoStun) {
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
    body.setBounce(0, 0);
    body.bounce.x = 0;
    body.bounce.y = 0;
  }

  this.trocaVerticalAtiva = false;
}
}