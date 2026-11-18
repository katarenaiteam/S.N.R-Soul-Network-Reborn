const URL_API = (import.meta.env?.VITE_SNR_API_URL || "").replace(/\/$/, "");
const CLIENT_ID_GOOGLE = "14164817969-s43fpf0hi0vdh2lkjn372igr4lsv96lq.apps.googleusercontent.com";
const CHAVE_TOKEN_GOOGLE = "snr-google-id-token";

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
    this.criarInterface();
    if (this.email) this.mostrarConta();
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
    this.apiStatus = document.createElement("div");
    this.apiStatus.hidden = true;
    this.apiStatus.style.cssText = "padding:6px 10px;background:rgba(0,0,0,.8);color:#ffd479;font:14px Arial,sans-serif";
    this.saldoTexto = document.createElement("div");
    this.saldoTexto.hidden = true;
    this.saldoTexto.style.cssText = "padding:6px 10px;background:rgba(0,0,0,.8);color:white;font:14px Arial,sans-serif";
    this.botaoGoogle = document.createElement("div");
    this.elemento.append(this.status, this.apiStatus, this.saldoTexto, this.botaoGoogle);
    document.body.append(this.elemento);
  }

  mostrarStatus(texto) {
    this.status.textContent = texto;
    this.status.hidden = false;
  }

  mostrarConta() {
    this.mostrarStatus(`Conta Google: ${this.email}`);
    this.botaoGoogle.hidden = true;
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

  async entrarComGoogle(resposta) {
    const token = resposta?.credential || "";
    const email = obterEmailDoToken(token);
    if (!email) {
      this.mostrarStatus("O Google nao retornou um e-mail valido. Tente entrar novamente.");
      return;
    }

    this.idToken = token;
    this.email = email;
    sessionStorage.setItem(CHAVE_TOKEN_GOOGLE, token);
    this.mostrarConta();
    await this.atualizarSaldo();
  }

  async requisitar(caminho, dados = {}) {
    const resposta = await fetch(`${URL_API}${caminho}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...dados, idToken: this.idToken }),
    });
    const tipoConteudo = resposta.headers.get("content-type") || "";
    if (!tipoConteudo.includes("application/json")) {
      const erro = new Error("API de moedas indisponivel neste site.");
      erro.apiIndisponivel = true;
      throw erro;
    }
    const resultado = await resposta.json();
    if (!resposta.ok) {
      const erro = new Error(resultado.error || "Falha ao acessar a conta.");
      erro.status = resposta.status;
      throw erro;
    }
    return resultado;
  }

  async atualizarSaldo() {
    if (!this.idToken || this.atualizandoSaldo) return;
    this.atualizandoSaldo = true;
    try {
      const conta = await this.requisitar("/api/account");
      this.email = conta.email;
      this.saldo = conta.saldo;
      this.mostrarConta();
      this.apiStatus.hidden = true;
      this.saldoTexto.hidden = false;
      this.saldoTexto.textContent = `MOEDAS SNR: ${this.saldo}`;
    } catch (erro) {
      if (erro.status === 401) {
        this.idToken = "";
        this.email = "";
        sessionStorage.removeItem(CHAVE_TOKEN_GOOGLE);
        this.botaoGoogle.hidden = false;
        this.mostrarStatus("Sua sessao Google expirou. Entre novamente.");
      } else {
        this.apiStatus.textContent = erro.apiIndisponivel
          ? "Saldo indisponivel: API de moedas offline."
          : erro.message;
        this.apiStatus.hidden = false;
      }
    } finally {
      this.atualizandoSaldo = false;
    }
  }

  async comprar(efeito, jogador) {
    const mqtt = this.scene.registry.get("clienteMQTT");
    if (!this.idToken || !this.email) throw new Error("ENTRE COM GOOGLE PARA COMPRAR");
    if (mqtt?.client?.connected !== true) throw new Error("LOJA INDISPONIVEL");
    const resposta = await this.requisitar("/api/shop/purchase", {
      efeito,
      jogador,
      clientId: mqtt.clientId,
    });
    this.saldo = resposta.saldo;
    this.saldoTexto.hidden = false;
    this.saldoTexto.textContent = `MOEDAS SNR: ${this.saldo}`;
  }

  destruir() {
    window.clearInterval(this.intervaloSaldo);
    this.elemento?.remove();
  }
}
