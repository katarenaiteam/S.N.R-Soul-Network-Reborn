const CLIENT_ID_GOOGLE = "14164817969-s43fpf0hi0vdh2lkjn372igr4lsv96lq.apps.googleusercontent.com";
const URL_BROKER_FEIRA = "wss://mqtt.feira-de-jogos.dev.br/mqtt";
const TOPICO_COMANDOS_FEIRA = "vending/comando/#";
const CHAVE_TOKEN_GOOGLE = "snr-google-id-token";
const PREFIXO_SALDO = "snr-espectador-saldo:";

function obterEmailDoToken(token) {
  try {
    const parte = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const perfil = JSON.parse(atob(parte));
    if (perfil.email_verified !== true || typeof perfil.email !== "string") return "";
    if (!Number.isFinite(perfil.exp) || perfil.exp * 1000 <= Date.now()) return "";
    return perfil.email.trim().toLowerCase();
  } catch {
    return "";
  }
}

export default class ContaEspectador {
  constructor(scene) {
    this.scene = scene;
    this.clientIdGoogle = import.meta.env?.VITE_GOOGLE_CLIENT_ID || CLIENT_ID_GOOGLE;
    this.idToken = sessionStorage.getItem(CHAVE_TOKEN_GOOGLE) || "";
    this.email = obterEmailDoToken(this.idToken);
    this.saldo = 0;
    this.comprasPendentes = [];
    this.criarInterface();
    if (this.email) this.entrarNaConta(this.email);
    this.carregarGoogleIdentity();
    this.conectarFeira();
    this.scene.events.once("shutdown", () => this.destruir());
  }

  criarInterface() {
    this.elemento = document.createElement("div");
    this.elemento.style.cssText = [
      "position:fixed", "z-index:10000", "top:20px", "right:20px",
      "display:flex", "flex-direction:column", "align-items:flex-end", "gap:8px",
    ].join(";");
    this.status = document.createElement("div");
    this.status.hidden = true;
    this.status.style.cssText = "padding:6px 10px;background:rgba(0,0,0,.8);color:white;font:14px Arial,sans-serif";
    this.statusLoja = document.createElement("div");
    this.statusLoja.hidden = true;
    this.statusLoja.style.cssText = "padding:6px 10px;background:rgba(0,0,0,.8);color:#ffd479;font:14px Arial,sans-serif";
    this.saldoTexto = document.createElement("div");
    this.saldoTexto.hidden = true;
    this.saldoTexto.style.cssText = "padding:6px 10px;background:rgba(0,0,0,.8);color:white;font:14px Arial,sans-serif";
    this.botaoGoogle = document.createElement("div");
    this.elemento.append(this.status, this.statusLoja, this.saldoTexto, this.botaoGoogle);
    document.body.append(this.elemento);
  }

  mostrarStatus(texto) {
    this.status.textContent = texto;
    this.status.hidden = false;
  }

  carregarGoogleIdentity() {
    const inicializar = () => {
      if (!window.google?.accounts?.id || !this.scene.sys.isActive()) return;
      window.google.accounts.id.initialize({
        client_id: this.clientIdGoogle,
        callback: (resposta) => this.entrarComGoogle(resposta),
        auto_select: false,
        cancel_on_tap_outside: false,
        context: "signin",
      });
      window.google.accounts.id.renderButton(this.botaoGoogle, {
        type: "standard", theme: "outline", size: "large", shape: "pill",
        text: "signin_with", locale: "pt-BR", width: 280,
      });
      if (!this.email) window.google.accounts.id.prompt();
    };

    if (window.google?.accounts?.id) {
      inicializar();
      return;
    }

    let script = document.querySelector('script[data-google-identity="true"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      document.head.append(script);
    }
    script.addEventListener("load", inicializar, { once: true });
    script.addEventListener("error", () => {
      this.mostrarStatus("Nao foi possivel carregar o login Google.");
    }, { once: true });
  }

  entrarComGoogle(resposta) {
    const token = resposta?.credential || "";
    const email = obterEmailDoToken(token);
    if (!email) {
      this.mostrarStatus("O Google nao retornou um e-mail valido. Tente entrar novamente.");
      return;
    }
    this.idToken = token;
    sessionStorage.setItem(CHAVE_TOKEN_GOOGLE, token);
    this.entrarNaConta(email);
  }

  entrarNaConta(email) {
    this.email = email;
    const saldoSalvo = Number(localStorage.getItem(`${PREFIXO_SALDO}${email}`));
    this.saldo = Number.isFinite(saldoSalvo) && saldoSalvo > 0 ? saldoSalvo : 0;
    this.mostrarStatus(`Conta Google: ${email}`);
    this.botaoGoogle.hidden = true;
    this.saldoTexto.hidden = false;
    this.atualizarSaldoTexto();
    this.processarComprasPendentes();
  }

  conectarFeira() {
    if (!globalThis.mqtt?.connect) {
      this.statusLoja.textContent = "Cliente MQTT indisponivel.";
      this.statusLoja.hidden = false;
      return;
    }
    this.clienteFeira = globalThis.mqtt.connect(URL_BROKER_FEIRA, {
      clientId: `snr-espectador-${Math.random().toString(36).slice(2, 10)}`,
      reconnectPeriod: 5000,
    });
    this.clienteFeira.on("connect", () => {
      this.clienteFeira.subscribe(TOPICO_COMANDOS_FEIRA);
      this.statusLoja.hidden = true;
    });
    this.clienteFeira.on("close", () => {
      this.statusLoja.textContent = "Desconectado da loja da Feira.";
      this.statusLoja.hidden = false;
    });
    this.clienteFeira.on("error", () => {
      this.statusLoja.textContent = "Nao foi possivel conectar a loja da Feira.";
      this.statusLoja.hidden = false;
    });
    this.clienteFeira.on("message", (_topico, mensagem) => {
      let evento;
      try {
        evento = JSON.parse(mensagem.toString());
      } catch {
        return;
      }
      if (Number(evento?.product) !== 101 || typeof evento?.email !== "string") return;
      const compra = { product: 101, email: evento.email.trim().toLowerCase() };
      if (this.email) this.creditarCompra(compra);
      else this.comprasPendentes.push(compra);
    });
  }

  processarComprasPendentes() {
    this.comprasPendentes.forEach((compra) => this.creditarCompra(compra));
    this.comprasPendentes = [];
  }

  creditarCompra(compra) {
    if (compra.product !== 101 || compra.email !== this.email) return;
    this.saldo += 1;
    localStorage.setItem(`${PREFIXO_SALDO}${this.email}`, String(this.saldo));
    this.atualizarSaldoTexto();
  }

  atualizarSaldoTexto() {
    this.saldoTexto.textContent = `MOEDAS SNR: ${this.saldo}`;
  }

  async comprar(efeito, jogador) {
    const mqtt = this.scene.registry.get("clienteMQTT");
    if (!this.idToken || !this.email) throw new Error("ENTRE COM GOOGLE PARA COMPRAR");
    if (mqtt?.client?.connected !== true) throw new Error("LOJA INDISPONIVEL");
    if (this.saldo < 1) throw new Error("SEM MOEDAS SNR");

    this.saldo -= 1;
    localStorage.setItem(`${PREFIXO_SALDO}${this.email}`, String(this.saldo));
    this.atualizarSaldoTexto();
    mqtt.publish("shop/purchase", {
      efeito,
      jogador,
      pedidoId: `${mqtt.clientId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
  }

  destruir() {
    this.clienteFeira?.end();
    this.elemento?.remove();
  }
}
