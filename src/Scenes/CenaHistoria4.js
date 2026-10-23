import CenaHistoria from "./CenaHistoria.js";
import FinalMap from "../Mapasjs/Final.js";
import TH30_IA from "../Objetos/TH30_IA.js";
import DialogoHistoria from "../Objetos/DialogoHistoria.js";
import PuppetLojaMiku from "../Objetos/PuppetLojaMiku.js";
import { RaioLoja } from "../Objetos/EfeitosAvancadosLoja.js";

export default class CenaHistoria4 extends CenaHistoria {
  constructor() {
    super("CenaHistoria4");
    this.esconderBarraUltBoss = true;
  }

  obterNomeBoss() {
    return "TH30";
  }

  init(dados = {}) {
    super.init(dados);
    this.entradaFinalCompleta = dados.entradaFinalCompleta === true;
    this.musicaHistoriaSeek = dados.musicaHistoriaSeek ?? 0;
    this.aguardandoEntradaFinal = this.entradaFinalCompleta;
    if (this.entradaFinalCompleta) this.manterAssetsParaHistoria2 = false;
  }

  criarMapaHistoria() {
    const mapa = new FinalMap(this);
    if (this.entradaFinalCompleta && this.musicaHistoriaSeek > 0) {
      mapa.musica?.setSeek(this.musicaHistoriaSeek);
    }
    return mapa;
  }

  criarIAHistoria(controller) {
    return new TH30_IA(controller);
  }

  create() {
    super.create();
    this.boss.podeUsarUlt = () => false;
    this.boss.ultCarga = 0;
    if (!this.anims.exists("th30-pose-aura")) this.anims.create({
      key: "th30-pose-aura",
      frames: this.anims.generateFrameNumbers("pose-aura", { start: 0, end: 8 }),
      frameRate: 12,
      repeat: 0,
    });
  }

  update(time, delta) {
    if (this.aguardandoEntradaFinal) return;
    super.update(time, delta);
    if (this.partidaEncerrada) return;
    this.atualizarHabilidadesTH30();
    this.atualizarLavaTH30();
  }

  respawnar(jogador, spawn) {
    super.respawnar(jogador, spawn);
    if (jogador === this.boss && this.vidasBoss === 2 && !this.despertarTH30Iniciado) {
      this.despertarTH30Iniciado = true;
      this.iniciarDespertarTH30();
    }
  }

  iniciarDespertarTH30() {
    const boss = this.boss;
    if (!boss?.sprite?.active) return;
    this.habilidadesTH30Ativas = false;
    this.iniciarEfeitoTVFundo();
    this.sound.play("tv-static");
    this.cameras.main.shake(650, 0.018);
    this.time.delayedCall(250, () => this.trocarFundoTH30());
    this.time.delayedCall(650, () => {
      this.cameras.main.flash(220, 255, 255, 255);
      this.habilidadesTH30Ativas = true;
      this.proximaHabilidadeTH30 = this.time.now + 3500;
      this.cooldownsHabilidadesTH30 = new Map();
      this.ultimaHabilidadeTH30 = null;
      this.time.delayedCall(30000, () => this.iniciarTransicaoFundoTH30());
    });
  }

  tocarPoseAuraTH30(aoConcluir, restaurarBoss = true) {
    const boss = this.boss;
    const estadoBoss = boss?.maquinaEstados?.estadoAtual?.nome;
    if (
      this.poseAuraTH30Ativa ||
      !boss?.sprite?.active ||
      boss.emMorteVS ||
      boss.eliminado ||
      !["idle", "walk", "jump"].includes(estadoBoss)
    ) return;
    this.poseAuraTH30Ativa = true;
    this.botIA.soltarTudo();
    this.limparAcao(boss);
    boss.podeMover = false;
    boss.podeAtacar = false;
    const x = boss.sprite.x;
    const y = boss.sprite.y;
    this.posicaoPoseAuraTH30 = { x, y };
    boss.sprite.setVelocity(0, 0).setVisible(false);
    boss.sprite.body.reset(x, y);
    boss.sprite.body.enable = false;
    const aura = this.add.sprite(x, y, "pose-aura", 0)
      .setOrigin(0.5, 1)
      .setFlipX(boss.sprite.flipX)
      .setDepth(boss.sprite.depth + 1);
    this.camHUD.ignore(aura);
    const flutuar = this.tweens.add({ targets: aura, y: y - 12, duration: 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    aura.play({ key: "th30-pose-aura", repeat: 0 });
    let quadro = 8;
    let alternar = null;
    this.time.delayedCall(750, () => {
      if (!aura.active || !this.textures.exists("pose-aura")) return;
      const textura = this.textures.get("pose-aura");
      if (!textura.has("8") || !textura.has("9")) return;
      aura.setFrame(8);
      alternar = this.time.addEvent({ delay: 75, repeat: 19, callback: () => {
        quadro = quadro === 8 ? 9 : 8;
        aura.setFrame(quadro);
      } });
    });
    this.time.delayedCall(2250, () => {
      alternar?.remove();
      flutuar.stop();
      aura.destroy();
      this.poseAuraTH30Ativa = false;
      if (restaurarBoss) this.restaurarPoseAuraTH30();
      aoConcluir?.();
    });
  }

  restaurarPoseAuraTH30() {
    const boss = this.boss;
    const posicao = this.posicaoPoseAuraTH30;
    if (!boss?.sprite?.active || !posicao) return;
    boss.sprite.setPosition(posicao.x, posicao.y).setVisible(true);
    boss.sprite.body.reset(posicao.x, posicao.y);
    boss.sprite.body.enable = true;
    boss.sprite.body.setAllowGravity(true);
    boss.podeMover = true;
    boss.podeAtacar = true;
  }

  trocarFundoTH30() {
    if (!this.primeiraTrocaFundoTH30Feita) {
      this.primeiraTrocaFundoTH30Feita = true;
      this.mapaAtual?.quebrarTeto?.();
    }
    const opcoes = ["miku", "pingu", "slender"].filter((fase) => fase !== this.faseFundoTH30);
    const fase = Phaser.Utils.Array.GetRandom(opcoes);
    this.faseFundoTH30 = fase;
    let fundo = this.mapaAtual.imagemFundo;
    if (!fundo.anims) {
      const imagemOriginal = fundo;
      fundo = this.add.sprite(imagemOriginal.x, imagemOriginal.y, imagemOriginal.texture.key)
        .setDepth(imagemOriginal.depth)
        .setDisplaySize(imagemOriginal.displayWidth, imagemOriginal.displayHeight);
      imagemOriginal.destroy();
      this.mapaAtual.imagemFundo = fundo;
      this.mapaAtual.imagemCrio = fundo;
      this.mapaAtual.fundos = (this.mapaAtual.fundos ?? []).map((item) => item === imagemOriginal ? fundo : item);
      this.camHUD.ignore(fundo);
    }
    fundo.anims?.stop();
    if (fase === "miku") {
      if (!this.anims.exists("tocarFundo")) this.anims.create({ key: "tocarFundo", frames: this.anims.generateFrameNumbers("show-back"), frameRate: 10, repeat: -1 });
      fundo.setTexture("show-back").play("tocarFundo");
    } else if (fase === "slender") {
      if (!this.anims.exists("animar-fundo-slender")) this.anims.create({
        key: "animar-fundo-slender",
        frames: [...this.anims.generateFrameNumbers("slen-back1", { start: 0, end: 26 }), ...this.anims.generateFrameNumbers("slen-back2", { start: 0, end: 26 })],
        frameRate: 10,
        repeat: -1,
      });
      fundo.setTexture("slen-back1").play("animar-fundo-slender");
    } else {
      fundo.setTexture("ice-back");
      if (!this.anims.exists("th30-fundo-pingu")) this.anims.create({ key: "th30-fundo-pingu", frames: this.anims.generateFrameNumbers("ice-back"), frameRate: 8, repeat: -1 });
      fundo.play("th30-fundo-pingu");
    }
    const limitesVisuais = this.mapaAtual.configCamera.limites;
    fundo.setPosition(limitesVisuais.x + limitesVisuais.largura / 2, limitesVisuais.y + limitesVisuais.altura / 2)
      .setDisplaySize(limitesVisuais.largura, limitesVisuais.altura);
    if (fase !== "miku") this.puppetAliadaTH30?.destruir();
  }

  iniciarEfeitoTVFundo() {
    this.efeitoTVFundoTH30?.destroy();
    const fundo = this.mapaAtual.imagemFundo;
    const efeito = this.add.sprite(fundo.x, fundo.y, "TVefect", 0)
      .setDisplaySize(fundo.displayWidth, fundo.displayHeight)
      .setDepth(-99.5);
    this.camHUD.ignore(efeito);
    efeito.play("TVefect");
    efeito.once("animationcomplete", () => {
      efeito.destroy();
      if (this.efeitoTVFundoTH30 === efeito) this.efeitoTVFundoTH30 = null;
    });
    this.efeitoTVFundoTH30 = efeito;
  }

  iniciarTransicaoFundoTH30() {
    if (!this.habilidadesTH30Ativas || this.partidaEncerrada) return;
    this.iniciarEfeitoTVFundo();
    this.sound.play("tv-static");
    this.cameras.main.shake(450, 0.012);
    this.time.delayedCall(180, () => this.trocarFundoTH30());
    this.time.delayedCall(30000, () => this.iniciarTransicaoFundoTH30());
  }

  atualizarHabilidadesTH30() {
    if (!this.habilidadesTH30Ativas || this.poseAuraTH30Ativa || this.time.now < this.proximaHabilidadeTH30) return;
    const disponiveis = ["raio", "lava", "cura"];
    if (this.faseFundoTH30 === "miku") disponiveis.push("puppet");
    if (this.faseFundoTH30 === "slender") disponiveis.push("slender");
    if (this.faseFundoTH30 === "pingu") disponiveis.push("pingu");
    const prontas = disponiveis.filter((nome) => nome !== this.ultimaHabilidadeTH30 && this.time.now >= (this.cooldownsHabilidadesTH30.get(nome) ?? 0));
    if (!prontas.length) return;
    const habilidade = Phaser.Utils.Array.GetRandom(prontas);
    this.tocarPoseAuraTH30(() => this.usarHabilidadeTH30(habilidade));
  }

  usarHabilidadeTH30(habilidade) {
    if (this.partidaEncerrada || !this.boss?.sprite?.active) return;
    const alvos = [this.jogador1, this.jogador2].filter((jogador) => jogador?.sprite?.active && jogador.vidas > 0);
    if (habilidade === "raio") {
      this.lancarRaiosTH30();
    } else if (habilidade === "lava") {
      this.lavaTH30Ate = this.time.now + 2000;
      this.ultimoContatoLavaTH30 = new WeakMap();
    } else if (habilidade === "cura") {
      this.boss.porcentagemDano = 0;
      this.boss.textoDano?.setText("0%");
    } else if (habilidade === "puppet") {
      this.puppetAliadaTH30?.destruir();
      this.puppetAliadaTH30 = new PuppetLojaMiku(this, { gigante: true, aliada: true, criarAnimacao: true, limpezaSeguraTH30: true });
    } else if (habilidade === "slender") {
      for (const alvo of alvos) alvo.corrupcaoSlender?.adicionar(100);
    } else if (habilidade === "pingu") {
      for (const alvo of alvos) alvo.congelamentoPingu?.adicionar(65);
    }
    this.cooldownsHabilidadesTH30.set(habilidade, this.time.now + (habilidade === "cura" ? 60000 : 30000));
    this.ultimaHabilidadeTH30 = habilidade;
    this.proximaHabilidadeTH30 = this.time.now + 4500;
  }

  lancarRaiosTH30() {
    const boss = this.boss?.sprite;
    if (!boss?.active) return;
    const x = boss.x;
    const y = boss.y;
    const lancarDupla = distancia => {
      const opcoes = { animacaoCompletaTH30: true, dono: this.boss };
      new RaioLoja(this, x - distancia, y, opcoes);
      new RaioLoja(this, x + distancia, y, opcoes);
    };
    lancarDupla(120);
    this.time.delayedCall(500, () => {
      if (!this.partidaEncerrada && this.boss?.sprite?.active) lancarDupla(220);
    });
  }

  atualizarLavaTH30() {
    if (!this.lavaTH30Ate) return;
    if (this.time.now >= this.lavaTH30Ate) {
      this.lavaTH30Ate = 0;
      return;
    }
    for (const jogador of [this.jogador1, this.jogador2]) {
      if (!jogador?.sprite?.active || !jogador.sprite.body?.blocked.down || this.time.now < (this.ultimoContatoLavaTH30.get(jogador) ?? 0)) continue;
      this.ultimoContatoLavaTH30.set(jogador, this.time.now + 700);
      jogador.receberDano(1, { tipoSomImpacto: "light", knockbackX: 0, knockbackY: -650, knockbackFixo: true }, { x: jogador.sprite.x, atacante: this.boss });
    }
  }

  reproduzirAudioLoja(chave) {
    if (this.cache.audio.exists(chave)) this.sound.play(chave);
  }

  iniciarAberturaHistoria() {
    if (this.entradaFinalCompleta) {
      this.physics.world.pause();
      this.cameras.main.fadeIn(700, 255, 255, 255);
      this.sound.play("ding");
      const escala = Math.min(this.scale.width / 1920, this.scale.height / 1080);
      const retratoFJ = this.add.image(18 * escala, this.scale.height - 15 * escala, "FJ_true")
        .setOrigin(0, 1)
        .setDisplaySize(550 * escala, 550 * escala)
        .setScrollFactor(0)
        .setDepth(2500);
      this.camJogo.ignore(retratoFJ);
      this.time.delayedCall(3000, () => {
        retratoFJ.destroy();
        this.aguardandoEntradaFinal = false;
        this.iniciarIntroPartida();
      });
      return;
    }

    this.dialogoHistoria = new DialogoHistoria(this, () => {
      // A entrada da luta e iniciada junto com a fala final, antes de aceitar input.
    }, {
      falas: [
        {
          personagem: "TH30",
          texto: "Você não pode lutar contra o seu destino.",
        },
        {
          personagem: "FJ",
          retrato: "FJ_N",
          texto: "Quem faz meu destino...",
        },
        {
          personagem: "FJ",
          retrato: "FJ_N",
          texto: "Sou EU",
          aoAvancar: () => {
            this.revelarFJTrue();
            return true;
          },
        },
      ],
    });
  }

  revelarFJTrue() {
    if (this.transicaoFJAtiva) return;
    this.transicaoFJAtiva = true;
    if (this.dialogoHistoria) this.dialogoHistoria.bloquearAvanco = true;
    const flash = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0xffffff,
    ).setScrollFactor(0).setDepth(5000).setAlpha(0);
    this.tweens.add({
      targets: flash,
      alpha: 1,
      duration: 180,
      onComplete: () => {
        const escalaRetrato = Math.min(this.scale.width / 1920, this.scale.height / 1080);
        this.dialogoHistoria?.retrato.setTexture("FJ_true")
          .setDisplaySize(550 * escalaRetrato, 550 * escalaRetrato)
          .setPosition(18 * escalaRetrato, this.scale.height - 15 * escalaRetrato)
          .setOrigin(0, 1)
          .setVisible(true);
        if (this.escolhaP1 === "FJ" || this.escolhaP1 === "Frederick") {
          this.aguardandoEntradaFinal = true;
          this.physics.world.resume();
          this.sound.play("ding");
          this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 280,
            onComplete: () => {
              this.dialogoHistoria?.destruir();
              this.dialogoHistoria = null;
              flash.destroy();
              this.time.delayedCall(250, () => {
                this.aguardandoEntradaFinal = false;
                this.iniciarIntroPartida();
              });
            },
          });
          return;
        }

        this.manterAssetsParaHistoria2 = true;
        const musicaHistoriaSeek = this.mapaAtual.musica?.seek ?? 0;
        this.time.delayedCall(120, () => {
          this.scene.restart({
            p1: "FJ",
            p2: this.escolhaP2,
            numPlayers: this.numPlayers,
            entradaFinalCompleta: true,
            musicaHistoriaSeek,
          });
        });
      },
    });
  }

  aoVencerHistoria() {
    this.sound.stopAll();
    this.scene.start("CenaCreditos");
  }
}
