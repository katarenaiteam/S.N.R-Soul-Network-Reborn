//import * as Phaser from "phaser";
import Morrigan from "../Personagensjs/Morr.js";
import Madotsuki from "../Personagensjs/Madotsuki.js";
import MapaCidade from "../Mapasjs/Cidade.js";
import Frederick from "../Personagensjs/Frederick.js";
import Dio from "../Personagensjs/Dio.js";
import SpiderMan from "../Personagensjs/SpiderMan.js";
import Miku from "../Personagensjs/Miku.js";
import ControleEntrada from "../Objetos/ControleEntrada.js";

export default class cenaPrincipal extends Phaser.Scene {
  constructor() {
    super("cenaPrincipal");
  }

  init(dados) {
    // Usa as escolhas passadas; se não houver, usa padrões para evitar erros
    this.escolhaP1 = dados.p1 || "Frederick";
    this.escolhaP2 = dados.p2 || "Madotsuki";
  }

  create() {
    this.physics.world.setBounds(0, 0, 1920, 640);
    //criar o mapa que vou estar
    this.mapaAtual = new MapaCidade(this);

    //musiquinha e vida nerrr
    //this.musica = this.sound.add('ClockTower', { loop: true, volume: 0.1 });
    //this.musica.play();

    // --- PLATAFORMAS ESTÁTICAS ---
    this.plataformas = this.physics.add.staticGroup();

    //telcas dos personagem atribuir imputs
    const teclasP1 = this.input.keyboard.addKeys({
      esquerda: Phaser.Input.Keyboard.KeyCodes.A,
      direita: Phaser.Input.Keyboard.KeyCodes.D,
      cima: Phaser.Input.Keyboard.KeyCodes.W,
      baixo: Phaser.Input.Keyboard.KeyCodes.S,
      dash: Phaser.Input.Keyboard.KeyCodes.SPACE,
      atack: Phaser.Input.Keyboard.KeyCodes.F,
    });

    const teclasP2 = this.input.keyboard.addKeys({
      esquerda: Phaser.Input.Keyboard.KeyCodes.J,
      direita: Phaser.Input.Keyboard.KeyCodes.L,
      cima: Phaser.Input.Keyboard.KeyCodes.I,
      baixo: Phaser.Input.Keyboard.KeyCodes.K,
      dash: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      atack: Phaser.Input.Keyboard.KeyCodes.O,
    });

    const controleP1 = new ControleEntrada(this, teclasP1, 0);
    const controleP2 = new ControleEntrada(this, teclasP2, 1);

    //========instanciar fodinhas============
    this.jogador1 = this.criarPersonagem(
      this.escolhaP1,
      500,
      200,
      teclasP1,
      200,
      600,
      controleP1,
    );
    this.jogador2 = this.criarPersonagem(
      this.escolhaP2,
      600,
      200,
      teclasP2,
      600,
      600,
      controleP2,
    );

    //efeito aura==================
    // Verifica se a Madotsuki foi escolhida no P1 ou no P2
    const temDio =
      this.jogador1.nomePersonagem === "Dio" ||
      this.jogador2.nomePersonagem === "Dio";

    // Se ela estiver na partida, usa a música dela, senão usa a normal da fase
    const musicaParaTocar = temDio ? "DiosAmendment" : "ClockTower";

    this.musicaFase = this.sound.add(musicaParaTocar, {
      loop: true,
      volume: 0.5,
    });
    this.musicaFase.play();

    // 2. Cria a HUD do P1 na ESQUERDA
    const nomeP1 = this.jogador1.nomePersonagem || this.escolhaP1;
    this.hudP1_Nome = this.add
      .text(80, 1000, nomeP1, {
        fontSize: "45px",
        fill: "#27F5F5",
        fontStyle: "bold",
      })
      .setScrollFactor(0);
    this.jogador1.textoDano = this.add
      .text(80, 920, "0%", {
        fontSize: "100px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setScrollFactor(0);

    // 3. Cria a HUD do P2 na DIREITA
    const nomeP2 = this.jogador2.nomePersonagem || this.escolhaP2;
    const posXDireita = this.scale.width - 200; // Alinha perto da borda direita

    this.hudP2_Nome = this.add
      .text(1600, 1000, nomeP2, {
        fontSize: "45px",
        fill: "#F527F5",
        fontStyle: "bold",
      })
      .setScrollFactor(0);
    this.jogador2.textoDano = this.add
      .text(1600, 920, "0%", {
        fontSize: "100px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setScrollFactor(0);

    // --- COLISÃO ---
    // Diz que o sprite da Morrigan colide com o grupo de plataformas
    this.physics.add.collider(this.jogador1.sprite, this.mapaAtual.plataformas);
    this.physics.add.collider(this.jogador2.sprite, this.mapaAtual.plataformas);

    // camera bordas
    // 1. Câmera do Jogo
    this.camJogo = this.cameras.main;
    this.camJogo.setBounds(0, 0, 1920, 640);

    // === LIMITES DA ARENA (BLAST ZONES) === (sistema de morrer)
    // Defina quanto o personagem pode ir além do cenário antes de morrer:
    this.limitesArena = {
      esquerda: -200, // Quantos pixels à esquerda do cenário (0) pode ir
      direita: 2000, // Quantos pixels à direita (cenário de 800 + 200)
      topo: -300, // Quanto para CIMA ele pode voar antes de morrer
      baixo: 1000, // Quanto para BAIXO (cair do chasm) ele pode ir
    };
    // Ponto de Respawn (Onde o personagem renasce)
    this.pontoRespawnP1 = { x: 500, y: 100 };
    this.pontoRespawnP2 = { x: 600, y: 100 };

    this.anims.create({
      key: "TVefect",
      frames: this.anims.generateFrameNumbers("TVefect"),
      frameRate: 8,
      repeat: 0,
    });

    // Criar o sprite alinhado no canto (0,0) em vez do centro
    this.overlayMorte = this.add.sprite(0, 0, "TVefect");
    this.overlayMorte.setOrigin(0, 0);
    this.overlayMorte.setDisplaySize(this.scale.width, this.scale.height);
    this.overlayMorte.setVisible(false);

    // 3. REGRA DAS CÂMERAS:
    // Faz a câmera do jogo IGNORAR a tela de morte
    this.camJogo.ignore(this.overlayMorte);

    // 2. Câmera do HUD (Fica fixa por cima)
    this.camHUD = this.cameras.add(0, 0, this.scale.width, this.scale.height);

    // Diga para a câmera principal ignorar os elementos do HUD:
    this.camJogo.ignore([this.jogador1.textoDano, this.jogador2.textoDano]);

    // Diga para a câmera de HUD mostrar SOMENTE o HUD e ignorar o jogo/cenário/personagens:
    this.camHUD.ignore([
      this.mapaAtual.plataformas,
      this.mapaAtual.imagemFundo,
      this.jogador1.sprite,
      this.jogador2.sprite,
    ]);

    if (this.physics.config.debug || this.physics.world.drawDebug) {
      this.camHUD.ignore(this.physics.world.debugGraphic);
    }
  }

  criarPersonagem(nome, x, y, teclas, minDano, maxDano, controle) {
    switch (nome) {
      case "Frederick":
        return new Frederick(this, x, y, teclas, minDano, maxDano, controle);
      case "Madotsuki":
        return new Madotsuki(this, x, y, teclas, minDano, maxDano, controle);
      case "Morrigan":
        return new Morrigan(this, x, y, teclas, minDano, maxDano, controle);
      case "Dio":
        return new Dio(this, x, y, teclas, minDano, maxDano, controle);
      case "SpiderMan":
        return new SpiderMan(this, x, y, teclas, minDano, maxDano, controle);
      case "Miku":
        return new Miku(this, x, y, teclas, minDano, maxDano, controle);
      default:
        return new Frederick(this, x, y, teclas, minDano, maxDano, controle);
    }
  }

  // 3. LOOP DE ATUALIZAÇÃO
  update() {
    // Manda o Personagem.js atualizar o movimento e animações a cada frame
    if (this.jogador1) this.jogador1.update();
    if (this.jogador2) this.jogador2.update();

    this.atualizarCamera();

    // Checa se alguém saiu da arena
    this.verificarMorte(this.jogador1, this.pontoRespawnP1);
    this.verificarMorte(this.jogador2, this.pontoRespawnP2);
  }

  verificarMorte(jogador, pontoRespawn) {
    if (!jogador || !jogador.sprite) return;

    const x = jogador.sprite.x;
    const y = jogador.sprite.y;
    const lim = this.limitesArena;

    // Se passou de QUALQUER um dos 4 limites fixa no MUNDO (não na câmera):
    if (x < lim.esquerda || x > lim.direita || y < lim.topo || y > lim.baixo) {
      this.respawnar(jogador, pontoRespawn);
    }
  }

  respawnar(jogador, pontoRespawn) {
    // 1. Oculta o jogador temporariamente ou desativa a física se quiser
    jogador.sprite.body.setVelocity(0, 0);
    jogador.sprite.setPosition(pontoRespawn.x, pontoRespawn.y);

    // Reseta o dano
    if (jogador.porcentagemDano !== undefined) {
      jogador.porcentagemDano = 0;
      if (jogador.textoDano) jogador.textoDano.setText("0%");
    }
    // 2. Toca a Animação na Tela Inteira
    if (this.overlayMorte) {
      this.overlayMorte.setVisible(true);
      this.overlayMorte.play("TVefect");

      // Quando a animação terminar, esconde o sprite novamente
      this.overlayMorte.once(
        Phaser.Animations.Events.ANIMATION_COMPLETE,
        () => {
          this.overlayMorte.setVisible(false);
        },
      );
    }
  }

  atualizarCamera() {
    const p1 = this.jogador1.sprite;
    const p2 = this.jogador2.sprite;
    const cam = this.cameras.main;

    // 1. Ponto Médio
    const centroX = (p1.x + p2.x) / 2;
    const centroY = (p1.y + p2.y) / 2;

    // Suavização do movimento (0.1 = velocidade de resposta)
    cam.scrollX = Phaser.Math.Linear(cam.scrollX, centroX - cam.width / 2, 0.1);
    cam.scrollY = Phaser.Math.Linear(
      cam.scrollY,
      centroY - cam.height / 2,
      0.1,
    );

    // 2. Distância física entre os dois
    const distancia = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);

    // 3. CONTROLES DO ZOOM (Ajuste estes valores facilmente):
    const maxZoom = 3; // <-- QUÃO PERTO fica quando estão colados (Ex: 1.2 a 2.0)
    const minZoom = 1; // <-- QUÃO LONGE fica quando se separam (Ex: 0.4 a 0.8)

    const distMinima = 100; // Distância onde a câmera atinge o zoom MÁXIMO
    const distMaxima = 1200; // Distância onde a câmera atinge o zoom MÍNIMO

    // Faz o mapeamento direto proporcional da distância para o Zoom
    const fatorDistancia = Phaser.Math.Clamp(
      (distancia - distMinima) / (distMaxima - distMinima),
      0,
      1,
    );
    const zoomAlvo = Phaser.Math.Linear(maxZoom, minZoom, fatorDistancia);

    // Aplica o Zoom suavemente (0.05 = transição leve)
    cam.setZoom(Phaser.Math.Linear(cam.zoom, zoomAlvo, 0.05));
  }
}
