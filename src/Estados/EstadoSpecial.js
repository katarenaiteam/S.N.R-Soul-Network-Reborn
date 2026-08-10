import EstadoBase from "./EstadoBase.js";
import WebShot from "../Personagensjs/Specials/Spiderman/WebShot.js";

export default class EstadoSpecial extends EstadoBase {
  enter(dados = {}) {

    let tipoSpecial = dados?.tipo;

    // Descobre o special pela direção
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
    this.tempoInicio = this.personagem.scene.time.now;

    // Pega o special na tabela do personagem
    this.specialAtual = this.personagem.specials?.[tipoSpecial];

    if (!this.specialAtual) {
      console.warn(`Special "${tipoSpecial}" não existe!`);
      this.finalizarSpecial();
      return;
    }

    console.log("Special:", this.tipoSpecial);
    console.log("Dados:", this.specialAtual);

    // =========================
// ANIMAÇÃO
// =========================

const animChave = this.specialAtual?.animacao;

if (animChave && this.personagem.scene.anims.exists(animChave)) {

  this.personagem.tocarAnimacao("special");

  this.personagem.sprite.anims.play(animChave, true);

} else {
  console.warn(`Animação ${animChave} não existe!`);
}
  }

  execute() {

       const agora = this.personagem.scene.time.now;

  if (
    this.specialAtual?.duracao !== undefined &&
    agora - this.tempoInicio >= this.specialAtual.duracao
  ) {
    this.finalizarSpecial();
    return;
  }


// executar homem aranha 
   if (
  this.personagem.nomePersonagem === "Homem Aranha" &&
  this.tipoSpecial === "neutro"
) {
  this.logicaSpecial = new WebShot(
    this.personagem,
    this.specialAtual
  );

  this.logicaSpecial.executar();
}


  }

  finalizarSpecial() {
    if (this.personagem.sprite.body.blocked.down) {
      this.personagem.maquinaEstados.mudarEstado("idle");
    } else {
      this.personagem.maquinaEstados.mudarEstado("jump");
    }
  }

  exit() {}
}