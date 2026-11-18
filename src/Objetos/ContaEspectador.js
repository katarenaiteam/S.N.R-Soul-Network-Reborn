const CLIENT_ID_GOOGLE = "14164817969-s43fpf0hi0vdh2lkjn372igr4lsv96lq.apps.googleusercontent.com";
const CHAVE_TOKEN_GOOGLE = "snr-google-id-token";
const PREFIXO_SALDO = "snr-espectador-saldo:";
const CHAVE_COMPRAS_PENDENTES = "snr-compras-pendentes";
const CHAVE_COMPRAS_CREDITADAS = "snr-compras-creditadas";

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
    this.comprasPendentes = this.carregarComprasPendentes();
    this.pedidosPendentes = new Set();
    this.criarInterface();
    this.aoReceberCompraFeira = () => {
      this.comprasPendentes = this.carregarComprasPendentes();
      this.processarComprasPendentes();
    };
    window.addEventListener("snr-compra-recebida", this.aoReceberCompraFeira);
    if (this.email) this.entrarNaConta(this.email);
    this.carregarGoogleIdentity();
    this.scene.events.once("shutdown", () => this.destruir());
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
    this.loginPainel.remove();
    this.saldoTexto.hidden = false;
    this.atualizarSaldoTexto();
    this.scene.iniciarConexaoEspectador();
    this.iniciarPresenca();
    this.processarComprasPendentes();
  }

  carregarComprasPendentes() {
    try {
      const compras = JSON.parse(localStorage.getItem(CHAVE_COMPRAS_PENDENTES) || "[]");
      return Array.isArray(compras) ? compras : [];
    } catch {
      return [];
    }
  }

  salvarComprasPendentes() {
    localStorage.setItem(CHAVE_COMPRAS_PENDENTES, JSON.stringify(this.comprasPendentes));
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

  receberRespostaCompra(resposta) {
    const mensagensDeRecusa = new Set([
      "Impossivel durante a ultimate",
      "Conta banida da loja",
    ]);
    if (!this.pedidosPendentes.has(resposta?.pedidoId) || !mensagensDeRecusa.has(resposta?.mensagem)) return;
    this.pedidosPendentes.delete(resposta.pedidoId);
    this.saldo += 1;
    localStorage.setItem(`${PREFIXO_SALDO}${this.email}`, String(this.saldo));
    this.atualizarSaldoTexto();
    this.statusLoja.textContent = `${resposta.mensagem}. Moeda devolvida.`;
    this.statusLoja.hidden = false;
  }

  processarComprasPendentes() {
    const restantes = [];
    this.comprasPendentes.forEach((compra) => {
      if (compra.email === this.email) this.creditarCompra(compra);
      else restantes.push(compra);
    });
    this.comprasPendentes = restantes;
    this.salvarComprasPendentes();
  }

  creditarCompra(compra) {
    if (compra.product !== 101 || compra.email !== this.email) return;
    const creditadas = this.carregarComprasCreditadas();
    if (compra.id && creditadas.includes(compra.id)) return;
    this.saldo += 1;
    localStorage.setItem(`${PREFIXO_SALDO}${this.email}`, String(this.saldo));
    if (compra.id) {
      creditadas.push(compra.id);
      localStorage.setItem(CHAVE_COMPRAS_CREDITADAS, JSON.stringify(creditadas.slice(-500)));
    }
    this.atualizarSaldoTexto();
  }

  carregarComprasCreditadas() {
    try {
      const ids = JSON.parse(localStorage.getItem(CHAVE_COMPRAS_CREDITADAS) || "[]");
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
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
    const pedidoId = `${mqtt.clientId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.pedidosPendentes.add(pedidoId);
    while (this.pedidosPendentes.size > 100) {
      this.pedidosPendentes.delete(this.pedidosPendentes.values().next().value);
    }
    mqtt.publish("shop/purchase", {
      efeito,
      jogador,
      email: this.email,
      pedidoId,
    });
  }

  destruir() {
    window.clearInterval(this.intervaloPresenca);
    window.removeEventListener("snr-compra-recebida", this.aoReceberCompraFeira);
    this.scene.mqtt?.off("connect", this.aoConectarSala);
    if (this.topicoResposta) this.scene.mqtt?.off(`message:${this.topicoResposta}`, this.aoReceberResposta);
    this.loginPainel?.remove();
    this.elemento?.remove();
  }
}
