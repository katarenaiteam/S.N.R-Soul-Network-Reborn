import Personagem from "./Personagem.js";
import PinguSiSpecial from "./Specials/Pingu/SiSpecial.js";
import PinguDoSpecial from "./Specials/Pingu/DoSpecial.js";
import PinguAneSpecial from "./Specials/Pingu/AneSpecial.js";
import PinguAsiSpecial from "./Specials/Pingu/AsiSpecial.js";
import PinguAupSpecial from "./Specials/Pingu/AupSpecial.js";
import PinguAdoSpecial from "./Specials/Pingu/AdoSpecial.js";
import PinguUlt from "./Ult/PinguUlt.js";


export default class Pingu extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    Pingu.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "Pingu_idle",
      "0",
      {
        velocidade: 200,
        forcaPulo: -600,
        maxPulos: 2,
        maxDash: 1,
        maxComboIndex: 3,
      },

      teclas,
      "pingu_",
      controle,
    );

    

     this.configVFX = {
  ...this.configVFX,

   punch1: {
    textura: "punch_effect",
    animacao: "punch_effect",
    escala: 1,
  },

  punch2: {
    textura: "punch_effect2",
    animacao: "punch_effect2",
    escala: 1,
  },

  punch3: {
    textura: "punch_effect3",
    animacao: "punch_effect3",
    escala: 1,
  },
};

    //============================= hitboxes ========================================
    this.nomePersonagem = "Pingu";
    this.configAnimacoes = {

      idle: { largura: 30, altura: 70, offsetX: 1, offsetY: -10, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: -4, offsetY: -30 }, 
        ],
      },

      walk: {
        largura: 30,
        altura: 70,
        offsetX: 1,
        offsetY: -11,
        escala: 0,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: -2, offsetY: -30 }, 
        ],
      },

      jump: {
        offsetVisualX: -1 ,
        largura: 30,
        altura: 70,
        offsetX: 12,
        offsetY: 25,
        escala: 1,
        hurtboxes: [
         { largura: 30, altura: 55, offsetX: 0, offsetY: -50 }, 
        ],
      },

      dash: {
        largura: 30,
        altura: 45,
        offsetX: 5,
        offsetY: -7,
        escala: 1,
        hurtboxes: [
        ],
      },

      crouch: {
        offsetVisualX: -2,
        offsetVisualY: 4,
        largura: 30,
        altura: 40,
        offsetX: 2,
        offsetY: 17,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 40, offsetX: -4, offsetY: -25 }, 
        ],
      },

      guard: {
      largura: 30,
      altura: 70,
      offsetX: 5,
      offsetY: -24,
      escala: 1,
      hurtboxes: [
          { largura: 30, altura: 55, offsetX: -4, offsetY: -30 }, 
     ]
      },

       taunt: {
        offsetVisualY: -1,
      largura: 30,
      altura: 70,
      offsetX: 5,
      offsetY: -4,
      escala: 1,
      hurtboxes: [
          { largura: 30, altura: 55, offsetX: -4, offsetY: -30 }, 
     ]
      },
      stun: {
         largura: 30,
        altura: 70,
        offsetX: -1,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          
          { largura: 30, altura: 55, offsetX: -2, offsetY: -30 }, 
        ],
      },

      dano: {
        offsetVisualY: 40,
        offsetVisualX: -20,
         largura: 30,
        altura: 70,
        offsetX: 75,
        offsetY: 117,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: -4, offsetY: -30 }, 
        ],
      },

      danoUp: {
         largura: 30,
        altura: 70,
        offsetX: 70,
        offsetY: 90,
        escala: 1,
        hurtboxes: [
           { largura: 50, altura: 57, offsetX: 0, offsetY: -88 }, 
          { largura: 50, altura: 33, offsetX: 0, offsetY: -46 },
        ],
      },
      danoDown: {
         largura: 30,
        altura: 70,
        offsetX: 70,
        offsetY: 90,
        escala: 1,
        hurtboxes: [
           { largura: 55, altura: 60, offsetX: 0, offsetY: -90 }, 
          { largura: 55, altura: 35, offsetX: 0, offsetY: -45 }, 
        ], 
      },
      danoSide: {
         largura: 30,
         altura: 70,
         offsetX: 65,
         offsetY: 90,
         escala: 1,
        hurtboxes: [
           { largura: 60, altura: 55, offsetX: 0, offsetY: -75 },  
        ],
      },
      dead: {
         offsetVisualY: 55,
        offsetVisualX: 0,
         largura: 30,
        altura: 70,
        offsetX: 87,
        offsetY: 60,
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 15, offsetX: -10, offsetY: -35 },
          { largura: 90, altura: 20, offsetX: 0, offsetY: -15 },
        ],
      },
      getup: {
        offsetVisualY: 15,
        offsetVisualX: 0,
         largura: 30,
        altura: 70,
        offsetX: 38,
        offsetY: 19,
        escala: 1,
        hurtboxes: [
       
          { largura: 65, altura: 25, offsetX: -3, offsetY: -15 },
        ],
      },

      atack1: {offsetVisualX: 10, largura: 30, altura: 70, offsetX: 20, offsetY: -10, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: -4, offsetY: -30 }, 
        ],
      },

      atack2: {offsetVisualX: 15, offsetVisualY: -1, largura: 30, altura: 70, offsetX: 29, offsetY: -10, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: -4, offsetY: -30 }, 
        ],
      },
      atack3: {offsetVisualX: 15, offsetVisualY: -1, largura: 30, altura: 70, offsetX: 21, offsetY: 20, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: -4, offsetY: -30 }, 
        ],
      },

      neutralAir: {offsetVisualX: 10, largura: 30, altura: 70, offsetX: 26, offsetY: 15, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: 0, offsetY: -40 }, 
        ],
      },

      sideAtack: {offsetVisualX: 10, largura: 30, altura: 70, offsetX: 30, offsetY: -10, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: -4, offsetY: -30 }, 
        ],
      },

      downAtack: {offsetVisualY: 50, largura: 30, altura: 40, offsetX: 80, offsetY: 104, escala: 1,
        hurtboxes: [
          { largura: 60, altura: 30, offsetX: -10, offsetY: -15 }, 
        ],
      },

      sideAir: {offsetVisualY: 5, largura: 30, altura: 70, offsetX: 80, offsetY: 60, escala: 1,
        hurtboxes: [
          { largura: 50, altura: 45, offsetX: -5, offsetY: -60 }, 
        ],
      },

      downAir: { largura: 30, altura: 70, offsetX: 30, offsetY: 30, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 65, offsetX: -4, offsetY: -40 }, 
        ],
      },

      upAir: { largura: 30, altura: 70, offsetX: 25, offsetY: 15, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: 0, offsetY: -45 }, 
        ],
      },

      neSpecial: { offsetVisualY: 14, offsetVisualX: -4, largura: 30, altura: 70, offsetX: 21, offsetY: 17, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: -4, offsetY: -40 }, 
        ],
      },

      siSpecial: { largura: 30, altura: 70, offsetX: 26, offsetY: 10, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: 0, offsetY: -50 }, 
        ],
      },

      AneSpecial: { largura: 30, altura: 70, offsetX: 27, offsetY: 20, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: 0, offsetY: -30 },
        ],
      },

      AsiSpecial: { offsetVisualY: 40, offsetVisualX: -10, largura: 30, altura: 70, offsetX: 158, offsetY: 132, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: 0, offsetY: -30 },
        ],
      },

      doSpecial: {offsetVisualY: 2, offsetVisualX: 11, largura: 30, altura: 40, offsetX: 28, offsetY: 48, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 40, offsetX: 0, offsetY: -22 },
        ],
      },

      doCharg: {offsetVisualY: 7, offsetVisualX: 3, largura: 30, altura: 40, offsetX: 10, offsetY: 0, escala: 1,
        hurtboxes: [
          { largura: 35, altura: 35, offsetX: 2, offsetY: -10 },
        ],
      },

      doLaunch: {offsetVisualY: 60, offsetVisualX: 0, largura: 30, altura: 40, offsetX: 40, offsetY: 105, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 40, offsetX: 0, offsetY: -10 },
        ],
      },

      doStrike: {offsetVisualY: -2, offsetVisualX: 5, largura: 30, altura: 40, offsetX: 30, offsetY: 36, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 40, offsetX: 0, offsetY: -10

           },
        ],
      },

      AupSpecial: { largura: 30, altura: 70, offsetX: 6, offsetY: 20, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 55, offsetX: 5, offsetY: -55 }, 
        ],
      },

      AdoSpecial: { offsetVisualY: -5, largura: 40, altura: 40, offsetX: 15, offsetY: 25, escala: 1,
        hurtboxes: [
          { largura: 35, altura: 35, offsetX: -5, offsetY: -23 },
        ],
      },

      ultPose: { largura: 30, altura: 70, offsetX: 1, offsetY: -10, escala: 1,
        hurtboxes: [],
      },
      dance: { offsetVisualY: 75, offsetVisualX: -5, largura: 40, altura: 70, offsetX: 80, offsetY: 150, escala: 1,
        hurtboxes: [],
      },

   };

    this.sons = {
      ...this.sons,
      vozAtaque: [ "pingu-attack1", "pingu-attack2", "pingu-attack3", "pingu-attack4"],
      vozDanoNormal: ["pingu-hurt2", "pingu-hurt3", "pingu-hurt4"],
      vozDanoForte: ["pingu-hurt3", "pingu-hurt1"],
      volumeVoz: 0.2,
    };

    // ============================ tabela de golpes =====================================
    this.golpes = {
      neutro1: {
        animacao: "pingu_atack1",
        frameHitbox: 3,
        offsetX: 20,
        offsetY: -40,
        largura: 48,
        altura: 16,
        cooldown: 700,
        duracao: 270,
        cancelavel: true,

         vfxAcerto: [
        {
        escolherUm: [
        "punch1",
        "punch2",
        "punch3",
          ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "light",
          dano: 4,
          knockbackX: 20,
          knockbackY: -20,
          knockbackFixo: true,
          hitstunFrames: 25,
        },

        comboProximo: "neutro2",
        comboJanelaInicio: 150,
        comboJanelaFim: 270,
      },

      neutro2: {
        animacao: "pingu_atack2",

        frameHitbox: 3,

        offsetX: 30,
        offsetY: -45,
        largura: 48,
        altura: 35,
        duracao: 550,
       // cancelavel: true,

        vfxAcerto: [
        {
        escolherUm: [
        "punch1",
        "punch2",
        "punch3",
          ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "light",
          dano: 4,
          knockbackX: 40,
          knockbackY: 0,
          knockbackFixo: true,
          hitstunFrames: 25,
        },

        comboProximo: "neutro3",
        comboJanelaInicio: 350,
        comboJanelaFim: 550,
      },


      neutro3: {
        animacao: "pingu_atack3",

        frameHitbox: 2,

        offsetX: 30,
        offsetY: -55,
        largura: 40,
        altura: 40,
        duracao: 500,
       // cancelavel: true,

        vfxAcerto: [
        {
        escolherUm: [
        "punch1",
        "punch2",
        "punch3",
          ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "light",
          dano: 4,
          knockbackX: 250,
          knockbackY: -350,
          knockbackFixo: false,
        },

      },

      
      agachado: {
        animacao: "pingu_downAtack",
        frameHitbox: 3,
        offsetX: 25,
        offsetY: -24,
        largura: 50,
        altura: 30,
        cooldown: 500,
        duracao: 300,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        movimento: {
         inicio: 50,
         fim: 320,
      x: {
         de: 100,
         para: 70,
        },

        curva: "easeIn",
       },

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 6,
          knockbackX: 50,
          knockbackY: -350,
          knockbackFixo: true,
          tumbling: true,
          //freioKnockback: 700
          hitstunMinFrames:25,
        },
      },
      side: {
        animacao: "pingu_sideAtack",
        frameHitbox: 3,
        offsetX: 30,
        offsetY: -45,
        largura: 50,
        altura: 30,
        cooldown: 900,
        duracao: 400,
        cancelavel: false,

        vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        movimento: {
         inicio: 50,
         fim: 300,
      x: {
         de: 80,
         para: 60,
        },

        curva: "easeIn",
       },

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 600,
          knockbackY: -400,
          tumbling: true,
          impulsoX: 0,
        },
      },

      air_neutro: {
        animacao: "pingu_neutralAir",
        frameHitbox: 2,
        offsetX: 31,
        offsetY: -65,
        largura: 45,
        altura: 20,
        cooldown: 500,
        duracao: 450,
        cancelavel: true,
        

        vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "light",
          dano: 11,
          knockbackX: 90,
          knockbackY: -350,
          tumbling: false,
          knockbackFixo: true,
          hitstunMinFrames:24,
        },
      },

      air_agachado: {
  animacao: "pingu_downAir",
  frameHitbox: 2,
  offsetX: 22,
  offsetY: -15,
  largura: 45,
  altura: 40,
  cooldown: 500,

  duracao: 1000,

  vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

  finalizarAoTocarChao: true,
  atrasoFinalizacaoChao: 90,

  finalizarAoAcertarOponente: true,
  atrasoFinalizacaoAcerto: 30,

  movimento: {
    inicio: 30,
    fim: 300,

    x: {
      de: 400,
      para: 350,
    },

    y: {
      de: 700,
      para: 600,
    },

    curva: "easeOut",
  },

  propriedades: {
    tipoSomImpacto: "heavy",
    dano: 11,
    knockbackX: 50,
    knockbackY: 400,
    quiqueChaoY: 350,
    hitstunMinFrames:25,
  },
},

      air_side: {
        animacao: "pingu_sideAir",
        frameHitbox: 5,
        offsetX: 30,
        offsetY: -50,
        largura: 45,
        altura: 35,
        cooldown: 500,
        duracao: 550, 
        cancelavel: false,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

         movimento: {
    inicio: 0,
    fim: 300,

    x: {
      de: 300,
      para: 450,
    },

    curva: "easeOut",
  },

        finalizarAoTocarChao: false,
        atrasoFinalizacaoChao: 100,
        finalizarAoAcertarOponente: false,
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 300,
          knockbackY: -130,
          impulsoX: 350,
          tumbling: true
        },
      },

      air_cima: {
        animacao: "pingu_upAir",
        frameHitbox: 2,
        offsetX: 17,
        offsetY: -65,
        largura: 35,
        altura: 45,
        cooldown: 900,
        duracao: 300,

        vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        finalizarAoTocarChao: false,
        atrasoFinalizacaoChao: 100,
        finalizarAoAcertarOponente: false,


        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 11,
          knockbackX: 60,
          knockbackY: -500,
          impulsoX: 30,
          tumbling: true
        },
      },
    };

    this.specials = {
      neutro: PinguAneSpecial.configuracaoChao,
      lado: PinguSiSpecial.configuracao,
      agachado: PinguDoSpecial.configuracao,
      air_neutro: PinguAneSpecial.configuracao,
      air_cima: PinguAupSpecial.configuracao,
      air_lado: PinguAsiSpecial.configuracao,
      air_agachado: PinguAdoSpecial.configuracao,
    };

    this.ult = {
      animacao: "pingu_ultPose",
      logica: PinguUlt,
      propriedades: { anularGravidade: true },
    };

  // --------------------------------- tabela especiais --------------------------

    //-------------------------- ult ------------------------------------
  

  }

  //animaçoes====================================================
  static criarAnimacoes(scene) {

   // efeitos anim
  if (!scene.anims.exists("punch_effect")) {
  scene.anims.create({
    key: "punch_effect",
    frames: scene.anims.generateFrameNumbers("punch_effect"),
    frameRate: 18,
    repeat: 0,
  });
}

if (!scene.anims.exists("punch_effect2")) {
  scene.anims.create({
    key: "punch_effect2",
    frames: scene.anims.generateFrameNumbers("punch_effect2"),
    frameRate: 18,
    repeat: 0,
  });
}

if (!scene.anims.exists("punch_effect3")) {
  scene.anims.create({
    key: "punch_effect3",
    frames: scene.anims.generateFrameNumbers("punch_effect3"),
    frameRate: 18,
    repeat: 0,
  });
}


    // Se a animação "idle" já existe na cena, não recria
    if (scene.anims.exists("pingu_idle")) return;

     scene.anims.create({
      key: "pingu_intro",
      frames: scene.anims.generateFrameNumbers("Pingu_intro", {
        start: 0,
        end: 66,
      }),
      frameRate: 12,
      repeat: 0,
    });

    // Idle (Parada)
    scene.anims.create({
      key: "pingu_idle",
      frames: scene.anims.generateFrameNumbers("Pingu_idle", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "pingu_walk",
      frames: scene.anims.generateFrameNumbers("Pingu_walk", {
        start: 0,
        end: 8,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "pingu_jump",
      frames: scene.anims.generateFrameNumbers("Pingu_jump", {
        start: 0,
        end: 11,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_crouch",
      frames: scene.anims.generateFrameNumbers("Pingu_crouch1", {
        start: 0,
        end: 3,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_crouch2",
      frames: scene.anims.generateFrameNumbers("Pingu_crouch", {
        start: 0,
        end: 0,
      }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: "pingu_crouch3",
      frames: scene.anims.generateFrameNumbers("Pingu_crouch", {
        start: 0,
        end: 3,
      }),
      frameRate: 16,
      repeat: 0,
    });


    scene.anims.create({
      key: "pingu_dash",
      frames: scene.anims.generateFrameNumbers("Pingu_dash", {
        start: 0,
        end: 59,
      }),
      frameRate: 100,
      repeat: 0,
    });

     scene.anims.create({
      key: "pingu_guard",
      frames: scene.anims.generateFrameNumbers("Pingu_guard", {
        start: 0,
        end: 2,
      }),
      frameRate: 12,
      repeat: 0,
    });

     scene.anims.create({
      key: "pingu_taunt",
      frames: scene.anims.generateFrameNumbers("Pingu_taunt2", {
        start: 0,
        end: 24,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_dano",
      frames: scene.anims.generateFrameNumbers("Pingu_hurt", {
        start: 0,
        end: 1,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
     key: "pingu_danoUp",
     frames: scene.anims.generateFrameNumbers("Pingu_fly", { start: 0, end: 9 }),
     frameRate: 12,
     repeat: 0,
   });

    scene.anims.create({
     key: "pingu_danoSide",
     frames: scene.anims.generateFrameNumbers("Pingu_fly", { start: 0, end: 9 }),
     frameRate: 12,
     repeat: 0,
   });

      scene.anims.create({
     key: "pingu_danoDown",
     frames: scene.anims.generateFrameNumbers("Pingu_fly", { start: 0, end: 9 }),
     frameRate: 12,
     repeat: 0,
   });

     scene.anims.create({
     key: "pingu_dead",
     frames: scene.anims.generateFrameNumbers("Pingu_dead", { start: 0, end: 2 }),
     frameRate: 12,
     repeat: 0,
   });

     scene.anims.create({
     key: "pingu_getup",
     frames: scene.anims.generateFrameNumbers("Pingu_getup", { start: 0, end: 13 }),
     frameRate: 16,
     repeat: 0,
   });

    scene.anims.create({
    key: "pingu_stun",
    frames: scene.anims.generateFrameNumbers("Pingu_stun", { start: 0, end: 1 }),
    frameRate: 9,
    repeat: -1
   });
     
//golpes 
    scene.anims.create({
      key: "pingu_atack1",
      frames: scene.anims.generateFrameNumbers("Pingu_atack1", {
        start: 0,
        end: 3,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_atack2",
      frames: scene.anims.generateFrameNumbers("Pingu_atack2", {
        start: 0,
        end: 4,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_atack3",
      frames: scene.anims.generateFrameNumbers("Pingu_atack3", {
        start: 0,
        end: 6,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_sideAtack",
      frames: scene.anims.generateFrameNumbers("Pingu_sideAtack", {
        start: 0,
        end:4,
      }),
      frameRate: 12,
      repeat: 0,
    });

     scene.anims.create({
      key: "pingu_downAtack",
      frames: scene.anims.generateFrameNumbers("Pingu_downAtack", {
        start: 0,
        end: 4,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_neutralAir",
      frames: scene.anims.generateFrameNumbers("Pingu_neutralAir", {
        start: 0,
        end: 4,
      }),
      frameRate: 12,
      repeat: 0,
    });
    
    scene.anims.create({
      key: "pingu_downAir",
      frames: scene.anims.generateFrameNumbers("Pingu_downAir", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_upAir",
      frames: scene.anims.generateFrameNumbers("Pingu_upAir", {
        start: 0,
        end: 6,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_sideAir",
      frames: scene.anims.generateFrameNumbers("Pingu_sideAir", {
        start: 0,
        end: 12,
      }),
      frameRate: 20,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_neSpecial",
      frames: scene.anims.generateFrameNumbers("Pingu_neSpecial", {
        start: 0,
        end: 25,
      }),
      frameRate: 25,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_som",
      frames: scene.anims.generateFrameNumbers("Pingu_som", {
        start: 0,
        end: 6,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_siSpecial",
      frames: scene.anims.generateFrameNumbers("Pingu_siSpecial", {
        start: 0,
        end: 58,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_siBall",
      frames: scene.anims.generateFrameNumbers("Pingu_siBall", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "pingu_AneSpecial",
      frames: scene.anims.generateFrameNumbers("Pingu_AneSpecial", {
        start: 0,
        end: 7,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_AsiSpecial",
      frames: scene.anims.generateFrameNumbers("Pingu_AsiSpecial", {
        start: 0,
        end: 7,
      }),
      frameRate: 27,
      repeat: -1,
    });

    scene.anims.create({
      key: "pingu_aBall_faisca",
      frames: scene.anims.generateFrameNumbers("Pingu_aBall", {
        start: 0,
        end: 6,
      }),
      frameRate: 24,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_aBall_loop",
      frames: scene.anims.generateFrameNumbers("Pingu_aBall", {
        start: 7,
        end: 14,
      }),
      frameRate: 18,
      repeat: -1,
    });

    scene.anims.create({
      key: "pingu_aExplosion",
      frames: scene.anims.generateFrameNumbers("Pingu_aExplosion", {
        start: 0,
        end: 15,
      }),
      frameRate: 24,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_doSpecial",
      frames: scene.anims.generateFrameNumbers("Pingu_doSpecial", {
        start: 0,
        end: 7,
      }),
      frameRate: 20,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_AupSpecial",
      frames: scene.anims.generateFrameNumbers("Pingu_AupSpecial", {
        start: 0,
        end: 7,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_AdoSpecial",
      frames: scene.anims.generateFrameNumbers("Pingu_AdoSpecial", {
        start: 0,
        end: 34,
      }),
      frameRate: 24,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_AdoSpecial_loop",
      frames: scene.anims.generateFrameNumbers("Pingu_AdoSpecial", {
        start: 3,
        end: 34,
      }),
      frameRate: 24,
      repeat: -1,
    });

    scene.anims.create({
      key: "pingu_doCharg",
      frames: scene.anims.generateFrameNumbers("Pingu_doCharg", {
        start: 0,
        end: 8,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "pingu_doLaunch",
      frames: scene.anims.generateFrameNumbers("Pingu_doLaunch", {
        start: 0,
        end: 4,
      }),
      frameRate: 24,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_doStrike",
      frames: scene.anims.generateFrameNumbers("Pingu_doStrike", {
        start: 0,
        end: 10,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_ultPose",
      frames: scene.anims.generateFrameNumbers("Pingu_ultPose", {
        start: 0,
        end: 49,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_dance",
      frames: scene.anims.generateFrameNumbers("Pingu_dance", {
        start: 0,
        end: 35,
      }),
      frameRate: 16,
      repeat: -1,
    });

    scene.anims.create({
      key: "pingu_Fgo",
      frames: scene.anims.generateFrameNumbers("Pingu_Fgo", {
        start: 0,
        end: 15,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "pingu_Fdance",
      frames: scene.anims.generateFrameNumbers("Pingu_Fdance", {
        start: 0,
        end: 12,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "pingu_ultF",
      frames: scene.anims.generateFrameNumbers("Pingu_ultF", {
        start: 0,
        end: 5,
      }),
      frameRate: 16,
      repeat: -1,
    });

  }
}
