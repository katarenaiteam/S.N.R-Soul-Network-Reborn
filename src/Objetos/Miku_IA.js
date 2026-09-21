const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const centro = p => (p.left + p.right) / 2;

export default class Miku_IA {
  constructor(controller) {
    this.ctrl = controller;
    this.agressividade = 0.25;
    this.observacoes = new WeakMap();
    this.proximaDecisao = 0;
    this.proximoAtaque = 700;
    this.ultimoPulo = -Infinity;
    this.usos = new Map();
    this.rota = null;
    this.descida = null;
    this.proximaRecuperacao = 0;
    this.apoiosAlvo = new WeakMap();
  }

  definirAlvo() {
    const { scene, bot } = this.ctrl;
    return [scene.jogador1, scene.jogador2]
      .filter(p => p?.sprite?.active && !p.eliminado && !p.emMorteVS && p.vidas !== 0)
      .sort((a, b) => Math.hypot(a.sprite.x - bot.sprite.x, a.sprite.y - bot.sprite.y) -
        Math.hypot(b.sprite.x - bot.sprite.x, b.sprite.y - bot.sprite.y))[0];
  }

  observar(alvo, time, delta) {
    // Apenas acoes visiveis: nao consulta teclas nem antecipa inputs humanos.
    const estado = alvo.maquinaEstados?.estadoAtual;
    const anim = alvo.sprite.anims?.currentAnim?.key;
    const anterior = this.observacoes.get(alvo) ?? { estado: null, anim: null, pressao: 0.25 };
    const atacando = ['atack', 'special', 'ult'].includes(estado?.nome);
    if (['atack', 'special'].includes(anterior.estado) && !atacando) this.punirAte = time + 450;
    const dt = clamp(delta ?? 16.67, 0, 100);
    let pressao = anterior.pressao * Math.exp(-dt / 6500);
    if (atacando && (estado?.nome !== anterior.estado || anim !== anterior.anim ||
        estado.tempoInicio !== anterior.inicio)) pressao += 0.14;
    const dx = this.ctrl.bot.sprite.x - alvo.sprite.x;
    const avancando = Math.sign(alvo.sprite.body.velocity.x) === Math.sign(dx) &&
      Math.abs(alvo.sprite.body.velocity.x) > 60 && Math.abs(dx) < 650;
    if (avancando) pressao += dt / 18000;
    pressao = clamp(pressao, 0, 1);
    this.observacoes.set(alvo, { estado: estado?.nome, anim, inicio: estado?.tempoInicio, pressao });
    this.agressividade += (clamp(pressao, 0.18, 0.95) - this.agressividade) * (1 - Math.exp(-dt / 1800));
  }

  update(time, delta) {
    const bot = this.ctrl.bot;
    if (!bot?.sprite?.active || bot.eliminado || bot.emMorteVS ||
        this.ctrl.scene.physics?.world?.isPaused || this.ctrl.scene.partidaEncerrada) {
      this.ctrl.soltarTudo(); this.rota = this.descida = null; return;
    }
    const alvo = this.definirAlvo();
    this.ctrl.alvo = alvo;
    if (!alvo) { this.ctrl.soltarTudo(); return; }
    this.observar(alvo, time, delta);
    const estado = bot.maquinaEstados.estadoAtual;
    if (this.vidasAnteriores !== bot.vidas) {
      this.vidasAnteriores = bot.vidas;
      this.rota = this.descida = this.specialRecuperacao = null;
    }
    if (estado?.ledgeAte > time) {
      this.ctrl.soltarTudo(); this.rota = this.descida = null; return;
    }
    if (['ult', 'dash', 'agarradoFJ', 'teia', 'atordoado'].includes(estado?.nome)) return;
    if (estado?.nome === 'dano') {
      this.ctrl.soltarTudo();
      if (time - estado.tempoInicial >= estado.duracaoStun && !bot.sprite.body.blocked.down) {
        // Dano exige JustDown para sair do tumbling. Segurar direcao nao
        // gera essa borda, e guard nao e um dos comandos aceitos pelo estado.
        const pisos = this.plataformas();
        const seguro = [...pisos].sort((a, b) => this.distancia(bot, a) - this.distancia(bot, b))[0];
        const destino = seguro ? centro(seguro) : alvo.sprite.x;
        this.ctrl.pulsar(destino < bot.sprite.x ? 'esquerda' : 'direita', 100);
        this.proximaRecuperacao = 0;
      }
      return;
    }
    if (estado?.nome === 'special') {
      // O spin aceita direcao durante sua execucao; nao insiste rumo ao vazio.
      if (bot.sprite.anims?.currentAnim?.key === 'miku_spin' && this.apoio(bot)) {
        const p = this.apoio(bot);
        if (bot.sprite.x < p.left + 110 || bot.sprite.x > p.right - 110) this.mover(centro(p));
      }
      return;
    }
    if (estado?.nome === 'atack') { this.combo(bot, time); return; }
    if (estado?.nome === 'guard') {
      if (this.ameacaProxima(bot, alvo, time) && bot.vidaGuard > 15) return;
      // Guard so consome a soltura. O ataque precisa chegar no frame seguinte.
      this.ctrl.soltar('guard');
      this.proximaDecisao = 0;
      this.proximoAtaque = Math.min(this.proximoAtaque, time + 100);
      return;
    }
    // Fora do piso a sobrevivencia tem prioridade e nao depende da agressividade.
    if (!bot.sprite.body.blocked.down && time >= this.proximaRecuperacao) {
      this.proximaRecuperacao = time + 65;
      if (this.recuperar(bot, this.plataformas(), time)) return;
    } else if (!bot.sprite.body.blocked.down && this.recuperando) return;
    if (time < this.proximaDecisao) return;
    this.proximaDecisao = time + 260 - this.agressividade * 130;
    for (const tecla of ['esquerda', 'direita', 'baixo', 'guard']) this.ctrl.soltar(tecla);
    if (estado?.nome === 'dead') {
      this.mover(bot.sprite.x + (alvo.sprite.x < bot.sprite.x ? -30 : 30)); return;
    }
    const lista = this.plataformas();
    // Em um salto seguro, aproveita o alvo no caminho sem esperar o pouso.
    if (!bot.sprite.body.blocked.down && !this.recuperando &&
        this.combater(bot, alvo, time, true)) return;
    if (this.navegar(bot, alvo, lista, time)) return;
    this.combater(bot, alvo, time);
  }

  plataformas() {
    const s = this.ctrl.scene;
    this.atravessaveis = new Set((s.sistemaPlataformasAtravessaveis?.grupo.getChildren() ?? []).map(p => p.body));
    return [...(s.mapaAtual?.plataformas.getChildren() ?? []).map(p => p.body), ...this.atravessaveis]
      .filter(p => p?.enable && p.width > 0 && Number.isFinite(p.top));
  }

  apoio(personagem, lista = this.plataformas()) {
    const b = personagem.sprite.body;
    return lista.find(p => b.right > p.left && b.left < p.right && Math.abs(b.bottom - p.top) < 12);
  }

  mover(x) {
    const bot = this.ctrl.bot, dx = x - bot.sprite.x;
    this.ctrl.soltar('esquerda'); this.ctrl.soltar('direita');
    if (Math.abs(dx) > 10) {
      this.ctrl.segurar(dx < 0 ? 'esquerda' : 'direita');
      bot.sprite.setFlipX(dx < 0);
    }
  }

  pular(bot, time) {
    if (bot.pulos >= bot.maxPulos || time - this.ultimoPulo < 360) return false;
    this.ultimoPulo = time;
    this.ctrl.pulsar('cima', 600);
    return true;
  }

  escolherRota(bot, alvo, lista) {
    const inicio = this.apoio(bot, lista);
    const fim = this.pisoDoAlvo(alvo, lista);
    if (!fim || fim === inicio) return null;
    if (!inicio) return fim;
    const g = this.ctrl.scene.physics.world.gravity?.y || 900;
    const altura = bot.forcaPulo ** 2 / (2 * g) * bot.maxPulos * 0.8;
    const alcance = bot.velocidade * Math.abs(bot.forcaPulo) / g * (bot.maxPulos + 1) * 0.85;
    const fila = [[inicio]], vistos = new Set([inicio]);
    while (fila.length) {
      const caminho = fila.shift(), atual = caminho.at(-1);
      if (atual === fim) return caminho[1];
      for (const p of lista) {
        const vao = Math.max(0, p.left - atual.right, atual.left - p.right);
        if (!vistos.has(p) && atual.top - p.top < altura && vao < alcance) {
          vistos.add(p); fila.push([...caminho, p]);
        }
      }
    }
    return null;
  }

  pisoDoAlvo(alvo, lista) {
    const apoio = this.apoio(alvo, lista), agora = this.ctrl.scene.time.now;
    if (apoio && alvo.sprite.body.blocked.down) {
      this.apoiosAlvo.set(alvo, { piso: apoio, tempo: agora });
      return apoio;
    }
    const anterior = this.apoiosAlvo.get(alvo);
    if (anterior && lista.includes(anterior.piso) && agora - anterior.tempo < 1800 &&
        alvo.sprite.x > anterior.piso.left - 80 && alvo.sprite.x < anterior.piso.right + 80 &&
        alvo.sprite.body.bottom <= anterior.piso.top + 40) return anterior.piso;
    // Escolhe o piso abaixo do alvo, nao uma torre lateral mais proxima no ar.
    return lista.filter(p => alvo.sprite.body.bottom <= p.top + 20 &&
      alvo.sprite.body.right > p.left && alvo.sprite.body.left < p.right)
      .sort((a, b) => a.top - b.top)[0];
  }

  distancia(personagem, p) {
    return Math.abs(personagem.sprite.x - clamp(personagem.sprite.x, p.left, p.right)) +
      Math.abs(personagem.sprite.body.bottom - p.top);
  }

  recuperar(bot, lista, time) {
    const b = bot.sprite.body, x = bot.sprite.x;
    // Inclui o deslocamento do corpo da Miku e a area de ledge externa.
    const margem = b.width / 2 + 60;
    const pouso = lista.find(p => x > p.left + margem && x < p.right - margem && b.bottom <= p.top + 8);
    // Uma descida planejada pode estar no vao mas ainda acima do destino.
    const tempoQueda = this.rota ? (Math.sqrt(Math.max(0, b.velocity.y ** 2 +
      2 * 1100 * (this.rota.top - b.bottom))) - b.velocity.y) / 1100 : 0;
    const descendo = this.rota && this.rota.top > b.bottom + 35 &&
      Math.abs(x - clamp(x, this.rota.left + margem, this.rota.right - margem)) <
        Math.max(100, bot.velocidade * tempoQueda);
    if (pouso || descendo) {
      this.recuperando = false; this.specialRecuperacao = null;
      return false;
    }
    this.recuperando = true;
    this.descida = null;
    const p = [...lista].sort((a, c) => {
      const g = (this.ctrl.scene.physics.world.gravity?.y || 900) + 200;
      const subida = Math.max(0, bot.maxPulos - bot.pulos) * bot.forcaPulo ** 2 / (2 * g) +
        (this.podeSpecial('air_cima') ? 800 ** 2 / (2 * g) : 0) + b.height;
      const custo = q => Math.abs(x - clamp(x, q.left, q.right)) + Math.max(0, b.bottom - q.top) * 1.8 +
        (b.bottom - q.top > subida ? 5000 : 0);
      return custo(a) - custo(c);
    })[0];
    if (!p) return false;
    this.rota = p;
    const acima = b.bottom < p.top - 8;
    const trans = this.atravessaveis.has(p);
    const lateral = Math.abs(x - p.left) < Math.abs(x - p.right) ? -1 : 1;
    let destinoX = acima || trans ? clamp(x, p.left + margem + 10, p.right - margem - 10) :
      lateral < 0 ? p.left - margem : p.right + margem;
    const ledge = this.ctrl.scene.mapaAtual?.areasLedge?.find(a =>
      Math.abs(a.y - p.top) < 65 && Math.abs(a.x - x) < 100 &&
      b.top < a.y + a.altura / 2 && b.bottom > a.y - a.altura / 2);
    if (ledge && b.bottom < p.top + 25) destinoX = ledge.x;
    this.ctrl.soltar('baixo'); this.ctrl.soltar('guard');
    this.mover(destinoX);
    const longe = Math.abs(destinoX - x) > 160;
    const limite = this.ctrl.scene.limitesArena?.maxY ?? 1600;
    const urgente = b.bottom > p.top + 160 || b.bottom > limite - 430;
    const sobPiso = !trans && b.top >= p.bottom - 8 && b.right > p.left && b.left < p.right;
    // O dash atravessa o trecho sob o piso sem perder altura. Guarda os
    // impulsos verticais para a lateral, em vez de gasta-los contra o teto.
    if (sobPiso && longe && bot.podeDarDash?.()) {
      this.ctrl.pulsar('dash'); return true;
    }
    // Alinha a velocidade horizontal no estado jump antes do up-special,
    // que conserva essa velocidade e trava o controle durante a subida.
    if (this.specialRecuperacao && time >= this.specialRecuperacao) {
      this.specialRecuperacao = null;
      if (this.podeSpecial('air_cima')) {
        this.executar('air_cima', true, time);
        return true;
      }
    }
    const espacoPulo = !sobPiso || b.top > p.bottom + 140 || b.bottom > limite - 280;
    if (espacoPulo && (b.velocity.y > -100 || urgente) && this.pular(bot, time)) return true;
    if (!sobPiso && b.velocity.y > -180 && this.podeSpecial('air_cima') &&
        (bot.pulos >= bot.maxPulos || urgente)) {
      if (!acima && !trans) {
        // Ganha altura antes de cruzar a borda, mas sobe voltando para o piso.
        // Subir com velocidade para fora pode bater sob a torre vizinha.
        const altura = Math.max(0, b.bottom - p.top + 20);
        const g = (this.ctrl.scene.physics.world.gravity?.y || 900) + 200;
        const tempoSubida = (800 - Math.sqrt(Math.max(0, 800 ** 2 - 2 * g * altura))) / g;
        const distanciaSegura = 55 + bot.velocidade * tempoSubida;
        if (Math.abs(x - (lateral < 0 ? p.left : p.right)) < distanciaSegura) {
          this.mover(x + lateral * 100);
          return true;
        }
        this.mover(x - lateral * 100);
      }
      this.specialRecuperacao = time + 40;
      return true;
    }
    // O dash ganha distancia e freia a queda. Nao corta uma subida util.
    if (longe && b.velocity.y > -80 && bot.podeDarDash?.()) this.ctrl.pulsar('dash');
    return true;
  }

  navegar(bot, alvo, lista, time) {
    const b = bot.sprite.body, suporte = this.apoio(bot, lista);
    const margem = b.width / 2 + 22;
    if (b.blocked.down) {
      if (suporte === this.rota) this.rota = this.descida = null;
      if (!this.descida) this.rota = this.escolherRota(bot, alvo, lista);
      // Uma rota antiga de recuperacao nunca prende o bot no piso de cima.
      const pisoAlvo = this.pisoDoAlvo(alvo, lista);
      if (suporte && pisoAlvo && pisoAlvo.top > suporte.top + 60) {
        this.rota = this.escolherRota(bot, alvo, lista);
        if (this.descida?.destino !== this.rota) this.descida = null;
      }
    }
    // Mantem a rota de descida ate ultrapassar a lateral da plataforma solida.
    // Sem isso, a recuperacao escolhe o apoio de cima e manda saltar de volta.
    if (this.descida) {
      const { origem, destino, xSaida } = this.descida;
      if ((b.blocked.down && suporte !== origem) || b.bottom > destino.top + 80) {
        this.descida = null;
      } else {
        this.mover(b.top < origem.bottom + 5 ? xSaida : clamp(centro(destino), destino.left + margem, destino.right - margem));
        return true;
      }
    }
    let p = this.rota;
    const pousoSeguro = lista.some(q => bot.sprite.x > q.left + margem &&
      bot.sprite.x < q.right - margem && b.bottom < q.top + 12);
    if (!b.blocked.down && !p && !pousoSeguro) {
      p = [...lista].sort((a, c) => this.distancia(bot, a) - this.distancia(bot, c))[0];
      this.rota = p;
    }
    if (!p) return false;
    if (b.blocked.down && suporte && p.top > suporte.top + 35) {
      if (this.atravessaveis.has(suporte) && this.ctrl.scene.sistemaPlataformasAtravessaveis.descer(bot)) {
        this.mover(clamp(alvo.sprite.x, p.left + margem, p.right - margem));
      } else {
        const saidas = [suporte.left - margem, suporte.right + margem];
        const xSaida = saidas.sort((a, c) => Math.abs(a - centro(p)) - Math.abs(c - centro(p)))[0];
        this.mover(xSaida);
        const vao = Math.max(0, p.left - suporte.right, suporte.left - p.right);
        if (vao > 0) {
          // Plataformas laterais de SkyTowers: salta o vao rumo ao piso baixo.
          if (Math.abs(bot.sprite.x - xSaida) < 85) this.pular(bot, time);
        } else {
          this.descida = { origem: suporte, destino: p, xSaida };
        }
      }
      return true;
    }
    const xPouso = clamp(bot.sprite.x, p.left + margem, p.right - margem);
    const acima = b.bottom < p.top - 8;
    const trans = this.atravessaveis.has(p);
    let x = xPouso;
    if (!acima && !trans) {
      x = Math.abs(bot.sprite.x - p.left) < Math.abs(bot.sprite.x - p.right) ? p.left - margem : p.right + margem;
      // A area de ledge resolve o ultimo trecho da recuperacao junto a borda.
      const ledge = this.ctrl.scene.mapaAtual?.areasLedge?.find(a =>
        Math.abs(a.y - p.top) < 65 && Math.abs(a.x - bot.sprite.x) < 130 &&
        b.top < a.y + a.altura / 2 && b.bottom > a.y - a.altura / 2);
      if (ledge && !b.blocked.down) { this.mover(ledge.x); return true; }
    }
    this.mover(x);
    if (!acima && (trans || Math.abs(bot.sprite.x - x) < 22) &&
        (b.blocked.down || b.velocity.y > -90)) {
      if (!this.pular(bot, time) && !b.blocked.down && this.podeSpecial('air_cima')) {
        this.executar('air_cima', true, time);
      }
    } else if (!b.blocked.down && acima && Math.abs(bot.sprite.x - xPouso) > 160 && bot.podeDarDash?.()) {
      this.ctrl.pulsar('dash');
    }
    return true;
  }

  podeSpecial(tipo) {
    return !!this.ctrl.bot.specials?.[tipo] && this.ctrl.bot.podeUsarSpecial(tipo);
  }

  preparar(tipo) {
    const bot = this.ctrl.bot;
    this.ctrl.soltarTudo();
    if (tipo.includes('cima')) this.ctrl.segurar('cima');
    else if (tipo.includes('agachado')) this.ctrl.segurar('baixo');
    else if (tipo.includes('side') || tipo.includes('lado')) this.ctrl.segurar(bot.sprite.flipX ? 'esquerda' : 'direita');
  }

  executar(tipo, especial, time) {
    this.preparar(tipo);
    this.usos.set(tipo, time);
    // Uma nota por abertura; nao fica carregando indefinidamente.
    this.ctrl.pulsar(especial ? 'special' : 'atack', especial && tipo.includes('neutro') ? 580 : 50);
    this.proximoAtaque = time + (especial ? 1100 : 850) - 450 * this.agressividade;
  }

  combo(bot, time) {
    const e = bot.maquinaEstados.estadoAtual, golpe = e.golpeAtual;
    const chave = `${e.tempoInicio}:${golpe?.comboProximo}`;
    if (golpe?.comboProximo && e.jaAcertou && chave !== this.comboEnviado &&
        time - e.tempoInicio >= golpe.comboJanelaInicio && time - e.tempoInicio <= golpe.comboJanelaFim) {
      this.comboEnviado = chave;
      this.ctrl.pulsar('atack');
      this.proximoAtaque = time + 850 - 450 * this.agressividade;
    }
  }

  linhaLivre(bot, alvo) {
    const y = bot.sprite.y - 65;
    return !this.plataformas().some(p => !this.atravessaveis.has(p) &&
      p.left < Math.max(bot.sprite.x, alvo.sprite.x) && p.right > Math.min(bot.sprite.x, alvo.sprite.x) &&
      p.top < y && p.bottom > y);
  }

  ameacaProxima(bot, alvo, time) {
    const e = alvo.maquinaEstados?.estadoAtual;
    if (!['atack', 'special'].includes(e?.nome) ||
        Math.abs(alvo.sprite.x - bot.sprite.x) > 145 || Math.abs(alvo.sprite.y - bot.sprite.y) > 100) return false;
    const duracao = e.golpeAtual?.duracao ?? e.specialAtual?.duracao;
    // O fim da animacao abre uma oportunidade de resposta, em vez de guarda eterna.
    return !duracao || !Number.isFinite(e.tempoInicio) || time - e.tempoInicio < duracao - 100;
  }

  corredorSeguro(bot, direcao, distancia, noAr = false) {
    const b = bot.sprite.body, fim = bot.sprite.x + direcao * distancia;
    return this.plataformas().some(p => bot.sprite.x > p.left + 40 && bot.sprite.x < p.right - 40 &&
      fim > p.left + 50 && fim < p.right - 50 &&
      (noAr ? b.bottom < p.top + 10 && p.top - b.bottom < 330 : Math.abs(b.bottom - p.top) < 15));
  }

  combater(bot, alvo, time, somenteAtaque = false) {
    const dx = alvo.sprite.x - bot.sprite.x, dy = alvo.sprite.y - bot.sprite.y, dist = Math.abs(dx);
    const chao = bot.sprite.body.blocked.down, estadoAlvo = alvo.maquinaEstados?.estadoAtual?.nome;
    if (dist > 8) bot.sprite.setFlipX(dx < 0);
    const ameaca = this.ameacaProxima(bot, alvo, time);
    // A defesa continua competente mesmo com um jogador pouco agressivo.
    if (ameaca && chao && (bot.vidaGuard ?? 50) > 15) { this.ctrl.segurar('guard'); return true; }
    const suporte = this.apoio(bot);
    const direcao = Math.sign(dx) || 1;
    const spinSeguro = this.corredorSeguro(bot, direcao, 290, !chao);
    const sideSeguro = this.corredorSeguro(bot, direcao, 130, !chao);
    const abertura = time < (this.punirAte ?? 0) || ['dano', 'dead', 'atordoado'].includes(estadoAlvo) ||
      (['atack', 'special'].includes(estadoAlvo) && !ameaca);
    const opcoes = [];
    const adicionar = (tipo, nota, especial = false) => {
      if (especial ? !this.podeSpecial(tipo) : !bot.golpes?.[tipo] || !bot.podeUsarAtaque(tipo)) return;
      opcoes.push({ tipo, especial, nota: nota - (time - (this.usos.get(tipo) ?? -Infinity) < 3500 ? 22 : 0) });
    };
    if ((time >= this.proximoAtaque || (abertura && dist < 190)) && !alvo.estadoInvencible?.ativo) {
      if (chao) {
        if (dist < 90 && Math.abs(dy) < 65) {
          adicionar('neutro1', 100); adicionar('agachado', estadoAlvo === 'crouch' ? 115 : 88);
        }
        if (dist >= 65 && dist < 175 && Math.abs(dy) < 70 && sideSeguro) adicionar('side', abertura ? 125 : 108);
        if (dist > 190 && dist < 650 && Math.abs(dy) < 60 && this.linhaLivre(bot, alvo)) adicionar('neutro', 85, true);
        if (dist >= 130 && dist < 330 && Math.abs(dy) < 65 && spinSeguro && estadoAlvo !== 'guard') adicionar('lado', abertura ? 120 : 98, true);
        const puppet = this.ctrl.scene.alvosAtaqueExtras?.find(p => p.dono === bot && p.ativo && p.alternarModo);
        const desejado = bot.porcentagemDano > 75 && dist > 320 && this.agressividade < 0.5 ? 'suporte' : 'ataque';
        const carga = bot.specials?.agachado?.logica?.obterCarga?.(bot) ?? 1;
        if (dist > 180 && dist < 700 && (!puppet ? carga >= 1 : puppet.modo !== desejado) &&
            time - (this.usos.get('agachado') ?? -Infinity) > 5000) adicionar('agachado', 92, true);
      } else {
        if (dist < 85 && Math.abs(dy) < 110) {
          adicionar(dy < -35 ? 'air_cima' : dy > 40 ? 'air_agachado' : 'air_neutro', 100);
          if (Math.abs(dy) < 55 && dist > 30) adicionar('air_side', abertura || alvo.porcentagemDano > 65 ? 120 : 108);
        }
        if (dist >= 100 && dist < 310 && Math.abs(dy) < 65 && spinSeguro && estadoAlvo !== 'guard') adicionar('air_lado', 110, true);
        // So atira no ar se ha um piso de pouso; guarda up-special para recuperar.
        const piso = this.plataformas().some(p => bot.sprite.x > p.left + 40 && bot.sprite.x < p.right - 40 && bot.sprite.body.bottom < p.top);
        if (piso && dist > 210 && dist < 600 && Math.abs(dy) < 50 && this.linhaLivre(bot, alvo)) adicionar('air_neutro', 80, true);
        if (piso && dy > 90 && dist < 200 && time >= (bot.proximaInvocacaoMiniPuppets ?? 0) && bot.pulos < bot.maxPulos) adicionar('air_cima', 70, true);
      }
      if (bot.ult && bot.ultEstaCarregada?.() && (bot.podeUsarUlt?.() ?? true) && chao && dist < 220 && Math.abs(dy) < 75 && this.agressividade > 0.5 && !this.ctrl.scene.ultEmAndamento) {
        this.preparar('neutro');
        if (bot.maquinaEstados.estadoAtual.nome === 'idle') {
          this.ctrl.pulsar('atack'); this.ctrl.pulsar('special');
          this.proximoAtaque = time + 1500;
        }
        return true;
      }
      opcoes.sort((a, b) => b.nota - a.nota);
      if (opcoes.length) { const a = opcoes[0]; this.executar(a.tipo, a.especial, time); return true; }
    }
    if (somenteAtaque) return false;
    const semTiro = !this.podeSpecial(chao ? 'neutro' : 'air_neutro') || !this.linhaLivre(bot, alvo);
    const ideal = abertura || semTiro ? 85 : 280 - 110 * this.agressividade;
    const moverSeguro = destino => this.mover(chao && suporte ?
      clamp(destino, suporte.left + 65, suporte.right - 65) : destino);
    if (Math.abs(dy) > 95) {
      moverSeguro(alvo.sprite.x);
      if (dy < 0 && (chao || bot.sprite.body.velocity.y > -60)) this.pular(bot, time);
    } else if (dist > ideal + 65) {
      moverSeguro(alvo.sprite.x);
    } else if (dist < 140 && suporte && time < this.proximoAtaque) {
      const recuo = bot.sprite.x - Math.sign(dx || 1) * 90;
      if (recuo > suporte.left + 55 && recuo < suporte.right - 55) this.mover(recuo);
    }
    return false;
  }
}
