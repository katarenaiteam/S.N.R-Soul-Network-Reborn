import Personagem from "./Personagem.js";

export default class Frederick extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM
    Frederick.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "FJ_idle",
      "0",
      {
        velocidade: 240,
        forcaPulo: -600,
        maxPulos: 2,
        maxDash: 1,
      },

      teclas,
      "FJ_",
      controle,
    );

    this.nomePersonagem = "Frederik Johnson";
    this.configAnimacoes = {
      idle: {
        largura: 36,
        altura: 46,
        offsetX: 15,
        offsetY: 18,
        escala: 2,
      },

      walk: {
        largura: 36,
        altura: 46,
        offsetX: 15,
        offsetY: 18,
        escala: 2,
      },

      jump: {
        largura: 36,
        altura: 46,
        offsetX: 15,
        offsetY: 18,
        escala: 2,
      },

      crouch: {
        largura: 36,
        altura: 23,
        offsetX: 15,
        offsetY: 41,
        escala: 2,
      },
    };

    // tabela de golpes frederick
    this.golpes = {
      neutro: {
        animacao: "FJ_atack", // Ajuste para o nome da SUA animação no Phaser
        frameHitbox: 100, // Frame exato onde a faca acerta (começa em 1)
        offsetX: 40, // Distância pra frente
        offsetY: -43, // Altura em relação ao centro
        largura: 50, // Alcance
        altura: 25, // Espessura
        cooldown: 700,
         duracao: 300,
        propriedades: {
          dano: 12,
          knockbackX: 600,
          knockbackY: -100,
        },
      },
      // agachado: {
      //   animacao: 'mado_atack',
      //    frameHitbox: 1,
      //     offsetX: 20,
      //     offsetY: 12,
      //     largura: 35,
      //     altura: 15,
      //     propriedades: {
      //        dano: 8,
      //         knockbackX: 150,
      //         knockbackY: -200
      //     }
      //   },
      //      cima: {
      //          animacao: 'mado_guarda_chuva_cima',
      //          frameHitbox: 2,
      //          offsetX: 0,
      //          offsetY: -30,
      //          largura: 40,
      //         altura: 40,
      //         propriedades: {
      //            dano: 15,
      //            knockbackX: 50,
      //           knockbackY: -400
      //        }
      //      }
    };
  }

  // criando animaçoes
  static criarAnimacoes(scene) {
    // Se a animação "idle" já existe na cena, não recria
    if (scene.anims.exists("FJ_idle")) return;

    // Idle (Parada)
    scene.anims.create({
      key: "FJ_idle",
      frames: scene.anims.generateFrameNumbers("FJ_idle", {
        start: 0,
        end: 9,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // Walk (Andando)
    scene.anims.create({
      key: "FJ_walk",
      frames: scene.anims.generateFrameNumbers("FJ_walk", {
        start: 0,
        end: 3,
      }),
      frameRate: 7,
      repeat: -1,
    });

    // Jump (Pulo)
    scene.anims.create({
      key: "FJ_jump",
      frames: scene.anims.generateFrameNumbers("FJ_jump", {
        start: 0,
        end: 4,
      }),
      frameRate: 32,
      repeat: 0,
    });

    // Crouch (Agachar
    scene.anims.create({
      key: "FJ_crouch",
      frames: scene.anims.generateFrameNumbers("FJ_roll", {
        start: 0,
        end: 3,
      }),
      frameRate: 5,
      repeat: -1,
    });

    // Dash
    scene.anims.create({
      key: "FJ_dash",
      frames: scene.anims.generateFrameNumbers("FJ_roll", {
        start: 0,
        end: 3,
      }),
      frameRate: 32,
      repeat: 0,
    });

    // atack
    scene.anims.create({
      key: "FJ_atack",
      frames: scene.anims.generateFrameNumbers("FJ_punch1", {
        start: 0,
        end: 3,
      }),
      frameRate: 11,
      repeat: 0,
    });

    // dano
    scene.anims.create({
      key: "FJ_dano",
      frames: scene.anims.generateFrameNumbers("FJ_hurt", {
        start: 0,
        end: 0,
      }),
      frameRate: 1,
      repeat: 0,
    });
  }
}
