export default class CorrupcaoSlender {
  constructor(personagem) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.valor = 0;
    this.proximoDano = 0;
    this.proximoRuido = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.renderizadores = {};
    // Desloca somente o desenho, preservando corpo e hurtboxes.
    const efeito = this;
    const metodoWebGL = personagem.sprite.renderWebGLStep ? "renderWebGLStep" : "renderWebGL";
    for (const metodo of [metodoWebGL, "renderCanvas"]) {
      const original = personagem.sprite[metodo];
      this.renderizadores[metodo] = original;
      personagem.sprite[metodo] = function (...args) {
        const x = this.x;
        const y = this.y;
        this.x += efeito.offsetX;
        this.y += efeito.offsetY;
        try {
          return original.apply(this, args);
        } finally {
          this.x = x;
          this.y = y;
        }
      };
    }
    this.scene.events.on("postupdate", this.atualizar, this);
    this.scene.events.once("shutdown", this.destruir, this);
    personagem.sprite.once("destroy", this.destruir, this);
  }

  adicionar(quantidade) {
    const anterior = this.valor;
    this.valor = Math.max(0, this.valor + quantidade);
    if (anterior < 30 && this.valor >= 30) this.proximoDano = this.scene.time.now + 2000;
  }

  reduzir(quantidade) {
    this.valor = Math.max(0, this.valor - quantidade);
    if (this.valor < 30) this.proximoDano = 0;
  }

  atualizarPaginas() {
    const cena = this.scene;
    const agora = cena.time.now;
    const estado = cena.paginasCorrupcaoSlender ??= {
      sprites: [],
      proximoSpawn: agora + 12000,
    };
    estado.sprites = estado.sprites.filter((pagina) => pagina.active);

    const jogadores = [cena.jogador1, cena.jogador2].filter(Boolean);
    if (!jogadores.some((jogador) => jogador.corrupcaoSlender?.valor > 0)) {
      estado.sprites.forEach((pagina) => pagina.destroy());
      estado.sprites = [];
      estado.proximoSpawn = agora + 3000;
      return;
    }
    if (agora < estado.proximoSpawn || estado.sprites.length >= 3 || !cena.textures.exists("pages1")) return;

    const plataformas = cena.mapaAtual?.plataformas?.getChildren()
      .filter((plataforma) => plataforma.active && plataforma.body?.enable && plataforma.body.width > 100);
    if (!plataformas?.length) {
      estado.proximoSpawn = agora + 2000;
      return;
    }
    const larguraPagina = 283 * 0.18;
    const metadePagina = larguraPagina / 2;
    const alturaPagina = 352 * 0.18;
    const paginasAtivas = estado.sprites.filter((pagina) => pagina.active);
    let posicao = null;
    for (let tentativa = 0; tentativa < 12; tentativa++) {
      const plataforma = Phaser.Utils.Array.GetRandom(plataformas);
      const corpoPlataforma = plataforma.body;
      const inicioX = Math.ceil(corpoPlataforma.left + metadePagina);
      const fimX = Math.floor(corpoPlataforma.right - metadePagina);
      const candidata = {
        x: Phaser.Math.Between(inicioX, Math.max(inicioX, fimX)),
        y: corpoPlataforma.top - alturaPagina / 2,
      };
      posicao = candidata;
      if (paginasAtivas.every((pagina) =>
        Phaser.Math.Distance.Between(candidata.x, candidata.y, pagina.x, pagina.y) >= 300
      )) break;
    }
    const { x, y } = posicao;
    const pagina = cena.add.sprite(x, y, "pages1", Phaser.Math.Between(0, 7))
      .setScale(0.18)
      .setDepth((cena.jogador1?.sprite?.depth ?? 1) + 1);
    cena.physics.add.existing(pagina);
    pagina.body.setAllowGravity(false);
    pagina.body.setImmovable(true);
    pagina.body.setSize(220, 280, true);
    cena.camHUD?.ignore(pagina);
    estado.sprites.push(pagina);
    estado.proximoSpawn = agora + 12000;

    cena.tweens.add({
      targets: pagina,
      y: y - 18,
      duration: 900,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });
    jogadores.forEach((jogador) => {
      if (!jogador.sprite?.body) return;
      cena.physics.add.overlap(pagina, jogador.sprite, () => {
        if (!pagina.active || jogador.corrupcaoSlender?.valor <= 0) return;
        jogador.corrupcaoSlender.reduzir(20);
        pagina.destroy();
      });
    });
  }

  criarVisuais() {
    if (!this.tvFragments) this.tvFragments = [];
    while (this.tvFragments.length < 12) {
      const fragmento = this.scene.add.sprite(0, 0, "Slan_tv", 0)
        .setVisible(false).setBlendMode("SCREEN");
      this.tvFragments.push(fragmento);
      this.scene.camHUD?.ignore(fragmento);
    }
    const hud = this.personagem.textoDano;
    if (!hud || this.efeitoHUD) return;
    return;
    const larguraHUD = hud.list?.[0]?.displayWidth || hud.barraUlt?.displayWidth || 440;
    const alturaHUD = hud.list?.[0]?.displayHeight || hud.barraUlt?.displayHeight || 357;
    if (!this.scene.anims.exists("miku-telao-ruido")) {
      this.scene.anims.create({
        key: "miku-telao-ruido",
        frames: this.scene.anims.generateFrameNumbers("efeito-baner"),
        frameRate: 12,
        repeat: -1,
      });
    }
    this.efeitoHUD = this.scene.add.sprite(0, 0, "efeito-baner")
      .setVisible(false).setScrollFactor(0).setDepth(1100)
      .setBlendMode(Phaser.BlendModes.SCREEN).setAlpha(0.9).play("miku-telao-ruido");
    if (hud.retrato?.createBitmapMask) {
      this.efeitoHUD.setMask(hud.retrato.createBitmapMask());
    }
    hud.add(this.efeitoHUD);
    this.scene.camJogo?.ignore(this.efeitoHUD);
  }

  atualizar() {
    const p = this.personagem;
    const sprite = p.sprite;
    this.atualizarPaginas();
    if (p.emMorteVS || p.eliminado || !sprite.active) {
      this.limpar();
      return;
    }
    if (this.valor < 30) return;
    this.criarVisuais();
    const agora = this.scene.time.now;
    const estagio = this.valor >= 90 ? 3 : this.valor >= 60 ? 2 : 1;
    const intensidade = Phaser.Math.Clamp((this.valor - 30) / 60, 0, 1);
    if (agora >= this.proximoDano) {
      const ciclos = Math.floor((agora - this.proximoDano) / 2000) + 1;
      p.porcentagemDano += [0, 4, 8, 16][estagio] * ciclos;
      p.textoDano?.setText(`${Math.floor(p.porcentagemDano)}%`);
      this.proximoDano += ciclos * 2000;
    }
    if (agora >= this.proximoRuido) {
      this.proximoRuido = agora + (estagio === 3 ? 45 : 90);
      const quantidade = estagio === 3 ? 12 : estagio === 2 ? 8 : 4;
      this.tvFragments.forEach((fragmento, indice) => {
        const ativo = indice < quantidade && sprite.visible && Math.random() < 0.45 + intensidade * 0.5;
        fragmento.setFrame(Phaser.Math.Between(0, 2)).setVisible(ativo)
          .setAlpha(0.3 + intensidade * 0.55);
        if (ativo) {
          fragmento.setPosition(
            sprite.x + Phaser.Math.Between(-sprite.displayWidth / 2, sprite.displayWidth / 2),
            sprite.y - Phaser.Math.Between(10, sprite.displayHeight - 10),
          ).setDisplaySize(
            Phaser.Math.Between(12, 30) * (1 + intensidade * 0.5),
            Phaser.Math.Between(12, 34) * (1 + intensidade * 0.5),
          ).setDepth(sprite.depth + 1);
        }
      });
      const amplitude = estagio === 3 ? 5 : estagio === 2 ? 2 : 0;
      this.offsetX = Phaser.Math.Between(-amplitude, amplitude);
      this.offsetY = Phaser.Math.Between(-amplitude, amplitude);
    }
    if (!sprite.visible) this.tvFragments?.forEach(fragmento => fragmento.setVisible(false));
  }

  limpar() {
    this.valor = 0;
    this.proximoDano = 0;
    this.proximoRuido = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.tvFragments?.forEach(fragmento => fragmento.setVisible(false));
  }

  destruir() {
    this.scene.events.off("postupdate", this.atualizar, this);
    this.scene.events.off("shutdown", this.destruir, this);
    const sprite = this.personagem.sprite;
    sprite.off("destroy", this.destruir, this);
    for (const [metodo, original] of Object.entries(this.renderizadores)) sprite[metodo] = original;
    this.tvFragments?.forEach(fragmento => fragmento.destroy());
  }
}
