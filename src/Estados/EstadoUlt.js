import EstadoBase from "./EstadoBase.js";

export default class EstadoUlt extends EstadoBase {
  enter(dados = {}) {
    this.ultAtual = this.personagem.ult;

    // Se o personagem não tiver ult definida, ignora e volta pro idle
    if (!this.ultAtual) {
      this.finalizarUlt();
      return;
    }

    const direcaoOlhar = this.personagem.sprite.flipX ? -1 : 1;
    this.tempoInicio = this.personagem.scene.time.now;

    // Trava movimentação e botões padrão do personagem
    this.personagem.podeMover = false;
    this.personagem.podeAtacar = false;

    // Anular gravidade se configurado
    if (this.ultAtual?.propriedades?.anularGravidade) {
      this.anulouGravidade = true;
      this.personagem.sprite.body.setAllowGravity(false);
      this.personagem.sprite.body.setVelocity(0, 0);
    } else {
      this.anulouGravidade = false;
    }

    // Toca a animação da Ult definida na ficha do personagem
    const animChave = this.ultAtual?.animacao;
    if (animChave && this.personagem.scene.anims.exists(animChave)) {
      this.personagem.sprite.anims.play(animChave, true);
    }

    // Instancia a lógica específica (SpiderUlt ou a Ult de qualquer outro boneco)
    if (this.ultAtual?.logica && !this.logicaUlt) {
      const LogicaUlt = this.ultAtual.logica;
      this.logicaUlt = new LogicaUlt(this.personagem, this.ultAtual, this);
      this.logicaUlt.executar();
    }
  }

  execute() {
    // Repassa o ciclo de update para a classe de lógica (se ela possuir método atualizar)
    if (this.logicaUlt && typeof this.logicaUlt.atualizar === "function") {
      this.logicaUlt.atualizar();
    }
  }

  finalizarUlt() {
    this.personagem.podeMover = true;
    this.personagem.podeAtacar = true;

    if (this.personagem.sprite.body.blocked.down) {
      this.personagem.maquinaEstados.mudarEstado("idle");
    } else {
      this.personagem.maquinaEstados.mudarEstado("jump");
    }
  }

  exit() {
    if (this.logicaUlt && typeof this.logicaUlt.cancelar === "function") {
      this.logicaUlt.cancelar();
    }

    if (this.anulouGravidade) {
      this.personagem.sprite.body.setAllowGravity(true);
      this.anulouGravidade = false;
    }

    this.logicaUlt = null;
  }
}