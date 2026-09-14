const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

export default class Spider_IA {
  constructor(controller) {
    this.botCtrl=controller;
    this.proximaDecisao=0;
    this.ultimoPulo=-Infinity;
    this.segurarPuloAte=0;
    this.destino=null;
    this.usos=new Map();
    this.comboEnviado=null;
  }

  update(time) {
    const bot=this.botCtrl.bot, alvo=this.definirAlvo();
    this.botCtrl.alvo=alvo;
    if (!bot?.sprite?.active || bot.eliminado || !alvo || this.botCtrl.scene.physics?.world?.isPaused) {
      this.botCtrl.soltarTudo(); return;
    }
    const estado=bot.maquinaEstados.estadoAtual;
    if (['ult','special','dash','agarradoFJ','teia','atordoado'].includes(estado?.nome)) return;
    if (estado?.nome==='dano' && time-estado.tempoInicial<estado.duracaoStun) {
      this.botCtrl.soltarTudo(); return;
    }
    if (estado?.nome==='atack') { this.processarCombo(bot,time); return; }
    if (time<this.proximaDecisao) return;
    this.proximaDecisao=time+100;
    for (const tecla of ['esquerda','direita','baixo','guard']) this.botCtrl.soltar(tecla);
    if (time>=this.segurarPuloAte) this.botCtrl.soltar('cima');
    if (bot.sprite.body.blocked.down) this.destino=null;
    if (this.processarRecuperacaoBorda(bot,time)) return;
    this.tomarDecisao(bot,alvo,time);
  }

  mover(bot,x) {
    const dx=x-bot.sprite.x;
    this.botCtrl.soltar('esquerda'); this.botCtrl.soltar('direita');
    if (Math.abs(dx)>12) {
      this.botCtrl.segurar(dx<0?'esquerda':'direita');
      bot.sprite.setFlipX(dx<0);
    }
  }

  pular(bot,time) {
    if (bot.pulos>=bot.maxPulos || time-this.ultimoPulo<280) return false;
    this.ultimoPulo=time; this.segurarPuloAte=time+550;
    this.botCtrl.pulsar('cima',550);
    return true;
  }

  plataformas() {
    return (this.botCtrl.scene.mapaAtual?.plataformas?.getChildren()??[])
      .map(p=>p.body).filter(b=>b?.enable && Number.isFinite(b.top) && b.width>0);
  }

  apoio(bot,lista=this.plataformas()) {
    const pe=bot.sprite.body.bottom??bot.sprite.y;
    return lista.find(p=>bot.sprite.x>=p.left-10 && bot.sprite.x<=p.right+10 && Math.abs(pe-p.top)<35);
  }

  distancia(sprite,p) {
    return Math.abs(sprite.x-clamp(sprite.x,p.left+25,p.right-25))+Math.abs(sprite.y-p.top);
  }

  escolherRota(bot,alvo,lista) {
    const inicio=this.apoio(bot,lista);
    const fim=[...lista].sort((a,b)=>this.distancia(alvo.sprite,a)-this.distancia(alvo.sprite,b))[0];
    if (!fim || fim===inicio) return null;
    if (!inicio) return this.destino??fim;
    const g=this.botCtrl.scene.physics?.world?.gravity?.y||900;
    const altura=bot.forcaPulo**2/(2*g)*bot.maxPulos*0.85;
    const alcance=bot.velocidade*Math.abs(bot.forcaPulo)/g*(bot.maxPulos+1);
    const fila=[[inicio]], vistos=new Set([inicio]);
    while (fila.length) {
      const caminho=fila.shift(), atual=caminho.at(-1);
      if (atual===fim) return caminho[1];
      for (const p of lista) {
        const vao=Math.max(0,p.left-atual.right,atual.left-p.right);
        if (!vistos.has(p) && atual.top-p.top<=altura && vao<=alcance) {
          vistos.add(p); fila.push([...caminho,p]);
        }
      }
    }
    return null;
  }

  navegar(bot,p,time) {
    const b=bot.sprite.body, pe=b.bottom??bot.sprite.y;
    const margem=(b.width??60)/2+25;
    const acima=pe<p.top-15;
    let x=clamp(bot.sprite.x,p.left+margem,p.right-margem);
    const suporte=this.apoio(bot);
    if (b.blocked.down && suporte && p.top>pe+40) {
      // Para descer de uma plataforma solida e preciso sair pela borda.
      const centro=(p.left+p.right)/2;
      this.mover(bot,centro<bot.sprite.x?suporte.left-margem:suporte.right+margem);
      return;
    }
    // Plataformas solidas: contorna a lateral antes de subir sobre elas.
    if (!acima) {
      const esq=p.left-margem, dir=p.right+margem;
      x=Math.abs(bot.sprite.x-esq)<Math.abs(bot.sprite.x-dir)?esq:dir;
    }
    this.mover(bot,x);
    if (Math.abs(bot.sprite.x-x)<18) bot.sprite.setFlipX(bot.sprite.x>(p.left+p.right)/2);
    const foraDaColuna=bot.sprite.x<=p.left-margem || bot.sprite.x>=p.right+margem;
    if (pe>p.top-20 && (Math.abs(bot.sprite.x-x)<18 || (!b.blocked.down && foraDaColuna)) && (b.blocked.down || b.velocity.y>-80)) {
      if (this.pular(bot,time)) return;
      if (!b.blocked.down && this.podeSpecial(bot,'air_cima') && this.podeAncorar(bot,p)) this.special(bot,'air_cima',time);
    }
  }

  podeAncorar(bot,p) {
    const altura=bot.sprite.y-75-p.top;
    if (altura<0 || altura>550) return false;
    const x=bot.sprite.x+(bot.sprite.flipX?-1:1)*(28+altura*0.75);
    return x>=p.left-15 && x<=p.right+15;
  }

  processarRecuperacaoBorda(bot,time=this.botCtrl.scene.time.now) {
    if (bot.sprite.body.blocked.down) return false;
    const lista=this.plataformas(); if (!lista.length) return false;
    const pe=bot.sprite.body.bottom??bot.sprite.y;
    if (lista.some(p=>bot.sprite.x>p.left+20 && bot.sprite.x<p.right-20 && pe<=p.top+15)) return false;
    const p=[...lista].sort((a,b)=>this.distancia(bot.sprite,a)-this.distancia(bot.sprite,b))[0];
    this.destino=p; this.navegar(bot,p,time);
    const dx=clamp(bot.sprite.x,p.left+45,p.right-45)-bot.sprite.x;
    if (pe<p.top-35 && Math.abs(dx)>180 && this.podeDash(bot)) {
      this.mover(bot,bot.sprite.x+dx); this.botCtrl.pulsar('dash');
    } else if (bot.pulos>=bot.maxPulos && pe<p.top-35 && Math.abs(dx)>100 && this.podeSpecial(bot,'air_lado')) {
      this.special(bot,'air_lado',time);
    }
    return true;
  }

  podeDash(bot) {
    return bot.podeDarDash?bot.podeDarDash():bot.podeDash && bot.dashs<bot.maxDash;
  }

  podeSpecial(bot,tipo) {
    return !!bot.specials?.[tipo]?.animacao && bot.podeUsarSpecial(tipo);
  }

  prepararGolpe(bot,tipo) {
    this.botCtrl.soltarTudo(); this.segurarPuloAte=0;
    if (tipo.includes('cima')) this.botCtrl.segurar('cima');
    else if (tipo.includes('agachado')) this.botCtrl.segurar('baixo');
    else if (tipo.includes('lado') || tipo.includes('side')) this.botCtrl.segurar(bot.sprite.flipX?'esquerda':'direita');
  }

  special(bot,tipo,time) {
    this.prepararGolpe(bot,tipo); this.usos.set(tipo,time); this.botCtrl.pulsar('special');
  }

  processarCombo(bot,time=this.botCtrl.scene.time.now) {
    const estado=bot.maquinaEstados.estadoAtual, golpe=estado.golpeAtual;
    const chave=String(estado.tempoInicio)+':'+golpe?.comboProximo;
    if (golpe?.comboProximo && estado.jaAcertou && this.comboEnviado!==chave &&
      time-estado.tempoInicio>=golpe.comboJanelaInicio && time-estado.tempoInicio<=golpe.comboJanelaFim) {
      this.comboEnviado=chave; this.botCtrl.pulsar('atack'); return true;
    }
    return false;
  }

  tomarDecisao(bot,alvo,time=this.botCtrl.scene.time.now) {
    const dx=alvo.sprite.x-bot.sprite.x, dy=alvo.sprite.y-bot.sprite.y, dist=Math.abs(dx);
    const chao=bot.sprite.body.blocked.down;
    if (dist>10) bot.sprite.setFlipX(dx<0);
    const lista=this.plataformas(), rota=this.destino??this.escolherRota(bot,alvo,lista);
    if (rota && (Math.abs(dy)>90 || (this.destino && !chao))) {
      // Completa o pouso antes de trocar a rota por um ataque no meio do salto.
      this.destino=rota; this.navegar(bot,rota,time); return;
    }
    if (dy<-95) {
      this.mover(bot,alvo.sprite.x);
      if (chao || bot.sprite.body.velocity.y>-80) this.pular(bot,time);
      return;
    }
    if (chao && bot.ult && bot.ultEstaCarregada() && !this.botCtrl.scene.ultEmAndamento && dist<240 && Math.abs(dy)<80) {
      this.prepararGolpe(bot,'neutro');
      // Walk reconhece ataque antes da ult: aguarda voltar para idle.
      if (bot.maquinaEstados.estadoAtual.nome!=='idle') return;
      this.botCtrl.pulsar('atack'); this.botCtrl.pulsar('special'); return;
    }
    const opcoes=[];
    const adicionar=(tipo,nota,especial=false)=>{
      if (!(especial?this.podeSpecial(bot,tipo):bot.golpes?.[tipo] && bot.podeUsarAtaque(tipo))) return;
      const recente=time-(this.usos.get(tipo)??-Infinity)<2400?30:0;
      opcoes.push({tipo,nota:nota-recente,especial});
    };
    const ameaca=['atack','special'].includes(alvo.maquinaEstados?.estadoAtual?.nome) && dist<150 && Math.abs(dy)<90;
    if (chao) {
      if (ameaca) adicionar('agachado',110,true);
      if (dist>=180 && dist<650 && Math.abs(dy)<65) adicionar('neutro',90,true);
      if (dist>=90 && dist<210 && Math.abs(dy)<60 && alvo.maquinaEstados?.estadoAtual?.nome!=='guard') adicionar('lado',78,true);
      if (dist<110 && Math.abs(dy)<65) { adicionar('neutro1',85); adicionar('agachado',70); adicionar('side',65); }
    } else {
      if (dist<110 && Math.abs(dy)<100) { adicionar(dy<-35?'air_cima':dy>40?'air_agachado':'air_neutro',90); adicionar('air_side',75); }
      if (dist>120 && dist<320 && Math.abs(dy)<90) adicionar('air_lado',80,true);
      if (dist>150 && dist<500 && dy>50 && dy<280) adicionar('air_agachado',85,true);
      if (dist>180 && dist<600 && Math.abs(dy)<55) adicionar('air_neutro',85,true);
      if (dy<-45 && dist>45 && dist<250) adicionar('air_cima',85,true);
    }
    opcoes.sort((a,b)=>b.nota-a.nota);
    if (opcoes.length) {
      const acao=opcoes[0];
      if (acao.especial) this.special(bot,acao.tipo,time);
      else { this.prepararGolpe(bot,acao.tipo); this.usos.set(acao.tipo,time); this.botCtrl.pulsar('atack'); }
      return;
    }
    if (ameaca && chao) { this.botCtrl.segurar('guard'); return; }
    this.mover(bot,alvo.sprite.x);
    const apoio=this.apoio(bot,lista), fimDash=bot.sprite.x+Math.sign(dx)*190;
    if (chao && dist>300 && Math.abs(dy)<90 && apoio && fimDash>apoio.left+45 && fimDash<apoio.right-45 && this.podeDash(bot)) {
      this.botCtrl.pulsar('dash');
    } else if (chao && apoio && dist>100 && (dx>0?bot.sprite.x>apoio.right-60:bot.sprite.x<apoio.left+60)) this.pular(bot,time);
  }

  definirAlvo() {
    const s=this.botCtrl.scene, bot=this.botCtrl.bot;
    if (!s || !bot?.sprite) return null;
    return [s.jogador1,s.jogador2].filter(p=>p!==bot && p?.sprite?.active && !p.eliminado && (p.vidas===undefined || p.vidas>0))
      .sort((a,b)=>Math.hypot(a.sprite.x-bot.sprite.x,a.sprite.y-bot.sprite.y)-Math.hypot(b.sprite.x-bot.sprite.x,b.sprite.y-bot.sprite.y))[0]??null;
  }
}
