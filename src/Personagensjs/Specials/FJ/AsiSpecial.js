import SiSpecial from "./SiSpecial.js";

const PAUSA_CAPTURA = 250;
const VELOCIDADE_AVANCO = 550;
const DURACAO_AVANCO = 500;
const TEMPO_ACELERACAO = 120;
const VELOCIDADE_SAIDA = 250;
const VELOCIDADE_QUEDA = 65;

export default class AsiSpecial extends SiSpecial {
  executar() {
    this.gravidadeOriginal = this.personagem.sprite.body.allowGravity;
    this.personagem.sprite.body.setAllowGravity(false);
    this.personagem.sprite.setVelocityY(0);
    super.executar();
    this.personagem.sprite.setVelocityX(0);
  }

  aoFrame(anim, frame) {
    if (this.finalizado) return;
    if (anim.key === "fj_AsiSpecial" && this.fase === "avanco") {
      const indice = Number(frame.textureFrame);
      if (indice >= 1 && indice <= 4) this.criarHitbox();
      else this.destruirHitbox();
    }
    // O golpe descendente ocorre no quadro 5 (contando do zero).
    if (anim.key === "fj_Agrab" && Number(frame.textureFrame) === 5) this.lancarAlvo();
  }

  capturar(alvo) {
    super.capturar(alvo);
    if (this.alvo !== alvo || this.fase !== "pausa") return;
    this.personagem.sprite.body.setAllowGravity(false);
    this.personagem.sprite.setVelocity(0, VELOCIDADE_QUEDA);
  }

  atualizar() {
    if (this.finalizado) return;
    const sprite = this.personagem.sprite;
    if (!sprite?.active || this.personagem.maquinaEstados.estadoAtual !== this.estado ||
        (this.alvo && (!this.alvo.sprite?.active || this.alvo.maquinaEstados.estadoAtual !== this.estadoAlvo))) {
      this.finalizar();
      return;
    }
    if (this.fase === "avanco") {
      const tempo = Math.max(0, this.scene.time.now - this.inicio);
      const acelerando = tempo < TEMPO_ACELERACAO;
      const progresso = Math.min(1, acelerando
        ? tempo / TEMPO_ACELERACAO
        : (tempo - TEMPO_ACELERACAO) / (DURACAO_AVANCO - TEMPO_ACELERACAO));
      // Desacelera ate a velocidade de saida, preservando a inercia do pulo.
      const curva = progresso * progresso * (3 - 2 * progresso);
      const velocidade = acelerando
        ? VELOCIDADE_AVANCO * curva
        : VELOCIDADE_AVANCO + (VELOCIDADE_SAIDA - VELOCIDADE_AVANCO) * curva;
      sprite.setVelocityX(velocidade * this.direcao);
      sprite.setVelocityY(0);
      this.posicionarHitbox();
      if (tempo >= DURACAO_AVANCO) {
        this.fase = "recuperacao";
        this.destruirHitbox();
        sprite.body.setAllowGravity(this.gravidadeOriginal);
      }
    } else if (this.fase !== "recuperacao") {
      sprite.setVelocityX(0);
      if (this.fase === "pausa") {
        sprite.setVelocityY(VELOCIDADE_QUEDA);
        if (this.scene.time.now - this.inicioPausa >= PAUSA_CAPTURA) {
          this.fase = "grab";
          sprite.body.setAllowGravity(this.gravidadeOriginal);
          sprite.anims.resume();
          this.personagem.tocarAnimacao("Agrab", true);
        }
      }
      this.posicionarAlvo();
    }
  }

  aoFim(anim) {
    if (this.finalizado) return;
    if ((anim.key === "fj_AsiSpecial" && ["avanco", "recuperacao"].includes(this.fase)) ||
        (anim.key === "fj_Agrab" && this.fase === "grab")) this.finalizar();
  }

  finalizar() {
    if (this.finalizado) return;
    if (!["avanco", "recuperacao"].includes(this.fase)) {
      super.finalizar();
      return;
    }
    // Ao errar, devolve o controle ao pulo sem zerar a velocidade do corpo.
    this.cancelar();
    if (this.personagem.sprite?.active && this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
  }

  cancelar() {
    if (this.finalizado) return;
    const sprite = this.personagem.sprite;
    if (sprite?.body) sprite.body.setAllowGravity(this.gravidadeOriginal);
    if (sprite.anims?.currentAnim?.key === "fj_AsiSpecial" && sprite.anims.isPaused) sprite.anims.resume();
    super.cancelar();
  }
}
