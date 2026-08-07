import Personagem from "./Personagem.js";

export default class Miku extends Personagem {
  constructor(scene, x, y, teclas, hudX, hudY, controle) {
    // Garante que as animações existam no Phaser ANTES de criar o Personagem e a FSM

    Miku.criarAnimacoes(scene);

    // chama o constructor pai com tudo pronto
    super(
      scene,
      x,
      y,
      "miku_idle",
      "0",
      {
        velocidade: 170,
        forcaPulo: -600,
        maxPulos: 2,
        maxDash: 1,
      },

      teclas,
      "miku_",
      controle,
    );
    this.nomePersonagem = "Miku";
    this.configAnimacoes = {
      idle: {
        largura: 200,
        altura: 450,
        offsetX: 170,
        offsetY: 0,
        escala: 0.3,
        hurtboxLargura: 65,
        hurtboxAltura: 120,
        hurtboxOffsetX: 0,
        hurtboxOffsetY: -65,
      },

      walk: {
        largura: 200,
        altura: 450,
        offsetX: 170,
        offsetY: 0,
        escala: 0.3,
        hurtboxLargura: 65,
        hurtboxAltura: 120,
        hurtboxOffsetX: 0,
        hurtboxOffsetY: -65,
      },
    };

    // tabela de golpes Madotsuki
    this.golpes = {
      neutro: {
        animacao: "dio_atack", // Ajuste para o nome da SUA animação no Phaser
        frameHitbox: 2, // Frame exato onde a faca acerta (começa em 1)
        offsetX: 64, // Distância pra frente
        offsetY: -95, // Altura em relação ao centro
        largura: 70, // Alcance
        altura: 18,
        cooldown: 500,
        propriedades: {
          dano: 12,
          knockbackX: 250,
          knockbackY: -100,
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
      //      cima: {
      //         animacao: 'mado_upAtack',
      //          frameHitbox: 2,
      //         offsetX: 0,
      //          offsetY: -30,
      //          largura: 40,
      //          altura: 40,
      //          propriedades: {
      //              dano: 15,
      //              knockbackX: 50,
      //              knockbackY: -400
      //         }
      //      },
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
        animacao: "dio_atack", // Ajuste para o nome da SUA animação no Phaser
        frameHitbox: 20, // Frame exato onde a faca acerta (começa em 1)
        offsetX: 64, // Distância pra frente
        offsetY: -95, // Altura em relação ao centro
        largura: 70, // Alcance
        altura: 18,

        cooldown: 500,

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
    if (scene.anims.exists("miku_idle")) return;

    // Idle (Parada)
    scene.anims.create({
      key: "miku_idle",
      frames: scene.anims.generateFrameNumbers("Miku_idle", {
        start: 0,
        end: 14,
      }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: "miku_walk",
      frames: scene.anims.generateFrameNumbers("Miku_walk", {
        start: 0,
        end: 12,
      }),
      frameRate: 24,
      repeat: -1,
    });
  }
}
