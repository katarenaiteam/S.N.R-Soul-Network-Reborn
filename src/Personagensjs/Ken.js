import Personagem from "./Personagem.js";

export default class Ken extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    Ken.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "Ken_idle",
      "0",
      {
        velocidade: 240,
        forcaPulo: -600,
        maxPulos: 2,
        maxDash: 1,
        maxComboIndex: 3,
      },

      teclas,
      "ken_",
      controle,
    );
    //============================= hitboxes ========================================
    this.nomePersonagem = "Ken";
    this.configAnimacoes = {
      
       idle: {
        largura: 85,
        altura: 120,
        offsetX: 0,
        offsetY: -20,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 25, offsetY: -70 },
          { largura: 110, altura: 35, offsetX: 5, offsetY: -18 },
        ],
      },

      walk: {
        largura: 85,
        altura: 120,
        offsetX: 0,
        offsetY: -19,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 },
        ],
      },

      jump: {
        largura: 85,
        altura: 120,
        offsetX: 0,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: 0, offsetY: -90 },
          { largura: 60, altura: 50, offsetX: 0, offsetY: -25 },
        ],
      },

      // DEMAIS ESTADOS CORRIGIDOS (Corpo base alinhado com o idle):
      crouch: {
        largura: 85,
        altura: 60,
        offsetX: 0,
        offsetY: 40,
        escala: 1,
        hurtboxes: [
          { largura: 80, altura: 50, offsetX: 0, offsetY: -25 },
        ],
      },

      dash: {
        largura: 85,
        altura: 60,
        offsetX: 0,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
           ],
      },

      guard: {
        largura: 85,
        altura: 120,
        offsetX: 0,
        offsetY: -16,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 25, offsetY: -70 },
          { largura: 110, altura: 35, offsetX: 5, offsetY: -18 },
        ],
      },

        dano: {
  largura: 80,
  altura: 100,
  offsetX: 0,
  offsetY: -15,
  escala: 1,
  hurtboxes: [
    { largura: 60, altura: 65, offsetX: -10, offsetY: -60 }, // Tronco inclinado
    { largura: 50, altura: 45, offsetX: 0, offsetY: -10 },   // Pernas
  ],
},


      // Dano Up (Ken_hurts1 - 111px de altura)
      danoUp: {
        largura: 80,
        altura: 100,
        offsetX: 0,
        offsetY: -5,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 70, offsetX: 0, offsetY: -80 },
          { largura: 45, altura: 40, offsetX: 0, offsetY: -15 },
        ],
      },

      // Dano Side (Ken_hurts2 - 138px de altura)
      danoSide: {
        largura: 80,
        altura: 100,
        offsetX: 0,
        offsetY: -15,
        escala: 1,
        hurtboxes: [
          { largura: 95, altura: 45, offsetX: 0, offsetY: -20 },
        ],
      },

      // Dano Down (Ken_hurts2 - 138px de altura, idêntico ao Side)
      danoDown: {
        largura: 80,
        altura: 100,
        offsetX: 0,
        offsetY: 25,
        escala: 1,
        hurtboxes: [
          { largura: 85, altura: 35, offsetX: 0, offsetY: -15 },
        ],
      },

      // Dead (Ken_dead - 76px de altura)
      dead: {
        largura: 144,
        altura: 33,
        offsetX: 10,
        offsetY: 30,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 },
        ],
      },

      // Getup (Ken_getup - 105px de altura)
      getup: {
        largura: 80,
        altura: 100,
        offsetX: 0,
        offsetY: -8,
        escala: 1,
        hurtboxes: [],
      },

      atack: {
        largura: 85,
        altura: 120,
        offsetX: 0,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: 0, offsetY: -90 },
          { largura: 80, altura: 50, offsetX: 0, offsetY: -25 },
        ],
      },

      neutralAir: {
        largura: 85,
        altura: 120,
        offsetX: 0,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: -20, offsetY: -90 },
          { largura: 80, altura: 50, offsetX: 0, offsetY: -25 },
        ],
      },

      sideAtack: {
        largura: 85,
        altura: 120,
        offsetX: 0,
        offsetY: -10,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 80, offsetX: -20, offsetY: -40 }],
      },

      downAtack: {
        largura: 85,
        altura: 60,
        offsetX: 0,
        offsetY: 50,
        escala: 1,
        hurtboxes: [{ largura: 80, altura: 60, offsetX: 0, offsetY: -40 }],
      },

      sideAir: {
        largura: 85,
        altura: 120,
        offsetX: 0,
        offsetY: -10,
        escala: 1,
        hurtboxes: [{ largura: 80, altura: 60, offsetX: 0, offsetY: -40 }],
      },

      upAir: {  
        largura: 85,
        altura: 120,
        offsetX: 0,
        offsetY: -10,
        escala: 1,
        hurtboxes: [{ largura: 70, altura: 80, offsetX: 0, offsetY: -50 }],
      },

      neSpecial: {
        largura: 85,
        altura: 120,
        offsetX: 0,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 25, offsetY: -70 },
          { largura: 110, altura: 35, offsetX: 5, offsetY: -18 },
        ], 
      },

      doSpecial: {
        largura: 85,
        altura: 120,
        offsetX: 0,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 },
        ],
      },
   
   };
    
  
    // ============================ tabela de golpes =====================================
    //thisgolpes

    //specials

  }

  //animaçoes====================================================
  static criarAnimacoes(scene) {
    if (scene.anims.exists("ken_idle")) return;

    // Idle (Parada)
    scene.anims.create({
      key: "ken_idle",
      frames: scene.anims.generateFrameNumbers("Ken_idle", {
        start: 0,
        end: 9,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "ken_walk",
      frames: scene.anims.generateFrameNumbers("Ken_walk", {
        start: 0,
        end: 10,
      }),
      frameRate: 14,
      repeat: -1,
    });

    scene.anims.create({
      key: "ken_jump",
      frames: scene.anims.generateFrameNumbers("Ken_jump", {
        start: 0,
        end: 12,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_crouch",
      frames: scene.anims.generateFrameNumbers("Ken_crouch", {
        start: 0,
        end: 3,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_crouch2",
      frames: scene.anims.generateFrameNumbers("Ken_crouch", {
        start: 3,
        end: 3,
      }),
      frameRate: 10,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_crouch3",
      frames: scene.anims.generateFrameNumbers("Ken_crouch3", {
        start: 0,
        end: 3,
      }),
      frameRate: 15,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_dash",
      frames: scene.anims.generateFrameNumbers("Ken_dash", {
        start: 0,
        end: 7,
      }),
      frameRate: 16,
      repeat: 0,
    });

     scene.anims.create({
      key: "ken_guard",
      frames: scene.anims.generateFrameNumbers("Ken_guard", {
        start: 0,
        end: 1,
      }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_dano",
      frames: scene.anims.generateFrameNumbers("Ken_hurt", {
        start: 0,
        end: 1,
      }),
      frameRate: 4,
      repeat: 0,
    });

    scene.anims.create({
     key: "ken_danoUp",
     frames: scene.anims.generateFrameNumbers("Ken_hurts1", { start: 0, end: 2 }),
     frameRate: 10,
     repeat: 0,
   });

    scene.anims.create({
  key: "ken_danoSide",
  frames: scene.anims.generateFrameNumbers("Ken_hurts2", { start: 0, end: 14 }),
  frameRate: 22,
  repeat: 0,
});

scene.anims.create({
  key: "ken_danoDown",
  frames: scene.anims.generateFrameNumbers("Ken_hurts2", { start: 15, end: 18 }),
  frameRate: 12,
  repeat: 0,
});

     scene.anims.create({
     key: "ken_dead",
     frames: scene.anims.generateFrameNumbers("Ken_dead", { start: 0, end: 9 }),
     frameRate: 16,
     repeat: 0,
   });

     scene.anims.create({
     key: "ken_getup",
     frames: scene.anims.generateFrameNumbers("Ken_getup", { start: 0, end: 10 }),
     frameRate: 18,
     repeat: 0,
   });

    
  }
}
