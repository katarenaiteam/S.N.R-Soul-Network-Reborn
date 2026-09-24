import EstadoBase from "./EstadoBase.js";

const JANELA_PARRY_MS = 120;
const DURACAO_DEFESA_AEREA_MS = 300;
const BLOQUEIO_MOVIMENTO_PARRY_MS = 400;
const VELOCIDADE_MAXIMA_QUEDA_GUARD = 120;

export default class EstadoGuard extends EstadoBase {
  enter() {
    const agora = this.personagem.scene.time.now;

    // 1. IMPEDE DE ENTRAR se estiver em Cooldown (carimbo de tempo do Personagem)
    // OU se o escudo estiver com vida zerada
    if (agora < this.personagem.tempoLiberacaoGuard || this.personagem.vidaGuard <= 0) {
      this.sairParaEstadoPadrao();
      return;
    }

    this.aerea = !this.personagem.sprite.body.blocked.down;
    this.fimParry = agora + (this.aerea ? DURACAO_DEFESA_AEREA_MS : JANELA_PARRY_MS);
    this.parryHabilitado = this.personagem.inputJustDown("guard");

    // A defesa aerea freia a queda sem interromper a subida do salto.
    this.personagem.tocarAnimacao("guard");
    if (!this.aerea) this.personagem.sprite.setVelocityX(0);
    else if (this.personagem.sprite.body.velocity.y > 0) {
      this.personagem.sprite.setVelocityY(Math.min(
        this.personagem.sprite.body.velocity.y * 0.25,
        VELOCIDADE_MAXIMA_QUEDA_GUARD,
      ));
    }

    this.personagem.atualizarEfeitoGuard();

  }

  execute() {
    if (!this.defesaAtiva()) {
      this.sairParaEstadoPadrao();
      return;
    }
    if (this.aerea && this.personagem.sprite.body.velocity.y > VELOCIDADE_MAXIMA_QUEDA_GUARD) {
      this.personagem.sprite.setVelocityY(VELOCIDADE_MAXIMA_QUEDA_GUARD);
    }
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
    if (!this.aerea && this.personagem.sprite.body) {
      this.personagem.sprite.body.setVelocityX(
        this.personagem.sprite.body.velocity.x * 0.8
      );
    }

  }

  defesaAtiva() {
    if (!this.personagem.inputDown("guard")) return false;
    if (this.aerea) return this.personagem.scene.time.now < this.fimParry;
    return this.personagem.sprite.body.blocked.down;
  }

  tentarParry(atacante) {
    if (!this.parryHabilitado || !this.defesaAtiva() ||
        this.personagem.scene.time.now >= this.fimParry) return false;

    atacante?.bloquearMovimentoParry?.(BLOQUEIO_MOVIMENTO_PARRY_MS);
    return true;
  }

  exit() {
    // A animacao vermelha da quebra deve terminar mesmo depois da guarda.
    if (this.personagem.vidaGuard > 0) {
      this.personagem.vfx.destruirEfeito(this.personagem.efeitoGuard);
      this.personagem.efeitoGuard = null;
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
