import Personagem from "./Personagem.js";
import NeSpecial from "./Specials/FJ/NeSpecial.js";
import SiSpecial from "./Specials/FJ/SiSpecial.js";
import AsiSpecial from "./Specials/FJ/AsiSpecial.js";
import AdoSpecial from "./Specials/FJ/AdoSpecial.js";
import AupSpecial from "./Specials/FJ/AupSpecial.js";
import DoSpecial from "./Specials/FJ/DoSpecial.js";


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
        maxComboIndex: 4,
      },

      teclas,
      "fj_",
      controle,
    );

       this.configVFX = {
  ...this.configVFX,
  npose: {
    textura: "npose",
    animacao: "fj_npose",
    escalaX: 0.45,
    escalaY: 0.30,
    offsetX: -40,
    offsetY: -63,
    seguir: true,
    blendMode: "ADD",
    depthOffset: 2,
  },

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
           { largura: 50, altura: 20, offsetX: 30, offsetY: -77 },
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
           { largura: 40, altura: 43, offsetX: 26, offsetY: -105 },
          { largura: 46, altura: 25, offsetX: 32, offsetY: -72 },
          { largura: 18, altura: 40, offsetX: 20, offsetY: -30 },
        ],
      },

      
      crouch: {
        largura: 250,
        altura: 240,
        offsetX: 98,
        offsetY: 80,
        escala: 0.33,
        hurtboxes: [
          { largura: 50, altura: 70, offsetX: 20, offsetY: -38 },
        ],
      },
      crouch3: {
        largura: 250,
        altura: 240,
        offsetX: 98,
        offsetY: 80,
        escala: 0.33,
        hurtboxes: [
          { largura: 50, altura: 70, offsetX: 20, offsetY: -38 },
        ],
      },
       

      dash: {
        largura: 250,
        altura: 400,
        offsetX: 142,
        offsetY: -80,
        escala: 0.33,
        hurtboxes: [],
      },

      guard: {
        largura: 250,
        altura: 400,
        offsetX: 138,
        offsetY: -50,
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

      comboRapido1: {
        offsetVisualX: 21,
        offsetVisualY: 0,
         largura: 250,
        altura: 400,
        offsetX: 178,
        offsetY: 22,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 20, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 20, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 15, offsetY: -25 },
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

      neSpecial: {
        offsetVisualX: 18,
        largura: 250,
        altura: 400,
        offsetX: 144,
        offsetY: 62,
        escala: 0.33,
        hurtboxes: [
          { largura: 55, altura: 55, offsetX: 0, offsetY: -70 },
          { largura: 90, altura: 35, offsetX: -10, offsetY: -18 },
        ], 
      },

      doSpecial: {
        offsetVisualX: 22,
        largura: 250,
        altura: 400,
        offsetX: 140,
        offsetY: 23,
        escala: 0.33,
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
        largura: 250,
        altura: 400,
        offsetX: 98,
        offsetY: 153,
        escala: 0.33,
        hurtboxes: [
          { largura: 55, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 60, altura: 35, offsetX: -3, offsetY: -18 },
        ],
      },

      siSpecial: {
        largura: 250,
        altura: 400,
        offsetX: 180,
        offsetY: 111,
        escala: 0.33,
        hurtboxes: [
          { largura: 55, altura: 75, offsetX: 0, offsetY: -65 },
          { largura: 35, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      grab: {
        largura: 250,
        altura: 400,
        offsetX: 150,
        offsetY: -19,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      AsiSpecial: {
        largura: 250,
        altura: 400,
        offsetX: 86,
        offsetY: 153,
        escala: 0.33,
        hurtboxes: [
          { largura: 55, altura: 75, offsetX: 0, offsetY: -65 },
          { largura: 35, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      Agrab: {
        largura: 250,
        altura: 400,
        offsetX: 73,
        offsetY: 81,
        escala: 0.33,
        hurtboxes: [
          { largura: 55, altura: 75, offsetX: 0, offsetY: -65 },
          { largura: 35, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      ground: {
        offsetVisualY: 12,
        largura: 210,
        altura: 245,
        offsetX: 45,
        offsetY: 75,
        escala: 0.33,
        hurtboxes: [
          { largura: 40, altura: 40, offsetX: 16, offsetY: -60 },
          { largura: 65, altura: 40, offsetX: 4, offsetY: -20 },
        ],
      },

      AdoSpecial: {
        largura: 250,
        altura: 300,
        offsetX: 60,
        offsetY: 74,
        escala: 0.33,
        hurtboxes: [
          { largura: 65, altura: 75, offsetX: 0, offsetY: -68 },
          { largura: 70, altura: 40, offsetX: 5, offsetY: -22 },
        ],
      },
   
   };
    
    // ============================ tabela de golpes =====================================
   this.configAnimacoes.comboRapido1 = {
     ...this.configAnimacoes.atack2,
     offsetY: 25, // Compensa a altura de 448px da nova spritesheet no corpo fisico.
     offsetVisualX: 0,
     offsetVisualY: 0,
   };
   this.configAnimacoes.comboRapido2 = {
     ...this.configAnimacoes.atack2,
     offsetY: 25,
     offsetVisualX: 0,
     offsetVisualY: 0,
   };
   this.configAnimacoes.comboRapido3 = {
     ...this.configAnimacoes.atack2,
     offsetY: 25,
     offsetVisualX: 0,
     offsetVisualY: 0,
   };
   this.golpes = {
      neutro1: {
        animacao: "fj_atack1",
        frameHitbox: 2,
        offsetX: 60,
        offsetY: -100,
        largura: 65,
        altura: 17,
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
          hitstunFrames: 24,
          hitsSemDecay: 2
        },

        comboProximo: "neutro2",
        comboJanelaInicio: 200,
        comboJanelaFim: 300,
      },

      neutro2: {
        animacao: "fj_atack2",

        frameHitbox: 5,

        offsetX: 55,
        offsetY: -80,
        largura: 33,
        altura: 45,
        duracao: 550,
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
        comboJanelaInicio: 400,
        comboJanelaFim: 500,
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
        multiHit: {
          tipo: "comboRapido",
          maxHits: 15, // Conta hitboxes criadas, mesmo sem acertar.
          intervaloInput: 250, // Tempo maximo entre novos apertos, em ms.
          duracaoCiclo: 250,
          hits: [
            { inicio: 12.5, duracao: 27.5, offsetY: -82,
              animacao: "fj_comboRapido1", antecipacao: 25 },
            { inicio: 112, duracao: 27.5, offsetY: -65,
              animacao: "fj_comboRapido2", antecipacao: 62 },
            { inicio: 200, duracao: 27.5, offsetY: -75,
              animacao: "fj_comboRapido3", antecipacao: 25},
          ],
        },
      },

      neutro4: {
        animacao: "fj_atack3",

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
          knockbackX: 350,
          knockbackY: -310,
          tumbling: true,
          hitstunBaseFrames: 18
        },
      },

      side: {
        animacao: "fj_sideAtack",
        multiHit: {
          tipo: "automatico",
          hits: [
            { inicio: 140, duracao: 55, offsetY: -65,
              propriedades: { dano: 3, knockbackX: 400, knockbackY: 0,
                knockbackFixo: true, tumbling: false, hitstunFrames: 18 } },
            { inicio: 240, duracao: 55, offsetX: 40,
              propriedades: { dano: 3, knockbackX: 250, knockbackY: -10,
                knockbackFixo: true, tumbling: false, hitstunFrames: 18 } },
            { inicio: 340, duracao: 55, offsetX: 45,
              propriedades: { dano: 6 } }, // Herda o arremesso forte do golpe.
          ],
        },
        offsetX: 40,
        offsetY: -77,
        largura: 70,
        altura: 25,
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
         de: 500,
         para: 150,
        },

        curva: "easeIn",
       },

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 200,
          knockbackY: -100,
          tumbling: false,
        },
      },
     agachado: {
        animacao: "fj_downAtack",
        frameHitbox: 3,
        offsetX: 66,
        offsetY: -20,
        largura: 50,
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
          knockbackX: 40,
          knockbackY: -300,
          tumbling: false,
          knockbackFixo: true,
        },
      },

        air_neutro: {
        animacao: "fj_neutralAir",
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
        },
      },

      air_cima: {
        animacao: "fj_upAir",
        frameHitbox: 3,
        offsetX: 58,
        offsetY: -97,
        largura: 65,
        altura: 25,
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
          knockbackX: 120,
          knockbackY: -470,
          tumbling: true,
          knockbackFixo: false,
        },
      },

      air_side: {
        animacao: "fj_sideAir",
        frameHitbox: 4,
        offsetX: 50,
        offsetY: -57,
        largura: 55,
        altura: 25,
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
        fim: 400,
         x: {
         de: 500,
         para: 350,
        },

        curva: "easeOut",
       },

        propriedades: {
          anularGravidade: true,
          tipoSomImpacto: "heavy",
          dano: 9,
          knockbackX: 120,
          knockbackY: -470,
          tumbling: true,
          knockbackFixo: false,
        },
      },


      air_agachado: {
        animacao: "fj_downAir",
        frameHitbox: 3,
        offsetX: 60,
        offsetY: -70,
        largura: 55,
        altura: 40,
        cooldown: 600,
        duracao: 400,
         finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 30,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 10,
          knockbackX: 450,
          knockbackY: -350,
          tumbling: true,
        },
      },

   }

    // specials ==========================
    this.specials = {
      air_cima: {
        animacao: "fj_AupSpecial",
        logica: AupSpecial,
        cooldown: 2200,
        propriedades: { travarMovimentoAir: true },
      },
      air_agachado: {
        animacao: "fj_AdoSpecial",
        logica: AdoSpecial,
        cooldown: 900,
        propriedades: { travarMovimentoAir: true },
      },
      air_lado: {
        animacao: "fj_AsiSpecial",
        logica: AsiSpecial,
        cooldown: 900,
        propriedades: { travarMovimentoAir: true },
      },
      agachado: {
        animacao: "fj_doSpecial",
        logica: DoSpecial,
        cooldown: 800,
        propriedades: { travarMovimentoAir: true },
      },
      lado: {
        animacao: "fj_siSpecial",
        logica: SiSpecial,
        cooldown: 900,
        propriedades: { travarMovimentoAir: true },
      },
      neutro: {
        animacao: "fj_neSpecial",
        logica: NeSpecial,
        cooldown: 600,
        propriedades: { travarMovimentoAir: true },
      },
    };

   
  }

  //animaçoes====================================================
  
  static criarAnimacoes(scene) {
    if (!scene.anims.exists("fj_npose")) {
      scene.anims.create({
        key: "fj_npose",
        frames: scene.anims.generateFrameNumbers("npose", { start: 0, end: 28 }),
        frameRate: 48,
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

    if (scene.anims.exists("fj_idle")) return;

    scene.anims.create({
      key: "fj_siSpecial",
      frames: scene.anims.generateFrameNumbers("FJ_siSpecial", { start: 0, end: 5 }),
      frameRate: 12,
      repeat: 0,
    });
    scene.anims.create({
      key: "fj_grab",
      frames: scene.anims.generateFrameNumbers("FJ_grab", { start: 0, end: 13 }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "fj_neSpecial",
      frames: scene.anims.generateFrameNumbers("FJ_neSpecial", {
        start: 0,
        end: 8,
      }).map((frame, indice) => ({
        ...frame,
        // Progressao manual de 12 a 14 FPS, sem pico de velocidade no meio.
        // A pose final tem sua propria pausa na logica do special.
        duration: [1000 / 15, 62, 58, 54, 50, 50, 46, 42, 1000 / 16, 250][indice],
      })),
      frameRate: 15,
      repeat: 0,
    });

    scene.anims.create({
      key: "fj_doSpecial",
      frames: scene.anims.generateFrameNumbers("FJ_doSpecial", { start: 0, end: 12 }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "fj_AsiSpecial",
      frames: scene.anims.generateFrameNumbers("FJ_AsiSpecial", { start: 0, end: 10 }),
      frameRate: 14,
      repeat: 0,
    });
    scene.anims.create({
      key: "fj_Agrab",
      frames: scene.anims.generateFrameNumbers("FJ_Agrab", { start: 0, end: 6 }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "fj_AdoSpecial",
      frames: scene.anims.generateFrameNumbers("FJ_AdoSpecial", { start: 0, end: 5 }),
      frameRate: 18,
      repeat: 0,
    });
    scene.anims.create({
      key: "fj_ground",
      frames: scene.anims.generateFrameNumbers("FJ_ground", { start: 0, end: 4 }),
      frameRate: 12,
      repeat: 0,
    });
    scene.anims.create({
      key: "fj_ground_effect",
      frames: scene.anims.generateFrameNumbers("ground_effect", { start: 0, end: 26 }),
      frameRate: 48,
      repeat: 0,
    });

    scene.anims.create({
      key: "fj_AupSpecial",
      frames: scene.anims.generateFrameNumbers("FJ_AupSpecial", { start: 0, end: 16 }),
      frameRate: 24,
      repeat: 0,
    });

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
    key: "fj_stun",
    frames: scene.anims.generateFrameNumbers("FJ_stun", { start: 0, end: 3 }),
    frameRate: 8,
    repeat: 0
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
      frameRate: 22,
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
      key: "fj_comboRapido1",
      frames: scene.anims.generateFrameNumbers("FJ_speedNeu", {
        start: 0, end: 3,
      }),
      frameRate: 60,
      repeat: 0,
    });
    scene.anims.create({
      key: "fj_comboRapido2",
      frames: scene.anims.generateFrameNumbers("FJ_speedNeu", {
        start: 4, end: 13,
      }),
      frameRate: 60,
      repeat: 0,
    });
    scene.anims.create({
      key: "fj_comboRapido3",
      frames: scene.anims.generateFrameNumbers("FJ_speedNeu", {
        start: 14, end: 19,
      }),
      frameRate: 60,
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
      frameRate: 24,
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
      key: "fj_upAir",
      frames: scene.anims.generateFrameNumbers("FJ_airup", {
        start: 0,
        end: 9,
      }),
      frameRate: 16,
      repeat: 0,
    });
     scene.anims.create({
      key: "fj_sideAir",
      frames: scene.anims.generateFrameNumbers("FJ_airside", {
        start: 0,
        end: 9,
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
    
  }
}
