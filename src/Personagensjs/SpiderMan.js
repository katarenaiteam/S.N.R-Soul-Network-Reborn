import Personagem from "./Personagem.js";
import WebShot from "./Specials/Spiderman/WebShot.js";
import AirWebShot from "./Specials/Spiderman/AirWebshot.js"; 
import SpiderCounter from "./Specials/Spiderman/SpiderCounter.js";
import SpiderThrow from "./Specials/Spiderman/SpiderThrow.js";
import SpiderSwing from "./Specials/Spiderman/SpiderSwing.js";
import SpiderAupSpecial from "./Specials/Spiderman/AupSpecial.js";
import SpiderUlt from "./Ult/SpiderUlt.js";

export default class SpiderMan extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    SpiderMan.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "SpiderMan_idle",
      "0",
      {
        velocidade: 240,
        forcaPulo: -600,
        maxPulos: 3,
        maxDash: 2,
        maxComboIndex: 3,
      },

      teclas,
      "spy_",
      controle,
    );

    this.animacaoSegundoDash = "dash2";

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
    this.nomePersonagem = "Homem Aranha";
    this.configAnimacoes = {
      idle: {
        largura: 85,
        altura: 96,
        offsetX: 50,
        offsetY: 95,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 30, offsetX: 20, offsetY: -75 },
          { largura: 50, altura: 20, offsetX: 22, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: 0, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      walk: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 45, offsetX: -10, offsetY: -60 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      jump: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: 0, offsetY: -90 }, // Tronco/cabeça
          { largura: 30, altura: 50, offsetX: -20, offsetY: -25 }, // parte de baixo parecida
        ],
      },

      dash: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: 0, offsetY: -60 },
          { largura: 50, altura: 25, offsetX: -10, offsetY: -18 },
        ],
      },

      dash2: {
        largura: 85,
        altura: 95,
        offsetX: 2.5,
        offsetY: 13,
        escala: 1,
        hurtboxes: [
          { largura: 70, altura: 70, offsetX: 0, offsetY: -55 },
        ],
      },

      crouch: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 25, offsetX: 0, offsetY: -35 }, // fechadinho
          { largura: 75, altura: 25, offsetX: 0, offsetY: -20 },
        ],
      },

      guard: {
      largura: 85,
      altura: 95,
      offsetX: 50,
      offsetY: 96,
      escala: 1,
      hurtboxes: [
          { largura: 55, altura: 55, offsetX: -15, offsetY: -65 }, // Tronco/cabeça
          { largura: 60, altura: 10, offsetX: -15, offsetY: -32 },
          { largura: 85, altura: 15, offsetX: -5, offsetY: -18 }, // Agachado / pernas abertas
     ]
      },

       taunt: {
      largura: 85,
      altura: 95,
      offsetX: 50,
      offsetY: 96,
      escala: 1,
      hurtboxes: [
          { largura: 55, altura: 60, offsetX: -5, offsetY: -70 }, // Tronco/cabeça
          { largura: 55, altura: 35, offsetX: -5, offsetY: -18 }, // Agachado / pernas abertas
     ]
      },

      dano: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 0, offsetY: -70 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      danoUp: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
           { largura: 55, altura: 60, offsetX: 0, offsetY: -95 }, // Tronco/cabeça
          { largura: 55, altura: 35, offsetX: 0, offsetY: -45 },
        ],
      },
      danoDown: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
           { largura: 55, altura: 60, offsetX: 0, offsetY: -90 }, 
          { largura: 55, altura: 35, offsetX: 0, offsetY: -45 }, 
        ], 
      },
      danoSide: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
           { largura: 60, altura: 55, offsetX: 0, offsetY: -75 },  
        ],
      },
      dead: {
        largura: 85,
        altura: 42,
        offsetX: 35,
        offsetY: 3, // Ajustado para compensar a folha de 52px de altura
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 15, offsetX: -10, offsetY: -35 },
          { largura: 90, altura: 20, offsetX: 0, offsetY: -15 },
        ],
      },
      getup: {
        largura: 85,
        altura: 95,  // Mantém a altura padrão da física igual aos outros estados em pé
        offsetX: 30,
        offsetY: -6,  // Compensação para os 96px do spritesheet do getup alinhar o pé com o chão
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 25, offsetX: 0, offsetY: -35 }, // fechadinho
          { largura: 75, altura: 25, offsetX: 0, offsetY: -20 },
        ],
      },

      atack: { largura: 85, altura: 95, offsetX: 50, offsetY: 96, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 30, offsetX: 20, offsetY: -75 },
          { largura: 50, altura: 20, offsetX: 22, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: 0, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      neutralAir: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 45, offsetX: -20, offsetY: -60 }, // Tronco/cabeça
          { largura: 70, altura: 45, offsetX: 0, offsetY: -35 }, // perna dano
        ],
      },

      sideAtack: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 80, offsetX: -20, offsetY: -40 }],
      },

      downAtack: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [{ largura: 80, altura: 45, offsetX: 0, offsetY: -30 }],
      },

      sideAir: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [{ largura: 65, altura: 60, offsetX: -15, offsetY: -40 }],
      },

      upAir: {  
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
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
          { largura: 55, altura: 45, offsetX: -10, offsetY: -60 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      AupSpecial: {
        largura: 85,
        altura: 95,
        offsetX: 64,
        offsetY: 90,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 45, offsetX: -10, offsetY: -60 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      AneSpecial: {
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
        animacao: "spy_atack1",
        frameHitbox: 3,
        offsetX: 60,
        offsetY: -60,
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
        animacao: "spy_atack2",

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
          knockbackX: 30,
          knockbackY: -30,
          knockbackFixo: true,
        },

        comboProximo: "neutro3",
        comboJanelaInicio: 200,
        comboJanelaFim: 400,
      },

      neutro3: {
        animacao: "spy_atack3",

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
          knockbackX: 50,
          knockbackY: -500,
          tumbling: true
        },
      },
      agachado: {
        animacao: "spy_downAtack",
        frameHitbox: 4,
        offsetX: 60,
        offsetY: -25,
        largura: 75,
        altura: 30,
        cooldown: 500,
        duracao: 560,
        cancelavel: true,
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
        animacao: "spy_sideAtack",
        frameHitbox: 3,
        offsetX: 52,
        offsetY: -60,
        largura: 60,
        altura: 25,
        cooldown: 900,
        duracao: 300,
        cancelavel: true,

        vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

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
        animacao: "spy_neutralAir",
        frameHitbox: 2,
        offsetX: 34,
        offsetY: -70,
        largura: 60,
        altura: 70,
        cooldown: 500,
        duracao: 300,
        cancelavel: true,
        knockbackFixo: true,

        vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "light",
          dano: 11,
          knockbackX: 90,
          knockbackY: -300,
          tumbling: true
        },
      },

      air_agachado: {
  animacao: "spy_downAir",
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
        animacao: "spy_sideAir",
        frameHitbox: 3,
        offsetX: 34,
        offsetY: -30,
        largura: 65,
        altura: 55,
        cooldown: 500,
        duracao: 350, 
        cancelavel: true,

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
          knockbackY: -100,
          impulsoX: 300,
          tumbling: true
        },
      },

      air_cima: {
        animacao: "spy_upAir",
        frameHitbox: 2,
        offsetX: 15,
        offsetY: -120,
        largura: 50,
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

        movimento: {
    inicio: 0,
    fim: 300,

    y: {
      de: -350,
      para: -200,
    },

    curva: "easeOut",
  },

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 11,
          knockbackX: 60,
          knockbackY: -600,
          impulsoX: 30,
          tumbling: true
        },
      },
    };

  // --------------------------------- tabela especiais --------------------------
    this.specials = {
      neutro: {
        animacao: "spy_neSpecial",
        duracao: 700,
       // cancelavel: true,
        cooldown: 2000,
        logica: WebShot,

         tempoProjetil: 5000,

        propriedades: {
          dano: 5,
          knockbackX: 0,
          knockbackY: 0,
        },
      },

      agachado: {
         animacao: "spy_doSpecial",
         duracao: 600,
         cooldown: 2000,
         logica: SpiderCounter,

        propriedades: {
          dano: 0,
          knockbackX: 0,
          knockbackY: 0,
        },
      },

       lado: {
         animacao: "spy_siSpecial",
         duracao: 99999, // A própria classe SpiderThrow controla o fim através do estado
         cooldown: 2500,
         logica: SpiderThrow,

         propriedades: {
           dano: 18,
        },
      },

      cima: {
        // futuro
      },

       air_neutro: {
        animacao: "spy_AneSpecial",
        duracao: 300,
        cooldown: 2000,
        logica: AirWebShot,
         tempoProjetil: 5000,
        // finalizarAoTocarChao: true,       
        // atrasoFinalizacaoChao: 50,
        // finalizarAoAcertarOponente: false,
        propriedades: {
          dano: 5,
          knockbackX: 0,
          knockbackY: 0,
          anularGravidade: true,
          //impulsoX: 0,                    
          //impulsoY: 0,
          
        },
      },

      air_lado: {
        animacao: "spy_AsiSpecial",
        duracao: 9999,
        cooldown: 2000,
        logica: SpiderSwing,
        // finalizarAoTocarChao: true,       
        // atrasoFinalizacaoChao: 50,
        // finalizarAoAcertarOponente: false,
        propriedades: {
          travarMovimentoAir: true,
          dano: 21,
          knockbackX: 600,
          knockbackY: -10,
          anularGravidade: true,
          //impulsoX: 0,                    
          //impulsoY: 0,
          
        },
      },

      air_cima: {
        animacao: "spy_AupSpecial",
        duracao: 1600,
        cooldown: 2200,
        atrasoDisparo: 50,
        duracaoPuxao: 230,
        duracaoStun: 650,
        logica: SpiderAupSpecial,
        propriedades: {
          anularGravidade: true,
          travarMovimentoAir: true,
          impulsoAoAncorarX: 230,
          impulsoAoAncorarY: -780,
        },
      },
    };
    //-------------------------- ult ------------------------------------
  
    this.ult = {
  animacao: "spy_ult1", // Animação inicial
  logica: SpiderUlt,     // Passa a classe da classe criada
  propriedades: {
    anularGravidade: true // Trava no ar durante a cena
  }
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


    // Se a animação "idle" já existe na cena, não recria
    if (scene.anims.exists("spy_idle")) return;

    // Idle (Parada)
    scene.anims.create({
      key: "spy_idle",
      frames: scene.anims.generateFrameNumbers("SpiderMan_idle", {
        start: 0,
        end: 8,
      }),
      frameRate: 14,
      repeat: -1,
    });

    scene.anims.create({
      key: "spy_walk",
      frames: scene.anims.generateFrameNumbers("SpiderMan_walk", {
        start: 0,
        end: 11,
      }),
      frameRate: 14,
      repeat: -1,
    });

    scene.anims.create({
      key: "spy_jump",
      frames: scene.anims.generateFrameNumbers("SpiderMan_jump", {
        start: 0,
        end: 8,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_crouch",
      frames: scene.anims.generateFrameNumbers("SpiderMan_down", {
        start: 0,
        end: 3,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_crouch2",
      frames: scene.anims.generateFrameNumbers("SpiderMan_down", {
        start: 3,
        end: 3,
      }),
      frameRate: 10,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_crouch3",
      frames: scene.anims.generateFrameNumbers("SpiderMan_down", {
        start: 3,
        end: 5,
      }),
      frameRate: 15,
      repeat: 0,
    });


    scene.anims.create({
      key: "spy_dash",
      frames: scene.anims.generateFrameNumbers("SpiderMan_dash2", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_dash2",
      frames: scene.anims.generateFrameNumbers("Spiderflip", { start: 0, end: 8 }),
      frameRate: 36,
      repeat: 0,
    });

     scene.anims.create({
      key: "spy_guard",
      frames: scene.anims.generateFrameNumbers("SpiderMan_guard", {
        start: 0,
        end: 4,
      }),
      frameRate: 16,
      repeat: 0,
    });

     scene.anims.create({
      key: "spy_taunt",
      frames: scene.anims.generateFrameNumbers("SpiderMan_taunt1", {
        start: 0,
        end: 3,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_dano",
      frames: scene.anims.generateFrameNumbers("SpiderMan_hurt", {
        start: 0,
        end: 2,
      }),
      frameRate: 6,
      repeat: 0,
    });

    scene.anims.create({
     key: "spy_danoUp",
     frames: scene.anims.generateFrameNumbers("SpiderMan_hurts", { start: 3, end: 8 }),
     frameRate: 12,
     repeat: 0,
   });

    scene.anims.create({
     key: "spy_danoSide",
     frames: scene.anims.generateFrameNumbers("SpiderMan_hurts", { start: 0, end: 2 }),
     frameRate: 10,
     repeat: 0,
   });

      scene.anims.create({
     key: "spy_danoDown",
     frames: scene.anims.generateFrameNumbers("SpiderMan_hurts", { start: 9, end: 15 }),
     frameRate: 10,
     repeat: 0,
   });

     scene.anims.create({
     key: "spy_dead",
     frames: scene.anims.generateFrameNumbers("SpiderMan_dead", { start: 0, end: 2 }),
     frameRate: 10,
     repeat: 0,
   });

     scene.anims.create({
     key: "spy_getup",
     frames: scene.anims.generateFrameNumbers("SpiderMan_getup", { start: 0, end: 6 }),
     frameRate: 16,
     repeat: 0,
   });

     
//golpes 
    scene.anims.create({
      key: "spy_atack1",
      frames: scene.anims.generateFrameNumbers("SpiderMan_atack1", {
        start: 0,
        end: 4,
      }),
      frameRate: 22,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_atack2",
      frames: scene.anims.generateFrameNumbers("SpiderMan_atack2", {
        start: 0,
        end: 8,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_atack3",
      frames: scene.anims.generateFrameNumbers("SpiderMan_atack3", {
        start: 0,
        end: 6,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_sideAtack",
      frames: scene.anims.generateFrameNumbers("SpiderMan_sideAtack", {
        start: 0,
        end: 2,
      }),
      frameRate: 14,
      repeat: 0,
    });

     scene.anims.create({
      key: "spy_downAtack",
      frames: scene.anims.generateFrameNumbers("SpiderMan_downAtack", {
        start: 0,
        end: 6,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_neutralAir",
      frames: scene.anims.generateFrameNumbers("SpiderMan_neutralAir", {
        start: 0,
        end: 4,
      }),
      frameRate: 16,
      repeat: 0,
    });


    
    scene.anims.create({
      key: "spy_downAir",
      frames: scene.anims.generateFrameNumbers("SpiderMan_downAir", {
        start: 0,
        end: 2,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_upAir",
      frames: scene.anims.generateFrameNumbers("SpiderMan_upAir", {
        start: 0,
        end: 5,
      }),
      frameRate: 14,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_sideAir",
      frames: scene.anims.generateFrameNumbers("SpiderMan_sideAir", {
        start: 0,
        end: 4,
      }),
      frameRate: 13,
      repeat: 0,
    });
//specials
     scene.anims.create({
      key: "spy_neSpecial",
      frames: scene.anims.generateFrameNumbers("SpiderMan_neSpecial", {
        start: 0,
        end: 9,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
  key: "spy_webShot",
  frames: scene.anims.generateFrameNumbers("webshot", {
    start: 4,
    end: 9,
  }),
  frameRate: 12,
  repeat: -1,
});

scene.anims.create({
      key: "spy_AneSpecial",
      frames: scene.anims.generateFrameNumbers("SpiderMan_AneSpecial", {
        start: 0,
        end: 8,
      }),
      frameRate: 28,
      repeat: 0,
    });

// Animação 1: Teia cobrindo o alvo (trava no frame final enquanto estiver preso)
    if (!scene.anims.exists("spy_web_trap_start")) {
      scene.anims.create({
        key: "spy_web_trap_start",
        frames: scene.anims.generateFrameNumbers("webshot", {
          start: 10,
          end: 13,
        }),
        frameRate: 12,
        repeat: 0,
      });
    }

    // Animação 2: Teia se desfazendo / somindo
    if (!scene.anims.exists("spy_web_trap_end")) {
      scene.anims.create({
        key: "spy_web_trap_end",
        frames: scene.anims.generateFrameNumbers("webshot", {
          start: 15,
          end: 20,
        }),
        frameRate: 14,
        repeat: 0,
      });
    }

    scene.anims.create({
      key: "spy_doSpecial",
      frames: scene.anims.generateFrameNumbers("SpiderMan_doSpecial", {
        start: 0,
        end: 3,
      }),
      frameRate: 12,
      repeat: 0,
    });

      if (!scene.anims.exists("spy_counter")) {
      scene.anims.create({
        key: "spy_counter",
        frames: scene.anims.generateFrameNumbers("Counter", { start: 0, end: 6,}),
        frameRate: 9,
        repeat: 0,
      });
    }
    
   scene.anims.create({
     key: "spy_siSpecial",
     frames: scene.anims.generateFrameNumbers("SpiderMan_siSpecial", { start: 0, end: 5 }),
     frameRate: 18,
     repeat: 0,
   });

   scene.anims.create({
     key: "spy_teia_side",
     frames: scene.anims.generateFrameNumbers("Side_teia", { start: 0, end: 3 }),
     frameRate: 14,
     repeat: 0,
   });

   scene.anims.create({
     key: "spy_siSpecial_miss",
     frames: scene.anims.generateFrameNumbers("SpiderMan_siSpecial", { start: 5, end: 7 }),
     frameRate: 16,
     repeat: 0,
   });

   scene.anims.create({
     key: "spy_spider_throw",
     frames: scene.anims.generateFrameNumbers("Spider_throw", { start: 0, end: 34 }),
     frameRate: 16,
     repeat: 0,
   });

scene.anims.create({
  key: "spy_AsiSpecial",
  frames: scene.anims.generateFrameNumbers("SpiderMan_AsiSpecial", {
    start: 0,
    end: 34,
  }),
  frameRate: 50,
  repeat: 0,
});

scene.anims.create({
  key: "spy_spiderflip",
  frames: scene.anims.generateFrameNumbers("Spiderflip", {
    start: 0,
    end: 8,
  }),
  frameRate: 18,
  repeat: 0,
});

if (!scene.anims.exists("spy_AupSpecial")) {
  scene.anims.create({
    key: "spy_AupSpecial",
    frames: scene.anims.generateFrameNumbers("Sp_AupSpecial", { start: 0, end: 0 }),
    frameRate: 1,
    repeat: 0,
  });
}

if (!scene.anims.exists("spy_teia_grow")) {
  scene.anims.create({
    key: "spy_teia_grow",
    frames: scene.anims.generateFrameNumbers("teiagrow", { start: 0, end: 12 }),
    frameRate: 56,
    repeat: 0,
  });
}

if (!scene.anims.exists("spy_extra_grow")) {
  scene.anims.create({
    key: "spy_extra_grow",
    frames: scene.anims.generateFrameNumbers("extragrow", { start: 0, end: 10 }),
    frameRate: 52,
    repeat: 0,
  });
}

if (!scene.anims.exists("spy_teia_broke")) {
  scene.anims.create({
    key: "spy_teia_broke",
    frames: scene.anims.generateFrameNumbers("teiabroke", { start: 0, end: 3 }),
    frameRate: 28,
    repeat: 0,
  });
}

scene.anims.create({
  key: "spy_ult0",
  frames: scene.anims.generateFrameNumbers("SpiderMan_ult0", {
    start: 0,
    end: 2,
  }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "spy_ult00",
  frames: scene.anims.generateFrameNumbers("SpiderMan_ult0", {
    start: 1,
    end: 2,
  }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "spy_ult1",
  frames: scene.anims.generateFrameNumbers("SpiderMan_ult1", {
    start: 0,
    end: 6,
  }),
  frameRate: 10,
  repeat: 0,
});

scene.anims.create({
  key: "spy_ult2",
  frames: scene.anims.generateFrameNumbers("SpiderMan_ult2", {
    start: 0,
    end: 3,
  }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "spy_ult3",
  frames: scene.anims.generateFrameNumbers("SpiderMan_ult3", {
    start: 0,
    end: 5,
  }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "spy_ult35",
  frames: scene.anims.generateFrameNumbers("SpiderMan_ult3", {
    start: 6,
    end: 11,
  }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "spy_ult4",
  frames: scene.anims.generateFrameNumbers("SpiderMan_ult4", {
    start: 0,
    end: 5,
  }),
  frameRate: 16,
  repeat: 0,
});

scene.anims.create({
  key: "spy_ult5",
  frames: scene.anims.generateFrameNumbers("SpiderMan_ult5", {
    start: 0,
    end: 9,
  }),
  frameRate: 10,
  repeat: 0,
});

scene.anims.create({
  key: "spy_ult55",
  frames: scene.anims.generateFrameNumbers("SpiderMan_ult5", {
    start: 9,
    end: 9,
  }),
  frameRate: 10,
  repeat: -1,
});

scene.anims.create({
  key: "spy_ult6",
  frames: scene.anims.generateFrameNumbers("SpiderMan_ult6", {
    start: 0,
    end: 38,  //43
  }),
  frameRate: 36,
  repeat: 0,
});

scene.anims.create({
  key: "spy_ult7",
  frames: scene.anims.generateFrameNumbers("SpiderMan_ult7", {
    start: 0,
    end: 14,
  }),
  frameRate: 22,
  repeat: 0,
});

scene.anims.create({
  key: "spy_ult8",
  frames: scene.anims.generateFrameNumbers("SpiderMan_ult8", {
    start: 0,
    end: 3,
  }),
  frameRate: 16,
  repeat: 0,
});

  }
}
