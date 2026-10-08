import Personagem from "./Personagem.js";
import NeSpecial from "./Specials/Slenderman/NeSpecial.js";
import DoSpecial from "./Specials/Slenderman/DoSpecial.js";
import SlenderUlt from "./Ult/SlenderUlt.js";

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

  arNefect: {
    textura: "Slan_arNefect",
    animacao: "slan_arNefect",
    escala: 1,
    seguir: true,
  },

  arSIefect: {
    textura: "Slan_arSIefect",
    animacao: "slan_arSIefect",
    escala: 1.2,
    seguir: true,
  },
};

    this.vfxAtaqueNormal = {
      porAtaque: {
        // Os offsets partem do centro da hitbox e alinham o corte ao sprite.
        air_neutro: {
          efeito: "arNefect",
          offsetX: -42,
          offsetY: 30,
        },
        air_side: {
          efeito: "arSIefect",
          offsetX: -20.5,
          offsetY: -37,
        },
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
          
          { largura: 45, altura: 110, offsetX: 5, offsetY: -57 }, // Agachado / pernas abertas
        ],
      },

      walk: {
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: -5,
        escala: 1,
        hurtboxes: [
          { largura: 35, altura: 70, offsetX: 0, offsetY: -75 }, // Tronco/cabeça
          { largura: 55, altura: 35, offsetX: -5, offsetY: -18 }, 
        ],
      },

      jump: {
        largura: 50,
        altura: 120,
        offsetX: 0,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
          { largura: 35, altura: 65, offsetX: 0, offsetY: -90 }, // Tronco/cabeça
          { largura: 25, altura: 50, offsetX: 8, offsetY: -26 }, // parte de baixo parecida
        ],
      },

      dash: {
        largura: 50,
        altura: 120,
        offsetX: 15,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
      
        ],
      },

      crouch: {
        largura: 50,
        altura: 65,
        offsetX: 0,
        offsetY: 10,
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 60 , offsetX: 0, offsetY: -35 },
        ],
      },

      guard: {
      largura: 50,
      altura: 120,
      offsetX: 20,
      offsetY: 0,
      escala: 1,
      hurtboxes: [
          { largura: 55, altura: 60, offsetX: 0, offsetY: -75 }, 
          { largura: 50, altura: 20, offsetX: -5, offsetY: -32 },
          { largura: 70, altura: 25, offsetX: -5, offsetY: -14 }, 
     ]
      },

       taunt: {
      largura: 50,
      altura: 120,
      offsetX: 25,
      offsetY: 0,
      escala: 1,
      hurtboxes: [
          { largura: 40, altura: 70, offsetX: -5, offsetY: -75 }, 
          { largura: 40, altura: 35, offsetX: -5, offsetY: -18 },
     ]
      },
      stun: {
        largura: 50,
        altura: 120,
        offsetX: 0,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 40, altura: 70, offsetX: -7, offsetY: -75 },
          { largura: 60, altura: 35, offsetX: 0, offsetY: -25 }, 
        ],
      },

      dano: {
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 70, offsetX: -10, offsetY: -70 }, // Tronco/cabeça
          { largura: 15, altura: 35, offsetX: 5, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      danoUp: {
        largura: 50,
        altura: 120,
        offsetX: 32,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
           { largura: 55, altura: 60, offsetX: -30, offsetY: -95 }, 
          { largura: 55, altura: 35, offsetX: 0, offsetY: -65 },
        ],
      },
      danoDown: {
        largura: 50,
        altura: 120,
        offsetX: 32,
        offsetY: -10,
        escala: 1,
        hurtboxes: [
           { largura: 50, altura: 80, offsetX: 10, offsetY: -65 }, 
          { largura: 50, altura: 35, offsetX: -10, offsetY: -25 }, 
        ], 
      },
      danoSide: {
        largura: 50,
        altura: 120,
        offsetX: 32,
        offsetY: -15,
        escala: 1,
        hurtboxes: [
           { largura: 68, altura: 38, offsetX: -30, offsetY: -75 },
           { largura: 50, altura: 50, offsetX: 20, offsetY: -42 },
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
          { largura: 45, altura: 12, offsetX: -3, offsetY: -32 },
          { largura: 100, altura: 20, offsetX: -3, offsetY: -15 },
        ],
      },
      getup: {
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: -15,
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 60, offsetX: -20, offsetY: -50 },
        ],
      },

      atack1: { offsetVisualX: 15, offsetVisualY: -5, largura: 50, altura: 120, offsetX: 37, offsetY: -17, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 56, offsetX: 0, offsetY: -85 },
          { largura: 45, altura: 20, offsetX: -5, offsetY: -48 }, // Tronco/cabeça
          { largura: 70, altura: 28, offsetX: -5, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      atack2: { largura: 50, altura: 120, offsetX: 29, offsetY: 10, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 30, offsetX: 20, offsetY: -75 },
          { largura: 35, altura: 20, offsetX: 15, offsetY: -48 }, // Tronco/cabeça
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
          { largura: 50, altura: 68, offsetX: 0, offsetY: -65 }, // perna dano
        ],
      },

      sideAtack: {
        offsetVisualX: 18,
        largura: 50,
        altura: 120,
        offsetX: 36,
        offsetY: 2,
        escala: 1,
        hurtboxes: [
           { largura: 35, altura: 70, offsetX: -5, offsetY: -75 },
          { largura: 55, altura: 35, offsetX: -5, offsetY: -18 }, 
        ],
      },

      downAtack: {
        offsetVisualX: 15,
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: -45,
        escala: 1,
        hurtboxes: [{ largura: 40, altura: 55, offsetX: 0, offsetY: -40 }],
      },

      sideAir: {
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: 10,
        escala: 1,
        hurtboxes: [{ largura: 40, altura: 65, offsetX: -5, offsetY: -70 }],
      },

      downAir: {
        largura: 50,
        altura: 120,
        offsetX: 20,
        offsetY: 10,
        escala: 1,
        hurtboxes: [{ largura: 50, altura: 60, offsetX: -15, offsetY: -60 }],
      },

      upAir: {  
        largura: 50,
        altura: 120,
        offsetX: 16,
        offsetY: 10,
        escala: 1,
        hurtboxes: [{ largura: 45, altura: 60, offsetX: -5, offsetY: -90 }],
      },

      neSpecial: {
        largura: 50,
        altura: 120,
        offsetX: 17,
        offsetY: 33,
        escala: 1,
    hurtboxes: [
          { largura: 35, altura: 70, offsetX: 6, offsetY: -75 }, 
          { largura: 55, altura: 35, offsetX: 2, offsetY: -18 },
    ], 
    },

    doSpecial: {
        largura: 50,
        altura: 90,
        offsetX: 33,
        offsetY: 8,
        escala: 1,
        hurtboxes: [
          { largura: 40, altura: 35, offsetX: 30, offsetY: -50 },
          { largura: 80, altura: 30, offsetX: 2, offsetY: -18 },
        ],
      },

    siSpecial: {
        largura: 50,
        altura: 120,
        offsetX: 31,
        offsetY: 4,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 45, offsetX: 0, offsetY: -60 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: -5, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      AsiSpecial: {
        largura: 50,
        altura: 120,
        offsetX: 10,
        offsetY: 38,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 75, offsetX: -6, offsetY: -65 }, // Tronco/cabeça
        ],
      },

      AupSpecial: {
        largura: 50,
        altura: 120,
        offsetX: 70,
        offsetY: 25,
        escala: 1,
        hurtboxes: [
          { largura: 40, altura: 95, offsetX: 5, offsetY: -60 }, // Agachado / pernas juntas
        ],
      },

      AneSpecial: {
        largura: 50,
        altura: 110,
        offsetX: 34,
        offsetY: 2,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 15, offsetY: -70 }, 
          { largura: 77, altura: 35, offsetX: 0, offsetY: -30 }, 
        ],
      },

      AdoSpecial: {
        largura: 50,
        altura: 120,
        offsetX: 9,
        offsetY: 32,
        escala: 1,
        hurtboxes: [
          { largura: 44, altura: 75, offsetX: 0, offsetY: -65 }, // Tronco/cabeça
          
        ],
      },

   };

    //this.sons = {
    //  ...this.sons,
    //  vozAtaque: ["sp-atack", "sp-atack2", "sp-atack3"],
    //  vozDanoNormal: ["sp-hurt", "sp-hurt2"],
    //  vozDanoForte: ["sp-hurt", "sp-hurt2", "sp-hurt3"],
    //  volumeVoz: 0.2,
    //};


  
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
        duracao: 400,
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
          knockbackX: 30,
          knockbackY: -20,
          knockbackFixo: true,
          hitstunFrames: 25,
        },

        comboProximo: "neutro2",
        comboJanelaInicio: 250,
        comboJanelaFim: 400,
      },

      neutro2: {
        animacao: "slan_atack2",

        frameHitbox: 2,

        offsetX: 35,
        offsetY: -93,
        largura: 40,
        altura: 55,
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
          knockbackX: 120,
          knockbackY: -550,
          knockbackFixo: false,
          hitstunMinFrames:25,
        },

      },

      
      agachado: {
        animacao: "slan_downAtack",
        frameHitbox: 3,
        offsetX: 30,
        offsetY: -20,
        largura: 65,
        altura: 30,
        cooldown: 780,
        duracao: 350,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 6,
          knockbackX: 50,
          knockbackY: -400,
          knockbackFixo: true,
          tumbling: true,
          //freioKnockback: 700
          hitstunMinFrames:25,
        },
      },
      side: {
        animacao: "slan_sideAtack",
        frameHitbox: 3,
        offsetX: 37,
        offsetY: -100,
        largura: 85,
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
          knockbackX: 430,
          knockbackY: -280,
          tumbling: true,
        },
      },

      air_neutro: {
        animacao: "slan_neutralAir",
        frameHitbox: 2,
        offsetX: 35,
        offsetY: -80,
        largura: 50,
        altura: 60,
        cooldown: 500,
        duracao: 750,
        cancelavel: true,
        

        vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 50,

        propriedades: {
          tipoSomImpacto: "light",
          dano: 11,
          knockbackX: 90,
          knockbackY: -380,
          tumbling: false,
          knockbackFixo: true,
          hitstunMinFrames:25,
        },
      },

      air_agachado: {
  animacao: "slan_downAir",
  frameHitbox: 2,
  offsetX: 24,
  offsetY: -50,
  largura: 75,
  altura: 47,
  cooldown: 800,

  duracao: 500,

  vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

 // finalizarAoTocarChao: true,
  //atrasoFinalizacaoChao: 90,

 // finalizarAoAcertarOponente: true,
  //atrasoFinalizacaoAcerto: 100,

  movimento: {
    inicio: 30,
    fim: 100,

    x: {
      de: 70,
      para: 60,
    },

    y: {
      de: 600,
      para: 300,
    },

    curva: "easeOut",
  },

  propriedades: {
    tipoSomImpacto: "heavy", 
    dano: 11,
    knockbackX: 70,
    knockbackY: 460,
    quiqueChaoY: 350,
  },
},

      air_side: {
        animacao: "slan_sideAir",
        frameHitbox: 3,
        offsetX: 24,
        offsetY: -65,
        largura: 60,
        altura: 45,
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
          knockbackX: 420,
          knockbackY: -182,
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
          knockbackX: 84,
          knockbackY: -500,
          impulsoX: 30,
          tumbling: true
        },
      },
    };

  // --------------------------------- tabela especiais --------------------------

    this.specials = {
      agachado: {
        animacao: "slan_doSpecial",
        logica: DoSpecial,
        duracao: 875,
        cooldown: 1100,
        cortes: [
          {
            frameProjetil: 2,
            propriedades: { dano: 4, knockbackX: 40, knockbackY: -60, knockbackFixo: true },
          },
          { frameProjetil: 7, propriedades: { dano: 8 } },
        ],
        texturaProjetil: "Slan_doSpecial-efect",
        animacaoProjetil: "slan_doSpecial-efect",
        framesCorte: 3,
        escalaProjetil: 1,
        offsetProjetilX: 20,
        offsetProjetilY: -50,
        hitboxesProjetil: [
          { largura: 115, altura: 55, offsetX: 57, offsetY: 25 },
          { largura: 15, altura: 30, offsetX: 87, offsetY: 25 },
        ],
        propriedades: {
          travarMovimentoAir: true,
          dano: 16,
          tipoSomImpacto: "heavy",
          knockbackX: 390,
          knockbackY: -400,
        },
      },
      lado: {
        animacao: "slan_siSpecial",
        logica: NeSpecial,
        duracao: 600,
        cooldown: 1100,
        frameProjetil: 2,
        texturaProjetil: "Slan_siSpecial-efect",
        animacaoProjetil: "slan_siSpecial-efect",
        multiplicadorVelocidadeAnimacaoProjetil: 0.8,
        duracaoCorteExtraMs: 600,
        framesCorte: 2,
        escalaProjetil: 1,
        offsetProjetilX: 20,
        offsetProjetilY: -70,
        velocidadeProjetil: 60,
        distanciaProjetil: 60,
        hitboxesProjetil: [
          { largura: 110, altura: 55, offsetX: 45, offsetY: -15 },
          { largura: 110, altura: 60, offsetX: -25, offsetY: 25 },
        ],
        propriedades: {
          travarMovimentoAir: true,
          dano: 12,
          tipoSomImpacto: "heavy",
          knockbackX: 600,
          knockbackY: -299,
        },
      },
      neutro: {
        animacao: "slan_neSpecial",
        logica: NeSpecial,
        duracao: 700,
        cooldown: 1100,
        multiplicadorVelocidadeAnimacaoProjetil: 0.8,
        duracaoCorteExtraMs: 600,
        framesCorte: 3,
        frameProjetil: 1,
        escalaProjetil: 1,
        offsetProjetilX: 20,
        offsetProjetilY: -96,
        hitboxesProjetil: [
          { largura: 100, altura: 80, offsetX: -5, offsetY: -20 },
          { largura: 100, altura: 70, offsetX: 45, offsetY: 60 },
        ],
        propriedades: {
          dano: 12,
          tipoSomImpacto: "heavy",
          knockbackX: 400,
          knockbackY: -500,
        },
      },
    };

   
    this.specials.air_cima = {
      animacao: "slan_AupSpecial",
      duracao: 900,
      cooldown: 2500,
      propriedades: {
        impulsoX: 350,
        impulsoY: -800,
        travarMovimentoAir: true,
        velocidadeMaxQueda: 100,
      },
    };
    this.specials.air_lado = {
      ...this.specials.lado,
      animacao: "slan_AsiSpecial",
      duracao: 563,
      frameProjetil: 10,
      texturaProjetil: "Slan_AsiSpecial-efect",
      animacaoProjetil: "slan_AsiSpecial-efect",
      propriedades: {
        ...this.specials.lado.propriedades,
        travarMovimentoAir: false,
        velocidadeMaxQueda: 100,
      },
    };

    this.specials.air_neutro = {
      ...this.specials.lado,
      animacao: "slan_AneSpecial",
      duracao: 500,
      frameProjetil: 2,
      texturaProjetil: "Slan_AneSpecial-efect",
      animacaoProjetil: "slan_AneSpecial-efect",
      velocidadeProjetil: undefined,
      distanciaProjetil: undefined,
      distanciaProjetilY: undefined,
      propriedades: {
        ...this.specials.lado.propriedades,
        velocidadeMaxQueda: 100,
      },
    };

    this.specials.air_agachado = {
      ...this.specials.lado,
      animacao: "slan_AdoSpecial",
      duracao: 688,
      frameProjetil: 3,
      texturaProjetil: "Slan_AdoSpecial-efect",
      animacaoProjetil: "slan_AdoSpecial-efect",
      framesCorte: 2,
      offsetProjetilX: 5,
      offsetProjetilY: -30,
      velocidadeProjetil: 50,
      distanciaProjetil: 40,
      distanciaProjetilY: 40,
      hitboxesProjetil: [
        { largura: 75, altura: 90, offsetX: -35, offsetY: -40 },
        { largura: 85, altura: 80, offsetX: 20, offsetY: 25 },  
        { largura: 85, altura: 80, offsetX: 45, offsetY: 50 },
      ],
      propriedades: {
        ...this.specials.lado.propriedades,
        knockbackX: 195,
        knockbackY: 400,
        velocidadeMaxQueda: 100,
      },
    };
    for (const golpe of Object.values(this.golpes)) {
      golpe.propriedades.corrupcaoSlender = 5;
    }
    for (const special of Object.values(this.specials)) {
      special.propriedades.corrupcaoSlender = 10;
    }

    this.ult = {
      animacao: "slan-ult1",
      logica: SlenderUlt,
      propriedades: { anularGravidade: true },
    };
  

  }

  //animaçoes====================================================
  static criarAnimacoes(scene) {

    for (const [key, textura, inicio, fim, fps] of [
      ["slan-ult1", "slan-ult1", 0, 1, 12],
      ["slan-ult5", "slan-ult5", 0, 17, 18],
    ]) {
      if (!scene.anims.exists(key)) scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(textura, { start: inicio, end: fim }),
        frameRate: fps,
        repeat: 0,
      });
    }

    for (const { key, textura, inicio, fim, fps } of [
      { key: "slan_AupSpecial", textura: "Slan_AupSpecial", inicio: 0, fim: 16, fps: 16 },
      { key: "slan_AsiSpecial", textura: "Slan_AsiSpecial", inicio: 9, fim: 17, fps: 16 },
      { key: "slan_AneSpecial", textura: "Slan_AneSpecial", inicio: 0, fim: 7, fps: 16 },
      { key: "slan_AdoSpecial", textura: "Slan_AdoSpecial", inicio: 0, fim: 10, fps: 16 },
      { key: "slan_AsiSpecial-efect", textura: "Slan_AsiSpecial-efect", inicio: 0, fim: 8, fps: 10 },
      { key: "slan_AneSpecial-efect", textura: "Slan_AneSpecial-efect", inicio: 0, fim: 8, fps: 10 },
      { key: "slan_AdoSpecial-efect", textura: "Slan_AdoSpecial-efect", inicio: 0, fim: 7, fps: 10 },
    ]) {
      if (!scene.anims.exists(key)) {
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(textura, { start: inicio, end: fim }),
          frameRate: fps,
          repeat: 0,
        });
      }
    }

    if (!scene.anims.exists("slan_doSpecial")) {
      scene.anims.create({
        key: "slan_doSpecial",
        frames: scene.anims.generateFrameNumbers("Slan_doSpecial", { start: 0, end: 13 }),
        frameRate: 16,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("slan_doSpecial-efect")) {
      scene.anims.create({
        key: "slan_doSpecial-efect",
        frames: scene.anims.generateFrameNumbers("Slan_doSpecial-efect", { start: 0, end: 2 }),
        frameRate: 14,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("slan_siSpecial")) {
      scene.anims.create({
        key: "slan_siSpecial",
        frames: scene.anims.generateFrameNumbers("Slan_siSpecial", { start: 0, end: 9 }),
        frameRate: 16,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("slan_siSpecial-efect")) {
      scene.anims.create({
        key: "slan_siSpecial-efect",
        frames: scene.anims.generateFrameNumbers("Slan_siSpecial-efect", { start: 0, end: 8 }),
        frameRate: 10,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("slan_neSpecial")) {
      scene.anims.create({
        key: "slan_neSpecial",
        frames: scene.anims.generateFrameNumbers("Slan_neSpecial", { start: 0, end: 6 }),
        frameRate: 14,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("slan_NS-efect")) {
      scene.anims.create({
        key: "slan_NS-efect",
        frames: scene.anims.generateFrameNumbers("Slan_NS-efect", { start: 0, end: 9 }),
        frameRate: 14,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("slan_arNefect")) {
      scene.anims.create({
        key: "slan_arNefect",
        frames: scene.anims.generateFrameNumbers("Slan_arNefect"),
        frameRate: 16,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("slan_arSIefect")) {
      scene.anims.create({
        key: "slan_arSIefect",
        frames: scene.anims.generateFrameNumbers("Slan_arSIefect"),
        frameRate: 12,
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
