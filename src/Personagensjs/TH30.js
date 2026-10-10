import Personagem from "./Personagem.js";


export default class TH30 extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    TH30.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "th_idle",
      "0",
      {
        velocidade: 300,
        forcaPulo: -660,
        maxPulos: 2,
        maxDash: 1,
        maxComboIndex: 3,
      },

      teclas,
      "th_",
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

this.nomePersonagem = "TH30";
    //============================= hitboxes ========================================

    this.configAnimacoes = {

       idle: {
        largura: 65,
        altura: 120,
        offsetX: 32,
        offsetY: 12,
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 67, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      walk: {
        largura: 65,
        altura: 120,
        offsetX: 45,
        offsetY: -11,
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 60, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      jump: {
        largura: 65,
        altura: 120,
        offsetX: 20,
        offsetY: 68,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 70, offsetX: 0, offsetY: -90 },
          { largura: 30, altura: 50, offsetX: -5, offsetY: -25 },
        ],
      },


      crouch: {
        //offsetVisualX:
        largura: 80,
        altura: 60,
        offsetX: 11,
        offsetY: 60,
        escala: 1,
        hurtboxes: [
          { largura: 65, altura: 60, offsetX: 0, offsetY: -35 },
        ],
      },

      stun: {
        largura: 65,
        altra: 60,
        offsetX: 5,
        offsetY: 0,
        escuala: 1,
        hurtboxes: [
          { largura: 65, altura: 100, offsetX: 0, offsetY: -55 },
        ],
      },

      dash: {
        largura: 70,
        altura: 80,
        offsetX: 30,
        offsetY: 43,
        escala: 1,
        hurtboxes: [
           ],
      },

      guard: {
        largura: 65,
        altura: 120,
        offsetX: 25,
        offsetY: 12,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 50, offsetX: -5, offsetY: -75 },
          { largura: 50, altura: 50, offsetX: -5, offsetY: -25 },
        ],
      },

        dano: {
  largura: 65,
  altura: 120,
  offsetX: 10,
  offsetY: 10,
  escala: 1,
  hurtboxes: [
    { largura: 50, altura: 65, offsetX: -10, offsetY: -60 }, // Tronco inclinado
    { largura: 50, altura: 30, offsetX: 0, offsetY: -15 },   // Pernas
  ],
},

      danoUp: {
        largura: 65,
        altura: 120,
        offsetX: 0,
        offsetY: 5,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 70, offsetX: 20, offsetY: -80 },
          { largura: 45, altura: 40, offsetX: 0, offsetY: -15 },
        ],
      },

      danoSide: {
        largura: 65,
        altura: 100,
        offsetX: 0,
        offsetY: 5,
        escala: 1,
        hurtboxes: [
          { largura: 65, altura: 55, offsetX: -15, offsetY: -90 }, // Tronco inclinado
          { largura: 50, altura: 45, offsetX: 30, offsetY: -70 },   // Pernas
        ],
      },

      danoDown: {
        largura: 65,
        altura: 100,
        offsetX: 0,
        offsetY: 35,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 65, offsetX: -10, offsetY: -60 }, 
          { largura: 50, altura: 45, offsetX: 0, offsetY: -10 },
        ],
      },

      // Dead (Ken_dead - 76px de altura)
      dead: {
        largura: 80,
        altura: 33,
        offsetX: 49,
        offsetY: 40,
        escala: 1,
        hurtboxes: [
          { largura: 100, altura: 34, offsetX: -10, offsetY: -18 },
          { largura: 40, altura: 20, offsetX: -60, offsetY: -12 },
          { largura: 50, altura: 25, offsetX: 50, offsetY: -12 },
        ],
      },

      // Getup (Ken_getup - 105px de altura)
      getup: {
        largura: 65,
        altura: 100,
        offsetX: 30,
        offsetY: 2,
        escala: 1,
        hurtboxes: [],
      },

      atack1: {
        largura: 65,
        altura: 120,
        offsetX: 41,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 67, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      atack2: {
        largura: 65,
        altura: 120,
        offsetX: 61,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 67, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      atack3: {
        largura: 65,
        altura: 120,
        offsetX: 70,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 35, altura: 35, offsetX: 17, offsetY: -18 },
        ],
      },

      neutralAir: {
  
        largura: 65,
        altura: 120,
        offsetX: 22,
        offsetY: -5,
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 55, offsetX: 1, offsetY: -85 },
          { largura: 60, altura: 25, offsetX: -4, offsetY: -40 },
        ],
      },

      sideAtack: {
    
        largura: 65,
        altura: 120,
        offsetX: 30,
        offsetY: 0,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 100, offsetX: -20, offsetY: -50 }],
      },

      downAtack: {
        largura: 65,
        altura: 60,
        offsetX: 36,
        offsetY: 12,
        escala: 1,
        hurtboxes: [{ largura: 50, altura: 60, offsetX: -10, offsetY: -30 }],
      },

      sideAir: {
        largura: 65,
        altura: 120,
        offsetX: 25,
        offsetY: -11,
        escala: 1,
        hurtboxes: [{ largura: 55, altura: 80, offsetX: -20, offsetY: -65 }],
      },

      upAir: {  
        largura: 65,
        altura: 120,
        offsetX: 19,
        offsetY: -5,
        escala: 1,
        hurtboxes: [{ largura: 45, altura: 80, offsetX: -20, offsetY: -70 }],
      },

      downAir: {
        largura: 65,
        altura: 120,
        offsetX: 12,
        offsetY: 12,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 80, offsetX: -10, offsetY: -70 }],
      },
    };

    // Frame de intro 92x108; idle 78x111, ambos ancorados pelos pes.
    this.configAnimacoes.intro = {
      ...this.configAnimacoes.idle, offsetX: 7, offsetY: -13,
    };

  //  this.sons = {
  //    ...this.sons,
  //    vozAtaque: ["ken-punch1", "ken-punch1", "ken-punch2", "ken-punch3", "ken-punch4"],
  //    vozDanoNormal: ["ken-damaged1", "ken-damaged2", "ken-damaged3"],
  //     vozDanoForte: ["ken-damaged1", "ken-damaged2", "ken-damaged3"],
  //     volumeVoz: 0.4,
  //   };

    // ============================ tabela de golpes =====================================
    this.golpes = {
      neutro1: {
        animacao: "ken_atack1",
        frameHitbox: 2,
        offsetX: 40,
        offsetY: -80,
        largura: 75,
        altura: 20,
        cooldown: 700,
        duracao: 350,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
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
          hitsSemDecay: 3
        },

        comboProximo: "neutro2",
        comboJanelaInicio: 100,
        comboJanelaFim: 350,
      },

      neutro2: {
        animacao: "ken_atack2",

        frameHitbox: 2,

        offsetX: 40,
        offsetY: -80,
        largura: 73,
        altura: 25,
        duracao: 400,
        cancelavel: true,
        propriedades: {
           tipoSomImpacto: "heavy",
          dano: 4,
          knockbackX: 40,
          knockbackY: -30,
          knockbackFixo: true,
          hitstunFrames: 25,
        },

        comboProximo: "neutro3",
        comboJanelaInicio: 200,
        comboJanelaFim: 400,
      },

      neutro3: {
        animacao: "ken_atack3",

        frameHitbox: 3,

        offsetX: 50,
        offsetY: -72,
        largura: 80,
        altura: 36,
        duracao: 600,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        bufferInputs: true,
        bufferJanelaInicio: 50,
        bufferJanelaFim: 350,
        propriedades: {
           tipoSomImpacto: "heavy",
          dano: 8,
          knockbackX: 490,
          knockbackY: -434,
          tumbling: true,
          hitstunMinFrames:25,
          
        },
      },

      side: {
        animacao: "ken_sideAtack",
        frameHitbox: 4,
        offsetX: 40,
        offsetY: -57,
        largura: 80,
        altura: 25,
        cooldown: 900,
        duracao: 500,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 630,
          knockbackY: -420,
          tumbling: true,
        },
      },
     agachado: {
        animacao: "ken_downAtack",
        frameHitbox: 3,
        offsetX: 26,
        offsetY: -20,
        largura: 70,
        altura: 25,
        cooldown: 900,
        duracao: 400,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 90,
          knockbackY: -400,
          tumbling: true,
          knockbackFixo: true,
        },
      },

        air_neutro: {
        animacao: "ken_neutralAir",
        frameHitbox: 3,
        offsetX: 48,
        offsetY: -85,
        largura: 70,
        altura: 25,
        cooldown: 900,
        duracao: 350,
         finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 30,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],
        propriedades: {
          tipoSomImpacto: "light",
          dano: 12,
          knockbackX: 120,
          knockbackY: -450,
          tumbling: false,
          knockbackFixo: true,
          hitstunMinFrames:26,
        },
      },


      air_side: {
        animacao: "ken_sideAir",
        frameHitbox: 3,
        offsetX: 26,
        offsetY: -50,
        largura: 75,
        altura: 30,
        cooldown: 900,
        duracao: 600,
         finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 30,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 630,
          knockbackY: -490,
          tumbling: true,
        },
      },
      air_cima: {
        animacao: "ken_upAir",
        frameHitbox: 3,
        offsetX: 20,
        offsetY: -84,
        largura: 70,
        altura: 30,
        cooldown: 900,
        duracao: 600,
         finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 30,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 182,
          knockbackY: -490,
          tumbling: true,
        },
      },
      air_agachado: {
        animacao: "ken_downAir",
        frameHitbox: 3,
        offsetX: 35,
        offsetY: -15,
        largura: 60,
        altura: 60,
        cooldown: 900,
        duracao: 900,
        finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 0,
        finalizarAoAcertarOponente: true,
        atrasoFinalizacaoAcerto: 50,
        cancelavel: false,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

         movimento: {
    inicio: 80,
    fim: 900,
    x: {
      de: 500,
      para: 600,
    },
    y: {
      de: 550,
      para: 1000,
    },

    curva: "easeOut",
  },
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 112,
          knockbackY: 500,
          quiqueChaoY: 350,
        },
      },
    }

    // specials
    //this.specials = {};


    //this.ult = {};

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

// personagem

    if (scene.anims.exists("th_idle")) return;

    // Idle (Parada)
    scene.anims.create({
      key: "th_idle",
      frames: scene.anims.generateFrameNumbers("th_idle", {
        start: 0,
        end: 6,
      }),
      frameRate: 12,
      repeat: -1,
    });


     scene.anims.create({
      key: "th_intro",
      frames: scene.anims.generateFrameNumbers("th_intro", {
        start: 0,
        end: 61,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_walk",
      frames: scene.anims.generateFrameNumbers("th_walk", {
        start: 0,
        end: 7,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "th_jump",
      frames: scene.anims.generateFrameNumbers("th_jump", {
        start: 0,
        end: 9,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_crouch",
      frames: scene.anims.generateFrameNumbers("th_crouch", {
        start: 0,
        end: 2,
      }),
      frameRate: 20,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_crouch2",
      frames: scene.anims.generateFrameNumbers("th_crouch", {
        start: 2,
        end: 2,
      }),
      frameRate: 10,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_crouch3",
      frames: scene.anims.generateFrameNumbers("th_crouch", {
        start: 2,
        end: 4,
      }),
      frameRate: 20,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_dash",
      frames: scene.anims.generateFrameNumbers("th_dash", {
        start: 0,
        end: 1,
      }),
      frameRate: 12,
      repeat: 0,
    });

     scene.anims.create({
      key: "th_guard",
      frames: scene.anims.generateFrameNumbers("th_guard", {
        start: 0,
        end: 1,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_taunt",
      frames: scene.anims.generateFrameNumbers("th_taunt", {
        start: 0,
        end: 13,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_dano",
      frames: scene.anims.generateFrameNumbers("th_dano", {
        start: 0,
        end: 1,
      }),
      frameRate: 4,
      repeat: 0,
    });

    scene.anims.create({
     key: "th_danoUp",
     frames: scene.anims.generateFrameNumbers("th_hurt1", { start: 0, end: 1 }),
     frameRate: 10,
     repeat: 0,
   });

    scene.anims.create({
  key: "th_danoSide",
  frames: scene.anims.generateFrameNumbers("th_hurt2", { start: 0, end: 3 }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "th_danoDown",
  frames: scene.anims.generateFrameNumbers("th_hurt2", { start: 2, end: 3 }),
  frameRate: 12,
  repeat: 0,
});

     scene.anims.create({
     key: "th_dead",
     frames: scene.anims.generateFrameNumbers("th_dead", { start: 0, end: 2 }),
     frameRate: 12,
     repeat: 0,
   });

     scene.anims.create({
     key: "th_getup",
     frames: scene.anims.generateFrameNumbers("th_getup", { start: 0, end: 13 }),
     frameRate: 18,
     repeat: 0,
   });

   scene.anims.create({
  key: "th_stun",
  frames: scene.anims.generateFrameNumbers("th_stun", { start: 0, end: 3 }),
  frameRate: 8,
  repeat: 0,
});

  }
}
