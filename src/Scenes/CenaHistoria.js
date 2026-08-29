import Morrigan from "../Personagensjs/Morr.js";
import Madotsuki from "../Personagensjs/Madotsuki.js";
import SkyTowers from "../Mapasjs/SkyTowers.js";
import Frederick from "../Personagensjs/Frederick.js";
import Dio from "../Personagensjs/Dio.js";
import SpiderMan from "../Personagensjs/SpiderMan.js";
import Ken from "../Personagensjs/Ken.js";
import Miku from "../Personagensjs/Miku.js";
import ControleEntrada from "../Objetos/ControleEntrada.js";
import BotController from "../Objetos/BotController.js";
import Spider_IA from "../Objetos/Spider_IA.js";

export default class CenaHistoria extends Phaser.Scene {
  constructor() {
    super("CenaHistoria");
  }

  init(dados) {
    this.escolhaP1 = dados.p1 || "Frederick";
    this.escolhaP2 = dados.p2 || null;
    this.numPlayers = dados.numPlayers || 1;
    this.inimigoNome = "SpiderMan"; // Primeiro Boss da Fase 1
  }

  create() {
    this.physics.world.setBounds(0, 0, 2600, 1400);

    this.mapaAtual = new SkyTowers(this);
    this.limitesArena = this.mapaAtual.limitesArena;
    this.pontoRespawnP1 = this.mapaAtual.spawnsRespawn.p1;
    this.pontoRespawnP2 = this.mapaAtual.spawnsRespawn.p2;

    this.vidasP1 = 3;
    this.vidasP2 = this.numPlayers === 2 ? 3 : 0;
    this.vidasBoss = 3;

    // Teclas P1
    const teclasP1 = this.input.keyboard.addKeys({
      esquerda: Phaser.Input.Keyboard.KeyCodes.A,
      direita: Phaser.Input.Keyboard.KeyCodes.D,
      cima: Phaser.Input.Keyboard.KeyCodes.W,
      baixo: Phaser.Input.Keyboard.KeyCodes.S,
      dash: Phaser.Input.Keyboard.KeyCodes.SPACE,
      atack: Phaser.Input.Keyboard.KeyCodes.F,
      special: Phaser.Input.Keyboard.KeyCodes.G,
      guard: Phaser.Input.Keyboard.KeyCodes.E,
    });
    const controleP1 = new ControleEntrada(this, teclasP1, 0);

    this.jogador1 = this.criarPersonagem(
      this.escolhaP1,
      this.mapaAtual.spawnsIniciais.p1.x,
      this.mapaAtual.spawnsIniciais.p1.y,
      teclasP1,
      200,
      600,
      controleP1
    );

    // Teclas P2
    if (this.numPlayers === 2 && this.escolhaP2) {
      const teclasP2 = this.input.keyboard.addKeys({
        esquerda: Phaser.Input.Keyboard.KeyCodes.J,
        direita: Phaser.Input.Keyboard.KeyCodes.L,
        cima: Phaser.Input.Keyboard.KeyCodes.I,
        baixo: Phaser.Input.Keyboard.KeyCodes.K,
        dash: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        atack: Phaser.Input.Keyboard.KeyCodes.H,
        special: Phaser.Input.Keyboard.KeyCodes.P,
        guard: Phaser.Input.Keyboard.KeyCodes.O,
      });
      const controleP2 = new ControleEntrada(this, teclasP2, 1);

      this.jogador2 = this.criarPersonagem(
        this.escolhaP2,
        this.mapaAtual.spawnsIniciais.p1.x + 100,
        this.mapaAtual.spawnsIniciais.p1.y,
        teclasP2,
        600,
        600,
        controleP2
      );
    }

    // Boss
// // 1. Instancia o Controlador de Hardware da IA
    this.botIA = new BotController(this);

    // 2. Cria a IA do Homem-Aranha passando o controller
    this.spiderIA = new Spider_IA(this.botIA);

    // 3. Conecta a IA (cérebro) ao Controlador
    this.botIA.setCerebro(this.spiderIA);

    // 4. Instancia o Boss passando as teclas virtuais do BotController
    this.boss = this.criarPersonagem(
      this.inimigoNome,
      this.mapaAtual.spawnsIniciais.p2.x,
      this.mapaAtual.spawnsIniciais.p2.y,
      this.botIA.teclas,
      0,
      0,
      null
    );

    // 5. Vincula a entidade do Boss no Controlador de Bot e na IA
    this.botIA.bot = this.boss;

    // --- CRIAÇÃO DA HUD ---
    this.hudP1_Nome = this.add.text(80, 950, this.jogador1.nomePersonagem || this.escolhaP1, { fontSize: "45px", fill: "#27F5F5", fontStyle: "bold" }).setScrollFactor(0);
    this.jogador1.textoDano = this.add.text(80, 870, "0%", { fontSize: "100px", fill: "#ffffff", fontStyle: "bold" }).setScrollFactor(0);
    this.hudP1_Vidas = this.add.text(80, 820, `VIDAS: ${this.vidasP1}`, { fontSize: "32px", fill: "#00ff00", fontStyle: "bold" }).setScrollFactor(0);

    this.hudBoss_Nome = this.add.text(1500, 950, "SPIDER-MAN (BOSS)", { fontSize: "45px", fill: "#FF0000", fontStyle: "bold" }).setScrollFactor(0);
    this.boss.textoDano = this.add.text(1500, 870, "0%", { fontSize: "100px", fill: "#ffffff", fontStyle: "bold" }).setScrollFactor(0);
    this.hudBoss_Vidas = this.add.text(1500, 820, `VIDAS: ${this.vidasBoss}`, { fontSize: "32px", fill: "#ff0000", fontStyle: "bold" }).setScrollFactor(0);

    const elementosHUD = [
      this.hudP1_Nome, this.jogador1.textoDano, this.hudP1_Vidas,
      this.hudBoss_Nome, this.boss.textoDano, this.hudBoss_Vidas
    ];

    if (this.numPlayers === 2 && this.jogador2) {
      this.hudP2_Nome = this.add.text(500, 950, this.jogador2.nomePersonagem || this.escolhaP2, { fontSize: "45px", fill: "#F527F5", fontStyle: "bold" }).setScrollFactor(0);
      this.jogador2.textoDano = this.add.text(500, 870, "0%", { fontSize: "100px", fill: "#ffffff", fontStyle: "bold" }).setScrollFactor(0);
      this.hudP2_Vidas = this.add.text(500, 820, `VIDAS: ${this.vidasP2}`, { fontSize: "32px", fill: "#00ff00", fontStyle: "bold" }).setScrollFactor(0);
      elementosHUD.push(this.hudP2_Nome, this.jogador2.textoDano, this.hudP2_Vidas);
    }

    // AGRUPA TODA A HUD EM UM CONTAINER
    this.containerHUD = this.add.container(0, 0, elementosHUD);

    // --- COLISÃO COM CENÁRIO ---
    this.physics.add.collider(this.jogador1.sprite, this.mapaAtual.plataformas);
    if (this.jogador2) this.physics.add.collider(this.jogador2.sprite, this.mapaAtual.plataformas);
    this.physics.add.collider(this.boss.sprite, this.mapaAtual.plataformas);

    // --- CÂMERAS ---
    this.camJogo = this.cameras.main;
    if (this.mapaAtual.configCamera && this.mapaAtual.configCamera.limites) {
      const limCam = this.mapaAtual.configCamera.limites;
      this.camJogo.setBounds(limCam.x, limCam.y, limCam.largura, limCam.altura);
    }

    if (!this.anims.exists("TVefect")) {
      this.anims.create({
        key: "TVefect",
        frames: this.anims.generateFrameNumbers("TVefect"),
        frameRate: 8,
        repeat: 0,
      });
    }

    this.overlayMorte = this.add.sprite(0, 0, "TVefect")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setVisible(false);
    this.camJogo.ignore([this.overlayMorte]);

    // Câmera secundária desenha APENAS a HUD e limpa todo o resto da tela
    this.camHUD = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    
    // Regra de Ouro: camJogo esconde a HUD, camHUD esconde o Jogo
    this.camJogo.ignore([this.containerHUD]);
    this.camHUD.ignore([
      this.mapaAtual.plataformas, 
      this.mapaAtual.imagemFundo, 
      this.jogador1.sprite, 
      this.jogador1.grupoHurtbox, 
      this.boss.sprite, 
      this.boss.grupoHurtbox,
      this.physics.world.debugGraphic
    ].filter(Boolean));
    if (this.jogador2) {
      this.camHUD.ignore([
        this.jogador2.sprite,
        this.jogador2.grupoHurtbox
      ].filter(Boolean));
    }
  }

  // Método auxiliar para processar dano garantindo que aliados não se acertem
  // Método auxiliar para processar dano apenas em caso de contato real
  aplicarGolpe(atacante, vitima) {
    if (!atacante || !vitima || !atacante.sprite?.active || !vitima.sprite?.active) return;

    // Se a vítima JÁ ESTÁ no estado apanhando, ignora novos acertos para não reiniciar o hitstun
    const estadoVitima = vitima.maquinaEstados?.estadoAtual?.nome;
    if (estadoVitima === "hurt") return;

    const estadoAtaque = atacante.maquinaEstados?.estados["atack"];
    const hitbox = estadoAtaque?.hitboxAtual;

    if (estadoAtaque && hitbox && hitbox.active) {
      const idAtaqueAtual = estadoAtaque.idAtaqueUnico || estadoAtaque.tempoInicio;

      if (vitima.ultimoAtaqueRecebidoId === idAtaqueAtual) return;

      const sobreposicao = Phaser.Geom.Intersects.RectangleToRectangle(
        hitbox.getBounds(),
        vitima.sprite.getBounds()
      );

      if (sobreposicao) {
        const golpe = estadoAtaque.golpeAtual;
        const dano = golpe?.dano || 10;
        const props = golpe?.propriedades || {};

        vitima.ultimoAtaqueRecebidoId = idAtaqueAtual;
        vitima.receberDano(dano, props, atacante.sprite.x);
      }
    }
  }
  criarPersonagem(nome, x, y, teclas, minDano, maxDano, controle) {
    switch (nome) {
      case "Frederick": return new Frederick(this, x, y, teclas, minDano, maxDano, controle);
      case "Madotsuki": return new Madotsuki(this, x, y, teclas, minDano, maxDano, controle);
      case "Morrigan": return new Morrigan(this, x, y, teclas, minDano, maxDano, controle);
      case "Dio": return new Dio(this, x, y, teclas, minDano, maxDano, controle);
      case "SpiderMan": return new SpiderMan(this, x, y, teclas, minDano, maxDano, controle);
      case "Miku": return new Miku(this, x, y, teclas, minDano, maxDano, controle);
      case "Ken": return new Ken(this, x, y, teclas, minDano, maxDano, controle);
      default: return new Frederick(this, x, y, teclas, minDano, maxDano, controle);
    }
  }

 update(time, delta) {
    if (this.botIA) this.botIA.update(time, delta);

    if (this.jogador1) this.jogador1.update();
    if (this.jogador2) this.jogador2.update();
    if (this.boss) this.boss.update();

    // --- PROCESSAMENTO DE COLISÃO DE ATAQUES ---
    if (this.boss) {
      // P1 e P2 atacam o Boss de forma independente
      if (this.jogador1) this.aplicarGolpe(this.jogador1, this.boss);
      if (this.jogador2) this.aplicarGolpe(this.jogador2, this.boss);

      // Boss ataca P1 e P2 sem misturar as instâncias
      if (this.jogador1) this.aplicarGolpe(this.boss, this.jogador1);
      if (this.jogador2) this.aplicarGolpe(this.boss, this.jogador2);
    }

    this.atualizarCamera();

    this.verificarMorte(this.jogador1, this.pontoRespawnP1, 1);
    if (this.jogador2) this.verificarMorte(this.jogador2, this.pontoRespawnP1, 2);
    this.verificarMorte(this.boss, this.pontoRespawnP2, 3);
  }

  verificarMorte(jogador, pontoRespawn, entTipo) {
    if (!jogador || !jogador.sprite) return;

    const x = jogador.sprite.x;
    const y = jogador.sprite.y;
    const lim = this.limitesArena;

    if (!lim) return;

    if (x < lim.minX || x > lim.maxX || y < lim.minY || y > lim.maxY) {
      this.processarQueda(jogador, pontoRespawn, entTipo);
    }
  }

  processarQueda(jogador, pontoRespawn, entTipo) {
    if (entTipo === 1) {
      this.vidasP1--;
      this.hudP1_Vidas.setText(`VIDAS: ${this.vidasP1}`);
    } else if (entTipo === 2) {
      this.vidasP2--;
      this.hudP2_Vidas.setText(`VIDAS: ${this.vidasP2}`);
    } else if (entTipo === 3) {
      this.vidasBoss--;
      this.hudBoss_Vidas.setText(`VIDAS: ${this.vidasBoss}`);
    }

    // Condição de Derrota
    const timePerdeu = (this.numPlayers === 1 && this.vidasP1 <= 0) || (this.numPlayers === 2 && this.vidasP1 <= 0 && this.vidasP2 <= 0);
    
    // Condição de Vitória
    const bossMorreu = this.vidasBoss <= 0;

    if (timePerdeu || bossMorreu) {
      this.sound.stopAll();
      this.scene.start("CenaGameOver");
      return;
    }

    this.respawnar(jogador, pontoRespawn);
  }

  respawnar(jogador, pontoRespawn) {
    jogador.sprite.body.setVelocity(0, 0);
    jogador.sprite.setPosition(pontoRespawn.x, pontoRespawn.y);

    // Limpa a memória de acertos para o jogador poder voltar a ser atingido/atacar normalmente
    jogador.ultimoAtaqueRecebidoId = null;

    if (jogador.porcentagemDano !== undefined) {
      jogador.porcentagemDano = 0;
      if (jogador.textoDano) jogador.textoDano.setText("0%");
    }

    if (this.overlayMorte) {
      this.overlayMorte.setVisible(true);
      this.overlayMorte.play("TVefect");
      this.overlayMorte.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.overlayMorte.setVisible(false);
      });
    }
  }

  atualizarCamera() {
    if (!this.jogador1 || !this.boss) return;

    const p1 = this.jogador1.sprite;
    const p2 = this.boss.sprite;
    const cam = this.cameras.main;

    const configCam = this.mapaAtual.configCamera || {};
    const lim = configCam.limites || { x: 0, y: 0, largura: 2600, altura: 1400 };

    const centroAlvoX = (p1.x + p2.x) / 2;
    const centroAlvoY = (p1.y + p2.y) / 2;

    const metadeMetragemVisivelX = (cam.width / cam.zoom) / 2;
    const metadeMetragemVisivelY = (cam.height / cam.zoom) / 2;

    const centroXTravado = Phaser.Math.Clamp(centroAlvoX, lim.x + metadeMetragemVisivelX, lim.x + lim.largura - metadeMetragemVisivelX);
    const centroYTravado = Phaser.Math.Clamp(centroAlvoY, lim.y + metadeMetragemVisivelY, lim.y + lim.altura - metadeMetragemVisivelY);

    cam.centerOn(
      Phaser.Math.Linear(cam.midPoint.x, centroXTravado, 0.1),
      Phaser.Math.Linear(cam.midPoint.y, centroYTravado, 0.1)
    );
  }
}