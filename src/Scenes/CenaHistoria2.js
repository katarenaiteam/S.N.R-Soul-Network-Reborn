import CenaHistoria from "./CenaHistoria.js";
import Ice from "../Mapasjs/Ice.js";
import Pingu_IA from "../Objetos/Pingu_IA.js";
import DialogoHistoria from "../Objetos/DialogoHistoria.js";
import CutsceneFinalHistoriaPingu from "../Objetos/CutsceneFinalHistoriaPingu.js";

const FALAS_PINGU = [
  { personagem: "Pingu", retrato: "Pg_ok", texto: "NOOT NOOT!" },
  { personagem: "FJ", retrato: "FJ_N", texto: "Ah, sim. É fascinante como você consegue transmitir ideias tão complexas com um vocabulário tão limitado." },
  { personagem: "Pingu", retrato: "Pg_N", texto: "Noot?" },
  { personagem: "FJ", retrato: "FJ_N", texto: "E mais fascinante ainda é o fato de que eu consigo compreender cada palavra. Uma verdadeira quebra das convenções narrativas." },
  { personagem: "Pingu", retrato: "Pg_mid", texto: "NOOT NOOT!" },
  { personagem: "FJ", retrato: "FJ_N", texto: "Exatamente! E o mais genial é que o público também sabe que isso não faz sentido. É metalinguagem em seu estado mais puro." },
  { personagem: "Pingu", retrato: "Pg_N", texto: "Noot..." },
  { personagem: "FJ", retrato: "FJ_N", texto: "De fato. Quem concebeu essa piada deve ser um gênio incompreendido. Talvez o maior roteirista da nossa geração." },
];

export default class CenaHistoria2 extends CenaHistoria {
  constructor() {
    super("CenaHistoria2");
  }

  obterNomeBoss() {
    return "Pingu";
  }

  criarMapaHistoria() {
    return new Ice(this);
  }

  criarIAHistoria(controller) {
    this.pinguIA = new Pingu_IA(controller);
    return this.pinguIA;
  }

  iniciarAberturaHistoria() {
    this.dialogoHistoria = new DialogoHistoria(this, () => {
      this.dialogoHistoria = null;
      this.iniciarIntroPartida();
    }, { falas: FALAS_PINGU });
  }

  aoVencerHistoria() {
    this.mapaAtual.musica?.stop();
    this.cutsceneFinalHistoria = new CutsceneFinalHistoriaPingu(this);
  }

  aoPerderHistoria() {
    if (!this.boss?.sprite?.active) {
      super.aoPerderHistoria();
      return;
    }
    this.boss.maquinaEstados.mudarEstado("taunt");
    this.time.delayedCall(2200, () => {
      super.aoPerderHistoria();
    });
  }

  processarQueda(jogador, spawn) {
    if (jogador !== this.boss) this.pinguIA?.provocarAposBaixa();
    super.processarQueda(jogador, spawn);
  }
}
