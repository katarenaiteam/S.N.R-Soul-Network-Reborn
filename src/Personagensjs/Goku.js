import Personagem from "./Personagem.js";
import GokuDoSpecial from "./Specials/Goku/DoSpecial.js";
import GokuNeSpecial from "./Specials/Goku/NeSpecial.js";
import GokuAsiSpecial from "./Specials/Goku/AsiSpecial.js";
import GokuAupSpecial from "./Specials/Goku/AupSpecial.js";
import GokuAdoSpecial from "./Specials/Goku/AdoSpecial.js";
import GokuSiSpecial from "./Specials/Goku/SiSpecial.js";
import GokuUlt from "./Ult/GokuUlt.js";
import GokuKaioken from "./Specials/Goku/Kaioken.js";


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
          { largura: 35, altura: 30, offsetX: 10, offsetY: -75 },
          { largura: 60, altura: 20, offsetX: 2, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: -2, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      walk: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: 6,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 45, offsetX: 6, offsetY: -60 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: 6, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      jump: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: 32,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: -4, offsetY: -75 }, // Tronco/cabeça
          { largura: 40, altura: 50, offsetX: 0, offsetY: -25 }, // parte de baixo parecida
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
        offsetX: -4,
        offsetY: -8,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 35, offsetX: -7, offsetY: -55 }, // fechadinho
          { largura: 75, altura: 35, offsetX: 0, offsetY: -20 },
        ],
      },

      crouch2: {
        largura: 85,
        altura: 100,
        offsetX: -1,
        offsetY: -8,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 35, offsetX: -7, offsetY: -55 },
          { largura: 75, altura: 35, offsetX: 0, offsetY: -20 },
        ],
      },

      crouch3: {
        largura: 85,
        altura: 100,
        offsetX: 4,
        offsetY: -8,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 35, offsetX: -7, offsetY: -55 },
          { largura: 75, altura: 35, offsetX: 0, offsetY: -20 },
        ],
      },

      guard: {
      largura: 85,
      altura: 100,
      offsetX: 0,
      offsetY: -12,
      escala: 1,
      hurtboxes: [
          { largura: 35, altura: 30, offsetX: 10, offsetY: -75 },
          { largura: 60, altura: 20, offsetX: 2, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: -2, offsetY: -18 }, // Agachado / pernas abertas
     ]
      },

       taunt: {
      largura: 85,
      altura: 100,
      offsetX: 2,
      offsetY: -11,
      escala: 1,
      hurtboxes: [
          { largura: 30, altura: 35, offsetX: 20, offsetY: -50 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: -5, offsetY: -18 }, // Agachado / pernas abertas
     ]
      },
      stun: {
        largura: 85,
        altura: 76,
        offsetX: 0,
        offsetY: 34,
        escala: 1,
        hurtboxes: [
          
          { largura: 65, altura: 70, offsetX: -12, offsetY: -38 }, // Agachado / pernas abertas
        ],
      },

      dano: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: -5,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: -10, offsetY: -70 }, // Tronco/cabeça
          { largura: 70, altura: 35, offsetX: -5, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },

      danoUp: {
        largura: 85,
        altura: 100,
        offsetX: 8,
        offsetY: 61,
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
        offsetY: 25,
        escala: 1,
        hurtboxes: [
           { largura: 55, altura: 60, offsetX: -10, offsetY: -90 }, 
          { largura: 55, altura: 35, offsetX: -10, offsetY: -45 }, 
        ], 
      },
      danoSide: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: 54,
        escala: 1,
        hurtboxes: [
           { largura: 60, altura: 55, offsetX: -15, offsetY: -85 },  
        ],
      },
      dead: {
        largura: 85,
        altura: 42,
        offsetX: 35,
        offsetY: 28, // Ajustado para compensar a folha de 52px de altura
        escala: 1,
        hurtboxes: [
          { largura: 40, altura: 15, offsetX: 0, offsetY: -35 },
          { largura: 110, altura: 20, offsetX: 0, offsetY: -15 },
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

      intro: {
        largura: 85,
        altura: 100,
        offsetX: 13,
        offsetY: 29,
        escala: 1,
        hurtboxes: [
          { largura: 35, altura: 30, offsetX: 10, offsetY: -75 },
          { largura: 60, altura: 20, offsetX: 2, offsetY: -48 },
          { largura: 80, altura: 35, offsetX: -2, offsetY: -18 },
        ],
      },

      atack1: { offsetVisualX:15, largura: 85, altura: 100, offsetX: 14, offsetY: 0, escala: 1,
        hurtboxes: [
          { largura: 35, altura: 30, offsetX: 10, offsetY: -75 },
          { largura: 60, altura: 20, offsetX: 2, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: -2, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      atack2: { offsetVisualX:17, largura: 85, altura: 100, offsetX: 22, offsetY: 0, escala: 1,
        hurtboxes: [
          { largura: 35, altura: 30, offsetX: 10, offsetY: -75 },
          { largura: 60, altura: 20, offsetX: 2, offsetY: -48 }, // Tronco/cabeça
          { largura: 80, altura: 35, offsetX: -2, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      atack3: { offsetVisualX:10, largura: 85, altura: 100, offsetX: 34, offsetY: 10, escala: 1,
        hurtboxes: [
          { largura: 30, altura: 30, offsetX: -10, offsetY: -75 },
          { largura: 50, altura: 20, offsetX: 0, offsetY: -48 }, // Tronco/cabeça
          { largura: 30, altura: 35, offsetX: 5, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      neutralAir: {
        largura: 85,
        altura: 100,
        offsetX: 11,
        offsetY: 9,
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 45, offsetX: -10, offsetY: -80 }, // Tronco/cabeça
          { largura: 60, altura: 40, offsetX: 0, offsetY: -35 }, // perna dano
        ],
      },

      sideAtack: {
        largura: 85,
        altura: 100,
        offsetX: 8,
        offsetY: 0,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 80, offsetX: -17, offsetY: -40 }],
      },

      downAtack: {
        offsetVisualX:18,
        offsetVisualY:3,
        largura: 85,
        altura: 100,
        offsetX: 33,
        offsetY: -12,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 35, offsetX: -1, offsetY: -70 },
          { largura: 70, altura: 45, offsetX: 0, offsetY: -30 },
         
        ],
                  
      },

      sideAir: {
        largura: 85,
        altura: 100,
        offsetX: 42,
        offsetY: 18,
        escala: 1,
        hurtboxes: [{ largura: 55, altura: 90, offsetX: -15, offsetY: -70 }],
      },

      upAir: {  
        largura: 85,
        altura: 100,
        offsetX: 22,
        offsetY: 18,
        escala: 1,
        hurtboxes: [{ largura: 50, altura: 90, offsetX: -5, offsetY: -70 }],
      },

      AupSpecial: {
        largura: 85,
        altura: 100,
        offsetX: 29,
        offsetY: 69,
        escala: 1,
        hurtboxes: [
          { largura: 48, altura: 46, offsetX: 0, offsetY: -76 },
          { largura: 62, altura: 40, offsetX: 0, offsetY: -34 },
        ],
      },

      AdoSpecial: {
        largura: 85,
        altura: 100,
        offsetX: 20,
        offsetY: 20,
        escala: 1,
        hurtboxes: [
          { largura: 48, altura: 42, offsetX: 0, offsetY: -76 },
          { largura: 62, altura: 38, offsetX: 0, offsetY: -34 },
        ],
      },

      downAir: {  
        largura: 85,
        altura: 100,
        offsetX: 26,
        offsetY: 25,
        escala: 1,
        hurtboxes: [{ largura: 50, altura: 90, offsetX: -5, offsetY: -70 }],
      },

      Asi_Special: {
        largura: 85,
        altura: 100,
        offsetX: 6,
        offsetY: 12,
        escala: 1,
        hurtboxes: [
          { largura: 48, altura: 42, offsetX: 0, offsetY: -76 },
          { largura: 62, altura: 36, offsetX: 0, offsetY: -34 },
        ],
      },

      siSpecialPrepare: {
        largura: 85,
        altura: 100,
        offsetX: -1,
        offsetY: -8,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 35, offsetX: -7, offsetY: -55 },
          { largura: 75, altura: 35, offsetX: 0, offsetY: -20 },
        ],
      },

      siSpecial: {
        largura: 85,
        altura: 100,
        offsetX: 35,
        offsetY: 34,
        escala: 1,
        hurtboxes: [
          { largura: 35, altura: 30, offsetX: 10, offsetY: -75 },
          { largura: 45, altura: 20, offsetX: -10, offsetY: -48 },
          { largura: 65, altura: 35, offsetX: -17, offsetY: -18 },
        ],
      },

      neSpecial: {
        largura: 85,
        altura: 100,
        offsetX: -1,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 35, offsetX: -7, offsetY: -55 },
          { largura: 75, altura: 35, offsetX: 0, offsetY: -20 },
        ],
      },

      neSpecialAr: {
        largura: 85,
        altura: 100,
        offsetX: -1,
        offsetY: 30,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 35, offsetX: -7, offsetY: -55 },
          { largura: 75, altura: 35, offsetX: 0, offsetY: -20 },
        ],
      },

      kamecharg: {
        largura: 85,
        altura: 100,
        offsetX: 1,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
          { largura: 35, altura: 30, offsetX: 10, offsetY: -75 },
          { largura: 60, altura: 20, offsetX: 2, offsetY: -48 },
          { largura: 80, altura: 35, offsetX: -2, offsetY: -18 },
        ],
      },

      kamelauch: {
        largura: 85,
        altura: 100,
        offsetX: -1,
        offsetY: 0,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 80, offsetX: -20, offsetY: -40 }],
      },

      kamelauch_loop: {
        largura: 85,
        altura: 100,
        offsetX: -1,
        offsetY: 0,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 80, offsetX: -20, offsetY: -40 }],
      },

      kib1: {
        largura: 85,
        altura: 100,
        offsetX: -1,
        offsetY: -3,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 35, offsetX: -7, offsetY: -55 },
          { largura: 75, altura: 35, offsetX: 0, offsetY: -20 },
        ],
      },

      kib2: {
        largura: 85,
        altura: 100,
        offsetX: 4,
        offsetY: 0,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 80, offsetX: -20, offsetY: -40 }],
      },

      kib3: {
        largura: 85,
        altura: 100,
        offsetX: 2,
        offsetY: -3,
        escala: 1,
        hurtboxes: [
          { largura: 30, altura: 35, offsetX: -7, offsetY: -55 },
          { largura: 75, altura: 35, offsetX: 0, offsetY: -20 },
        ],
      },

      doSpecial: {
        largura: 85,
        altura: 100,
        offsetX: 0,
        offsetY: 9,
        escala: 1,
        hurtboxes: [
          { largura: 42, altura: 32, offsetX: 0, offsetY: -82 },
          { largura: 62, altura: 40, offsetX: 0, offsetY: -48 },
          { largura: 76, altura: 30, offsetX: 0, offsetY: -16 },
        ],
      },

    
   };

    this.specials = {
      lado: GokuSiSpecial.configuracao,
      agachado: {
        animacao: "gk_doSpecial_inicio",
        configuracaoAnimacao: "doSpecial",
        logica: GokuDoSpecial,
        propriedades: { travarMovimentoAir: true },
        cooldown: 500,
        taxaCargaPorMs: 0.026,
      },
      neutro: {
        animacao: "gk_idle",
        logica: GokuNeSpecial,
        chaveCooldown: "gokuNe",
        cooldown: 0,
        custoKiBall: 6,
        custoKamehameha: 30,
        cooldownKamehameha: 500,
        esperaKamehameha: 220,
        intervaloKiBall: 1800,
        cooldownKiBall: 1400,
        danoKiBall: 6,
        velocidadeKiBall: 700,
        alcanceKiBall: 1100,
        danoBaseKamehameha: 20,
        alcanceBaseKamehameha: 480,
        alcancePorCargaKamehameha: 130,
        knockbackBaseKamehameha: 860,
        knockbackPorCargaKamehameha: 90,
        larguraKamehamehaPorCarga: 0.08,
        animacoes: {
          kiBall: ["gk_kib1", "gk_kib2", "gk_kib3"],
          preparacaoKame: "gk_neSpecial",
          cargaKame: "gk_kamecharg",
          lancamentoKame: "gk_kamelauch",
          loopLancamentoKame: "gk_kamelauch_loop",
        },
        propriedades: { travarMovimentoAir: true },
        logicaPropriedades: {
          tipoSomImpacto: "heavy",
          knockbackY: -150,
          tumbling: true,
        },
      },
      air_neutro: {
        animacao: "gk_idle",
        logica: GokuNeSpecial,
        propriedades: { velocidadeAerea: 100 },
        chaveCooldown: "gokuNe",
        cooldown: 0,
        custoKiBall: 6,
        custoKamehameha: 30,
        cooldownKamehameha: 500,
        esperaKamehameha: 220,
        intervaloKiBall: 1800,
        cooldownKiBall: 1400,
        danoKiBall: 6,
        velocidadeKiBall: 700,
        alcanceKiBall: 1100,
        danoBaseKamehameha: 20,
        alcanceBaseKamehameha: 480,
        alcancePorCargaKamehameha: 130,
        knockbackBaseKamehameha: 860,
        knockbackPorCargaKamehameha: 90,
        larguraKamehamehaPorCarga: 0.08,
        animacoes: {
          kiBall: ["gk_kib1", "gk_kib2", "gk_kib3"],
          preparacaoKame: "gk_neSpecial_ar",
          cargaKame: "gk_kamecharg",
          lancamentoKame: "gk_kamelauch",
          loopLancamentoKame: "gk_kamelauch_loop",
        },
        frameLancamentoAereo: 20,
        origemKameAereaX: 55,
        origemKameAereaY: -50,
        inclinacaoKameAerea: 0.35,
        logicaPropriedades: {
          tipoSomImpacto: "heavy",
          knockbackY: -150,
          tumbling: true,
        },
      },
      air_lado: GokuAsiSpecial.configuracao,
      air_cima: GokuAupSpecial.configuracao,
      air_agachado: GokuAdoSpecial.configuracao,
    };
    this.cargaKi = 0;
    this.cargaKiMaxima = 100;
    this.kaioken = new GokuKaioken(this);
    this.kaiokenAtivo = false;
    this.kaiokenDisponivelEm = 0;
    this.tempoCargaKi = 0;
    this.sequenciaKiBall = 0;
    this.ultimaKiBallAte = 0;
    this.cooldownKiBallAte = 0;
    this.cooldownKamehamehaAte = 0;

    this.sons = {
      ...this.sons,
      vozAtaque: ["gk-atk1", "gk-atk2", "gk-atk4", "gk-atk5", "gk-atk6"],
      vozDanoNormal: ["goku-hurt1", "goku-hurt2", "goku-hurt3", "goku-hurt4", "goku-hurt5"],
      vozDanoForte: ["gk-atk3"],
      volumeVoz: 0.2,
    };


  
    // ============================ tabela de golpes =====================================
    this.golpes = {
      neutro1: {
        animacao: "gk_atack1",
        frameHitbox: 3,
        offsetX: 50,
        offsetY: -60,
        largura: 35,
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

        frameHitbox: 3,

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

        offsetX: 50,
        offsetY: -80,
        largura: 40,
        altura: 60,
        duracao: 450,
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
        offsetX: 55,
        offsetY: -25,
        largura: 70,
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
        offsetX: 20,
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
        offsetX: 32,
        offsetY: -50,
        largura: 52,
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
  offsetY: -40,
  largura: 60,
  altura: 70,
  cooldown: 500,

  duracao: 600,

  vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

  finalizarAoTocarChao: true,
  atrasoFinalizacaoChao: 90,

  finalizarAoAcertarOponente: true,
  atrasoFinalizacaoAcerto: 30,

  movimento: {
    inicio: 10,
    fim: 300,

    x: {
      de: 70,
      para: 70,
    },

    y: {
      de: 120,
      para: 180,
    },

    curva: "easeIn",
  },

  propriedades: {
    tipoSomImpacto: "heavy",
    dano: 11,
    knockbackX: 40,
    knockbackY: 560,
    quiqueChaoY: 400,
    hitstunMinFrames:24,
  },
},

      air_side: {
        animacao: "gk_sideAir",
        frameHitbox: 3,
        offsetX: 45,
        offsetY: -75,
        largura: 80,
        altura: 50,
        cooldown: 500,
        duracao: 390, 
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
        offsetX: 30,
        offsetY: -100,
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
    this.ult = GokuUlt.configuracao;
  
  }

  //animaçoes====================================================
  adicionarCargaKiPorDano(dano) {
    if (this.kaiokenAtivo) return;
    this.cargaKi = Math.min(this.cargaKiMaxima, this.cargaKi + Math.max(0, dano) * 0.7);
  }

  aplicarBonusDanoKaioken(dano, propriedades = {}) {
    return {
      ...propriedades,
      dano: Math.max(0, dano) * (this.kaiokenAtivo ? 2 : 1),
    };
  }

  iniciarCooldownSpecial(tipoSpecial) {
    const special = this.specials?.[tipoSpecial];
    if (!special) return;
    const chaveCooldown = special.chaveCooldown ?? tipoSpecial;
    const multiplicadorVelocidade = this.kaiokenAtivo ? 2 : 1;
    this.cooldownsSpecial[chaveCooldown] = this.scene.time.now +
      (special.cooldown || 0) / multiplicadorVelocidade;
  }

  update() {
    super.update();
    this.kaioken?.atualizar(this.scene.game.loop.delta);
  }

  podeUsarSpecial(tipoSpecial) {
    if (
      tipoSpecial === "lado" &&
      this.maquinaEstados.estadoAtual?.nome === "crouch"
    ) return false;
    if (tipoSpecial === "agachado" && this.kaiokenAtivo) return false;
    const neutro = tipoSpecial === "neutro" || tipoSpecial === "air_neutro";
    if (!neutro) return super.podeUsarSpecial(tipoSpecial);
    const agora = this.scene.time.now;
    if (agora - this.ultimaKiBallAte > this.specials.neutro.intervaloKiBall) {
      this.sequenciaKiBall = 0;
    }
    return super.podeUsarSpecial(tipoSpecial) &&
      (this.kaiokenAtivo || this.cargaKi >= this.specials.neutro.custoKiBall);
  }

  registrarUsoSpecialAereo(tipoSpecial) {
    if (tipoSpecial === "air_neutro") return;
    super.registrarUsoSpecialAereo(tipoSpecial);
  }

  registrarUsoNeutroAereoConfirmado() {
    super.registrarUsoSpecialAereo("air_neutro");
  }

  consumirCargaKi(percentual) {
    if (this.kaiokenAtivo) return true;
    const quantidade = Math.max(0, Number(percentual) || 0);
    if (this.cargaKi < quantidade) return false;
    this.cargaKi -= quantidade;
    return true;
  }

  static criarAnimacoes(scene) {

    const animacoesKi = [
      ["gk_doSpecial_inicio", "gk_doSpecial", 0, 5, 18, 0],
      ["gk_doSpecial_loop", "gk_doSpecial", 6, 8, 12, -1],
      ["goku_charge_inicio", "charge_1", 0, 5, 12, 0],
      ["goku_charge_loop", "charge_1", 6, 12, 12, -1],
      ["goku_charge_fim", "charge_2", 0, 7, 12, 0],
      ["goku_charge_dust", "charge_dust", 0, 8, 16, 0],
      ["gk_neSpecial", "gk_neSpecial", 0, 3, 12, 0],
      ["gk_neSpecial_ar", "neSpecial-ar", 18, 28, 16, 0],
      ["gk_siSpecial_prepare", "siSpecial-prepare", 0, 5, 15, 0],
      ["gk_siSpecial", "siSpecial", 0, 7, 16, 0],
      ["goku_mira", "mira", 0, 3, 8, -1],
      ["gk_AupSpecial", "gk_AupSpecial", 0, 8, 16, 0],
      ["gk_AdoSpecial", "gk_AdoSpecial", 0, 7, 16, 0],
      ["gk_Asi_Special", "gk_AsiSpecial", 0, 2, 12, -1],
      ["goku_nuvem", "nuvem", 0, 7, 12, -1],
      ["gk_kamecharg", "gk_kamecharg", 0, 15, 16, -1],
      ["gk_kamelauch", "gk_kamelauch", 0, 7, 16, 0],
      ["gk_kamelauch_loop", "gk_kamelauch", 6, 7, 16, -1],
      ["gk_kib1", "gk_kib1", 0, 6, 12, 0],
      ["gk_kib2", "gk_kib2", 0, 5, 12, 0],
      ["gk_kib3", "gk_kib3", 0, 6, 12, 0],
      ["goku_kib", "kib", 0, 5, 16, -1],
      ["goku_kib_exp", "kib_exp", 0, 5, 16, 0],
      ["goku_kame_base", "kame_base", 0, 2, 12, -1],
      ["goku_kame_caule", "kame_caule", 0, 2, 12, -1],
      ["goku_kame_point", "kame_point", 0, 3, 12, -1],
      ["goku_kame_charg", "kame_charg", 0, 8, 14, -1],
      ["goku_kame_aura", "kame_aura", 0, 8, 14, -1],
    ];
    animacoesKi.forEach(([key, textura, start, end, frameRate, repeat]) => {
      if (scene.anims.exists(key)) return;
      scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(textura, { start, end }), frameRate, repeat });
    });

    const animacoesUlt = [
      ["goku_ult0", "Goku_ult0", 0, 8, 16, 0],
      ["goku_ult1", "Goku_ult1", 0, 8, 14, 0],
      ["goku_ult2", "Goku_ult2", 0, 7, 16, 0],
      ["goku_ult3", "Goku_ult3", 0, 26, 18, 0],
      ["goku_genk", "genk", 0, 1, 25, -1],
    ];
    animacoesUlt.forEach(([key, textura, start, end, frameRate, repeat]) => {
      if (scene.anims.exists(key)) return;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(textura, { start, end }),
        frameRate,
        repeat,
      });
    });
    if (!scene.anims.exists("goku_genk_e_reverso")) {
      scene.anims.create({
        key: "goku_genk_e_reverso",
        frames: Array.from({ length: 24 }, (_, indice) => ({
          key: "genk-e",
          frame: 23 - indice,
        })),
        frameRate: 9,
        repeat: 0,
      });
    }
    if (!scene.anims.exists("goku_genk_e_explosao")) {
      scene.anims.create({
        key: "goku_genk_e_explosao",
        frames: Array.from({ length: 24 }, (_, indice) => ({
          key: "genk-e",
          frame: 23 - indice,
        })),
        frameRate: 24,
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
      frameRate: 18,
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
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "gk_sideAir",
      frames: scene.anims.generateFrameNumbers("gk_sideAir", {
        start: 0,
        end: 6,
      }),
      frameRate: 16,
      repeat: 0,
    });

  }
}
