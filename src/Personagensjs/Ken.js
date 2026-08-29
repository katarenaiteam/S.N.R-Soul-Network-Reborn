import Personagem from "./Personagem.js";
import Hadouken from "./Specials/Ken/hadouken.js";
import Tatsumaki from "./Specials/Ken/tatsumaki.js";
import Shoryuken from "./Specials/Ken/shoryuken.js";

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

this.nomePersonagem = "Ken";
    //============================= hitboxes ========================================
   
    this.configAnimacoes = {
      
       idle: {
        largura: 80,
        altura: 120,
        offsetX: 0,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 67, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      walk: {
        largura: 80,
        altura: 120,
        offsetX: 17,
        offsetY: -9,
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 60, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      jump: {
        largura: 80,
        altura: 120,
        offsetX: -1,
        offsetY: 10,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 70, offsetX: 0, offsetY: -90 },
          { largura: 45, altura: 50, offsetX: -5, offsetY: -25 },
        ],
      },

      
      crouch: {
        largura: 80,
        altura: 60,
        offsetX: 5,
        offsetY: 50,
        escala: 1,
        hurtboxes: [
          { largura: 65, altura: 60, offsetX: 0, offsetY: -35 },
        ],
      },

      dash: {
        largura: 70,
        altura: 80,
        offsetX: 4,
        offsetY: 10,
        escala: 1,
        hurtboxes: [
           ],
      },

      guard: {
        largura: 80,
        altura: 120,
        offsetX: 0,
        offsetY: -16,
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 50, offsetX: -5, offsetY: -75 },
          { largura: 60, altura: 50, offsetX: 0, offsetY: -25 },
        ],
      },

        dano: {
  largura: 80,
  altura: 100,
  offsetX: 0,
  offsetY: -5,
  escala: 1,
  hurtboxes: [
    { largura: 60, altura: 65, offsetX: -10, offsetY: -60 }, // Tronco inclinado
    { largura: 50, altura: 45, offsetX: 0, offsetY: -10 },   // Pernas
  ],
},


     
      danoUp: {
        largura: 80,
        altura: 100,
        offsetX: 0,
        offsetY: 5,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 70, offsetX: 20, offsetY: -80 },
          { largura: 45, altura: 40, offsetX: 0, offsetY: -15 },
        ],
      },

      danoSide: {
        largura: 80,
        altura: 100,
        offsetX: 0,
        offsetY: -5,
        escala: 1,
        hurtboxes: [
          { largura: 65, altura: 55, offsetX: -15, offsetY: -90 }, // Tronco inclinado
          { largura: 50, altura: 45, offsetX: 30, offsetY: -70 },   // Pernas
        ],
      },
     
      danoDown: {
        largura: 80,
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
        largura: 144,
        altura: 33,
        offsetX: 10,
        offsetY: 40,
        escala: 1,
        hurtboxes: [
          { largura: 100, altura: 35, offsetX: -10, offsetY: -18 },
        ],
      },

      // Getup (Ken_getup - 105px de altura)
      getup: {
        largura: 80,
        altura: 100,
        offsetX: 0,
        offsetY: 2,
        escala: 1,
        hurtboxes: [],
      },

      atack1: {
        largura: 85,
        altura: 120,
        offsetX: 36,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: 0, offsetY: -85 },
          { largura: 70, altura: 40, offsetX: 0, offsetY: -20 },
        ],
      },

      atack2: {
        largura: 85,
        altura: 120,
        offsetX: 55,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: 0, offsetY: -85 },
          { largura: 70, altura: 40, offsetX: 0, offsetY: -20 },
        ],
      },

      atack3: {
        largura: 85,
        altura: 120,
        offsetX: 67,
        offsetY: -3, 
        escala: 1,
        hurtboxes: [
          { largura: 70, altura: 70, offsetX: 10, offsetY: -85 },
          { largura: 40, altura: 40, offsetX: 10, offsetY: -25 },
        ],
      },

      neutralAir: {
        largura: 85,
        altura: 120,
        offsetX: 22,
        offsetY: -5,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: -20, offsetY: -90 },
          { largura: 80, altura: 50, offsetX: 0, offsetY: -25 },
        ],
      },

      sideAtack: {
        largura: 85,
        altura: 120,
        offsetX: 30,
        offsetY: 1,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 80, offsetX: -20, offsetY: -40 }],
      },

      downAtack: {
        largura: 85,
        altura: 60,
        offsetX: 36,
        offsetY: 10,
        escala: 1,
        hurtboxes: [{ largura: 80, altura: 60, offsetX: 0, offsetY: -40 }],
      },

      sideAir: {
        largura: 85,
        altura: 120,
        offsetX: 25,
        offsetY: -11,
        escala: 1,
        hurtboxes: [{ largura: 80, altura: 60, offsetX: 0, offsetY: -40 }],
      },

      upAir: {  
        largura: 85,
        altura: 120,
        offsetX: 19,
        offsetY: -5,
        escala: 1,
        hurtboxes: [{ largura: 70, altura: 80, offsetX: 0, offsetY: -50 }],
      },

      downAir: {
        largura: 85,
        altura: 120,
        offsetX: 12,
        offsetY: 12,
        escala: 1,
        hurtboxes: [{ largura: 80, altura: 60, offsetX: 0, offsetY: -40 }],
      },

      neSpecial: {
        largura: 85,
        altura: 120,
        offsetX: 20,
        offsetY: -13,
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
          { largura: 60, altura: 35, offsetX: -3, offsetY: -18 },
        ],
      },
   
   };
    
  
    // ============================ tabela de golpes =====================================
    this.golpes = {
      neutro1: {
        animacao: "ken_atack1",
        frameHitbox: 2,
        offsetX: 50,
        offsetY: -80,
        largura: 55,
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
          knockbackX: 30,
          knockbackY: 0,
          knockbackFixo: true,
        },

        comboProximo: "neutro2",
        comboJanelaInicio: 200,
        comboJanelaFim: 300,
      },

      neutro2: {
        animacao: "ken_atack2",

        frameHitbox: 2,

        offsetX: 55,
        offsetY: -80,
        largura: 55,
        altura: 25,
        duracao: 400,
        propriedades: {
           tipoSomImpacto: "heavy",
          dano: 4,
          knockbackX: 40,
          knockbackY: 0,
          knockbackFixo: true,
        },

        comboProximo: "neutro3",
        comboJanelaInicio: 200,
        comboJanelaFim: 400,
      },

      neutro3: {
        animacao: "ken_atack3",

        frameHitbox: 3,

        offsetX: 55,
        offsetY: -75,
        largura: 60,
        altura: 40,
        duracao: 750,
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
          knockbackX: 350,
          knockbackY: -300,
          tumbling: true
        },
      },

      side: {
        animacao: "ken_sideAtack",
        frameHitbox: 4,
        offsetX: 52,
        offsetY: -60,
        largura: 55,
        altura: 25,
        cooldown: 900,
        duracao: 600,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 550,
          knockbackY: -400,
          tumbling: true,
        },
      },
     agachado: {
        animacao: "ken_downAtack",
        frameHitbox: 3,
        offsetX: 25,
        offsetY: -20,
        largura: 55,
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
          knockbackX: 100,
          knockbackY: -350,
          tumbling: true,
        },
      },

        air_neutro: {
        animacao: "ken_neutralAir",
        frameHitbox: 3,
        offsetX: 30,
        offsetY: -85,
        largura: 60,
        altura: 25,
        cooldown: 900,
        duracao: 350,
         finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 30,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "light",
          dano: 12,
          knockbackX: 550,
          knockbackY: -400,
          tumbling: false,
        },
      },


      air_side: {
        animacao: "ken_sideAir",
        frameHitbox: 3,
        offsetX: 35,
        offsetY: -50,
        largura: 60,
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
          knockbackX: 550,
          knockbackY: -400,
          tumbling: true,
        },
      },
      air_cima: {
        animacao: "ken_upAir",
        frameHitbox: 3,
        offsetX: 25,
        offsetY: -80,
        largura: 60,
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
          knockbackX: 550,
          knockbackY: -400,
          tumbling: true,
        },
      },
      air_agachado: {
        animacao: "ken_downAir",
        frameHitbox: 3,
        offsetX: 30,
        offsetY: -20,
        largura: 60,
        altura: 60,
        cooldown: 900,
        duracao: 900,
        finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 30,
        finalizarAoAcertarOponente: true,
        atrasoFinalizacaoAcerto: 30,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

         movimento: {
    inicio: 80,
    fim: 900,
    x: {
      de: 400,
      para: 500,
    },
    y: {
      de: 500,
      para: 900,
    },

    curva: "easeOut",
  },
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 80,
          knockbackY: 400,
          quiqueChaoY: 350,
        },
      },




    }

    // specials
    this.specials = {
      neutro: {
        animacao: "ken_neSpecial",
        duracao: 1000,
        cooldown: 2000,
        logica: Hadouken,
         som: "hadouken",
         volumeSom: 0.6,
        atrasoProjetil: 300,
        tempoProjetil: 5000,
        velocidadeProjetil: 500,
        escalaProjetil: 1.5,
        profundidadeImpacto: 50,
        offsetProjetilX: 65,
        offsetProjetilY: -70,
        larguraProjetil: 52,
        alturaProjetil: 38,
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 8,
          knockbackX: 320,
          knockbackY: -230,
          tumbling: false,
        },
      },
      lado: {
        animacao: "ken_siSpecial",
        cooldown: 1800,
        logica: Tatsumaki,
         som: "tatsumaki",
         volumeSom: 0.4,
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 15,
          knockbackX: 570,
          knockbackY: -300,
          tumbling: true,
        },
      },

      agachado: {
        animacao: "ken_doSpecial",
        cooldown: 1800,
        logica: Shoryuken,
        som: "shoryuken",
        volumeSom: 0.7,
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 14,
          knockbackX: 250,
          knockbackY: -650,
          tumbling: true,
        },
      },

      air_neutro: {
        animacao: "ken_AneSpecial",
        duracao: 800,
        cooldown: 2000,
        logica: Hadouken,
        som: "hadouken",
        volumeSom: 0.6,
        propriedades: {
          travarMovimentoAir: true,
          tipoSomImpacto: "heavy",
          dano: 8,
          knockbackX: 320,
          knockbackY: -230,
          tumbling: false,
        },
      },

      air_cima: {
        animacao: "ken_AupSpecial",
        cooldown: 2200,
        logica: Shoryuken,
        som: "shoryuken",
        volumeSom: 0.7,
        propriedades: {
          travarMovimentoAir: true,
          tipoSomImpacto: "heavy",
          dano: 14,
          knockbackX: 250,
          knockbackY: -650,
          tumbling: true,
        },
      },

      air_lado: {
        animacao: "ken_AsiSpecial",
        cooldown: 1800,
        logica: Tatsumaki,
        som: "tatsumaki",
        volumeSom: 0.4,
        propriedades: {
          travarMovimentoAir: true,
          tipoSomImpacto: "heavy",
          dano: 15,
          knockbackX: 570,
          knockbackY: -300,
          tumbling: true,
        },
      },

    };

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

    scene.anims.create({
      key: "ken_atack1",
      frames: scene.anims.generateFrameNumbers("Ken_combo1", {
        start: 0,
        end: 4,
      }),
      frameRate: 16,
      repeat: 0,
    });
    scene.anims.create({
      key: "ken_atack2",
      frames: scene.anims.generateFrameNumbers("Ken_combo2", {
        start: 0,
        end: 5,
      }),
      frameRate: 16,
      repeat: 0,
    });
    scene.anims.create({
      key: "ken_atack3",
      frames: scene.anims.generateFrameNumbers("Ken_combo3", {
        start: 0,
        end: 13,
      }),
      frameRate: 18,
      repeat: 0,
    });
    scene.anims.create({
      key: "ken_sideAtack",
      frames: scene.anims.generateFrameNumbers("Ken_sideAtack", {
        start: 0,
        end: 13,
      }),
      frameRate: 18,
      repeat: 0,
    });
    scene.anims.create({
      key: "ken_downAtack",
      frames: scene.anims.generateFrameNumbers("Ken_downAtack", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: 0,
    });
    scene.anims.create({
      key: "ken_neutralAir",
      frames: scene.anims.generateFrameNumbers("Ken_neutralAir", {
        start: 0,
        end: 8,
      }),
      frameRate: 16,
      repeat: 0,
    });
     scene.anims.create({
      key: "ken_upAir",
      frames: scene.anims.generateFrameNumbers("Ken_upAir", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: 0,
    });
     scene.anims.create({
      key: "ken_sideAir",
      frames: scene.anims.generateFrameNumbers("Ken_sideAir", {
        start: 0,
        end: 7,
      }),
      frameRate: 12,
      repeat: 0,
    });
     scene.anims.create({
      key: "ken_downAir",
      frames: scene.anims.generateFrameNumbers("Ken_downAir", {
        start: 0,
        end: 4,
      }),
      frameRate: 12,
      repeat: 0,
    });
    scene.anims.create({
      key: "ken_neSpecial",
      frames: scene.anims.generateFrameNumbers("Ken_neSpecial", {
        start: 0,
        end: 15,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_hadouken_inicio",
      frames: scene.anims.generateFrameNumbers("hadouken1", {
        start: 0,
        end: 9,
      }),
      frameRate: 20,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_hadouken_loop",
      frames: scene.anims.generateFrameNumbers("hadouken1", {
        start: 1,
        end: 9,
      }),
      frameRate: 16,
      repeat: -1,
    });

    scene.anims.create({
      key: "ken_hadouken_impacto",
      frames: scene.anims.generateFrameNumbers("hadouken2", {
        start: 0,
        end: 9,
      }),
      frameRate: 24,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_siSpecial",
      frames: [
        ...scene.anims.generateFrameNumbers("Ken_siSpecial", {
          start: 0,
          end: 4,
        }).map((frame) => ({ ...frame, duration: 25 })),
        ...scene.anims.generateFrameNumbers("Ken_siSpecial", {
          start: 5,
          end: 19,
        }),
        ...scene.anims.generateFrameNumbers("Ken_siSpecial", {
          start: 30,
          end: 35,
        }).map((frame) => ({ ...frame, duration: 70 })),
      ],
      frameRate: 24,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_doSpecial",
      frames: scene.anims.generateFrameNumbers("Ken_doSpecial", {
        start: 0,
        end: 13,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_shoryuken_chamas",
      frames: scene.anims.generateFrameNumbers("flames", {
        start: 0,
        end: 8,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_AneSpecial",
      frames: scene.anims.generateFrameNumbers("Ken_AneSpecial", {
        start: 0,
        end: 12,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_AupSpecial",
      frames: scene.anims.generateFrameNumbers("Ken_doSpecial", {
        start: 2,
        end: 14,
      }),
      frameRate: 20,
      repeat: 0,
    });

    scene.anims.create({
      key: "ken_AsiSpecial",
      frames: scene.anims.generateFrameNumbers("Ken_AsiSpecial", {
        start: 0,
        end: 23,
      }),
      frameRate: 24,
      repeat: 0,
    });
  }
}
