//import * as Phaser from "phaser";
import Morrigan from "../Personagensjs/Morr.js";
import Madotsuki from "../Personagensjs/Madotsuki.js";
import MapaCidade from "../Mapasjs/Cidade.js";
import Frederick from "../Personagensjs/Frederick.js";
import Dio from "../Personagensjs/Dio.js";
import SpiderMan from "../Personagensjs/SpiderMan.js";
import Miku from "../Personagensjs/Miku.js";
import Ken from "../Personagensjs/Ken.js";
import ControleEntrada from "../Objetos/ControleEntrada.js";

export default class cenaPrincipal extends Phaser.Scene {
  constructor() {
    super("cenaPrincipal");
  }

  init(dados) {
    // Usa as escolhas passadas; se não houver, usa padrões para evitar erros
    this.escolhaP1 = dados.p1 || "Frederick";
    this.escolhaP2 = dados.p2 || "Madotsuki";

    this.ClasseMapa = dados.ClasseMapa || dados.mapa || MapaCidade;

  }

  create() {
    this.physics.world.setBounds(0, 0, 1920, 640);
    //criar o mapa que vou estar
    // 1. Instancia o mapa dinâmico trazido do init
   this.mapaAtual = new this.ClasseMapa(this);

   // 2. Lê os limites e pontos de respawn do mapa instanciado
   this.limitesArena = this.mapaAtual.limitesArena;
   this.pontoRespawnP1 = this.mapaAtual.spawnsRespawn.p1;
   this.pontoRespawnP2 = this.mapaAtual.spawnsRespawn.p2;


    // --- CONTROLE DE VIDAS ---
    this.vidasP1 = 3;
    this.vidasP2 = 3;
    //musiquinha e vida nerrr
    //this.musica = this.sound.add('ClockTower', { loop: true, volume: 0.1 });
    //this.musica.play();

    // --- PLATAFORMAS ESTÁTICAS ---
    this.plataformas = this.physics.add.staticGroup();

    //teclcas dos personagem atribuir imputs
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

    const controleP1 = new ControleEntrada(this, teclasP1, 0);
    const controleP2 = new ControleEntrada(this, teclasP2, 1);

    //========instanciar fodinhas============
    this.jogador1 = this.criarPersonagem(
  this.escolhaP1,
  this.mapaAtual.spawnsIniciais.p1.x, // Lê o X dinâmico do mapa
  this.mapaAtual.spawnsIniciais.p1.y, // Lê o Y dinâmico do mapa
  teclasP1,
  200,
  600,
  controleP1
);

this.jogador2 = this.criarPersonagem(
  this.escolhaP2,
  this.mapaAtual.spawnsIniciais.p2.x, // Lê o X dinâmico do mapa
  this.mapaAtual.spawnsIniciais.p2.y, // Lê o Y dinâmico do mapa
  teclasP2,
  600,
  600,
  controleP2
);

    //efeito aura==================
    // Verifica se a Madotsuki foi escolhida no P1 ou no P2
  //  const temDio =
  //    this.jogador1.nomePersonagem === "Dio" ||
  //    this.jogador2.nomePersonagem === "Dio";

    // Se ela estiver na partida, usa a música dela, senão usa a normal da fase
 //   const musicaParaTocar = temDio ? "DiosAmendment" : "ClockTower";

  //  this.musicaFase = this.sound.add(musicaParaTocar, {
  //    loop: true,
  //    volume: 0.1,
  //  });
  //  this.musicaFase.play();

    // 2. Cria a HUD do P1 na ESQUERDA
    const nomeP1 = this.jogador1.nomePersonagem || this.escolhaP1;
    this.hudP1_Nome = this.add
      .text(80, 950, nomeP1, {
        fontSize: "45px",
        fill: "#27F5F5",
        fontStyle: "bold",
      })
      .setScrollFactor(0);
    this.jogador1.textoDano = this.add
      .text(80, 870, "0%", {
        fontSize: "100px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setScrollFactor(0);

      // Texto para exibir as Vidas do P1
    this.hudP1_Vidas = this.add.text(80, 820, `VIDAS: ${this.vidasP1}`, { fontSize: "32px", fill: "#00ff00", fontStyle: "bold" }).setScrollFactor(0);

    // 3. Cria a HUD do P2 na DIREITA
    const nomeP2 = this.jogador2.nomePersonagem || this.escolhaP2;
    const posXDireita = this.scale.width - 200; // Alinha perto da borda direita

    this.hudP2_Nome = this.add
      .text(1600, 950, nomeP2, {
        fontSize: "45px",
        fill: "#F527F5",
        fontStyle: "bold",
      })
      .setScrollFactor(0);
    this.jogador2.textoDano = this.add
      .text(1600, 870, "0%", {
        fontSize: "100px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setScrollFactor(0);

      this.hudP2_Vidas = this.add.text(1600, 820, `VIDAS: ${this.vidasP2}`, { fontSize: "32px", fill: "#00ff00", fontStyle: "bold" }).setScrollFactor(0);

    // --- COLISÃO ---
    // Diz que o sprite da Morrigan colide com o grupo de plataformas
    this.physics.add.collider(this.jogador1.sprite, this.mapaAtual.plataformas);
    this.physics.add.collider(this.jogador2.sprite, this.mapaAtual.plataformas);

    // camera limite bordas ate onde ela vai
    this.camJogo = this.cameras.main;

    // Aplica os limites dinâmicos se o mapa configurou 'configCamera'
    if (this.mapaAtual.configCamera && this.mapaAtual.configCamera.limites) {
    const limCam = this.mapaAtual.configCamera.limites;
    this.camJogo.setBounds(limCam.x, limCam.y, limCam.largura, limCam.altura);
    }

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
   this.camJogo.ignore([
    this.jogador1.textoDano,
    this.jogador2.textoDano,
    this.hudP1_Vidas,
    this.hudP2_Vidas,
    this.hudP1_Nome,
    this.hudP2_Nome
  ]);

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
        case "Ken":
        return new Ken(this, x, y, teclas, minDano, maxDano, controle);
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

    // Checa se alguém saiu da arena (passando o número do jogador como 3º argumento)
    this.verificarMorte(this.jogador1, this.pontoRespawnP1, 1);
    this.verificarMorte(this.jogador2, this.pontoRespawnP2, 2);
  }

  verificarMorte(jogador, pontoRespawn, numJogador) {
  if (!jogador || !jogador.sprite) return;

  const x = jogador.sprite.x;
  const y = jogador.sprite.y;
  const lim = this.limitesArena;

  if (!lim) return;

  // Lê minX/maxX/minY/maxY e tem fallback para esquerda/direita/topo/baixo
  const minX = lim.minX !== undefined ? lim.minX : lim.esquerda;
  const maxX = lim.maxX !== undefined ? lim.maxX : lim.direita;
  const minY = lim.minY !== undefined ? lim.minY : lim.topo;
  const maxY = lim.maxY !== undefined ? lim.maxY : lim.baixo;

  if (x < minX || x > maxX || y < minY || y > maxY) {
    this.processarQueda(jogador, pontoRespawn, numJogador);
  }
}

  processarQueda(jogador, pontoRespawn, numJogador) {
    // Desconta a vida do jogador correspondente
    if (numJogador === 1) {
      this.vidasP1--;
      this.hudP1_Vidas.setText(`VIDAS: ${this.vidasP1}`);
    } else {
      this.vidasP2--;
      this.hudP2_Vidas.setText(`VIDAS: ${this.vidasP2}`);
    }

    // Se as vidas acabarem, encerra a partida
    if (this.vidasP1 <= 0 || this.vidasP2 <= 0) {
      this.sound.stopAll();
      this.scene.start("CenaGameOver");
      return;
    }

    // Caso ainda tenha vidas, respawna normalmente
    this.respawnar(jogador, pontoRespawn);
  }

  respawnar(jogador, pontoRespawn) {
    jogador.sprite.body.setVelocity(0, 0);
    jogador.sprite.setPosition(pontoRespawn.x, pontoRespawn.y);
    jogador.isTumbling = false;
    jogador.maquinaEstados.mudarEstado("idle");

    if (jogador.porcentagemDano !== undefined) {
      jogador.porcentagemDano = 0;
      if (jogador.textoDano) jogador.textoDano.setText("0%");
    }

    if (this.overlayMorte) {
      this.overlayMorte.setVisible(true);
      this.overlayMorte.play("TVefect");

      this.overlayMorte.once(
        Phaser.Animations.Events.ANIMATION_COMPLETE,
        () => {
          this.overlayMorte.setVisible(false);
        }
      );
    }
  }

 atualizarCamera() {
    if (!this.jogador1 || !this.jogador2) return;

    const p1 = this.jogador1.sprite;
    const p2 = this.jogador2.sprite;
    const cam = this.cameras.main;

    // 1. Lê as configurações do mapa
    const configCam = this.mapaAtual.configCamera || {};
    const lim = configCam.limites || { x: 0, y: 0, largura: 6000, altura: 3000 };
    const maxZoom = configCam.maxZoom !== undefined ? configCam.maxZoom : 2.0;
    const minZoom = configCam.minZoom !== undefined ? configCam.minZoom : 1.0;
    const distMinima = configCam.distMinima !== undefined ? configCam.distMinima : 100;
    const distMaxima = configCam.distMaxima !== undefined ? configCam.distMaxima : 1200;

    // 2. Calcula e aplica o Zoom primeiro
    const distancia = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
    const fatorDistancia = Phaser.Math.Clamp(
        (distancia - distMinima) / (distMaxima - distMinima),
        0,
        1
    );
    const zoomAlvo = Phaser.Math.Linear(maxZoom, minZoom, fatorDistancia);
    cam.zoom = Phaser.Math.Linear(cam.zoom, zoomAlvo, 0.05);

    // 3. Calcula o ponto central ideal entre P1 e P2
    const centroAlvoX = (p1.x + p2.x) / 2;
    const centroAlvoY = (p1.y + p2.y) / 2;

    // 4. Calcula o tamanho da visão da câmera com base no zoom atual
    const metadeMetragemVisivelX = (cam.width / cam.zoom) / 2;
    const metadeMetragemVisivelY = (cam.height / cam.zoom) / 2;

    // 5. Clampa o PONTO CENTRAL para não ultrapassar as bordas da imagem de 6000x3000
    const centroXTravado = Phaser.Math.Clamp(
        centroAlvoX,
        lim.x + metadeMetragemVisivelX,
        lim.x + lim.largura - metadeMetragemVisivelX
    );

    const centroYTravado = Phaser.Math.Clamp(
        centroAlvoY,
        lim.y + metadeMetragemVisivelY,
        lim.y + lim.altura - metadeMetragemVisivelY
    );

    // 6. Centraliza a câmera com interpolação suave (Lerp)
    const centroAtualX = cam.midPoint.x;
    const centroAtualY = cam.midPoint.y;

    const novoCentroX = Phaser.Math.Linear(centroAtualX, centroXTravado, 0.1);
    const novoCentroY = Phaser.Math.Linear(centroAtualY, centroYTravado, 0.1);

    cam.centerOn(novoCentroX, novoCentroY);
}
}
