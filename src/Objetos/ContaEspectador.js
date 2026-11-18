const CLIENT_ID_GOOGLE = "14164817969-s43fpf0hi0vdh2lkjn372igr4lsv96lq.apps.googleusercontent.com";
const CHAVE_TOKEN_CONTA = "snr-conta-token";
const URL_API_CONTA = String(import.meta.env?.VITE_SNR_ACCOUNT_API_URL || "").replace(/\/$/, "");

export default class ContaEspectador {
  constructor(scene) {
    this.scene = scene;
    this.clientIdGoogle = import.meta.env?.VITE_GOOGLE_CLIENT_ID || CLIENT_ID_GOOGLE;
    this.tokenConta = localStorage.getItem(CHAVE_TOKEN_CONTA) || "";
    this.email = "";
    this.saldo = 0;
    this.pedidosPendentes = new Set();
    this.criarInterface();
    if (this.tokenConta) this.restaurarConta();
    this.carregarGoogleIdentity();
    this.scene.events.once("shutdown", () => this.destruir());
  }

  async requisicaoApi(caminho, { method = "GET", body, autenticada = true } = {}) {
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (autenticada && this.tokenConta) headers.Authorization = `Bearer ${this.tokenConta}`;
    const response = await fetch(`${URL_API_CONTA}${caminho}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const erro = new Error(payload.error || "Não foi possível sincronizar a conta.");
      erro.status = response.status;
      throw erro;
    }
    return payload;
  }

  async restaurarConta() {
    try {
      const conta = await this.requisicaoApi("/api/account");
      if (this.scene.sys.isActive()) this.entrarNaConta(conta);
    } catch (erro) {
      if (erro.status === 401) {
        this.tokenConta = "";
        localStorage.removeItem(CHAVE_TOKEN_CONTA);
      } else {
        this.mostrarStatus("Não foi possível sincronizar as moedas com o servidor.");
      }
    }
  }

  criarInterface() {
    this.loginPainel = document.createElement("div");
    this.loginPainel.style.cssText = [
      "position:fixed", "z-index:10000", "left:50%", "top:50%",
      "transform:translate(-50%,-50%)", "display:flex", "flex-direction:column",
      "align-items:center", "gap:22px", "padding:28px 34px",
      "background:rgba(0,0,0,.88)", "border:1px solid #43d96b",
      "text-align:center", "box-shadow:0 0 28px rgba(67,217,107,.22)",
    ].join(";");
    this.loginTexto = document.createElement("div");
    this.loginTexto.textContent = "CONECTE-SE PARA ASSISTIR A UM JOGO EM ANDAMENTO";
    this.loginTexto.style.cssText = "max-width:560px;color:#9cffbb;font:22px RetroFont,monospace;line-height:1.5";
    this.botaoGoogle = document.createElement("div");
    this.loginPainel.append(this.loginTexto, this.botaoGoogle);
    document.body.append(this.loginPainel);

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
    this.elemento.append(this.status, this.statusLoja, this.saldoTexto);
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
    const credential = resposta?.credential || "";
    if (!credential) {
      this.mostrarStatus("O Google não retornou uma credencial válida.");
      return;
    }
    try {
      const conta = await this.requisicaoApi("/api/google/login", {
        method: "POST",
        body: { credential },
        autenticada: false,
      });
      this.tokenConta = conta.token;
      localStorage.setItem(CHAVE_TOKEN_CONTA, this.tokenConta);
      this.entrarNaConta(conta);
    } catch (erro) {
      this.mostrarStatus(erro.message);
    }
  }

  entrarNaConta(conta) {
    this.email = conta.email;
    this.saldo = Math.max(0, Number(conta.balance) || 0);
    this.mostrarStatus(`Conta Google: ${this.email}`);
    this.botaoGoogle.hidden = true;
    this.loginPainel.remove();
    this.saldoTexto.hidden = false;
    this.atualizarSaldoTexto();
    this.scene.iniciarConexaoEspectador();
    this.iniciarPresenca();
    window.clearInterval(this.intervaloSaldo);
    this.intervaloSaldo = window.setInterval(() => this.sincronizarSaldo(), 15000);
  }

  async sincronizarSaldo() {
    if (!this.tokenConta || !this.scene.sys.isActive()) return;
    try {
      const conta = await this.requisicaoApi("/api/account");
      this.saldo = Math.max(0, Number(conta.balance) || 0);
      this.atualizarSaldoTexto();
    } catch (erro) {
      if (erro.status === 401) {
        this.tokenConta = "";
        localStorage.removeItem(CHAVE_TOKEN_CONTA);
        this.mostrarStatus("Sua sessão expirou. Entre com Google novamente.");
        if (!this.loginPainel.isConnected) document.body.append(this.loginPainel);
        this.loginPainel.style.display = "flex";
        this.botaoGoogle.hidden = false;
      }
    }
  }

  iniciarPresenca() {
    const mqtt = this.scene.mqtt;
    if (!mqtt?.clientId || this.presencaIniciada) return;
    this.presencaIniciada = true;
    this.topicoResposta = `shop/response/${mqtt.clientId}`;
    this.aoReceberResposta = (resposta) => this.receberRespostaCompra(resposta);
    mqtt.on(`message:${this.topicoResposta}`, this.aoReceberResposta);
    mqtt.subscribe(this.topicoResposta);
    this.aoConectarSala = () => this.publicarPresenca();
    mqtt.on("connect", this.aoConectarSala);
    this.publicarPresenca();
    this.intervaloPresenca = window.setInterval(() => this.publicarPresenca(), 15000);
  }

  publicarPresenca() {
    this.scene.mqtt?.publish("spectator/presence", { email: this.email });
  }

  async receberRespostaCompra(resposta) {
    const mensagensDeRecusa = new Set([
      "Impossivel durante a ultimate",
      "Conta banida da loja",
    ]);
    if (!this.pedidosPendentes.has(resposta?.pedidoId) || !mensagensDeRecusa.has(resposta?.mensagem)) return;
    try {
      const conta = await this.requisicaoApi("/api/account/refund", {
        method: "POST",
        body: { purchaseId: resposta.pedidoId },
      });
      this.saldo = conta.balance;
      this.atualizarSaldoTexto();
      this.pedidosPendentes.delete(resposta.pedidoId);
      this.statusLoja.textContent = `${resposta.mensagem}. Moeda devolvida.`;
      this.statusLoja.hidden = false;
    } catch {
      this.statusLoja.textContent = "Não foi possível devolver a moeda. Verifique a conexão.";
      this.statusLoja.hidden = false;
    }
  }

  atualizarSaldoTexto() {
    this.saldoTexto.textContent = `MOEDAS SNR: ${this.saldo}`;
  }

  async comprar(efeito, jogador) {
    const mqtt = this.scene.registry.get("clienteMQTT");
    if (!this.tokenConta || !this.email) throw new Error("ENTRE COM GOOGLE PARA COMPRAR");
    if (mqtt?.client?.connected !== true) throw new Error("LOJA INDISPONIVEL");
    const pedidoId = `${mqtt.clientId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const conta = await this.requisicaoApi("/api/account/spend", {
      method: "POST",
      body: { purchaseId: pedidoId },
    });
    this.saldo = conta.balance;
    this.atualizarSaldoTexto();
    this.pedidosPendentes.add(pedidoId);
    while (this.pedidosPendentes.size > 100) {
      this.pedidosPendentes.delete(this.pedidosPendentes.values().next().value);
    }
    const enviado = mqtt.publish("shop/purchase", {
      efeito,
      jogador,
      email: this.email,
      pedidoId,
    });
    if (!enviado) {
      const reembolso = await this.requisicaoApi("/api/account/refund", {
        method: "POST",
        body: { purchaseId: pedidoId },
      });
      this.saldo = reembolso.balance;
      this.atualizarSaldoTexto();
      this.pedidosPendentes.delete(pedidoId);
      throw new Error("LOJA INDISPONIVEL. MOEDA DEVOLVIDA");
    }
  }

  destruir() {
    window.clearInterval(this.intervaloPresenca);
    window.clearInterval(this.intervaloSaldo);
    this.scene.mqtt?.off("connect", this.aoConectarSala);
    if (this.topicoResposta) this.scene.mqtt?.off(`message:${this.topicoResposta}`, this.aoReceberResposta);
    this.loginPainel?.remove();
    this.elemento?.remove();
  }
}
