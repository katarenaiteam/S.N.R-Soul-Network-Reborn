const URL_BROKER_FEIRA = "wss://mqtt.feira-de-jogos.dev.br/mqtt";
const TOPICO_COMPRAS_FEIRA = "vending/comando/#";
const TOPICO_ARMAZENAMENTO = "spectator/coins/storage";
const CHAVE_CACHE_ANTIGO = "snr-cofre-moedas-arcade-v1";
// Usa o mesmo papel e formato de clientId do host do jogo para manter as permissões MQTT.
const CLIENT_ID_COFRE = "snr-host-COFR";
const CLIENT_ID_COMPRAS = "snr-arcade-compras-v1";
const CLIENT_ID_GOOGLE_PADRAO = "14164817969-s43fpf0hi0vdh2lkjn372igr4lsv96lq.apps.googleusercontent.com";

function normalizarEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function novoArmazenamento() {
  return { schema: 1, revision: 0, updatedAt: 0, contas: {} };
}

export default class CofreMoedasArcade {
  constructor(config) {
    this.mqtt = globalThis.mqtt;
    this.config = config;
    this.clientIdGoogle = import.meta.env?.VITE_GOOGLE_CLIENT_ID || CLIENT_ID_GOOGLE_PADRAO;
    this.prefixoTopico = config.topicPrefix.replace(/\/$/, "");
    this.topicoArmazenamento = `${this.prefixoTopico}/${TOPICO_ARMAZENAMENTO}`;
    this.armazenamento = novoArmazenamento();
    this.armazenamentoDisponivel = false;
    this.pronto = false;
    this.operacoesPendentes = [];
    this.fila = Promise.resolve();
    this.chavesGoogle = null;
    this.promessaChavesGoogle = null;
    this.validacoesToken = new Map();
    if (!this.mqtt?.connect) {
      console.error("O cofre SNR não iniciou: cliente MQTT indisponível.");
      return;
    }
    this.conectarJogo();
    this.conectarCompras();
  }

  conectarJogo() {
    this.clienteJogo = this.mqtt.connect(this.config.brokerUrl, {
      clientId: CLIENT_ID_COFRE,
      clean: false,
      reconnectPeriod: 5000,
    });
    this.clienteJogo.on("connect", () => {
      this.pronto = false;
      this.recebeuRetidoNestaConexao = false;
      this.assinaturaArmazenamentoAceita = false;
      console.info("Cofre conectado ao broker MQTT do jogo.");
      window.clearTimeout(this.timerInicializacao);
      window.clearTimeout(this.timerAssinaturaArmazenamento);
      const assinarArmazenamento = () => {
        if (!this.clienteJogo?.connected) return;
        this.clienteJogo.subscribe(this.topicoArmazenamento, { qos: 1 }, (erro) => {
          if (erro) {
            console.error("Falha ao assinar o armazenamento MQTT:", erro.message);
            this.timerAssinaturaArmazenamento = window.setTimeout(assinarArmazenamento, 5000);
            return;
          }
          this.assinaturaArmazenamentoAceita = true;
          console.info("Assinatura do armazenamento MQTT aceita.");
          if (this.recebeuRetidoNestaConexao) {
            this.ativarComArmazenamentoAtual();
            return;
          }
          this.timerInicializacao = window.setTimeout(() => {
            if (!this.pronto && !this.recebeuRetidoNestaConexao) {
              this.migrarCacheAntigo()
                .then((migrado) => this.salvarArmazenamento().then(() => {
                  if (migrado) localStorage.removeItem(CHAVE_CACHE_ANTIGO);
                }))
                .catch((falha) => console.error("Falha ao inicializar saldo retido no MQTT:", falha.message))
                .finally(() => this.ativarComArmazenamentoAtual());
            }
          }, 2000);
        });
      };
      assinarArmazenamento();
    });
    this.clienteJogo.on("message", (topico, mensagem) => {
      if (topico === this.topicoArmazenamento) {
        this.receberArmazenamentoRetido(mensagem);
        return;
      }
      const prefixo = `${this.prefixoTopico}/`;
      if (!topico.startsWith(prefixo)) return;
      this.enfileirar(() => this.receberPedidoJogo(topico.slice(prefixo.length), mensagem));
    });
    this.clienteJogo.on("error", (erro) => console.error("MQTT do cofre SNR:", erro.message));
    this.clienteJogo.on("close", () => console.error("Conexão do cofre com o broker MQTT do jogo foi encerrada."));
  }

  receberArmazenamentoRetido(mensagem) {
    try {
      const salvo = JSON.parse(mensagem.toString());
      if (salvo?.schema !== 1 || !Number.isFinite(Number(salvo.revision)) || !salvo.contas || typeof salvo.contas !== "object") return;
      this.recebeuRetidoNestaConexao = true;
      this.armazenamentoDisponivel = true;
      if (Number(salvo.revision) >= this.armazenamento.revision) {
        this.armazenamento = {
          schema: 1,
          revision: Number(salvo.revision),
          updatedAt: Number(salvo.updatedAt) || 0,
          contas: salvo.contas,
        };
      }
      this.ativarComArmazenamentoAtual();
    } catch (erro) {
      console.error("Saldo retido do MQTT está inválido:", erro.message);
    }
  }

  ativarComArmazenamentoAtual() {
    if (this.pronto || this.ativando || !this.assinaturaArmazenamentoAceita || !this.clienteJogo?.connected) return;
    this.ativando = true;
    this.clienteJogo.subscribe([
      `${this.prefixoTopico}/spectator/coins/get`,
      `${this.prefixoTopico}/spectator/coins/spend`,
      `${this.prefixoTopico}/spectator/coins/refund`,
    ], { qos: 1 }, (erro) => {
      this.ativando = false;
      if (erro) {
        console.error("Falha ao assinar pedidos de moedas:", erro.message);
        this.timerAssinaturaPedidos = window.setTimeout(() => this.ativarComArmazenamentoAtual(), 5000);
        return;
      }
      this.pronto = true;
      console.info("Cofre pronto: assinatura dos pedidos de moedas aceita.");
      const pendentes = this.operacoesPendentes.splice(0);
      for (const operacao of pendentes) this.enfileirar(operacao);
    });
  }

  enfileirar(tarefa) {
    this.fila = this.fila.then(tarefa).catch((erro) => {
      console.error("Falha ao processar saldo MQTT:", erro.message);
    });
  }

  async hashEmail(email) {
    const bytes = new TextEncoder().encode(normalizarEmail(email));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async migrarCacheAntigo() {
    if (this.pronto || this.recebeuRetidoNestaConexao || this.armazenamento.revision > 0) return false;
    try {
      const antigo = JSON.parse(localStorage.getItem(CHAVE_CACHE_ANTIGO) || "{}");
      if (!antigo.contas || typeof antigo.contas !== "object") return false;
      for (const [emailOriginal, dados] of Object.entries(antigo.contas)) {
        if (this.pronto || this.recebeuRetidoNestaConexao) return false;
        const email = normalizarEmail(emailOriginal);
        if (!email) continue;
        const id = await this.hashEmail(email);
        this.armazenamento.contas[id] = {
          saldo: Math.max(0, Math.floor(Number(dados?.saldo) || 0)),
          compras: Array.isArray(dados?.compras) ? dados.compras : [],
          gastos: dados?.gastos && typeof dados.gastos === "object" ? dados.gastos : {},
        };
      }
      return Object.keys(antigo.contas).length > 0;
    } catch (erro) {
      console.error("Não foi possível migrar o saldo local antigo:", erro.message);
      return false;
    }
  }

  async obterChavesGoogle() {
    if (this.chavesGoogle) return this.chavesGoogle;
    if (!this.promessaChavesGoogle) {
      this.promessaChavesGoogle = fetch("https://www.googleapis.com/oauth2/v3/certs")
        .then((resposta) => {
          if (!resposta.ok) throw new Error("Falha ao obter chaves públicas do Google.");
          return resposta.json();
        })
        .then((dados) => {
          this.chavesGoogle = dados.keys || [];
          return this.chavesGoogle;
        })
        .finally(() => { this.promessaChavesGoogle = null; });
    }
    return this.promessaChavesGoogle;
  }

  async validarContaGoogle(token) {
    if (typeof token !== "string" || !token) return "";
    const anterior = this.validacoesToken.get(token);
    if (anterior && anterior.expira > Date.now()) return anterior.email;
    try {
      const partes = token.split(".");
      if (partes.length !== 3) return "";
      const decodificar = (parte) => {
        const base64 = parte.replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
      };
      const cabecalho = decodificar(partes[0]);
      const claims = decodificar(partes[1]);
      let chaves = await this.obterChavesGoogle();
      let jwk = chaves.find((chave) => chave.kid === cabecalho.kid && chave.kty === "RSA");
      if (!jwk) {
        this.chavesGoogle = null;
        chaves = await this.obterChavesGoogle();
        jwk = chaves.find((chave) => chave.kid === cabecalho.kid && chave.kty === "RSA");
      }
      if (!jwk || cabecalho.alg !== "RS256") return "";
      const chave = await crypto.subtle.importKey(
        "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"],
      );
      const assinaturaBase64 = partes[2].replace(/-/g, "+").replace(/_/g, "/");
      const assinatura = Uint8Array.from(
        atob(assinaturaBase64.padEnd(Math.ceil(assinaturaBase64.length / 4) * 4, "=")),
        (caractere) => caractere.charCodeAt(0),
      );
      const mensagem = new TextEncoder().encode(`${partes[0]}.${partes[1]}`);
      const assinaturaValida = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", chave, assinatura, mensagem);
      const email = normalizarEmail(claims.email);
      if (!assinaturaValida || !["https://accounts.google.com", "accounts.google.com"].includes(claims.iss)
        || claims.aud !== this.clientIdGoogle || !Number.isFinite(Number(claims.exp))
        || Number(claims.exp) * 1000 <= Date.now()
        || claims.email_verified !== true || !email) return "";
      this.validacoesToken.set(token, { email, expira: Date.now() + 60000 });
      if (this.validacoesToken.size > 100) this.validacoesToken.delete(this.validacoesToken.keys().next().value);
      return email;
    } catch (erro) {
      console.error("Não foi possível validar o login Google:", erro.message);
      return "";
    }
  }

  obterContaPorId(id) {
    this.armazenamento.contas[id] ||= { saldo: 0, compras: [], gastos: {} };
    const conta = this.armazenamento.contas[id];
    conta.saldo = Math.max(0, Math.floor(Number(conta.saldo) || 0));
    conta.compras = Array.isArray(conta.compras) ? conta.compras : [];
    conta.gastos = conta.gastos && typeof conta.gastos === "object" ? conta.gastos : {};
    return conta;
  }

  async salvarArmazenamento() {
    if (!this.clienteJogo?.connected) throw new Error("BROKER MQTT DESCONECTADO");
    this.armazenamento.revision += 1;
    this.armazenamento.updatedAt = Date.now();
    const conteudo = JSON.stringify(this.armazenamento);
    await new Promise((resolve, reject) => {
      this.clienteJogo.publish(this.topicoArmazenamento, conteudo, { qos: 1, retain: true }, (erro) => {
        if (erro) reject(erro);
        else {
          console.info(`Saldo retido confirmado pelo broker (revisão ${this.armazenamento.revision}).`);
          resolve();
        }
      });
    });
    this.armazenamentoDisponivel = true;
  }

  async receberPedidoJogo(topico, mensagem) {
    let pedido;
    try {
      pedido = JSON.parse(mensagem.toString());
    } catch {
      return;
    }
    const acao = topico.split("/").pop();
    if (!["get", "spend", "refund"].includes(acao)) return;
    console.info(`Pedido MQTT de moedas recebido: ${acao}.`);
    if (!this.pronto) {
      this.operacoesPendentes.push(() => this.receberPedidoJogo(topico, mensagem));
      return;
    }
    const tipo = acao === "get" ? "saldo" : acao === "spend" ? "gasto" : "devolucao";
    const email = await this.validarContaGoogle(pedido.googleIdToken);
    if (!email || email !== normalizarEmail(pedido.email)) {
      this.responder(pedido, { tipo, ok: false, saldo: 0, erro: "LOGIN GOOGLE INVÁLIDO" });
      return;
    }
    const idConta = await this.hashEmail(email);
    const conta = this.obterContaPorId(idConta);
    if (acao === "get") {
      this.responder(pedido, this.armazenamentoDisponivel
        ? { tipo, ok: true, saldo: conta.saldo }
        : { tipo, ok: false, saldo: conta.saldo, erro: "ARMAZENAMENTO MQTT DE MOEDAS INDISPONÍVEL" });
      return;
    }
    if (!this.armazenamentoDisponivel) {
      this.responder(pedido, { tipo, ok: false, saldo: conta.saldo, erro: "ARMAZENAMENTO MQTT DE MOEDAS INDISPONÍVEL" });
      return;
    }
    const idPedido = String(pedido.purchaseId || "");
    if (!idPedido) return;
    const anterior = JSON.stringify(conta);
    if (acao === "spend") {
      if (conta.gastos[idPedido] === "gasta") {
        this.responder(pedido, { tipo, ok: true, saldo: conta.saldo });
        return;
      }
      if (conta.saldo < 1) {
        this.responder(pedido, { tipo, ok: false, saldo: conta.saldo, erro: "SEM MOEDAS SNR" });
        return;
      }
      conta.saldo -= 1;
      conta.gastos[idPedido] = "gasta";
    } else if (conta.gastos[idPedido] === "gasta") {
      conta.saldo += 1;
      conta.gastos[idPedido] = "devolvida";
    }
    try {
      await this.salvarArmazenamento();
      this.responder(pedido, {
        tipo,
        ok: acao === "spend" ? conta.gastos[idPedido] === "gasta" : conta.gastos[idPedido] === "devolvida",
        saldo: conta.saldo,
      });
    } catch (erro) {
      this.armazenamento.contas[idConta] = JSON.parse(anterior);
      console.error("Não foi possível gravar o saldo no MQTT:", erro.message);
      this.responder(pedido, {
        tipo,
        ok: false,
        saldo: this.armazenamento.contas[idConta].saldo,
        erro: "SALDO INDISPONÍVEL",
      });
    }
  }

  async receberCompra(mensagem, topico) {
    let evento;
    try {
      evento = JSON.parse(mensagem.toString());
    } catch {
      return;
    }
    const email = normalizarEmail(evento?.email);
    console.info("Evento MQTT da Feira recebido:", {
      topico,
      produto: evento?.product,
      temEmail: Boolean(email),
    });
    if (Number(evento?.product) !== 101 || !email) return;
    if (!this.pronto) {
      this.operacoesPendentes.push(() => this.receberCompra(mensagem));
      return;
    }
    const idConta = await this.hashEmail(email);
    if (!this.armazenamentoDisponivel) {
      console.error("Compra recebida, mas o armazenamento MQTT de moedas não está disponível.");
      return;
    }
    const conta = this.obterContaPorId(idConta);
    const idCompra = evento.transactionId || evento.purchaseId || evento.orderId || evento.id;
    if (idCompra && conta.compras.includes(String(idCompra))) return;
    const anterior = JSON.stringify(conta);
    conta.saldo += 1;
    if (idCompra) conta.compras.push(String(idCompra));
    if (conta.compras.length > 2000) conta.compras.splice(0, conta.compras.length - 2000);
    try {
      await this.salvarArmazenamento();
      console.info(`Compra creditada no armazenamento MQTT. Saldo: ${conta.saldo}.`);
    } catch (erro) {
      this.armazenamento.contas[idConta] = JSON.parse(anterior);
      console.error("Não foi possível gravar a compra no MQTT:", erro.message);
    }
  }

  conectarCompras() {
    this.clienteCompras = this.mqtt.connect(URL_BROKER_FEIRA, {
      clientId: CLIENT_ID_COMPRAS,
      clean: false,
      reconnectPeriod: 5000,
    });
    this.clienteCompras.on("connect", () => {
      console.info("Cofre conectado ao MQTT da Feira.");
      this.clienteCompras.subscribe(TOPICO_COMPRAS_FEIRA, { qos: 1 }, (erro) => {
        if (erro) console.error("Não foi possível assinar as compras da Feira:", erro.message);
        else console.info("Assinatura das compras da Feira aceita.");
      });
    });
    this.clienteCompras.on("message", (topico, mensagem) => {
      this.enfileirar(() => this.receberCompra(mensagem, topico));
    });
    this.clienteCompras.on("error", (erro) => console.error("MQTT de compras SNR:", erro.message));
  }

  responder(pedido, resposta) {
    const clientId = String(pedido?.clientId || "");
    if (!/^snr-espectador-[A-Z]{4}$/.test(clientId) || !this.clienteJogo?.connected) return;
    this.clienteJogo.publish(
      `${this.prefixoTopico}/spectator/coins/response/${clientId}`,
      JSON.stringify({ ...resposta, email: normalizarEmail(pedido.email), requestId: pedido.requestId }),
      { qos: 1 },
      (erro) => {
        if (erro) console.error("Falha ao publicar resposta de moedas:", erro.message);
      },
    );
  }
}
