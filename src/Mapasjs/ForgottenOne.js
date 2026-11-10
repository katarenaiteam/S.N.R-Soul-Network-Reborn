export default class ForgottenOne {
  constructor(scene) {
    this.scene = scene;
    this.contaTempo = false;
    this.objetosVisuais = [];
    scene.cameras.main.setBackgroundColor("#000000");
    const largura = 1920;
    const altura = 1080;
    this.configCamera = {
      limites: { x: 0, y: 0, largura, altura },
      maxZoom: 2.0,
      minZoom: 0.9,
      distMinima: 100,
      distMaxima: 900,
    };
    this.limitesArena = { minX: -100, maxX: 2020, minY: -200, maxY: 1200 };
    this.spawnsIniciais = { p1: { x: 780, y: 760 }, p2: { x: 1120, y: 650 } };
    this.spawnsRespawn = this.spawnsIniciais;
    this.plataformas = scene.physics.add.staticGroup();
    const plataforma = scene.add.rectangle(960, 900, 760, 36, 0x292929);
    scene.physics.add.existing(plataforma, true);
    this.plataformas.add(plataforma);
    this.plataforma = plataforma;
    this.objetosVisuais.push(plataforma);
    this.areasLedge = [];
  }

  configurarOponente(boss, hud) {
    const scene = this.scene;
    this.boss = boss;
    boss.nomePersonagem = "The Forgotten One";
    boss.vidaBoss = 1000;
    boss.porcentagemDano = 0;
    boss.textoDano?.setVisible(false);
    boss.sprite.setVisible(false);
    boss.sprite.body.setAllowGravity(false);
    boss.sprite.body.setImmovable(true);
    boss.sprite.body.setVelocity(0, 0);
    boss.destruirHurtboxes?.();
    this.zonasHurtbox = [
      { largura: 360, altura: 190, deslocamentoY: -205 },
      { largura: 540, altura: 190, deslocamentoY: -15 },
      { largura: 400, altura: 78, deslocamentoY: 109 },
    ].map((config) => {
      const zona = scene.add.zone(0, 0, config.largura, config.altura);
      boss.grupoHurtbox.add(zona);
      zona.body.setAllowGravity(false);
      zona.body.setImmovable(true);
      zona.body.setSize(config.largura, config.altura);
      zona.body.debugBodyColor = 0x00ff00;
      return { zona, deslocamentoY: config.deslocamentoY };
    });
    hud?.setVisible(false);

    const x = boss.sprite.x;
    const y = boss.sprite.y - 120;
    this.cabeca = scene.add.image(x, y, "forgotten-face")
      .setDisplaySize(600, 600).setDepth(-2);
    const escalaOlho = 0.68;
    this.olhoEsquerdo = scene.add.image(x - 99, y - 77, "forgotten-face-eye")
      .setScale(escalaOlho).setDepth(-2.1);
    this.olhoDireito = scene.add.image(x + 64, y - 77, "forgotten-face-eye")
      .setScale(escalaOlho).setDepth(-2.1);
    this.mao6 = scene.add.image(x - 380, y + 170, "forgotten-hand-6")
      .setScale(220 / 401).setRotation(0).setDepth(-1);
    this.mao7 = scene.add.image(x + 380, y + 170, "forgotten-hand-7")
      .setScale(220 / 401).setRotation(0).setDepth(-1);
    this.estadoEsmagamento = {
      fase: "espera",
      tempo: Phaser.Math.Between(5000, 8000),
      golpes: 0,
      total: 0,
      alvoX: x,
      lado: 1,
      acertoResolvido: false,
      maoAtacante: null,
      plataformasAtacadas: null,
      texturasOriginais: null,
      maosMovidas: null,
      xInicial: x,
      yInicial: y,
      posicoesRetorno: null,
    };
    this.offsetCabecaX = 0;
    this.offsetCabecaY = 0;
    this.ataquesDisponiveis = ["esmagamento"];
    this.ultimoAtaque = null;
    this.repeticoesUltimoAtaque = 0;
    this.maosHurtbox = [this.mao6, this.mao7].map((mao) => {
      const zona = scene.add.zone(mao.x, mao.y, 200, 130);
      boss.grupoHurtbox.add(zona);
      zona.body.setAllowGravity(false);
      zona.body.setImmovable(true);
      zona.body.setSize(200, 130);
      zona.body.debugBodyColor = 0x00ff00;
      return { zona, mao };
    });
    this.zonasHurtbox.push(...this.maosHurtbox);
    boss.hurtboxesAtivas = this.zonasHurtbox.map(({ zona }) => zona);
    boss.sincronizarHurtbox = () => this.atualizarHurtboxes();

    this.superficiesMaosGrupo = scene.physics.add.staticGroup();
    this.superficiesMaos = [this.mao6, this.mao7].map((mao) => {
      const superficie = scene.add.rectangle(mao.x, mao.y + 15, 230, 32, 0xffffff, 0);
      scene.physics.add.existing(superficie, true);
      this.superficiesMaosGrupo.add(superficie);
      superficie.body.checkCollision.up = true;
      superficie.body.checkCollision.down = false;
      superficie.body.checkCollision.left = false;
      superficie.body.checkCollision.right = false;
      return { mao, superficie };
    });
    scene.physics.add.collider(scene.jogador1.sprite, this.superficiesMaosGrupo);
    this.elapsed = 1700;
    this.objetosVisuais.push(this.cabeca, this.olhoEsquerdo, this.olhoDireito, this.mao6, this.mao7);

    boss.receberDano = (quantidade) => {
      boss.vidaBoss = Math.max(0, boss.vidaBoss - Math.max(0, Number(quantidade) || 0));
      return true;
    };
    boss.atualizarCargaUlt = () => {};
    boss.update = () => {};
    this.atualizarNoPreUpdate = (_time, delta) => this.atualizarOponente(delta, boss);
    scene.events.on(Phaser.Scenes.Events.PRE_UPDATE, this.atualizarNoPreUpdate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.PRE_UPDATE, this.atualizarNoPreUpdate);
    });
    boss.sincronizarHurtbox?.();
  }

  esconderIndicador(indicador) {
    indicador?.setVisible(false);
  }

  atualizar() {}

  atualizarHurtboxes() {
    if (!this.cabeca?.active) return;
    this.zonasHurtbox?.forEach(({ zona, deslocamentoY = 0, mao = null }) => {
      const ancoraX = mao?.x ?? this.cabeca.x;
      const ancoraY = mao?.y ?? this.cabeca.y + deslocamentoY;
      zona.setPosition(ancoraX, ancoraY);
      zona.body.updateFromGameObject();
    });
  }

  atualizarOponente(delta, boss) {
    this.elapsed += delta;
    const fase = this.elapsed * 0.00028;
    const flutuacao = Math.sin(this.elapsed * 0.003) * 18;
    const x = 960 + Math.sin(fase) * 350;
    const y = 390 + Math.sin(fase * 2) * 110 + flutuacao;
    const gesto = Math.sin(this.elapsed * 0.004) * 16;
    this.xBaseAtual = x;
    this.yBaseAtual = y;
    this.gestoAtual = gesto;
    const ataqueAtivo = this.estadoEsmagamento.fase !== "espera";
    let alvoOffsetCabecaX = 0;
    if (ataqueAtivo) {
      alvoOffsetCabecaX = Phaser.Math.Clamp(this.estadoEsmagamento.alvoX - x, -170, 170);
      if (Math.abs(alvoOffsetCabecaX) < 60) {
        alvoOffsetCabecaX = this.estadoEsmagamento.lado * 60;
      }
    }
    const alvoOffsetCabecaY = ataqueAtivo ? 38 : 0;
    const suavizacaoCabeca = Math.min(1, delta * 0.004);
    this.offsetCabecaX = Phaser.Math.Linear(this.offsetCabecaX, alvoOffsetCabecaX, suavizacaoCabeca);
    this.offsetCabecaY = Phaser.Math.Linear(this.offsetCabecaY, alvoOffsetCabecaY, suavizacaoCabeca);
    const cabecaX = x + this.offsetCabecaX;
    const cabecaY = y + this.offsetCabecaY;
    this.cabeca.setPosition(cabecaX, cabecaY);
    const jogador = this.scene.jogador1?.sprite;
    const direcaoX = jogador ? Phaser.Math.Clamp((jogador.x - cabecaX) * 0.015, -6, 6) : 0;
    const direcaoY = jogador ? Phaser.Math.Clamp((jogador.y - cabecaY) * 0.01, -4, 4) : 0;
    const movimentoOlhosX = Math.sin(this.elapsed * 0.0017) * 1.5;
    const movimentoOlhosY = Math.sin(this.elapsed * 0.0023) * 1.2;
    this.olhoEsquerdo.setPosition(cabecaX - 99 + direcaoX + movimentoOlhosX, cabecaY - 77 + direcaoY + movimentoOlhosY);
    this.olhoDireito.setPosition(cabecaX + 64 + direcaoX + movimentoOlhosX, cabecaY - 77 + direcaoY + movimentoOlhosY);
    const maosMovidas = this.estadoEsmagamento.maosMovidas;
    if (this.estadoEsmagamento.fase === "espera" || !maosMovidas?.has(this.mao6)) {
      this.mao6.setPosition(x - 380, y + 170 + gesto);
    }
    if (this.estadoEsmagamento.fase === "espera" || !maosMovidas?.has(this.mao7)) {
      this.mao7.setPosition(x + 380, y + 170 - gesto);
    }
    this.atualizarEsmagamento(delta, this.boss);
    this.superficiesMaos.forEach(({ mao, superficie }) => {
      const xAnterior = superficie.x;
      const topoAnterior = superficie.body.top;
      const corpoJogador = jogador?.body;
      const plataformaAtacada = this.estadoEsmagamento.fase !== "espera" &&
        this.estadoEsmagamento.plataformasAtacadas?.has(superficie);
      superficie.body.checkCollision.up = !plataformaAtacada;
      superficie.setPosition(mao.x, mao.y + 15);
      const deslocamentoX = superficie.x - xAnterior;
      const deslocamentoY = superficie.y - (topoAnterior + superficie.displayHeight / 2);
      const apoiadoNaMao = corpoJogador &&
        superficie.body.checkCollision.up &&
        (corpoJogador.blocked.down || corpoJogador.touching.down || corpoJogador.wasTouching.down) &&
        corpoJogador.velocity.y >= 0 &&
        corpoJogador.right > superficie.body.left && corpoJogador.left < superficie.body.right &&
        corpoJogador.bottom >= topoAnterior - 12 && corpoJogador.bottom <= topoAnterior + 12;
      if (apoiadoNaMao) {
        jogador.x += deslocamentoX;
        jogador.y += deslocamentoY;
        corpoJogador.updateFromGameObject();
      }
      superficie.body.updateFromGameObject();
    });
    boss.sprite.setPosition(x, y + 300);
    this.atualizarHurtboxes();
  }

  atualizarEsmagamento(delta, boss) {
    const ataque = this.estadoEsmagamento;
    const cena = this.scene;
    const jogador = cena.jogador1?.sprite;
    const topoPlataforma = this.plataforma.body.top;
    ataque.tempo -= delta;

    if (ataque.fase === "espera") {
      if (ataque.tempo <= 0) {
        const selecionado = this.selecionarAtaque();
        if (selecionado !== "esmagamento") {
          ataque.tempo = Phaser.Math.Between(5000, 8000);
          return;
        }
        ataque.total = Phaser.Math.Between(4, 6);
        ataque.golpes = 0;
        ataque.ultimoAlvoX = null;
        this.iniciarGolpeEsmagamento(ataque, jogador, topoPlataforma);
      }
      return;
    }

    const mao = ataque.maoAtacante;
    if (!mao) return;

    if (ataque.fase === "subida") {
      const progresso = 1 - Math.max(0, ataque.tempo) / 300;
      mao.setPosition(
        Phaser.Math.Linear(ataque.xInicial, ataque.alvoX, progresso),
        Phaser.Math.Linear(ataque.yInicial, topoPlataforma - 600, progresso),
      );
      if (ataque.tempo <= 0) {
        mao.setPosition(ataque.alvoX, topoPlataforma - 600);
        ataque.fase = "aviso";
        ataque.tempo = 160;
      }
      return;
    }

    if (ataque.fase === "aviso") {
      mao.setPosition(ataque.alvoX, topoPlataforma - 600);
      if (ataque.tempo <= 0) {
        ataque.fase = "queda";
        ataque.tempo = 95;
      }
      return;
    }

    if (ataque.fase === "queda") {
      const progresso = 1 - Math.max(0, ataque.tempo) / 95;
      mao.setPosition(
        ataque.alvoX,
        Phaser.Math.Linear(topoPlataforma - 600, topoPlataforma - 100, progresso),
      );
      if (ataque.tempo <= 0) {
        mao.setY(topoPlataforma - 100);
        cena.camJogo.shake(180, 0.008);
        this.acertarEsmagamento(ataque, boss, topoPlataforma);
        ataque.fase = "impacto";
        ataque.tempo = 120;
      }
      return;
    }

    if (ataque.fase === "impacto") {
      mao.setPosition(ataque.alvoX, topoPlataforma - 100);
      if (ataque.tempo <= 0) {
        ataque.fase = "retorno";
        ataque.tempo = 180;
      }
      return;
    }

    if (ataque.fase === "retorno") {
      const progresso = 1 - Math.max(0, ataque.tempo) / 180;
      mao.setY(Phaser.Math.Linear(topoPlataforma - 100, topoPlataforma - 600, progresso));
      if (ataque.tempo <= 0) {
        ataque.golpes++;
        if (ataque.golpes < ataque.total) {
          ataque.fase = "intervalo";
          ataque.tempo = 90;
        } else {
          ataque.fase = "voltaBase";
          ataque.tempo = 300;
          ataque.posicoesRetorno = new Map([
            [this.mao6, { x: this.mao6.x, y: this.mao6.y }],
            [this.mao7, { x: this.mao7.x, y: this.mao7.y }],
          ]);
        }
      }
      return;
    }

    if (ataque.fase === "intervalo" && ataque.tempo <= 0) {
      this.iniciarGolpeEsmagamento(ataque, jogador, topoPlataforma);
      return;
    }

    if (ataque.fase === "voltaBase") {
      const progresso = 1 - Math.max(0, ataque.tempo) / 300;
      const base6 = { x: this.xBaseAtual - 380, y: this.yBaseAtual + 170 + this.gestoAtual };
      const base7 = { x: this.xBaseAtual + 380, y: this.yBaseAtual + 170 - this.gestoAtual };
      for (const [maoRetorno, base] of [[this.mao6, base6], [this.mao7, base7]]) {
        const origem = ataque.posicoesRetorno.get(maoRetorno);
        maoRetorno.setPosition(
          Phaser.Math.Linear(origem.x, base.x, progresso),
          Phaser.Math.Linear(origem.y, base.y, progresso),
        );
      }
      if (ataque.tempo <= 0) this.finalizarEsmagamento(ataque);
    }
  }

  iniciarGolpeEsmagamento(ataque, jogador, topoPlataforma) {
    const limites = this.plataforma.body;
    ataque.fase = "subida";
    ataque.tempo = 300;
    ataque.lado *= -1;
    const minimoEntreGolpes = 240;
    const limiteEsquerdo = limites.left + 120;
    const limiteDireito = limites.right - 120;
    let alvoX = Phaser.Math.Clamp(jogador?.x ?? this.plataforma.x, limiteEsquerdo, limiteDireito);
    if (Number.isFinite(ataque.ultimoAlvoX) && Math.abs(alvoX - ataque.ultimoAlvoX) < minimoEntreGolpes) {
      const direcaoAlternativa = jogador && jogador.x >= ataque.ultimoAlvoX ? -1 : 1;
      alvoX = Phaser.Math.Clamp(alvoX + direcaoAlternativa * minimoEntreGolpes, limiteEsquerdo, limiteDireito);
      if (Math.abs(alvoX - ataque.ultimoAlvoX) < minimoEntreGolpes) {
        const outroAlvo = direcaoAlternativa < 0 ? limiteEsquerdo : limiteDireito;
        const alvoOposto = direcaoAlternativa < 0 ? limiteDireito : limiteEsquerdo;
        alvoX = Math.abs(outroAlvo - ataque.ultimoAlvoX) >= minimoEntreGolpes ? outroAlvo : alvoOposto;
      }
    }
    ataque.alvoX = alvoX;
    ataque.ultimoAlvoX = alvoX;
    ataque.acertoResolvido = false;
    ataque.maoAtacante = ataque.lado < 0 ? this.mao6 : this.mao7;
    if (!ataque.maosMovidas) {
      ataque.maosMovidas = new Set();
      ataque.texturasOriginais = new Map([
        [this.mao6, this.mao6.texture.key],
        [this.mao7, this.mao7.texture.key],
      ]);
      ataque.plataformasAtacadas = new Set(this.superficiesMaos.map(({ superficie }) => superficie));
      this.mao6.setTexture("forgotten-hand-punch").setRotation(-Math.PI / 2);
      this.mao7.setTexture("forgotten-hand-punch").setRotation(-Math.PI / 2).setFlipX(true);
      ataque.plataformasAtacadas.forEach((superficie) => { superficie.body.checkCollision.up = false; });
    }
    ataque.maosMovidas.add(ataque.maoAtacante);
    ataque.xInicial = ataque.maoAtacante.x;
    ataque.yInicial = ataque.maoAtacante.y;
  }

  acertarEsmagamento(ataque, boss, topoPlataforma) {
    const personagem = this.scene.jogador1;
    const jogador = personagem?.sprite;
    if (ataque.acertoResolvido || !jogador?.active || !jogador.body) return;
    ataque.acertoResolvido = true;
    const corpo = jogador.body;
    const larguraGolpe = 150;
    const dentroDaArea = corpo.right >= ataque.alvoX - larguraGolpe &&
      corpo.left <= ataque.alvoX + larguraGolpe &&
      corpo.bottom >= topoPlataforma - 110 && corpo.top <= topoPlataforma + 30;
    if (!dentroDaArea) return;
    const direcao = jogador.x >= this.cabeca.x ? 1 : -1;
    personagem.receberDano(50, {
      tipoSomImpacto: "heavy",
      knockbackX: 1100,
      knockbackY: -750,
      knockbackFixo: true,
    }, {
      atacante: boss,
      direcao,
      x: ataque.alvoX,
      y: topoPlataforma,
    });
  }

  finalizarEsmagamento(ataque) {
    ataque.fase = "espera";
    ataque.tempo = Phaser.Math.Between(5000, 8000);
    ataque.texturasOriginais?.forEach((textura, mao) => mao.setTexture(textura).setRotation(0).setFlipX(false));
    ataque.plataformasAtacadas?.forEach((superficie) => { superficie.body.checkCollision.up = true; });
    ataque.maoAtacante = null;
    ataque.plataformasAtacadas = null;
    ataque.texturasOriginais = null;
    ataque.maosMovidas = null;
    ataque.posicoesRetorno = null;
  }

  selecionarAtaque() {
    let candidatos = this.ataquesDisponiveis;
    if (this.repeticoesUltimoAtaque >= 2) {
      candidatos = candidatos.filter((chave) => chave !== this.ultimoAtaque);
    }
    if (candidatos.length === 0) return null;
    const escolhido = candidatos[Phaser.Math.Between(0, candidatos.length - 1)];
    if (escolhido === this.ultimoAtaque) {
      this.repeticoesUltimoAtaque++;
    } else {
      this.ultimoAtaque = escolhido;
      this.repeticoesUltimoAtaque = 1;
    }
    return escolhido;
  }
}
