import Personagem from "./Personagem.js";

export default class Slenderman extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    Slenderman.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "Slan_idle",
      "0",
      {
        velocidade: 200,
        forcaPulo: -600,
        maxPulos: 2,
        maxDash: 2,
        maxComboIndex: 2,
      },

      teclas,
      "slan_",
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
    this.nomePersonagem = "Slanderman";
    this.configAnimacoes = {
      idle: {
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 30, offsetX: 20, offsetY: -75 },
          { largura: 50, altura: 20, offsetX: 22, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: 0, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      walk: {
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: -5,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 45, offsetX: -10, offsetY: -60 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      jump: {
        largura: 50,
        altura: 120,
        offsetX: 0,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: 0, offsetY: -90 }, // Tronco/cabeça
          { largura: 30, altura: 50, offsetX: -20, offsetY: -25 }, // parte de baixo parecida
        ],
      },

      dash: {
        largura: 50,
        altura: 120,
        offsetX: 15,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: 0, offsetY: -60 },
          { largura: 50, altura: 25, offsetX: -10, offsetY: -18 },
        ],
      },

      crouch: {
        largura: 50,
        altura: 65,
        offsetX: 0,
        offsetY: 10,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 25, offsetX: 0, offsetY: -35 }, // fechadinho
          { largura: 75, altura: 25, offsetX: 0, offsetY: -20 },
        ],
      },

      guard: {
      largura: 50,
      altura: 120,
      offsetX: 20,
      offsetY: 0,
      escala: 1,
      hurtboxes: [
          { largura: 55, altura: 55, offsetX: -15, offsetY: -65 }, // Tronco/cabeça
          { largura: 60, altura: 10, offsetX: -15, offsetY: -32 },
          { largura: 85, altura: 15, offsetX: -5, offsetY: -18 }, // Agachado / pernas abertas
     ]
      },

       taunt: {
      largura: 50,
      altura: 120,
      offsetX: 25,
      offsetY: 0,
      escala: 1,
      hurtboxes: [
          { largura: 55, altura: 60, offsetX: -5, offsetY: -70 }, // Tronco/cabeça
          { largura: 55, altura: 35, offsetX: -5, offsetY: -18 }, // Agachado / pernas abertas
     ]
      },
      stun: {
        largura: 50,
        altura: 120,
        offsetX: 0,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          
          { largura: 65, altura: 75, offsetX: -10, offsetY: -42 }, // Agachado / pernas abertas
        ],
      },

      dano: {
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 0, offsetY: -70 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      danoUp: {
        largura: 50,
        altura: 120,
        offsetX: 32,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
           { largura: 55, altura: 60, offsetX: 0, offsetY: -95 }, // Tronco/cabeça
          { largura: 55, altura: 35, offsetX: 0, offsetY: -45 },
        ],
      },
      danoDown: {
        largura: 50,
        altura: 120,
        offsetX: 32,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
           { largura: 55, altura: 60, offsetX: 0, offsetY: -90 }, 
          { largura: 55, altura: 35, offsetX: 0, offsetY: -45 }, 
        ], 
      },
      danoSide: {
        largura: 50,
        altura: 120,
        offsetX: 32,
        offsetY: -15,
        escala: 1,
        hurtboxes: [
           { largura: 60, altura: 55, offsetX: 0, offsetY: -75 },  
        ],
      },
      dead: {
        offsetVisualY: 0,
        largura: 70,
        altura: 40,
        offsetX: 35,
        offsetY: 8, // 52 - 40 - 4: mesma base dos estados de dano e idle.
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 15, offsetX: -10, offsetY: -35 },
          { largura: 90, altura: 20, offsetX: 0, offsetY: -15 },
        ],
      },
      getup: {
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: -15,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 25, offsetX: 0, offsetY: -35 }, // fechadinho
          { largura: 75, altura: 25, offsetX: 0, offsetY: -20 },
        ],
      },

      atack1: { largura: 50, altura: 120, offsetX: 37, offsetY: -17, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 30, offsetX: 20, offsetY: -75 },
          { largura: 50, altura: 20, offsetX: 22, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: 0, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      atack2: { largura: 50, altura: 120, offsetX: 29, offsetY: 10, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 30, offsetX: 20, offsetY: -75 },
          { largura: 50, altura: 20, offsetX: 22, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: 0, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      neutralAir: {
        largura: 50,
        altura: 120,
        offsetX: 30,
        offsetY: 25,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 45, offsetX: -20, offsetY: -60 }, // Tronco/cabeça
          { largura: 70, altura: 45, offsetX: 0, offsetY: -35 }, // perna dano
        ],
      },

      sideAtack: {
        largura: 50,
        altura: 120,
        offsetX: 36,
        offsetY: 2,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 80, offsetX: -20, offsetY: -40 }],
      },

      downAtack: {
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: -45,
        escala: 1,
        hurtboxes: [{ largura: 80, altura: 45, offsetX: 0, offsetY: -30 }],
      },

      sideAir: {
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: 10,
        escala: 1,
        hurtboxes: [{ largura: 65, altura: 60, offsetX: -15, offsetY: -40 }],
      },

      downAir: {
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: 10,
        escala: 1,
        hurtboxes: [{ largura: 65, altura: 60, offsetX: -15, offsetY: -40 }],
      },

      upAir: {  
        largura: 50,
        altura: 120,
        offsetX: 16,
        offsetY: 10,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 70, offsetX: -5, offsetY: -50 }],
      },

      neSpecial: {
       largura: 110,
        altura: 96,
        offsetX: 45,
        offsetY: 95,
        escala: 1,
    hurtboxes: [
          { largura: 30, altura: 20, offsetX: -5, offsetY: -70 },
          { largura: 70, altura: 20, offsetX: 12, offsetY: -48 }, // Tronco/cabeça
          { largura: 75, altura: 35, offsetX: 0, offsetY: -18 }, // Agachado / pernas abertas
    ], 
    },

    doSpecial: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
        ],
      },
      counter: {
      largura: 80,
     altura: 95,
     offsetX: 200,
     offsetY: 96,
      escala: 1,
     hurtboxes: []
      },
    siSpecial: {
        largura: 85,
        altura: 95,
        offsetX: 32,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 45, offsetX: -10, offsetY: -60 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      AsiSpecial: {
        largura: 85,
        altura: 95,
        offsetX: 64,
        offsetY: 90,
        escala: 1,
        hurtboxes: [
          { largura: 75, altura: 45, offsetX: -20, offsetY: -60 }, // Tronco/cabeça
        ],
      },

      AupSpecial: {
        largura: 85,
        altura: 95,
        offsetX: 0,
        offsetY: 10,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 45, offsetX: -10, offsetY: -60 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      AneSpecial: {
        offsetVisualX: 19,
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
          { largura: 77, altura: 55, offsetX: -33, offsetY: -50 }, // Tronco/cabeça
          
        ],
      },

      AdoSpecial: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
          { largura: 70, altura: 55, offsetX: -30, offsetY: -65 }, // Tronco/cabeça
          
        ],
      },

     
      teia_side: {
        largura: 85,
        altura: 95,
        offsetX: 47,
        offsetY: -25,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 45, offsetX: -70, offsetY: -60 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -70, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      spider_throw: {
        largura: 85,
        altura: 95,
        offsetX: 350,
        offsetY: 30,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 45, offsetX: 67, offsetY: -60 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: 67, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      siSpecial_miss: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 0, offsetY: -70 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },
   };

    this.sons = {
      ...this.sons,
      vozAtaque: ["sp-atack", "sp-atack2", "sp-atack3"],
      vozDanoNormal: ["sp-hurt", "sp-hurt2"],
      vozDanoForte: ["sp-hurt", "sp-hurt2", "sp-hurt3"],
      volumeVoz: 0.2,
    };


  
    // ============================ tabela de golpes =====================================
    this.golpes = {
      neutro1: {
        animacao: "slan_atack1",
        frameHitbox: 3,
        offsetX: 30,
        offsetY: -90,
        largura: 60,
        altura: 20,
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
          knockbackX: 40,
          knockbackY: -20,
          knockbackFixo: true,
        },

        comboProximo: "neutro2",
        comboJanelaInicio: 150,
        comboJanelaFim: 350,
      },

      neutro2: {
        animacao: "slan_atack2",

        frameHitbox: 2,

        offsetX: 50,
        offsetY: -90,
        largura: 50,
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
          knockbackX: 80,
          knockbackY: -400,
          knockbackFixo: false,
        },

      },

      
      agachado: {
        animacao: "slan_downAtack",
        frameHitbox: 3,
        offsetX: 60,
        offsetY: -25,
        largura: 75,
        altura: 30,
        cooldown: 500,
        duracao: 300,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 6,
          knockbackX: 50,
          knockbackY: -350,
          knockbackFixo: true,
          tumbling: true
          //freioKnockback: 700
        },
      },
      side: {
        animacao: "slan_sideAtack",
        frameHitbox: 3,
        offsetX: 40,
        offsetY: -60,
        largura: 80,
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
        animacao: "slan_neutralAir",
        frameHitbox: 2,
        offsetX: 42,
        offsetY: -70,
        largura: 62,
        altura: 70,
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
        },
      },

      air_agachado: {
  animacao: "slan_downAir",
  frameHitbox: 2,
  offsetX: 34,
  offsetY: -30,
  largura: 60,
  altura: 70,
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
    fim: 900,

    x: {
      de: 80,
      para: 80,
    },

    y: {
      de: 800,
      para: 1200,
    },

    curva: "easeOut",
  },

  propriedades: {
    tipoSomImpacto: "heavy",
    dano: 11,
    knockbackX: 50,
    knockbackY: 400,
    quiqueChaoY: 350,
  },
},

      air_side: {
        animacao: "slan_sideAir",
        frameHitbox: 3,
        offsetX: 34,
        offsetY: -30,
        largura: 65,
        altura: 55,
        cooldown: 500,
        duracao: 350, 
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
        animacao: "slan_upAir",
        frameHitbox: 2,
        offsetX: 17,
        offsetY: -116,
        largura: 55,
        altura: 50,
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
    if (scene.anims.exists("slan_idle")) return;

     scene.anims.create({
      key: "slan_intro",
      frames: scene.anims.generateFrameNumbers("Slan_intro", {
        start: 0,
        end: 11,
      }),
      frameRate: 12,
      repeat: 0,
    });

    // Idle (Parada)
    scene.anims.create({
      key: "slan_idle",
      frames: scene.anims.generateFrameNumbers("Slan_idle", {
        start: 0,
        end: 38,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "slan_walk",
      frames: scene.anims.generateFrameNumbers("Slan_walk", {
        start: 0,
        end: 24,
      }),
      frameRate: 18,
      repeat: -1,
    });

    scene.anims.create({
      key: "slan_jump",
      frames: scene.anims.generateFrameNumbers("Slan_jump", {
        start: 0,
        end: 7,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "slan_crouch",
      frames: scene.anims.generateFrameNumbers("slan_crouch", {
        start: 0,
        end: 5,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "slan_crouch2",
      frames: scene.anims.generateFrameNumbers("slan_crouch", {
        start: 0,
        end: 5,
      }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: "slan_crouch3",
      frames: scene.anims.generateFrameNumbers("slan_crouch", {
        start: 0,
        end: 5,
      }),
      frameRate: 25,
      repeat: 0,
    });


    scene.anims.create({
      key: "slan_dash",
      frames: scene.anims.generateFrameNumbers("Slan_dash", {
        start: 0,
        end: 9,
      }),
      frameRate: 30,
      repeat: 0,
    });

     scene.anims.create({
      key: "slan_guard",
      frames: scene.anims.generateFrameNumbers("Slan_guard", {
        start: 0,
        end: 2,
      }),
      frameRate: 8,
      repeat: 0,
    });

     scene.anims.create({
      key: "slan_taunt",
      frames: scene.anims.generateFrameNumbers("Slan_taunt", {
        start: 0,
        end: 25,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "slan_dano",
      frames: scene.anims.generateFrameNumbers("Slan_hurt2", {
        start: 0,
        end: 0,
      }),
      frameRate: 6,
      repeat: 0,
    });

    scene.anims.create({
     key: "slan_danoUp",
     frames: scene.anims.generateFrameNumbers("Slan_hurt2", { start: 0, end: 1 }),
     frameRate: 8,
     repeat: 0,
   });

    scene.anims.create({
     key: "slan_danoSide",
     frames: scene.anims.generateFrameNumbers("Slan_hurt1", { start: 0, end: 7 }),
     frameRate: 12,
     repeat: 0,
   });

      scene.anims.create({
     key: "slan_danoDown",
     frames: scene.anims.generateFrameNumbers("Slan_hurt2", { start: 1, end: 5 }),
     frameRate: 12,
     repeat: 0,
   });

     scene.anims.create({
     key: "slan_dead",
     frames: scene.anims.generateFrameNumbers("Slan_dead", { start: 0, end: 1 }),
     frameRate: 10,
     repeat: 0,
   });

     scene.anims.create({
     key: "slan_getup",
     frames: scene.anims.generateFrameNumbers("Slan_getup", { start: 0, end: 4 }),
     frameRate: 16,
     repeat: 0,
   });

    scene.anims.create({
    key: "slan_stun",
    frames: scene.anims.generateFrameNumbers("Slan_stun", { start: 0, end: 1 }),
    frameRate: 12,
    repeat: 0
   });
     
//golpes 
    scene.anims.create({
      key: "slan_atack1",
      frames: scene.anims.generateFrameNumbers("Slan_attack1", {
        start: 0,
        end: 5,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "slan_atack2",
      frames: scene.anims.generateFrameNumbers("Slan_attack2", {
        start: 0,
        end: 8,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "slan_sideAtack",
      frames: scene.anims.generateFrameNumbers("Slan_sideAtack", {
        start: 0,
        end:5,
      }),
      frameRate: 12,
      repeat: 0,
    });

     scene.anims.create({
      key: "slan_downAtack",
      frames: scene.anims.generateFrameNumbers("Slan_downAtack", {
        start: 0,
        end: 2,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "slan_neutralAir",
      frames: scene.anims.generateFrameNumbers("Slan_neutralAir", {
        start: 0,
        end: 11,
      }),
      frameRate: 16,
      repeat: 0,
    });


    
    scene.anims.create({
      key: "slan_downAir",
      frames: scene.anims.generateFrameNumbers("Slan_downAir", {
        start: 0,
        end: 11,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "slan_upAir",
      frames: scene.anims.generateFrameNumbers("Slan_upAir", {
        start: 0,
        end: 9,
      }),
      frameRate: 14,
      repeat: 0,
    });

    scene.anims.create({
      key: "slan_sideAir",
      frames: scene.anims.generateFrameNumbers("Slan_sideAir", {
        start: 0,
        end: 9,
      }),
      frameRate: 12,
      repeat: 0,
    });

  }
}
