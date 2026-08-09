import Personagem from "./Personagem.js";

export default class Madotsuki extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    Madotsuki.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "Madotsuki",
      "0",
      {
        velocidade: 240,
        forcaPulo: -600,
        maxPulos: 2,
        maxDash: 1,
      },
      teclas,
      "mado_",
      controle,
    );

    this.nomePersonagem = "Madotsuki";
    this.configAnimacoes = {
      idle: {
        largura: 18,
        altura: 36,
        offsetX: 7,
        offsetY: -4,
        escala: 3,
          hurtboxes: [
          { largura: 48, altura: 70, offsetX: 0, offsetY: -35 }, // corpo regular
        ],
      },

      walk: {
        largura: 18,
        altura: 36,
        offsetX: 7,
        offsetY: -4,
        escala: 3,
         hurtboxes: [
          { largura: 48, altura: 70, offsetX: 0, offsetY: -35 }, // corpo regular
        ],
      },

      jump: {
        largura: 18,
        altura: 36,
        offsetX: 7,
        offsetY: -4,
        escala: 3,
        hurtboxes: [
          { largura: 48, altura: 70, offsetX: 0, offsetY: -35 }, // corpo regular
        ],
      },

      crouch: {
        largura: 18,
        altura: 23,
        offsetX: 7,
        offsetY: 9,
        escala: 3,
        hurtboxes: [
          { largura: 48, altura: 54, offsetX: 0, offsetY: -27 }, // corpo regular
        ],
      },

      atack: {
        largura: 18,
        altura: 36,
        offsetX: 7,
        offsetY: -4,
        escala: 3,
          hurtboxes: [
          { largura: 48, altura: 70, offsetX: 0, offsetY: -35 }, // corpo regular
        ],
      },
      dash: {
        largura: 18,
        altura: 36,
        offsetX: 7,
        offsetY: -4,
        escala: 3,
          hurtboxes: [
          { largura: 48, altura: 54, offsetX: 0, offsetY: -27 }, // corpo regular
        ],
      },

      dano: {
        largura: 18,
        altura: 36,
        offsetX: 7,
        offsetY: -4,
        escala: 3,
         hurtboxes: [
          { largura: 48, altura: 70, offsetX: 0, offsetY: -35 }, // corpo regular
        ],
      },

      sideAtack: {
        largura: 18,
        altura: 36,
        offsetX: 7,
        offsetY: -4,
        escala: 3,
         hurtboxes: [
          { largura: 48, altura: 70, offsetX: 0, offsetY: -35 }, // corpo regular
        ],
      },

      downAtack: {
        largura: 18,
        altura: 36,
        offsetX: 7,
        offsetY: -4,
        escala: 3,
         hurtboxes: [
          { largura: 48, altura: 54, offsetX: 0, offsetY: -27 }, // corpo regular
        ],
      },

      neutralAir: {
        largura: 18,
        altura: 36,
        offsetX: 7,
        offsetY: -4,
        escala: 3,
         hurtboxes: [
          { largura: 48, altura: 70, offsetX: 0, offsetY: -35 }, // corpo regular
        ],
      },
    };

    // tabela de golpes Madotsuki
    this.golpes = {
      neutro: {
        animacao: "mado_atack", // Ajuste para o nome da SUA animação no Phaser
        frameHitbox: 2, // Frame exato onde a faca acerta (começa em 1)
        offsetX: 25, // Distância pra frente
        offsetY: -15, // Altura em relação ao centro
        largura: 30, // Alcance
        altura: 20,
        cooldown: 200,
        duracao: 400,
        propriedades: {
          dano: 13.4,
          knockbackX: 250,
          knockbackY: -100,
        },
      },
      agachado: {
        animacao: "mado_downAtack",
        frameHitbox: 2,
        offsetX: 20,
        offsetY: -30,
        largura: 35,
        altura: 40,
        cooldown: 600,
        duracao: 600,
        propriedades: {
          dano: 80,
          knockbackX: 50,
          knockbackY: -100,
        },
      },
      cima: {
        animacao: "mado_upAtack",
        frameHitbox: 2,
        offsetX: 0,
        offsetY: 0,
        largura: 40,
        altura: 40,
        cooldown: 500,
        duracao: 300,
        propriedades: {
          dano: 105,
          knockbackX: 50,
          knockbackY: -400,
        },
      },
      side: {
        animacao: "mado_sideAtack",
        frameHitbox: 2,
        offsetX: 4,
        offsetY: -22,
        largura: 65,
        altura: 40,
        cooldown: 600,
        duracao: 600,
        propriedades: {
          dano: 15,
          knockbackX: 500,
          knockbackY: -50,
          impulsoX: 350,
        },
      },

      air_neutro: {
        animacao: "mado_neutralAir", // Ajuste para o nome da SUA animação no Phaser
        frameHitbox: 2, // Frame exato onde a faca acerta (começa em 1)
        offsetX: 25, // Distância pra frente
        offsetY: -10, // Altura em relação ao centro
        largura: 30, // Alcance
        altura: 20, // Espessura
        cooldown: 500,
        duracao: 400,
        propriedades: {
          dano: 12,
          knockbackX: 250,
          knockbackY: -100,
        },
      },
      air_agachado: {
        animacao: "mado_downAir",
        frameHitbox: 2,
        offsetX: 0,
        offsetY: 5,
        largura: 40,
        altura: 40,
        finalizarAoTocarChao: true,
        atrasoFinalizacaoChao: 100,
        finalizarAoAcertarOponente: true,
        propriedades: {
          dano: 8,
          knockbackX: 50,
          knockbackY: -300,
        },
      },
      air_cima: {
        animacao: "mado_upAir",
        frameHitbox: 2,
        offsetX: -5,
        offsetY: -65,
        largura: 70,
        altura: 40,
        cooldown: 900,
        duracao: 300,
        propriedades: {
          dano: 15,
          knockbackX: 50,
          knockbackY: -400,
          impulsoY: -300,
        },
      },
      air_side: {
        animacao: "mado_sideAir",
        frameHitbox: 2,
        offsetX: 20,
        offsetY: -30,
        largura: 60,
        altura: 50,
        cooldown: 1000,
        duracao: 300,
        finalizarAoTocarChao: false,
        atrasoFinalizacaoChao: 100,
        finalizarAoAcertarOponente: false,

        propriedades: {
          dano: 15,
          knockbackX: 350,
          knockbackY: -50,
          impulsoX: 500,
          anularGravidade: true,
        },
      },
    };
  }

  //animaçoes====================================================
  static criarAnimacoes(scene) {
    // Se a animação "idle" já existe na cena, não recria
    if (scene.anims.exists("mado_idle")) return;

    // Idle (Parada)
    scene.anims.create({
      key: "mado_idle",
      frames: scene.anims.generateFrameNumbers("Madotsuki", {
        start: 0,
        end: 0,
      }),
      frameRate: 1,
      repeat: -1,
    });

    // Walk (Andando)
    scene.anims.create({
      key: "mado_walk",
      frames: scene.anims.generateFrameNumbers("Madotsuki", {
        start: 1,
        end: 3,
      }),
      frameRate: 6,
      repeat: -1,
    });

    // Jump (Pulo)
    scene.anims.create({
      key: "mado_jump",
      frames: scene.anims.generateFrameNumbers("Madotsuki", {
        start: 9,
        end: 11,
      }),
      frameRate: 5,
      repeat: 0,
    });

    // Crouch (Agachado - usando o frame estático com generateFrameNames)
    scene.anims.create({
      key: "mado_crouch",
      frames: scene.anims.generateFrameNumbers("Madotsuki", {
        start: 4,
        end: 8,
      }),
      frameRate: 10,
      repeat: 0,
    });

    // Dash
    scene.anims.create({
      key: "mado_dash",
      frames: scene.anims.generateFrameNumbers("Madotsuki", {
        start: 9,
        end: 10,
      }),
      frameRate: 4,
      repeat: 0,
    });

    // atack
    scene.anims.create({
      key: "mado_atack",
      frames: scene.anims.generateFrameNumbers("MadoAtack", {
        start: 0,
        end: 4,
      }),
      frameRate: 16,
      repeat: 0,
    });

    // recebadano
    scene.anims.create({
      key: "mado_dano",
      frames: scene.anims.generateFrameNumbers("MadoDano", {
        start: 0,
        end: 1,
      }),
      frameRate: 1,
      repeat: 0,
    });
    // receba dano
    scene.anims.create({
      key: "mado_sideAtack",
      frames: scene.anims.generateFrameNumbers("MadoMoreAtack", {
        start: 0,
        end: 2,
      }),
      frameRate: 5,
      repeat: 0,
    });
    // receba dano
    scene.anims.create({
      key: "mado_upAtack",
      frames: scene.anims.generateFrameNumbers("MadoMoreAtack", {
        start: 3,
        end: 5,
      }),
      frameRate: 4,
      repeat: 0,
    }); // receba dano
    scene.anims.create({
      key: "mado_downAtack",
      frames: scene.anims.generateFrameNumbers("MadoMoreAtack", {
        start: 6,
        end: 8,
      }),
      frameRate: 4,
      repeat: 0,
    }); // receba dano
    scene.anims.create({
      key: "mado_sideAir",
      frames: scene.anims.generateFrameNumbers("MadoMoreAtack", {
        start: 9,
        end: 11,
      }),
      frameRate: 8,
      repeat: -1,
    }); // receba dano
    scene.anims.create({
      key: "mado_upAir",
      frames: scene.anims.generateFrameNumbers("MadoMoreAtack", {
        start: 12,
        end: 14,
      }),
      frameRate: 6,
      repeat: 0,
    }); // receba dano
    scene.anims.create({
      key: "mado_downAir",
      frames: scene.anims.generateFrameNumbers("MadoMoreAtack", {
        start: 15,
        end: 19,
      }),
      frameRate: 12,
      repeat: -1,
    });
    // neutroar
    scene.anims.create({
      key: "mado_neutralAir",
      frames: scene.anims.generateFrameNumbers("MadoAtack", {
        start: 0,
        end: 4,
      }),
      frameRate: 7,
      repeat: 0,
    });
  }
}
