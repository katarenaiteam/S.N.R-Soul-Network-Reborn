const URL_API = (import.meta.env?.VITE_SNR_API_URL || "").replace(/\/$/, "");
const CLIENT_ID_GOOGLE_PADRAO = "14164817969-s43fpf0hi0vdh2lkjn372igr4lsv96lq.apps.googleusercontent.com";
const CHAVE_TOKEN_GOOGLE = "snr-google-id-token";

export default class ContaEspectador {
  constructor(scene) {
    this.scene = scene;
    this.clientIdGoogle = import.meta.env?.VITE_GOOGLE_CLIENT_ID || CLIENT_ID_GOOGLE_PADRAO;
    this.idToken = sessionStorage.getItem(CHAVE_TOKEN_GOOGLE) || "";
    this.email = "";
    this.saldo = 0;
    this.criarInterface();
    this.carregarGoogleIdentity();
    if (this.idToken) this.atualizarSaldo();
    this.intervaloSaldo = window.setInterval(() => this.atualizarSaldo(), 5000);
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
    this.saldoTexto = document.createElement("div");
    this.saldoTexto.hidden = true;
    this.saldoTexto.style.cssText = "padding:6px 10px;background:rgba(0,0,0,.8);color:white;font:14px Arial,sans-serif";
    this.botaoGoogle = document.createElement("div");
    this.elemento.append(this.status, this.saldoTexto, this.botaoGoogle);
    document.body.append(this.elemento);
  }

  mostrarStatus(texto) {
    this.status.textContent = texto;
    this.status.hidden = false;
  }

  carregarGoogleIdentity() {
    if (!this.clientIdGoogle) {
      this.mostrarStatus("Login Google indisponível: falta configurar o Client ID OAuth.");
      return;
    }

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
      window.google.accounts.id.prompt();
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
      this.mostrarStatus("Não foi possível carregar o login Google.");
    }, { once: true });
  }

  async entrarComGoogle(resposta) {
    if (!resposta?.credential) return;
    this.idToken = resposta.credential;
    sessionStorage.setItem(CHAVE_TOKEN_GOOGLE, this.idToken);
    try {
      await this.atualizarSaldo();
    } catch (erro) {
      this.mostrarStatus(erro.message);
    }
  }

  async requisitar(caminho, dados = {}) {
    const resposta = await fetch(`${URL_API}${caminho}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...dados, idToken: this.idToken }),
    });
    const tipoConteudo = resposta.headers.get("content-type") || "";
    if (!tipoConteudo.includes("application/json")) {
      throw new Error(
        "O login Google abriu, mas a API da conta nao esta ligada neste site (/api). O servico Node precisa estar hospedado e encaminhado para ca.",
      );
    }
    const resultado = await resposta.json();
    if (!resposta.ok) throw new Error(resultado.error || "Falha ao acessar a conta.");
    return resultado;
  }

  async atualizarSaldo() {
    if (!this.idToken || this.atualizandoSaldo) return;
    this.atualizandoSaldo = true;
    try {
      const conta = await this.requisitar("/api/account");
      this.email = conta.email;
      this.saldo = conta.saldo;
      this.botaoGoogle.hidden = true;
      this.mostrarStatus(this.email);
      this.saldoTexto.hidden = false;
      this.saldoTexto.textContent = `MOEDAS SNR: ${this.saldo}`;
    } catch (erro) {
      this.mostrarStatus(erro.message);
      if (erro.message.includes("Entre novamente") || erro.message.includes("Faça login")) {
        this.idToken = "";
        sessionStorage.removeItem(CHAVE_TOKEN_GOOGLE);
        this.botaoGoogle.hidden = false;
      }
    } finally {
      this.atualizandoSaldo = false;
    }
  }

  async comprar(efeito, jogador) {
    const mqtt = this.scene.registry.get("clienteMQTT");
    if (!this.idToken || !this.email) throw new Error("ENTRE COM GOOGLE PARA COMPRAR");
    if (mqtt?.client?.connected !== true) throw new Error("LOJA INDISPONÍVEL");
    const resposta = await this.requisitar("/api/shop/purchase", {
      efeito,
      jogador,
      clientId: mqtt.clientId,
    });
    this.saldo = resposta.saldo;
    this.saldoTexto.textContent = `MOEDAS SNR: ${this.saldo}`;
  }

  destruir() {
    window.clearInterval(this.intervaloSaldo);
    this.elemento?.remove();
  }
}
