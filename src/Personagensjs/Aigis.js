import Personagem from "./Personagem.js";


export default class Aigis extends Personagem {



  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    Aigis.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "ai_idle",
      "0",
      {
        velocidade: 270,
        forcaPulo: -600,
        maxPulos: 2,
        maxDash: 1,
        maxComboIndex: 4,
      },

      teclas,
      "ai_",
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

  fumacaPulo: { escala: 0.25, offsetX: 30, offsetY: -10 },

};



this.nomePersonagem = "Aigis";
    this.tauntPausaFinal = 0; // Encerra o taunt sem segurar o último frame.
    //============================= hitboxes ========================================
   
    this.configAnimacoes = {
      
       idle: {
        largura: 250,
        altura: 400,
        offsetX: 0,
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
        offsetX: 0,
        offsetY: -8,
        escala: 0.33,
        hurtboxes: [
           { largura: 50, altura: 20, offsetX: 30, offsetY: -77 },
          { largura: 40, altura: 18, offsetX: 17, offsetY: -57 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      jump: {
        largura: 250,
        altura: 400,
        offsetX: 0,
        offsetY: -10,
        escala: 0.33,
        hurtboxes: [
           { largura: 40, altura: 43, offsetX: 26, offsetY: -105 },
          { largura: 46, altura: 25, offsetX: 32, offsetY: -72 },
          { largura: 18, altura: 40, offsetX: 20, offsetY: -30 },
        ],
      },

      
      crouch: {
        largura: 250,
        altura: 240,
        offsetX: 0,
        offsetY: 74,
        escala: 0.33,
        hurtboxes: [
          { largura: 50, altura: 70, offsetX: 20, offsetY: -38 },
        ],
      },

        crouch2: {
        largura: 250,
        altura: 240,
        offsetX: 0,
        offsetY: 40,
        escala: 0.33,
        hurtboxes: [
          { largura: 50, altura: 70, offsetX: 20, offsetY: -38 },
        ],
      },

      crouch3: {
        largura: 250,
        altura: 240,
        offsetX: 0,
        offsetY: 74,
        escala: 0.33,
        hurtboxes: [
          { largura: 50, altura: 70, offsetX: 20, offsetY: -38 },
        ],
      },
       

      dash: {
        offsetVisualY: 5,
        largura: 250,
        altura: 400,
        offsetX: 125,
        offsetY: -60,
        escala: 0.33,
        hurtboxes: [],
      },

      guard: {
        largura: 250,
        altura: 400,
        offsetX: 0,
        offsetY: -50,  //-49
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 }
        ],
      },
      stun: {
        largura: 250,
        altura: 240,
        offsetX: 95,
        offsetY: 80,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 70, offsetX: 23, offsetY: -38 },
        ],
      },

      taunt: {
        offsetVisualX: 19,
        largura: 250,
        altura: 400,
        offsetX: 150,
        offsetY: -10,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
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
        offsetY: 60,
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
        offsetVisualX: 19, // Pixels na tela: positivo para frente.
        offsetVisualY: 0, // Positivo para baixo; negativo para cima.
        largura: 250,
        altura: 400,
        offsetX: 175,
        offsetY: -40,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      atack2: {
        offsetVisualX: -65,
        offsetVisualY: 0,
        largura: 250,
        altura: 400,
        offsetX: 382,
        offsetY: -60,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 20, offsetX: 20, offsetY: -90 },   
          { largura: 40, altura: 25, offsetX: 20, offsetY: -60 },
          { largura: 85, altura: 40, offsetX: 15, offsetY: -25 },
        ],
      },

      atack3: {
        offsetVisualX: 21,
        offsetVisualY: 0,
         largura: 250,
        altura: 400,
        offsetX: 178,
        offsetY: 22,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      neutralAir: {
        offsetVisualX: 16,
         largura: 250,
        altura: 400,
        offsetX: 190,
        offsetY: 120,
        escala: 0.33,
        hurtboxes: [
          { largura: 40, altura: 43, offsetX: 26, offsetY: -105 },
          { largura: 46, altura: 25, offsetX: 32, offsetY: -72 },
          { largura: 18, altura: 40, offsetX: 20, offsetY: -30 },
        ],
      },

      sideAtack: {
        offsetVisualX: 3,
         largura: 250,
        altura: 400,
        offsetX: 155,
        offsetY: -34,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 15, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 14, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 10, offsetY: -25 },
        ],
      },

      downAtack: {
        offsetVisualX: 33,
        offsetVisualY: 32,
           largura: 250,
        altura: 240,
        offsetX: 198,
        offsetY: 425,
        escala: 0.33,
        hurtboxes: [
          { largura: 50, altura: 70, offsetX: 20, offsetY: -38 }],
      },

      sideAir: {
        largura: 250,
        altura: 400,
        offsetX: 145,
        offsetY: -30,
        escala: 0.33,
        hurtboxes: [
           { largura: 40, altura: 43, offsetX: 26, offsetY: -105 },
          { largura: 46, altura: 25, offsetX: 32, offsetY: -72 },
          { largura: 18, altura: 40, offsetX: 20, offsetY: -30 },
        ],
      },

      upAir: {  
        largura: 250,
        altura: 400,
        offsetX: 113,
        offsetY: 134,
        escala: 0.33,
        hurtboxes: [
           { largura: 40, altura: 43, offsetX: 26, offsetY: -105 },
          { largura: 46, altura: 25, offsetX: 32, offsetY: -72 },
          { largura: 18, altura: 40, offsetX: 20, offsetY: -30 },
        ],
      },

      downAir: {
        offsetVisualX: 18,
         largura: 250,
        altura: 400,
        offsetX: 193,
        offsetY: 140,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

  
   
   };

  //   this.sons = {
  //    ...this.sons,
  //    vozAtaque: [ "fj-atack1", "fj-atack2", "fj-atack3", "fj-atack4" ],
  //    vozDanoNormal: ["fj-hurt2", "fj-hurt3", "fj-hurt1", "fj-hurt4", ],
  //    vozDanoForte: ["fj-hurt5", "fj-hurt6", ],
  //    volumeVoz: 0.25,
  //  };
    
    // ============================ tabela de golpes =====================================

   this.golpes = {
      neutro1: {
        animacao: "ai_atack1",
        frameHitbox: 2,
        offsetX: 60,
        offsetY: -100,
        largura: 65,
        altura: 17,
        cooldown: 700,
        duracao: 320,
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
          hitsSemDecay: 2
        },

        comboProximo: "neutro2",
        comboJanelaInicio: 170,
        comboJanelaFim: 300,
      },

      neutro2: {
        animacao: "ai_atack2",

        frameHitbox: 5,

        offsetX: 55,
        offsetY: -80,
        largura: 33,
        altura: 45,
        duracao: 500,
        cancelavel: true,
        propriedades: {
           tipoSomImpacto: "heavy",
          dano: 4,
          knockbackX: 20,
          knockbackY: -30,
          knockbackFixo: true,
          hitstunFrames: 18,
        },

        comboProximo: "neutro3",
        comboJanelaInicio: 330,
        comboJanelaFim: 460,
      },

      neutro3: {
        animacao: "fj_comboRapido1",
        offsetX: 45,
        offsetY: -75,
        largura: 80,
        altura: 40,
        cancelavel: true,
        comboProximo: "neutro4",
        propriedades: {
          dano: 1,
          knockbackX: 1,
          knockbackY: 0,
          knockbackFixo: true,
          hitstunFrames: 22,
          ignorarHitstunDecay: true,
          tumbling: false,
        },
        vfxAcerto: [{ escolherUm: ["punch1", "punch2", "punch3"] }],
      //  multiHit: {
      //    tipo: "comboRapido",
       //   maxHits: 15, // Conta hitboxes criadas, mesmo sem acertar.
     //     intervaloInput: 250, // Tempo maximo entre novos apertos, em ms.
     //     duracaoCiclo: 250,
      //    hits: [
      //      { inicio: 12.5, duracao: 27.5, offsetY: -82,
       //       animacao: "fj_comboRapido1", antecipacao: 25 },
       //     { inicio: 112, duracao: 27.5, offsetY: -65,
    //          animacao: "fj_comboRapido2", antecipacao: 62 },
      //      { inicio: 200, duracao: 27.5, offsetY: -75,
      //        animacao: "fj_comboRapido3", antecipacao: 25},
      //    ],
      //  },
      },

      neutro4: {
        animacao: "ai_atack3",

        frameHitbox: 3,

        offsetX: 60,
        offsetY: -89,
        largura: 65,
        altura: 26,
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
          knockbackX: 420,
          knockbackY: -350,
          tumbling: true,
          hitstunBaseFrames: 18
        },
      },

      side: {
        animacao: "ai_sideAtack",
    //    multiHit: {
    //      tipo: "automatico",
      //    hits: [
      //      { inicio: 140, duracao: 70, offsetY: -65,
      //        propriedades: { dano: 3, knockbackX: 280, knockbackY: 0,
      //          knockbackFixo: true, tumbling: false, hitstunFrames: 18 } },
      //      { inicio: 240, duracao: 70, offsetX: 40,
       //       propriedades: { dano: 3, knockbackX: 200, knockbackY: -10,
      //          knockbackFixo: true, tumbling: false, hitstunFrames: 18 } },
      //      { inicio: 340, duracao: 70, offsetX: 45,
      //        propriedades: { dano: 6 } }, // Herda o arremesso forte do golpe.
      //    ],
      //  },
        offsetX: 40,
        offsetY: -70,
        largura: 78,
        altura: 34,
        cooldown: 900,
        duracao: 500,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        movimento: {
         inicio: 50,
         fim: 400,
      x: {
         de: 420,
         para: 150,
        },

        curva: "easeIn",
       },

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 100,
          knockbackY: -110,
          tumbling: false,
          knockbackFixo: true,
        },
      },
     agachado: {
        animacao: "ai_downAtack",
        frameHitbox: 3,
        offsetX: 56,
        offsetY: -20,
        largura: 70,
        altura: 45,
        cooldown: 700,
        duracao: 350,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 9,
          knockbackX: 60,
          knockbackY: -350,
          tumbling: false,
          knockbackFixo: true,
          hitstunMinFrames:25,
        },
      },

        air_neutro: {
        animacao: "ai_neutralAir",
        frameHitbox: 3,
        offsetX: 58,
        offsetY: -97,
        largura: 65,
        altura: 25,
        cooldown: 400,
        duracao: 350,
         finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 30,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],
        propriedades: {
          tipoSomImpacto: "light",
          dano: 9,
          knockbackX: 120,
          knockbackY: -470,
          tumbling: false,
          knockbackFixo: true,
          hitstunMinFrames:25,
        },
      },

      air_cima: {
        animacao: "ai_upAir",
        frameHitbox: 3,
        offsetX: 38,
        offsetY: -130,
        largura: 35,
        altura: 55,
        cooldown: 400,
        duracao: 500,
         finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 30,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 9,
          knockbackX: 168,
          knockbackY: -658,
          tumbling: true,
          knockbackFixo: false,
        },
      },

      air_side: {
        animacao: "ai_sideAir",
        frameHitbox: 2,
        offsetX: 40,
        offsetY: -57,
        largura: 75,
        altura: 40,
        cooldown: 650,
        duracao: 450,
         finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 30,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        movimento: {
        inicio: 30,
        fim:200,
         x: {
         de: 800,
         para: 650,
        },

        curva: "easeOut",
       },

        propriedades: {
         // anularGravidade: true,
          tipoSomImpacto: "heavy",
          dano: 9,
          knockbackX: 560,
          knockbackY: -350,
          tumbling: true,
          knockbackFixo: false,
        },
      },


      air_agachado: {
        animacao: "ai_downAir",
        frameHitbox: 3,
        offsetX: 60,
        offsetY: -70,
        largura: 55,
        altura: 40,
        cooldown: 600,
        duracao: 400,
         finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 30,
      

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        movimento: {
        inicio: 30,
        fim:80,
         y: {
         de: 600,
         para: 500,
        },

        curva: "easeOut",
       },

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 10,
          knockbackX: 112,
          knockbackY: 560,
          quiqueChaoY: 400,
          hitstunMinFrames:25,
        },
      },

   }

    // specials ==========================



   
  }

  //animaçoes====================================================
  

  static criarAnimacoes(scene) {
    if (!scene.anims.exists("ai_intro")) {
      scene.anims.create({
        key: "ai_intro",
        frames: scene.anims.generateFrameNumbers("ai_intro", { start: 0, end: 41 }),
        frameRate: 14,
        repeat: 0,
      });
    }


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


    // Idle (Parada)
    scene.anims.create({
      key: "ai_idle",
      frames: scene.anims.generateFrameNumbers("ai_idle", {
        start: 0,
        end: 150,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "ai_walk",
      frames: scene.anims.generateFrameNumbers("ai_walk", {
        start: 0,
        end: 11,
      }),
      frameRate: 14,
      repeat: -1,
    });

    scene.anims.create({
      key: "ai_jump",
      frames: scene.anims.generateFrameNumbers("ai_jump", {
        start: 0,
        end: 8,
      }),
      frameRate: 12,
      repeat: 0,
    });


    scene.anims.create({
      key: "ai_crouch",
      frames: scene.anims.generateFrameNumbers("ai_crouch1", {
        start: 0,
        end: 1,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "ai_crouch2",
      frames: scene.anims.generateFrameNumbers("ai_crouch2", {
        start: 0,
        end: 8,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "ai_crouch3",
      frames: scene.anims.generateFrameNumbers("ai_crouch3", {
        start: 0,
        end: 1,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "ai_dash",
      frames: scene.anims.generateFrameNumbers("ai_dash", {
        start: 0,
        end: 5,
      }),
      frameRate: 16,
      repeat: 0,
    });

     scene.anims.create({
      key: "ai_guard",
      frames: scene.anims.generateFrameNumbers("ai_block", {
        start: 0,
        end: 1,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "ai_taunt",
      frames: scene.anims.generateFrameNumbers("ai_taunt", {
        start: 0,
        end: 11,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "ai_dano",
      frames: scene.anims.generateFrameNumbers("ai_hurt", {
        start: 0,
        end: 1,
      }),
      frameRate: 4,
      repeat: 0,
    });

    scene.anims.create({
     key: "ai_danoUp",
     frames: scene.anims.generateFrameNumbers("ai_hurtup", { start: 0, end: 8 }),
     frameRate: 12,
     repeat: 0,
   });

    scene.anims.create({
  key: "ai_danoSide",
  frames: scene.anims.generateFrameNumbers("ai_hurtside", { start: 0, end: 8 }),
  frameRate: 18,
  repeat: 0,
});

scene.anims.create({
  key: "ai_danoDown",
  frames: scene.anims.generateFrameNumbers("ai_hurtdown", { start: 0, end: 3 }),
  frameRate: 12,
  repeat: 0,
});

     scene.anims.create({
     key: "ai_dead",
     frames: scene.anims.generateFrameNumbers("ai_dead", { start: 0, end: 4 }),
     frameRate: 12,
     repeat: 0,
   });

     scene.anims.create({
     key: "ai_getup",
     frames: scene.anims.generateFrameNumbers("ai_getup", { start: 0, end: 6 }),
     frameRate: 18,
     repeat: 0,
   });

    scene.anims.create({
    key: "ai_stun",
    frames: scene.anims.generateFrameNumbers("ai_stun", { start: 0, end: 3 }),
    frameRate: 8,
    repeat: 0
   });

    scene.anims.create({
      key: "ai_atack1",
      frames: scene.anims.generateFrameNumbers("ai_combo", {
        start: 0,
        end: 4,
      }),
      frameRate: 18,
      repeat: 0,
    });
    scene.anims.create({
      key: "ai_atack2",
      frames: scene.anims.generateFrameNumbers("ai_combo", {
        start: 5,
        end: 12,
      }),
      frameRate: 26,
      repeat: 0,
    });
    scene.anims.create({
      key: "ai_atack3",
      frames: scene.anims.generateFrameNumbers("ai_combo", {
        start: 13,
        end: 20,
      }),
      frameRate: 18,
      repeat: 0,
    });
   
    scene.anims.create({
      key: "ai_sideAtack",
      frames: scene.anims.generateFrameNumbers("ai_sideAtack", {
        start: 0,
        end: 18,
      }),
      frameRate: 18,
      repeat: 0,
    });
    scene.anims.create({
      key: "ai_downAtack",
      frames: scene.anims.generateFrameNumbers("ai_downAtack", {
        start: 0,
        end: 8,
      }),
      frameRate: 22,
      repeat: 0,
    });
    scene.anims.create({
      key: "ai_neutralAir",
      frames: scene.anims.generateFrameNumbers("ai_neutralAir", {
        start: 0,
        end: 9,
      }),
      frameRate: 14,
      repeat: 0,
    });
     scene.anims.create({
      key: "ai_upAir",
      frames: scene.anims.generateFrameNumbers("ai_upAir", {
        start: 0,
        end: 9,
      }),
      frameRate: 18,
      repeat: 0,
    });
     scene.anims.create({
      key: "ai_sideAir",
      frames: scene.anims.generateFrameNumbers("ai_sideAir", {
        start: 0,
        end: 9,
      }),
      frameRate: 12,
      repeat: 0,
    });
     scene.anims.create({
      key: "ai_downAir",
      frames: scene.anims.generateFrameNumbers("ai_downAir", {
        start: 0,
        end: 8,
      }),
      frameRate: 12,
      repeat: 0,
    });
    
  }
}
