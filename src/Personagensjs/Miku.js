import Personagem from "./Personagem.js";
import NotaCarregada from "./Specials/Miku/NotaCarregada.js";
import MikuSpin from "./Specials/Miku/mikuSpin.js";
import MikuPuppet from "./Specials/Miku/mikuPuppet.js";
import AupSpecial from "./Specials/Miku/AupSpecial.js";

export default class Miku extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animaÃ§Ãµes existam no Phaser ANTES de criar o Personagem e a FSM

    Miku.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "Miku_idle",
      0,
      {
        velocidade: 280,
        forcaPulo: -600,
        maxPulos: 2,
        maxDash: 1,
        maxComboIndex: 3,
      },

      teclas,
      "miku_",
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

  notaAtaque1: {
    textura: "Miku_effects",
    animacao: "miku_nota_ataque_1",
    escala: 0.8,
    espelharSprite: false,
  },

  notaAtaque2: {
    textura: "Miku_effects",
    animacao: "miku_nota_ataque_2",
    escala: 0.8,
    espelharSprite: false,
  },
};

this.vfxAtaqueNormal = {
  offsetX: 10,
  offsetY: 0,
  distancia: 28,
  duracao: 300,
  formacoes: {
    2: [
      { x: -1, y: -9, distancia: 0, escala: 0.9, angulo: -12 },
      { x: 11, y: 11, distancia: 11, escala: 1.08, angulo: 9 },
    ],
    3: [
      { x: -1, y: -16, distancia: 0, escala: 0.88, angulo: -14 },
      { x: 14, y: 3, distancia: 13, escala: 1.08, angulo: 11 },
      { x: 5, y: 18, distancia: 6, escala: 0.96, angulo: -6 },
    ],
    4: [
      { x: -1, y: -21, distancia: 0, escala: 0.86, angulo: -16 },
      { x: 16, y: -6, distancia: 16, escala: 1.08, angulo: 12 },
      { x: 5, y: 12, distancia: 8, escala: 0.94, angulo: -8 },
      { x: 23, y: 24, distancia: 23, escala: 1.12, angulo: 17 },
    ],
    5: [
      { x: -1, y: -24, distancia: 0, escala: 0.84, angulo: -18 },
      { x: 18, y: -10, distancia: 17, escala: 1.06, angulo: 13 },
      { x: 6, y: 5, distancia: 8, escala: 0.92, angulo: -7 },
      { x: 24, y: 18, distancia: 25, escala: 1.12, angulo: 18 },
      { x: 12, y: 29, distancia: 14, escala: 0.98, angulo: 5 },
    ],
  },
  porAtaque: {
    neutro1: { efeito: "notaAtaque1", quantidade: 2, offsetX: -20, movimentoX: 11 },
    neutro2: { efeito: "notaAtaque2", quantidade: 3, offsetX: -20, movimentoX: 11 },
    neutro3: { efeito: "notaAtaque1", quantidade: 3, offsetX: -20, movimentoX: 11 },
    neutro4: { efeito: "notaAtaque2", quantidade: 4, movimentoX: 70 },
    side: {
      efeito: "notaAtaque2", quantidade: 5, movimentoX: 16,
      compensarMovimento: true,
      fatorCompensacaoMovimento: 0.35,
    },
    agachado: {
      efeito: "notaAtaque1",
      quantidade: 2,
      offsetX: -25,
      movimentoX: 20,
    },
    air_neutro: {
      efeito: "notaAtaque1", quantidade: 3,
      offsetY: 30,
      offsetX: -20,
       movimentoX: 11,
      compensarMovimento: true,
    },
    air_side: {
      efeito: "notaAtaque2", quantidade: 3,
      offsetY: 17,
      movimentoX: 20,
      compensarMovimento: true,
      fatorCompensacaoMovimento: 0.55,
    },
    air_cima: {
      efeito: "notaAtaque1", quantidade: 3,
      offsetX: -12, offsetY: 30, movimentoX: 0, movimentoY: -72,
      compensarMovimento: true,
      fatorCompensacaoMovimento: 0.4,
    },
    air_agachado: {
      efeito: "notaAtaque2", quantidade: 3,
      offsetX: -14, offsetY: 5, movimentoX: 1, movimentoY: 30,
      compensarMovimento: true,
      fatorCompensacaoMovimento: 0.4,
    },
  },
};

    //============================= hitboxes ========================================
    this.nomePersonagem = "Hatsune Miku";
    // Mantem o corpo estavel entre spritesheets de larguras diferentes.
    // O ajuste de 45.5 preserva a posicao horizontal configurada no idle:
    // 170 - (334 - 85) / 2 = 45.5.
    this.centralizarCorpoFisicoX = true;
    this.ajusteCorpoFisicoX = 45.5;
    this.qtdTaunts = 1;
    this.configAnimacoes = {
      idle: {
        largura: 85, altura: 340, offsetX: 170, offsetY: 20, escala: 0.34,
        hurtboxes: [
          { largura: 20, altura: 45, offsetX: 15, offsetY: -95 },
          { largura: 30, altura: 70, offsetX: 15, offsetY: -35 },
        ],
      },
      walk: {
        largura: 85, altura: 340, offsetX: 236, offsetY: 17, escala: 0.34,
        hurtboxes: [
          { largura: 20, altura: 45, offsetX: 25, offsetY: -95 },
          { largura: 30, altura: 70, offsetX: 25, offsetY: -35 },
        ],
      },
      jump: {
        largura: 85, altura: 340, offsetX: 247, offsetY: -5, escala: 0.34,
        hurtboxes: [
          { largura: 30, altura: 50, offsetX: 1, offsetY: -70 },
          { largura: 30, altura: 25, offsetX: 10, offsetY: -40 },
        ],
      },
      crouch: {
        largura: 85, altura: 170, offsetX: 90, offsetY: 184, escala: 0.34,
        hurtboxes: [{ largura: 35, altura: 50, offsetX: 5, offsetY: -25 }],
      },
      crouch2: {
        largura: 85, altura: 170, offsetX: 90, offsetY: 30, escala: 0.34,
        hurtboxes: [{ largura: 40, altura: 50, offsetX: 10, offsetY: -25 }],
      },
      crouch3: {
        largura: 85, altura: 170, offsetX: 90, offsetY: 184, escala: 0.34,
        hurtboxes: [{ largura: 40, altura: 50, offsetX: 10, offsetY: -25 }],
      },
      dash: {
        largura: 85, altura: 340, offsetX: 97, offsetY: 18, escala: 0.34,
        hurtboxes: [],
      },
      guard: {
        largura: 90, altura: 315, offsetX: 38, offsetY: 20, escala: 0.34,
        hurtboxes: [
          { largura: 30, altura: 48, offsetX: 5, offsetY: -82 },
          { largura: 35, altura: 55, offsetX: 5, offsetY: -38 },
        ],
      },
      taunt1: {
        largura: 95, altura: 340, offsetX: 105, offsetY: 34, escala: 0.34,
        hurtboxes: [
          { largura: 35, altura: 48, offsetX: 0, offsetY: -92 },
          { largura: 40, altura: 62, offsetX: 0, offsetY: -42 },
        ],
      },
      dano: {
        largura: 85, altura: 340, offsetX: 138, offsetY: 11, escala: 0.34,
        hurtboxes: [
          { largura: 35, altura: 52, offsetX: 0, offsetY: -82 },
          { largura: 35, altura: 50, offsetX: 0, offsetY: -34 },
        ],
      },
      danoUp: {
        largura: 85, altura: 340, offsetX: 138, offsetY: 8, escala: 0.34,
        hurtboxes: [
          { largura: 35, altura: 52, offsetX: 0, offsetY: -88 },
          { largura: 45, altura: 48, offsetX: 0, offsetY: -40 },
        ],
      },
      danoSide: {
        largura: 85, altura: 340, offsetX: 170, offsetY: 11, escala: 0.34,
        hurtboxes: [
          { largura: 35, altura: 50, offsetX: 0, offsetY: -72 },
          { largura: 35, altura: 42, offsetX: 0, offsetY: -30 },
        ],
      },
      danoDown: {
        largura: 85, altura: 340, offsetX: 140, offsetY: -4, escala: 0.34,
        hurtboxes: [
          { largura: 40, altura: 48, offsetX: 0, offsetY: -66 },
          { largura: 45, altura: 38, offsetX: 0, offsetY: -27 },
        ],
      },
      dead: {
        largura: 280, altura: 90, offsetX: 40, offsetY: 40, escala: 0.34,
        hurtboxes: [{ largura: 92, altura: 28, offsetX: 0, offsetY: -18 }],
      },
      getup: {
        largura: 110, altura: 120, offsetX: 125, offsetY: 10, escala: 0.34,
        hurtboxes: [
          { largura: 50, altura: 25, offsetX: 0, offsetY: -14 },
        ],
      },
      atack1: {
        largura: 85, altura: 340, offsetX: 183, offsetY: 16, escala: 0.34,
        hurtboxes: [
          { largura: 20, altura: 45, offsetX: 15, offsetY: -95 },
          { largura: 30, altura: 70, offsetX: 15, offsetY: -35 },
        ],
      },
      atack2: {
        largura: 85, altura: 340, offsetX: 183, offsetY: 16, escala: 0.34,
        hurtboxes: [
          { largura: 20, altura: 45, offsetX: 15, offsetY: -95 },
          { largura: 30, altura: 70, offsetX: 15, offsetY: -35 },
        ],
      },
      atack3: {
        largura: 85, altura: 340, offsetX: 183, offsetY: 16, escala: 0.34,
        hurtboxes: [
          { largura: 20, altura: 45, offsetX: 15, offsetY: -95 },
          { largura: 30, altura: 70, offsetX: 15, offsetY: -35 },
        ],
      },
      sideAtack: {
        largura: 85, altura: 340, offsetX: 157, offsetY: 42, escala: 0.34,
        hurtboxes: [
          { largura: 25, altura: 45, offsetX: 0, offsetY: -95 },
          { largura: 30, altura: 70, offsetX: 5, offsetY: -35 },
        ],
      },
      downAtack: {
        largura: 85, altura: 170, offsetX: 198, offsetY: 209, escala: 0.34,
        hurtboxes: [
          { largura: 50, altura: 70, offsetX: 0, offsetY: -90 },
        ],
      },
      neutralAir: {
        largura: 85, altura: 340, offsetX: 248, offsetY: -5, escala: 0.34,
        hurtboxes: [
          { largura: 35, altura: 50, offsetX: 0, offsetY: -80 },
          { largura: 40, altura: 50, offsetX: 20, offsetY: -25 },
          
        ],
      },
      sideAir: {
        largura: 85, altura: 340, offsetX: 248, offsetY: -5, escala: 0.34,
        hurtboxes: [
          { largura: 35, altura: 50, offsetX: 0, offsetY: -80 },
          { largura: 40, altura: 50, offsetX: 20, offsetY: -25 },
        ],
      },
      upAir: {
        largura: 85, altura: 340, offsetX: 196, offsetY: 70, escala: 0.34,
        hurtboxes: [
          { largura: 20, altura: 45, offsetX: 0, offsetY: -95 },
          { largura: 35, altura: 70, offsetX: -5, offsetY: -35 },
        ],
      },
      downAir: {
        largura: 85, altura: 340, offsetX: 248, offsetY: -5, escala: 0.34,
        hurtboxes: [
          { largura: 35, altura: 50, offsetX: 0, offsetY: -80 },
        ],
      },
      specialSing1: {
        largura: 85, altura: 340, offsetX: 140, offsetY: 36, escala: 0.34,
        hurtboxes: [
          { largura: 25, altura: 55, offsetX: 5, offsetY: -82 },
          { largura: 35, altura: 48, offsetX: 2, offsetY: -32 },
        ],
      },
      specialSing2: {
        largura: 85, altura: 340, offsetX: 157, offsetY: 42, escala: 0.34,
        hurtboxes: [
          { largura: 25, altura: 55, offsetX: 5, offsetY: -82 },
          { largura: 33, altura: 48, offsetX: 2, offsetY: -32 },
        ],
      },
      spin: {
        largura: 85, altura: 340, offsetX: 214, offsetY: 20, escala: 0.34,
        hurtboxes: [
          { largura: 35, altura: 55, offsetX: 0, offsetY: -82 },
          { largura: 45, altura: 48, offsetX: 0, offsetY: -32 },
        ],
      },
      spinLoop: {
        largura: 85, altura: 340, offsetX: 214, offsetY: 20, escala: 0.34,
        hurtboxes: [
          { largura: 35, altura: 55, offsetX: 0, offsetY: -82 },
          { largura: 45, altura: 48, offsetX: 0, offsetY: -32 },
        ],
      },
      spinFinal: {
        largura: 85, altura: 340, offsetX: 248, offsetY: -5, escala: 0.34,
        hurtboxes: [
          { largura: 35, altura: 50, offsetX: 0, offsetY: -80 },
          { largura: 40, altura: 50, offsetX: 20, offsetY: -25 },
        ],
      },
    };

   //   this.sons = {
   //  ...this.sons,
   //  pulo: ['spy_pulo_1', 'spy_pulo_2'],
   //  dash: ['spy_web_dash'],
   //  wind: ['spy_whoosh_leve'],
   // light: ['spy_hit_light_1'],
   //  heavy: ['spy_hit_heavy_1']
   // };


  
    // ============================ tabela de golpes =====================================
    //this.golpes = {
  

    this.golpes = {
      neutro1: {
        animacao: "miku_atack1",
        frameHitbox: 2,
        offsetX: 50,
        offsetY: -80,
        largura: 45,
        altura: 30,
        cooldown: 700,
        duracao: 400,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        propriedades: {
           tipoSomImpacto: "light",
          dano: 8,
          knockbackX: 30,
          knockbackY: 0,
          knockbackFixo: true,
          hitstunFrames: 17,
        },

        comboProximo: "neutro2",
        comboJanelaInicio: 200,
        comboJanelaFim: 300,
      },

      neutro2: {
        animacao: "miku_atack2",

        frameHitbox: 2,

        offsetX: 50,
        offsetY: -80,
        largura: 45,
        altura: 30,
        duracao: 400,
        cancelavel: true,
        propriedades: {
           tipoSomImpacto: "heavy",
          dano: 8,
          knockbackX: 40,
          knockbackY: 0,
          knockbackFixo: true,
          hitstunFrames: 18,
        },

        comboProximo: "neutro3",
        comboJanelaInicio: 200,
        comboJanelaFim: 400,
      },
      neutro3: {
        animacao: "miku_atack1",
        frameHitbox: 2,
       offsetX: 50,
        offsetY: -80,
        largura: 45,
        altura: 30,
        cooldown: 700,
        duracao: 350,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        propriedades: {
           tipoSomImpacto: "light",
          dano: 8,
          knockbackX: 30,
          knockbackY: 0,
          knockbackFixo: true,
          hitstunFrames: 17,
        },

        comboProximo: "neutro4",
        comboJanelaInicio: 200,
        comboJanelaFim: 300,
      },

      neutro4: {
        animacao: "miku_sideAtack",

        frameHitbox: 2,

        offsetX: 50,
        offsetY: -80,
        largura: 45,
        altura: 30,
        duracao: 500,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        movimento: {
         inicio: 50,
         fim: 300,
      x: {
         de: 500,
         para: 150,
        },

        curva: "easeIn",
       },

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
        animacao: "miku_sideAtack",
        frameHitbox: 2,
        offsetX: 52,
        offsetY: -60,
        largura: 55,
        altura: 50,
        cooldown: 900,
        duracao: 500,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

         movimento: {
         inicio: 50,
         fim: 300,
      x: {
         de: 500,
         para: 300,
        },

        curva: "easeIn",
       },

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 550,
          knockbackY: -400,
          tumbling: true,
        },
      },
     agachado: {
        animacao: "miku_downAtack",
        frameHitbox: 3,
        offsetX: 40,
        offsetY: -20,
        largura: 45,
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
        animacao: "miku_neutralAir",
        frameHitbox: 2,
        offsetX: 50,
        offsetY: -70,
        largura: 55,
        altura: 35,
        cooldown: 900,
        duracao: 350,
         finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 30,
        //cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        propriedades: {
          tipoSomImpacto: "light",
          dano: 12,
          knockbackX: 200,
          knockbackY: -450,
          tumbling: false,
        },
      },


      air_side: {
        animacao: "miku_sideAir",
        frameHitbox: 3,
        offsetX: 35,
        offsetY: -70,
        largura: 60,
        altura: 40,
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
        animacao: "miku_upAir",
        frameHitbox: 3,
        offsetX: 8,
        offsetY: -140,
        largura: 32,
        altura: 34,
        cooldown: 900,
        duracao: 600,
         finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 30,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

        movimento: {
         inicio: 10,
         fim: 500,
       y: {
         de: -400,
         para: -150,
        },

        curva: "easeIn",
       },

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 0,
          knockbackY: -500,
          tumbling: true,
        },
      },
      air_agachado: {
        // Usa os mesmos frames visuais dos outros aereos, mas uma chave propria
        // impede que o estado de ataque associe este golpe a outra configuracao.
        animacao: "miku_downAir",
        frameHitbox: 3,
        offsetX: 30,
        offsetY: -20,
        largura: 50,
        altura: 50,
        cooldown: 900,
        duracao: 400,
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
         inicio: 10,
         fim: 250,
       y: {
         de: 300,
         para: 150,
        },

        curva: "easeIn",
       },

        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 80,
          knockbackY: 400,
          quiqueChaoY: 400,
        },
      },
    }

  // --------------------------------- tabela especiais --------------------------
  this.specials = {
    neutro: {
      animacao: "miku_specialSing1",
      cooldown: 1800,
      logica: NotaCarregada,
      escalaNota: 0.8,
      larguraNota: 70,
      alturaNota: 70,
      velocidadeNota: 900,
      quedaNota: 0,
      tempoNota: 4000,
      tempoPoseLancamento: 560,
      tempoMinimoCarga: 1100,
      volumeSom: 0.8,
      propriedades: {
        tipoSomImpacto: "light",
        dano: 8,
        knockbackX: 250,
        knockbackY: -90,
        tumbling: false,
      },
    },
    air_neutro: {
      animacao: "miku_specialSing2",
      cooldown: 1800,
      logica: NotaCarregada,
      aereo: true,
      escalaNota: 0.8,
      larguraNota: 70,
      alturaNota: 70,
      velocidadeNota: 900,
      quedaNota: 0,
      tempoNota: 4000,
      tempoPoseLancamento: 560,
      tempoPausaAerea: 560,
      volumeSom: 0.8,
      propriedades: {
        tipoSomImpacto: "light",
        dano: 8,
        knockbackX: 250,
        knockbackY: -90,
        tumbling: false,
        travarMovimentoAir: true,
        anularGravidade: true,
      },
    },
    agachado: {
      animacao: "miku_dash",
      cooldown: 450,
      duracao: 340,
      logica: MikuPuppet,
    },
    lado: {
      animacao: "miku_spin",
      cooldown: 2200,
      logica: MikuSpin,
      propriedades: {
        tipoSomImpacto: "heavy",
        dano: 18,
        knockbackX: 430,
        knockbackY: -360,
        tumbling: true,
        travarMovimentoAir: true,
      },
    },
    air_lado: {
      animacao: "miku_spin",
      cooldown: 2200,
      logica: MikuSpin,
      propriedades: {
        tipoSomImpacto: "heavy",
        dano: 18,
        knockbackX: 430,
        knockbackY: -360,
        tumbling: true,
        travarMovimentoAir: true,
      },
    },
    air_cima: {
      animacao: "miku_spin",
      cooldown: 2500,
      duracao: 650,
      logica: AupSpecial,
      escalaMini: 0.25,
      velocidadeMini: 210,
      tempoVidaMini: 15000,
      cooldownMiniPuppets: 10000,
      propriedades: {
        impulsoY: -800,
        travarMovimentoAir: true,
        tipoSomImpacto: "light",
        dano: 1,
        knockbackX: 80,
        knockbackY: -45,
        knockbackFixo: true,
      },
    },
  };

  }
  //animaoes====================================================
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

    if (!scene.anims.exists("miku_nota_ataque_1")) {
      scene.anims.create({
        key: "miku_nota_ataque_1",
        frames: scene.anims.generateFrameNumbers("Miku_effects", { start: 133, end: 140 }),
        frameRate: 24,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("miku_nota_ataque_2")) {
      scene.anims.create({
        key: "miku_nota_ataque_2",
        frames: scene.anims.generateFrameNumbers("Miku_effects", { start: 142, end: 148 }),
        frameRate: 24,
        repeat: 0,
      });
    }
    // Se a animaÃ§Ã£o "idle" jÃ¡ existe na cena, nÃ£o recria
    if (scene.anims.exists("miku_idle")) return;

    // Idle (Parada)
    scene.anims.create({
      key: "miku_idle",
      frames: scene.anims.generateFrameNumbers("Miku_idle", {
        start: 0,
        end: 13,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_walk",
      frames: scene.anims.generateFrameNumbers("Miku_walk", {
        start: 1,
        end: 10,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_jump",
      frames: scene.anims.generateFrameNumbers("Miku_jump", {
        start: 0,
        end: 1,
      }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_crouch",
      frames: scene.anims.generateFrameNumbers("Miku_crouch1", {
        start: 0,
        end: 2,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "miku_crouch2",
      frames: scene.anims.generateFrameNumbers("Miku_crouch2", {
        start: 0,
        end: 0,
      }),
      frameRate: 1,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_crouch3",
      frames: scene.anims.generateFrameNumbers("Miku_crouch3", {
        start: 0,
        end: 2,
      }),
      frameRate: 12,
      repeat: 0,
    });


    scene.anims.create({
      key: "miku_dash",
      frames: scene.anims.generateFrameNumbers("Miku_dash", {
        start: 0,
        end: 4,
      }),
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "miku_guard",
      frames: scene.anims.generateFrameNumbers("Miku_guard", {
        start: 0,
        end: 1,
      }),
      frameRate: 4,
      repeat: 0,
    });

    scene.anims.create({
      key: "miku_taunt1",
      frames: scene.anims.generateFrameNumbers("Miku_taunt1", {
        start: 0,
        end: 28,
      }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_dano",
      frames: scene.anims.generateFrameNumbers("Miku_hurt1", {
        start: 0,
        end: 2,
      }),
      frameRate: 4,
      repeat: 0,
    });

    scene.anims.create({
     key: "miku_danoUp",
     frames: scene.anims.generateFrameNumbers("Miku_hurtUp", { start: 0, end: 3 }),
     frameRate: 8,
     repeat: 0,
   });

    scene.anims.create({
  key: "miku_danoSide",
  frames: scene.anims.generateFrameNumbers("Miku_hurtSide", { start: 0, end: 1 }),
  frameRate: 22,
  repeat: 0,
});

scene.anims.create({
  key: "miku_danoDown",
  frames: scene.anims.generateFrameNumbers("Miku_hurtDown", { start: 0, end: 1 }),
  frameRate: 2,
  repeat: 0,
});

     scene.anims.create({
     key: "miku_dead",
     frames: scene.anims.generateFrameNumbers("Miku_dead", { start: 0, end: 2 }),
     frameRate: 3,
     repeat: 0,
   });

     scene.anims.create({
     key: "miku_getup",
     frames: scene.anims.generateFrameNumbers("Miku_dead", { start: 0, end: 2 }),
     frameRate: 10,
     repeat: 0,
   });

    scene.anims.create({
      key: "miku_atack1",
      frames: scene.anims.generateFrameNumbers("Miku_neutro3", {
        start: 0,
        end: 3,
      }),
      frameRate: 12,
      repeat: 0,
    });
    scene.anims.create({
      key: "miku_atack2",
      frames: scene.anims.generateFrameNumbers("Miku_neutro3", {
        start: 4,
        end: 8,
      }),
      frameRate: 12,
      repeat: 0,
    });
    
    scene.anims.create({
      key: "miku_sideAtack",
      frames: scene.anims.generateFrameNumbers("Miku_sing2", {
        start: 0,
        end: 8,
      }),
      frameRate: 12,
      repeat: 0,
    });
    
    scene.anims.create({
      key: "miku_downAtack",
      frames: scene.anims.generateFrameNumbers("Miku_downAtack", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: 0,
    });
    scene.anims.create({
      key: "miku_neutralAir",
      frames: scene.anims.generateFrameNumbers("Miku_airplosion", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: 0,
    });
     scene.anims.create({
      key: "miku_upAir",
      frames: scene.anims.generateFrameNumbers("Miku_upAtack", {
        start: 0,
        end: 10,
      }),
      frameRate: 16,
      repeat: 0,
    });
     scene.anims.create({
      key: "miku_sideAir",
      frames: scene.anims.generateFrameNumbers("Miku_airplosion", {
        start: 0,
        end: 5,
      }),
      frameRate: 12,
      repeat: 0,
    });
     scene.anims.create({
      key: "miku_downAir",
      frames: scene.anims.generateFrameNumbers("Miku_airplosion", {
        start: 0,
        end: 4,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "miku_specialSing1",
      frames: scene.anims.generateFrameNumbers("Miku_sing1", { start: 0, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_specialSing2",
      frames: scene.anims.generateFrameNumbers("Miku_sing2", { start: 0, end: 9 }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "miku_nota_especial_1",
      frames: scene.anims.generateFrameNumbers("Miku_effects", { start: 148, end: 162 }),
      frameRate: 24,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_nota_especial_2",
      frames: scene.anims.generateFrameNumbers("Miku_effects", { start: 164, end: 182 }),
      frameRate: 24,
      repeat: -1,
    });
    scene.anims.create({
      key: "miku_spin",
      frames: scene.anims.generateFrameNumbers("Miku_spin", { start: 0, end: 20 }),
      frameRate: 24,
      repeat: 0,
    });
    scene.anims.create({
      key: "miku_spinLoop",
      frames: scene.anims.generateFrameNumbers("Miku_spin", { start: 7, end: 20 }),
      frameRate: 24,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_spinFinal",
      frames: scene.anims.generateFrameNumbers("Miku_airplosion", { start: 0, end: 5 }),
      frameRate: 9,
      repeat: 0,
    });

    scene.anims.create({
      key: "miku_spine",
      frames: scene.anims.generateFrameNumbers("Miku_spine", { start: 0, end: 23 }),
      frameRate: 24,
      repeat: 0,
    });
    scene.anims.create({
      key: "miku_puppet_move",
      frames: scene.anims.generateFrameNumbers("Miku_puppet", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
  }
}

















