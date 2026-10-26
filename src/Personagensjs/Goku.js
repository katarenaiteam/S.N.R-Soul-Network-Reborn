import Personagem from "./Personagem.js";


export default class Goku extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    Goku.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "gk_idle",
      "0",
      {
        velocidade: 260,
        forcaPulo: -600,
        maxPulos: 2,
        maxDash: 2,
        maxComboIndex: 3,
      },

      teclas,
      "gk_",
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
    this.nomePersonagem = "Goku";
    this.configAnimacoes = {
      idle: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: -7,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 30, offsetX: 20, offsetY: -75 },
          { largura: 50, altura: 20, offsetX: 22, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: 0, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      walk: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: 6,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 45, offsetX: -10, offsetY: -60 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      jump: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: 32,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: 0, offsetY: -90 }, // Tronco/cabeça
          { largura: 30, altura: 50, offsetX: -20, offsetY: -25 }, // parte de baixo parecida
        ],
      },

      dash: {
        largura: 85,
        altura: 100,
        offsetX: 50,
        offsetY: -3.45,
        escala: 1,
        hurtboxes: [
          
        ],
      },


      crouch: {
        largura: 85,
        altura: 100,
        offsetX: -1,
        offsetY: -8,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 25, offsetX: 0, offsetY: -35 }, // fechadinho
          { largura: 75, altura: 25, offsetX: 0, offsetY: -20 },
        ],
      },

      guard: {
      largura: 85,
      altura: 100,
      offsetX: -1,
      offsetY: -12,
      escala: 1,
      hurtboxes: [
          { largura: 55, altura: 55, offsetX: -15, offsetY: -65 }, // Tronco/cabeça
          { largura: 60, altura: 10, offsetX: -15, offsetY: -32 },
          { largura: 85, altura: 15, offsetX: -5, offsetY: -18 }, // Agachado / pernas abertas
     ]
      },

       taunt: {
      largura: 85,
      altura: 100,
      offsetX: 0,
      offsetY: -11,
      escala: 1,
      hurtboxes: [
          { largura: 55, altura: 60, offsetX: -5, offsetY: -70 }, // Tronco/cabeça
          { largura: 55, altura: 35, offsetX: -5, offsetY: -18 }, // Agachado / pernas abertas
     ]
      },
      stun: {
        largura: 85,
        altura: 76,
        offsetX: 0,
        offsetY: 35,
        escala: 1,
        hurtboxes: [
          
          { largura: 65, altura: 75, offsetX: -10, offsetY: -42 }, // Agachado / pernas abertas
        ],
      },

      dano: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: -5,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 0, offsetY: -70 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      danoUp: {
        largura: 85,
        altura: 100,
        offsetX: 5,
        offsetY: 20,
        escala: 1,
        hurtboxes: [
           { largura: 55, altura: 60, offsetX: 0, offsetY: -95 }, // Tronco/cabeça
          { largura: 55, altura: 35, offsetX: 0, offsetY: -45 },
        ],
      },
      danoDown: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
           { largura: 55, altura: 60, offsetX: 0, offsetY: -90 }, 
          { largura: 55, altura: 35, offsetX: 0, offsetY: -45 }, 
        ], 
      },
      danoSide: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: 20,
        escala: 1,
        hurtboxes: [
           { largura: 60, altura: 55, offsetX: 0, offsetY: -75 },  
        ],
      },
      dead: {
        largura: 85,
        altura: 42,
        offsetX: 35,
        offsetY: 27, // Ajustado para compensar a folha de 52px de altura
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 15, offsetX: -10, offsetY: -35 },
          { largura: 90, altura: 20, offsetX: 0, offsetY: -15 },
        ],
      },
      getup: {
        largura: 85,
        altura: 100,  // Mantém a altura padrão da física igual aos outros estados em pé
        offsetX: 30,
        offsetY: 10,  // Compensação para os 96px do spritesheet do getup alinhar o pé com o chão
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 25, offsetX: 0, offsetY: -35 }, // fechadinho
          { largura: 75, altura: 25, offsetX: 0, offsetY: -20 },
        ],
      },

      atack1: { largura: 85, altura: 100, offsetX: 12, offsetY: 0, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 30, offsetX: 20, offsetY: -75 },
          { largura: 50, altura: 20, offsetX: 22, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: 0, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      atack2: { largura: 85, altura: 100, offsetX: 20, offsetY: 0, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 30, offsetX: 20, offsetY: -75 },
          { largura: 50, altura: 20, offsetX: 22, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: 0, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      atack3: { largura: 85, altura: 100, offsetX: 35, offsetY: 10, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 30, offsetX: 20, offsetY: -75 },
          { largura: 50, altura: 20, offsetX: 22, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: 0, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      neutralAir: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 45, offsetX: -20, offsetY: -60 }, // Tronco/cabeça
          { largura: 70, altura: 45, offsetX: 0, offsetY: -35 }, // perna dano
        ],
      },

      sideAtack: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: 0,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 80, offsetX: -20, offsetY: -40 }],
      },

      downAtack: {
        largura: 85,
        altura: 100,
        offsetX: 30,
        offsetY: -13,
        escala: 1,
        hurtboxes: [{ largura: 80, altura: 45, offsetX: 0, offsetY: -30 }],
      },

      sideAir: {
        largura: 85,
        altura: 100,
        offsetX: 30,
        offsetY: 10,
        escala: 1,
        hurtboxes: [{ largura: 65, altura: 60, offsetX: -15, offsetY: -40 }],
      },

      upAir: {  
        largura: 85,
        altura: 100,
        offsetX: 30,
        offsetY: 10,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 70, offsetX: -5, offsetY: -50 }],
      },


    
   };

    // Frame de intro 126x134; idle 200x200. Preserva corpo e escala no mundo.
    this.configAnimacoes.intro = {
      ...this.configAnimacoes.idle, offsetX: 13, offsetY: 29,
    };

  //  this.sons = {
  //    ...this.sons,
  //    vozAtaque: ["sp-atack", "sp-atack2", "sp-atack3"],
  //    vozDanoNormal: ["sp-hurt", "sp-hurt2"],
  //    vozDanoForte: ["sp-hurt", "sp-hurt2", "sp-hurt3"],
   //   volumeVoz: 0.2,
  //  };


  
    // ============================ tabela de golpes =====================================
    this.golpes = {
      neutro1: {
        animacao: "gk_atack1",
        frameHitbox: 3,
        offsetX: 60,
        offsetY: -60,
        largura: 60,
        altura: 20,
        cooldown: 700,
        duracao: 300,
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
          hitstunBaseFrames: 25
        },

        comboProximo: "neutro2",
        comboJanelaInicio: 150,
        comboJanelaFim: 350,
      },

      neutro2: {
        animacao: "gk_atack2",

        frameHitbox: 2,

        offsetX: 50,
        offsetY: -68,
        largura: 50,
        altura: 35,
        duracao: 350,
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
          knockbackX: 20,
          knockbackY: -30,
          knockbackFixo: true,
          hitstunBaseFrames: 25
        },

        comboProximo: "neutro3",
        comboJanelaInicio: 200,
        comboJanelaFim: 400,
      },

      neutro3: {
        animacao: "gk_atack3",

        frameHitbox: 4,

        offsetX: 45,
        offsetY: -80,
        largura: 35,
        altura: 60,
        duracao: 250,
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

       // bufferInputs: true,
       // bufferJanelaInicio: 50,
       // bufferJanelaFim: 350,
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 8,
          knockbackX: 168,
          knockbackY: -630,
          tumbling: true
        },
      },
      agachado: {
        animacao: "gk_downAtack",
        frameHitbox: 4,
        offsetX: 60,
        offsetY: -25,
        largura: 75,
        altura: 30,
        cooldown: 500,
        duracao: 560,
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
          tumbling: true,
          //freioKnockback: 700
          hitstunMinFrames:25,
        },
      },
      side: {
        animacao: "gk_sideAtack",
        frameHitbox: 3,
        offsetX: 40,
        offsetY: -60,
        largura: 74,
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
         fim: 400,
      x: {
         de: 350,
         para: 150,
        },

        curva: "easeIn",
       },

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 504,
          knockbackY: -420,
          tumbling: true,
          impulsoX: 0,
        },
      },

      air_neutro: {
        animacao: "gk_neutralAir",
        frameHitbox: 2,
        offsetX: 42,
        offsetY: -70,
        largura: 62,
        altura: 70,
        cooldown: 500,
        duracao: 300,
        cancelavel: true,
        

        vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "light",
          dano: 11,
          knockbackX: 130,
          knockbackY: -360,
          tumbling: false,
          knockbackFixo: true,
          hitstunBaseFrames: 25
        },
      },

      air_agachado: {
  animacao: "gk_downAir",
  frameHitbox: 2,
  offsetX: 34,
  offsetY: -25,
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
    knockbackX: 40,
    knockbackY: 560,
    quiqueChaoY: 350,
    hitstunMinFrames:24,
  },
},

      air_side: {
        animacao: "gk_sideAir",
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
          knockbackX: 450,
          knockbackY: -240,
          impulsoX: 350,
          tumbling: true
        },
      },

      air_cima: {
        animacao: "gk_upAir",
        frameHitbox: 2,
        offsetX: 17,
        offsetY: -110,
        largura: 55,
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
          knockbackX: 84,
          knockbackY: -560,
          tumbling: true,
           hitstunMinFrames:23,
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
    if (scene.anims.exists("gk_idle")) return;

 
   // Idle (Parada)
    scene.anims.create({
      key: "gk_intro",
      frames: scene.anims.generateFrameNumbers("gk_intro", {
        start: 0,
        end: 18,
      }),
      frameRate: 12,
      repeat: 0,
    });


    // Idle (Parada)
    scene.anims.create({
      key: "gk_idle",
      frames: scene.anims.generateFrameNumbers("gk_idle", {
        start: 0,
        end: 7,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "gk_walk",
      frames: scene.anims.generateFrameNumbers("gk_walk", {
        start: 0,
        end: 8,
      }),
      frameRate: 14,
      repeat: -1,
    });

    scene.anims.create({
      key: "gk_jump",
      frames: scene.anims.generateFrameNumbers("gk_jump", {
        start: 0,
        end: 6,
      }),
      frameRate: 14,
      repeat: 0,
    });

    scene.anims.create({
      key: "gk_crouch",
      frames: scene.anims.generateFrameNumbers("gk_crouch1", {
        start: 0,
        end: 1,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "gk_crouch2",
      frames: scene.anims.generateFrameNumbers("gk_crouch1", {
        start: 1,
        end: 1,
      }),
      frameRate: 10,
      repeat: 0,
    });

    scene.anims.create({
      key: "gk_crouch3",
      frames: scene.anims.generateFrameNumbers("gk_crouch2", {
        start: 0,
        end: 2,
      }),
      frameRate: 12,
      repeat: 0,
    });


    scene.anims.create({
      key: "gk_dash",
      frames: scene.anims.generateFrameNumbers("gk_dash", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: 0,
    });

     scene.anims.create({
      key: "gk_guard",
      frames: scene.anims.generateFrameNumbers("gk_guard", {
        start: 0,
        end: 0,
      }),
      frameRate: 16,
      repeat: 0,
    });

     scene.anims.create({
      key: "gk_taunt",
      frames: scene.anims.generateFrameNumbers("gk_taunt", {
        start: 0,
        end: 7,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "gk_dano",
      frames: scene.anims.generateFrameNumbers("gk_hurt", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
     key: "gk_danoUp",
     frames: scene.anims.generateFrameNumbers("gk_fly", { start: 0, end: 2 }),
     frameRate: 12,
     repeat: 0,
   });

    scene.anims.create({
     key: "gk_danoSide",
     frames: scene.anims.generateFrameNumbers("gk_fly", { start: 3, end: 5 }),
     frameRate: 10,
     repeat: 0,
   });

      scene.anims.create({
     key: "gk_danoDown",
     frames: scene.anims.generateFrameNumbers("gk_fly1", { start: 0, end: 4 }),
     frameRate: 10,
     repeat: 0,
   });

     scene.anims.create({
     key: "gk_dead",
     frames: scene.anims.generateFrameNumbers("gk_dead", { start: 0, end: 3 }),
     frameRate: 12,
     repeat: 0,
   });

     scene.anims.create({
     key: "gk_getup",
     frames: scene.anims.generateFrameNumbers("gk_getup", { start: 0, end: 10 }),
     frameRate: 16,
     repeat: 0,
   });

    scene.anims.create({
    key: "gk_stun",
    frames: scene.anims.generateFrameNumbers("gk_stun", { start: 0, end: 4 }),
    frameRate: 12,
    repeat: 0
   });
     
//golpes 
    scene.anims.create({
      key: "gk_atack1",
      frames: scene.anims.generateFrameNumbers("gk_atack1", {
        start: 0,
        end: 3,
      }),
      frameRate: 22,
      repeat: 0,
    });

    scene.anims.create({
      key: "gk_atack2",
      frames: scene.anims.generateFrameNumbers("gk_atack2", {
        start: 0,
        end: 5,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "gk_atack3",
      frames: scene.anims.generateFrameNumbers("gk_atack3", {
        start: 0,
        end: 9,
      }),
      frameRate: 22,
      repeat: 0,
    });

    scene.anims.create({
      key: "gk_sideAtack",
      frames: scene.anims.generateFrameNumbers("gk_sideAtack", {
        start: 0,
        end: 7,
      }),
      frameRate: 18,
      repeat: 0,
    });

     scene.anims.create({
      key: "gk_downAtack",
      frames: scene.anims.generateFrameNumbers("gk_downAtack", {
        start: 0,
        end: 5,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "gk_neutralAir",
      frames: scene.anims.generateFrameNumbers("gk_neutralAir", {
        start: 0,
        end: 4,
      }),
      frameRate: 16,
      repeat: 0,
    });


    
    scene.anims.create({
      key: "gk_downAir",
      frames: scene.anims.generateFrameNumbers("gk_downAir", {
        start: 0,
        end: 5,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "gk_upAir",
      frames: scene.anims.generateFrameNumbers("gk_upAir", {
        start: 0,
        end: 7,
      }),
      frameRate: 14,
      repeat: 0,
    });

    scene.anims.create({
      key: "gk_sideAir",
      frames: scene.anims.generateFrameNumbers("gk_sideAir", {
        start: 0,
        end: 6,
      }),
      frameRate: 13,
      repeat: 0,
    });

  }
}
