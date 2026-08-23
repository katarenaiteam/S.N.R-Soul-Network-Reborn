import Personagem from "./Personagem.js";
import WebShot from "./Specials/Spiderman/WebShot.js";
import AirWebShot from "./Specials/Spiderman/AirWebshot.js"; 
import SpiderCounter from "./Specials/Spiderman/SpiderCounter.js";

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
        maxDash: 1,
        maxComboIndex: 3,
      },

      teclas,
      "spy_",
      controle,
    );
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
          { largura: 55, altura: 60, offsetX: 25, offsetY: -70 }, // Tronco/cabeça
          { largura: 110, altura: 35, offsetX: 5, offsetY: -18 }, // Agachado / pernas abertas
        ],
      },

      walk: {
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

      jump: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: 0, offsetY: -90 }, // Tronco/cabeça
          { largura: 60, altura: 50, offsetX: 0, offsetY: -25 }, // parte de baixo parecida
        ],
      },

      crouch: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
          { largura: 80, altura: 50, offsetX: 0, offsetY: -25 }, // fechadinho
        ],
      },

      guard: {
      largura: 85,
      altura: 95,
      offsetX: 50,
      offsetY: 96,
      escala: 1,
      hurtboxes: [
          { largura: 55, altura: 60, offsetX: 25, offsetY: -70 }, // Tronco/cabeça
          { largura: 110, altura: 35, offsetX: 5, offsetY: -18 }, // Agachado / pernas abertas
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
           { largura: 55, altura: 60, offsetX: 0, offsetY: -70 }, // Tronco/cabeça
          { largura: 60, altura: 35, offsetX: -10, offsetY: -18 }, // Agachado / pernas juntas
        ],
      },
      danoDown: {
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
      danoSide: {
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

      atack: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: 0, offsetY: -90 }, // Tronco/cabeça
          { largura: 80, altura: 50, offsetX: 0, offsetY: -25 }, // fechadinho
        ],
      },

      neutralAir: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [
          { largura: 60, altura: 70, offsetX: -20, offsetY: -90 }, // Tronco/cabeça
          { largura: 80, altura: 50, offsetX: 0, offsetY: -25 }, // perna dano
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
        hurtboxes: [{ largura: 80, altura: 60, offsetX: 0, offsetY: -40 }],
      },

      sideAir: {
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [{ largura: 80, altura: 60, offsetX: 0, offsetY: -40 }],
      },

      upAir: {  
        largura: 85,
        altura: 95,
        offsetX: 50,
        offsetY: 96,
        escala: 1,
        hurtboxes: [{ largura: 70, altura: 80, offsetX: 0, offsetY: -50 }],
      },

      neSpecial: {
       largura: 110,
        altura: 96,
        offsetX: 45,
        offsetY: 95,
        escala: 1,
    hurtboxes: [
          { largura: 55, altura: 60, offsetX: 25, offsetY: -70 }, // Tronco/cabeça
          { largura: 110, altura: 35, offsetX: 5, offsetY: -18 }, // Agachado / pernas abertas
    ], 
    },

    doSpecial: {
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
      counter: {
      largura: 80,
     altura: 95,
     offsetX: 200,
     offsetY: 96,
      escala: 1,
     hurtboxes: [
    { largura: 60, altura: 80, offsetX: 0, offsetY: -40 }
  ]
}
   };
    
  
    // ============================ tabela de golpes =====================================
    this.golpes = {
      neutro1: {
        animacao: "spy_atack1",
        frameHitbox: 2,
        offsetX: 70,
        offsetY: -60,
        largura: 60,
        altura: 20,
        cooldown: 700,
        duracao: 300,
        propriedades: {
          dano: 4,
          knockbackX: 40,
          knockbackY: 0,
        },

        comboProximo: "neutro2",
        comboJanelaInicio: 200,
        comboJanelaFim: 300,
      },

      neutro2: {
        animacao: "spy_atack2",

        frameHitbox: 2,

        offsetX: 60,
        offsetY: -60,
        largura: 55,
        altura: 30,
        duracao: 300,
        propriedades: {
          dano: 4,
          knockbackX: -10,
          knockbackY: 0,
        },

        comboProximo: "neutro3",
        comboJanelaInicio: 200,
        comboJanelaFim: 400,
      },

      neutro3: {
        animacao: "spy_atack3",

        frameHitbox: 3,

        offsetX: 55,
        offsetY: -75,
        largura: 35,
        altura: 70,
        duracao: 250,
        bufferInputs: true,
        bufferJanelaInicio: 50,
        bufferJanelaFim: 350,
        propriedades: {
          dano: 8,
          knockbackX: 50,
          knockbackY: -350,
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
        cooldown: 700,
        duracao: 560,
        propriedades: {
          dano: 8,
          knockbackX: 50,
          knockbackY: -100,
          tumbling: true
        },
      },
      side: {
        animacao: "spy_sideAtack",
        frameHitbox: 2,
        offsetX: 52,
        offsetY: -60,
        largura: 55,
        altura: 25,
        cooldown: 900,
        duracao: 400,
        propriedades: {
          dano: 20,
          knockbackX: 400,
          knockbackY: -300,
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
        propriedades: {
          dano: 12,
          knockbackX: 200,
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
        // Finalização do ataque
        duracao: 1000,
        finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 100,
        finalizarAoAcertarOponente: true,
        atrasoFinalizacaoAcerto: 150,
        propriedades: {
          dano: 12,
          knockbackX: 50,
          knockbackY: 400,
          impulsoX: 50,
          impulsoY: 550,
        },
      },

      air_side: {
        animacao: "spy_sideAir",
        frameHitbox: 2,
        offsetX: 34,
        offsetY: -70,
        largura: 60,
        altura: 70,
        cooldown: 500,
        // Finalização do ataque
        duracao: 300,
        finalizarAoTocarChao: false,
        atrasoFinalizacaoChao: 100,
        finalizarAoAcertarOponente: false,
        propriedades: {
          dano: 12,
          knockbackX: 300,
          knockbackY: -50,
          impulsoX: 300,
          tumbling: true
        },
      },

      air_cima: {
        animacao: "spy_upAir",
        frameHitbox: 2,
        offsetX: 24,
        offsetY: -120,
        largura: 25,
        altura: 40,
        cooldown: 900,
        // Finalização do ataque
        duracao: 300,
        finalizarAoTocarChao: false,
        atrasoFinalizacaoChao: 100,
        finalizarAoAcertarOponente: false,
        propriedades: {
          dano: 12,
          knockbackX: 50,
          knockbackY: -400,
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
        // futuro
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
          dano: 10,
          knockbackX: 0,
          knockbackY: 0,
          anularGravidade: true,
          //impulsoX: 0,                    
          //impulsoY: 0,
          
        },
      },
    };
  }

  //animaçoes====================================================
  static criarAnimacoes(scene) {
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
      key: "spy_guard",
      frames: scene.anims.generateFrameNumbers("SpiderMan_guard", {
        start: 0,
        end: 4,
      }),
      frameRate: 16,
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

//golpes 
    scene.anims.create({
      key: "spy_atack1",
      frames: scene.anims.generateFrameNumbers("SpiderMan_atack1", {
        start: 0,
        end: 4,
      }),
      frameRate: 20,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_atack2",
      frames: scene.anims.generateFrameNumbers("SpiderMan_atack2", {
        start: 0,
        end: 8,
      }),
      frameRate: 20,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_atack3",
      frames: scene.anims.generateFrameNumbers("SpiderMan_atack3", {
        start: 0,
        end: 6,
      }),
      frameRate: 20,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_sideAtack",
      frames: scene.anims.generateFrameNumbers("SpiderMan_sideAtack", {
        start: 0,
        end: 2,
      }),
      frameRate: 10,
      repeat: 0,
    });

     scene.anims.create({
      key: "spy_downAtack",
      frames: scene.anims.generateFrameNumbers("SpiderMan_downAtack", {
        start: 0,
        end: 6,
      }),
      frameRate: 11,
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
      frameRate: 16,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_sideAir",
      frames: scene.anims.generateFrameNumbers("SpiderMan_sideAir", {
        start: 0,
        end: 4,
      }),
      frameRate: 16,
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
        end: 9,
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
        frames: scene.anims.generateFrameNumbers("Counter", {
          start: 0,
          end: 6,
        }),
        frameRate: 12,
        repeat: 0,
      });
    }


  }
}
