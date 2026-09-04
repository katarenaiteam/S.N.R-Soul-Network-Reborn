import EstadoBase from "./EstadoBase.js";

export default class EstadoTaunt extends EstadoBase {
  enter(dados = {}) {
    this.timerDelay = null;
    this.personagem.sprite.setVelocityX(0);

    // 1. Determina qual taunt tocar
    let nomeAnim = "taunt";

    if (dados.tipo) {
      nomeAnim = dados.tipo;
    } else if (Array.isArray(this.personagem.taunts) && this.personagem.taunts.length > 0) {
      const indice = Math.floor(Math.random() * this.personagem.taunts.length);
      nomeAnim = this.personagem.taunts[indice];
    } else if (this.personagem.qtdTaunts && this.personagem.qtdTaunts >= 1) { // 👈 AJUSTADO AQUI (>= 1)
      const indice = Math.floor(Math.random() * this.personagem.qtdTaunts) + 1;
      nomeAnim = `taunt${indice}`;
    }

    // 2. Executa a animação
    this.personagem.tocarAnimacao(nomeAnim);
    this.animChaveAtual = `${this.personagem.prefixoAnim}${nomeAnim}`;

    // 3. Verifica no Phaser se a animação é infinita (loop) ou finita
    const animData = this.personagem.scene.anims.get(this.animChaveAtual);
    this.isLooping = animData && animData.repeat === -1;

    // TIPO 1: Animação Finita -> Aguarda terminar e aplica os 500ms
    if (!this.isLooping) {
      this.personagem.sprite.once(
        `animationcomplete-${this.animChaveAtual}`,
        this.finalizarTaunt,
        this
      );
    }
    // TIPO 2: Animação em Loop (ex: Homem-Aranha) -> Não registra o 'animationcomplete'.
    // Ela continua rodando indefinidamente até que um input do jogador acione o execute().
  }

  execute() {
    this.personagem.sprite.setVelocityX(0);

    // Ambos os tipos podem ser cancelados a qualquer instante pressionando comandos
    if (this.verificarInputsAtivos()) {
      return;
    }
  }

  verificarInputsAtivos() {
    const inputs = ["esquerda", "direita", "cima", "baixo", "atack", "special", "dash", "guard"];

    for (const inputKey of inputs) {
      if (this.personagem.inputJustDown(inputKey) || this.personagem.inputDown(inputKey)) {
        
        // Ações imediatas
        if (this.personagem.inputJustDown("cima")) {
          this.personagem.pular();
          return true;
        }

        if (this.personagem.inputJustDown("dash") && this.personagem.podeDash) {
          this.personagem.maquinaEstados.mudarEstado("dash");
          return true;
        }

        if (this.personagem.inputJustDown("atack")) {
          this.personagem.maquinaEstados.mudarEstado("atack");
          return true;
        }

        if (this.personagem.inputJustDown("special")) {
          const tipoSpecial = this.personagem.obterTipoSpecial();
          if (this.personagem.podeUsarSpecial(tipoSpecial)) {
            this.personagem.maquinaEstados.mudarEstado("special", { tipo: tipoSpecial });
          }
          return true;
        }

        // Direcionais/Abaixar
        if (this.personagem.inputDown("baixo")) {
          this.personagem.maquinaEstados.mudarEstado("crouch");
          return true;
        }

        if (this.personagem.inputDown("esquerda") || this.personagem.inputDown("direita")) {
          this.personagem.maquinaEstados.mudarEstado("walk");
          return true;
        }

        // Qualquer outro botão reseta para o idle
        this.personagem.maquinaEstados.mudarEstado("idle");
        return true;
      }
    }

    return false;
  }

  finalizarTaunt() {
    if (this.personagem.maquinaEstados.estadoAtual !== this) return;

    // Aguarda os 500ms fixos após o término do taunt finito antes de voltar ao idle
    this.timerDelay = this.personagem.scene.time.delayedCall(500, () => {
      if (this.personagem.maquinaEstados.estadoAtual === this) {
        this.personagem.maquinaEstados.mudarEstado("idle");
      }
    });
  }

  exit() {
    // Limpa ouvintes e timers para evitar vazamentos de memória ou transições incorretas
    if (this.animChaveAtual) {
      this.personagem.sprite.off(
        `animationcomplete-${this.animChaveAtual}`,
        this.finalizarTaunt,
        this
      );
    }

    if (this.timerDelay) {
      this.timerDelay.remove(false);
      this.timerDelay = null;
    }
  }
}
