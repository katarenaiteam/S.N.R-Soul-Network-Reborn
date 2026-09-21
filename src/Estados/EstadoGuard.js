import EstadoBase from "./EstadoBase.js";

export default class EstadoGuard extends EstadoBase {
  enter() {
    const agora = this.personagem.scene.time.now;

    // 1. IMPEDE DE ENTRAR se estiver em Cooldown (carimbo de tempo do Personagem)
    // OU se o escudo estiver com vida zerada
    if (agora < this.personagem.tempoLiberacaoGuard || this.personagem.vidaGuard <= 0) {
      this.sairParaEstadoPadrao();
      return;
    }

    // 2. Trava movimento e toca animação
    this.personagem.tocarAnimacao("guard");
    this.personagem.sprite.setVelocityX(0);

  }

  execute() {
    // A) Se o escudo zerou (foi quebrado via receberDano), sai imediatamente
    if (this.personagem.vidaGuard <= 0) {
      this.sairParaEstadoPadrao();
      return;
    }

    // B) Se soltou o botão de defesa, sai da guarda
    const segurandoGuard = this.personagem.inputDown("guard");
    if (!segurandoGuard) {
      this.sairParaEstadoPadrao();
      return;
    }

    // C) Freia o recuo causado pelo impacto de golpes no escudo
    if (this.personagem.sprite.body) {
      this.personagem.sprite.body.setVelocityX(
        this.personagem.sprite.body.velocity.x * 0.8
      );
    }

  }

  sairParaEstadoPadrao() {
    if (this.personagem.sprite.body.blocked.down) {
      this.personagem.maquinaEstados.mudarEstado("idle");
    } else {
      this.personagem.maquinaEstados.mudarEstado("jump");
    }
  }

}
