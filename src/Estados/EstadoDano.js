import EstadoBase from "./EstadoBase.js";

export default class EstadoDano extends EstadoBase {
  enter() {
    this.tempoInicial = this.personagem.scene.time.now;
    this.janelaBufferPulo = 300;
    this.puloBufferAte = 0;
    this.quiqueChaoAplicado = false;

    const body = this.personagem.sprite.body;
    const FRAME_MS = 1000 / 60;

if (false) {
let forcaImpacto = 0;

if (body) {
  forcaImpacto = Math.max(
    Math.abs(body.velocity.x),
    Math.abs(body.velocity.y)
  );
}

let framesStun;


// =====================================================
// GOLPE COMUM
// Pouco lançamento = recuperação rápida
// =====================================================

if (!this.personagem.isTumbling) {

  framesStun =
    5 + forcaImpacto / 100;

  framesStun = Phaser.Math.Clamp(
    framesStun,
    6,   // 100ms
    12   // 200ms
  );
}


// =====================================================
// GOLPE DE LANÇAMENTO / TUMBLING
// O personagem realmente fica incapacitado durante o voo
// =====================================================

else {

  framesStun =
    16 + forcaImpacto / 45;

  framesStun = Phaser.Math.Clamp(
    framesStun,
    20,  // 333ms mínimo
    45   // 750ms máximo
  );
}


this.duracaoStun =
  framesStun * FRAME_MS;
}

// O impacto já traz o hitstun calculado. O fallback cobre chamadas antigas
// que entrem diretamente neste estado sem passar por receberDano.
this.duracaoStun = this.personagem.ultimoImpacto?.hitstunCalculadoMs
  ?? (this.personagem.isTumbling ? 22 : 14) * FRAME_MS;

    //controle para transição vertical sem passar pelo neutro
    this.trocaVerticalAtiva = false;
    this.modoHorizontalAtivo = false;

    // Perto de uma parede, mantém a direção atual para o sprite não invadi-la
    // ao ser espelhado. Fora dela, continua olhando para o atacante.
    const oponente =
      this.personagem.scene.jogador1 === this.personagem
        ? this.personagem.scene.jogador2
        : this.personagem.scene.jogador1;
    const plataformas = this.personagem.scene.mapaAtual?.plataformas?.getChildren?.() ?? [];
    const margemParede = 24;
    const paredeProxima = body && plataformas.some((plataforma) => {
      const parede = plataforma.body;
      if (!parede?.enable) return false;

      const sobrepoeVerticalmente =
        body.bottom > parede.top && body.top < parede.bottom;
      const pertoDaEsquerda = Math.abs(body.left - parede.right) <= margemParede;
      const pertoDaDireita = Math.abs(body.right - parede.left) <= margemParede;

      return sobrepoeVerticalmente && (pertoDaEsquerda || pertoDaDireita);
    });
    const encostadoNaParede = body && (
      body.blocked.left || body.blocked.right ||
      body.touching.left || body.touching.right ||
      paredeProxima
    );

    if (oponente?.sprite && !encostadoNaParede) {
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

    // Velocidade de queda necessária para considerar
    // que o personagem realmente começou a despencar.
    const limiarQueda = 120;


    // =====================================================
    // 1. LANÇAMENTO VERTICAL PARA CIMA
    // =====================================================

    if (
      !this.trocaVerticalAtiva &&
      velY < -limiarMinimoVertical &&
      absY > absX
    ) {
      this.trocaVerticalAtiva = true;
      this.modoHorizontalAtivo = false;
    }


    // =====================================================
    // 2. LANÇAMENTO HORIZONTAL
    // =====================================================

    // IMPORTANTE:
    // depois que entra no modo horizontal,
    // ele NÃO sai dele só porque perdeu velocidade.
    if (
      !this.trocaVerticalAtiva &&
      !this.modoHorizontalAtivo &&
      absX >= absY &&
      absX > limiarMinimoHorizontal
    ) {
      this.modoHorizontalAtivo = true;
    }


    // =====================================================
    // 3. COMEÇOU A CAIR
    // =====================================================

    const estaCaindo =
      !noChao &&
      velY > limiarQueda;

    if (
      estaCaindo &&
      (
        this.modoHorizontalAtivo ||
        this.personagem.isTumbling
      )
    ) {
      this.trocaVerticalAtiva = true;
      this.modoHorizontalAtivo = false;
    }


    // =====================================================
    // 4. ESCOLHE A ANIMAÇÃO
    // =====================================================

    if (
      this.trocaVerticalAtiva &&
      !noChao
    ) {
      if (velY < 0) {
        sulfixoDano = "danoUp";
      } else {
        sulfixoDano = "danoDown";
      }
    }

    else if (
      this.modoHorizontalAtivo &&
      !noChao
    ) {
      sulfixoDano = "danoSide";
    }

    else {
      sulfixoDano = "dano";
    }
  }


  // =====================================================
  // TROCA DE ANIMAÇÃO
  // =====================================================

  const chaveTotal =
    `${this.personagem.prefixoAnim}${sulfixoDano}`;

  const animAtual =
    this.personagem.sprite.anims.currentAnim?.key;

  if (animAtual !== chaveTotal) {
    if (
      this.personagem.scene.anims.exists(
        chaveTotal
      )
    ) {
      this.personagem.tocarAnimacao(
        sulfixoDano,
        true
      );
    } else {
      this.personagem.tocarAnimacao(
        "dano",
        true
      );
    }
  }
}
 execute() {
  const body = this.personagem.sprite.body;
  const agora = this.personagem.scene.time.now;
  const tempoPassado = agora - this.tempoInicial;

  // Guarda o pulo apertado durante o hitstun por uma pequena janela.
  if (this.personagem.inputJustDown("cima")) {
    this.puloBufferAte = agora + this.janelaBufferPulo;
  }

  const forcaQuiqueChao = this.personagem.ultimoImpacto?.quiqueChaoY;
  if (
    body?.blocked.down &&
    forcaQuiqueChao > 0 &&
    !this.quiqueChaoAplicado
  ) {
    this.quiqueChaoAplicado = true;
    body.setVelocityY(-forcaQuiqueChao);
  }

  // DESACELERAÇÃO DO KNOCKBACK
  // Preserva a sensação original: o lançamento começa forte e
  // perde velocidade horizontal progressivamente, sem zerar do nada.
  if (body) {
    const delta = Math.max(this.personagem.scene.game.loop.delta, 1);
    const freioPorFrame = Math.pow(0.965, delta / (1000 / 60));
    body.setVelocityX(body.velocity.x * freioPorFrame);
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

    // Executa o pulo guardado assim que o controle volta no ar.
    const p = this.personagem;
    const puloSolicitado =
      agora <= this.puloBufferAte ||
      p.inputDown("cima");

    if (
      puloSolicitado &&
      body &&
      !body.blocked.down &&
      p.pulos < p.maxPulos
    ) {
      this.puloBufferAte = 0;
      p.isTumbling = false;
      p.pular();
      return;
    }
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
  this.modoHorizontalAtivo = false;
  this.puloBufferAte = 0;
  this.quiqueChaoAplicado = false;
}
}
