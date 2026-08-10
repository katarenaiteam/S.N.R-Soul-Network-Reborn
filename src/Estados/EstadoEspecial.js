import EstadoBase from "./EstadoBase.js";

export default class EstadoSpecial extends EstadoBase {
  enter(dados = {}) {
    let tipoSpecial = dados?.tipo;

    // Descobre a direção
    if (!tipoSpecial) {
      const esquerda = this.personagem.inputDown("esquerda");
      const direita = this.personagem.inputDown("direita");
      const cima = this.personagem.inputDown("cima");
      const baixo = this.personagem.inputDown("baixo");

      if (cima) {
        tipoSpecial = "cima";
      } else if (baixo) {
        tipoSpecial = "baixo";
      } else if (esquerda || direita) {
        tipoSpecial = "lado";
      } else {
        tipoSpecial = "neutro";
      }
    }

    this.tipoSpecial = tipoSpecial;

    // PEGA O SPECIAL DA TABELA
    this.specialAtual = this.personagem.specials?.[tipoSpecial];

    if (!this.specialAtual) {
      console.warn(`Special "${tipoSpecial}" não existe!`);
      this.finalizarSpecial();
      return;
    }

    console.log("Special:", tipoSpecial);
    console.log("Dados:", this.specialAtual);
  }

  execute() {}

  exit() {}

  finalizarSpecial() {
    if (this.personagem.sprite.body.blocked.down) {
      this.personagem.maquinaEstados.mudarEstado("idle");
    } else {
      this.personagem.maquinaEstados.mudarEstado("jump");
    }
  }
}
