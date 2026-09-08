const INTRO = {
  duracao: 9000,

  // Mesmo SpiderUlt
  tempoZoom: 200,
  zoom: 1.4,

  // Escurece só perto do fim da intro
  escurecerAos: 7000,
  tempoEscurecer: 1800
};

const RAIO = {
  duracao: 10000,

  // Grande hit exatamente na metade
  grandeHitAos: 5000,

  // Bem mais comprido
  comprimento: 1900,
  espessura: 210,

  anguloMin: -35,
  anguloMax: 35,
  velocidadeAngulo: 55,

  // multihit
  intervaloHit: 180,
  danoHit: 0.8,
  knockHit: 45,

  // final
  danoFinal: 10,
  knockFinal: 900,

  fadeOut: 700
};


export default class MikuUlt {

  constructor(personagem, configUlt, estadoFSM) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.estadoFSM = estadoFSM;

    this.cancelada = false;
    this.finalizando = false;

    this.fase = "intro";

    // camera
    this.funcaoCamOriginal = null;

    // fundo
    this.fundoUlt = null;
    this.fundoOriginal = null;
    this.fundoOriginalVisivel = true;
    this.plataformas = [];

    // intro
    this.overlayPreto = null;
    this.pausouFrame3 = false;
    this.introLiberada = false;
    this.fnMegaSing = null;

    // efeitos
    this.efeitos = new Set();
    this.pose1 = null;
    this.pose2 = null;
    this.sparkles = null;

    // raio
    this.raio1 = null;
    this.raio2 = null;
    this.beam2Iniciado = false;

    this.angulo = 0;
    this.ultimoUpdate = 0;

    this.ultimoHit = new Map();

    this.bloqueioMultihit = new Map();

    // som
    this.somBeam = null;

    // freeze
    this.pauseiFisica = false;
    this.animacoesPausadas = [];

    // timers
    this.timers = new Set();

    this.musicasFaseMutadas = [];
  }

  mutarMusicaFase() {

  this.musicasFaseMutadas = [];

  for (const som of this.scene.sound.sounds) {

    // A música da Ult ainda nem foi iniciada aqui,
    // então pegamos os loops que já estavam tocando.
    if (
      !som?.isPlaying ||
      !som.loop
    ) {
      continue;
    }

    this.musicasFaseMutadas.push({
      som,
      volume: som.volume
    });

    som.setVolume(0);
  }
}

restaurarMusicaFase() {

  for (
    const item of
    this.musicasFaseMutadas
  ) {

    if (
      item.som &&
      !item.som.pendingRemove
    ) {
      item.som.setVolume(
        item.volume
      );
    }
  }

  this.musicasFaseMutadas = [];
}

  // ============================================================
  // INÍCIO
  // ============================================================

  executar() {
 
     this.cancelada = false;
  this.fase = "intro";

    // ============================================================
    // MUSICA COMEÇA JUNTO COM A ULT
    // ============================================================

    this.mutarMusicaFase();

     this.tocarSomBeam();


    const cam = this.scene.cameras.main;

    this.salvarCenario();

    // MESMO FUNDO INICIAL DO ARANHA
    this.criarFundo(
      "ultimateback",
      "beam_back",
      36,
      0,
      115
    );

    this.travarCamera();

    this.congelarLuta();

    this.personagem.sprite.body?.setVelocity(0, 0);

    // Faz megasing parar exatamente no frame 3
    this.configurarMegaSing();

    // Efeito da primeira pose
    this.pose1 = this.criarVFX(
      "miku_pose",
      true,
      this.personagem.sprite.x + 10,
      this.personagem.sprite.y - 55
    );

    // ========================================================
    // CAMERA = MESMO SPIDERULT
    // ========================================================

    const zoomAtual = cam.zoom;

    cam.pan(
      this.personagem.sprite.x,
      this.personagem.sprite.y,
      INTRO.tempoZoom,
      "Power2"
    );

    cam.zoomTo(
      zoomAtual * INTRO.zoom,
      INTRO.tempoZoom
    );

    // Começa a apagar perto do fim
    this.agendar(
      INTRO.escurecerAos,
      () => this.escurecerTela()
    );

    // 9 segundos depois libera
    this.agendar(
      INTRO.duracao,
      () => this.liberarUlt()
    );
  }


  // ============================================================
  // MEGASING
  // ============================================================

  configurarMegaSing() {
    const sprite = this.personagem.sprite;

    this.fnMegaSing = (anim, frame) => {

      const numero =
        Number(frame.textureFrame ?? frame.index);

      // ======================================================
      // PARA NO FRAME 3
      // ======================================================

      if (
        anim.key === "miku_megasing" &&
        !this.pausouFrame3 &&
        numero >= 3
      ) {
        this.pausouFrame3 = true;

        sprite.anims.pause();
        return;
      }

      // ======================================================
      // DEPOIS DOS 9 SEGUNDOS:
      // QUANDO CHEGAR NO 10, LOOP 10-13
      // ======================================================

      if (
        this.introLiberada &&
        anim.key === "miku_megasing" &&
        numero >= 10
      ) {
        sprite.anims.play(
          "miku_megasing_loop",
          true
        );
      }
    };

    sprite.on(
      "animationupdate",
      this.fnMegaSing
    );
  }


  // ============================================================
  // ESCURECIMENTO
  // ============================================================

  escurecerTela() {
    if (this.overlayPreto) return;

    const cam = this.scene.cameras.main;

    this.overlayPreto = this.scene.add.rectangle(
      cam.midPoint.x,
      cam.midPoint.y,
      cam.width / cam.zoom + 40,
      cam.height / cam.zoom + 40,
      0x000000
    );

    this.overlayPreto
      .setOrigin(0.5)
      .setAlpha(0);

    // Acima do fundo, abaixo dos personagens
    this.overlayPreto.setDepth(
      (this.fundoUlt?.depth ?? -100) + 1
    );

    this.scene.camHUD?.ignore(
      this.overlayPreto
    );

    this.scene.tweens.add({
      targets: this.overlayPreto,
      alpha: 1,
      duration: INTRO.tempoEscurecer,
      ease: "Linear"
    });
  }



  iniciarMusica() {
  if (!this.scene.cache.audio.exists("miku-beam")) {
    console.warn('MikuUlt: áudio "miku-beam" não encontrado.');
    return;
  }

  this.somBeam = this.scene.sound.add(
    "miku-beam",
    {
      volume: 0.85,
      loop: false
    }
  );

  if (this.scene.sound.locked) {
    this.scene.sound.once(
      "unlocked",
      () => {
        if (!this.cancelada) {
          this.somBeam?.play();
        }
      }
    );
  } else {
    this.somBeam.play();
  }
}


  // ============================================================
  // TERMINOU INTRO
  // ============================================================

  liberarUlt() {
    if (this.cancelada) return;

    this.introLiberada = true;

    // ========================================================
    // ultimateback -> beam_back
    // ========================================================

    this.fundoUlt?.destroy();

    this.fundoUlt = null;

    this.criarFundo(
      "beam_back",
      "miku_beam_back",
      30
    );

    // ========================================================
    // DESTRAVA JOGO
    // ========================================================

    this.descongelarLuta();

    this.restaurarCamera();

    // Megasing estava congelada no 3.
    this.personagem.sprite.anims.resume();

    // Troca efeito da pose
    this.pose1?.destroy();

    this.pose1 = null;

    this.pose2 = this.criarVFX(
      "miku_pose2",
      true,
      this.personagem.sprite.x +10,
      this.personagem.sprite.y - 55
    );

    // Revela beam_back
    if (this.overlayPreto) {

      this.scene.tweens.add({
        targets: this.overlayPreto,
        alpha: 0,
        duration: 150,

        onComplete: () => {
          this.overlayPreto?.destroy();
          this.overlayPreto = null;
        }
      });
    }

    this.iniciarRaio();
  }


  // ============================================================
  // COMEÇA RAIO
  // ============================================================

  iniciarRaio() {
    this.fase = "raio";

    this.ultimoUpdate =
      this.scene.time.now;


    this.raio1 = this.criarBeam1();

    

    // Segurança caso beam1 tenha poucos frames
    this.agendar(
      1000,
      () => {

        if (!this.beam2Iniciado) {
          this.iniciarBeam2();
        }
      }
    );

    // ========================================================
    // GRANDE HIT APÓS 5 SEGUNDOS
    // ========================================================

    this.agendar(
      RAIO.grandeHitAos,
      () => this.grandeHit()
    );

    // ========================================================
    // MAIS 5 SEGUNDOS DE MULTIHIT
    // ========================================================

    this.agendar(
      RAIO.duracao,
      () => this.finalizarComFade()
    );
  }


  // ============================================================
  // BEAM 1
  // ============================================================

  criarBeam1() {
    if (!this.scene.textures.exists("miku_beam1")) {
      console.warn("miku_beam1 não carregado");
      return null;
    }

    const ultimo =
      this.ultimoFrame("miku_beam1");

    this.criarAnimacao(
      "miku_beam1_anim",
      "miku_beam1",
      0,
      ultimo,
      24,
      0
    );

    const raio = this.scene.add.sprite(
      0,
      0,
      "miku_beam1"
    );

    this.configurarVisualRaio(raio);

    raio.play("miku_beam1_anim");

    raio.on(
      "animationupdate",
      (anim, frame) => {

        const numero =
          Number(frame.textureFrame ?? frame.index);

        // Beam2 entra pouco antes do Beam1 acabar
        if (
          !this.beam2Iniciado &&
          numero >= ultimo - 3
        ) {
          this.iniciarBeam2();
        }
      }
    );

    raio.once(
      "animationcomplete",
      () => raio.destroy()
    );

    return raio;
  }


  // ============================================================
  // BEAM 2
  // ============================================================

  iniciarBeam2() {
    if (
      this.beam2Iniciado ||
      !this.scene.textures.exists("miku_beam2")
    ) {
      return;
    }

    this.beam2Iniciado = true;

    // 0 -> 16
    this.criarAnimacao(
      "miku_beam2_intro",
      "miku_beam2",
      0,
      16,
      24,
      0
    );

    // 13 -> 16 LOOP
    this.criarAnimacao(
      "miku_beam2_loop",
      "miku_beam2",
      13,
      16,
      24,
      -1
    );

    this.raio2 = this.scene.add.sprite(
      0,
      0,
      "miku_beam2"
    );

    this.configurarVisualRaio(
      this.raio2
    );

    this.raio2.setDepth(
      (this.personagem.sprite.depth ?? 0) + 4
    );

    this.raio2.play(
      "miku_beam2_intro"
    );

    this.raio2.once(
      "animationcomplete",
      () => {

        if (this.raio2?.active) {
          this.raio2.play(
            "miku_beam2_loop"
          );
        }
      }
    );
  }


  // ============================================================
  // CONFIG VISUAL DOS RAIOS
  // ============================================================

  configurarVisualRaio(raio) {
    raio.setOrigin(0, 0.5);

    raio.setDepth(
      (this.personagem.sprite.depth ?? 0) + 3
    );

    // ========================================================
    // MESMO FILTRO DO SPIDERULT
    // ========================================================

    raio.setBlendMode(
      Phaser.BlendModes.ADD
    );

    // MUITO MAIS COMPRIDO
    raio.setDisplaySize(
      RAIO.comprimento,
      RAIO.espessura
    );

    this.scene.camHUD?.ignore(
      raio
    );

    this.efeitos.add(raio);

    raio.once(
      "destroy",
      () => this.efeitos.delete(raio)
    );
  }


  // ============================================================
  // UPDATE
  // ============================================================

  atualizar() {
    if (
      this.cancelada ||
      this.finalizando
    ) {
      return;
    }

    if (this.fundoUlt?.active) {
      this.ajustarFundo();
    }

    if (this.overlayPreto?.active) {
      this.ajustarOverlay();
    }

    if (this.fase !== "raio") return;

    const agora = this.scene.time.now;

    const delta =
      Math.min(
        agora - this.ultimoUpdate,
        50
      );

    this.ultimoUpdate = agora;

    this.atualizarAngulo(delta);

    this.atualizarRaio();

    // IMPORTANTE:
    // continua durante os 10 segundos inteiros,
    // inclusive DEPOIS do grande hit.
    this.verificarMultihit();
  }


  // ============================================================
  // ÂNGULO
  // ============================================================

  atualizarAngulo(delta) {
    const velocidade =
      RAIO.velocidadeAngulo *
      delta / 1000;

    if (this.personagem.inputDown("cima")) {
      this.angulo -= velocidade;
    }

    if (this.personagem.inputDown("baixo")) {
      this.angulo += velocidade;
    }

    this.angulo = Phaser.Math.Clamp(
      this.angulo,
      RAIO.anguloMin,
      RAIO.anguloMax
    );
  }


  atualizarRaio() {
    const origem = this.origemRaio();

    const rotacao =
      this.rotacaoRaio();

    for (
      const efeito of
      [
        this.raio1,
        this.raio2
      ]
    ) {
      if (!efeito?.active) continue;

      efeito.setPosition(
        origem.x,
        origem.y
      );

      efeito.setRotation(
        rotacao
      );
    }

    
  }


  criarSparklesNoAlvo(alvo) {
  if (!alvo?.sprite?.active) {
    return;
  }

  // Vários efeitos por hit
  for (let i = 0; i < 3; i++) {

    const efeito = this.criarVFX(
      "beam_sparkles",
      false,

      alvo.sprite.x +
        Phaser.Math.Between(-35, 35),

      alvo.sprite.y +
        Phaser.Math.Between(-90, -15)
    );

    if (!efeito) continue;

    efeito.setScale(
      Phaser.Math.FloatBetween(
        0.65,
        1.05
      )
    );

    efeito.setAngle(
      Phaser.Math.Between(
        0,
        360
      )
    );
  }
}

  origemRaio() {
    const dir =
      this.personagem.sprite.flipX
        ? -1
        : 1;

    return {
      x:
        this.personagem.sprite.x +
        35 * dir,

      y:
        this.personagem.sprite.y -
        80
    };
  }


  rotacaoRaio() {
    const ang =
      Phaser.Math.DegToRad(
        this.angulo
      );

    return this.personagem.sprite.flipX
      ? Math.PI - ang
      : ang;
  }


  // ============================================================
  // MULTIHIT
  // ============================================================

  verificarMultihit() {
    const agora =
      this.scene.time.now;

    for (const alvo of this.obterAlvos()) {

        const bloqueadoAte =
  this.bloqueioMultihit.get(alvo) ?? 0;

if (agora < bloqueadoAte) {
  continue;
}

      if (!this.alvoNoRaio(alvo)) {
        continue;
      }

      const ultimo =
        this.ultimoHit.get(alvo) ??
        -Infinity;

      if (
        agora - ultimo <
        RAIO.intervaloHit
      ) {
        continue;
      }

      this.ultimoHit.set(
        alvo,
        agora
      );

      this.hitPequeno(alvo);
    }
  }


  hitPequeno(alvo) {
    this.criarSparklesNoAlvo(alvo);
    const ang = this.rotacaoRaio();

    const x = Math.cos(ang);
    const y = Math.sin(ang);

    alvo.receberDano(
      RAIO.danoHit,

      {
        tipoSomImpacto: "light",

        knockbackX:
          Math.abs(x * RAIO.knockHit),

        knockbackY:
          y * RAIO.knockHit - 10,

        knockbackFixo: true,

        tumbling: false,

        hitstunFixoFrames: 3,

        ignorarHitstunDecay: true
      },

      {
        ...this.origemRaio(),

        direcao:
          Math.sign(x) || 1
      }
    );
  }


  // ============================================================
  // GRANDE HIT - UMA ÚNICA VEZ
  // ============================================================

  grandeHit() {
    if (this.cancelada) return;
 


    // ========================================================
    // RAIO ENGROSSA POR UM INSTANTE
    // ========================================================

    for (
      const raio of
      [this.raio1, this.raio2]
    ) {
      if (!raio?.active) continue;

      const sx = raio.scaleX;
      const sy = raio.scaleY;

      this.scene.tweens.add({
        targets: raio,

        scaleX: sx * 1.08,
        scaleY: sy * 1.7,

        duration: 120,

        hold: 100,

        yoyo: true,

        ease: "Quad.Out"
      });
    }

    // Flash/reflexo no grande impacto
    const origem = this.origemRaio();

    const flash = this.criarVFX(
      "beam_reflected",
      false,
      origem.x,
      origem.y
    );

    flash?.setRotation(
      this.rotacaoRaio()
    );

    // ========================================================
    // GRANDE KNOCK APENAS UMA VEZ
    // ========================================================

    for (const alvo of this.obterAlvos()) {

      if (!this.alvoNoRaio(alvo, 1.7)) {
        continue;
      }

      const ang =
        this.rotacaoRaio();

      const x =
        Math.cos(ang);

      const y =
        Math.sin(ang);


        // Durante 700ms os hits pequenos
  // não podem substituir o grande lançamento.
  this.bloqueioMultihit.set(
    alvo,
    this.scene.time.now + 700
  );

      alvo.receberDano(
        RAIO.danoFinal,

        {
          tipoSomImpacto: "heavy",

          knockbackX:
            Math.abs(
              x * RAIO.knockFinal
            ),

          knockbackY:
            y * RAIO.knockFinal - 150,

          tumbling: true
        },

        {
          ...origem,

          direcao:
            Math.sign(x) || 1
        }
      );
    }
  }


  // ============================================================
  // COLISÃO DO RAIO
  // ============================================================

  alvoNoRaio(alvo, grosso = 1) {
    const origem =
      this.origemRaio();

    const ang =
      this.rotacaoRaio();

    const ux = Math.cos(ang);
    const uy = Math.sin(ang);

    const nx = -uy;
    const ny = ux;

    const espessura =
      RAIO.espessura *
      grosso;

    const hurtboxes =
      alvo.grupoHurtbox
        ?.getChildren?.() ?? [];

    return hurtboxes.some(h => {

      const b = h?.body;

      if (!b?.enable) return false;

      const cx =
        b.left + b.width / 2;

      const cy =
        b.top + b.height / 2;

      const dx =
        cx - origem.x;

      const dy =
        cy - origem.y;

      const frente =
        dx * ux + dy * uy;

      const lado =
        Math.abs(
          dx * nx + dy * ny
        );

      const raioAlvo =
        Math.max(
          b.width,
          b.height
        ) / 2;

      return (
        frente >= -raioAlvo &&
        frente <=
          RAIO.comprimento + raioAlvo &&
        lado <=
          espessura / 2 + raioAlvo
      );
    });
  }


  obterAlvos() {
    const lista =
      this.scene.scene.key ===
      "CenaHistoria"

        ? [
            this.personagem ===
            this.scene.boss
              ? this.scene.jogador1
              : this.scene.boss
          ]

        : [
            this.scene.jogador1,
            this.scene.jogador2,
            this.scene.jogador3,
            this.scene.jogador4
          ];

    return [...new Set(lista)].filter(
      alvo =>
        alvo &&
        alvo !== this.personagem &&
        alvo.sprite?.active &&
        alvo.grupoHurtbox
    );
  }


  // ============================================================
  // SOM
  // ============================================================

  tocarSomBeam() {
    if (
      !this.scene.cache.audio.exists(
        "miku-beam"
      )
    ) {
      return;
    }

    this.somBeam =
      this.scene.sound.add(
        "miku-beam",
        {
          volume: 0.85,
          loop: true
        }
      );

    if (this.scene.sound.locked) {

      this.scene.sound.once(
        "unlocked",
        () => {

          this.somBeam?.play();
        }
      );

    } else {

      this.somBeam.play();
    }
  }


  // ============================================================
  // FIM + FADE
  // ============================================================

  finalizarComFade() {
    if (this.finalizando) return;

    this.finalizando = true;

    const terminar = () => {

      this.limpar();

      this.estadoFSM.finalizarUlt();
    };

    if (
      this.somBeam?.isPlaying
    ) {

      this.scene.tweens.add({
        targets: this.somBeam,
        volume: 0,

        duration: RAIO.fadeOut,

        onComplete: () => {

          this.somBeam.stop();
          this.somBeam.destroy();
          this.somBeam = null;

          terminar();
        }
      });

    } else {

      this.agendar(
        RAIO.fadeOut,
        terminar
      );
    }
  }


  // ============================================================
  // VFX
  // ============================================================

  criarVFX(
    textura,
    loop,
    x,
    y
  ) {
    if (
      !this.scene.textures.exists(
        textura
      )
    ) {
      console.warn(
        `VFX não carregado: ${textura}`
      );

      return null;
    }

    const anim =
      `miku_vfx_${textura}_${loop ? "loop" : "once"}`;

    this.criarAnimacao(
      anim,
      textura,
      0,
      this.ultimoFrame(textura),
      28,
      loop ? -1 : 0
    );

    const efeito =
      this.scene.add.sprite(
        x,
        y,
        textura
      );

    efeito.setDepth(
      (this.personagem.sprite.depth ?? 0) + 5
    );

    // ========================================================
    // MESMO FILTRO DOS EFEITOS DA ULT DO ARANHA
    // ========================================================

    efeito.setBlendMode(
      Phaser.BlendModes.ADD
    );

    this.scene.camHUD?.ignore(
      efeito
    );

    this.efeitos.add(efeito);

    efeito.once(
      "destroy",
      () => this.efeitos.delete(efeito)
    );

    efeito.play(anim);

    if (!loop) {

      efeito.once(
        "animationcomplete",
        () => efeito.destroy()
      );
    }

    return efeito;
  }


  // ============================================================
  // ANIMAÇÕES DOS VFX
  // ============================================================

  criarAnimacao(
    chave,
    textura,
    inicio,
    fim,
    fps,
    repeat
  ) {
    if (
      this.scene.anims.exists(chave)
    ) {
      return;
    }

    this.scene.anims.create({
      key: chave,

      frames:
        this.scene.anims.generateFrameNumbers(
          textura,
          {
            start: inicio,
            end: fim
          }
        ),

      frameRate: fps,
      repeat
    });
  }


  ultimoFrame(textura) {
    return Math.max(
      0,
      this.scene.textures
        .get(textura)
        .frameTotal - 2
    );
  }


  // ============================================================
  // CENÁRIO
  // ============================================================

  salvarCenario() {
    const fundo =
      this.scene.mapaAtual?.imagemFundo;

    this.fundoOriginal =
      fundo ?? null;

    this.fundoOriginalVisivel =
      fundo?.visible ?? true;

    fundo?.setVisible(false);

    const plataformas =
      this.scene.mapaAtual
        ?.plataformas
        ?.getChildren?.() ?? [];

    this.plataformas =
      plataformas.map(p => ({
        p,
        visivel: p.visible
      }));

    plataformas.forEach(
      p => p.setVisible(false)
    );
  }


  criarFundo(
    textura,
    anim,
    fps,
    inicio = 0,
    fim = null
  ) {
    if (
      !this.scene.textures.exists(
        textura
      )
    ) {
      console.warn(
        `FUNDO NÃO CARREGADO: ${textura}`
      );

      return;
    }

    const final =
      fim ??
      this.ultimoFrame(textura);

    this.criarAnimacao(
      anim,
      textura,
      inicio,
      final,
      fps,
      -1
    );

    this.fundoUlt =
      this.scene.add.sprite(
        0,
        0,
        textura
      );

    this.fundoUlt.setDepth(
      (this.fundoOriginal?.depth ?? -100) + 1
    );

    this.scene.camHUD?.ignore(
      this.fundoUlt
    );

    this.fundoUlt.play(anim);

    this.ajustarFundo();
  }


  ajustarFundo() {
    if (!this.fundoUlt?.active) return;

    const cam =
      this.scene.cameras.main;

    this.fundoUlt.setPosition(
      cam.midPoint.x,
      cam.midPoint.y
    );

    this.fundoUlt.setDisplaySize(
      cam.width / cam.zoom,
      cam.height / cam.zoom
    );
  }


  ajustarOverlay() {
    if (!this.overlayPreto) return;

    const cam =
      this.scene.cameras.main;

    this.overlayPreto.setPosition(
      cam.midPoint.x,
      cam.midPoint.y
    );

    this.overlayPreto.setDisplaySize(
      cam.width / cam.zoom + 40,
      cam.height / cam.zoom + 40
    );
  }


  // ============================================================
  // CAMERA / FREEZE
  // ============================================================

  travarCamera() {
    if (
      !this.funcaoCamOriginal &&
      typeof this.scene.atualizarCamera ===
        "function"
    ) {
      this.funcaoCamOriginal =
        this.scene.atualizarCamera;

      this.scene.atualizarCamera =
        () => {};
    }
  }


  restaurarCamera() {
    if (this.funcaoCamOriginal) {

      this.scene.atualizarCamera =
        this.funcaoCamOriginal;

      this.funcaoCamOriginal = null;
    }
  }


  congelarLuta() {
    if (
      !this.scene.physics.world.isPaused
    ) {
      this.scene.physics.pause();

      this.pauseiFisica = true;
    }

    this.animacoesPausadas = [];

    for (
      const p of
      this.obterPersonagens()
    ) {
      if (p === this.personagem) continue;

      if (
        p.sprite?.anims?.isPlaying &&
        !p.sprite.anims.isPaused
      ) {
        p.sprite.anims.pause();

        this.animacoesPausadas.push(p);
      }
    }
  }


  descongelarLuta() {
    if (
      this.pauseiFisica &&
      this.scene.physics.world.isPaused
    ) {
      this.scene.physics.resume();
    }

    this.pauseiFisica = false;

    this.animacoesPausadas.forEach(
      p => p.sprite?.anims?.resume()
    );

    this.animacoesPausadas = [];
  }


  obterPersonagens() {
    return [
      ...new Set([
        this.scene.jogador1,
        this.scene.jogador2,
        this.scene.jogador3,
        this.scene.jogador4,
        this.scene.boss
      ])
    ].filter(
      p => p?.sprite?.active
    );
  }


  // ============================================================
  // TIMER
  // ============================================================

  agendar(delay, fn) {
    const timer =
      this.scene.time.delayedCall(
        delay,
        () => {

          this.timers.delete(timer);

          if (!this.cancelada) {
            fn();
          }
        }
      );

    this.timers.add(timer);

    return timer;
  }


  // ============================================================
  // LIMPEZA
  // ============================================================

  limpar() {
    
    for (const timer of this.timers) {
      timer.remove(false);
    }

    this.timers.clear();

    if (this.fnMegaSing) {
      this.personagem.sprite.off(
        "animationupdate",
        this.fnMegaSing
      );

      this.fnMegaSing = null;
    }

    this.overlayPreto?.destroy();

    this.overlayPreto = null;

    for (const efeito of [...this.efeitos]) {

      efeito?.destroy();
    }

    this.efeitos.clear();

    this.somBeam?.stop();
    this.somBeam?.destroy();

    this.somBeam = null;

    this.descongelarLuta();

    this.restaurarCamera();

    this.fundoUlt?.destroy();

    this.fundoUlt = null;

    if (this.fundoOriginal?.active) {

      this.fundoOriginal.setVisible(
        this.fundoOriginalVisivel
      );
    }

    this.plataformas.forEach(
      ({ p, visivel }) => {

        if (p?.active) {
          p.setVisible(visivel);
        }
      }
    );

    this.plataformas = [];
    this.restaurarMusicaFase();
  }


  cancelar() {
    if (this.cancelada) return;

    this.cancelada = true;
    

    this.limpar();
  }
}