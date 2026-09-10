import Personagem from "./Personagem.js";


export default class FJ extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    FJ.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "fj_idle",
      "0",
      {
        velocidade: 310,
        forcaPulo: -600,
        maxPulos: 2,
        maxDash: 1,
        maxComboIndex: 3,
      },

      teclas,
      "fj_",
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

this.nomePersonagem = "Frederick Johnson";
    this.tauntPausaFinal = 0; // Encerra o taunt sem segurar o último frame.
    //============================= hitboxes ========================================
   
    this.configAnimacoes = {
      
       idle: {
        largura: 250,
        altura: 400,
        offsetX: 130,
        offsetY: -10,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      walk: {
        largura: 250,
        altura: 400,
        offsetX: 145,
        offsetY: -80,
        escala: 0.33,
        hurtboxes: [
           { largura: 50, altura: 20, offsetX: 25, offsetY: -85 },
          { largura: 40, altura: 18, offsetX: 17, offsetY: -57 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      jump: {
        largura: 250,
        altura: 400,
        offsetX: 113,
        offsetY: 134,
        escala: 0.33,
        hurtboxes: [
           { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      
      crouch: {
        largura: 250,
        altura: 240,
        offsetX: 95,
        offsetY: 80,
        escala: 0.33,
        hurtboxes: [
          { largura: 65, altura: 60, offsetX: 0, offsetY: -35 },
        ],
      },
      crouch3: {
        largura: 250,
        altura: 240,
        offsetX: 95,
        offsetY: 80,
        escala: 0.33,
        hurtboxes: [
          { largura: 65, altura: 60, offsetX: 0, offsetY: -35 },
        ],
      },
       

  

      dash: {
        largura: 250,
        altura: 400,
        offsetX: 140,
        offsetY: -80,
        escala: 0.33,
        hurtboxes: [],
      },

      guard: {
        largura: 250,
        altura: 400,
        offsetX: 130,
        offsetY: -50,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 50, offsetX: -5, offsetY: -75 },
          { largura: 50, altura: 50, offsetX: -5, offsetY: -25 },
        ],
      },

        dano: {
  largura: 250,
  altura: 400,
  offsetX: 154,
  offsetY: -80,
  escala: 0.33,
  hurtboxes: [
    { largura: 50, altura: 65, offsetX: -10, offsetY: -60 }, // Tronco inclinado
    { largura: 50, altura: 30, offsetX: 0, offsetY: -15 },   // Pernas
  ],
},


     
      danoUp: {
        largura: 250,
        altura: 400,
        offsetX: 90,
        offsetY: 80,
        escala: 0.33,
        hurtboxes: [
          { largura: 55, altura: 70, offsetX: 20, offsetY: -80 },
          { largura: 45, altura: 40, offsetX: 0, offsetY: -15 },
        ],
      },

      danoSide: {
        largura: 250,
        altura: 400,
        offsetX: 113,
        offsetY: 80,
        escala: 0.33,
        hurtboxes: [
          { largura: 65, altura: 55, offsetX: -15, offsetY: -90 }, // Tronco inclinado
          { largura: 50, altura: 45, offsetX: 30, offsetY: -70 },   // Pernas
        ],
      },
     
      danoDown: {
        largura: 250,
        altura: 400,
        offsetX: 100,
        offsetY: 100,
        escala: 0.33,
        hurtboxes: [
          { largura: 60, altura: 65, offsetX: -10, offsetY: -60 }, 
          { largura: 50, altura: 45, offsetX: 0, offsetY: -10 },
        ],
      },

    
      dead: {
        largura: 250,
        altura: 250,
        offsetX: 113,
        offsetY: 0,
        escala: 0.33,
        hurtboxes: [
          { largura: 100, altura: 34, offsetX: -10, offsetY: -18 },
          { largura: 40, altura: 20, offsetX: -60, offsetY: -12 },
          { largura: 50, altura: 25, offsetX: 50, offsetY: -12 },
        ],
      },

      
      getup: {
        largura: 250,
        altura: 400,
        offsetX: 113,
        offsetY: -70,
        escala: 0.3,
        hurtboxes: [],
      },

      atack1: {
        largura: 250,
        altura: 400,
        offsetX: 130,
        offsetY: -40,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      atack2: {
        largura: 250,
        altura: 400,
        offsetX: 130,
        offsetY: -60,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      atack3: {
         largura: 250,
        altura: 400,
        offsetX: 130,
        offsetY: 20,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      neutralAir: {
         largura: 250,
        altura: 400,
        offsetX: 130,
        offsetY: -10,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      sideAtack: {
         largura: 250,
        altura: 400,
        offsetX: 130,
        offsetY: -10,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      downAtack: {
         largura: 250,
        altura: 400,
        offsetX: 130,
        offsetY: -10,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      sideAir: {
        largura: 85,
        altura: 120,
        offsetX: 25,
        offsetY: -11,
        escala: 1,
        hurtboxes: [{ largura: 55, altura: 80, offsetX: -20, offsetY: -65 }],
      },

      upAir: {  
        largura: 85,
        altura: 120,
        offsetX: 19,
        offsetY: -5,
        escala: 1,
        hurtboxes: [{ largura: 45, altura: 80, offsetX: -20, offsetY: -70 }],
      },

      downAir: {
         largura: 250,
        altura: 400,
        offsetX: 130,
        offsetY: -10,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      neSpecial: {
        largura: 85,
        altura: 120,
        offsetX: 25,
        offsetY: -13,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 55, offsetX: 0, offsetY: -70 },
          { largura: 90, altura: 35, offsetX: -10, offsetY: -18 },
        ], 
      },

      doSpecial: {
        largura: 85,
        altura: 120,
        offsetX: 5,
        offsetY: 44,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 60, altura: 35, offsetX: -3, offsetY: -18 },
        ],
      },

       AneSpecial: {
       largura: 85,
        altura: 120,
        offsetX: 25,
        offsetY: -13,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 55, offsetX: 0, offsetY: -70 },
          { largura: 90, altura: 35, offsetX: -10, offsetY: -18 },
        ], 
      },

      AupSpecial: {
        largura: 85,
        altura: 120,
        offsetX: 5,
        offsetY: 44,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 60, altura: 35, offsetX: -3, offsetY: -18 },
        ],
      },

      siSpecial: {
        largura: 80,
        altura: 110,
        offsetX: 39.5,
        offsetY: 9,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 75, offsetX: 0, offsetY: -65 },
          { largura: 35, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      AsiSpecial: {
        largura: 80,
        altura: 110,
        offsetX: 39.5,
        offsetY: 14,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 75, offsetX: 0, offsetY: -65 },
          { largura: 35, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      AdoSpecial: {
        largura: 90,
        altura: 115,
        offsetX: 38,
        offsetY: 17,
        escala: 1,
        hurtboxes: [
          { largura: 65, altura: 75, offsetX: 0, offsetY: -68 },
          { largura: 70, altura: 40, offsetX: 5, offsetY: -22 },
        ],
      },
   
   };
    
  

    // ============================ tabela de golpes =====================================
   this.golpes = {
      neutro1: {
        animacao: "fj_atack1",
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
          knockbackX: 30,
          knockbackY: -20,
          knockbackFixo: true,
          hitstunFrames: 18,
          hitsSemDecay: 2
        },

        comboProximo: "neutro2",
        comboJanelaInicio: 200,
        comboJanelaFim: 300,
      },

      neutro2: {
        animacao: "fj_atack2",

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
          hitstunFrames: 18,
        },

        comboProximo: "neutro3",
        comboJanelaInicio: 200,
        comboJanelaFim: 400,
      },

      neutro3: {
        animacao: "fj_atack3",

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
          knockbackX: 350,
          knockbackY: -310,
          tumbling: true,
          hitstunBaseFrames: 18
        },
      },

      side: {
        animacao: "fj_sideAtack",
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
          knockbackX: 550,
          knockbackY: -400,
          tumbling: true,
        },
      },
     agachado: {
        animacao: "fj_downAtack",
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
          knockbackX: 40,
          knockbackY: -400,
          tumbling: true,
          knockbackFixo: true,
        },
      },

        air_neutro: {
        animacao: "fj_neutralAir",
        frameHitbox: 3,
        offsetX: 28,
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
          knockbackY: -470,
          tumbling: false,
          knockbackFixo: true,
        },
      },


      air_agachado: {
        animacao: "fj_sideAir",
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
          knockbackX: 450,
          knockbackY: -350,
          tumbling: true,
        },
      },
   }

    // specials
   
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

    if (scene.anims.exists("fj_idle")) return;

    // Idle (Parada)
    scene.anims.create({
      key: "fj_idle",
      frames: scene.anims.generateFrameNumbers("FJ_idle", {
        start: 0,
        end: 29,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "fj_walk",
      frames: scene.anims.generateFrameNumbers("FJ_walk", {
        start: 2,
        end: 8,
      }),
      frameRate: 14,
      repeat: -1,
    });

    scene.anims.create({
      key: "fj_jump",
      frames: scene.anims.generateFrameNumbers("FJ_jump", {
        start: 0,
        end: 10,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "fj_crouch",
      frames: scene.anims.generateFrameNumbers("FJ_crouch1", {
        start: 0,
        end: 2,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "fj_crouch2",
      frames: scene.anims.generateFrameNumbers("FJ_crouch1", {
        start: 2,
        end: 2,
      }),
      frameRate: 10,
      repeat: -1,
    });

    scene.anims.create({
      key: "fj_crouch3",
      frames: scene.anims.generateFrameNumbers("FJ_crouch3", {
        start: 0,
        end: 2,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "fj_dash",
      frames: scene.anims.generateFrameNumbers("FJ_dash", {
        start: 0,
        end: 7,
      }),
      frameRate: 16,
      repeat: 0,
    });

     scene.anims.create({
      key: "fj_guard",
      frames: scene.anims.generateFrameNumbers("FJ_guard", {
        start: 0,
        end: 37,
      }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
      key: "fj_taunt",
      frames: scene.anims.generateFrameNumbers("FJ_taunt", {
        start: 0,
        end: 15,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "fj_dano",
      frames: scene.anims.generateFrameNumbers("FJ_hurt", {
        start: 0,
        end: 1,
      }),
      frameRate: 4,
      repeat: 0,
    });

    scene.anims.create({
     key: "fj_danoUp",
     frames: scene.anims.generateFrameNumbers("FJ_hurt2", { start: 0, end: 8 }),
     frameRate: 14,
     repeat: 0,
   });

    scene.anims.create({
  key: "fj_danoSide",
  frames: scene.anims.generateFrameNumbers("FJ_hurt1", { start: 0, end: 10 }),
  frameRate: 18,
  repeat: 0,
});

scene.anims.create({
  key: "fj_danoDown",
  frames: scene.anims.generateFrameNumbers("FJ_hurt1", { start: 11, end: 14 }),
  frameRate: 12,
  repeat: 0,
});

     scene.anims.create({
     key: "fj_dead",
     frames: scene.anims.generateFrameNumbers("FJ_dead", { start: 0, end: 4 }),
     frameRate: 12,
     repeat: 0,
   });

     scene.anims.create({
     key: "fj_getup",
     frames: scene.anims.generateFrameNumbers("FJ_getup", { start: 0, end: 6 }),
     frameRate: 18,
     repeat: 0,
   });

    scene.anims.create({
      key: "fj_atack1",
      frames: scene.anims.generateFrameNumbers("FJ_neu1", {
        start: 0,
        end: 4,
      }),
      frameRate: 16,
      repeat: 0,
    });
    scene.anims.create({
      key: "fj_atack2",
      frames: scene.anims.generateFrameNumbers("FJ_neu2", {
        start: 0,
        end: 14,
      }),
      frameRate: 18,
      repeat: 0,
    });
    scene.anims.create({
      key: "fj_atack3",
      frames: scene.anims.generateFrameNumbers("FJ_neu3", {
        start: 0,
        end: 13,
      }),
      frameRate: 18,
      repeat: 0,
    });
    scene.anims.create({
      key: "fj_sideAtack",
      frames: scene.anims.generateFrameNumbers("FJ_SideAtack", {
        start: 0,
        end: 8,
      }),
      frameRate: 16,
      repeat: 0,
    });
    scene.anims.create({
      key: "fj_downAtack",
      frames: scene.anims.generateFrameNumbers("FJ_downAtack", {
        start: 0,
        end: 8,
      }),
      frameRate: 14,
      repeat: 0,
    });
    scene.anims.create({
      key: "fj_neutralAir",
      frames: scene.anims.generateFrameNumbers("FJ_AirNeutro", {
        start: 0,
        end: 7,
      }),
      frameRate: 14,
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
      key: "fj_downAir",
      frames: scene.anims.generateFrameNumbers("FJ_airDown", {
        start: 0,
        end: 14,
      }),
      frameRate: 16,
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

    scene.anims.create({
      key: "ken_AdoSpecial",
      frames: scene.anims.generateFrameNumbers("Ken_AdoSpecial", {
        start: 4,
        end: 14,
      }),
      frameRate: 24,
      repeat: 0,
    });
  }
}
