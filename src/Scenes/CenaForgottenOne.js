import CenaPrincipal from "./CenaPrincipal.js";
import ForgottenOne from "../Mapasjs/ForgottenOne.js";

export default class CenaForgottenOne extends CenaPrincipal {
  constructor() {
    super();
    this.sys.settings.key = "CenaForgottenOne";
  }

  init(dados = {}) {
    this.numPlayersForgotten = Number(dados.numPlayers) === 2 ? 2 : 1;
    super.init({
      ...dados,
      p2: this.numPlayersForgotten === 2 ? (dados.p2 || "Ken") : "Ken",
      ClasseMapa: ForgottenOne,
    });
  }

  create() {
    super.create();
    this.introPartida?.finalizar();
    if (this.numPlayersForgotten === 2) {
      this.bossControlador = this.criarPersonagem(
        "Ken", 960, 760, null, 600, 600, null,
      );
      this.bossControlador.sprite.setVisible(false);
      this.bossControlador.sprite.body.enable = false;
      this.bossControlador.sprite.body.setAllowGravity(false);
      this.mapaAtual.configurarOponente(this.bossControlador, null);
    } else {
      this.bossControlador = this.jogador2;
      this.mapaAtual.configurarOponente(this.bossControlador, this.hudP2_Nome);
      this.bossControlador.sprite.body.enable = false;
      this.mapaAtual.esconderIndicador(this.indicadorP2);
    }
    this.mortesVS.aoConcluirMortes = (lote) => this.concluirMortesForgottenOne(lote);
    this.camHUD.ignore(this.mapaAtual.objetosVisuais);
    this.atualizarTextoTempoVersus = () => this.textoTempoVersus?.setVisible(false);
    this.podeFinalizarPartidaPorTempo = () => false;
  }

  update(time, delta) {
    this.mapaAtual?.atualizar(delta);
    if (this.mapaAtual?.bossDerrotado || this.saindoParaMenu) return;
    super.update(time, delta);
    this.textoTempoVersus?.setVisible(false);
  }

  concluirMortesForgottenOne(lote) {
    const jogadoresAtivos = this.numPlayersForgotten === 2
      ? [this.jogador1, this.jogador2]
      : [this.jogador1];
    const jogadorSemVidas = jogadoresAtivos.some((jogador) =>
      jogador === this.jogador1 ? this.vidasP1 <= 0 : this.vidasP2 <= 0,
    );
    if (jogadorSemVidas) {
      this.saindoParaMenu = true;
      this.partidaFinalizada = true;
      this.sound.stopAll();
      this.scene.start("CenaStart");
      return;
    }

    for (const { jogador, pontoRespawn, invulneravel } of lote) {
      if (!jogadoresAtivos.includes(jogador)) continue;
      jogador.emMorteVS = false;
      jogador.eliminado = false;
      jogador.invulneravel = invulneravel;
      jogador.sprite.setActive(true).setVisible(true);
      jogador.sprite.body.enable = true;
      jogador.sprite.body.setAllowGravity(true);
      this.respawnar(jogador, pontoRespawn);
    }
  }

  verificarMorte(jogador, pontoRespawn, numJogador) {
    if (this.numPlayersForgotten === 1 && (jogador === this.jogador2 || numJogador === 2)) return;
    super.verificarMorte(jogador, pontoRespawn, numJogador);
  }

  processarQueda(jogador, pontoRespawn, numJogador) {
    if (this.numPlayersForgotten === 1 && (jogador === this.jogador2 || numJogador === 2)) return;
    super.processarQueda(jogador, pontoRespawn, numJogador);
  }
}
