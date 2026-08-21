import EstadoBase from "./EstadoBase.js";

export default class EstadoSpecial extends EstadoBase {
  enter(dados = {}) {
    const noChao = this.personagem.sprite.body.blocked.down;
    const direcaoOlhar = this.personagem.sprite.flipX ? -1 : 1;

    let tipoSpecial = dados?.tipo;

    // Se não veio tipo nos dados, descobre pelas direções
    if (!tipoSpecial) {
      const apertandoCima = this.personagem.inputDown("cima");
      const apertandoBaixo = this.personagem.inputDown("baixo");
      const apertandoLado =
        this.personagem.inputDown("esquerda") ||
        this.personagem.inputDown("direita");

      if (noChao) {
        if (apertandoBaixo) tipoSpecial = "agachado";
        else if (apertandoCima) tipoSpecial = "cima";
        else if (apertandoLado) tipoSpecial = "lado";
        else tipoSpecial = "neutro";
      } else {
        if (apertandoBaixo) tipoSpecial = "air_agachado";
        else if (apertandoCima) tipoSpecial = "air_cima";
        else if (apertandoLado) tipoSpecial = "air_lado";
        else tipoSpecial = "air_neutro";
      }
    }

    // NUNCA faz fallback para "neutro" se a chave for agachado e existir no objeto
    let tipoSpecialEfetivo = tipoSpecial;
    if (!this.personagem.specials?.[tipoSpecialEfetivo]) {
      tipoSpecialEfetivo = "neutro";
    }

    this.specialAtual = this.personagem.specials?.[tipoSpecialEfetivo];
    this.tipoSpecialAtual = tipoSpecialEfetivo;

    // Valida permissão de uso da chave correta
    if (
      !this.specialAtual ||
      !this.personagem.podeUsarSpecial(tipoSpecialEfetivo)
    ) {
      this.finalizarSpecial();
      return;
    }

    this.tempoInicio = this.personagem.scene.time.now;
    this.timerFinalizacaoChao = null;
    this.finalizandoPorChao = false;
    this.timerFinalizacaoAcerto = null;
    this.finalizandoPorAcerto = false;

    // Inicia Cooldown especificamente da chave resolvida
    this.personagem.iniciarCooldownSpecial(tipoSpecialEfetivo);

    // ===================================
    // GRAVIDADE E IMPULSOS (EXPORTADO DO ATAQUE)
    // ===================================
    if (this.specialAtual?.propriedades?.anularGravidade) {
      this.anulouGravidade = true;
      this.personagem.sprite.body.setAllowGravity(false);
      this.personagem.sprite.body.setVelocityY(0);
    } else {
      this.anulouGravidade = false;
    }

    if (this.specialAtual?.propriedades?.impulsoX) {
      this.personagem.sprite.setVelocityX(
        direcaoOlhar * this.specialAtual.propriedades.impulsoX
      );
    } else if (noChao) {
      this.personagem.sprite.setVelocityX(0);
    }

    if (this.specialAtual?.propriedades?.impulsoY) {
      this.personagem.sprite.setVelocityY(
        this.specialAtual.propriedades.impulsoY
      );
    }

    // ANIMAÇÃO
    const animChave = this.specialAtual?.animacao;

    if (animChave && this.personagem.scene.anims.exists(animChave)) {
      this.personagem.sprite.anims.play(animChave, true);
    } else {
      console.warn(`Animação ${animChave} não existe!`);
    }
  }

  execute() {
    const noChao = this.personagem.sprite.body.blocked.down;
    const agora = this.personagem.scene.time.now;
    const tempoDecorrido = agora - this.tempoInicio;

    // ===================================
    // INSTANCIA A LÓGICA DO ESPECIAL
    // ===================================
    if (this.specialAtual?.logica && !this.logicaSpecial) {
      const LogicaSpecial = this.specialAtual.logica;

      this.logicaSpecial = new LogicaSpecial(
        this.personagem,
        this.specialAtual,
        this
      );

      this.logicaSpecial.executar();
      this.personagem.logicasEspeciaisAtivas.push(this.logicaSpecial);
    }

    // ===================================
    // FINALIZAÇÃO POR DURAÇÃO
    // ===================================
    if (
      this.specialAtual?.duracao !== undefined &&
      tempoDecorrido >= this.specialAtual.duracao
    ) {
      this.finalizarSpecial();
      return;
    }

    // ===================================
    // FINALIZAÇÃO AO TOCAR O CHÃO
    // ===================================
    if (
      this.specialAtual?.finalizarAoTocarChao &&
      noChao &&
      !this.finalizandoPorChao
    ) {
      this.finalizandoPorChao = true;
      const atraso = this.specialAtual.atrasoFinalizacaoChao ?? 0;

      this.timerFinalizacaoChao = this.personagem.scene.time.delayedCall(
        atraso,
        () => {
          if (this.personagem.maquinaEstados.estadoAtual === this) {
            this.finalizarSpecial();
          }
        }
      );
    }

    // ===================================
    // MOVIMENTAÇÃO LATERAL NO AR (CASO NÃO TENHA IMPULSO X FIXO)
    // ===================================
    if (
      !noChao &&
      !this.specialAtual?.propriedades?.impulsoX &&
      !this.specialAtual?.propriedades?.travarMovimentoAir
    ) {
      const vel = this.personagem.velocidade;

      if (this.personagem.inputDown("esquerda")) {
        this.personagem.sprite.setVelocityX(-vel);
      } else if (this.personagem.inputDown("direita")) {
        this.personagem.sprite.setVelocityX(vel);
      }
    }
  }

  // Permite que a classe do Projétil (ex: AirWebShot) avise quando o tiro acertou
  notificarAcerto() {
    if (
      this.specialAtual?.finalizarAoAcertarOponente &&
      !this.finalizandoPorAcerto
    ) {
      this.finalizandoPorAcerto = true;
      const atraso = this.specialAtual.atrasoFinalizacaoAcerto ?? 0;

      this.timerFinalizacaoAcerto = this.personagem.scene.time.delayedCall(
        atraso,
        () => {
          if (this.personagem.maquinaEstados.estadoAtual === this) {
            this.finalizarSpecial();
          }
        }
      );
    }
  }

  finalizarSpecial() {
    if (this.personagem.sprite.body.blocked.down) {
      this.personagem.maquinaEstados.mudarEstado("idle");
    } else {
      this.personagem.maquinaEstados.mudarEstado("jump");
    }
  }

  exit() {
    // Restaura a gravidade se ela tiver sido anulada
    if (this.anulouGravidade) {
      this.personagem.sprite.body.setAllowGravity(true);
      this.anulouGravidade = false;
    }

    // Limpeza de timers
    if (this.timerFinalizacaoChao) {
      this.timerFinalizacaoChao.remove(false);
      this.timerFinalizacaoChao = null;
    }
    this.finalizandoPorChao = false;

    if (this.timerFinalizacaoAcerto) {
      this.timerFinalizacaoAcerto.remove(false);
      this.timerFinalizacaoAcerto = null;
    }
    this.finalizandoPorAcerto = false;

    this.logicaSpecial = null;
  }
}