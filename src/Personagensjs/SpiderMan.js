import Personagem from "./Personagem.js";

export default class SpiderMan extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    SpiderMan.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "spy_idle",
      "0",
      {
        velocidade: 140,
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
    };

    // ============================ tabela de golpes =====================================
    this.golpes = {
      neutro: {
        animacao: "spy_atack1",
        frameHitbox: 2,
        offsetX: 40,
        offsetY: -60,
        largura: 50,
        altura: 30,
        cooldown: 0,
        propriedades: {
          dano: 3,
          knockbackX: 40,
          knockbackY: 0,
        },
      },
      agachado: {
        animacao: "dio_downAtack",
        frameHitbox: 1,
        offsetX: 60,
        offsetY: -45,
        largura: 75,
        altura: 20,
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
        cooldown: 1500,
        propriedades: {
          dano: 30,
          knockbackX: 700,
          knockbackY: -400,
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

        propriedades: {
          dano: 12,
          knockbackX: 200,
          knockbackY: -300,
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
      key: "spy_dash",
      frames: scene.anims.generateFrameNumbers("SpiderMan_dash2", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_atack1",
      frames: scene.anims.generateFrameNumbers("SpiderMan_atack1", {
        start: 0,
        end: 4,
      }),
      frameRate: 16,
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
      key: "spy_atack3",
      frames: scene.anims.generateFrameNumbers("SpiderMan_atack3", {
        start: 0,
        end: 6,
      }),
      frameRate: 13,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_atack3",
      frames: scene.anims.generateFrameNumbers("SpiderMan_atack3", {
        start: 0,
        end: 6,
      }),
      frameRate: 13,
      repeat: 0,
    });

    scene.anims.create({
      key: "spy_atack3",
      frames: scene.anims.generateFrameNumbers("SpiderMan_atack3", {
        start: 0,
        end: 6,
      }),
      frameRate: 13,
      repeat: 0,
    });
  }
}
