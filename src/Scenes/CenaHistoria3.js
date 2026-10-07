import CenaHistoria from "./CenaHistoria.js";
import SlenderMap from "../Mapasjs/SlenderMap.js";
import Slenderman_IA from "../Objetos/Slenderman_IA.js";

export default class CenaHistoria3 extends CenaHistoria {
  constructor() {
    super("CenaHistoria3");
  }

  obterNomeBoss() {
    return "Slenderman";
  }

  criarMapaHistoria() {
    return new SlenderMap(this);
  }

  criarIAHistoria(controller) {
    this.slendermanIA = new Slenderman_IA(controller);
    return this.slendermanIA;
  }

  iniciarAberturaHistoria() {
    this.iniciarIntroPartida();
  }

  aoVencerHistoria() {}
}
