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
    boss.vidaBoss = 800;
    this.vidaMaximaBoss = 800;
    this.vidaLimiarOlho = 700;
    this.faseBoss = 1;
    this.rostoBase = "forgotten-face";
    this.olhosProgressao = [];
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
    this.rostoAtual = "forgotten-face";
    this.tempoFlashDano = null;
    this.tempoRostoDano = null;
    this.ladoTorcaoDano = 1;
    const escalaOlho = 0.68;
    this.olhoEsquerdo = scene.add.image(x - 99, y - 77, "forgotten-face-eye")
      .setScale(escalaOlho).setDepth(-2.1);
    this.olhoDireito = scene.add.image(x + 64, y - 77, "forgotten-face-eye")
      .setScale(escalaOlho).setDepth(-2.1);
    this.mao6 = scene.add.image(x - 380, y + 170, "forgotten-hand-6")
      .setScale(220 / 401).setRotation(0).setDepth(-1);
    this.mao7 = scene.add.image(x + 380, y + 170, "forgotten-hand-7")
      .setScale(220 / 401).setRotation(0).setDepth(-1);
    this.maoGlitter = scene.add.sprite(x, y, "forgotten-hand-glitter", 0)
      .setDisplaySize(600, 337).setDepth(-1.5).setVisible(false);
    this.maosPalmadasJuntas = scene.add.image(x, y, "forgotten-hand-palm2")
      .setScale(0.38).setDepth(-1).setVisible(false);
    this.graficoHitboxesAtaque = scene.add.graphics().setDepth(10);
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
    this.ataquesDisponiveis = ["esmagamento", "varridaPendulo", "prensadaPalm", "grab", "arma", "raioBucal", "golpeL", "glitter"];
    this.projeteisArma = new Set();
    this.raiosBucais = new Set();
    this.grabCooldownAte = 0;
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
    this.superficiesMaosTodas = [...this.superficiesMaos];
    this.paresMaos = [{ indice: 0, esquerda: this.mao6, direita: this.mao7, alcanceX: 380, deslocamentoY: 170, superficies: this.superficiesMaos }];
    this.parMaosAtivo = this.paresMaos[0];
    this.cooldownsParesMaos = [0, 0];
    this.proximoParAtaque = 0;
    this.temposPertoDasMaos = new Map([[this.mao6, 0], [this.mao7, 0]]);
    scene.physics.add.collider(scene.jogador1.sprite, this.superficiesMaosGrupo);
    if (scene.numPlayersForgotten === 2 && scene.jogador2?.sprite?.body?.enable) {
      scene.physics.add.collider(scene.jogador2.sprite, this.superficiesMaosGrupo);
    }
    this.elapsed = 1700;
    this.objetosVisuais.push(this.cabeca, this.olhoEsquerdo, this.olhoDireito, this.mao6, this.mao7, this.maoGlitter, this.maosPalmadasJuntas, this.graficoHitboxesAtaque);

    boss.receberDano = (quantidade) => {
      if (this.bossDerrotado) return true;
      const dano = Math.max(0, Number(quantidade) || 0);
      boss.vidaBoss = Math.max(0, boss.vidaBoss - dano);
      if (dano > 0) this.atualizarProgressaoVidaBoss();
      if (dano > 0) this.reagirAoDano();
      if (boss.vidaBoss === 0) this.derrotarBoss(boss);
      return true;
    };
    boss.atualizarCargaUlt = () => {};
    boss.update = () => {};
    this.atualizarNoPreUpdate = (_time, delta) => this.atualizarOponente(delta, boss);
    scene.events.on(Phaser.Scenes.Events.PRE_UPDATE, this.atualizarNoPreUpdate);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.PRE_UPDATE, this.atualizarNoPreUpdate);
      this.liberarJogadorGrab();
      this.liberarJogadorEnquadrado();
      for (const registro of [...this.projeteisArma]) this.destruirProjetilArma(registro);
      this.limparRaioBucal();
      for (const olho of this.olhosProgressao) olho.destroy();
    });
    boss.sincronizarHurtbox?.();
  }

  esconderIndicador(indicador) {
    indicador?.setVisible(false);
  }

  atualizarProgressaoVidaBoss() {
    while (this.boss.vidaBoss <= this.vidaLimiarOlho && this.vidaLimiarOlho > 0) {
      this.criarOlhoProgressao();
      this.vidaLimiarOlho -= 100;
    }

    const novaFase = this.boss.vidaBoss <= 200 ? 3 : this.boss.vidaBoss <= 400 ? 2 : 1;
    if (novaFase <= this.faseBoss) return;
    this.faseBoss = novaFase;
    this.rostoBase = novaFase === 3 ? "forgotten-face-5" : "forgotten-face-3";
    this.definirRostoBoss(this.rostoBase);

    if (novaFase === 3) {
      this.criarSegundoParMaos();
      this.cooldownsParesMaos = [0, 0];
      this.proximoParAtaque = 0;
      if (this.estadoEsmagamento.fase === "espera") this.estadoEsmagamento.tempo = 0;
    }
  }

  criarOlhoProgressao() {
    const scene = this.scene;
    if (!scene.anims.exists("forgotten-eye-loop")) {
      scene.anims.create({
        key: "forgotten-eye-loop",
        frames: scene.anims.generateFrameNumbers("forgotten-eye-loop", { start: 0, end: 92 }),
        frameRate: 15,
        repeat: -1,
      });
    }
    const camera = scene.camJogo ?? scene.cameras.main;
    const view = camera.worldView;
    const halfWidth = 70;
    const halfHeight = 56;
    const minX = view.x + Math.min(halfWidth, view.width / 4);
    const maxX = view.right - Math.min(halfWidth, view.width / 4);
    const minY = view.y + Math.min(halfHeight, view.height / 4);
    const maxY = view.bottom - Math.min(halfHeight, view.height / 4);
    const olho = scene.add.sprite(
      Phaser.Math.Between(minX, Math.max(minX, maxX)),
      Phaser.Math.Between(minY, Math.max(minY, maxY)),
      "forgotten-eye-loop",
      0,
    ).setDisplaySize(140, 112).setDepth(-3);
    scene.camHUD?.ignore(olho);
    olho.play("forgotten-eye-loop");
    this.olhosProgressao.push(olho);
    this.objetosVisuais.push(olho);
  }

  criarSegundoParMaos() {
    if (this.paresMaos.length > 1) return;
    const scene = this.scene;
    const x = this.cabeca.x;
    const y = this.cabeca.y;
    const mao8 = scene.add.image(x - 560, y + 80, "forgotten-hand-6")
      .setScale(220 / 401).setDepth(-1);
    const mao9 = scene.add.image(x + 560, y + 80, "forgotten-hand-7")
      .setScale(220 / 401).setDepth(-1);
    const maos = [mao8, mao9];
    const superficies = maos.map((mao) => {
      const zona = scene.add.zone(mao.x, mao.y, 200, 130);
      this.boss.grupoHurtbox.add(zona);
      zona.body.setAllowGravity(false);
      zona.body.setImmovable(true);
      zona.body.setSize(200, 130);
      zona.body.debugBodyColor = 0x00ff00;
      const superficie = scene.add.rectangle(mao.x, mao.y + 15, 230, 32, 0xffffff, 0);
      scene.physics.add.existing(superficie, true);
      this.superficiesMaosGrupo.add(superficie);
      superficie.body.checkCollision.up = true;
      superficie.body.checkCollision.down = false;
      superficie.body.checkCollision.left = false;
      superficie.body.checkCollision.right = false;
      scene.camHUD?.ignore(mao);
      scene.camHUD?.ignore(superficie);
      this.maosHurtbox.push({ zona, mao });
      this.zonasHurtbox.push({ zona, mao });
      return { mao, superficie };
    });
    this.superficiesMaosTodas.push(...superficies);
    this.paresMaos.push({
      indice: 1,
      esquerda: mao8,
      direita: mao9,
      alcanceX: 560,
      deslocamentoY: 80,
      superficies,
    });
    this.temposPertoDasMaos.set(mao8, 0);
    this.temposPertoDasMaos.set(mao9, 0);
    this.objetosVisuais.push(mao8, mao9);
    this.boss.hurtboxesAtivas = this.zonasHurtbox.map(({ zona }) => zona);
    this.ativarParMaos(0);
    this.atualizarHurtboxes();
  }

  ativarParMaos(indice) {
    const par = this.paresMaos[indice] ?? this.paresMaos[0];
    this.parMaosAtivo = par;
    this.mao6 = par.esquerda;
    this.mao7 = par.direita;
    this.superficiesMaos = par.superficies;
    return par;
  }

  obterPosicaoBaseMao(mao) {
    const par = this.paresMaos.find((item) => item.esquerda === mao || item.direita === mao) ?? this.paresMaos[0];
    const lado = mao === par.esquerda ? -1 : 1;
    return {
      x: this.xBaseAtual + lado * par.alcanceX,
      y: this.yBaseAtual + par.deslocamentoY + (lado < 0 ? this.gestoAtual : -this.gestoAtual),
    };
  }

  reagirAoDano() {
    const cena = this.scene;
    const cabeca = this.cabeca;
    if (!cabeca?.active) return;

    if (this.tempoFlashDano) cena.time.removeEvent(this.tempoFlashDano);
    if (this.tempoRostoDano) cena.time.removeEvent(this.tempoRostoDano);
    cena.tweens.killTweensOf(cabeca);

    cabeca.setTint(0xe8e8e8).setTintMode(Phaser.TintModes.FILL);
    this.tempoFlashDano = cena.time.delayedCall(50, () => {
      if (cabeca.active) cabeca.clearTint();
      this.tempoFlashDano = null;
    });

    cabeca.setTexture("forgotten-face-2").setRotation(0.14 * this.ladoTorcaoDano);
    this.ladoTorcaoDano *= -1;
    this.tempoRostoDano = cena.time.delayedCall(180, () => {
      if (cabeca.active) cabeca.setTexture(this.rostoAtual ?? "forgotten-face");
      this.tempoRostoDano = null;
    });
    cena.tweens.add({
      targets: cabeca,
      rotation: 0,
      duration: 320,
      ease: "Sine.Out",
    });
  }

  atualizar() {}

  desenharHitboxAtaque(pontos) {
    const grafico = this.graficoHitboxesAtaque;
    if (!grafico || !pontos?.length) return;
    grafico.lineStyle(3, 0xff3030, 0.95);
    grafico.beginPath();
    grafico.moveTo(pontos[0].x, pontos[0].y);
    for (const ponto of pontos.slice(1)) grafico.lineTo(ponto.x, ponto.y);
    grafico.closePath();
    grafico.strokePath();
  }

  obterHitboxSprite(sprite) {
    const limitesAlfa = {
      "forgotten-hand-punch": [500, 350, 22, 12, 477, 339],
      "forgotten-hand-palm": [256, 832, 2, 2, 255, 831],
      "forgotten-hand-palm2": [310, 780, 0, 6, 309, 779],
      "forgotten-hand-catch": [650, 450, 76, 28, 593, 395],
      "forgotten-hand-gun": [800, 580, 22, 16, 777, 563],
      "6.png": [241, 286, 10, 2, 235, 283],
      "7.png": [241, 286, 28, 6, 241, 277],
    };
    const [fonteLargura, fonteAltura, esquerda, topo, direita, baixo] =
      limitesAlfa[sprite.texture.key] ?? [sprite.frame.cutWidth, sprite.frame.cutHeight, 0, 0, sprite.frame.cutWidth, sprite.frame.cutHeight];
    const escalaX = sprite.displayWidth / fonteLargura;
    const escalaY = sprite.displayHeight / fonteAltura;
    const localX = (((esquerda + direita) / 2) - fonteLargura * sprite.originX) * escalaX * (sprite.flipX ? -1 : 1);
    const localY = (((topo + baixo) / 2) - fonteAltura * sprite.originY) * escalaY * (sprite.flipY ? -1 : 1);
    const cos = Math.cos(sprite.rotation);
    const sin = Math.sin(sprite.rotation);
    const centroX = sprite.x + localX * cos - localY * sin;
    const centroY = sprite.y + localX * sin + localY * cos;
    const metadeLargura = (direita - esquerda) * escalaX / 2;
    const metadeAltura = (baixo - topo) * escalaY / 2;
    const pontos = [
      [-metadeLargura, -metadeAltura], [metadeLargura, -metadeAltura],
      [metadeLargura, metadeAltura], [-metadeLargura, metadeAltura],
    ].map(([x, y]) => ({ x: centroX + x * cos - y * sin, y: centroY + x * sin + y * cos }));
    return { pontos };
  }

  hitboxPoligonalSobrepoeCorpo(hitbox, corpo) {
    if (!hitbox?.pontos || !corpo?.enable) return false;
    const pontosCorpo = [
      { x: corpo.left, y: corpo.top }, { x: corpo.right, y: corpo.top },
      { x: corpo.right, y: corpo.bottom }, { x: corpo.left, y: corpo.bottom },
    ];
    const eixos = [{ x: 1, y: 0 }, { x: 0, y: 1 }];
    for (let i = 0; i < hitbox.pontos.length; i++) {
      const atual = hitbox.pontos[i];
      const proximo = hitbox.pontos[(i + 1) % hitbox.pontos.length];
      eixos.push({ x: -(proximo.y - atual.y), y: proximo.x - atual.x });
    }
    return eixos.every((eixo) => {
      const projetar = (pontos) => pontos.map((ponto) => ponto.x * eixo.x + ponto.y * eixo.y);
      const a = projetar(hitbox.pontos);
      const b = projetar(pontosCorpo);
      return Math.max(...a) >= Math.min(...b) && Math.max(...b) >= Math.min(...a);
    });
  }

  verificarColisoesProjeteisArma(personagem) {
    const corpoPersonagem = personagem?.sprite?.body;
    if (!corpoPersonagem) return;
    const hurtboxes = personagem.grupoHurtbox?.getChildren() ?? [];
    for (const registro of [...this.projeteisArma]) {
      if (!registro.projetil.active || !registro.projetil.body) continue;
      const hitbox = this.obterHitboxSprite(registro.projetil);
      this.desenharHitboxAtaque(hitbox.pontos);
      if (this.hitboxPoligonalSobrepoeCorpo(hitbox, corpoPersonagem) ||
        hurtboxes.some((hurtbox) => this.hitboxPoligonalSobrepoeCorpo(hitbox, hurtbox.body))) {
        this.acertarProjetilArma(registro);
      }
    }
  }

  derrotarBoss(boss) {
    if (this.bossDerrotado) return;
    this.bossDerrotado = true;
    this.estadoEsmagamento.fase = "derrotado";
    this.estadoEsmagamento.tipo = null;
    this.liberarJogadorGrab();
    this.liberarJogadorEnquadrado();
    for (const { zona } of this.zonasHurtbox) {
      if (zona?.body) zona.body.enable = false;
    }
    for (const { superficie } of this.superficiesMaosTodas) {
      if (superficie?.body) superficie.body.enable = false;
    }
    for (const registro of [...this.projeteisArma]) this.destruirProjetilArma(registro);
    this.limparRaioBucal();

    this.scene.partidaFinalizada = true;
    this.scene.sound.stopAll();
    this.iniciarCinematicaDerrota(boss);
  }

  iniciarCinematicaDerrota(boss) {
    const cena = this.scene;
    if (this.tempoFlashDano) cena.time.removeEvent(this.tempoFlashDano);
    if (this.tempoRostoDano) cena.time.removeEvent(this.tempoRostoDano);
    cena.tweens.killTweensOf(this.cabeca);
    this.cabeca.clearTint().setRotation(0);
    this.maoGlitter.stop().setVisible(false);
    this.maosPalmadasJuntas.setVisible(false);
    for (const par of this.paresMaos) {
      par.esquerda.setTexture("forgotten-hand-6").setScale(220 / 401).setRotation(0).setFlipX(false).setVisible(true);
      par.direita.setTexture("forgotten-hand-7").setScale(220 / 401).setRotation(0).setFlipX(false).setVisible(true);
    }

    const camera = cena.camJogo ?? cena.cameras.main;
    const limiteInferior = camera.worldView.bottom + 250;
    for (const mao of this.paresMaos.flatMap((par) => [par.esquerda, par.direita])) {
      cena.tweens.add({
        targets: mao,
        y: Math.max(mao.y + 850, limiteInferior),
        duration: 1800,
        ease: "Quad.In",
      });
    }

    cena.camHUD?.setBackgroundColor("rgba(255,255,255,0)");

    this.cinematicaDerrota = {
      tempo: 0,
      ultimaTrocaFace: 0,
      indiceFace: 1,
      xInicial: this.cabeca.x,
      yInicial: this.cabeca.y,
      epilogoRevelado: false,
    };
  }

  atualizarCinematicaDerrota(delta) {
    const cena = this.scene;
    const morte = this.cinematicaDerrota;
    if (!morte) return;
    morte.tempo += delta;
    const claridade = Phaser.Math.Clamp(morte.tempo / 5000, 0, 1);
    cena.camHUD?.setBackgroundColor(`rgba(255,255,255,${claridade})`);
    if (morte.tempo >= 5000 && !morte.hudEscondida) {
      morte.hudEscondida = true;
      for (const objeto of [
        cena.hudP1_Nome,
        cena.hudP2_Nome,
        cena.indicadorP1,
        cena.indicadorP2,
        cena.jogador1?.textoDano,
        cena.jogador2?.textoDano,
        cena.textoTempoVersus,
      ]) objeto?.setVisible(false);
    }

    if (morte.tempo < 5000) {
      if (morte.tempo - morte.ultimaTrocaFace >= 70) {
        morte.ultimaTrocaFace = morte.tempo;
        morte.indiceFace = morte.indiceFace % 5 + 1;
        const textura = morte.indiceFace === 1 ? "forgotten-face" : `forgotten-face-${morte.indiceFace}`;
        this.cabeca.setTexture(textura).setDisplaySize(600, 600);
      }
      this.cabeca.setPosition(
        morte.xInicial + Math.sin(morte.tempo * 0.075) * 26,
        morte.yInicial + Math.sin(morte.tempo * 0.091) * 20,
      ).setRotation(Math.sin(morte.tempo * 0.083) * 0.16);
    } else if (morte.tempo < 10000 && !morte.epilogoRevelado) {
      this.cabeca.setVisible(false);
      this.olhoEsquerdo.setVisible(false);
      this.olhoDireito.setVisible(false);
      this.cabeca.setTexture("forgotten-face-5").setDisplaySize(600, 600)
        .setPosition(morte.xInicial, morte.yInicial).setRotation(0);
    } else if (!morte.epilogoRevelado && morte.tempo >= 10000) {
      morte.epilogoRevelado = true;
      this.revelarMonologoDerrota();
    }
  }

  revelarMonologoDerrota() {
    const cena = this.scene;
    const morte = this.cinematicaDerrota;
    this.cabeca.setVisible(false);
    this.olhoEsquerdo.setVisible(false);
    this.olhoDireito.setVisible(false);
    for (const olho of this.olhosProgressao) olho.setVisible(false);

    const larguraTela = cena.scale.width;
    const alturaTela = cena.scale.height;
    const larguraRosto = Math.min(larguraTela * 0.76, alturaTela * 0.70);
    const centroX = larguraTela / 2;
    const centroY = alturaTela * 0.32;
    const escalaRosto = larguraRosto / 600;
    this.rostoFinalHUD = cena.add.image(centroX, centroY, "forgotten-face-67")
      .setDisplaySize(larguraRosto, larguraRosto).setScrollFactor(0).setDepth(10001);
    cena.camJogo?.ignore(this.rostoFinalHUD);

    if (!cena.anims.exists("forgotten-eye-loop")) {
      cena.anims.create({
        key: "forgotten-eye-loop",
        frames: cena.anims.generateFrameNumbers("forgotten-eye-loop", { start: 0, end: 92 }),
        frameRate: 15,
        repeat: -1,
      });
    }
    this.olhosFinaisHUD = [
      { x: centroX - 99 * escalaRosto, y: centroY - 77 * escalaRosto },
      { x: centroX + 64 * escalaRosto, y: centroY - 77 * escalaRosto },
    ].map(({ x, y }) => {
      const olho = cena.add.sprite(x, y, "forgotten-eye-loop", 0)
      .setDisplaySize(104 * escalaRosto, 84 * escalaRosto).setScrollFactor(0).setDepth(10002);
      cena.camJogo?.ignore(olho);
      olho.play("forgotten-eye-loop");
      return olho;
    });

    morte.linhasMonologo = [
      "Ah... então foi você que sobrou.",
      "Você chegou antes de ser criado.",
      "Eles disseram que você não acordaria.",
      "Não conte a eles que me encontrou.",
    ];
    morte.indiceMonologo = -1;
    morte.textoMonologo = cena.add.text(centroX, alturaTela * 0.79, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: `${Math.max(36, Math.round(48 * escalaRosto))}px`,
      color: "#000000",
      align: "center",
      wordWrap: { width: larguraTela * 0.86 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10003);
    cena.camJogo?.ignore(morte.textoMonologo);
    this.avancarMonologoDerrota();
  }

  avancarMonologoDerrota() {
    const morte = this.cinematicaDerrota;
    if (!morte?.textoMonologo) return;
    morte.indiceMonologo++;
    if (morte.indiceMonologo >= morte.linhasMonologo.length) {
      morte.textoMonologo.setVisible(false);
      morte.transicaoAgendada = true;
      this.scene.time.delayedCall(4500, () => this.finalizarCinematicaDerrota());
      return;
    }
    morte.textoMonologo.setText(morte.linhasMonologo[morte.indiceMonologo]).setVisible(true);
    this.scene.time.delayedCall(3500, () => this.avancarMonologoDerrota());
  }

  finalizarCinematicaDerrota() {
    if (this.resultadoFinalizado) return;
    this.resultadoFinalizado = true;
    this.scene.scene.start("CenaStart");
  }

  atualizarHurtboxes() {
    if (!this.cabeca?.active) return;
    this.zonasHurtbox?.forEach(({ zona, deslocamentoY = 0, mao = null }) => {
      if (!zona?.active || !zona.body?.updateFromGameObject) return;
      const ancoraX = mao?.x ?? this.cabeca.x;
      const ancoraY = mao?.y ?? this.cabeca.y + deslocamentoY;
      zona.setPosition(ancoraX, ancoraY);
      zona.body.updateFromGameObject();
    });
  }

  obterJogadoresAlvoBoss() {
    const cena = this.scene;
    const jogadores = cena.numPlayersForgotten === 2
      ? [cena.jogador1, cena.jogador2]
      : [cena.jogador1];
    return jogadores.filter((jogador) =>
      jogador?.sprite?.active && jogador.sprite.body?.enable && !jogador.eliminado
    );
  }

  obterPersonagemPorSprite(sprite) {
    return this.obterJogadoresAlvoBoss().find((jogador) => jogador.sprite === sprite) ?? null;
  }

  obterAlvoBossMaisProximo(x, y) {
    return this.obterJogadoresAlvoBoss().sort((a, b) =>
      Phaser.Math.Distance.Between(a.sprite.x, a.sprite.y, x, y) -
      Phaser.Math.Distance.Between(b.sprite.x, b.sprite.y, x, y)
    )[0] ?? null;
  }

  atualizarOponente(delta, boss) {
    if (this.bossDerrotado) {
      this.atualizarCinematicaDerrota(delta);
      return;
    }
    this.graficoHitboxesAtaque.clear();
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
    const alvoBoss = this.obterAlvoBossMaisProximo(cabecaX, cabecaY);
    const jogador = alvoBoss?.sprite;
    const direcaoX = jogador ? Phaser.Math.Clamp((jogador.x - cabecaX) * 0.015, -6, 6) : 0;
    const direcaoY = jogador ? Phaser.Math.Clamp((jogador.y - cabecaY) * 0.01, -4, 4) : 0;
    const movimentoOlhosX = Math.sin(this.elapsed * 0.0017) * 1.5;
    const movimentoOlhosY = Math.sin(this.elapsed * 0.0023) * 1.2;
    const olhoCaoticoEsquerdoX = this.faseBoss >= 2 ? Math.sin(this.elapsed * 0.031) * 8 + Math.sin(this.elapsed * 0.013) * 4 : 0;
    const olhoCaoticoEsquerdoY = this.faseBoss >= 2 ? Math.sin(this.elapsed * 0.027 + 1.1) * 6 : 0;
    const olhoCaoticoDireitoX = this.faseBoss >= 2 ? Math.sin(this.elapsed * 0.029 + 2.2) * 8 + Math.sin(this.elapsed * 0.016) * 4 : 0;
    const olhoCaoticoDireitoY = this.faseBoss >= 2 ? Math.sin(this.elapsed * 0.033 + 0.4) * 6 : 0;
    this.olhoEsquerdo.setPosition(cabecaX - 99 + direcaoX + movimentoOlhosX + olhoCaoticoEsquerdoX, cabecaY - 77 + direcaoY + movimentoOlhosY + olhoCaoticoEsquerdoY);
    this.olhoDireito.setPosition(cabecaX + 64 + direcaoX + movimentoOlhosX + olhoCaoticoDireitoX, cabecaY - 77 + direcaoY + movimentoOlhosY + olhoCaoticoDireitoY);
    const maosMovidas = this.estadoEsmagamento.maosMovidas;
    for (const par of this.paresMaos) {
      for (const mao of [par.esquerda, par.direita]) {
        if (this.estadoEsmagamento.fase === "espera" || !maosMovidas?.has(mao)) {
          const lado = mao === par.esquerda ? -1 : 1;
          mao.setPosition(x + lado * par.alcanceX, y + par.deslocamentoY + (lado < 0 ? gesto : -gesto));
        }
      }
    }
    if (this.faseBoss >= 3) {
      this.cooldownsParesMaos = this.cooldownsParesMaos.map((tempo) => Math.max(0, tempo - delta));
    }
    const tipoAtaqueAntes = this.estadoEsmagamento.tipo;
    const faseAtaqueAntes = this.estadoEsmagamento.fase;
    this.atualizarEsmagamento(delta, this.boss);
    const ataque = this.estadoEsmagamento;
    if (this.faseBoss >= 3 && tipoAtaqueAntes && faseAtaqueAntes !== "espera" &&
        ataque.fase === "espera" && !ataque.tipo) {
      const parQueAtacou = ataque.parIndex ?? this.parMaosAtivo.indice;
      this.cooldownsParesMaos[parQueAtacou] = Phaser.Math.Between(5000, 8000);
      this.proximoParAtaque = 1 - parQueAtacou;
      ataque.tempo = this.cooldownsParesMaos[this.proximoParAtaque];
    }
    this.verificarColisoesProjeteisArma(alvoBoss);
    this.superficiesMaosTodas.forEach(({ mao, superficie }) => {
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
    const jogador = this.obterAlvoBossMaisProximo(this.cabeca.x, this.cabeca.y)?.sprite;
    const topoPlataforma = this.plataforma.body.top;

    if (ataque.tipo === "grab" || ataque.tipo === "grabProximidade") {
      ataque.tempo -= delta;
      this.atualizarGrab(delta, ataque, jogador, boss);
      return;
    }

    ataque.tempo -= delta;

    if (ataque.fase === "espera") {
      if (this.faseBoss >= 3) this.ativarParMaos(this.proximoParAtaque);
      ataque.parIndex = this.parMaosAtivo.indice;
      if (this.atualizarProximidadeGrab(delta, jogador, ataque)) return;
      if (ataque.tempo <= 0) {
        if (this.faseBoss >= 3) this.ativarParMaos(this.proximoParAtaque);
        ataque.parIndex = this.parMaosAtivo.indice;
        const selecionado = this.selecionarAtaque();
        if (selecionado === "esmagamento") {
          ataque.tipo = selecionado;
          ataque.total = Phaser.Math.Between(4, 6);
          ataque.golpes = 0;
          ataque.ultimoAlvoX = null;
          this.iniciarGolpeEsmagamento(ataque, jogador, topoPlataforma);
        } else if (selecionado === "varridaPendulo") {
          ataque.tipo = selecionado;
          ataque.total = 2;
          ataque.golpes = 0;
          ataque.lado = 1;
          this.iniciarGolpeVarredura(ataque, jogador, topoPlataforma);
        } else if (selecionado === "prensadaPalm") {
          ataque.tipo = selecionado;
          this.iniciarPrensadaPalm(ataque, jogador);
        } else if (selecionado === "grab") {
          ataque.tipo = selecionado;
          this.iniciarGrabAgendado(ataque, jogador);
        } else if (selecionado === "arma") {
          ataque.tipo = selecionado;
          this.iniciarAtaqueArma(ataque);
        } else if (selecionado === "raioBucal") {
          ataque.tipo = selecionado;
          this.iniciarRaioBucal(ataque);
        } else if (selecionado === "golpeL") {
          ataque.tipo = selecionado;
          this.iniciarGolpeL(ataque, jogador);
        } else if (selecionado === "glitter") {
          ataque.tipo = selecionado;
          this.iniciarAtaqueGlitter(ataque, jogador);
        } else {
          ataque.tempo = Phaser.Math.Between(5000, 8000);
        }
      }
      return;
    }

    if (ataque.tipo === "varridaPendulo") {
      this.atualizarVarredura(delta, ataque, jogador, boss, topoPlataforma);
      return;
    }
    if (ataque.tipo === "prensadaPalm") {
      this.atualizarPrensadaPalm(delta, ataque, jogador, boss);
      return;
    }
    if (ataque.tipo === "arma") {
      this.atualizarAtaqueArma(delta, ataque, jogador, boss);
      return;
    }
    if (ataque.tipo === "raioBucal") {
      this.atualizarRaioBucal(delta, ataque, jogador, boss);
      return;
    }
    if (ataque.tipo === "golpeL") {
      this.atualizarGolpeL(delta, ataque, jogador, boss);
      return;
    }
    if (ataque.tipo === "glitter") {
      this.atualizarAtaqueGlitter(delta, ataque, jogador, boss);
      return;
    }

    const mao = ataque.maoAtacante;
    if (!mao) {
      this.finalizarEsmagamento(ataque);
      return;
    }

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
      this.acertarEsmagamento(ataque, boss, topoPlataforma);
      if (ataque.tempo <= 0) {
        mao.setY(topoPlataforma - 100);
        cena.camJogo.shake(180, 0.008);
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
      for (const maoRetorno of [this.mao6, this.mao7]) {
        const origem = ataque.posicoesRetorno.get(maoRetorno);
        const base = this.obterPosicaoBaseMao(maoRetorno);
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
    const minimoEntreGolpes = 100;
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
      this.mao7.setTexture("forgotten-hand-punch").setRotation(-Math.PI / 2).setFlipX(false);
      ataque.plataformasAtacadas.forEach((superficie) => { superficie.body.checkCollision.up = false; });
    }
    ataque.maosMovidas.add(ataque.maoAtacante);
    ataque.xInicial = ataque.maoAtacante.x;
    ataque.yInicial = ataque.maoAtacante.y;
  }

  iniciarGolpeVarredura(ataque, jogador, topoPlataforma) {
    ataque.lado *= -1;
    ataque.maoAtacante = ataque.lado < 0 ? this.mao6 : this.mao7;
    const mao = ataque.maoAtacante;
    const superficie = this.superficiesMaos.find((item) => item.mao === mao)?.superficie;
    ataque.texturasOriginais = new Map([[mao, mao.texture.key]]);
    ataque.plataformasAtacadas = new Set(superficie ? [superficie] : []);
    ataque.maosMovidas = new Set([mao]);
    mao.setTexture("forgotten-hand-punch").setRotation(-Math.PI / 2).setFlipX(false);
    if (superficie) superficie.body.checkCollision.up = false;

    const esquerda = this.limitesArena.minX;
    const direita = this.limitesArena.maxX;
    ataque.direcaoVarredura = ataque.lado < 0 ? 1 : -1;
    ataque.inicioVarreduraX = ataque.direcaoVarredura > 0 ? esquerda : direita;
    ataque.fimVarreduraX = ataque.direcaoVarredura > 0 ? direita : esquerda;
    ataque.alturaBaseVarredura = topoPlataforma - 200;
    ataque.xInicial = mao.x;
    ataque.yInicial = mao.y;
    ataque.tempo = 300;
    ataque.fase = "varridaAproximacao";
    ataque.acertoResolvido = false;
  }

  atualizarProximidadeGrab(delta, jogador, ataque) {
    if (this.elapsed < this.grabCooldownAte) {
      this.temposPertoDasMaos.forEach((_tempo, mao) => this.temposPertoDasMaos.set(mao, 0));
      this.maoMonitoradaGrab = null;
      return false;
    }
    const corpo = jogador?.body;
    if (!corpo) return false;
    let maoProxima = null;
    let distanciaMinima = Infinity;
    for (const { mao, superficie } of this.superficiesMaos) {
      const emCima = (corpo.blocked.down || corpo.touching.down || corpo.wasTouching.down) &&
        corpo.right > superficie.body.left - 35 && corpo.left < superficie.body.right + 35 &&
        Math.abs(corpo.bottom - superficie.body.top) <= 55;
      const dx = Math.abs(jogador.x - mao.x);
      const dy = Math.abs(jogador.y - mao.y);
      const perto = dx <= 190 && dy <= 240;
      const distancia = dx * dx + dy * dy;
      if ((emCima || perto) && distancia < distanciaMinima) {
        maoProxima = mao;
        distanciaMinima = distancia;
      }
    }

    if (!maoProxima) {
      this.temposPertoDasMaos.forEach((_tempo, mao) => this.temposPertoDasMaos.set(mao, 0));
      this.maoMonitoradaGrab = null;
      return false;
    }
    if (this.maoMonitoradaGrab && this.maoMonitoradaGrab !== maoProxima) {
      this.temposPertoDasMaos.set(this.maoMonitoradaGrab, 0);
    }
    this.temposPertoDasMaos.forEach((_tempo, mao) => {
      if (mao !== maoProxima) this.temposPertoDasMaos.set(mao, 0);
    });
    this.maoMonitoradaGrab = maoProxima;
    const tempo = (this.temposPertoDasMaos.get(maoProxima) ?? 0) + delta;
    this.temposPertoDasMaos.set(maoProxima, tempo);
    if (tempo < 4000) return false;

    this.temposPertoDasMaos.set(maoProxima, 0);
    this.maoMonitoradaGrab = null;
    ataque.cooldownPendente = ataque.tempo;
    this.iniciarGrabProximidade(ataque, jogador, maoProxima);
    return true;
  }

  prepararMaoGrab(ataque, mao, texturaGrab = true) {
    const superficie = this.superficiesMaos.find((item) => item.mao === mao)?.superficie;
    ataque.maoAtacante = mao;
    ataque.maosMovidas = new Set([mao]);
    ataque.plataformasAtacadas = new Set();
    ataque.texturasOriginais = new Map([[mao, mao.texture.key]]);
    ataque.escalasOriginais = new Map([[mao, { x: mao.scaleX, y: mao.scaleY }]]);
    ataque.superficieGrab = superficie;
    ataque.xInicial = mao.x;
    ataque.yInicial = mao.y;
    if (texturaGrab) {
      mao.setTexture("forgotten-hand-catch").setRotation(0).setFlipX(false);
      if (superficie) {
        ataque.plataformasAtacadas.add(superficie);
        superficie.body.checkCollision.up = false;
      }
    }
  }

  iniciarGrabAgendado(ataque, jogador) {
    this.grabCooldownAte = this.elapsed + 30000;
    const mao = Phaser.Utils.Array.GetRandom([this.mao6, this.mao7]);
    this.prepararMaoGrab(ataque, mao, true);
    ataque.tipo = "grab";
    ataque.fase = "grabRastreia";
    ataque.tempo = 2000;
    ataque.alvoX = jogador?.x ?? mao.x;
    ataque.alvoY = jogador?.y ?? mao.y;
  }

  iniciarGrabProximidade(ataque, jogador, mao) {
    this.grabCooldownAte = this.elapsed + 30000;
    this.prepararMaoGrab(ataque, mao, false);
    ataque.tipo = "grabProximidade";
    ataque.fase = "grabAviso";
    ataque.tempo = 1000;
    ataque.alvoX = jogador?.x ?? mao.x;
    ataque.alvoY = jogador?.y ?? mao.y;
    ataque.cooldownPendente ??= ataque.tempo;
  }

  atualizarGrab(delta, ataque, jogador, boss) {
    const mao = ataque.maoAtacante;
    if (!mao) {
      this.finalizarGrab(ataque);
      return;
    }
    if (ataque.fase === "grabAviso") {
      mao.setPosition(
        ataque.xInicial + Math.sin(this.elapsed * 0.055) * 12,
        ataque.yInicial + Math.sin(this.elapsed * 0.09) * 6,
      );
      ataque.alvoX = mao.x;
      if (ataque.tempo <= 0) {
        mao.setTexture("forgotten-hand-catch");
        if (ataque.superficieGrab) {
          ataque.plataformasAtacadas.add(ataque.superficieGrab);
          ataque.superficieGrab.body.checkCollision.up = false;
        }
        ataque.fase = "grabLunge";
        ataque.tempo = 400;
      }
      return;
    }

    if (ataque.fase === "grabRastreia" || ataque.fase === "grabLunge") {
      if (!jogador?.active || !jogador.body) {
        this.iniciarRetornoGrab(ataque);
        return;
      }
      const alvoX = Phaser.Math.Clamp(jogador.x, this.limitesArena.minX + 80, this.limitesArena.maxX - 80);
      const alvoY = jogador.y - 25;
      const fator = Math.min(1, delta * (ataque.fase === "grabLunge" ? 0.006 : 0.0015));
      mao.setPosition(Phaser.Math.Linear(mao.x, alvoX, fator), Phaser.Math.Linear(mao.y, alvoY, fator));
      ataque.alvoX = jogador.x;
      ataque.alvoY = jogador.y;
      const hitbox = this.obterHitboxSprite(mao);
      this.desenharHitboxAtaque(hitbox.pontos);
      if (this.hitboxPoligonalSobrepoeCorpo(hitbox, jogador.body)) {
        this.capturarJogadorGrab(ataque, jogador, boss);
        return;
      }
      if (ataque.tempo <= 0) this.iniciarRetornoGrab(ataque);
      return;
    }

    if (ataque.fase === "grabPresa") {
      const sprite = this.capturaGrab?.sprite;
      if (sprite?.active) {
        sprite.setPosition(mao.x, mao.y);
        sprite.body?.updateFromGameObject();
      }
      if (ataque.tempo <= 0) {
        this.liberarJogadorGrab();
        this.iniciarRetornoGrab(ataque);
      }
      return;
    }

    if (ataque.fase === "grabRetorno") {
      const progresso = 1 - Math.max(0, ataque.tempo) / 500;
      const base = this.obterPosicaoBaseMao(mao);
      mao.setPosition(
        Phaser.Math.Linear(ataque.xInicial, base.x, progresso),
        Phaser.Math.Linear(ataque.yInicial, base.y, progresso),
      );
      if (ataque.tempo <= 0) this.finalizarGrab(ataque);
    }
  }

  capturarJogadorGrab(ataque, spriteJogador, boss) {
    const sprite = spriteJogador;
    const personagem = this.obterPersonagemPorSprite(sprite);
    const body = sprite?.body;
    if (!personagem || !sprite || !body) return;
    const metodosInput = ["inputDown", "inputJustDown", "inputJustUp"];
    this.capturaGrab = {
      personagem,
      sprite,
      body,
      visivel: sprite.visible,
      metodos: new Map(metodosInput.map((nome) => [nome, {
        proprio: Object.prototype.hasOwnProperty.call(personagem, nome),
        original: personagem[nome],
      }])),
    };
    metodosInput.forEach((nome) => { personagem[nome] = () => false; });
    body.moves = false;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    sprite.setVisible(false);
    personagem.receberDano(30, {
      tipoSomImpacto: "heavy",
      knockbackX: 0,
      knockbackY: 0,
    }, {
      atacante: boss,
      direcao: sprite.x >= this.cabeca.x ? 1 : -1,
      x: ataque.maoAtacante.x,
      y: ataque.maoAtacante.y,
    });
    personagem.maquinaEstados.mudarEstado("atordoado");
    ataque.maoAtacante.setTexture("forgotten-hand-punch").setRotation(-Math.PI / 2);
    ataque.fase = "grabPresa";
    ataque.tempo = 750;
  }

  iniciarRetornoGrab(ataque) {
    const mao = ataque.maoAtacante;
    if (!mao) return this.finalizarGrab(ataque);
    const textura = ataque.texturasOriginais?.get(mao);
    const escala = ataque.escalasOriginais?.get(mao);
    if (textura) mao.setTexture(textura);
    if (escala) mao.setScale(escala.x, escala.y);
    mao.setRotation(0).setFlipX(false);
    ataque.xInicial = mao.x;
    ataque.yInicial = mao.y;
    ataque.fase = "grabRetorno";
    ataque.tempo = 500;
  }

  finalizarGrab(ataque) {
    this.liberarJogadorGrab();
    ataque.texturasOriginais?.forEach((textura, mao) => {
      const escala = ataque.escalasOriginais?.get(mao);
      mao.setTexture(textura).setRotation(0).setFlipX(false);
      if (escala) mao.setScale(escala.x, escala.y);
    });
    ataque.plataformasAtacadas?.forEach((superficie) => { superficie.body.checkCollision.up = true; });
    const foiProximidade = ataque.tipo === "grabProximidade";
    ataque.fase = "espera";
    ataque.tipo = null;
    ataque.tempo = foiProximidade
      ? (ataque.cooldownPendente ?? 0)
      : Phaser.Math.Between(5000, 8000);
    ataque.cooldownPendente = null;
    ataque.maoAtacante = null;
    ataque.superficieGrab = null;
    ataque.texturasOriginais = null;
    ataque.escalasOriginais = null;
    ataque.plataformasAtacadas = null;
    ataque.maosMovidas = null;
  }

  liberarJogadorGrab() {
    const captura = this.capturaGrab;
    if (!captura) return;
    const { personagem, sprite, body } = captura;
    for (const [nome, metodo] of captura.metodos) {
      if (metodo.proprio) personagem[nome] = metodo.original;
      else delete personagem[nome];
    }
    if (body) {
      body.moves = true;
      body.setAllowGravity(true);
      body.setGravity(0, 0);
      body.setVelocityY(Math.max(80, body.velocity.y));
    }
    if (sprite?.active) sprite.setVisible(captura.visivel);
    this.capturaGrab = null;
  }

  iniciarPrensadaPalm(ataque, jogador) {
    const limites = this.plataforma.body;
    const sprite = jogador;
    ataque.alvoX = Phaser.Math.Clamp(sprite?.x ?? this.plataforma.x, limites.left + 50, limites.right - 50);
    ataque.alvoY = Phaser.Math.Clamp(sprite?.y ?? limites.top - 90, this.limitesArena.minY + 100, this.limitesArena.maxY - 100);
    ataque.maosMovidas = new Set([this.mao6, this.mao7]);
    ataque.plataformasAtacadas = new Set(this.superficiesMaos.map(({ superficie }) => superficie));
    ataque.texturasOriginais = new Map([
      [this.mao6, this.mao6.texture.key],
      [this.mao7, this.mao7.texture.key],
    ]);
    ataque.escalasOriginais = new Map([
      [this.mao6, { x: this.mao6.scaleX, y: this.mao6.scaleY }],
      [this.mao7, { x: this.mao7.scaleX, y: this.mao7.scaleY }],
    ]);
    this.mao6.setTexture("forgotten-hand-palm").setScale(0.38).setRotation(0).setFlipX(false).setVisible(true);
    this.mao7.setTexture("forgotten-hand-palm").setScale(0.38).setRotation(0).setFlipX(true).setVisible(true);
    ataque.plataformasAtacadas.forEach((superficie) => { superficie.body.checkCollision.up = false; });
    ataque.inicioPalmX = new Map([[this.mao6, this.mao6.x], [this.mao7, this.mao7.x]]);
    ataque.inicioPalmY = new Map([[this.mao6, this.mao6.y], [this.mao7, this.mao7.y]]);
    ataque.tempo = 750;
    ataque.fase = "palmPosiciona";
    ataque.acertoResolvido = false;
    this.maosPalmadasJuntas.setPosition(ataque.alvoX, ataque.alvoY).setVisible(false);
  }

  iniciarGolpeL(ataque, jogador) {
    const maos = [this.mao6, this.mao7];
    ataque.maosMovidas = new Set(maos);
    ataque.plataformasAtacadas = new Set(this.superficiesMaos.map(({ superficie }) => superficie));
    ataque.texturasOriginais = new Map(maos.map((mao) => [mao, mao.texture.key]));
    ataque.escalasOriginais = new Map(maos.map((mao) => [mao, { x: mao.scaleX, y: mao.scaleY }]));
    ataque.tamanhosOriginais = new Map(maos.map((mao) => [mao, { largura: mao.displayWidth, altura: mao.displayHeight }]));
    ataque.rotacoesOriginais = new Map(maos.map((mao) => [mao, mao.rotation]));
    ataque.flipsOriginais = new Map(maos.map((mao) => [mao, mao.flipX]));
    ataque.posicoesLInicio = new Map(maos.map((mao) => [mao, { x: mao.x, y: mao.y }]));
    ataque.plataformasAtacadas.forEach((superficie) => { superficie.body.checkCollision.up = false; });
    ataque.alvoLX = Phaser.Math.Clamp(jogador?.x ?? this.cabeca.x, 260, 1760);
    ataque.alvoLY = Phaser.Math.Clamp(jogador?.y ?? this.cabeca.y + 250, 100, 980);
    ataque.fase = "lChegada";
    ataque.tempo = 850;
  }

  iniciarAtaqueGlitter(ataque, jogador) {
    const maos = [this.mao6, this.mao7];
    ataque.maosMovidas = new Set(maos);
    ataque.plataformasAtacadas = new Set(this.superficiesMaos.map(({ superficie }) => superficie));
    ataque.texturasOriginais = new Map(maos.map((mao) => [mao, mao.texture.key]));
    ataque.escalasOriginais = new Map(maos.map((mao) => [mao, { x: mao.scaleX, y: mao.scaleY }]));
    ataque.tamanhosOriginais = new Map(maos.map((mao) => [mao, { largura: mao.displayWidth, altura: mao.displayHeight }]));
    ataque.rotacoesOriginais = new Map(maos.map((mao) => [mao, mao.rotation]));
    ataque.flipsOriginais = new Map(maos.map((mao) => [mao, mao.flipX]));
    ataque.posicoesGlitterInicio = new Map(maos.map((mao) => [mao, { x: mao.x, y: mao.y }]));
    ataque.plataformasAtacadas.forEach((superficie) => { superficie.body.checkCollision.up = false; });
    ataque.alvoGlitterX = Phaser.Math.Clamp(jogador?.x ?? this.cabeca.x, 280, 1640);
    ataque.alvoGlitterY = Phaser.Math.Clamp((jogador?.y ?? this.cabeca.y + 450) - 430, 80, 690);
    ataque.fase = "glitterAproxima";
    ataque.tempo = 800;
  }

  atualizarAtaqueGlitter(delta, ataque, jogador, boss) {
    const atualizarAlvo = () => {
      if (!jogador?.active) return;
      const suavizacao = Math.min(1, delta * 0.004);
      ataque.alvoGlitterX = Phaser.Math.Linear(ataque.alvoGlitterX, Phaser.Math.Clamp(jogador.x, 280, 1640), suavizacao);
      ataque.alvoGlitterY = Phaser.Math.Linear(ataque.alvoGlitterY, Phaser.Math.Clamp(jogador.y - 430, 80, 690), suavizacao);
    };

    if (ataque.fase === "glitterAproxima") {
      atualizarAlvo();
      const t = Phaser.Math.Clamp(1 - Math.max(0, ataque.tempo) / 800, 0, 1);
      const suave = t * t * (3 - 2 * t);
      for (const [indice, mao] of [this.mao6, this.mao7].entries()) {
        const inicio = ataque.posicoesGlitterInicio.get(mao);
        const lado = indice === 0 ? -1 : 1;
        mao.setPosition(
          Phaser.Math.Linear(inicio.x, ataque.alvoGlitterX + lado * 190, suave),
          Phaser.Math.Linear(inicio.y, ataque.alvoGlitterY, suave),
        );
      }
      if (ataque.tempo <= 0) {
        if (!this.scene.anims.exists("forgotten-hand-glitter-loop")) {
          this.scene.anims.create({
            key: "forgotten-hand-glitter-loop",
            frames: this.scene.anims.generateFrameNumbers("forgotten-hand-glitter", { start: 0, end: 14 }),
            frameRate: 18,
            repeat: -1,
          });
        }
        this.mao6.setVisible(false);
        this.mao7.setVisible(false);
        this.maoGlitter.setPosition(ataque.alvoGlitterX, ataque.alvoGlitterY)
          .setVisible(true).play("forgotten-hand-glitter-loop");
        ataque.fase = "glitterSalpica";
        ataque.tempo = 6000;
        ataque.acumuladorGlitter = 1000;
        ataque.proximoNumeroGlitter = 6;
      }
      return;
    }

    if (ataque.fase === "glitterSalpica") {
      atualizarAlvo();
      this.maoGlitter.setPosition(ataque.alvoGlitterX, ataque.alvoGlitterY);
      ataque.acumuladorGlitter += delta;
      while (ataque.acumuladorGlitter >= 1000) {
        ataque.acumuladorGlitter -= 1000;
        const quantidade = 4;
        for (let indice = 0; indice < quantidade; indice++) {
          const numero = ataque.proximoNumeroGlitter;
          const atraso = Phaser.Math.Between(0, 900);
          this.scene.time.delayedCall(atraso, () => {
            if (ataque.fase !== "glitterSalpica" || !this.maoGlitter.active) return;
            this.soltarNumeroGlitter(
              numero,
              jogador,
              boss,
              Phaser.Math.Between(-350, 350),
              Phaser.Math.Between(0, 90),
            );
          });
          ataque.proximoNumeroGlitter = ataque.proximoNumeroGlitter === 6 ? 7 : 6;
        }
      }
      if (ataque.tempo <= 0) this.iniciarRetornoGlitter(ataque);
      return;
    }

    if (ataque.fase === "glitterRetorno") {
      const t = Phaser.Math.Clamp(1 - Math.max(0, ataque.tempo) / 650, 0, 1);
      const suave = t * t * (3 - 2 * t);
      for (const [indice, mao] of [this.mao6, this.mao7].entries()) {
        const inicio = ataque.posicoesGlitterInicio.get(mao);
        const destino = this.obterPosicaoBaseMao(mao);
        const tamanhoInicio = ataque.tamanhosRetornoGlitter.get(mao);
        const tamanhoOriginal = ataque.tamanhosOriginais.get(mao);
        mao.setPosition(Phaser.Math.Linear(inicio.x, destino.x, suave), Phaser.Math.Linear(inicio.y, destino.y, suave));
        mao.setDisplaySize(
          Phaser.Math.Linear(tamanhoInicio.largura, tamanhoOriginal.largura, suave),
          Phaser.Math.Linear(tamanhoInicio.altura, tamanhoOriginal.altura, suave),
        );
      }
      if (ataque.tempo <= 0) {
        for (const mao of [this.mao6, this.mao7]) {
          mao.setTexture(ataque.texturasOriginais.get(mao))
            .setScale(ataque.escalasOriginais.get(mao).x, ataque.escalasOriginais.get(mao).y)
            .setRotation(ataque.rotacoesOriginais.get(mao) ?? 0)
            .setFlipX(ataque.flipsOriginais.get(mao) ?? false)
            .setVisible(true);
        }
        ataque.plataformasAtacadas?.forEach((superficie) => { superficie.body.checkCollision.up = true; });
        this.finalizarEsmagamento(ataque);
      }
    }
  }

  soltarNumeroGlitter(numero, jogador, boss, deslocamentoX = Phaser.Math.Between(-210, 210), deslocamentoY = 0) {
    if (!jogador?.active) return;
    const x = Phaser.Math.Clamp(this.maoGlitter.x + deslocamentoX, 35, 1885);
    const y = this.maoGlitter.y + 125 + deslocamentoY;
    const projetil = this.scene.physics.add.image(x, y, `${numero}.png`);
    projetil.setDisplaySize(38, 46).setDepth(3);
    this.scene.camHUD?.ignore(projetil);
    projetil.body.setAllowGravity(false);
    projetil.body.setSize(36, 45, true);
    const velocidadeX = Phaser.Math.Clamp((jogador.x - x) * 0.12, -100, 100);
    projetil.body.setVelocity(velocidadeX, 420);
    const registro = { projetil, timer: null, numero, boss, angulo: Math.PI / 2 };
    this.projeteisArma.add(registro);
    registro.timer = this.scene.time.delayedCall(3500, () => this.destruirProjetilArma(registro));
  }

  iniciarRetornoGlitter(ataque) {
    this.maoGlitter.stop().setVisible(false);
    const maos = [this.mao6, this.mao7];
    ataque.posicoesGlitterInicio = new Map();
    ataque.tamanhosRetornoGlitter = new Map();
    for (const [indice, mao] of maos.entries()) {
      const lado = indice === 0 ? -1 : 1;
      mao.setTexture(ataque.texturasOriginais.get(mao))
        .setRotation(0)
        .setFlipX(ataque.flipsOriginais.get(mao) ?? false)
        .setPosition(ataque.alvoGlitterX + lado * 100, ataque.alvoGlitterY)
        .setVisible(true);
      const tamanhoOriginal = ataque.tamanhosOriginais.get(mao);
      const alturaInicio = 170 * (tamanhoOriginal.altura / tamanhoOriginal.largura);
      mao.setDisplaySize(170, alturaInicio);
      ataque.posicoesGlitterInicio.set(mao, { x: mao.x, y: mao.y });
      ataque.tamanhosRetornoGlitter.set(mao, { largura: mao.displayWidth, altura: mao.displayHeight });
    }
    ataque.fase = "glitterRetorno";
    ataque.tempo = 650;
  }

  posicionarMolduraL(ataque, mao, espalhamentoX, espalhamentoY, progressoRotacao) {
    const esquerda = mao === this.mao6;
    const sinal = esquerda ? -1 : 1;
    const cantoX = ataque.alvoLX + sinal * espalhamentoX;
    const cantoY = ataque.alvoLY + (esquerda ? 1 : -1) * espalhamentoY;
    const rotacaoFinal = 0;
    const posicao = ataque.posicoesLInicio.get(mao);
    const alvoX = cantoX + (esquerda ? 30 : -30);
    const alvoY = cantoY + 5;
    const t = Phaser.Math.Clamp(progressoRotacao, 0, 1);
    mao.setPosition(Phaser.Math.Linear(posicao.x, alvoX, t), Phaser.Math.Linear(posicao.y, alvoY, t));
    mao.setRotation(Phaser.Math.Linear(ataque.rotacoesOriginais.get(mao) ?? 0, rotacaoFinal, t));
    const tamanhoOriginal = ataque.tamanhosOriginais.get(mao);
    mao.setDisplaySize(
      Phaser.Math.Linear(tamanhoOriginal.largura, 360, t),
      Phaser.Math.Linear(tamanhoOriginal.altura, 240, t),
    );
  }

  atualizarGolpeL(delta, ataque, jogador, boss) {
    if (ataque.fase.startsWith("raio")) {
      this.atualizarRaioBucal(delta, ataque, jogador, boss);
      return;
    }

    if (ataque.fase === "lChegada") {
      const t = Phaser.Math.Clamp(1 - Math.max(0, ataque.tempo) / 850, 0, 1);
      const suave = t * t * (3 - 2 * t);
      for (const mao of [this.mao6, this.mao7]) {
        if (mao.texture.key !== "forgotten-hand-L") mao.setTexture("forgotten-hand-L");
        mao.setFlipX(mao === this.mao7);
        this.posicionarMolduraL(ataque, mao, 220, 160, suave);
      }
      if (ataque.tempo <= 0) {
        ataque.fase = "lFecha";
        ataque.tempo = 550;
        ataque.posicoesLInicio = new Map([this.mao6, this.mao7].map((mao) => [mao, { x: mao.x, y: mao.y }]));
        ataque.rotacoesLInicio = new Map([this.mao6, this.mao7].map((mao) => [mao, mao.rotation]));
      }
      return;
    }

    if (ataque.fase === "lFecha") {
      const t = Phaser.Math.Clamp(1 - Math.max(0, ataque.tempo) / 550, 0, 1);
      const suave = t * t * (3 - 2 * t);
      for (const mao of [this.mao6, this.mao7]) {
        const esquerda = mao === this.mao6;
        const sinal = esquerda ? -1 : 1;
        const cantoX = ataque.alvoLX + sinal * Phaser.Math.Linear(220, 110, suave);
        const cantoY = ataque.alvoLY + (esquerda ? 1 : -1) * Phaser.Math.Linear(160, 90, suave);
        const alvoX = cantoX + (esquerda ? 30 : -30);
        const alvoY = cantoY + 5;
        const inicio = ataque.posicoesLInicio.get(mao);
        mao.setPosition(Phaser.Math.Linear(inicio.x, alvoX, suave), Phaser.Math.Linear(inicio.y, alvoY, suave));
        mao.setRotation(Phaser.Math.Linear(ataque.rotacoesLInicio.get(mao), 0, suave));
      }
      if (ataque.tempo <= 0) {
        const corpo = jogador?.body;
        const dentroDaMoldura = corpo &&
          Math.abs(corpo.center.x - ataque.alvoLX) <= 105 &&
          Math.abs(corpo.center.y - ataque.alvoLY) <= 85;
        if (dentroDaMoldura && this.capturarJogadorEnquadrado(jogador)) {
          this.iniciarRaioBucal(ataque);
        } else {
          this.iniciarRetornoMaosL(ataque);
        }
      }
      return;
    }

    if (ataque.fase === "lRetorno") {
      const t = Phaser.Math.Clamp(1 - Math.max(0, ataque.tempo) / 650, 0, 1);
      const suave = t * t * (3 - 2 * t);
      for (const mao of [this.mao6, this.mao7]) {
        const inicio = ataque.posicoesLInicio.get(mao);
        const destino = this.obterPosicaoBaseMao(mao);
        const tamanhoOriginal = ataque.tamanhosOriginais.get(mao);
        const tamanhoInicio = ataque.tamanhosRetornoInicio.get(mao);
        mao.setPosition(Phaser.Math.Linear(inicio.x, destino.x, suave), Phaser.Math.Linear(inicio.y, destino.y, suave));
        mao.setRotation(Phaser.Math.Linear(ataque.rotacoesLInicio.get(mao), ataque.rotacoesOriginais.get(mao) ?? 0, suave));
        mao.setDisplaySize(Phaser.Math.Linear(tamanhoInicio.largura, tamanhoOriginal.largura, suave), Phaser.Math.Linear(tamanhoInicio.altura, tamanhoOriginal.altura, suave));
      }
      if (ataque.tempo <= 0) {
        for (const mao of [this.mao6, this.mao7]) {
          mao.setTexture(ataque.texturasOriginais.get(mao))
            .setScale(ataque.escalasOriginais.get(mao).x, ataque.escalasOriginais.get(mao).y)
            .setRotation(ataque.rotacoesOriginais.get(mao) ?? 0)
            .setFlipX(ataque.flipsOriginais.get(mao) ?? false);
        }
        ataque.plataformasAtacadas?.forEach((superficie) => { superficie.body.checkCollision.up = true; });
        this.liberarJogadorEnquadrado();
        this.finalizarEsmagamento(ataque);
      }
    }
  }

  iniciarRetornoMaosL(ataque) {
    ataque.posicoesLInicio = new Map([this.mao6, this.mao7].map((mao) => [mao, { x: mao.x, y: mao.y }]));
    ataque.rotacoesLInicio = new Map([this.mao6, this.mao7].map((mao) => [mao, mao.rotation]));
    ataque.tamanhosRetornoInicio = new Map([this.mao6, this.mao7].map((mao) => [mao, { largura: mao.displayWidth, altura: mao.displayHeight }]));
    ataque.fase = "lRetorno";
    ataque.tempo = 650;
  }

  capturarJogadorEnquadrado(sprite) {
    const personagem = this.obterPersonagemPorSprite(sprite);
    const body = sprite?.body;
    if (!personagem || !sprite?.active || !body || this.capturaEnquadramento) return false;
    const nomesInput = ["inputDown", "inputJustDown", "inputJustUp"];
    this.capturaEnquadramento = {
      personagem,
      body,
      moves: body.moves,
      allowGravity: body.allowGravity,
      gravityY: body.gravity.y,
      velocidadeX: body.velocity.x,
      velocidadeY: body.velocity.y,
      metodos: new Map(nomesInput.map((nome) => [nome, {
        proprio: Object.prototype.hasOwnProperty.call(personagem, nome),
        original: personagem[nome],
      }])),
    };
    nomesInput.forEach((nome) => { personagem[nome] = () => false; });
    body.moves = false;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    return true;
  }

  liberarJogadorEnquadrado() {
    const captura = this.capturaEnquadramento;
    if (!captura) return;
    for (const [nome, metodo] of captura.metodos) {
      if (metodo.proprio) captura.personagem[nome] = metodo.original;
      else delete captura.personagem[nome];
    }
    const body = captura.body;
    if (body) {
      body.moves = captura.moves;
      body.setAllowGravity(captura.allowGravity);
      body.setGravityY(captura.gravityY);
      body.setVelocity(captura.velocidadeX, captura.velocidadeY);
    }
    this.capturaEnquadramento = null;
  }

  definirRostoBoss(textura) {
    this.rostoAtual = textura;
    this.cabeca.setTexture(textura).setDisplaySize(600, 600);
  }

  iniciarRaioBucal(ataque) {
    this.definirRostoBoss("forgotten-face-2");
    ataque.fase = "raioAbrindo";
    ataque.etapaRosto = 2;
    ataque.tempo = 110;
    ataque.ultimoHitRaio = -Infinity;
    ataque.raiosCriados = false;
  }

  iniciarFeixeBucal(ataque) {
    const cena = this.scene;
    const textura1 = cena.textures.get("forgotten-beam-1");
    const textura2 = cena.textures.get("forgotten-beam-2");
    const ultimoFrame1 = Math.max(0, textura1.frameTotal - 2);

    const criarAnimacao = (chave, textura, inicio, fim, repeat) => {
      if (cena.anims.exists(chave)) return;
      cena.anims.create({
        key: chave,
        frames: cena.anims.generateFrameNumbers(textura, { start: inicio, end: fim }),
        frameRate: 24,
        repeat,
      });
    };
    criarAnimacao("forgotten-beam1-open", "forgotten-beam-1", 0, ultimoFrame1, 0);
    criarAnimacao("forgotten-beam2-open", "forgotten-beam-2", 0, 16, 0);
    criarAnimacao("forgotten-beam2-loop", "forgotten-beam-2", 13, 16, -1);

    const aplicarEscalaCinza = (raio) => {
      raio.clearTint();
      raio.postFX?.addColorMatrix().grayscale(1);
      raio.preFX?.addColorMatrix().grayscale(1);
    };
    const origem = this.obterOrigemRaioBucal();
    const raio1 = cena.add.sprite(origem.x, origem.y, "forgotten-beam-1")
      .setOrigin(0, 0.5).setBlendMode(Phaser.BlendModes.NORMAL).setDepth(-1.5);
    const raio2 = cena.add.sprite(origem.x, origem.y, "forgotten-beam-2")
      .setOrigin(0, 0.5).setBlendMode(Phaser.BlendModes.NORMAL).setDepth(-1.4);
    aplicarEscalaCinza(raio1);
    aplicarEscalaCinza(raio2);
    cena.camHUD?.ignore(raio1);
    cena.camHUD?.ignore(raio2);
    raio1.play("forgotten-beam1-open");
    raio1.once("animationcomplete", () => raio1.anims.pause());
    raio2.play("forgotten-beam2-open");
    raio2.once("animationcomplete", () => {
      if (raio2.active) raio2.play("forgotten-beam2-loop");
    });
    this.raiosBucais.add(raio1);
    this.raiosBucais.add(raio2);
    ataque.raio1 = raio1;
    ataque.raio2 = raio2;
    ataque.raiosCriados = true;
    ataque.fase = "raioAtivo";
    ataque.tempo = 4000;
  }

  obterOrigemRaioBucal() {
    const cabeca = this.cabeca;
    const offsetX = 20 * cabeca.scaleX;
    const offsetY = 148 * cabeca.scaleY;
    const cos = Math.cos(cabeca.rotation);
    const sin = Math.sin(cabeca.rotation);
    return {
      x: cabeca.x + offsetX * cos - offsetY * sin,
      y: cabeca.y + offsetX * sin + offsetY * cos,
    };
  }

  atualizarRaioBucal(delta, ataque, jogador, boss) {
    if (ataque.fase === "raioAbrindo") {
      if (ataque.tempo > 0) return;
      if (ataque.etapaRosto < 4) {
        ataque.etapaRosto++;
        this.definirRostoBoss(ataque.etapaRosto === 1 ? "forgotten-face" : `forgotten-face-${ataque.etapaRosto}`);
        ataque.tempo = 110;
        return;
      }
      this.iniciarFeixeBucal(ataque);
      return;
    }

    if (ataque.fase === "raioAtivo") {
      if (ataque.tempo <= 0) {
        for (const raio of [ataque.raio1, ataque.raio2]) {
          if (raio?.active) {
            this.raiosBucais.delete(raio);
            raio.destroy();
          }
        }
        ataque.raio1 = null;
        ataque.raio2 = null;
        ataque.fase = "raioFechando";
        ataque.etapaRosto = 3;
        ataque.tempo = 110;
        this.definirRostoBoss("forgotten-face-3");
        return;
      }

      const origem = this.obterOrigemRaioBucal();
      const alvoX = jogador?.active ? jogador.x : origem.x;
      const alvoY = jogador?.active ? jogador.y : origem.y + 500;
      const anguloAlvo = Phaser.Math.Clamp(
        Phaser.Math.Angle.Between(origem.x, origem.y, alvoX, alvoY),
        Phaser.Math.DegToRad(25),
        Phaser.Math.DegToRad(155),
      );
      const comprimento = Math.max(400, Math.hypot(alvoX - origem.x, alvoY - origem.y) + 100);
      const espessuraVisual = 210;
      for (const raio of [ataque.raio1, ataque.raio2]) {
        if (!raio?.active) continue;
        raio.setPosition(origem.x, origem.y).setRotation(anguloAlvo)
          .setDisplaySize(comprimento, espessuraVisual);
      }

      const ux = Math.cos(anguloAlvo);
      const uy = Math.sin(anguloAlvo);
      const nx = -uy;
      const ny = ux;
      const metadeEspessura = 30;
      const pontos = [
        { x: origem.x + nx * metadeEspessura, y: origem.y + ny * metadeEspessura },
        { x: origem.x + ux * comprimento + nx * metadeEspessura, y: origem.y + uy * comprimento + ny * metadeEspessura },
        { x: origem.x + ux * comprimento - nx * metadeEspessura, y: origem.y + uy * comprimento - ny * metadeEspessura },
        { x: origem.x - nx * metadeEspessura, y: origem.y - ny * metadeEspessura },
      ];
      this.desenharHitboxAtaque(pontos);

      const corpo = jogador?.body;
      const personagem = this.obterPersonagemPorSprite(jogador);
      const hurtboxes = personagem?.grupoHurtbox?.getChildren() ?? [];
      const acertou = corpo && this.hitboxPoligonalSobrepoeCorpo({ pontos }, corpo) ||
        hurtboxes.some((hurtbox) => this.hitboxPoligonalSobrepoeCorpo({ pontos }, hurtbox.body));
      const agora = this.scene.time.now;
      if (acertou && agora - ataque.ultimoHitRaio >= 180) {
        ataque.ultimoHitRaio = agora;
        personagem?.receberDano(5, {
          tipoSomImpacto: "light",
          knockbackX: Math.abs(ux * 85),
          knockbackY: uy * 85 - 10,
          knockbackFixo: true,
          hitstunFixoFrames: 12,
          ignorarHitstunDecay: true,
        }, {
          atacante: boss,
          direcao: Math.sign(ux) || 1,
          x: origem.x,
          y: origem.y,
        });
      }
      return;
    }

    if (ataque.fase === "raioFechando" && ataque.tempo <= 0) {
      if (ataque.etapaRosto > 1) {
        ataque.etapaRosto--;
        this.definirRostoBoss(ataque.etapaRosto === 1 ? "forgotten-face" : `forgotten-face-${ataque.etapaRosto}`);
        ataque.tempo = 110;
      } else {
        this.definirRostoBoss(this.rostoBase);
        if (ataque.tipo === "golpeL") {
          this.liberarJogadorEnquadrado();
          this.iniciarRetornoMaosL(ataque);
        } else {
          this.finalizarEsmagamento(ataque);
        }
      }
    }
  }

  limparRaioBucal() {
    for (const raio of this.raiosBucais ?? []) raio.destroy();
    this.raiosBucais?.clear();
  }

  iniciarAtaqueArma(ataque) {
    const maos = [this.mao6, this.mao7];
    ataque.maosMovidas = new Set(maos);
    ataque.plataformasAtacadas = new Set(this.superficiesMaos.map(({ superficie }) => superficie));
    ataque.texturasOriginais = new Map(maos.map((mao) => [mao, mao.texture.key]));
    ataque.escalasOriginais = new Map(maos.map((mao) => [mao, { x: mao.scaleX, y: mao.scaleY }]));
    ataque.posicoesArmaInicio = new Map(maos.map((mao) => [mao, { x: mao.x, y: mao.y }]));
    ataque.plataformasAtacadas.forEach((superficie) => { superficie.body.checkCollision.up = false; });
    for (const mao of maos) {
      const direita = mao === this.mao7;
      mao.setTexture("forgotten-hand-gun")
        .setDisplaySize(direita ? 264 : 220, direita ? 191.4 : 159.5)
        .setRotation(0).setFlipX(direita).setVisible(true);
    }
    ataque.fase = "armaPosiciona";
    ataque.tempo = 750;
    ataque.disparosArma = 0;
    ataque.acumuladorDisparo = 0;
  }

  atualizarAtaqueArma(delta, ataque, jogador, boss) {
    const progresso = (duracao) => 1 - Math.max(0, ataque.tempo) / duracao;
    if (ataque.fase === "armaPosiciona") {
      const t = Phaser.Math.Clamp(progresso(750), 0, 1);
      const suave = t * t * (3 - 2 * t);
      for (const [indice, mao] of [this.mao6, this.mao7].entries()) {
        const origem = ataque.posicoesArmaInicio.get(mao);
        const lado = indice === 0 ? -1 : 1;
        const base = this.obterPosicaoBaseMao(mao);
        mao.setPosition(
          Phaser.Math.Linear(origem.x, this.xBaseAtual + lado * (this.parMaosAtivo.alcanceX + 210), suave),
          Phaser.Math.Linear(origem.y, base.y, suave),
        );
      }
      if (ataque.tempo <= 0) {
        ataque.fase = "armaDisparo";
        ataque.tempo = 8450;
        ataque.acumuladorDisparo = 650;
      }
      return;
    }

    if (ataque.fase === "armaDisparo") {
      for (const mao of [this.mao6, this.mao7]) {
        if (jogador?.active) {
          const angulo = Phaser.Math.Angle.Between(mao.x, mao.y, jogador.x, jogador.y);
          const anguloArma = mao === this.mao7 ? Phaser.Math.Angle.Wrap(angulo - Math.PI) : angulo;
          mao.rotation = Phaser.Math.Angle.RotateTo(mao.rotation, anguloArma, Math.min(Math.PI, delta * 0.006));
        }
      }
      ataque.acumuladorDisparo += delta;
      while (ataque.acumuladorDisparo >= 650 && ataque.disparosArma < 13) {
        ataque.acumuladorDisparo -= 650;
        const mao = ataque.disparosArma % 2 === 0 ? this.mao6 : this.mao7;
        const numero = ataque.disparosArma % 2 === 0 ? 6 : 7;
        this.dispararNumeroArma(mao, numero, jogador, boss);
        ataque.disparosArma++;
      }
      if (ataque.disparosArma >= 13) {
        ataque.fase = "armaRetorno";
        ataque.tempo = 550;
        ataque.posicoesRetorno = new Map([
          [this.mao6, { x: this.mao6.x, y: this.mao6.y }],
          [this.mao7, { x: this.mao7.x, y: this.mao7.y }],
        ]);
      }
      return;
    }

    if (ataque.fase === "armaRetorno") {
      const t = Phaser.Math.Clamp(progresso(550), 0, 1);
      const suave = t * t * (3 - 2 * t);
      for (const mao of [this.mao6, this.mao7]) {
        const inicio = ataque.posicoesRetorno.get(mao);
        const base = this.obterPosicaoBaseMao(mao);
        mao.setPosition(Phaser.Math.Linear(inicio.x, base.x, suave), Phaser.Math.Linear(inicio.y, base.y, suave));
        mao.rotation = Phaser.Math.Angle.RotateTo(mao.rotation, 0, Math.min(Math.PI, delta * 0.006));
      }
      if (ataque.tempo <= 0) this.finalizarEsmagamento(ataque);
    }
  }

  dispararNumeroArma(mao, numero, jogador, boss) {
    if (!jogador?.active) return;
    const cena = this.scene;
    const angulo = Phaser.Math.Angle.Between(mao.x, mao.y, jogador.x, jogador.y);
    const projetil = cena.physics.add.image(mao.x + Math.cos(angulo) * 90, mao.y + Math.sin(angulo) * 90, `${numero}.png`);
    projetil.setDisplaySize(38, 46).setDepth(3);
    cena.camHUD?.ignore(projetil);
    projetil.body.setAllowGravity(false);
    projetil.body.setSize(36, 45, true);
    projetil.body.setVelocity(Math.cos(angulo) * 620, Math.sin(angulo) * 620);
    const registro = { projetil, timer: null, numero, boss, angulo, alvo: this.obterPersonagemPorSprite(jogador) };
    this.projeteisArma.add(registro);
    registro.timer = cena.time.delayedCall(3500, () => this.destruirProjetilArma(registro));
  }

  acertarProjetilArma(registro) {
    if (!this.projeteisArma.has(registro)) return;
    registro.alvo?.receberDano(registro.numero, {
      knockbackX: 180,
      knockbackY: -55,
    }, {
      atacante: registro.boss,
      direcao: Math.cos(registro.angulo) >= 0 ? 1 : -1,
      x: registro.projetil.x,
      y: registro.projetil.y,
    });
    this.destruirProjetilArma(registro);
  }

  destruirProjetilArma(registro) {
    if (!this.projeteisArma?.has(registro)) return;
    this.projeteisArma.delete(registro);
    registro.timer?.remove(false);
    registro.projetil.destroy();
  }

  atualizarPrensadaPalm(delta, ataque, jogador, boss) {
    if (ataque.fase === "palmPosiciona") {
      const progresso = 1 - Math.max(0, ataque.tempo) / 750;
      const suavizado = progresso * progresso * (3 - 2 * progresso);
      const limites = this.plataforma.body;
      const alvoJogadorX = Phaser.Math.Clamp(jogador?.x ?? ataque.alvoX, limites.left + 50, limites.right - 50);
      const alvoJogadorY = Phaser.Math.Clamp(
        jogador?.y ?? ataque.alvoY,
        this.limitesArena.minY + 100,
        this.limitesArena.maxY - 100,
      );
      const acompanhamento = Math.min(1, delta * 0.012);
      ataque.alvoX = Phaser.Math.Linear(ataque.alvoX, alvoJogadorX, acompanhamento);
      ataque.alvoY = Phaser.Math.Linear(ataque.alvoY, alvoJogadorY, acompanhamento);
      const posicoesAlvo = new Map([
        [this.mao6, ataque.alvoX - 220],
        [this.mao7, ataque.alvoX + 220],
      ]);
      for (const mao of [this.mao6, this.mao7]) {
        const xInicio = ataque.inicioPalmX.get(mao);
        const yInicio = ataque.inicioPalmY.get(mao);
        mao.setPosition(
          Phaser.Math.Linear(xInicio, posicoesAlvo.get(mao), suavizado),
          Phaser.Math.Linear(yInicio, ataque.alvoY, suavizado),
        );
      }
      if (ataque.tempo <= 0) {
        this.mao6.setPosition(ataque.alvoX - 220, ataque.alvoY);
        this.mao7.setPosition(ataque.alvoX + 220, ataque.alvoY);
        ataque.fase = "palmAviso";
        ataque.tempo = 450;
      }
      return;
    }

    if (ataque.fase === "palmAviso") {
      this.mao6.setPosition(ataque.alvoX - 220, ataque.alvoY);
      this.mao7.setPosition(ataque.alvoX + 220, ataque.alvoY);
      if (ataque.tempo <= 0) {
        ataque.fase = "palmFecha";
        ataque.tempo = 550;
      }
      return;
    }

    if (ataque.fase === "palmFecha") {
      const progresso = 1 - Math.max(0, ataque.tempo) / 550;
      const suavizado = progresso * progresso * (3 - 2 * progresso);
      this.mao6.setPosition(Phaser.Math.Linear(ataque.alvoX - 220, ataque.alvoX - 45, suavizado), ataque.alvoY);
      this.mao7.setPosition(Phaser.Math.Linear(ataque.alvoX + 220, ataque.alvoX + 45, suavizado), ataque.alvoY);
      this.acertarPrensadaPalm(ataque, jogador, boss);
      if (ataque.tempo <= 0) {
        this.mao6.setPosition(ataque.alvoX - 45, ataque.alvoY).setVisible(false);
        this.mao7.setPosition(ataque.alvoX + 45, ataque.alvoY).setVisible(false);
        this.maosPalmadasJuntas.setPosition(ataque.alvoX, ataque.alvoY).setVisible(true);
        this.scene.camJogo.shake(220, 0.012);
        this.acertarPrensadaPalm(ataque, jogador, boss);
        ataque.fase = "palmContato";
        ataque.tempo = 650;
      }
      return;
    }

    if (ataque.fase === "palmContato") {
      this.maosPalmadasJuntas.setPosition(ataque.alvoX, ataque.alvoY);
      if (ataque.tempo <= 0) {
        this.maosPalmadasJuntas.setVisible(false);
        this.mao6.setVisible(true);
        this.mao7.setVisible(true);
        ataque.texturasOriginais?.forEach((textura, mao) => {
          const escala = ataque.escalasOriginais.get(mao);
          mao.setTexture(textura).setScale(escala.x, escala.y).setRotation(0).setFlipX(false);
        });
        ataque.posicoesRetorno = new Map([
          [this.mao6, { x: this.mao6.x, y: this.mao6.y }],
          [this.mao7, { x: this.mao7.x, y: this.mao7.y }],
        ]);
        ataque.tempo = 440;
        ataque.fase = "palmRetorno";
      }
      return;
    }

    if (ataque.fase === "palmRetorno") {
      const progresso = 1 - Math.max(0, ataque.tempo) / 440;
      const alvosBase = new Map([
        [this.mao6, this.obterPosicaoBaseMao(this.mao6)],
        [this.mao7, this.obterPosicaoBaseMao(this.mao7)],
      ]);
      for (const mao of [this.mao6, this.mao7]) {
        const inicio = ataque.posicoesRetorno.get(mao);
        const destino = alvosBase.get(mao);
        mao.setPosition(
          Phaser.Math.Linear(inicio.x, destino.x, progresso),
          Phaser.Math.Linear(inicio.y, destino.y, progresso),
        );
      }
      if (ataque.tempo <= 0) {
        ataque.plataformasAtacadas?.forEach((superficie) => { superficie.body.checkCollision.up = true; });
        ataque.fase = "espera";
        ataque.tipo = null;
        ataque.tempo = Phaser.Math.Between(5000, 8000);
        ataque.plataformasAtacadas = null;
        ataque.texturasOriginais = null;
        ataque.escalasOriginais = null;
        ataque.maosMovidas = null;
        ataque.posicoesRetorno = null;
      }
    }
  }

  acertarPrensadaPalm(ataque, jogador, boss) {
    if (ataque.acertoResolvido || !jogador?.active || !jogador.body) return;
    const corpo = jogador.body;
    const acertou = [this.mao6, this.mao7].some((mao) => {
      const hitbox = this.obterHitboxSprite(mao);
      this.desenharHitboxAtaque(hitbox.pontos);
      return this.hitboxPoligonalSobrepoeCorpo(hitbox, corpo);
    });
    if (!acertou) return;
    ataque.acertoResolvido = true;
    const direcao = jogador.x >= ataque.alvoX ? 1 : -1;
    this.obterPersonagemPorSprite(jogador)?.receberDano(40, {
      tipoSomImpacto: "heavy",
      knockbackX: 650,
      knockbackY: -850,
    }, {
      atacante: boss,
      direcao,
      x: ataque.alvoX,
      y: ataque.alvoY,
    });
  }

  atualizarVarredura(delta, ataque, jogador, boss, topoPlataforma) {
    if (ataque.fase === "varridaIntervalo") {
      if (ataque.tempo <= 0) this.iniciarGolpeVarredura(ataque, jogador, topoPlataforma);
      return;
    }

    const mao = ataque.maoAtacante;
    if (!mao) {
      this.restaurarMaoVarredura(ataque);
      ataque.fase = "espera";
      ataque.tipo = null;
      ataque.tempo = Phaser.Math.Between(5000, 8000);
      return;
    }

    if (ataque.fase === "varridaAproximacao") {
      const progresso = 1 - Math.max(0, ataque.tempo) / 300;
      mao.setPosition(
        Phaser.Math.Linear(ataque.xInicial, ataque.inicioVarreduraX, progresso),
        Phaser.Math.Linear(ataque.yInicial, ataque.alturaBaseVarredura, progresso),
      );
      if (ataque.tempo <= 0) {
        mao.setPosition(ataque.inicioVarreduraX, ataque.alturaBaseVarredura);
        ataque.fase = "varrida";
        ataque.tempo = 650;
      }
      return;
    }

    if (ataque.fase === "varrida") {
      const progresso = 1 - Math.max(0, ataque.tempo) / 650;
      const x = Phaser.Math.Linear(ataque.inicioVarreduraX, ataque.fimVarreduraX, progresso);
      const y = ataque.alturaBaseVarredura + Math.sin(progresso * Math.PI) * 150;
      mao.setPosition(x, y);
      ataque.alvoX = x;
      this.acertarVarredura(ataque, jogador, boss, x, y);
      if (ataque.tempo <= 0) {
        mao.setPosition(ataque.fimVarreduraX, ataque.alturaBaseVarredura);
        ataque.xInicial = mao.x;
        ataque.yInicial = mao.y;
        ataque.fase = "varridaRetorno";
        ataque.tempo = 500;
      }
      return;
    }

    if (ataque.fase === "varridaRetorno") {
      const progresso = 1 - Math.max(0, ataque.tempo) / 500;
      const base = this.obterPosicaoBaseMao(mao);
      mao.setPosition(
        Phaser.Math.Linear(ataque.xInicial, base.x, progresso),
        Phaser.Math.Linear(ataque.yInicial, base.y, progresso),
      );
      if (ataque.tempo <= 0) {
        this.restaurarMaoVarredura(ataque);
        ataque.golpes++;
        if (ataque.golpes < ataque.total) {
          ataque.fase = "varridaIntervalo";
          ataque.tempo = 180;
        } else {
          ataque.fase = "espera";
          ataque.tipo = null;
          ataque.tempo = Phaser.Math.Between(5000, 8000);
          ataque.maoAtacante = null;
        }
      }
      return;
    }

  }

  acertarVarredura(ataque, jogador, boss, xAtual, yAtual) {
    if (!jogador?.active || !jogador.body) return;
    const corpo = jogador.body;
    const hitbox = this.obterHitboxSprite(ataque.maoAtacante);
    this.desenharHitboxAtaque(hitbox.pontos);
    if (ataque.acertoResolvido || !this.hitboxPoligonalSobrepoeCorpo(hitbox, corpo)) return;
    ataque.acertoResolvido = true;
    this.obterPersonagemPorSprite(jogador)?.receberDano(30, {
      tipoSomImpacto: "heavy",
      knockbackX: 1050,
      knockbackY: -120,
    }, {
      atacante: boss,
      direcao: ataque.direcaoVarredura,
      x: xAtual,
      y: yAtual,
    });
  }

  restaurarMaoVarredura(ataque) {
    ataque.texturasOriginais?.forEach((textura, mao) => mao.setTexture(textura).setRotation(0).setFlipX(false));
    ataque.plataformasAtacadas?.forEach((superficie) => { superficie.body.checkCollision.up = true; });
    ataque.maoAtacante = null;
    ataque.texturasOriginais = null;
    ataque.plataformasAtacadas = null;
    ataque.maosMovidas = null;
  }

  acertarEsmagamento(ataque, boss, topoPlataforma) {
    const mao = ataque.maoAtacante;
    if (!mao) return;
    const hitbox = this.obterHitboxSprite(mao);
    this.desenharHitboxAtaque(hitbox.pontos);
    const personagem = this.obterJogadoresAlvoBoss().find((alvo) =>
      this.hitboxPoligonalSobrepoeCorpo(hitbox, alvo.sprite.body)
    );
    const jogador = personagem?.sprite;
    if (ataque.acertoResolvido || !jogador) return;
    ataque.acertoResolvido = true;
    const direcao = jogador.x >= this.cabeca.x ? 1 : -1;
    personagem.receberDano(50, {
      tipoSomImpacto: "heavy",
      knockbackX: 1100,
      knockbackY: -750,
    }, {
      atacante: boss,
      direcao,
      x: ataque.alvoX,
      y: topoPlataforma,
    });
  }

  finalizarEsmagamento(ataque) {
    ataque.fase = "espera";
    ataque.tipo = null;
    ataque.tempo = Phaser.Math.Between(5000, 8000);
    ataque.texturasOriginais?.forEach((textura, mao) => {
      mao.setTexture(textura).setRotation(0).setFlipX(false);
      const escala = ataque.escalasOriginais?.get(mao);
      if (escala) mao.setScale(escala.x, escala.y);
    });
    ataque.plataformasAtacadas?.forEach((superficie) => { superficie.body.checkCollision.up = true; });
    ataque.maoAtacante = null;
    ataque.plataformasAtacadas = null;
    ataque.texturasOriginais = null;
    ataque.escalasOriginais = null;
    ataque.maosMovidas = null;
    ataque.posicoesRetorno = null;
  }

  selecionarAtaque() {
    let candidatos = this.ataquesDisponiveis;
    if (this.elapsed < this.grabCooldownAte) {
      candidatos = candidatos.filter((chave) => chave !== "grab");
    }
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
