export default class Spider_IA {
  constructor(botController) {
    this.botCtrl = botController;
    this.tempoUltimaDecisao = 0;
    this.tempoReacao = 100;
  }

  update(time) {
    // Busca o alvo ativo no frame atual
    this.botCtrl.alvo = this.definirAlvo();

    const bot = this.botCtrl.bot;
    const alvo = this.botCtrl.alvo;

    if (!bot?.sprite?.active) return;

    // Se o player acabou de morrer ou não há alvo, reseta inputs e aguarda o respawn
    if (!alvo?.sprite?.active) {
      this.botCtrl.soltarTudo();
      return;
    }

    // 1. AJUSTE DE ORIENTAÇÃO AO LEVAR DANO (Garante virar para quem atacou)
    const estadoAtual = bot.maquinaEstados?.estadoAtual?.nome;
    if (estadoAtual === "hurt") {
      const direcaoInimigo = alvo.sprite.x - bot.sprite.x;
      if (direcaoInimigo !== 0) {
        bot.sprite.setFlipX(direcaoInimigo < 0);
      }
      return;
    }

    // 2. CORREÇÃO DO BUG DE FICAR PRESO NO CHÃO (Descongestiona pulo e queda)
    const noChao = bot.sprite.body.blocked.down;
    if (noChao && (estadoAtual === "fall" || estadoAtual === "jump")) {
      // Solta o pulo/baixo para permitir a transição imediata para o EstadoIdle
      this.botCtrl.soltar("cima");
      this.botCtrl.soltar("baixo");
    }

    // 3. RECUPERAÇÃO DE ARENA (Prioridade Máxima)
    if (this.processarRecuperacaoBorda(bot)) {
      return;
    }

    // 4. EXECUÇÃO DE COMBOS DE MANEIRA FLUIDA
    if (this.processarCombo(bot)) {
      return;
    }

    // 5. TOMADA DE DECISÃO TÁTICA
    if (time > this.tempoUltimaDecisao + this.tempoReacao) {
      this.tomarDecisao(bot, alvo);
      this.tempoUltimaDecisao = time;
    }
  }

  processarRecuperacaoBorda(bot) {
    const noChao = bot.sprite.body.blocked.down;
    const limites = this.botCtrl.scene.limitesArena;

    if (noChao || !limites) return false;

    const x = bot.sprite.x;
    const y = bot.sprite.y;

    const foraEsquerda = x < limites.minX + 120;
    const foraDireita = x > limites.maxX - 120;
    const muitoBaixo = y > 600;

    if (foraEsquerda || foraDireita || muitoBaixo) {
      this.botCtrl.soltarTudo();

      const centroX = (limites.minX + limites.maxX) / 2;
      if (x < centroX) {
        this.botCtrl.segurar("direita");
      } else {
        this.botCtrl.segurar("esquerda");
      }

      if (bot.pulos < bot.maxPulos) {
        this.botCtrl.pulsar("cima");
      } else if (bot.podeDash) {
        this.botCtrl.pulsar("dash");
      }

      return true;
    }

    return false;
  }

  processarCombo(bot) {
    const estadoAtual = bot.maquinaEstados?.estadoAtual;

    if (estadoAtual?.nome === "atack" || estadoAtual?.golpeAtual) {
      const golpe = estadoAtual.golpeAtual;

      if (golpe?.comboProximo && estadoAtual.jaAcertou) {
        const tempoDecorrido = bot.scene.time.now - estadoAtual.tempoInicio;

        if (tempoDecorrido >= golpe.comboJanelaInicio && tempoDecorrido <= golpe.comboJanelaFim) {
          this.botCtrl.pulsar("atack");
          return true;
        }
      }
    }
    return false;
  }

  tomarDecisao(bot, alvo) {
    const dx = alvo.sprite.x - bot.sprite.x;
    const dy = alvo.sprite.y - bot.sprite.y;
    const dist = Math.abs(dx);
    const botNoChao = bot.sprite.body.blocked.down;

    const nomeEstadoAlvo = alvo.maquinaEstados?.estadoAtual?.nome || "idle";
    const nomeEstadoBot = bot.maquinaEstados?.estadoAtual?.nome || "idle";

    // Se o bot estiver executando um golpe, bloqueado ou apanhando, ignora novas ordens
    if (nomeEstadoBot === "atack" || nomeEstadoBot === "special" || nomeEstadoBot === "hurt") {
      return;
    }

    this.botCtrl.soltarTudo();

    let utilidade = {
      teiaLongaDistancia: 0,
      comboCurtaDistancia: 0,
      ataqueComDirecional: 0,
      antiAereo: 0,
      aproximar: 0,
      defender: 0
    };

    if (dist > 250 && Math.abs(dy) < 80) {
      utilidade.teiaLongaDistancia += 90;
    }

    if (dist <= 110 && Math.abs(dy) < 60) {
      utilidade.comboCurtaDistancia += 80;
      utilidade.ataqueComDirecional += 65;
    }

    if (dy < -60 && dist < 120) {
      utilidade.antiAereo += 85;
    }

    if (nomeEstadoAlvo === "atack" && dist < 130) {
      utilidade.defender += 60;
    }

    if (dist > 110) {
      utilidade.aproximar += 85;
    }

    let melhorAcao = "esperar";
    let maiorNota = 10;

    for (const [acao, nota] of Object.entries(utilidade)) {
      let notaComVariacao = nota + (Math.random() * 5);
      if (notaComVariacao > maiorNota) {
        maiorNota = notaComVariacao;
        melhorAcao = acao;
      }
    }

    const direcao = dx > 0 ? "direita" : "esquerda";

    switch (melhorAcao) {
      case "teiaLongaDistancia":
        this.botCtrl.segurar(direcao);
        this.botCtrl.pulsar("special");
        break;

      case "comboCurtaDistancia":
        this.botCtrl.pulsar("atack");
        break;

      case "ataqueComDirecional":
        this.botCtrl.segurar(direcao);
        this.botCtrl.pulsar("atack");
        break;

      case "antiAereo":
        if (botNoChao) {
          this.botCtrl.segurar("cima");
          this.botCtrl.pulsar("atack");
        }
        break;

      case "defender":
        this.botCtrl.segurar("guard");
        break;

      case "aproximar":
        this.botCtrl.segurar(direcao);
        if (dist > 220 && Math.random() < 0.35) {
          this.botCtrl.pulsar("dash");
        }
        break;
    }
  }

  definirAlvo() {
    const s = this.botCtrl.scene;
    if (!s) return null;

    // Filtra P1 e P2 verificando existência do objeto (ignorando a flag temporária de respawn)
    const alvosValidos = [s.jogador1, s.jogador2].filter(p => p && p.sprite);

    if (alvosValidos.length === 0) return null;

    // Se só houver um jogador vivo, foca nele imediatamente
    const alvosVivos = alvosValidos.filter(p => p.sprite.active && (!p.vidas || p.vidas > 0));
    const candidatos = alvosVivos.length > 0 ? alvosVivos : alvosValidos;

    return candidatos.reduce((maisPerto, atual) => {
      if (!maisPerto) return atual;
      const distMaisPerto = Math.abs(maisPerto.sprite.x - this.botCtrl.bot.sprite.x);
      const distAtual = Math.abs(atual.sprite.x - this.botCtrl.bot.sprite.x);
      return distAtual < distMaisPerto ? atual : maisPerto;
    }, null);
  }
}