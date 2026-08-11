import Personagem from "./Personagem.js";

export default class Dio extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    Dio.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "Mantra_idle",
      "0",
      {
        velocidade: 140,
        forcaPulo: -600,
        maxPulos: 3,
        maxDash: 1,
      },

      teclas,
      "dio_",
      controle,
    );
    this.nomePersonagem = "Dio";
    this.configAnimacoes = {
      idle: {
        largura: 55,
        altura: 125,
        offsetX: 6,
        offsetY: -5,
        escala: 1,
         hurtboxes: [
          { largura: 43, altura: 115, offsetX: -3, offsetY: -60 }, // Tronco reto
        ],
      },



      walk: {
        largura: 55,
        altura: 125,
        offsetX: 18,
        offsetY: -5,
        escala: 1,
         hurtboxes: [
          { largura: 46, altura: 115, offsetX: 3, offsetY: -60 }, // Tronco reto
        ],
      },

      jump: {
        largura: 55,
        altura: 125,
        offsetX: 18,
        offsetY: 26,
        escala: 1,
         hurtboxes: [
          { largura: 46, altura: 125, offsetX: 3, offsetY: -70 }, // Tronco reto
        ],
      },

      crouch: {
        largura: 55,
        altura: 62.5,
        offsetX: 18,
        offsetY: 59.5,
        escala: 1,
           hurtboxes: [
          { largura: 56, altura: 65, offsetX: 3, offsetY: -40 }, // encolhido
        ],
        
      },

      atack: {
        largura: 55,
        altura: 125,
        offsetX: 115,
        offsetY: -5,
        escala: 1,
          hurtboxes: [
          { largura: 43, altura: 115, offsetX: 4, offsetY: -60 }, // Tronco reto
        ],
      },

      dash: {
        largura: 55,
        altura: 125,
        offsetX: 35,
        offsetY: 0,
        escala: 1,
        hurtboxLargura: 65,
        hurtboxAltura: 120,
        hurtboxOffsetX: 0,
        hurtboxOffsetY: -65,
      },

      downAtack: {
        largura: 55,
        altura: 65,
        offsetX: 70, // Ajuste esse offset para casar com a imagem TH30_atack4!
        offsetY: 46,
        escala: 1,
           hurtboxes: [
          { largura: 56, altura: 65, offsetX: 3, offsetY: -40 }, // encolhido
        ],
      },

      sideAtack: {
        largura: 55,
        altura: 125,
        offsetX: 68, // Ajuste conforme o tamanho do frame de Mantra_atack2
        offsetY: -5,
        escala: 1,
         hurtboxes: [
          { largura: 43, altura: 115, offsetX: -3, offsetY: -60 }, // Tronco reto
        ],
      },
    };

    // tabela de golpes
    this.golpes = {
      neutro: {
        animacao: "dio_atack", // Ajuste para o nome da SUA animação no Phaser
        frameHitbox: 2, // Frame exato onde a faca acerta (começa em 1)
        offsetX: 64, // Distância pra frente
        offsetY: -95, // Altura em relação ao centro
        largura: 70, // Alcance
        altura: 18,
        cooldown: 500,
        duracao: 300,
        propriedades: {
          dano: 12,
          knockbackX: 250,
          knockbackY: -100,
        },
      },
      agachado: {
        animacao: "dio_downAtack",
        frameHitbox: 2,
        offsetX: 60,
        offsetY: -45,
        largura: 75,
        altura: 20,
        duracao: 300,
        propriedades: {
          dano: 8,
          knockbackX: 50,
          knockbackY: -100,
        },
      },

      side: {
        animacao: "dio_sideAtack",
        frameHitbox: 4,
        offsetX: 52,
        offsetY: -90,
        largura: 90,
        altura: 40,
        cooldown: 1350,
        duracao: 400,
        propriedades: {
          dano: 30,
          knockbackX: 700,
          knockbackY: -400,
          impulsoX: 300,
        },
      },

      air_neutro: {
        animacao: "dio_atack", // Ajuste para o nome da SUA animação no Phaser
        frameHitbox: 2, // Frame exato onde a faca acerta (começa em 1)
        offsetX: 64, // Distância pra frente
        offsetY: -95, // Altura em relação ao centro
        largura: 70, // Alcance
        altura: 18,
        cooldown: 500,
        duracao: 300,
        propriedades: {
          dano: 12,
          knockbackX: 250,
          knockbackY: -100,
        },
      },
    };
  }

  //animaçoes====================================================
  static criarAnimacoes(scene) {
    // Se a animação "idle" já existe na cena, não recria
    if (scene.anims.exists("dio_idle")) return;

    // Idle (Parada)
    scene.anims.create({
      key: "dio_idle",
      frames: scene.anims.generateFrameNumbers("Mantra_idle", {
        start: 0,
        end: 5,
      }),
      frameRate: 8,
      repeat: -1,
    });

    // Walk (Andando)
    scene.anims.create({
      key: "dio_walk",
      frames: scene.anims.generateFrameNumbers("Mantra_walk", {
        start: 0,
        end: 15,
      }),
      frameRate: 18,
      repeat: -1,
    });

    // Jump (Pulo)
    scene.anims.create({
      key: "dio_jump",
      frames: scene.anims.generateFrameNumbers("Mantra_jump", {
        start: 0,
        end: 8,
      }),
      frameRate: 24,
      repeat: 0,
    });

    // Crouch (Agachado - usando o frame estático com generateFrameNames)
    scene.anims.create({
      key: "dio_crouch",
      frames: scene.anims.generateFrameNumbers("Mantra_down", {
        start: 0,
        end: 4,
      }),
      frameRate: 12,
      repeat: 0,
    });

    // Dash
    scene.anims.create({
      key: "dio_dash",
      frames: scene.anims.generateFrameNumbers("Mantra_dash", {
        start: 0,
        end: 4,
      }),
      frameRate: 80,
      repeat: 0,
    });

    // atack
    scene.anims.create({
      key: "dio_atack",
      frames: scene.anims.generateFrameNumbers("Mantra_atack1", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: 0,
    });

    scene.anims.create({
      key: "dio_downAtack",
      frames: scene.anims.generateFrameNumbers("TH30_atack4", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: 0,
    });

    scene.anims.create({
      key: "dio_sideAtack",
      frames: scene.anims.generateFrameNumbers("Mantra_atack2", {
        start: 0,
        end: 8,
      }),
      frameRate: 20,
      repeat: 0,
    });
  }
}
