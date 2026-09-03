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
    
    // --- preload ---
    this.load.audio("Aria8bit", "assets/Menus/Preload/Aria8bit.mp3");
    this.load.image("KatarenaiLogo", "assets/Menus/Preload/KatarenaiLogo.png");

    // --- MENUS ---
    // --- start ---
    this.load.image("Start_menu", "./assets/Menus/Start_menu/Start_menu.png");
    this.load.image("Start_VSbuton", "./assets/Menus/Start_menu/Start_VSbuton.png");
    this.load.image("Start_Storybuton", "./assets/Menus/Start_menu/Start_Storybuton.png");
    this.load.image("ReZero", "./assets/Menus/Game_Over/ReZero.png");
    // --- new start ---
    this.load.image("frontStart", "./assets/Menus/Start_menu/frontStart.png");
    this.load.image("backStart", "./assets/Menus/Start_menu/backStart.png");
    this.load.image("logo", "./assets/Menus/Start_menu/logo.png");
    this.load.spritesheet("glitch", "./assets/Menus/Start_menu/glitch.png", { frameWidth: 683, frameHeight: 365 });


    // --- charmenu ---
    this.load.image("Charmenu", "assets/Menus/Char_menu/Sprites/Charmenu.png");
    this.load.audio("katarenai8bit", "assets/Menus/Char_menu/Audio/katarenai8bit.mp3");
    // --- icons ---
    this.load.image("FJmenu", "assets/Menus/Char_menu/Sprites/FJmenu.png");
    this.load.image("Madomenu", "assets/Menus/Char_menu/Sprites/Madomenu.png");
    this.load.image("Spidermenu", "assets/Menus/Char_menu/Sprites/Spidermenu.png");
    this.load.image("Kenmenu", "assets/Menus/Char_menu/Sprites/Kenmenu.png");
    this.load.image("Kenmenu", "assets/Menus/Char_menu/Sprites/Kenmenu.png");
    this.load.image("Mikumenu", "assets/Menus/Char_menu/Sprites/Mikumenu.png");

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
    this.load.spritesheet("SpiderMan_dead", "assets/personagens/SpiderMan/Sprites/SpiderMan_dead.png", { frameWidth: 155, frameHeight: 52 });
    this.load.spritesheet("SpiderMan_getup", "assets/personagens/SpiderMan/Sprites/SpiderMan_getup.png", { frameWidth: 145, frameHeight: 96 });
    this.load.spritesheet("SpiderMan_guard", "assets/personagens/SpiderMan/Sprites/SpiderMan_guard.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_taunt1", "assets/personagens/SpiderMan/Sprites/SpiderMan_taunt1.png", { frameWidth: 200, frameHeight: 200 });

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
    //specials
    this.load.spritesheet("SpiderMan_neSpecial", "assets/personagens/SpiderMan/Sprites/SpiderMan_neSpecial.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_AneSpecial", "assets/personagens/SpiderMan/Sprites/SpiderMan_AneSpecial.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_doSpecial", "assets/personagens/SpiderMan/Sprites/SpiderMan_doSpecial.png", { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet("Counter", "assets/personagens/SpiderMan/Sprites/Counter.png", { frameWidth: 500, frameHeight: 200 });
    this.load.spritesheet("SpiderMan_siSpecial", "assets/personagens/SpiderMan/Sprites/SpiderMan_siSpecial.png", { frameWidth: 154, frameHeight: 94 });
    this.load.spritesheet("Side_teia", "assets/personagens/SpiderMan/Sprites/Side_teia.png", { frameWidth: 320, frameHeight: 79 });
    this.load.spritesheet("Spider_throw", "assets/personagens/SpiderMan/Sprites/Spider_throw.png", { frameWidth: 640, frameHeight: 140 });
    this.load.spritesheet("SpiderMan_AsiSpecial", "assets/personagens/SpiderMan/Sprites/SpiderMan_AsiSpecial.png", { frameWidth: 245, frameHeight: 202 });
    this.load.spritesheet("Spiderflip", "assets/personagens/SpiderMan/Sprites/Spiderflip.png", { frameWidth: 105, frameHeight: 117 });  
    this.load.spritesheet("Sp_AupSpecial", "assets/personagens/SpiderMan/Sprites/Sp_AupSpecial.png", { frameWidth: 106, frameHeight: 116 });
    this.load.spritesheet("teiagrow", "assets/personagens/SpiderMan/Sprites/teiagrow.png", { frameWidth: 209, frameHeight: 10 });
    this.load.spritesheet("extragrow", "assets/personagens/SpiderMan/Sprites/growextra.png", { frameWidth: 209, frameHeight: 10 });
    this.load.spritesheet("teiabroke", "assets/personagens/SpiderMan/Sprites/teiabroke.png", { frameWidth: 174, frameHeight: 34 });


//ult
this.load.spritesheet("ultimateback", "assets/personagens/SpiderMan/Sprites/ultimate/ultimatebackground.png", { frameWidth: 640, frameHeight: 480 });
this.load.audio("sp_ShowTime", "assets/personagens/SpiderMan/Audio/sp_ShowTime.wav");
this.load.spritesheet("SpiderMan_ult0", "assets/personagens/SpiderMan/Sprites/ultimate/SpiderMan_ult0.png", { frameWidth: 200, frameHeight: 200 }); 
this.load.spritesheet("SpiderMan_ult1", "assets/personagens/SpiderMan/Sprites/ultimate/SpiderMan_ult1.png", { frameWidth: 500, frameHeight: 200 }); 
this.load.spritesheet("SpiderMan_ult2", "assets/personagens/SpiderMan/Sprites/ultimate/SpiderMan_ult2.png", { frameWidth: 500, frameHeight: 200 }); 
this.load.spritesheet("SpiderMan_ult3", "assets/personagens/SpiderMan/Sprites/ultimate/SpiderMan_ult3.png", { frameWidth: 500, frameHeight: 200 }); 
this.load.spritesheet("SpiderMan_ult4", "assets/personagens/SpiderMan/Sprites/ultimate/SpiderMan_ult4.png", { frameWidth: 500, frameHeight: 200 });
this.load.spritesheet("SpiderMan_ult5", "assets/personagens/SpiderMan/Sprites/ultimate/SpiderMan_ult5.png", { frameWidth: 131, frameHeight: 121 });
this.load.spritesheet("SpiderMan_ult6", "assets/personagens/SpiderMan/Sprites/ultimate/SpiderMan_ult6.png", { frameWidth: 315, frameHeight: 245 });
this.load.spritesheet("SpiderMan_ult7", "assets/personagens/SpiderMan/Sprites/ultimate/SpiderMan_ult7.png", { frameWidth: 360, frameHeight: 256 });
this.load.spritesheet("SpiderMan_ult8", "assets/personagens/SpiderMan/Sprites/ultimate/SpiderMan_ult8.png", { frameWidth: 122, frameHeight: 119 });
this.load.audio("finish", "assets/personagens/SpiderMan/Audio/finish.wav");  

    if (!this.textures.exists('textura_teia')) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Corpo principal da teia
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 0, 4, 32);

    // Bordas e textura dos nós
    ctx.fillStyle = '#80deea';
    ctx.fillRect(4, 0, 2, 32);
    ctx.fillRect(10, 0, 2, 32);

    // Nós trançados
    ctx.fillStyle = '#e0f7fa';
    ctx.fillRect(2, 6, 12, 4);
    ctx.fillRect(2, 22, 12, 4);

    this.textures.addCanvas('textura_teia', canvas);
  }

    // spy_effects
    this.load.spritesheet("webshot", "assets/personagens/SpiderMan/Sprites/webshot.png", { frameWidth: 200, frameHeight: 200 });
    // --- Miku ---
    //base
    this.load.spritesheet("Miku_idle", "assets/personagens/Miku/Sprites/Miku_idle.png", { frameWidth: 334, frameHeight: 360 });
    this.load.spritesheet("Miku_walk", "assets/personagens/Miku/Sprites/Miku_walk.png", { frameWidth: 467, frameHeight: 357 });
    this.load.spritesheet("Miku_jump", "assets/personagens/Miku/Sprites/Miku_jump.png", { frameWidth: 490, frameHeight: 342 });
    this.load.spritesheet("Miku_dash", "assets/personagens/Miku/Sprites/Miku_dash.png", { frameWidth: 188, frameHeight: 358 });
    this.load.spritesheet("Miku_crouch1", "assets/personagens/Miku/Sprites/Miku_crouch1.png", { frameWidth: 188, frameHeight: 354 });
    this.load.spritesheet("Miku_crouch2", "assets/personagens/Miku/Sprites/Miku_crouch2.png", { frameWidth: 180, frameHeight: 200 });
    this.load.spritesheet("Miku_crouch3", "assets/personagens/Miku/Sprites/Miku_crouch3.png", { frameWidth: 188, frameHeight: 354 });
    this.load.spritesheet("Miku_guard", "assets/personagens/Miku/Sprites/Miku_guard.png", { frameWidth: 166, frameHeight: 335 });
    this.load.spritesheet("Miku_taunt1", "assets/personagens/Miku/Sprites/Miku_taunt1.png", { frameWidth: 304, frameHeight: 374 });
    this.load.spritesheet("Miku_hurt1", "assets/personagens/Miku/Sprites/Miku_hurt1.png", { frameWidth: 270, frameHeight: 351 });
    this.load.spritesheet("Miku_hurtUp", "assets/personagens/Miku/Sprites/Miku_hurtUp.png", { frameWidth: 270, frameHeight: 348 });
    this.load.spritesheet("Miku_hurtSide", "assets/personagens/Miku/Sprites/Miku_hurtSide.png", { frameWidth: 334, frameHeight: 351 });
    this.load.spritesheet("Miku_hurtDown", "assets/personagens/Miku/Sprites/Miku_hurtDown.png", { frameWidth: 274, frameHeight: 336 });
    this.load.spritesheet("Miku_dead", "assets/personagens/Miku/Sprites/Miku_dead.png", { frameWidth: 360, frameHeight: 130 });
    //ataque
    this.load.spritesheet("Miku_neutro1", "assets/personagens/Miku/Sprites/Miku_neutro1.png", { frameWidth: 203, frameHeight: 348 });
    this.load.spritesheet("Miku_neutro2", "assets/personagens/Miku/Sprites/Miku_neutro2.png", { frameWidth: 244, frameHeight: 356 });
    this.load.spritesheet("Miku_neutro3", "assets/personagens/Miku/Sprites/Miku_neutro3.png", { frameWidth: 360, frameHeight: 356 });
    this.load.spritesheet("Miku_spin", "assets/personagens/Miku/Sprites/Miku_spin.png", { frameWidth: 512, frameHeight: 370 });
    this.load.spritesheet("Miku_upAtack", "assets/personagens/Miku/Sprites/Miku_upAtack.png", { frameWidth: 393, frameHeight: 424 });
    this.load.spritesheet("Miku_airplosion", "assets/personagens/Miku/Sprites/Miku_airplosion.png", { frameWidth: 490, frameHeight: 342 });
    this.load.spritesheet("Miku_downAtack", "assets/personagens/Miku/Sprites/Miku_downAtack.png", { frameWidth: 390, frameHeight: 381 });
    this.load.spritesheet("Miku_megasing", "assets/personagens/Miku/Sprites/Miku_megasing.png", { frameWidth: 423, frameHeight: 364 });
    this.load.spritesheet("Miku_sing1", "assets/personagens/Miku/Sprites/Miku_sing1.png", { frameWidth: 274, frameHeight: 376 });
    this.load.spritesheet("Miku_sing2", "assets/personagens/Miku/Sprites/Miku_sing2.png", { frameWidth: 308, frameHeight: 382 });
    this.load.spritesheet("Miku_effects", "assets/personagens/Miku/Sprites/Miku_effects.png", { frameWidth: 400, frameHeight: 400 });
    this.load.spritesheet("Miku_spine", "assets/personagens/Miku/Sprites/Miku_spine.png", { frameWidth: 192, frameHeight: 94 });
    this.load.spritesheet("Miku_puppet", "assets/personagens/Miku/Sprites/Miku_puppet.png", { frameWidth: 166, frameHeight: 145 });
    this.load.audio("sek", "assets/personagens/Miku/Audio/sek.wav");
    this.load.audio("e", "assets/personagens/Miku/Audio/e.wav");
    this.load.audio("kai", "assets/personagens/Miku/Audio/kai.wav");
    this.load.audio("RollingGirl", "assets/personagens/Miku/Audio/RollingGirl.wav");
    this.load.audio("soree", "assets/personagens/Miku/Audio/soree.wav");
    this.load.audio("yata", "assets/personagens/Miku/Audio/yata.wav");
    this.load.audio("SnowMix", "assets/personagens/Miku/Audio/SnowMix.wav");


    
    // --- Ken ---
    //base
    this.load.spritesheet("Ken_idle", "assets/personagens/Ken/Sprites/Ken_idle.png", { frameWidth: 78, frameHeight: 111 });
    this.load.spritesheet("Ken_jump", "assets/personagens/Ken/Sprites/Ken_jump.png", { frameWidth: 77, frameHeight: 131 });
    this.load.spritesheet("Ken_walk", "assets/personagens/Ken/Sprites/Ken_walk.png", { frameWidth: 112, frameHeight: 112 });
    this.load.spritesheet("Ken_crouch", "assets/personagens/Ken/Sprites/Ken_crouch.png", { frameWidth: 88, frameHeight: 111 });
    this.load.spritesheet("Ken_crouch3", "assets/personagens/Ken/Sprites/Ken_crouch3.png", { frameWidth: 88, frameHeight: 111 });
    this.load.spritesheet("Ken_dash", "assets/personagens/Ken/Sprites/Ken_dash.png", { frameWidth: 74, frameHeight: 74 });
    this.load.spritesheet("Ken_guard", "assets/personagens/Ken/Sprites/Ken_guard.png", { frameWidth: 78, frameHeight: 105 });
    this.load.spritesheet("Ken_hurt", "assets/personagens/Ken/Sprites/Ken_hurt.png", { frameWidth: 76, frameHeight: 96 });
    this.load.spritesheet("Ken_hurts1", "assets/personagens/Ken/Sprites/Ken_hurts1.png", { frameWidth: 138, frameHeight: 111 });
    this.load.spritesheet("Ken_hurts2", "assets/personagens/Ken/Sprites/Ken_hurts2.png", { frameWidth: 140, frameHeight: 138 });
    this.load.spritesheet("Ken_dead", "assets/personagens/Ken/Sprites/Ken_dead.png", { frameWidth: 177, frameHeight: 76 });
    this.load.spritesheet("Ken_getup", "assets/personagens/Ken/Sprites/Ken_getup.png", { frameWidth: 137, frameHeight: 105 });
    //golpes
    this.load.spritesheet("Ken_combo1", "assets/personagens/Ken/Sprites/Ken_combo1.png", { frameWidth: 160, frameHeight: 111 });
    this.load.spritesheet("Ken_combo2", "assets/personagens/Ken/Sprites/Ken_combo2.png", { frameWidth: 200, frameHeight: 111 });
    this.load.spritesheet("Ken_combo3", "assets/personagens/Ken/Sprites/Ken_combo3.png", { frameWidth: 218, frameHeight: 121 });
    this.load.spritesheet("Ken_sideAtack", "assets/personagens/Ken/Sprites/Ken_sideAtack.png", { frameWidth: 183, frameHeight: 121 });
    this.load.spritesheet("Ken_downAtack", "assets/personagens/Ken/Sprites/Ken_downAtack.png", { frameWidth: 153, frameHeight: 73 });
    this.load.spritesheet("Ken_neutralAir", "assets/personagens/Ken/Sprites/Ken_neutralAir.png", { frameWidth: 131, frameHeight: 116 });
    this.load.spritesheet("Ken_upAir", "assets/personagens/Ken/Sprites/Ken_upAir.png", { frameWidth: 126, frameHeight: 116 });
    this.load.spritesheet("Ken_downAir", "assets/personagens/Ken/Sprites/Ken_downAir.png", { frameWidth: 107, frameHeight: 135 });
    this.load.spritesheet("Ken_sideAir", "assets/personagens/Ken/Sprites/Ken_sideAir.png", { frameWidth: 134, frameHeight: 110 });
    //specials
    this.load.spritesheet("Ken_neSpecial", "assets/personagens/Ken/Sprites/Ken_neSpecial.png", { frameWidth: 135, frameHeight: 108 });
    this.load.spritesheet("hadouken1", "assets/personagens/Ken/Sprites/hadouken1.png", { frameWidth: 88, frameHeight: 54 });
    this.load.spritesheet("hadouken2", "assets/personagens/Ken/Sprites/hadouken2.png", { frameWidth: 60, frameHeight: 63 });
    this.load.audio("hadouken", "assets/personagens/Ken/Audio/hadouken.wav");
    this.load.spritesheet("Ken_siSpecial", "assets/personagens/Ken/Sprites/Ken_siSpecial.png", { frameWidth: 159, frameHeight: 119 });
    this.load.audio("tatsumaki", "assets/personagens/Ken/Audio/tatsumaki.wav");
    this.load.spritesheet("Ken_doSpecial", "assets/personagens/Ken/Sprites/Ken_doSpecial.png", { frameWidth: 100, frameHeight: 164 });
    this.load.spritesheet("flames", "assets/personagens/Ken/Sprites/flames.png", { frameWidth: 154, frameHeight: 172 });
    this.load.audio("shoryuken", "assets/personagens/Ken/Audio/shoryuken.wav");
    this.load.spritesheet("Ken_AneSpecial", "assets/personagens/Ken/Sprites/Ken_AneSpecial.png", { frameWidth: 146, frameHeight: 113 });
    this.load.spritesheet("Ken_AsiSpecial", "assets/personagens/Ken/Sprites/Ken_AsiSpecial.png", { frameWidth: 159, frameHeight: 124 });
    this.load.spritesheet("Ken_AdoSpecial", "assets/personagens/Ken/Sprites/Ken_AdoSpecial.png", { frameWidth: 166, frameHeight: 132 });
  


    
    //--Sound effects
    //-pulos
    this.load.audio("jump1", "assets/personagens/SoundEffects_geral/dash-jump/jump/jump1.wav");
    //-pouso
    this.load.audio("generic-landing1", "assets/personagens/SoundEffects_geral/step/generic-landing1.wav");
    this.load.audio("generic-landing2", "assets/personagens/SoundEffects_geral/step/generic-landing2.wav");

    //-passo
    this.load.audio("genericstep1", "assets/personagens/SoundEffects_geral/step/genericstep1.wav");
    this.load.audio("genericstep2", "assets/personagens/SoundEffects_geral/step/genericstep2.wav");
    this.load.audio("genericstep3", "assets/personagens/SoundEffects_geral/step/genericstep3.wav");
    this.load.audio("genericstep4", "assets/personagens/SoundEffects_geral/step/genericstep4.wav");
    this.load.audio("genericstep5", "assets/personagens/SoundEffects_geral/step/genericstep5.wav");
    this.load.audio("genericstep6", "assets/personagens/SoundEffects_geral/step/genericstep6.wav");
    this.load.audio("genericstep7", "assets/personagens/SoundEffects_geral/step/genericstep7.wav");
    this.load.audio("genericstep8", "assets/personagens/SoundEffects_geral/step/genericstep8.wav");
    this.load.audio("genericstep9", "assets/personagens/SoundEffects_geral/step/genericstep9.wav");

    //-dash
    this.load.audio("dash1", "assets/personagens/SoundEffects_geral/dash-jump/dash/dash1.wav");
    this.load.audio("dash2", "assets/personagens/SoundEffects_geral/dash-jump/dash/dash2.wav");

    //-wind
    this.load.audio("punch12", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch12.wav");

    //-light
    this.load.audio("punch1", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch1.wav");
    this.load.audio("punch2", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch2.wav");
    this.load.audio("punch3", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch3.wav");
    this.load.audio("punch4", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch4.wav");
    this.load.audio("punch5", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch5.wav");
    this.load.audio("punch6", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch6.wav");
    this.load.audio("punch7", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch7.wav");
    this.load.audio("punch8", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch8.wav");
    this.load.audio("punch9", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch9.wav");
    this.load.audio("punch17", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch17.wav");
    this.load.audio("punch18", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch18.wav");
    this.load.audio("punch19", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch19.wav");
    this.load.audio("punch22", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch22.wav");
    this.load.audio("punch23", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch23.wav");

    //-heavy
    this.load.audio("punch10", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch10.wav");
    this.load.audio("punch11", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch11.wav");
    this.load.audio("punch13", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch13.wav");
    this.load.audio("punch14", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch14.wav");
    this.load.audio("punch15", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch15.wav");
    this.load.audio("punch16", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch16.wav");
    this.load.audio("punch20", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch20.wav");
    this.load.audio("punch21", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch21.wav");
    this.load.audio("punch24", "assets/personagens/SoundEffects_geral/punch-block/normal-punch/punch24.wav");


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
    // test
    this.load.spritesheet("backtest", "assets/cenarios/MapaTest/backtest.png", { frameWidth: 1200, frameHeight: 600 });
    this.load.audio("No_More", "assets/cenarios/MapaTest/No_More.mp3");
    this.load.image("thumb_teste", "assets/cenarios/MapaTest/thumb_teste.png");



    // --- AUDIOS ---
    //--OST
    this.load.audio("DiosAmendment", "assets/cenarios/DiosAmendment.mp3");


    
    
    // --- EFEITOS ---
     this.load.spritesheet("TVefect", "assets/efeitos/TVefect.png", { frameWidth: 800, frameHeight: 400 });
     this.load.spritesheet("punch_effect", "assets/efeitos/atack_effects/punch_effect.png", { frameWidth: 109, frameHeight: 107, });
     this.load.spritesheet("punch_effect2", "assets/efeitos/atack_effects/punch_effect2.png", { frameWidth: 200, frameHeight: 250, });
     this.load.spritesheet("punch_effect3", "assets/efeitos/atack_effects/punch_effect3.png", { frameWidth: 200, frameHeight: 250, });


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

            this.iniciarTransicaoStart();
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
      this.iniciarTransicaoStart();
    });
  }

  iniciarTransicaoStart() {
    if (this.transicaoStartAtiva) return;
    this.transicaoStartAtiva = true;
    this.podeAssinar = false;
    this.cursorTimer?.destroy();

    if (this.musicaFundo) this.musicaFundo.stop();
    else this.sound.stopAll();

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
