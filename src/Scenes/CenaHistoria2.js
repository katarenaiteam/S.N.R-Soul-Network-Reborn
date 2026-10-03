import CenaHistoria from "./CenaHistoria.js";
import Ice from "../Mapasjs/Ice.js";
import Pingu_IA from "../Objetos/Pingu_IA.js";
import DialogoHistoria from "../Objetos/DialogoHistoria.js";
import CutsceneFinalHistoriaPingu from "../Objetos/CutsceneFinalHistoriaPingu.js";

const FALAS_PINGU = [
  { personagem: "Pingu", retrato: "Pg_ok", texto: "NOOT NOOT!" },
  { personagem: "FJ", retrato: "FJ_N", texto: "Tipo... éh." },
  { personagem: "Pingu", retrato: "Pg_N", texto: "Noot?" },
  { personagem: "FJ", retrato: "FJ_N", texto: "Tipo... ahn?" },
  { personagem: "Pingu", retrato: "Pg_mid", texto: "... noot." },
  { personagem: "FJ", retrato: "FJ_N", texto: "Tipo, nada a haver!" },
  { personagem: "Pingu", retrato: "Pg_bad", texto: "..." },
  { personagem: "Pingu", retrato: "Pg_bad", texto: "Eu não sinto raiva de você. Eu só decidi que você não faz mais falta no mundo." },
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
    this.cutsceneFinalHistoria = new CutsceneFinalHistoriaPingu(this);
  }

  aoPerderHistoria() {
    if (!this.boss?.sprite?.active) {
      super.aoPerderHistoria();
      return;
    }
    this.boss.maquinaEstados.mudarEstado("taunt");
    this.time.delayedCall(2200, () => {
      this.sound.stopAll();
      this.scene.start("CenaGameOver");
    });
  }

  processarQueda(jogador, spawn) {
    if (jogador !== this.boss) this.pinguIA?.provocarAposBaixa();
    super.processarQueda(jogador, spawn);
  }
}
