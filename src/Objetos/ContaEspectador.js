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
    this.saldo = null;
    this.pedidosMoedas = new Map();
    this.pedidosPendentes = new Set();
    this.criarInterface();
    if (this.email) this.entrarNaConta(this.email);
    else this.carregarGoogleIdentity();
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
      this.mostrarStatus("Não foi possível carregar o login Google.");
    }, { once: true });
  }

  entrarComGoogle(resposta) {
    const token = resposta?.credential || "";
    const email = obterEmailDoToken(token);
    if (!email) {
      this.mostrarStatus("O Google não retornou um e-mail válido. Tente entrar novamente.");
      return;
    }
    this.idToken = token;
    sessionStorage.setItem(CHAVE_TOKEN_GOOGLE, token);
    this.entrarNaConta(email);
  }

  entrarNaConta(email) {
    this.email = email.trim().toLowerCase();
    this.mostrarStatus(`Conta Google: ${this.email}`);
    this.botaoGoogle.hidden = true;
    this.loginPainel.remove();
    this.saldoTexto.hidden = false;
    this.saldoTexto.textContent = "MOEDAS SNR: sincronizando...";

    const mqtt = this.scene.mqtt;
    if (!mqtt?.clientId) {
      this.mostrarErroSincronizacao();
      return;
    }
    this.topicoRespostaMoedas = `spectator/coins/response/${mqtt.clientId}`;
    this.topicoRespostaLoja = `shop/response/${mqtt.clientId}`;
    this.aoReceberMoedas = (resposta) => this.receberRespostaMoedas(resposta);
    this.aoReceberRespostaLoja = (resposta) => this.receberRespostaCompra(resposta);
    this.aoConectarSala = () => this.aoConectarMQTT();
    mqtt.on(`message:${this.topicoRespostaMoedas}`, this.aoReceberMoedas);
    mqtt.on(`message:${this.topicoRespostaLoja}`, this.aoReceberRespostaLoja);
    mqtt.on("connect", this.aoConectarSala);

    this.scene.iniciarConexaoEspectador();
    if (mqtt.client.connected) this.aoConectarMQTT();
    this.iniciarPresenca();
    this.intervaloSaldo = window.setInterval(() => this.solicitarSaldo(), 5000);
  }

  aoConectarMQTT() {
    const mqtt = this.scene.mqtt;
    mqtt.subscribe([this.topicoRespostaMoedas, this.topicoRespostaLoja]);
    this.publicarPresenca();
    this.solicitarSaldo();
  }

  iniciarPresenca() {
    this.intervaloPresenca = window.setInterval(() => this.publicarPresenca(), 15000);
  }

  publicarPresenca() {
    this.scene.mqtt?.publish("spectator/presence", { email: this.email });
  }

  criarPedidoId() {
    const mqtt = this.scene.mqtt;
    return `${mqtt.clientId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  enviarPedidoMoedas(acao, dados = {}, timeoutMs = 7000) {
    const mqtt = this.scene.mqtt;
    if (!mqtt?.client?.connected) return Promise.reject(new Error("ARCADE OFFLINE OU MQTT DESCONECTADO"));
    const requestId = this.criarPedidoId();
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pedidosMoedas.delete(requestId);
        reject(new Error("O ARCADE NÃO RESPONDEU AO PEDIDO DE MOEDAS"));
      }, timeoutMs);
      this.pedidosMoedas.set(requestId, { resolve, reject, timer, acao });
      const publicado = mqtt.publish(`spectator/coins/${acao}`, {
        ...dados,
        email: this.email,
        googleIdToken: this.idToken,
        requestId,
      }, { qos: 1 });
      if (!publicado) {
        window.clearTimeout(timer);
        this.pedidosMoedas.delete(requestId);
        reject(new Error("ARCADE OFFLINE OU MQTT DESCONECTADO"));
      }
    });
  }

  solicitarSaldo() {
    if (!this.email || !this.scene.sys.isActive()) return;
    this.enviarPedidoMoedas("get").catch((erro) => this.mostrarErroSincronizacao(erro));
  }

  receberRespostaMoedas(resposta) {
    if (resposta?.email !== this.email || !Number.isFinite(Number(resposta.saldo))) return;
    const pendente = this.pedidosMoedas.get(resposta.requestId);
    if (!pendente || (pendente.acao && pendente.acao !== resposta.tipo)) return;
    window.clearTimeout(pendente.timer);
    this.pedidosMoedas.delete(resposta.requestId);
    this.saldo = Math.max(0, Math.floor(Number(resposta.saldo)));
    this.atualizarSaldoTexto();
    if (resposta.tipo === "gasto" && !resposta.ok) {
      pendente.reject(new Error(resposta.erro || "SEM MOEDAS SNR"));
    } else if (!resposta.ok) {
      pendente.reject(new Error("NÃO FOI POSSÍVEL ATUALIZAR O SALDO CENTRAL"));
    } else {
      pendente.resolve(resposta);
    }
    this.statusLoja.hidden = true;
  }

  mostrarErroSincronizacao(erro = null) {
    this.statusLoja.textContent = erro?.message || "AGUARDANDO RESPOSTA DO ARCADE...";
    this.statusLoja.hidden = false;
  }

  async receberRespostaCompra(resposta) {
    const mensagensDeRecusa = new Set([
      "Impossivel durante a ultimate",
      "Conta banida da loja",
    ]);
    if (!this.pedidosPendentes.has(resposta?.pedidoId) || !mensagensDeRecusa.has(resposta?.mensagem)) return;
    try {
      await this.enviarPedidoMoedas("refund", { purchaseId: resposta.pedidoId });
      this.pedidosPendentes.delete(resposta.pedidoId);
      this.statusLoja.textContent = `${resposta.mensagem}. Moeda devolvida.`;
      this.statusLoja.hidden = false;
    } catch (erro) {
      this.mostrarErroSincronizacao(erro);
    }
  }

  atualizarSaldoTexto() {
    this.saldoTexto.textContent = `MOEDAS SNR: ${this.saldo}`;
  }

  async comprar(efeito, jogador) {
    const mqtt = this.scene.registry.get("clienteMQTT");
    if (!this.idToken || !this.email) throw new Error("ENTRE COM GOOGLE PARA COMPRAR");
    if (mqtt?.client?.connected !== true) throw new Error("LOJA INDISPONIVEL");

    const pedidoId = this.criarPedidoId();
    const resultadoGasto = await this.enviarPedidoMoedas("spend", { purchaseId: pedidoId });
    this.pedidosPendentes.add(pedidoId);
    while (this.pedidosPendentes.size > 100) {
      this.pedidosPendentes.delete(this.pedidosPendentes.values().next().value);
    }

    const enviado = mqtt.publish("shop/purchase", {
      efeito,
      jogador,
      email: this.email,
      pedidoId,
    }, { qos: 1 });
    if (!enviado) {
      await this.enviarPedidoMoedas("refund", { purchaseId: pedidoId });
      this.pedidosPendentes.delete(pedidoId);
      throw new Error("ARCADE OFFLINE. A moeda foi devolvida ao saldo central.");
    }
    this.saldo = resultadoGasto.saldo;
    this.atualizarSaldoTexto();
  }

  destruir() {
    window.clearInterval(this.intervaloPresenca);
    window.clearInterval(this.intervaloSaldo);
    this.scene.mqtt?.off("connect", this.aoConectarSala);
    if (this.topicoRespostaMoedas) this.scene.mqtt?.off(`message:${this.topicoRespostaMoedas}`, this.aoReceberMoedas);
    if (this.topicoRespostaLoja) this.scene.mqtt?.off(`message:${this.topicoRespostaLoja}`, this.aoReceberRespostaLoja);
    for (const pedido of this.pedidosMoedas.values()) {
      window.clearTimeout(pedido.timer);
      pedido.reject(new Error("A sessão do espectador foi encerrada."));
    }
    this.pedidosMoedas.clear();
    this.loginPainel?.remove();
    this.elemento?.remove();
  }
}
