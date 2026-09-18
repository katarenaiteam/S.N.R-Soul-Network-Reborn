import { criarIndicador, atualizarIndicador } from "../Objetos/IndicadorPersonagem.js";
import { criarHudPartida, atualizarBarraUlt } from "../Objetos/HudPartida.js";
import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";
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
import SistemaPlataformasAtravessaveis from "../Objetos/SistemaPlataformasAtravessaveis.js";

export default class CenaHistoria extends Phaser.Scene {
  constructor() {
    super("CenaHistoria");
  }

  init(dados = {}) {
    this.jogador1 = null;
    this.jogador2 = null;
    this.boss = null;
    this.partidaEncerrada = false;
    this.ultEmAndamento = null;
    delete this.atualizarCamera;
    this.escolhaP1 = dados.p1 || "Frederick";
    this.escolhaP2 = dados.p2 || (dados.numPlayers === 2 ? "Ken" : null);
    this.numPlayers = dados.numPlayers || 1;
    this.inimigoNome = "SpiderMan"; // Primeiro Boss da Fase 1
  }

  create() {
    encerrarOutrasCenas(this);

    this.sistemaPlataformasAtravessaveis =
    new SistemaPlataformasAtravessaveis(this);

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

    this.sistemaPlataformasAtravessaveis.registrar(this.jogador1);

    if (this.jogador2) {
     this.sistemaPlataformasAtravessaveis.registrar(this.jogador2);
    }

   this.sistemaPlataformasAtravessaveis.registrar(this.boss, false);

    this.participantes = [
      { jogador: this.jogador1, escolha: this.escolhaP1, vidas: 'vidasP1', spawn: this.pontoRespawnP1, rotulo: 'P1' },
      ...(this.jogador2 ? [{ jogador: this.jogador2, escolha: this.escolhaP2, vidas: 'vidasP2',
        spawn: { x: this.pontoRespawnP1.x + 100, y: this.pontoRespawnP1.y }, rotulo: 'P2' }] : []),
      { jogador: this.boss, escolha: this.inimigoNome, vidas: 'vidasBoss', spawn: this.pontoRespawnP2, rotulo: 'BOSS' },
    ];
    this.containerHUD = this.add.container(0, 0).setScrollFactor(0).setDepth(1000);
    const escalaHUD = this.jogador2 ? 0.75 : 0.9;
    this.participantes.forEach((entrada, indice) => {
      const jogador = entrada.jogador;
      jogador.vidas = this[entrada.vidas];
      jogador.eliminado = false;
      const direita = jogador === this.boss;
      const x = direita ? this.scale.width - 30 : 30 + indice * 500;
      const y = this.scale.height - 358 * escalaHUD - 20;
      entrada.hud = criarHudPartida.call(this, jogador, entrada.escolha, x, y, direita);
      entrada.hud.setScale(escalaHUD);
      entrada.textoVidas = this.add.text(direita ? -420 : 10, 155,
        entrada.rotulo + ' - VIDAS: ' + jogador.vidas,
        { fontSize: '28px', color: direita ? '#ff6666' : '#ffffff', fontStyle: 'bold' });
      entrada.hud.add(entrada.textoVidas);
      this.containerHUD.add(entrada.hud);
    });

    // --- COLISÃO COM CENÁRIO ---
    this.physics.add.collider(this.jogador1.sprite, this.mapaAtual.plataformas);
    if (this.jogador2) this.physics.add.collider(this.jogador2.sprite, this.mapaAtual.plataformas);
    this.physics.add.collider(this.boss.sprite, this.mapaAtual.plataformas);

    // --- CÂMERAS ---
    this.camJogo = this.cameras.main;
    if (this.mapaAtual.configCamera && this.mapaAtual.configCamera.limites) {
      // O enquadramento abaixo trata tambem visoes maiores que o mapa.
      this.camJogo.removeBounds();
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
    this.overlayMorte.setDepth(2000);
    this.overlayMorte.on('animationcomplete-TVefect', () => this.overlayMorte.setVisible(false));
    this.camJogo.ignore([this.overlayMorte]);

    // Câmera secundária desenha APENAS a HUD e limpa todo o resto da tela
    this.camHUD = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    
    // Regra de Ouro: camJogo esconde a HUD, camHUD esconde o Jogo
    this.camJogo.ignore([this.containerHUD]);
    this.camHUD.ignore([
      this.mapaAtual.plataformas, 
      ...this.sistemaPlataformasAtravessaveis.grupo.getChildren(),
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

    this.indicadorP1 = this.criarIndicador(
  this.jogador1,
  "P1-ind",
  "P1-indV"
);

if (this.jogador2) {
  this.indicadorP2 = this.criarIndicador(
    this.jogador2,
    "P2-ind",
    "P2-indV"
  );
}

this.indicadorCPU = this.criarIndicador(
  this.boss,
  "CPU-ind",
  "CPU-indV"
);

  }

  criarPersonagem(nome, x, y, teclas, minDano, maxDano, controle) {
    switch (nome) {
      case "FJ":
      case "Frederick": return new Frederick(this, x, y, teclas, minDano, maxDano, controle);
      case "Madotsuki": return new Madotsuki(this, x, y, teclas, minDano, maxDano, controle);
      case "Dio": return new Dio(this, x, y, teclas, minDano, maxDano, controle);
      case "SpiderMan": return new SpiderMan(this, x, y, teclas, minDano, maxDano, controle);
      case "Miku": return new Miku(this, x, y, teclas, minDano, maxDano, controle);
      case "Ken": return new Ken(this, x, y, teclas, minDano, maxDano, controle);
      default: return new Frederick(this, x, y, teclas, minDano, maxDano, controle);
    }
  }

  update(time, delta) {
    if (this.partidaEncerrada) return;
    // Processa a saida antes de executar comandos ou enquadrar a camera.
    for (const entrada of this.participantes) {
      this.verificarMorte(entrada.jogador, entrada.spawn);
      if (this.partidaEncerrada) return;
    }
    if (this.boss?.sprite.active && !this.boss.eliminado) this.botIA.update(time, delta);
    for (const entrada of this.participantes) {
      const jogador = entrada.jogador;
      if (!jogador.eliminado && jogador.sprite.active) {
        jogador.atualizarCargaUlt(delta);
        jogador.update();
      }
      atualizarBarraUlt.call(this, jogador, entrada.hud);
    }
 
      this.sistemaPlataformasAtravessaveis.atualizar();
     
    // Usa o mesmo sistema de hitboxes da batalha normal, sem dano duplicado.
    for (const { jogador } of this.participantes) {
      if (jogador.eliminado) continue;
      const ataque = jogador.maquinaEstados.estados.atack;
      if (ataque && jogador.maquinaEstados.estadoAtual === ataque) ataque.verificarAcertoManual?.();
    }
    for (const entrada of this.participantes) {
      this.verificarMorte(entrada.jogador, entrada.spawn);
      if (this.partidaEncerrada) return;
    }
    this.atualizarCamera();

    this.atualizarIndicador(this.indicadorP1);

    if (this.indicadorP2) {
    this.atualizarIndicador(this.indicadorP2);
    }
    this.atualizarIndicador(this.indicadorCPU);
  }

  verificarMorte(jogador, spawn) {
    if (this.partidaEncerrada || !jogador?.sprite?.active || jogador.eliminado) return;
    const { x, y } = jogador.sprite;
    const lim = this.limitesArena;
    if (x < lim.minX || x > lim.maxX || y < lim.minY || y > lim.maxY) {
      this.processarQueda(jogador, spawn);
    }
  }

  processarQueda(jogador, spawn) {
    if (this.partidaEncerrada || jogador.eliminado || jogador.processandoQueda) return;
    const entrada = this.participantes.find(item => item.jogador === jogador);
    if (!entrada || this[entrada.vidas] <= 0) return;
    jogador.processandoQueda = true;
    this[entrada.vidas] = Math.max(0, this[entrada.vidas] - 1);
    jogador.vidas = this[entrada.vidas];
    jogador.ganharCargaUltPorMorte();
    entrada.textoVidas.setText(entrada.rotulo + (jogador.vidas ? ' - VIDAS: ' + jogador.vidas : ' - ELIMINADO'));
    this.limparAcao(jogador);
    if (jogador.vidas === 0) {
      jogador.eliminado = true;
      jogador.invulneravel = true;
      jogador.sprite.disableBody(true, true);
      jogador.grupoHurtbox.getChildren().forEach(box => { if (box.body) box.body.enable = false; });
      entrada.hud.setAlpha(0.4);
    } else {
      this.respawnar(jogador, spawn ?? entrada.spawn);
    }
    jogador.processandoQueda = false;
    const jogadoresVivos = this.participantes.some(item => item.jogador !== this.boss && item.jogador.vidas > 0);
    if (!jogadoresVivos || this.vidasBoss === 0) {
      this.partidaEncerrada = true;
      this.botIA.soltarTudo();
      this.sound.stopAll();
      this.scene.start('CenaGameOver');
    }
  }

  limparAcao(jogador) {
    jogador.estadoInvencible.sair(false);
    // Sair do estado cancela hitboxes, grabs, dash e a cinematica da ult.
    jogador.maquinaEstados.mudarEstado('idle');
    for (const logica of [...jogador.logicasEspeciaisAtivas]) logica.cancelar?.();
    for (const ataque of [...(this.registroCombateEspecial ?? [])]) {
      if (ataque.dono !== jogador) continue;
      ataque.remover();
      ataque.objeto?.destroy();
    }
    jogador.vfx.efeitosSeguindo.slice().forEach(item => jogador.vfx.destruirEfeito(item.objeto));
    jogador.sprite.anims.resume();
    jogador.sprite.anims.timeScale = 1;
    jogador.sprite.body.moves = true;
    jogador.sprite.body.setAllowGravity(true);
    jogador.sprite.body.setVelocity(0, 0);
    jogador.sprite.body.setAcceleration(0, 0);
    jogador.isTumbling = false;
    jogador.invulneravel = false;
    jogador.hiperArmaduraHits = 0;
    jogador.hiperArmaduraFonte = null;
    jogador.podeMover = true;
    jogador.podeAtacar = true;
    jogador.podeDash = true;
    jogador.pulos = 0;
    jogador.dashs = 0;
    jogador.resetarCooldownsAereos();
  }

  respawnar(jogador, spawn) {
    if (jogador.eliminado || jogador.vidas <= 0) return;
    jogador.sprite.body.reset(spawn.x, spawn.y);
    jogador.sprite.setVisible(true).setActive(true);
    jogador.comboHitsRecebidos = 0;
    jogador.tempoUltimoHit = -Infinity;
    jogador.ultimoAtaqueRecebidoId = null;
    jogador.ultimoImpacto = null;
    jogador.porcentagemDano = 0;
    jogador.textoDano?.setText(0);
    jogador.estadoInvencible.entrar(5000);
    jogador.sincronizarHurtbox();
    if (this.overlayMorte) {
      this.overlayMorte.setVisible(true).play('TVefect');
    }
  }

  criarIndicador(...args) {
    return criarIndicador.call(this, ...args);
  }

  atualizarIndicador(indicador) {
    return atualizarIndicador.call(this, indicador);
  }

  atualizarCamera() {
    const sprites = this.participantes
      .filter(({ jogador }) => !jogador.eliminado && jogador.sprite.active)
      .map(({ jogador }) => jogador.sprite);
    if (!sprites.length) return;
    const cam = this.camJogo;
    const config = this.mapaAtual.configCamera;
    const lim = config.limites;
    const minX = Math.min(...sprites.map(p => p.x)) - 130;
    const maxX = Math.max(...sprites.map(p => p.x)) + 130;
    const minY = Math.min(...sprites.map(p => p.y)) - 190;
    const maxY = Math.max(...sprites.map(p => p.y)) + 90;
    // O zoom pode abrir alem do minimo preferido para incluir os tres lutadores.
    const zoomAlvo = Math.min(config.maxZoom ?? 2, cam.width / (maxX - minX), (cam.height * 0.76) / (maxY - minY));
    const zoom = zoomAlvo < cam.zoom ? zoomAlvo : Phaser.Math.Linear(cam.zoom, zoomAlvo, 0.05);
    cam.setZoom(zoom);
    const metadeX = cam.width / zoom / 2;
    const metadeY = cam.height / zoom / 2;
    // Quando a visao e maior que o mapa, nao faz Clamp com limites invertidos.
    const centroX = metadeX * 2 >= lim.largura ? lim.x + lim.largura / 2
      : Phaser.Math.Clamp((minX + maxX) / 2, lim.x + metadeX, lim.x + lim.largura - metadeX);
    const centroY = metadeY * 2 >= lim.altura ? lim.y + lim.altura / 2
      : Phaser.Math.Clamp((minY + maxY) / 2, lim.y + metadeY, lim.y + lim.altura - metadeY);
    cam.centerOn(centroX, centroY);
  }
}
