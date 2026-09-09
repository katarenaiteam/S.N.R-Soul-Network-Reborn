import EstadoBase from "./EstadoBase.js";

export default class EstadoUlt extends EstadoBase {

  // ============================================================
  // VERIFICA SE PODE ENTRAR NA ULT
  // ============================================================

  podeEntrar() {

  const scene =
    this.personagem.scene;


  // Personagem nem possui Ult.
  if (!this.personagem.ult) {
    return false;
  }


  // ============================================================
  // BARRA PRECISA ESTAR CHEIA
  // ============================================================

  if (
    !this.personagem.ultEstaCarregada()
  ) {
    return false;
  }


  // ============================================================
  // NÃO PODE TER OUTRA ULT RODANDO
  // ============================================================

  if (
    scene.ultEmAndamento &&
    scene.ultEmAndamento !==
      this.personagem
  ) {
    return false;
  }


  return true;
}


  // ============================================================
  // ENTRA NA ULT
  // ============================================================

  enter(dados = {}) {
    this.ultAtual = this.personagem.ult;

    if (!this.ultAtual) {
      this.finalizarUlt();
      return;
    }

    const scene = this.personagem.scene;

    // ============================================================
    // RESERVA A ULT PARA ESTE PERSONAGEM
    // ============================================================

    scene.ultEmAndamento = this.personagem;

    this.possuiBloqueioUlt = true;

    this.personagem.consumirUlt();


    this.tempoInicio =
      scene.time.now;


    // ============================================================
    // TRAVA CONTROLES NORMAIS
    // ============================================================

    this.personagem.podeMover = false;
    this.personagem.podeAtacar = false;


    // ============================================================
    // GRAVIDADE
    // ============================================================

    if (
      this.ultAtual?.propriedades?.anularGravidade
    ) {
      this.anulouGravidade = true;

      this.personagem.sprite.body.setAllowGravity(
        false
      );

      this.personagem.sprite.body.setVelocity(
        0,
        0
      );

    } else {

      this.anulouGravidade = false;
    }


    // ============================================================
    // ANIMAÇÃO INICIAL
    // ============================================================

    const animChave =
      this.ultAtual?.animacao;

    if (
      animChave &&
      scene.anims.exists(animChave)
    ) {
      this.personagem.sprite.anims.play(
        animChave,
        true
      );
    }


    // ============================================================
    // LÓGICA ESPECÍFICA
    // ============================================================

    if (
      this.ultAtual?.logica &&
      !this.logicaUlt
    ) {

      const LogicaUlt =
        this.ultAtual.logica;

      this.logicaUlt =
        new LogicaUlt(
          this.personagem,
          this.ultAtual,
          this
        );

      this.logicaUlt.executar();
    }
  }


  // ============================================================
  // UPDATE
  // ============================================================

  execute() {
    if (
      this.logicaUlt &&
      typeof this.logicaUlt.atualizar === "function"
    ) {
      this.logicaUlt.atualizar();
    }
  }


  // ============================================================
  // FINALIZA
  // ============================================================

  finalizarUlt() {
    this.personagem.podeMover = true;
    this.personagem.podeAtacar = true;

    if (
      this.personagem.sprite.body.blocked.down
    ) {
      this.personagem.maquinaEstados.mudarEstado(
        "idle"
      );
    } else {
      this.personagem.maquinaEstados.mudarEstado(
        "jump"
      );
    }
  }


  // ============================================================
  // SAI DA ULT
  // ============================================================

  exit() {
    const scene =
      this.personagem.scene;


    // ============================================================
    // CANCELA LÓGICA DA ULT
    // ============================================================

    if (
      this.logicaUlt &&
      typeof this.logicaUlt.cancelar === "function"
    ) {
      this.logicaUlt.cancelar();
    }


    // ============================================================
    // RESTAURA GRAVIDADE
    // ============================================================

    if (this.anulouGravidade) {

      this.personagem.sprite.body.setAllowGravity(
        true
      );

      this.anulouGravidade = false;
    }


    this.logicaUlt = null;


    // ============================================================
    // LIBERA A ULT GLOBAL
    // ============================================================

    /*
      MUITO IMPORTANTE:

      só libera se ESTE personagem for realmente
      o dono da Ult ativa.

      Assim um personagem bloqueado nunca consegue
      apagar o lock de outra pessoa.
    */

    if (
      this.possuiBloqueioUlt &&
      scene.ultEmAndamento === this.personagem
    ) {
      scene.ultEmAndamento = null;
    }

    this.possuiBloqueioUlt = false;
  }
}