export default class CenaPreload extends Phaser.Scene {
    constructor() {
        super({ key: 'CenaPreload' });
    }

    preload() {

        // ===== load char select =====
        this.load.image("Charmenu", "assets/Menus/Charmenu.png"); 
        this.load.image("FJmenu", "assets/Menus/FJmenu.png");
        this.load.image("Madomenu", "assets/Menus/Madomenu.png");
        this.load.image("Morrmenu", "assets/Menus/Morrmenu.png");
        this.load.image("Diomenu", "assets/Menus/Diomenu.png");
        this.load.image("Spidermenu", "assets/Menus/Spidermenu.png");

        // =================================== LOAD PERSONAGENS =================================================

         // ===== Mado =====
        this.load.spritesheet("Madotsuki", "assets/personagens/Madotsuki/Madotsuki.png", { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet("MadoAtack", "assets/personagens/Madotsuki/MadoAtack.png", { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet("MadoDano", "assets/personagens/Madotsuki/MadoDano.png", { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet("MadoMoreAtack", "assets/personagens/Madotsuki/MadoMoreAtack.png", { frameWidth: 32, frameHeight: 32 });
         // ===== Morr =====
        this.load.spritesheet("morrigan", "assets/personagens/morrigan/morrigan.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("MorriganDano", "assets/personagens/morrigan/MorriganDano.png", { frameWidth: 64, frameHeight: 64 });
        
         // ===== Frederick =====
         this.load.spritesheet("FJ_idle", "assets/personagens/FrederikJohnson/FJ_idle.png", { frameWidth: 64, frameHeight: 64 });
         this.load.spritesheet("FJ_hurt", "assets/personagens/FrederikJohnson/FJ_hurt.png", { frameWidth: 64, frameHeight: 64 });
         this.load.spritesheet("FJ_jump", "assets/personagens/FrederikJohnson/FJ_jump.png", { frameWidth: 64, frameHeight: 64 });
         this.load.spritesheet("FJ_roll", "assets/personagens/FrederikJohnson/FJ_roll.png", { frameWidth: 64, frameHeight: 64 });
         this.load.spritesheet("FJ_walk", "assets/personagens/FrederikJohnson/FJ_walk.png", { frameWidth: 64, frameHeight: 64 });
         this.load.spritesheet("FJ_punch1", "assets/personagens/FrederikJohnson/FJ_punch1.png", { frameWidth: 64, frameHeight: 64 });

           // ===== Dio =====
        this.load.spritesheet("Mantra_idle", "assets/personagens/Dio/Mantra_idle.png", { frameWidth: 72, frameHeight: 126 });
        this.load.spritesheet("Mantra_walk", "assets/personagens/Dio/Mantra_walk.png", { frameWidth: 96, frameHeight: 126 });
        this.load.spritesheet("Mantra_jump", "assets/personagens/Dio/Mantra_jump.png", { frameWidth: 96, frameHeight: 157 });
        this.load.spritesheet("Mantra_down", "assets/personagens/Dio/Mantra_down.png", { frameWidth: 96, frameHeight: 128 });
        this.load.spritesheet("Mantra_!down", "assets/personagens/Dio/Mantra_!down.png", { frameWidth: 96, frameHeight: 128 });
        this.load.spritesheet("Mantra_dash", "assets/personagens/Dio/Mantra_dash.png", { frameWidth: 130, frameHeight: 130 });
        this.load.spritesheet("Mantra_atack1", "assets/personagens/Dio/Mantra_atack1.png", { frameWidth: 290, frameHeight: 126 });
        this.load.spritesheet("Mantra_atack2", "assets/personagens/Dio/Mantra_atack2.png", { frameWidth: 200, frameHeight: 127 });
        this.load.spritesheet("TH30_hurt1", "assets/personagens/Dio/TH30_hurt1.png", { frameWidth: 98, frameHeight: 120 });
        this.load.spritesheet("TH30_atack4", "assets/personagens/Dio/TH30_atack4.png", { frameWidth: 200, frameHeight: 117 });

           // ===== Spider =====
        this.load.spritesheet("SpiderMan_idle", "assets/personagens/SpiderMan/SpiderMan_idle.png", { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet("SpiderMan_walk", "assets/personagens/SpiderMan/SpiderMan_walk.png", { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet("SpiderMan_jump", "assets/personagens/SpiderMan/SpiderMan_jump.png", { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet("SpiderMan_down", "assets/personagens/SpiderMan/SpiderMan_down.png", { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet("SpiderMan_dash2", "assets/personagens/SpiderMan/SpiderMan_dash2.png", { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet("SpiderMan_atack1", "assets/personagens/SpiderMan/SpiderMan_atack1.png", { frameWidth: 200, frameHeight: 200 },);
        this.load.spritesheet("SpiderMan_atack2", "assets/personagens/SpiderMan/SpiderMan_atack2.png", { frameWidth: 200, frameHeight: 200 },);
        this.load.spritesheet("SpiderMan_atack3", "assets/personagens/SpiderMan/SpiderMan_atack3.png", { frameWidth: 200, frameHeight: 200 },);
        this.load.spritesheet("SpiderMan_neutralAir", "assets/personagens/SpiderMan/SpiderMan_neutralAir.png", { frameWidth: 200, frameHeight: 200 },);
        this.load.spritesheet("SpiderMan_upAir", "assets/personagens/SpiderMan/SpiderMan_upAir.png", { frameWidth: 200, frameHeight: 200 },);
        this.load.spritesheet("SpiderMan_downAir", "assets/personagens/SpiderMan/SpiderMan_downAir.png", { frameWidth: 200, frameHeight: 200 },); 
        this.load.spritesheet("SpiderMan_sideAir", "assets/personagens/SpiderMan/SpiderMan_sideAir.png", { frameWidth: 200, frameHeight: 200 },);
        this.load.spritesheet("SpiderMan_downAtack", "assets/personagens/SpiderMan/SpiderMan_downAtack.png", { frameWidth: 200, frameHeight: 200 },);   
        this.load.spritesheet("SpiderMan_sideAtack", "assets/personagens/SpiderMan/SpiderMan_sideAtack.png", { frameWidth: 200, frameHeight: 200 },); 
        this.load.spritesheet("SpiderMan_downAtack", "assets/personagens/SpiderMan/SpiderMan_downAtack.png", { frameWidth: 200, frameHeight: 200 },); 

        

         // ===== Miku =====
        this.load.spritesheet("Miku_idle", "assets/personagens/Miku/Miku_idle.png", { frameWidth: 500, frameHeight: 500 });
        this.load.spritesheet("Miku_walk", "assets/personagens/Miku/Miku_walk.png", { frameWidth: 500, frameHeight: 500 });


        // ===== load cenario =====
        //this.load.spritesheet("fundo", "assets/cenarios/fundo.png", { frameWidth: 800, frameHeight: 400 });
        this.load.spritesheet("TVefect", "assets/efeitos/TVefect.png", { frameWidth: 800, frameHeight: 400 });
        this.load.audio("ClockTower", "assets/audio/ClockTower.mp3");
        this.load.audio("katarenai8bit", "assets/audio/katarenai8bit.mp3");
        this.load.audio("DiosAmendment", "assets/audio/DiosAmendment.mp3");

       // ===== load mapa cidadde =====
       // this.load.tilemapTiledJSON("cidade", "assets/cenarios/cidade.json");
       // this.load.image("back", "assets/cenarios/mapa1/back.png");
       // this.load.image("back-buildings", "assets/cenarios/mapa1/back-buildings.png");
       // this.load.image("buildings", "assets/cenarios/mapa1/buildings.png");
       // this.load.image("foreground", "assets/cenarios/mapa1/foreground.png");
       // this.load.image("foreground-empty", "assets/cenarios/mapa1/foreground-empty.png");
       // this.load.image("front", "assets/cenarios/mapa1/front.png");
       // this.load.image("middle", "assets/cenarios/mapa1/middle.png");
        this.load.image("cidade", "assets/cenarios/cidade.png");
    }

    create() {
        // Terminou de carregar, chama a cena do jogo!
        this.scene.start('Charmenu');
    }
}