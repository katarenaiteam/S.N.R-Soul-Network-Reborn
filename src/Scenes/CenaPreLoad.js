export default class CenaPreload extends Phaser.Scene {
  constructor() {
    super({ key: "CenaPreload" });
  }

  preload() {
    this.cameras.main.setBackgroundColor("#000000");

    const margemX = 240;
    const margemY = 120;
    const larguraBarra = 1920 - margemX * 2;
    const footerY = 940;

    const textStyle = { fontFamily: "RetroFont, monospace", fontSize: "28px", fill: "#00ff00" };
    const footerTextStyle = { fontFamily: "RetroFont, monospace", fontSize: "22px", fill: "#000000", fontStyle: "bold" };

    // --- RODAPÉ ---
    this.add.rectangle(margemX, footerY, larguraBarra, 45, 0x00ff00).setOrigin(0, 0);

    // Espera a fonte RetroFont carregar no navegador
    document.fonts.ready.then(() => {
      // --- CABEÇALHO ---
      this.add.text(margemX, margemY, "RomSNR HBIOS v3.5.1, 4154-06-07", textStyle);
      this.add.text(margemX, margemY + 40, "Soul Network Computer [RCZ80_msx2] Z80 @ 3.579MHz", textStyle);
      this.add.text(margemX, margemY + 70, "0 MEM W/S, 1 I/O W/S, INT MODE 1, MSX MMU", textStyle);
      this.add.text(margemX, margemY + 100, "0KB ROM, 448KB RAM, HEAP=0x321A\n", textStyle);

      // --- LOG DE CARREGAMENTO ---
      this.logText = this.add.text(margemX, margemY + 170, "IDE0: LOADING GAME ASSETS...\n", textStyle);

      // --- TEXTOS DO RODAPÉ ---
      this.footerStatus = this.add.text(margemX + 20, footerY + 10, "CTRL-A Z for help | 115200 8N1 | NOR | Minicom 6.7 | VT102 | Offline", footerTextStyle);
      this.footerProgress = this.add.text(margemX + larguraBarra - 160, footerY + 10, "BOOT: 0%", footerTextStyle);
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

    // --- MENUS ---
    // --- start ---
    this.load.image("KatarenaiLogo", "assets/Menus/Preload/KatarenaiLogo.png");
    this.load.image("Start_menu", "./assets/Menus/Start_menu/Start_menu.png");
    this.load.image("Start_VSbuton", "./assets/Menus/Start_menu/Start_VSbuton.png");
    this.load.image("Start_Storybuton", "./assets/Menus/Start_menu/Start_Storybuton.png");
    this.load.image("ReZero", "./assets/Menus/Game_Over/ReZero.png");
    // --- charmenu ---
    this.load.image("Charmenu", "assets/Menus/Char_menu/Sprites/Charmenu.png");
    this.load.audio("katarenai8bit", "assets/Menus/Char_menu/Audio/katarenai8bit.mp3");
    // --- icons ---
    this.load.image("FJmenu", "assets/Menus/Char_menu/Sprites/FJmenu.png");
    this.load.image("Madomenu", "assets/Menus/Char_menu/Sprites/Madomenu.png");
    this.load.image("Morrmenu", "assets/Menus/Char_menu/Sprites/Morrmenu.png");
    this.load.image("Diomenu", "assets/Menus/Char_menu/Sprites/Diomenu.png");
    this.load.image("Spidermenu", "assets/Menus/Char_menu/Sprites/Spidermenu.png");

    // --- PERSONAGENS ---
    // --- Madotsuki ---
    this.load.spritesheet("Madotsuki", "assets/personagens/Madotsuki/Sprites/Madotsuki.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("MadoAtack", "assets/personagens/Madotsuki/Sprites/MadoAtack.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("MadoDano", "assets/personagens/Madotsuki/Sprites/MadoDano.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("MadoMoreAtack", "assets/personagens/Madotsuki/Sprites/MadoMoreAtack.png", { frameWidth: 32, frameHeight: 32 });
    // --- Morrigan ---
    this.load.spritesheet("morrigan", "assets/personagens/morrigan/Sprites/morrigan.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("MorriganDano", "assets/personagens/morrigan/Sprites/MorriganDano.png", { frameWidth: 64, frameHeight: 64 });
    // --- Frederick Johnson ---
    this.load.spritesheet("FJ_idle", "assets/personagens/FrederikJohnson/Sprites/FJ_idle.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("FJ_hurt", "assets/personagens/FrederikJohnson/Sprites/FJ_hurt.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("FJ_jump", "assets/personagens/FrederikJohnson/Sprites/FJ_jump.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("FJ_roll", "assets/personagens/FrederikJohnson/Sprites/FJ_roll.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("FJ_walk", "assets/personagens/FrederikJohnson/Sprites/FJ_walk.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("FJ_punch1", "assets/personagens/FrederikJohnson/Sprites/FJ_punch1.png", { frameWidth: 64, frameHeight: 64 });
    // --- TH30 ---
    this.load.spritesheet("Mantra_idle", "assets/personagens/Dio/Sprites/Mantra_idle.png", { frameWidth: 72, frameHeight: 126 });
    this.load.spritesheet("Mantra_walk", "assets/personagens/Dio/Sprites/Mantra_walk.png", { frameWidth: 96, frameHeight: 126 });
    this.load.spritesheet("Mantra_jump", "assets/personagens/Dio/Sprites/Mantra_jump.png", { frameWidth: 96, frameHeight: 157 });
    this.load.spritesheet("Mantra_down", "assets/personagens/Dio/Sprites/Mantra_down.png", { frameWidth: 96, frameHeight: 128 });
    this.load.spritesheet("Mantra_!down", "assets/personagens/Dio/Sprites/Mantra_!down.png", { frameWidth: 96, frameHeight: 128 });
    this.load.spritesheet("Mantra_dash", "assets/personagens/Dio/Sprites/Mantra_dash.png", { frameWidth: 130, frameHeight: 130 });
    this.load.spritesheet("Mantra_atack1", "assets/personagens/Dio/Sprites/Mantra_atack1.png", { frameWidth: 290, frameHeight: 126 });
    this.load.spritesheet("Mantra_atack2", "assets/personagens/Dio/Sprites/Mantra_atack2.png", { frameWidth: 200, frameHeight: 127 });
    this.load.spritesheet("TH30_hurt1", "assets/personagens/Dio/Sprites/TH30_hurt1.png", { frameWidth: 98, frameHeight: 120 });
    this.load.spritesheet("TH30_atack4", "assets/personagens/Dio/Sprites/TH30_atack4.png", { frameWidth: 200, frameHeight: 117 });
    // --- Homem Aranha ---
    //base
    this.load.spritesheet("SpiderMan_idle", "assets/personagens/SpiderMan/Sprites/SpiderMan_idle.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_walk", "assets/personagens/SpiderMan/Sprites/SpiderMan_walk.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_jump", "assets/personagens/SpiderMan/Sprites/SpiderMan_jump.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_down", "assets/personagens/SpiderMan/Sprites/SpiderMan_down.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_dash2", "assets/personagens/SpiderMan/Sprites/SpiderMan_dash2.png", { frameWidth: 200, frameHeight: 200 });
this.load.spritesheet("SpiderMan_hurt", "assets/personagens/SpiderMan/Sprites/SpiderMan_hurt.png", { frameWidth: 200, frameHeight: 200 });
this.load.spritesheet("SpiderMan_hurts", "assets/personagens/SpiderMan/Sprites/SpiderMan_hurts.png", { frameWidth: 200, frameHeight: 200 });
this.load.spritesheet("SpiderMan_guard", "assets/personagens/SpiderMan/Sprites/SpiderMan_guard.png", { frameWidth: 200, frameHeight: 200 });
    //ataques
    this.load.spritesheet("SpiderMan_atack1", "assets/personagens/SpiderMan/Sprites/SpiderMan_atack1.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_atack2", "assets/personagens/SpiderMan/Sprites/SpiderMan_atack2.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_atack3", "assets/personagens/SpiderMan/Sprites/SpiderMan_atack3.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_neutralAir", "assets/personagens/SpiderMan/Sprites/SpiderMan_neutralAir.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_upAir", "assets/personagens/SpiderMan/Sprites/SpiderMan_upAir.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_downAir", "assets/personagens/SpiderMan/Sprites/SpiderMan_downAir.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_sideAir", "assets/personagens/SpiderMan/Sprites/SpiderMan_sideAir.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_downAtack", "assets/personagens/SpiderMan/Sprites/SpiderMan_downAtack.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_sideAtack", "assets/personagens/SpiderMan/Sprites/SpiderMan_sideAtack.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_neSpecial", "assets/personagens/SpiderMan/Sprites/SpiderMan_neSpecial.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_AneSpecial", "assets/personagens/SpiderMan/Sprites/SpiderMan_AneSpecial.png", { frameWidth: 200, frameHeight: 200 });
     this.load.spritesheet("SpiderMan_doSpecial", "assets/personagens/SpiderMan/Sprites/SpiderMan_doSpecial.png", { frameWidth: 200, frameHeight: 200 });
      this.load.spritesheet("Counter", "assets/personagens/SpiderMan/Sprites/Counter.png", { frameWidth: 200, frameHeight: 200 });
    
    // spy_effects
    this.load.spritesheet("webshot", "assets/personagens/SpiderMan/Sprites/webshot.png", { frameWidth: 200, frameHeight: 200 });
    // --- Miku ---
    this.load.spritesheet("Miku_idle", "assets/personagens/Miku/Sprites/Miku_idle.png", { frameWidth: 500, frameHeight: 500 });
    this.load.spritesheet("Miku_walk", "assets/personagens/Miku/Sprites/Miku_walk.png", { frameWidth: 500, frameHeight: 500 });

    // --- MAPAS ---
    
    // ---Skytowers
    this.load.spritesheet("525", "assets/cenarios/MapaSkytowers/Sprites/525.png", { frameWidth: 6000, frameHeight: 3000 });
    this.load.image("plat525", "assets/cenarios/MapaSkytowers/Sprites/plat525.png");
    this.load.image("thumb_skytowers", "assets/cenarios/MapaSkytowers/Sprites/thumb_skytowers.png");
    this.load.audio("Gathers_Under_Night", "assets/cenarios/MapaSkytowers/Ost/Gathers_Under_Night.mp3");
    // --- Cidade ---
    this.load.spritesheet("cidade", "assets/cenarios/MapaCidade/Sprites/cidade.png", { frameWidth: 960, frameHeight: 320 });
    this.load.audio("ClockTower", "assets/cenarios/MapaCidade/Ost/ClockTower.mp3");
    this.load.image("thumb_cidade", "assets/cenarios/MapaCidade/Sprites/thumb_cidade.png");
    // --- AUDIOS ---
   
    this.load.audio("Aria8bit", "assets/Menus/Preload/Aria8bit.mp3");
    this.load.audio("DiosAmendment", "assets/cenarios/DiosAmendment.mp3");

    // --- EFEITOS ---
     this.load.spritesheet("TVefect", "assets/efeitos/TVefect.png", { frameWidth: 800, frameHeight: 400 });
  }

  iniciarSequenciaLogo() {
    const margemX = 240; 
    const margemY = 120;

    if (this.logText) this.logText.setText('');

    const contratoTexto = 
      "SOUL NETWORK OS - SYSTEM INITIALIZATION CONTRACT\n\n" +
      "LICENSE AGREEMENT: AUTHORIZED PERSONNEL ONLY.\n" +
      "ALL CONNECTIONS ARE MONITORED AND LOGGED.\n" +
      "UNAUTHORIZED ACCESS WILL RESULT IN SYSTEM PURGE.\n\n" +
      "ESTABLISHING SECURE PROTOCOL... OK\n" +
      "INITIALIZING KATARENAI TEAM FRAMEWORK...";

    const textoContratoObj = this.add.text(margemX, margemY + 180, contratoTexto, {
      fontFamily: 'RetroFont, monospace', fontSize: '28px', fill: '#00ff00', lineSpacing: 6
    });

    this.time.delayedCall(3000, () => {
      textoContratoObj.destroy();

      const logo = this.add.image(1920 / 2, (1080 / 2) - 20, 'KatarenaiLogo').setOrigin(0.5, 0.5).setAlpha(0);

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

                this.mensagemObj = this.add.text(margemX, margemY + 180, '', {
                  fontFamily: 'RetroFont, monospace', fontSize: '26px', fill: '#00ff00', align: 'left', lineSpacing: 8
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

            this.scene.start('CenaStart');
          });
        }
      }
    });
  }
  create() {
    this.musicaFundo = this.sound.add('Aria8bit', { volume: 0.5, loop: true });
    this.musicaFundo.play();

    // --- ATALHO DE DEV (ESC para Pular Intro) ---
    this.input.keyboard.once('keydown-ESC', () => {
      if (this.musicaFundo) this.musicaFundo.stop();
      this.sound.stopAll();
      this.scene.start('CenaStart');
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