import ClienteMQTT from "../Objetos/ClienteMQTT.js";

const ROTAS_ESPECTADOR = {
  "char-menu": "Charmenu",
  "selecao-mapa": "CenaSelecaoMapa",
  "preload-versus": "CenaPreloadVersus",
  partida: "cenaPrincipal",
};
const TEMPO_MAXIMO_ESTADO_MS = 30000;
const TEMPO_VALIDACAO_ESTADO_MS = 1500;

export default class CenaEspectador extends Phaser.Scene {
  constructor() {
    super({ key: "CenaEspectador" });
  }

  preload() {
    this.load.image("shop-icon", "assets/Loja/icones/shop.png");
    this.load.image("shop-miku-rain", "assets/Loja/icones/mikuRain-shop.png");
    this.load.image("puppet-shop", "assets/Loja/icones/puppet-shop.png"); 
    this.load.image("less-shop", "assets/Loja/icones/less-shop.png");
    this.load.image("Lup-shop", "assets/Loja/icones/Lup-shop.png");
    this.load.image("slen-shop", "assets/Loja/icones/slen-shop.png");
    this.load.image("1hit-shop", "assets/Loja/icones/1hit-shop.png");
    this.load.image("froze-shop", "assets/Loja/icones/froze-shop.png");
    this.load.image("lava-shop", "assets/Loja/icones/lava-shop.png");
    this.load.image("raio-shop", "assets/Loja/icones/raio-shop.png");
    this.load.image("ult-shop", "assets/Loja/icones/ult-shop.png");
    this.load.image("dead-shop", "assets/Loja/icones/dead-shop.png");

  }

  create() {
    const musicaMenu = this.registry.get("musicaMenu");
    musicaMenu?.stop();
    musicaMenu?.destroy();
    this.registry.set("musicaMenu", null);

    this.registry.set("modoEspectador", true);
    this.registry.set("assetsVersusEspectadorProntos", false);
    this.cenaReplicada = null;
    this.estadoAtual = null;
    this.estadoRecebido = null;
    this.estadoCandidato = null;
    this.expiracaoEstado = null;
    this.expiracaoCandidato = null;
    this.encerramentoPendente = null;
    this.salaEncontrada = false;

    this.cameras.main.setBackgroundColor("#000000");
    this.statusTexto = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      "CONECTANDO À SALA SNR...",
      {
        fontFamily: "RetroFont, monospace",
        fontSize: `${34 * (this.scale.width / 1920)}px`,
        color: "#8cffaa",
        align: "center",
      },
    ).setOrigin(0.5);

    this.mqtt = new ClienteMQTT(this.registry.get("mqttConfig"), "espectador");
    this.registry.set("clienteMQTT", this.mqtt);
    this.aoReceberEstado = (estado) => this.receberEstado(estado);
    this.mqtt.on("message:state", this.aoReceberEstado);
    this.mqtt.on("connect", () => this.atualizarMensagem("CONECTADO. AGUARDANDO VERSUS..."));
    this.mqtt.on("close", () => this.atualizarMensagem("CONEXÃO ENCERRADA. TENTANDO RECONECTAR..."));
    this.mqtt.on("error", () => this.atualizarMensagem("NÃO FOI POSSÍVEL CONECTAR À SALA SNR."));
    this.mqtt.connect();

    this.events.once("shutdown", () => {
      this.expiracaoEstado?.remove();
      this.expiracaoCandidato?.remove();
      this.encerramentoPendente?.remove();
      this.mqtt.off("message:state", this.aoReceberEstado);
      this.mqtt.disconnect();
      this.registry.set("modoEspectador", false);
      this.registry.set("clienteMQTT", null);
    });
  }

  receberEstado(estado) {
    if (estado === "" && this.salaEncontrada) {
      this.agendarEncerramentoSala();
      return;
    }

    const atualizadoEm = Number(estado?.updatedAt);
    if (
      estado?.modo !== "1v1" ||
      !ROTAS_ESPECTADOR[estado.cena] ||
      !Number.isFinite(atualizadoEm)
    ) {
      this.estadoCandidato = null;
      this.expiracaoCandidato?.remove();
      this.expiracaoCandidato = null;
      if (this.salaEncontrada) {
        this.agendarEncerramentoSala();
        return;
      }
      this.expiracaoEstado?.remove();
      this.expiracaoEstado = null;
      this.estadoAtual = null;
      this.estadoRecebido = null;
      this.registry.set("estadoEspectador", null);
      this.pararCenaReplicada();
      this.atualizarMensagem("AGUARDANDO O INÍCIO DE UM VERSUS...");
      return;
    }

    this.encerramentoPendente?.remove();
    this.encerramentoPendente = null;

    if (!this.salaEncontrada) {
      const candidato = this.estadoCandidato;
      if (
        !candidato ||
        candidato.clientId !== estado.clientId ||
        atualizadoEm <= Number(candidato.updatedAt)
      ) {
        this.estadoCandidato = estado;
        this.expiracaoCandidato?.remove();
        this.expiracaoCandidato = this.time.delayedCall(
          TEMPO_VALIDACAO_ESTADO_MS,
          () => {
            this.estadoCandidato = null;
            this.expiracaoCandidato = null;
            if (!this.salaEncontrada) {
              this.atualizarMensagem("CONECTADO. AGUARDANDO VERSUS...");
            }
          },
        );
        this.atualizarMensagem("CONECTADO. VALIDANDO VERSUS...");
        return;
      }
      this.estadoCandidato = null;
    }

    this.expiracaoCandidato?.remove();
    this.expiracaoCandidato = null;
    this.expiracaoEstado?.remove();
    this.expiracaoEstado = this.time.delayedCall(
      TEMPO_MAXIMO_ESTADO_MS,
      () => this.receberEstado(null),
    );
    this.estadoRecebido = estado;

    this.salaEncontrada = true;
    this.estadoAtual = estado;
    this.registry.set("estadoEspectador", estado);
    this.statusTexto.setVisible(false);
    this.sincronizarCena();
  }

  sincronizarCena() {
    const estado = this.estadoAtual;
    if (!estado) return;

    let destino = ROTAS_ESPECTADOR[estado.cena];
    if (
      estado.cena === "partida" &&
      !this.registry.get("assetsVersusEspectadorProntos")
    ) {
      destino = "CenaPreloadVersus";
    }

    if (destino === this.cenaReplicada) return;

    this.pararCenaReplicada();
    this.cenaReplicada = destino;
    const dados = this.dadosDaCena(estado, destino);
    this.scene.launch(destino, dados);
    this.scene.bringToTop(destino);
  }

  dadosDaCena(estado, destino) {
    if (destino === "cenaPrincipal" || destino === "CenaPreloadVersus") {
      return {
        p1: estado.dados?.personagens?.p1 ?? estado.dados?.p1,
        p2: estado.dados?.personagens?.p2 ?? estado.dados?.p2,
        mapa: estado.dados?.mapa,
        posicoesIniciais: estado.dados?.jogadores,
        espectador: true,
      };
    }
    return { ...estado.dados, espectador: true };
  }

  pararCenaReplicada() {
    if (this.cenaReplicada && this.scene.isActive(this.cenaReplicada)) {
      this.scene.stop(this.cenaReplicada);
    }
    this.cenaReplicada = null;
    this.statusTexto.setVisible(true);
  }

  agendarEncerramentoSala() {
    if (this.encerramentoPendente) return;
    this.encerramentoPendente = this.time.delayedCall(1500, () => {
      this.encerramentoPendente = null;
      this.encerrarSala();
    });
  }

  encerrarSala() {
    this.expiracaoEstado?.remove();
    this.expiracaoEstado = null;
    this.expiracaoCandidato?.remove();
    this.expiracaoCandidato = null;
    this.encerramentoPendente?.remove();
    this.encerramentoPendente = null;
    this.estadoAtual = null;
    this.estadoRecebido = null;
    this.estadoCandidato = null;
    this.salaEncontrada = false;
    this.registry.set("estadoEspectador", null);
    this.pararCenaReplicada();
    this.atualizarMensagem("VERSUS ENCERRADO. AGUARDANDO NOVO VERSUS...");
  }

  atualizarMensagem(texto) {
    this.statusTexto.setText(texto);
    this.statusTexto.setVisible(true);
  }
}