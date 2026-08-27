import Personagem from "./Personagem.js";

export default class Miku extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    Miku.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "miku_idle",
      "0",
      {
        velocidade: 280,
        forcaPulo: -600,
        maxPulos: 3,
        maxDash: 1,
        maxComboIndex: 3,
      },

      teclas,
      "miku_",
      controle,
    );
    //============================= hitboxes ========================================
    this.nomePersonagem = "Hatsune Miku";
    this.qtdTaunts = 1;
    this.configAnimacoes = {
      idle: {
        largura: 85,
        altura: 340,
        offsetX: 170,
        offsetY: 20,
        escala: 0.34,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 25, offsetY: -70 }, // Tronco/cabeça
          { largura: 110, altura: 35, offsetX: 5, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      walk: {
        largura: 200,
        altura: 340,
        offsetX: 190,
        offsetY: 12,
        escala: 0.34,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 0, offsetY: -70 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      jump: {
        largura: 85,
        altura: 340,
        offsetX: 200,
        offsetY: -5,
        escala: 0.34,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: 0, offsetY: -90 }, // Tronco/cabeça
          { largura: 60, altura: 50, offsetX: 0, offsetY: -25 }, // parte de baixo parecida
        ],
      },

      crouch: {
        largura: 85,
        altura: 170, // Metade da altura normal (340) para simular o agachado
        offsetX: 50,
        offsetY: 184, // Alinha a hitbox com a spritesheet de descida (354 px)
        escala: 0.34,
        hurtboxes: [
          { largura: 80, altura: 50, offsetX: 0, offsetY: -25 },
        ],
      },

      crouch2: {
        largura: 85,
        altura: 170,
        offsetX: 50,
        offsetY: 30,
        escala: 0.34,
        hurtboxes: [
          { largura: 80, altura: 50, offsetX: 0, offsetY: -25 },
        ],
      },
      

      //resto das hiboxes
   };

   //   this.sons = {
   //  ...this.sons,
   //  pulo: ['spy_pulo_1', 'spy_pulo_2'],
   //  dash: ['spy_web_dash'],
   //  wind: ['spy_whoosh_leve'],
   // light: ['spy_hit_light_1'],
   //  heavy: ['spy_hit_heavy_1']
   // };


  
    // ============================ tabela de golpes =====================================
    //this.golpes = {


  // --------------------------------- tabela especiais --------------------------
  //  this.specials = {
      
    
    //-------------------------- ult ------------------------------------
  
  
  }

  //animaçoes====================================================
  static criarAnimacoes(scene) {
    // Se a animação "idle" já existe na cena, não recria
    if (scene.anims.exists("miku_idle")) return;

    // Idle (Parada)
    scene.anims.create({
      key: "miku_idle",
      frames: scene.anims.generateFrameNumbers("Miku_idle", {
        start: 0,
        end: 13,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_walk",
      frames: scene.anims.generateFrameNumbers("Miku_walk", {
        start: 1,
        end: 10,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_jump",
      frames: scene.anims.generateFrameNumbers("Miku_jump", {
        start: 0,
        end: 1,
      }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_crouch",
      frames: scene.anims.generateFrameNumbers("Miku_crouch1", {
        start: 0,
        end: 2,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "miku_crouch2",
      frames: scene.anims.generateFrameNumbers("Miku_crouch2", {
        start: 0,
        end: 0,
      }),
      frameRate: 1,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_crouch3",
      frames: scene.anims.generateFrameNumbers("Miku_crouch3", {
        start: 0,
        end: 2,
      }),
      frameRate: 12,
      repeat: 0,
    });


    scene.anims.create({
      key: "miku_dash",
      frames: scene.anims.generateFrameNumbers("Miku_dash", {
        start: 0,
        end: 4,
      }),
      frameRate: 16,
      repeat: 0,
    });


    scene.anims.create({
      key: "miku_taunt1",
      frames: scene.anims.generateFrameNumbers("Miku_taunt1", {
        start: 0,
        end: 28,
      }),
      frameRate: 8,
      repeat: -1,
    });
  }
}
