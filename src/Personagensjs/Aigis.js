import Personagem from "./Personagem.js";
import AigisNeSpecial from "./Specials/Aigis/NeSpecial.js";
import AigisAneSpecial from "./Specials/Aigis/AneSpecial.js";
import AigisAsiSpecial from "./Specials/Aigis/AsiSpecial.js";
import AigisAdoSpecial from "./Specials/Aigis/AdoSpecial.js";
import AigisAupSpecial from "./Specials/Aigis/AupSpecial.js";
import AigisDoSpecial from "./Specials/Aigis/DoSpecial.js";
import AigisSideSpecial from "./Specials/Aigis/SideSpecial.js";
import AigisUlt from "./Ult/AigisUlt.js";
import { obterTexturaAuraAigis } from "./Specials/Aigis/AupSpecial.js";
import AigisPersonaNeSpecial from "./Specials/Aigis/NePersonaSpecial.js";
import AigisPersonaDoSpecial from "./Specials/Aigis/DoPersonaSpecial.js";
import AigisPersonaSideSpecial from "./Specials/Aigis/SidePersonaSpecial.js";


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
        maxComboIndex: 3,
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

  explosaoAtaque2: {
    textura: "ai_siExp",
    animacao: "ai_siExp_ataque",
    escala: 0.24,
    blendMode: Phaser.BlendModes.ADD,
    alpha: 0.85,
  },

  explosaoAtaque3: {
    textura: "ai_bulet1",
    animacao: "ai_bulet1_ataque",
    escala: 0.8,
    blendMode: Phaser.BlendModes.ADD,
    alpha: 1,
  },

  fumacaPulo: { escala: 0.25, offsetX: 30, offsetY: -10 },

};

this.framesEfeitosCombo = {
  ai_atack2: new Set(),
  ai_sideAtack: new Set(),
  ai_downAtack: new Set(),
};
this.efeitoAtaque3Criado = false;
this.tocarEfeitoCombo = (nome, x, y, opcoes = {}) => {
  const efeito = this.vfx.tocar(nome, { offsetX: x, offsetY: y });
  if (!efeito) return null;
  const eExplosaoPequena = nome === "explosaoAtaque2";
  const duracaoEfeito = eExplosaoPequena ? 1000 / 18 * 4 : 1000 / 36 * 17;
  this.scene.tweens.add({
    targets: efeito,
    alpha: 0,
    delay: 300,
    duration: eExplosaoPequena ? 180 : 160,
    ease: "Quad.easeOut",
  });
  if (opcoes.compensarMovimento) {
    const velocidadeX = this.sprite.body?.velocity.x ?? 0;
    const duracaoCompensacao = opcoes.duracaoCompensacaoMovimento ?? duracaoEfeito;
    const deltaX = velocidadeX * (duracaoCompensacao / 1000) *
      (opcoes.fatorCompensacaoMovimento ?? 1);
    this.scene.tweens.add({
      targets: efeito,
      x: efeito.x + deltaX,
      duration: duracaoCompensacao,
      ease: "Linear",
    });
  }
  return efeito;
};
this.etapasEfeitosCombo = {
  ai_atack2: [
    { textura: 7, sequencia: 2, x: 50, y: -100 },
    { textura: 9, sequencia: 4, x: 43, y: -126 },
    { textura: 11, sequencia: 6, x: 28, y: -146 },
  ],
  ai_sideAtack: [
    { textura: 7, sequencia: 7, x: 65, y: -100 },
    { textura: 9, sequencia: 9, x: 55, y: -126 },
    { textura: 11, sequencia: 11, x: 43, y: -146 },
  ],
  ai_downAtack: [
    { textura: 7, sequencia: 2, x: 50, y: -80 },
    { textura: 9, sequencia: 4, x: 43, y: -106 },
    { textura: 11, sequencia: 6, x: 23, y: -123 },
  ],
};
this.aoAtualizarEfeitosCombo = (anim, frame) => {
  const frameTextura = Number(frame.textureFrame);
  const frameSequencia = frame.index;
  const etapas = this.etapasEfeitosCombo[anim.key];
  if (etapas) {
    const indice = etapas.findIndex(etapa =>
      frameTextura === etapa.textura || frameSequencia === etapa.sequencia
    );
    const framesDisparados = this.framesEfeitosCombo[anim.key];
    if (indice < 0 || framesDisparados.has(indice)) return;
    framesDisparados.add(indice);
    const ponto = etapas[indice];
    this.tocarEfeitoCombo("explosaoAtaque2", ponto.x, ponto.y, {
      compensarMovimento: anim.key === "ai_sideAtack",
      duracaoCompensacaoMovimento: 300,
      fatorCompensacaoMovimento: 0.35,
    });
  } else if (anim.key === "ai_atack3" && !this.efeitoAtaque3Criado &&
    (frameTextura === 16 || frameSequencia === 3)) {
    this.efeitoAtaque3Criado = true;
    // O centro fica adiante da mão para alinhar o início brilhante do sprite.
    this.tocarEfeitoCombo("explosaoAtaque3", 110, -100);
  }
};
this.aoIniciarComboAtaque = (anim) => {
  this.framesEfeitosCombo[anim.key]?.clear();
  if (anim.key === "ai_atack3") this.efeitoAtaque3Criado = false;
};
this.sprite.on("animationstart", this.aoIniciarComboAtaque);
this.sprite.on("animationupdate", this.aoAtualizarEfeitosCombo);
this.scene.events.once("shutdown", () => {
  this.sprite?.off("animationstart", this.aoIniciarComboAtaque);
  this.sprite?.off("animationupdate", this.aoAtualizarEfeitosCombo);
});



this.nomePersonagem = "Aigis";
    this.ult = AigisUlt.configuracao;
    this.modoUltAigisAtivo = false;
    this.aigisUltAtivando = false;
    this.guardMaximoNormal = this.guardMaximo;
    this.ultimaGuardaModoUlt = false;
    this.personaGuardaUlt = null;
    this.auraModoUlt = null;
    this.tweenAuraModoUlt = null;
    this.scene.events.once("shutdown", () => {
      this.auraModoUlt?.destroy();
      this.personaGuardaUlt?.destroy();
      this.tweenAuraModoUlt?.stop();
    });
    this.tauntPausaFinal = 0; // Encerra o taunt sem segurar o último frame.
    //============================= hitboxes ========================================
   
    this.configAnimacoes = {
      
       idle: {
        largura: 220,
        altura: 400,
        offsetX: 0,
        offsetY: -9,
        escala: 0.33,
        hurtboxes: [
          { largura: 30, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      walk: {
        largura: 220,
        altura: 400,
        offsetX: 0,
        offsetY: -7,
        escala: 0.33,
        hurtboxes: [
           { largura: 30, altura: 40, offsetX: 0, offsetY: -107 },
          { largura: 35, altura: 48, offsetX: 0, offsetY: -67 },
          { largura: 30, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      jump: {
        largura: 220,
        altura: 400,
        offsetX: 8,
        offsetY: -6,
        escala: 0.33,
        hurtboxes: [
           { largura: 30, altura: 43, offsetX: 0, offsetY: -105 },
          { largura: 26, altura: 25, offsetX: 2, offsetY: -72 },
          { largura: 18, altura: 40, offsetX: 0, offsetY: -30 },
        ],
      },

      
      crouch: {
        largura: 220,
        altura: 240,
        offsetX: -5,
        offsetY: 72,
        escala: 0.33,
        hurtboxes: [
          { largura: 50, altura: 70, offsetX: 0, offsetY: -38 },
        ],
      },

        crouch2: {
        largura: 220,
        altura: 240,
        offsetX: -5,
        offsetY: 72,
        escala: 0.33,
        hurtboxes: [
          { largura: 50, altura: 70, offsetX: 0, offsetY: -38 },
        ],
      },

      crouch3: {
        largura: 220,
        altura: 240,
        offsetX: -5,
        offsetY: 72,
        escala: 0.33,
        hurtboxes: [
          { largura: 50, altura: 70, offsetX: 0, offsetY: -38 },
        ],
      },
       

      dash: {
        offsetVisualY: 5,
        largura: 220,
        altura: 400,
        offsetX: 130,
        offsetY: -28,
        escala: 0.33,
        hurtboxes: [],
      },

      NeSpecialUlt: {
        largura: 220,
        altura: 400,
        offsetX: 55,
        offsetY: 15,
        escala: 0.33,
        hurtboxes: [
          { largura: 30, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      NeSpecialUltAir: {
        largura: 220,
        altura: 400,
        offsetX: 10,
        offsetY: 19,
        escala: 0.33,
        hurtboxes: [
          { largura: 30, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      DoSpecialUlt: {
        largura: 220,
        altura: 400,
        offsetX: 20,
        offsetY: -85,
        escala: 0.33,
        hurtboxes: [
          { largura: 30, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      invoc3_special: {
        largura: 220,
        altura: 400,
        offsetX: 0,
        offsetY: 6,
        escala: 0.33,
        hurtboxes: [
          { largura: 30, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      ult_siSpecial: {
        largura: 220,
        altura: 400,
        offsetX: 0,
        offsetY: -100,
        escala: 0.33,
        hurtboxes: [
          { largura: 30, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      DoSpecialUltAir: {
        largura: 220,
        altura: 400,
        offsetX: 0,
        offsetY: -8,
        escala: 0.33,
        hurtboxes: [
          { largura: 30, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      guard: {
        largura: 220,
        altura: 400,
        offsetX: 11,
        offsetY: -55,  //-49
        escala: 0.33,
        hurtboxes: [
          { largura: 35, altura: 40, offsetX: 0, offsetY: -95 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 }
        ],
      },
      stun: {
        largura: 220,
        altura: 240,
        offsetX: 95,
        offsetY: 50,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 70, offsetX: 23, offsetY: -38 },
        ],
      },

      taunt: {
        
        largura: 220,
        altura: 400,
        offsetX: 30,
        offsetY: -15,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

        dano: {
  largura: 220,
  altura: 400,
  offsetX: 0,
  offsetY: -109,
  escala: 0.33,
  hurtboxes: [
    { largura: 50, altura: 65, offsetX: -10, offsetY: -60 }, // Tronco inclinado
    { largura: 50, altura: 30, offsetX: 0, offsetY: -15 },   // Pernas
  ],
},


     
      danoUp: {
        largura: 220,
        altura: 400,
        offsetX: 0,
        offsetY: 40,
        escala: 0.33,
        hurtboxes: [
          { largura: 55, altura: 70, offsetX: 20, offsetY: -80 },
          { largura: 45, altura: 40, offsetX: 0, offsetY: -15 },
        ],
      },

      danoSide: {
        largura: 220,
        altura: 400,
        offsetX: 113,
        offsetY: 20,
        escala: 0.33,
        hurtboxes: [
          { largura: 65, altura: 55, offsetX: -15, offsetY: -90 }, // Tronco inclinado
          { largura: 50, altura: 45, offsetX: 30, offsetY: -70 },   // Pernas
        ],
      },
     
      danoDown: {
        largura: 220,
        altura: 400,
        offsetX: 100,
        offsetY: 40,
        escala: 0.33,
        hurtboxes: [
          { largura: 60, altura: 65, offsetX: -10, offsetY: -60 }, 
          { largura: 50, altura: 45, offsetX: 0, offsetY: -10 },
        ],
      },

    
      dead: {
        largura: 220,
        altura: 250,
        offsetX: 120,
        offsetY: 86,
        escala: 0.33,
        hurtboxes: [
          { largura: 100, altura: 34, offsetX: -10, offsetY: -18 },
          { largura: 40, altura: 20, offsetX: -60, offsetY: -12 },
          { largura: 50, altura: 25, offsetX: 50, offsetY: -12 },
        ],
      },

      
      getup: {
        largura: 220,
        altura: 400,
        offsetX: 90,
        offsetY: -70,
        escala: 0.3,
        hurtboxes: [],
      },

      atack1: {
       
        offsetVisualY: 0, // Positivo para baixo; negativo para cima.
        largura: 220,
        altura: 400,
        offsetX: 73,
        offsetY: 47,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      atack2: {
        
        offsetVisualY: 0, // Positivo para baixo; negativo para cima.
        largura: 220,
        altura: 400,
        offsetX: 73,
        offsetY: 47,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      atack3: {
       
        offsetVisualY: 0, // Positivo para baixo; negativo para cima.
        largura: 220,
        altura: 400,
        offsetX: 73,
        offsetY: 47,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      neutralAir: {
        offsetVisualX: 16,
         largura: 220,
        altura: 400,
        offsetX: 45,
        offsetY: -26,
        escala: 0.33,
        hurtboxes: [
          { largura: 35, altura: 35, offsetX: 26, offsetY: -90 },
          { largura: 26, altura: 25, offsetX: 0, offsetY: -72 },
          { largura: 18, altura: 40, offsetX: 0, offsetY: -30 },
        ],
      },

      sideAtack: {
        offsetVisualX: 3,
         largura: 220,
        altura: 400,
        offsetX: 65,
        offsetY: 46,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 15, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 14, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 10, offsetY: -25 },
        ],
      },

      downAtack: {
           largura: 220,
        altura: 240,
        offsetX: 20,
        offsetY: 105,
        escala: 0.33,
        hurtboxes: [
          { largura: 50, altura: 70, offsetX: 20, offsetY: -38 }],
      },

      sideAir: {
        largura: 220,
        altura: 400,
        offsetX: 100,
        offsetY: -20,
        escala: 0.33,
        hurtboxes: [
           { largura: 40, altura: 43, offsetX: 26, offsetY: -105 },
          { largura: 46, altura: 25, offsetX: 32, offsetY: -72 },
          { largura: 18, altura: 40, offsetX: 20, offsetY: -30 },
        ],
      },

      upAir: {  
        largura: 220,
        altura: 400,
        offsetX: 55,
        offsetY: 40,
        escala: 0.33,
        hurtboxes: [
           { largura: 40, altura: 43, offsetX: 26, offsetY: -105 },
          { largura: 46, altura: 25, offsetX: 32, offsetY: -72 },
          { largura: 18, altura: 40, offsetX: 20, offsetY: -30 },
        ],
      },

      downAir: {
  
         largura: 220,
        altura: 400,
        offsetX: 40,
        offsetY: 0,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 45, offsetX: 25, offsetY: -100 },
          { largura: 40, altura: 25, offsetX: 24, offsetY: -60 },
          { largura: 67, altura: 40, offsetX: 20, offsetY: -25 },
        ],
      },

      neSpecial: {
        largura: 220,
        altura: 400,
        offsetX: 50,
        offsetY: 3,
        escala: 0.33,
        hurtboxes: [
          { largura: 30, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      AneSpecial: {
        largura: 220,
        altura: 400,
        offsetX: 35,
        offsetY: 0,
        escala: 0.33,
        hurtboxes: [
          { largura: 30, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      AsiSpecial: {
        largura: 220,
        altura: 400,
        offsetX: 90,
        offsetY: 100,
        escala: 0.33,
        hurtboxes: [
          { largura: 30, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      AdoSpecial: {
        largura: 220,
        altura: 400,
        offsetX: 70,
        offsetY: 50,
        escala: 0.33,
        hurtboxes: [
          { largura: 30, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      AupSpecial: {
        largura: 220,
        altura: 400,
        offsetX: 0,
        offsetY: -9,
        escala: 0.33,
        hurtboxes: [
          { largura: 30, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 35, altura: 25, offsetX: 0, offsetY: -60 },
          { largura: 60, altura: 40, offsetX: 0, offsetY: -25 },
        ],
      },

      doSpecial: {
        largura: 220,
        altura: 280,
        offsetX: 0,
        offsetY: -15,
        escala: 0.33,
        hurtboxes: [
          { largura: 45, altura: 55, offsetX: 0, offsetY: -92 },
          { largura: 50, altura: 42, offsetX: 0, offsetY: -48 },
          { largura: 60, altura: 36, offsetX: 0, offsetY: -12 },
        ],
      },

      sideSpecial: {
        largura: 220,
        altura: 400,
        offsetX: 0,
        offsetY: 10,
        escala: 0.33,
        hurtboxes: [
          { largura: 34, altura: 45, offsetX: 0, offsetY: -100 },
          { largura: 38, altura: 28, offsetX: 0, offsetY: -62 },
          { largura: 55, altura: 42, offsetX: 0, offsetY: -25 },
        ],
      },

  
   
   };

    this.configAnimacoes.intro = {
      ...this.configAnimacoes.idle,
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
      

      neutro3: {
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
       frameHitbox: 3,
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
          knockbackX: 600,
          knockbackY: -400,
          tumbling: false,
          knockbackFixo: true,
        },
      },
     agachado: {
        animacao: "ai_downAtack",

         multiHit: {
          tipo: "automatico",
          hits: [
            { inicio: 100, duracao: 60, offsetX:60, offsetY:-50,
              propriedades: { dano: 2, knockbackX: -40, knockbackY: -20,
                knockbackFixo: true, tumbling: false } },
            { inicio: 220, duracao: 60, offsetX:50, offsetY:-75,
              propriedades: { dano: 2, knockbackX: 80, knockbackY: -140,
                knockbackFixo: true, tumbling: false } },
            { inicio: 340, duracao: 60, offsetX:30, offsetY:-100,
              propriedades: { dano: 5 } }, // Mantém o knockback forte do golpe.
          ],
        },

        frameHitbox: 3,
      //  offsetX: 56,
      //  offsetY: -60,
        largura: 40,
        altura: 40,
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
        multiHit: {
          tipo: "automatico",
          hits: [
            { inicio: 100, duracao: 60,
              propriedades: { dano: 2, knockbackX: 140, knockbackY: 0,
                knockbackFixo: true, tumbling: false } },
            { inicio: 220, duracao: 60,
              propriedades: { dano: 2, knockbackX: 280, knockbackY: -100,
                knockbackFixo: true, tumbling: false } },
            { inicio: 340, duracao: 60,
              propriedades: { dano: 5 } }, // Mantém o knockback forte do golpe.
          ],
        },
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

    this.golpesNormaisAigis = this.golpes;

    // specials ==========================
    this.specials = {
      neutro: AigisNeSpecial.configuracao,
      air_neutro: AigisAneSpecial.configuracao,
      air_lado: AigisAsiSpecial.configuracao,
      air_agachado: AigisAdoSpecial.configuracao,
      air_cima: AigisAupSpecial.configuracao,
      agachado: AigisDoSpecial.configuracao,
      lado: AigisSideSpecial.configuracao,
    };
    this.specialsNormaisAigis = this.specials;

   
  }

  update() {
    super.update();
    this.atualizarAtaqueBaixoUlt();
    this.atualizarAuraModoUlt();
    this.atualizarPersonaGuarda();
  }

  atualizarAtaqueBaixoUlt() {
    const estadoAtack = this.maquinaEstados.estadoAtual;
    const ataqueBaixoUltAtivo =
      this.modoUltAigisAtivo &&
      estadoAtack?.nome === "atack" &&
      estadoAtack.tipoAtaqueAtual === "agachado" &&
      estadoAtack.golpeAtual === this.golpes.agachado;

    if (!ataqueBaixoUltAtivo) {
      this.logicaAtaqueBaixoUlt?.cancelar();
      this.logicaAtaqueBaixoUlt = null;
      return;
    }

    if (this.logicaAtaqueBaixoUlt) return;
    this.logicaAtaqueBaixoUlt = new AigisPersonaDoSpecial(
      this,
      AigisPersonaDoSpecial.configuracaoAtaqueNormal,
      estadoAtack,
    );
    this.logicasEspeciaisAtivas.push(this.logicaAtaqueBaixoUlt);
    this.logicaAtaqueBaixoUlt.executar();
  }

  ativarSpecialsUltAigis() {
    if (this.specialsUltAigis) return;
    this.golpesUltAigis = {
      ...this.golpesNormaisAigis,
      agachado: AigisPersonaDoSpecial.configuracaoAtaqueNormal,
    };
    this.golpes = this.golpesUltAigis;
    this.specialsUltAigis = {
      ...this.specialsNormaisAigis,
      neutro: AigisPersonaNeSpecial.configuracaoChao,
      air_neutro: AigisPersonaNeSpecial.configuracaoAr,
      air_cima: AigisAupSpecial.configuracaoPersona,
      lado: AigisPersonaSideSpecial.configuracaoChao,
      air_lado: AigisPersonaSideSpecial.configuracaoAr,
      agachado: AigisPersonaDoSpecial.configuracaoChao,
      air_agachado: AigisPersonaDoSpecial.configuracaoAr,
    };
    this.specials = this.specialsUltAigis;
  }

  restaurarSpecialsNormaisAigis() {
    this.logicaAtaqueBaixoUlt?.cancelar();
    this.logicaAtaqueBaixoUlt = null;
    if (!this.specialsUltAigis) return;
    this.golpes = this.golpesNormaisAigis;
    this.golpesUltAigis = null;
    this.specials = this.specialsNormaisAigis;
    this.specialsUltAigis = null;
  }

  consumirUlt() {
    this.aigisUltAtivando = true;
    this.ultMultiplicadorCarga = 1;
    this.ultBoostAte = 0;
  }

  atualizarCargaUlt(delta) {
    if (this.modoUltAigisAtivo || this.aigisUltAtivando) {
      const decaimento = this.ultCargaMax / this.ultTempoCarga * delta;
      this.ultCarga = Math.max(0, this.ultCarga - decaimento);
      if (this.ultCarga === 0 && this.modoUltAigisAtivo) {
        this.encerrarModoUltAigis();
      }
      return;
    }
    super.atualizarCargaUlt(delta);
  }

  aplicarBoostUltPorDano(dano) {
    if (this.modoUltAigisAtivo || this.aigisUltAtivando) return;
    super.aplicarBoostUltPorDano(dano);
  }

  ganharCargaUltPorMorte() {
    if (this.modoUltAigisAtivo || this.aigisUltAtivando) {
      this.encerrarModoUltAigis({ morte: true });
      this.maquinaEstados.estadoAtual?.logicaUlt?.cancelar?.();
      return;
    }
    super.ganharCargaUltPorMorte();
  }

  encerrarModoUltAigis({ morte = false } = {}) {
    this.modoUltAigisAtivo = false;
    this.aigisUltAtivando = false;
    this.restaurarSpecialsNormaisAigis();
    this.tweenAuraModoUlt?.stop();
    this.tweenAuraModoUlt = null;
    this.auraModoUlt?.destroy();
    this.auraModoUlt = null;
    this.guardMaximo = this.guardMaximoNormal;
    this.vidaGuard = Math.min(this.vidaGuard, this.guardMaximo);
    if (morte) {
      this.personaGuardaUlt?.destroy();
      this.personaGuardaUlt = null;
      this.ultimaGuardaModoUlt = false;
    } else if (this.personaGuardaUlt?.active) {
      this.recolherPersonaGuarda();
      this.ultimaGuardaModoUlt = false;
    }
  }

  criarAuraModoUlt() {
    if (this.auraModoUlt?.active) return;
    this.auraModoUlt = this.scene.add.image(this.sprite.x, this.sprite.y - 70, obterTexturaAuraAigis(this.scene))
      .setScale(1.05)
      .setAlpha(0.68)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(this.sprite.depth - 1);
    this.scene.camHUD?.ignore(this.auraModoUlt);
    this.tweenAuraModoUlt = this.scene.tweens.add({
      targets: this.auraModoUlt,
      alpha: { from: 0.5, to: 0.76 },
      scale: { from: 0.99, to: 1.11 },
      duration: 170,
      yoyo: true,
      repeat: -1,
    });
  }

  atualizarAuraModoUlt() {
    if (!this.modoUltAigisAtivo || !this.auraModoUlt?.active) return;
    this.auraModoUlt
      .setPosition(this.sprite.x, this.sprite.y - 70)
      .setDepth(this.sprite.depth - 1);
  }

  atualizarPersonaGuarda() {
    const estaGuardando = this.modoUltAigisAtivo &&
      this.maquinaEstados.estadoAtual?.nome === "guard";
    if (estaGuardando && !this.ultimaGuardaModoUlt) this.invocarPersonaGuarda();
    if (!estaGuardando && this.ultimaGuardaModoUlt) this.recolherPersonaGuarda();
    this.ultimaGuardaModoUlt = estaGuardando;

    if (estaGuardando && this.personaGuardaUlt?.active) {
      const direcao = this.sprite.flipX ? -1 : 1;
      this.personaGuardaUlt.setPosition(this.sprite.x + direcao * 78, this.sprite.y - 40)
        .setFlipX(this.sprite.flipX)
        .setDepth(this.sprite.depth - 1);
    }
  }

  invocarPersonaGuarda() {
    if (!this.personaGuardaUlt?.active) {
      this.personaGuardaUlt = this.scene.add.sprite(this.sprite.x, this.sprite.y - 40, "p_guard", 0)
        .setOrigin(0.5, 1)
        .setScale(0.33)
        .setDepth(this.sprite.depth - 1);
      this.scene.camHUD?.ignore(this.personaGuardaUlt);
    }
    this.personaGuardaUlt.anims.stop();
    this.personaGuardaUlt.play("ai_p_guard_invocar", true);
    this.personaGuardaUlt.once("animationcomplete-ai_p_guard_invocar", () => {
      if (!this.personaGuardaUlt?.active || this.maquinaEstados.estadoAtual?.nome !== "guard") return;
      this.personaGuardaUlt.setFrame(10);
      this.personaGuardaUlt.anims.pause();
    });
  }

  recolherPersonaGuarda() {
    if (!this.personaGuardaUlt?.active) return;
    this.personaGuardaUlt.anims.stop();
    this.personaGuardaUlt.play("ai_p_guard_recolher", true);
    this.personaGuardaUlt.once("animationcomplete-ai_p_guard_recolher", () => {
      this.personaGuardaUlt?.destroy();
      this.personaGuardaUlt = null;
    });
  }

  //animaçoes====================================================
  

  static criarAnimacoes(scene) {
    if (!scene.anims.exists("ai_AupSpecial")) {
      scene.anims.create({
        key: "ai_AupSpecial",
        frames: scene.anims.generateFrameNumbers("ai_AupSpecial", { start: 0, end: 17 }),
        frameRate: 16,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_ult_intro_pose")) {
      scene.anims.create({
        key: "ai_ult_intro_pose",
        frames: scene.anims.generateFrameNumbers("ai_AupSpecial", { start: 0, end: 11 }),
        frameRate: 16,
        repeat: 0,
      });
    }
    if (!scene.anims.exists("ai_ult_intro_fim")) {
      scene.anims.create({
        key: "ai_ult_intro_fim",
        frames: scene.anims.generateFrameNumbers("ai_AupSpecial", { start: 12, end: 17 }),
        frameRate: 16,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_eyes_ult")) {
      scene.anims.create({
        key: "ai_eyes_ult",
        frames: scene.anims.generateFrameNumbers("ai_eyes", { start: 0, end: 21 }),
        frameRate: 12,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_invoc1_special")) {
      scene.anims.create({
        key: "ai_invoc1_special",
        frames: scene.anims.generateFrameNumbers("ai_invoc1", { start: 0, end: 4 }),
        frameRate: 18,
        repeat: 0,
      });
    }
    if (!scene.anims.exists("ai_invoc2_special")) {
      scene.anims.create({
        key: "ai_invoc2_special",
        frames: scene.anims.generateFrameNumbers("ai_invoc2", { start: 0, end: 4 }),
        frameRate: 18,
        repeat: 0,
      });
    }
    if (!scene.anims.exists("ai_invoc3_special")) {
      scene.anims.create({
        key: "ai_invoc3_special",
        frames: scene.anims.generateFrameNumbers("ai_invoc3", { start: 0, end: 5 }),
        frameRate: 18,
        repeat: 0,
      });
    }
    if (!scene.anims.exists("ai_p_neSpecial")) {
      scene.anims.create({
        key: "ai_p_neSpecial",
        frames: scene.anims.generateFrameNumbers("p_neSpecial", { start: 8, end: 20 }),
        frameRate: 30,
        repeat: 0,
      });
    }
    if (!scene.anims.exists("ai_p_doSpecial")) {
      scene.anims.create({
        key: "ai_p_doSpecial",
        frames: scene.anims.generateFrameNumbers("p_doSpecial", { start: 0, end: 11 }),
        frameRate: 30,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_p_siSpecial")) {
      scene.anims.create({
        key: "ai_p_siSpecial",
        frames: scene.anims.generateFrameNumbers("p_siSpecial", { start: 0, end: 44 }),
        frameRate: 30,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("ai_p_siSpecial_air")) {
      scene.anims.create({
        key: "ai_p_siSpecial_air",
        frames: scene.anims.generateFrameNumbers("p_siSpecial", { start: 20, end: 44 }),
        frameRate: 30,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("ai_ult_siSpecial")) {
      scene.anims.create({
        key: "ai_ult_siSpecial",
        frames: scene.anims.generateFrameNumbers("ult_siSpecial", { start: 0, end: 8 }),
        frameRate: 18,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("ai_p_AupSpecial")) {
      scene.anims.create({
        key: "ai_p_AupSpecial",
        frames: scene.anims.generateFrameNumbers("p_AupSpecial", { start: 0, end: 14 }),
        frameRate: 25,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_p_guard_invocar")) {
      scene.anims.create({
        key: "ai_p_guard_invocar",
        frames: scene.anims.generateFrameNumbers("p_guard", { start: 0, end: 10 }),
        frameRate: 36,
        repeat: 0,
      });
    }
    if (!scene.anims.exists("ai_p_guard_recolher")) {
      scene.anims.create({
        key: "ai_p_guard_recolher",
        frames: scene.anims.generateFrameNumbers("p_guard", { start: 23, end: 26 }),
        frameRate: 24,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_upEfect_choque")) {
      scene.anims.create({
        key: "ai_upEfect_choque",
        frames: scene.anims.generateFrameNumbers("ai_upEfect", { start: 0, end: 9 }),
        frameRate: 24,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_overcharge")) {
      scene.anims.create({
        key: "ai_overcharge",
        frames: scene.anims.generateFrameNumbers("overcharge", { start: 0, end: 14 }),
        frameRate: 20,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_AdoSpecial")) {
      scene.anims.create({
        key: "ai_AdoSpecial",
        frames: scene.anims.generateFrameNumbers("ai_AdoSpecial", { start: 1, end: 14 })
          .map((frame) => frame.frame >= 5 && frame.frame <= 9
            ? { ...frame, duration: 65 }
            : frame),
        frameRate: 18,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_AsiSpecial")) {
      scene.anims.create({
        key: "ai_AsiSpecial",
        frames: scene.anims.generateFrameNumbers("ai_AsiSpecial", { start: 0, end: 14 }),
        frameRate: 18,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_missel_loop")) {
      scene.anims.create({
        key: "ai_missel_loop",
        frames: scene.anims.generateFrameNumbers("ai_missel", { start: 0, end: 9 }),
        frameRate: 18,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("ai_AneSpecial")) {
      scene.anims.create({
        key: "ai_AneSpecial",
        frames: scene.anims.generateFrameNumbers("ai_AneSpecial", { start: 0, end: 6 }),
        frameRate: 18,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_mina_queda")) {
      scene.anims.create({
        key: "ai_mina_queda",
        frames: scene.anims.generateFrameNumbers("ai_mina", { start: 0, end: 2 }),
        frameRate: 10,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_mina_ativa")) {
      scene.anims.create({
        key: "ai_mina_ativa",
        frames: scene.anims.generateFrameNumbers("ai_mina", { start: 3, end: 4 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("ai_sideSpecial")) {
      scene.anims.create({
        key: "ai_sideSpecial",
        frames: scene.anims.generateFrameNumbers("ai_sideSpecial", { start: 0, end: 15 }),
        frameRate: 18,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_doSpecial")) {
      scene.anims.create({
        key: "ai_doSpecial",
        frames: scene.anims.generateFrameNumbers("ai_doSpecial", { start: 0, end: 8 }),
        frameRate: 18,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_doE1_deslize")) {
      scene.anims.create({
        key: "ai_doE1_deslize",
        frames: scene.anims.generateFrameNumbers("ai_doE1", { start: 0, end: 3 }),
        frameRate: 18,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_neSpecial")) {
      scene.anims.create({
        key: "ai_neSpecial",
        frames: scene.anims.generateFrameNumbers("ai_neSpecial", { start: 0, end: 10 }),
        frameRate: 16,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_granade_voo")) {
      scene.anims.create({
        key: "ai_granade_voo",
        frames: scene.anims.generateFrameNumbers("granade", { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("ai_intro")) {
      scene.anims.create({
        key: "ai_intro",
        frames: scene.anims.generateFrameNumbers("ai_intro", { start: 0, end: 41 }),
        frameRate: 18,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_siExp_ataque")) {
      scene.anims.create({
        key: "ai_siExp_ataque",
        frames: scene.anims.generateFrameNumbers("ai_siExp", { start: 11, end: 14 }),
        frameRate: 18,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_granada_explosao")) {
      scene.anims.create({
        key: "ai_granada_explosao",
        frames: scene.anims.generateFrameNumbers("ai_siExp", { start: 0, end: 24 }),
        frameRate: 36,
        repeat: 0,
      });
    }

    if (!scene.anims.exists("ai_bulet1_ataque")) {
      scene.anims.create({
        key: "ai_bulet1_ataque",
        frames: scene.anims.generateFrameNumbers("ai_bulet1", { start: 3 }),
        frameRate: 36,
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
      frameRate: 22,
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
      frameRate: 22,
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
        end: 5,
      }),
      frameRate: 22,
      repeat: 0,
    });
     scene.anims.create({
      key: "ai_upAir",
      frames: scene.anims.generateFrameNumbers("ai_upAir", {
        start: 0,
        end: 9,
      }),
      frameRate: 20,
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
      frameRate: 18,
      repeat: 0,
    });
    
  }
}
