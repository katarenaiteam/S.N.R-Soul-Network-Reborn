import { carregarGradeMenu } from "../Objetos/CarregarGradeMenu.js";
import { encerrarOutrasCenas } from "../Objetos/CenasExclusivas.js";
import { tocarMusicaSegura } from "../Objetos/AudioSeguro.js";

export default class CenaPreload extends Phaser.Scene {
  constructor() {
    super({ key: "CenaPreload" });
  }

  preload() {
    this.transicaoStartAtiva = false;
    this.podeAssinar = false;
    this.assinando = false;
    this.logText = null;
    this.footerStatus = null;
    this.footerProgress = null;
    this.cameras.main.setBackgroundColor("#000000");

    const escalaResolucao = this.scale.width / 1920;
    const margemX = 240 * escalaResolucao;
    const margemY = 120 * escalaResolucao;
    const larguraBarra = this.scale.width - margemX * 2;
    const footerY = 940 * escalaResolucao;

    const textStyle = { fontFamily: "RetroFont, monospace", fontSize: `${28 * escalaResolucao}px`, fill: "#00ff00" };
    const footerTextStyle = { fontFamily: "RetroFont, monospace", fontSize: `${22 * escalaResolucao}px`, fill: "#000000", fontStyle: "bold" };

    // --- RODAPÉ ---
    this.add.rectangle(margemX, footerY, larguraBarra, 45 * escalaResolucao, 0x00ff00).setOrigin(0, 0);

    // Espera a fonte RetroFont carregar no navegador
    document.fonts.ready.then(() => {
      // --- CABEÇALHO ---
      this.add.text(margemX, margemY, "RomSNR HBIOS v3.5.1, 4154-06-07", textStyle);
      this.add.text(margemX, margemY + 40 * escalaResolucao, "Soul Network Computer [RCZ80_msx2] Z80 @ 3.579MHz", textStyle);
      this.add.text(margemX, margemY + 70 * escalaResolucao, "0 MEM W/S, 1 I/O W/S, INT MODE 1, MSX MMU", textStyle);
      this.add.text(margemX, margemY + 100 * escalaResolucao, "0KB ROM, 448KB RAM, HEAP=0x321A\n", textStyle);

      // --- LOG DE CARREGAMENTO ---
      this.logText = this.add.text(margemX, margemY + 170 * escalaResolucao, "IDE0: LOADING GAME ASSETS...\n", textStyle);

      // --- TEXTOS DO RODAPÉ ---
      this.footerStatus = this.add.text(margemX + 20 * escalaResolucao, footerY + 10 * escalaResolucao, "CTRL-A Z for help | 115200 8N1 | NOR | Minicom 6.7 | VT102 | Offline", footerTextStyle);
      this.footerProgress = this.add.text(margemX + larguraBarra - 160 * escalaResolucao, footerY + 10 * escalaResolucao, "BOOT: 0%", footerTextStyle);
    });

    let logLines = ["IDE0: LOADING GAME ASSETS..."];

    this.load.on("fileprogress", (file) => {
      logLines.push(`IDE0: ATTACHING ${file.key.toUpperCase()}... [OK]`);
      if (logLines.length > 16) logLines.shift();
      if (this.logText) this.logText.setText(logLines.join("\n"));
    });

    this.load.on("progress", (value) => {
      const percentage = Math.floor(value * 100);
      if (this.footerProgress) this.footerProgress.setText(`BOOT: ${percentage}%`);
    });

    this.load.on("complete", () => {
      if (this.footerStatus) this.footerStatus.setText("CTRL-A Z for help | 115200 8N1 | NOR | Minicom 6.7 | VT102 | Online");
      this.time.delayedCall(800, () => this.iniciarSequenciaLogo());
    });

    // --- CARREGAMENTO DE ASSETS ---
    
    // --- preload ---
    this.load.audio("Aria8bit", "assets/Menus/Preload/Aria8bit.mp3");
    this.load.image("KatarenaiLogo", "assets/Menus/Preload/KatarenaiLogo.png");

    // --- MENUS ---
    // --- new start ---
    this.load.image("Start_menu", "./assets/Menus/Start_menu/Start_menu.png");
    this.load.image("frontStart", "./assets/Menus/Start_menu/frontStart.png");
    this.load.image("backStart", "./assets/Menus/Start_menu/backStart.png");
    this.load.image("logo", "./assets/Menus/Start_menu/logo.png");
    this.load.spritesheet("glitch", "./assets/Menus/Start_menu/glitch.png", { frameWidth: 683, frameHeight: 365 });
    this.load.audio("menu", "assets/Menus/Start_menu/menu.mp3");
    this.load.audio("Bpass", "assets/Menus/Start_menu/Bpass.wav");
    this.load.audio("Bselect", "assets/Menus/Start_menu/Bselect.mp3");

    // --- charmenu ---
    
    this.load.audio("katarenai8bit", "assets/Menus/Char_menu/Audio/katarenai8bit.mp3");
    // icons 
    

    // --- new charmenu ---
    // - grade
    carregarGradeMenu(this);
    //sons
    this.load.audio("mao-select", "assets/Menus/Char_menu/Audio/mao-select.wav");
    // - ficha
    this.load.image("P1maoCficha", "/assets/Menus/Char_menu/Sprites/ficha/P1maoCficha.png");
    this.load.image("P1maoSficha", "/assets/Menus/Char_menu/Sprites/ficha/P1maoSficha.png");
    this.load.image("P1_ficha", "/assets/Menus/Char_menu/Sprites/ficha/P1_ficha.png");
    this.load.image("P2maoCficha", "/assets/Menus/Char_menu/Sprites/ficha/P2maoCficha.png");
    this.load.image("P2maoSficha", "/assets/Menus/Char_menu/Sprites/ficha/P2maoSficha.png");
    this.load.image("P2_ficha", "/assets/Menus/Char_menu/Sprites/ficha/P2_ficha.png");
    // - baner
    this.load.image("Aig_baner", "/assets/Menus/Char_menu/Sprites/baners/Aig_baner.png");
    this.load.image("FJ_baner", "/assets/Menus/Char_menu/Sprites/baners/FJ_baner.png");
    this.load.image("GK_baner", "/assets/Menus/Char_menu/Sprites/baners/GK_baner.png");
    this.load.image("Ken_baner", "/assets/Menus/Char_menu/Sprites/baners/Ken_baner.png");
    this.load.image("Miku_baner", "/assets/Menus/Char_menu/Sprites/baners/Miku_baner.png");
    this.load.image("Pin_baner", "/assets/Menus/Char_menu/Sprites/baners/Pin_baner.png");
    this.load.image("Slen_baner", "/assets/Menus/Char_menu/Sprites/baners/Slen_baner.png");
    this.load.image("Spy_baner", "/assets/Menus/Char_menu/Sprites/baners/Spy_baner.png");
    this.load.image("Stor_baner", "/assets/Menus/Char_menu/Sprites/baners/Stor_baner.png");
    this.load.image("TH_baner", "/assets/Menus/Char_menu/Sprites/baners/TH_baner.png");
    // - icon
    this.load.image("aigis-icon", "/assets/Menus/Char_menu/Sprites/icons/aigis-icon.png");
    this.load.image("fj-icon", "/assets/Menus/Char_menu/Sprites/icons/fj-icon.png");
    this.load.image("goku-icon", "/assets/Menus/Char_menu/Sprites/icons/goku-icon.png");
    this.load.image("ken-icon", "/assets/Menus/Char_menu/Sprites/icons/ken-icon.png");
    this.load.image("miku-icon", "/assets/Menus/Char_menu/Sprites/icons/miku-icon.png");
    this.load.image("slender-icon", "/assets/Menus/Char_menu/Sprites/icons/slender-icon.png");
    this.load.image("spider-icon", "/assets/Menus/Char_menu/Sprites/icons/spider-icon.png");
    this.load.image("storm-icon", "/assets/Menus/Char_menu/Sprites/icons/storm-icon.png");
    this.load.image("th-icon", "/assets/Menus/Char_menu/Sprites/icons/th-icon.png");
    this.load.image("pingu-icon", "/assets/Menus/Char_menu/Sprites/icons/pingu-icon.png");

    this.load.image("space-to", "/assets/Menus/Char_menu/Sprites/space-to.png");
    
    this.load.image("thumb_skytowers", "assets/cenarios/MapaSkytowers/Sprites/thumb_skytowers.png");
    this.load.image("thumb_cidade", "assets/cenarios/MapaCidade/Sprites/thumb_cidade.png");
    this.load.image("thumb_teste", "assets/cenarios/MapaTest/thumb_teste.png");
    this.load.image("thumb_mikushow", "assets/cenarios/MikuShow/thumb_mikushow.png");
    this.load.image("thumb_ice", "assets/cenarios/Ice/thumb_ice.png");

    //versus
   this.load.image("Vs-back", "/assets/Menus/Vs/Vs-back.png");
   this.load.spritesheet("Vss", "./assets/Menus/Vs/Vss.png", { frameWidth: 320, frameHeight: 240 });
  }

  iniciarSequenciaLogo() {
    const escalaResolucao = this.scale.width / 1920;
    const margemX = 240 * escalaResolucao;
    const margemY = 120 * escalaResolucao;

    if (this.logText) this.logText.setText('');

    const contratoTexto = 
      "SOUL NETWORK OS - SYSTEM INITIALIZATION CONTRACT\n\n" +
      "LICENSE AGREEMENT: AUTHORIZED PERSONNEL ONLY.\n" +
      "ALL CONNECTIONS ARE MONITORED AND LOGGED.\n" +
      "UNAUTHORIZED ACCESS WILL RESULT IN SYSTEM PURGE.\n\n" +
      "ESTABLISHING SECURE PROTOCOL... OK\n" +
      "INITIALIZING KATARENAI TEAM FRAMEWORK...";

    const textoContratoObj = this.add.text(margemX, margemY + 180 * escalaResolucao, contratoTexto, {
      fontFamily: 'RetroFont, monospace', fontSize: `${28 * escalaResolucao}px`, fill: '#00ff00', lineSpacing: 6 * escalaResolucao
    });

    this.time.delayedCall(3000, () => {
      textoContratoObj.destroy();

      const logo = this.add.image(this.scale.width / 2, (this.scale.height / 2) - 20 * escalaResolucao, 'KatarenaiLogo')
        .setOrigin(0.5, 0.5).setScale(escalaResolucao).setAlpha(0);

      // Fade-In da Logo
      this.tweens.add({
        targets: logo, alpha: 1, duration: 3000, ease: 'Linear',
        onComplete: () => {
          this.time.delayedCall(2000, () => {
            // Fade-Out da Logo
            this.tweens.add({
              targets: logo, alpha: 0, duration: 1000,
              onComplete: () => {
                logo.destroy();

                const msgTexto = 
                  "Tu buscas aquilo que ainda nao possuis.\n" +
                  "Poder, reconhecimento, um lugar acima dos demais.\n" +
                  "Aqui, esse desejo pode tornar-se realidade.\n\n" +
                  "Mas lembra-te: para subir, algo deve ser deixado para tras.\n" +
                  "Toda escolha tem seu preco.\n\n" +
                  "Se este e o caminho que escolheste, entao prossiga.\n\n" +
                  "PRESS ANY BUTTON TO SIGN CONTRACT:\n" +
                  "SIGNATURE: [ ";

                this.mensagemObj = this.add.text(margemX, margemY + 180 * escalaResolucao, '', {
                  fontFamily: 'RetroFont, monospace', fontSize: `${26 * escalaResolucao}px`, fill: '#00ff00', align: 'left', lineSpacing: 8 * escalaResolucao
                });

                let i = 0;

                // Digitação do contrato
                this.time.addEvent({
                  delay: 25, repeat: msgTexto.length - 1,
                  callback: () => {
                    this.mensagemObj.text += msgTexto[i];
                    i++;

                    if (i === msgTexto.length) {
                      this.textoBase = this.mensagemObj.text;
                      this.mensagemObj.text += " _ ]";

                      // Efeito do cursor piscar
                      this.cursorTimer = this.time.addEvent({
                        delay: 500, loop: true,
                        callback: () => {
                          if (!this.assinando) {
                            this.mensagemObj.setText(this.mensagemObj.text.endsWith(" _ ]") ? this.textoBase + "   ]" : this.textoBase + " _ ]");
                          }
                        }
                      });

                      // Detectores de entrada
                      this.input.keyboard.once('keydown', () => this.processarAssinatura());
                      this.input.once('pointerdown', () => this.processarAssinatura());

                      this.podeAssinar = true;
                    }
                  }
                });
              }
            });
          });
        }
      });
    });
  }

  processarAssinatura() {
    if (!this.podeAssinar || this.assinando) return;

    this.podeAssinar = false;
    this.assinando = true;

    if (this.cursorTimer) this.cursorTimer.destroy();

    const nomeAssinatura = "Frederik Johnson";
    let idx = 0;

    // Animação digitando a assinatura
    this.time.addEvent({
      delay: 60,
      repeat: nomeAssinatura.length - 1,
      callback: () => {
        idx++;
        this.mensagemObj.setText(this.textoBase + nomeAssinatura.substring(0, idx) + "_ ]");

        // Quando terminar de digitar o nome completo
        if (idx === nomeAssinatura.length) {
          this.mensagemObj.setText(this.textoBase + nomeAssinatura + " ]  [ OK ]");

          // Aguarda 1.2 segundos, para o áudio e muda de cena
          this.time.delayedCall(1200, () => {
            // Parar a música com a variável correta ou stopAll()
            if (this.musicaFundo) {
              this.musicaFundo.stop();
            } else {
              this.sound.stopAll();
            }

            this.iniciarTransicaoStart();
          });
        }
      }
    });
  }
  create() {
    encerrarOutrasCenas(this);
    if (new URLSearchParams(window.location.search).get("espectador") === "1") {
      this.scene.start("CenaEspectador");
      return;
    }
    this.musicaFundo = tocarMusicaSegura(this, "Aria8bit", { loop: true, volume: 0.1 });

    // --- ATALHO DE DEV (ESC para Pular Intro) ---
    this.input.keyboard.once('keydown-ESC', () => {
      this.iniciarTransicaoStart();
    });
  }

  iniciarTransicaoStart() {
    if (this.transicaoStartAtiva) return;
    this.transicaoStartAtiva = true;
    this.podeAssinar = false;
    this.cursorTimer?.destroy();

    this.musicaFundo?.destroy();
    this.musicaFundo = null;

    const largura = this.scale.width;
    const altura = this.scale.height;
    const alfabeto = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト";
    const objetosAntigos = this.children.list.slice();
    objetosAntigos.forEach((objeto) => objeto.setDepth?.(0));
    const painelPreto = this.add.rectangle(0, -altura, largura + 8, altura + 8, 0x000000)
      .setOrigin(0, 0)
      .setPosition(-4, -altura - 4)
      .setScrollFactor(0)
      .setDepth(10000);
    const cortina = this.add.container(0, 0).setDepth(10001);
    const faixasPretas = [];
    const larguraColuna = 34;

    for (let x = larguraColuna / 2; x < largura; x += larguraColuna) {
      const quantidade = Phaser.Math.Between(10, 23);
      let texto = "";
      for (let i = 0; i < quantidade; i += 1) {
        texto += alfabeto.charAt(Phaser.Math.Between(0, alfabeto.length - 1));
        if (i < quantidade - 1) texto += "\n";
      }
      const coluna = this.add.text(x, Phaser.Math.Between(-altura * 1.35, -altura * 0.55), texto, {
        fontFamily: "monospace",
        fontSize: `${Phaser.Math.Between(20, 30)}px`,
        color: Phaser.Math.Between(0, 4) === 0 ? "#caffdc" : "#35ff82",
        lineSpacing: Phaser.Math.Between(1, 5),
      }).setOrigin(0.5, 0).setAlpha(Phaser.Math.FloatBetween(0.58, 0.95));
      cortina.add(coluna);
      this.tweens.add({
        targets: coluna,
        y: altura * Phaser.Math.FloatBetween(1.05, 1.45),
        duration: Phaser.Math.Between(2400, 3100),
        ease: "Linear",
      });
      faixasPretas.push(
        this.add.rectangle(x - larguraColuna / 2, -altura, larguraColuna + 2, altura, 0x000000)
          .setOrigin(0, 0)
          .setDepth(10000)
      );
    }

    // A chuva atravessa a tela enquanto todo o preload é fisicamente empurrado.
    this.time.delayedCall(1050, () => {
      faixasPretas.forEach((faixa) => {
        this.tweens.add({
          targets: faixa,
          y: 0,
          delay: Phaser.Math.Between(0, 260),
          duration: Phaser.Math.Between(1250, 1550),
          ease: "Sine.easeInOut",
        });
      });

      // O painel contínuo vem logo atrás das pontas irregulares da chuva.
      this.tweens.add({
        targets: painelPreto,
        y: -4,
        duration: 1500,
        ease: "Sine.easeInOut",
        onComplete: () => {
          objetosAntigos.forEach((objeto) => objeto.setVisible?.(false));
          this.time.delayedCall(700, () => {
            this.scene.start("CenaStart", { entradaPreload: true });
          });
        },
      });
    });

  }

  update() {
    if (!this.podeAssinar || this.assinando) return;

    // Checagem de Gamepad/Controle
    if (this.input.gamepad && this.input.gamepad.gamepads.length > 0) {
      const pad = this.input.gamepad.gamepads[0];
      if (pad && pad.connected) {
        const botaoControle = pad.buttons.some(b => b.pressed) || pad.axes.some(a => Math.abs(a.getValue()) > 0.5);
        if (botaoControle) this.processarAssinatura();
      }
    }
  }
}
