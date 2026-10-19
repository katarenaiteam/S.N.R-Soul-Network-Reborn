import Personagem from "./Personagem.js";
import TH30NeSpecial from "./Specials/TH30/NeSpecial.js";
import TH30SideSpecial from "./Specials/TH30/SideSpecial.js";
import TH30DoSpecial from "./Specials/TH30/DoSpecial.js";
import TH30AupSpecial from "./Specials/TH30/AupSpecial.js";
import TH30AdownSpecial from "./Specials/TH30/AdownSpecial.js";
import TH30Ult from "./Ult/TH30Ult.js";


export default class TH30 extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    TH30.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "th_idle",
      "0",
      {
        velocidade: 300,
        forcaPulo: -660,
        maxPulos: 2,
        maxDash: 1,
        maxComboIndex: 3,
      },

      teclas,
      "th_",
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

this.nomePersonagem = "TH30";
    //============================= hitboxes ========================================

    this.configAnimacoes = {

       idle: {
        largura: 65,
        altura: 120,
        offsetX: 32,
        offsetY: 12,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 60, offsetX: 5, offsetY: -70 },
          { largura: 60, altura: 35, offsetX: 5, offsetY: -18 },
        ],
      },

      walk: {
        largura: 65,
        altura: 120,
        offsetX: 45,
        offsetY: -11,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 68, offsetX: 29, offsetY: -70 },
          { largura: 60, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      jump: {
        offsetVisualY: 10,
        largura: 65,
        altura: 120,
        offsetX: 21,
        offsetY: 68,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 70, offsetX: 7, offsetY: -90 },
          { largura: 30, altura: 50, offsetX: 7, offsetY: -25 },
        ],
      },


      crouch: {
        //offsetVisualX:
        largura: 80,
        altura: 60,
        offsetX: 11,
        offsetY: 62,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: -5, offsetY: -40 },
        ],
      },

      stun: {
        largura: 65,
        altra: 60,
        offsetX: 32,
        offsetY: 0,
        escuala: 1,
        hurtboxes: [
          { largura: 75, altura: 70, offsetX: 20, offsetY: -40 },
        ],
      },

      dash: {
        largura: 70,
        altura: 120,
        offsetX: 30,
        offsetY: 2.5,
        escala: 1,
        hurtboxes: [
           ],
      },

      guard: {
        largura: 65,
        altura: 120,
        offsetX: 25,
        offsetY: 12,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 65, offsetX: -5, offsetY: -85 },
          { largura: 55, altura: 50, offsetX: -5, offsetY: -25 },
        ],
      },

      taunt: {
        largura: 65,
        altura: 120,
        offsetX: 46,
        offsetY: 47,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 65, offsetX: -5, offsetY: -85 },
          { largura: 55, altura: 50, offsetX: -5, offsetY: -25 },
        ],
      },

        dano: {
  largura: 65,
  altura: 120,
  offsetX: 30,
  offsetY: 10,
  escala: 1,
  hurtboxes: [
    { largura: 50, altura: 65, offsetX: -5, offsetY: -80 }, // Tronco inclinado
    { largura: 50, altura: 30, offsetX: 15, offsetY: -25 },   // Pernas
  ],
},

      danoUp: {
        largura: 65,
        altura: 120,
        offsetX: 40,
        offsetY: 50,
        escala: 1,
        hurtboxes: [
          { largura: 70, altura: 60, offsetX: -30, offsetY: -80 },
          { largura: 45, altura: 40, offsetX: 20, offsetY: -30 },
        ],
      },

      danoSide: {
        largura: 65,
        altura: 100,
        offsetX: 40,
        offsetY: 45,
        escala: 1,
        hurtboxes: [
          { largura: 70, altura: 60, offsetX: -30, offsetY: -80 },
          { largura: 45, altura: 40, offsetX: 20, offsetY: -30 },
        ],
      },

      danoDown: {
        largura: 65,
        altura: 100,
        offsetX: 40,
        offsetY: 55,
        escala: 1,
        hurtboxes: [
          { largura: 70, altura: 60, offsetX: -10, offsetY: -70 },
      
        ],
      },

 
      dead: {
        offsetVisualY: 20,
        largura: 80,
        altura: 33,
        offsetX: 35,
        offsetY: 50,
        escala: 1,
        hurtboxes: [
          { largura: 100, altura: 34, offsetX: -10, offsetY: -18 },
          { largura: 40, altura: 20, offsetX: -60, offsetY: -12 },
          { largura: 50, altura: 25, offsetX: 50, offsetY: -12 },
        ],
      },

      
      getup: {
        largura: 65,
        altura: 100,
        offsetX: 30,
        offsetY: 70,
        escala: 1,
        hurtboxes: [],
      },

      atack1: {
        offsetVisualX:25,
        largura: 65,
        altura: 120,
        offsetX: 60,
        offsetY: 12,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 67, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      atack2: {
        largura: 65,
        altura: 120,
        offsetX: 37,
        offsetY: 30,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 67, altura: 35, offsetX: 0, offsetY: -18 },
        ],
      },

      atack3: {
        largura: 65,
        altura: 120,
        offsetX: 28,
        offsetY: 67,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 60, offsetX: 0, offsetY: -70 },
          { largura: 45, altura: 35, offsetX: 5, offsetY: -18 },
        ],
      },

      neutralAir: {
        offsetVisualY: 10,
        largura: 65,
        altura: 120,
        offsetX: 52,
        offsetY: 68,
        escala: 1,
        hurtboxes: [
          { largura: 50, altura: 55, offsetX: 1, offsetY: -85 },
        ],
      },

      sideAtack: {
    
        largura: 65,
        altura: 120,
        offsetX: 51,
        offsetY: 9,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 100, offsetX: 10, offsetY: -50 }],
      },

      sideS2: {
        largura: 65,
        altura: 120,
        offsetX: 64,
        offsetY: 66,
        escala: 1,
        hurtboxes: [
          { largura: 55, altura: 75, offsetX: 0, offsetY: -82 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -35 },
        ],
      },

      downAtack: {
        offsetVisualX:15,
        largura: 65,
        altura: 60,
        offsetX: 85,
        offsetY: 39,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 65, offsetX: -40, offsetY: -35 }],
      },

      sideAir: {
        largura: 65,
        altura: 120,
        offsetX: 53,
        offsetY: 7,
        escala: 1,
        hurtboxes: [{ largura: 55, altura: 80, offsetX: 10, offsetY: -65 }],
      },

      upAir: {  
        offsetVisualX:20,
        largura: 65,
        altura: 120,
        offsetX: 72,
        offsetY: 60,
        escala: 1,
        hurtboxes: [{ largura: 55, altura: 110, offsetX: -15, offsetY: -70 }],
      },

      downAir: {
        largura: 65,
        altura: 120,
        offsetX: 35,
        offsetY: 58,
        escala: 1,
        hurtboxes: [{ largura: 60, altura: 80, offsetX: -5, offsetY: -90 }],
      },

      neSpecial: {  
        offsetVisualY:0,
        largura: 65,
        altura: 120,
        offsetX: 33,
        offsetY: 26,
        escala: 1,
        hurtboxes: [{ largura: 45, altura: 120, offsetX: 0, offsetY: -60 }],
      },

      intro: {
        largura: 65,
        altura: 120,
        offsetX: 7,
        offsetY: -13,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 60, offsetX: 5, offsetY: -70 },
          { largura: 60, altura: 35, offsetX: 5, offsetY: -18 },
        ],
      },

      dive: {
        offsetVisualY: 5,
        largura: 65,
        altura: 120,
        offsetX: 24,
        offsetY: 29,
        escala: 1,
        hurtboxes: [
          
          { largura: 55, altura: 40, offsetX: 5, offsetY: -30 },
        ],
      },

      spike: {
        largura: 65,
        altura: 120,
        offsetX: 48,
        offsetY: 49,
        escala: 1,
        hurtboxes: [
        
          { largura: 60, altura: 35, offsetX: 5, offsetY: -18 },
        ],
      },

      AdoSpecial: {
        largura: 65,
        altura: 100,
        offsetX: 23,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 55, offsetX: 5, offsetY: -68 },
          { largura: 55, altura: 30, offsetX: 5, offsetY: -30 },
        ],
      },
      AupSpecial: {
        largura: 65,
        altura: 100,
        offsetX: 23,
        offsetY: 0,
        escala: 1,
        hurtboxes: [
          { largura: 45, altura: 55, offsetX: 5, offsetY: -78 },
          { largura: 55, altura: 30, offsetX: 5, offsetY: -40 },
        ],
      },
    };

  //  this.sons = {
  //    ...this.sons,
  //    vozAtaque: ["ken-punch1", "ken-punch1", "ken-punch2", "ken-punch3", "ken-punch4"],
  //    vozDanoNormal: ["ken-damaged1", "ken-damaged2", "ken-damaged3"],
  //     vozDanoForte: ["ken-damaged1", "ken-damaged2", "ken-damaged3"],
  //     volumeVoz: 0.4,
  //   };

    // ============================ tabela de golpes =====================================
    this.golpes = {
      neutro1: {
        animacao: "th_atack1",
        frameHitbox: 4,
        offsetX: 55,
        offsetY: -75,
        largura: 85,
        altura: 20,
        cooldown: 700,
        duracao: 300,
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
          hitstunFrames: 35,
          hitsSemDecay: 3
        },

        comboProximo: "neutro2",
        comboJanelaInicio: 100,
        comboJanelaFim: 300,
      },

      neutro2: {
        animacao: "th_atack2",

        frameHitbox: 2,

        offsetX: 40,
        offsetY: -30,
        largura: 45,
        altura: 65,
        duracao: 400,
        cancelavel: true,
        propriedades: {
           tipoSomImpacto: "heavy",
          dano: 4,
          knockbackX: 40,
          knockbackY: -30,
          knockbackFixo: true,
          hitstunFrames: 30,
        },

        comboProximo: "neutro3",
        comboJanelaInicio: 200,
        comboJanelaFim: 400,
      },

      neutro3: {
        animacao: "th_atack3",

        frameHitbox: 3,

        offsetX: 30,
        offsetY: -132,
        largura: 35,
        altura: 80,
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
          knockbackY: -494,
          tumbling: true,
          hitstunMinFrames:35,
          
        },
      },

      side: {
        animacao: "th_sideAtack",
        frameHitbox: 4,
        offsetX: 40,
        offsetY: -65,
        largura: 67,
        altura: 25,
        cooldown: 900,
        duracao: 500,
        cancelavel: true,

         vfxAcerto: [{ escolherUm: [ "punch1", "punch2", "punch3", 
           ],
          },
        ],

         movimento: {
    inicio: 20,
    fim: 200,
    x: {
      de: 450,
      para: 550,
    },
   

    curva: "easeOut",
  },

        propriedades: {
          travarMovimentoAir: true,
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 630,
          knockbackY: -420,
          tumbling: true,
        },
      },
     agachado: {
        animacao: "th_downAtack",
        frameHitbox: 3,
        offsetX: 35,
        offsetY: -48,
        largura: 140,
        altura: 38,
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
          knockbackX: 350,
          knockbackY: -200,
          tumbling: true,
          hitstunMinFrames:35,
        },
      },

        air_neutro: {
        animacao: "th_neutralAir",
        frameHitbox: 3,
        offsetX: 0,
        offsetY: -135,
        largura: 150,
        altura: 30,
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
          knockbackY: -450,
          tumbling: false,
          knockbackFixo: true,
          hitstunMinFrames:30,
        },
      },


      air_side: {
        animacao: "th_sideAir",
        frameHitbox: 3,
        offsetX: 56,
        offsetY: -70,
        largura: 40,
        altura: 60,
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
          knockbackX: 630,
          knockbackY: -490,
          tumbling: true,
        },
      },
      air_cima: {
        animacao: "th_upAir",
        frameHitbox: 3,
        offsetX: 30,
        offsetY: -122,
        largura: 60,
        altura: 100,
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
          knockbackX: 182,
          knockbackY: -490,
           hitstunMinFrames:25,
          tumbling: true,
        },
      },
      air_agachado: {
        animacao: "th_downAir",
        frameHitbox: 2,
        offsetX: 35,
        offsetY: -15,
        largura: 60,
        altura: 60,
        cooldown: 900,
        duracao: 900,
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
    inicio: 80,
    fim: 500,
    x: {
      de: 700,
      para: 500,
    },
    y: {
      de: 750,
      para: 590,
    },

    curva: "easeOut",
  },
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 12,
          knockbackX: 112,
          knockbackY: 500,
          quiqueChaoY: 350,
          hitstunMinFrames:35,
        },
      },
    }

    // specials
    this.specials = {
      lado: {
        animacao: "th_sideS2",
        logica: TH30SideSpecial,
        duracao: 1800,
        cooldown: 1800,
        cancelavel: false,
        hitboxes: {
          3: { largura: 60, altura: 45, offsetX: 50, offsetY: -95 },
          6: { largura: 60, altura: 55, offsetX: 45, offsetY: -95 },
          10: { largura: 60, altura: 65, offsetX: 50, offsetY: -105 },
          14: { largura: 60, altura: 105, offsetX: 25, offsetY: -120 },
          21: { largura: 145, altura: 120, offsetX: 20, offsetY: -100 },
        },
        propriedades: {
          tipoSomImpacto: "heavy",
          dano: 25,
          knockbackX: 400,
          knockbackY: -500,
          tumbling: true,
        },
      },
      agachado: {
        animacao: "th_dive",
        logica: TH30DoSpecial,
        duracao: 8500,
        cooldown: 1600,
        cancelavel: false,
        hitbox: {
          largura: 140,
          altura: 130,
          offsetX: 0,
          offsetY: -70,
        },
        propriedades: {
          travarMovimentoAir: true,
          tipoSomImpacto: "heavy",
          dano: 14,
          knockbackX: 120,
          knockbackY: -350,
          tumbling: true,
        },
      },
      neutro: {
        animacao: "th_neSpecial",
        logica: TH30NeSpecial,
        duracao: 700,
        cooldown: 1200,
        cancelavel: false,
        velocidadeProjetil: 1100,
        tempoMaximoProjetil: 5000,
        escalaProjetil: 1,
        alphaProjetil: 1,
        quadroProjetil: 5,
        offsetProjetilX: 24,
        offsetProjetilY: -68,
        offsetEfeitoX: 80,
        offsetEfeitoY: -68,
        escalaEfeito: 1.1,
        larguraProjetil: 40,
        alturaProjetil: 36,
        propriedades: {
          dano: 10,
          knockbackX: 360,
          knockbackY: -200,
          tipoSomImpacto: "heavy",
        },
      },
      air_cima: {
        animacao: "th_AdoSpecial",
        configuracaoAnimacao: "AupSpecial",
        logica: TH30AupSpecial,
        cooldown: 2200,
        cancelavel: false,
        hitbox: {
          largura: 80,
          altura: 70,
          offsetX: 0,
          offsetY: -60,
        },
        propriedades: {
          travarMovimentoAir: true,
          tipoSomImpacto: "heavy",
          dano: 10,
          knockbackX: 260,
          knockbackY: -520,
          tumbling: true,
        },
      },
      air_agachado: {
        animacao: "th_AdoSpecial_down",
        configuracaoAnimacao: "AdoSpecial",
        logica: TH30AdownSpecial,
        cooldown: 2200,
        cancelavel: false,
        hitbox: {
          largura: 75,
          altura: 70,
          offsetX: 0,
          offsetY: -45,
        },
        propriedades: {
          travarMovimentoAir: true,
          tipoSomImpacto: "heavy",
          dano: 10,
          knockbackX: 260,
          knockbackY: 520,
          tumbling: true,
        },
      },
    };
    this.specials.air_lado = {
      ...this.specials.lado,
      animacao: "th_sideS2_air",
      configuracaoAnimacao: "sideS2",
      chaveCooldown: "lado",
      multiplicadorAvanco: 2.5,
      propriedades: {
        ...this.specials.lado.propriedades,
        travarMovimentoAir: true,
      },
    };
    this.specials.air_neutro = {
      ...this.specials.neutro,
      animacao: "th_neSpecial_air",
      chaveCooldown: "neutro",
      duracao: 400,
      quantidadeProjeteis: 3,
      velocidadesProjetilY: [-220, 0, 220],
      velocidadeProjetil: 650,
      tempoMaximoProjetil: 350,
      escalaProjetil: 1.15,
      larguraProjetil: 42,
      alturaProjetil: 42,
      offsetCorpoProjetilY: 41,
      propriedades: {
        ...this.specials.neutro.propriedades,
        travarMovimentoAir: true,
      },
    };


    this.ult = { animacao: "th_taunt", logica: TH30Ult };

  }

  //animaçoes====================================================


  update() {
    super.update();
    this.transformacaoTH30?.atualizar();
  }

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

if (!scene.anims.exists("th_dive")) {
  scene.anims.create({
    key: "th_dive",
    frames: scene.anims.generateFrameNumbers("th_dive", { start: 0, end: 10 }),
    frameRate: 24,
    repeat: 0,
  });
}

if (!scene.anims.exists("th_soup_loop")) {
  scene.anims.create({
    key: "th_soup_loop",
    frames: scene.anims.generateFrameNumbers("th_soup", { start: 0, end: 5 }),
    frameRate: 10,
    repeat: -1,
  });
}

if (!scene.anims.exists("th_spike")) {
  scene.anims.create({
    key: "th_spike",
    frames: scene.anims.generateFrameNumbers("th_spike", { start: 8, end: 10 }),
    frameRate: 24,
    repeat: 0,
  });
}

    if (scene.anims.exists("th_idle")) return;

    // Idle (Parada)
    scene.anims.create({
      key: "th_idle",
      frames: scene.anims.generateFrameNumbers("th_idle", {
        start: 0,
        end: 6,
      }),
      frameRate: 12,
      repeat: -1,
    });


     scene.anims.create({
      key: "th_intro",
      frames: scene.anims.generateFrameNumbers("th_intro", {
        start: 0,
        end: 61,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_walk",
      frames: scene.anims.generateFrameNumbers("th_walk", {
        start: 0,
        end: 7,
      }),
      frameRate: 12,
      repeat: -1,
    });

    scene.anims.create({
      key: "th_jump",
      frames: scene.anims.generateFrameNumbers("th_jump", {
        start: 0,
        end: 9,
      }),
      frameRate: 18,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_crouch",
      frames: scene.anims.generateFrameNumbers("th_crouch", {
        start: 0,
        end: 2,
      }),
      frameRate: 20,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_crouch2",
      frames: scene.anims.generateFrameNumbers("th_crouch", {
        start: 2,
        end: 2,
      }),
      frameRate: 10,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_crouch3",
      frames: scene.anims.generateFrameNumbers("th_crouch", {
        start: 2,
        end: 4,
      }),
      frameRate: 20,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_dash",
      frames: scene.anims.generateFrameNumbers("th_dash", {
        start: 0,
        end: 1,
      }),
      frameRate: 12,
      repeat: 0,
    });

     scene.anims.create({
      key: "th_guard",
      frames: scene.anims.generateFrameNumbers("th_guard", {
        start: 0,
        end: 1,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_taunt",
      frames: scene.anims.generateFrameNumbers("th_taunt", {
        start: 0,
        end: 9,
      }),
      frameRate: 12,
      repeat: 0,
    });

    scene.anims.create({
      key: "th_dano",
      frames: scene.anims.generateFrameNumbers("th_dano", {
        start: 0,
        end: 1,
      }),
      frameRate: 4,
      repeat: 0,
    });

    scene.anims.create({
     key: "th_danoUp",
     frames: scene.anims.generateFrameNumbers("th_hurt1", { start: 0, end: 1 }),
     frameRate: 10,
     repeat: 0,
   });

    scene.anims.create({
  key: "th_danoSide",
  frames: scene.anims.generateFrameNumbers("th_hurt2", { start: 0, end: 3 }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "th_danoDown",
  frames: scene.anims.generateFrameNumbers("th_hurt1", { start: 3, end: 5 }),
  frameRate: 12,
  repeat: 0,
});

     scene.anims.create({
     key: "th_dead",
     frames: scene.anims.generateFrameNumbers("th_dead", { start: 0, end: 2 }),
     frameRate: 12,
     repeat: 0,
   });

     scene.anims.create({
     key: "th_getup",
     frames: scene.anims.generateFrameNumbers("th_getup", { start: 0, end: 13 }),
     frameRate: 25,
     repeat: 0,
   });

   scene.anims.create({
  key: "th_stun",
  frames: scene.anims.generateFrameNumbers("th_stun", { start: 0, end: 3 }),
  frameRate: 8,
  repeat: 0,
});

scene.anims.create({
  key: "th_atack1",
  frames: scene.anims.generateFrameNumbers("th_atack1", { start: 0, end: 6 }),
  frameRate: 18,
  repeat: 0,
});

scene.anims.create({
  key: "th_atack2",
  frames: scene.anims.generateFrameNumbers("th_atack2", { start: 0, end: 3 }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "th_atack3",
  frames: scene.anims.generateFrameNumbers("th_atack3", { start: 0, end: 8 }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "th_sideAtack",
  frames: scene.anims.generateFrameNumbers("th_sideAtack", { start: 0, end: 6 }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "th_downAtack",
  frames: scene.anims.generateFrameNumbers("th_downAtack", { start: 0, end: 7 }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "th_AdoSpecial",
  frames: scene.anims.generateFrameNumbers("th_AdoSpecial", { start: 0, end: 7 }),
  frameRate: 12,
  repeat: 0,
});

if (!scene.anims.exists("th_AdoSpecial_down")) {
  scene.anims.create({
    key: "th_AdoSpecial_down",
    frames: scene.anims.generateFrameNumbers("th_AdoSpecial", { start: 0, end: 11 }),
    frameRate: 12,
    repeat: 0,
  });
}

if (!scene.anims.exists("th_neSpecial")) {
  scene.anims.create({
    key: "th_neSpecial",
    frames: scene.anims.generateFrameNumbers("th_neSpecial", { start: 0, end: 8 }),
    frameRate: 16,
    repeat: 0,
  });
}

if (!scene.anims.exists("th_neSpecial_air")) {
  scene.anims.create({
    key: "th_neSpecial_air",
    frames: scene.anims.generateFrameNumbers("th_neSpecial", { start: 0, end: 8 }),
    frameRate: 24,
    repeat: 0,
  });
}

if (!scene.anims.exists("th_sideS2")) {
  scene.anims.create({
    key: "th_sideS2",
    frames: scene.anims.generateFrameNumbers("th_sideS2", { start: 0, end: 21 })
      .map((frame) => ({
        ...frame,
        duration: frame.frame === 10 || frame.frame === 21 ? 180 : 55,
      })),
    frameRate: 18,
    repeat: 0,
  });
}

if (!scene.anims.exists("th_sideS2_air")) {
  scene.anims.create({
    key: "th_sideS2_air",
    frames: scene.anims.generateFrameNumbers("th_sideS2", { start: 0, end: 21 })
      .map((frame) => ({
        ...frame,
        duration: frame.frame === 10 || frame.frame === 21 ? 90 : 35,
      })),
    frameRate: 18,
    repeat: 0,
  });
}

if (!scene.anims.exists("th_proj_voo")) {
  scene.anims.create({
    key: "th_proj_voo",
    frames: scene.anims.generateFrameNumbers("th_proj", { start: 0, end: 17 }),
    frameRate: 18,
    repeat: -1,
  });
}

if (!scene.anims.exists("th_proj_explosao")) {
  scene.anims.create({
    key: "th_proj_explosao",
    frames: scene.anims.generateFrameNumbers("th_proj", { start: 18, end: 24 }),
    frameRate: 18,
    repeat: 0,
  });
}

scene.anims.create({
  key: "th_neutralAir",
  frames: scene.anims.generateFrameNumbers("th_neutralAir", { start: 0, end: 4 }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "th_sideAir",
  frames: scene.anims.generateFrameNumbers("th_sideAir", { start: 0, end: 7}),
  frameRate: 16,
  repeat: 0,
});

scene.anims.create({
  key: "th_upAir",
  frames: scene.anims.generateFrameNumbers("th_upAir", { start: 0, end: 5 }),
  frameRate: 12,
  repeat: 0,
});

scene.anims.create({
  key: "th_downAir",
  frames: scene.anims.generateFrameNumbers("th_downAir", { start: 0, end: 12 }),
  frameRate: 12,
  repeat: 0,
});

  }
}
