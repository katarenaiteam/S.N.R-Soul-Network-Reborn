const ANIMACOES = { SpiderMan: "intro", Ken: "intro", Miku: "intro", Slenderman: "intro" };

const FIM_POSE_P1 = 0.27;
const INICIO_POSE_P2 = 0.37;
const INICIO_RETORNO = 0.64;
const FIM_RETORNO = 0.84;

// O retorno acontece no "1"; o Fight ja usa o enquadramento da luta.
export default class IntroPartida {
  constructor(scene) {
    this.scene = scene;
    this.ativa = true;
    this.tempo = 0;
    this.etapa = -1;
    this.finaisAnimacao = new Map();
    this.jogadores = [scene.jogador1, scene.jogador2];
    this.nomes = [scene.escolhaP1, scene.escolhaP2];
    this.sons = ["narrador-3-2-1", "narrador-fight"].map(chave =>
      scene.cache.audio.exists(chave) ? scene.sound.add(chave) : null);
    this.duracaoContagem = (this.sons[0]?.duration || 3) * 1000;
    this.duracaoFight = (this.sons[1]?.duration || 1) * 1000;
    this.sons.forEach((som, indice) => som?.once("complete", () => {
      this.tempo = indice === 0 ? this.duracaoContagem : this.duracaoFight;
      this.atualizar(0);
    }));
    this.visual = scene.add.sprite(scene.scale.width / 2, scene.scale.height * 0.3, "3.png")
      .setScrollFactor(0).setDepth(3000).setVisible(false);
    scene.camJogo.ignore(this.visual);
    this.limitarCamera = scene.camJogo.useBounds;
    scene.camJogo.useBounds = false;
    scene.physics.world.pause();
    this.jogadores.forEach((jogador, i) => {
      jogador.sprite.setVelocity(0, 0);
      jogador.sprite.setFlipX(i === 1);
      // O construtor base entra em idle antes de receber as configs da subclasse.
      // Aplicar explicitamente tambem inicializa quem ainda espera sua vez.
      jogador.aplicarConfiguracao("idle");
      this.sincronizarCorpo(jogador);
    });
    this.focar(this.alvoJogador(0));
    this.iniciar = () => {
      this.iniciada = true;
      this.visual.setVisible(true);
      this.sons[0]?.play();
      this.apresentar(0);
    };
    // Espera o desbloqueio para a imagem nunca correr na frente da voz.
    if (scene.sound.locked) scene.sound.once("unlocked", this.iniciar);
    else this.iniciar();
    this.encerrar = () => this.destruir();
    scene.events.once("shutdown", this.encerrar);
    this.pular = () => this.finalizar();
    scene.input.keyboard.on("keydown-ESC", this.pular);
  }

  alvoJogador(indice) {
    const sprite = this.jogadores[indice].sprite;
    return { x: sprite.x, y: sprite.y - 55,
      zoom: this.scene.mapaAtual.configCamera?.maxZoom ?? 2 };
  }

  alvoLuta() {
    const [a, b] = this.jogadores.map(j => j.sprite);
    const cfg = this.scene.mapaAtual.configCamera || {};
    const min = cfg.distMinima ?? 100;
    const max = cfg.distMaxima ?? 1200;
    const fator = Math.max(0, Math.min(1, (Math.hypot(a.x - b.x, a.y - b.y) - min) / (max - min)));
    const zoom = (cfg.maxZoom ?? 2) + ((cfg.minZoom ?? 1) - (cfg.maxZoom ?? 2)) * fator;
    let x = (a.x + b.x) / 2;
    let y = (a.y + b.y) / 2;
    const lim = cfg.limites;
    if (lim) {
      const metadeX = this.scene.camJogo.width / zoom / 2;
      const metadeY = this.scene.camJogo.height / zoom / 2;
      x = Math.max(lim.x + metadeX, Math.min(x, lim.x + lim.largura - metadeX));
      y = Math.max(lim.y + metadeY, Math.min(y, lim.y + lim.altura - metadeY));
    }
    return { x, y, zoom };
  }

  focar(alvo) {
    this.scene.camJogo.setZoom(alvo.zoom).centerOn(alvo.x, alvo.y);
  }

  mover(de, para, progresso) {
    const t = Math.max(0, Math.min(1, progresso));
    const suave = t * t * (3 - 2 * t);
    this.focar({ x: de.x + (para.x - de.x) * suave,
      y: de.y + (para.y - de.y) * suave,
      zoom: de.zoom + (para.zoom - de.zoom) * suave });
  }

  apresentar(indice) {
    this.etapa = indice;
    const jogador = this.jogadores[indice];
    const nome = ANIMACOES[this.nomes[indice]];
    const chave = `${jogador.prefixoAnim}${nome}`;
    if (!nome || !this.scene.anims.exists(chave)) return;
    const evento = `animationcomplete-${chave}`;
    const callback = () => {
      if (this.ativa) this.voltarIdle(jogador);
    };
    this.finaisAnimacao.set(jogador, { evento, callback });
    jogador.sprite.once(evento, callback);
    // Override local: inclusive a provocacao da Miku toca somente uma vez.
    jogador.sprite.play({ key: chave, repeat: 0, duration: this.duracaoContagem * FIM_POSE_P1 });
    // A textura nova precisa estar ativa antes de calcular tamanho e offsets.
    jogador.aplicarConfiguracao(nome);
    this.sincronizarCorpo(jogador);
  }

  voltarIdle(jogador) {
    const fim = this.finaisAnimacao.get(jogador);
    if (fim) jogador.sprite.off(fim.evento, fim.callback);
    this.finaisAnimacao.delete(jogador);
    jogador.tocarAnimacao("idle");
    jogador.aplicarConfiguracao("idle");
    this.sincronizarCorpo(jogador);
  }

  sincronizarCorpo(jogador) {
    jogador.atualizarOffsetFisica();
    const body = jogador.sprite.body;
    body.updateFromGameObject();
    body.prev.copy(body.position);
    body.prevFrame.copy(body.position);
    jogador.sincronizarHurtbox();
  }

  atualizar(delta) {
    if (!this.ativa || !this.iniciada) return;
    const som = this.sons[this.fight ? 1 : 0];
    // Usa o relogio do audio quando disponivel; sem audio, usa o da cena.
    if (som?.isPlaying && Number.isFinite(som.seek)) this.tempo = som.seek * 1000;
    else this.tempo += delta;
    if (!this.fight) {
      const progresso = this.tempo / this.duracaoContagem;
      this.visual.setTexture(`${Math.max(1, 3 - Math.floor(progresso * 3))}.png`).setDisplaySize(148, 176);
      if (progresso >= FIM_POSE_P1 && progresso < INICIO_POSE_P2) {
        this.mover(this.alvoJogador(0), this.alvoJogador(1),
          (progresso - FIM_POSE_P1) / (INICIO_POSE_P2 - FIM_POSE_P1));
      } else if (progresso >= INICIO_POSE_P2) {
        if (this.etapa !== 1) this.apresentar(1);
        if (progresso >= INICIO_RETORNO) {
          this.mover(this.alvoJogador(1), this.alvoLuta(),
            (progresso - INICIO_RETORNO) / (FIM_RETORNO - INICIO_RETORNO));
        } else this.focar(this.alvoJogador(1));
      }
      if (this.tempo >= this.duracaoContagem && !som?.isPlaying) {
        this.fight = true;
        this.tempo = 0;
        this.jogadores.forEach(j => this.voltarIdle(j));
        this.sons[1]?.play();
        this.visual.setTexture("Fight", 0).setDisplaySize(630, 198);
      }
    } else {
      const progresso = this.tempo / this.duracaoFight;
      this.visual.setFrame(Math.min(9, Math.floor(progresso * 10)));
      this.focar(this.alvoLuta());
      if (progresso >= 1 && !som?.isPlaying) this.finalizar();
    }
    // A fisica esta pausada, mas os frames das animacoes continuam trocando.
    if (this.ativa) this.jogadores.forEach(j => this.sincronizarCorpo(j));
  }

  finalizar() {
    if (!this.ativa) return;
    this.focar(this.alvoLuta());
    this.jogadores.forEach(j => {
      this.voltarIdle(j);
      j.controle?.atualizar();
      j.controle?.salvarAnterior();
    });
    this.scene.physics.world.resume();
    this.destruir();
  }

  destruir() {
    this.ativa = false;
    this.finaisAnimacao.forEach(({ evento, callback }, jogador) => {
      jogador.sprite.off(evento, callback);
    });
    this.finaisAnimacao.clear();
    this.scene.camJogo.useBounds = this.limitarCamera;
    this.scene.sound.off("unlocked", this.iniciar);
    this.scene.events.off("shutdown", this.encerrar);
    this.scene.input.keyboard.off("keydown-ESC", this.pular);
    this.sons.forEach(som => som?.destroy());
    this.visual.destroy();
  }
}
