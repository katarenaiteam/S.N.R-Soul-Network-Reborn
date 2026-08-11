import Personagem from "./Personagem.js";

export default class Morrigan extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM
    Morrigan.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "morrigan",
      "2",
      {
        velocidade: 240,
        forcaPulo: -600,
        maxPulos: 2,
        maxDash: 1,
      },

      teclas,
      "mo_",
      controle,
    );

    this.nomePersonagem = "Morrigan";

    this.configAnimacoes = {
      idle: {
        largura: 36,
        altura: 46,
        offsetX: 15,
        offsetY: 18,
        escala: 2,
         hurtboxes: [
          { largura: 66, altura: 80, offsetX: -5, offsetY: -40 }, 
        ],
      },

      walk: {
        largura: 36,
        altura: 46,
        offsetX: 15,
        offsetY: 18,
        escala: 2,
         hurtboxes: [
          { largura: 66, altura: 80, offsetX: 10, offsetY: -40 }, 
        ],
      },

      jump: {
        largura: 36,
        altura: 46,
        offsetX: 15,
        offsetY: 18,
        escala: 2,
         hurtboxes: [
          { largura: 66, altura: 80, offsetX: -5, offsetY: -40 }, 
        ],
      },

      crouch: {
        largura: 36,
        altura: 23,
        offsetX: 15,
        offsetY: 41,
        escala: 2,
         hurtboxes: [
          { largura: 66, altura: 60, offsetX: -5, offsetY: -30 }, 
        ],
      },
    };

    // tabela de golpes morrigan
    this.golpes = {
      neutro: {
        animacao: "mo_atack", // Ajuste para o nome da SUA animação no Phaser
        frameHitbox: 2, // Frame exato onde a faca acerta (começa em 1)
        offsetX: 27, // Distância pra frente
        offsetY: -70, // Altura em relação ao centro
        largura: 60, // Alcance
        altura: 30, // Espessura
        cooldown: 100,
        duracao: 300,
        propriedades: {
          dano: 12,
          //        knockbackX: 250,
          //       knockbackY: -100
        },
      },
    };
  }

  // criando animaçoes
  static criarAnimacoes(scene) {
    // Se a animação "idle" já existe na cena, não recria
    if (scene.anims.exists("mo_idle")) return;

    // Idle (Parada)
    scene.anims.create({
      key: "mo_idle",
      frames: scene.anims.generateFrameNumbers("morrigan", {
        start: 2,
        end: 5,
      }),
      frameRate: 6,
      repeat: -1,
    });

    // Walk (Andando)
    scene.anims.create({
      key: "mo_walk",
      frames: scene.anims.generateFrameNumbers("morrigan", {
        start: 12,
        end: 14,
      }),
      frameRate: 7,
      repeat: -1,
    });

    // Jump (Pulo)
    scene.anims.create({
      key: "mo_jump",
      frames: scene.anims.generateFrameNumbers("morrigan", {
        start: 6,
        end: 8,
      }),
      frameRate: 2,
      repeat: 0,
    });

    // Crouch (Agac
    scene.anims.create({
      key: "mo_crouch",
      frames: scene.anims.generateFrameNumbers("morrigan", {
        start: 0,
        end: 0,
      }),
      frameRate: 1,
      repeat: 0,
    });

    // Dash
    scene.anims.create({
      key: "mo_dash",
      frames: scene.anims.generateFrameNumbers("morrigan", {
        start: 1,
        end: 1,
      }),
      frameRate: 2,
      repeat: 0,
    });

    // atack
    scene.anims.create({
      key: "mo_atack",
      frames: scene.anims.generateFrameNumbers("MorriganDano", {
        start: 4,
        end: 5,
      }),
      frameRate: 8,
      repeat: 0,
    });

    // dano
    scene.anims.create({
      key: "mo_dano",
      frames: scene.anims.generateFrameNumbers("MorriganDano", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: 0,
    });
  }
}
