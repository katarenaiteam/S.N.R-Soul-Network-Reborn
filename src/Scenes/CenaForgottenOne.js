import CenaPrincipal from "./CenaPrincipal.js";
import ForgottenOne from "../Mapasjs/ForgottenOne.js";

export default class CenaForgottenOne extends CenaPrincipal {
  constructor() {
    super();
    this.sys.settings.key = "CenaForgottenOne";
  }

  init(dados = {}) {
    super.init({ ...dados, p2: "Ken", ClasseMapa: ForgottenOne });
  }

  create() {
    super.create();
    this.introPartida?.finalizar();
    this.mapaAtual.configurarOponente(this.jogador2, this.hudP2_Nome);
    this.mapaAtual.esconderIndicador(this.indicadorP2);
    this.camHUD.ignore(this.mapaAtual.objetosVisuais);
    this.atualizarTextoTempoVersus = () => this.textoTempoVersus?.setVisible(false);
    this.podeFinalizarPartidaPorTempo = () => false;
  }

  update(time, delta) {
    this.mapaAtual?.atualizar(delta);
    super.update(time, delta);
    this.textoTempoVersus?.setVisible(false);
  }
}
