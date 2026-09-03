//import * as Phaser from "phaser";
import CenaPrincipal from "./Scenes/CenaPrincipal.js";
import CenaPreload from "./Scenes/CenaPreLoad.js";
import Charmenu from "./Scenes/Charmenu.js";
import CenaStart from "./Scenes/CenaStart.js";
import CenaGameOver from "./Scenes/GameOver.js";
import CenaSelecaoMapa from "./Scenes/SeleçaoMapas.js";
import CenaHistoria from "./Scenes/CenaHistoria.js";
import CenaCreditos from "./Scenes/CenaCreditos.js";

const config = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  fps: {
    target: 30,
    forceSetTimeout: true,
  },

  parent: "game-conteiner",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 900 },
      debug: true,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  render: {
    pixelArt: true, // Desativa o anti-aliasing
    antialias: false, // Garante que os pixels fiquem 100% nítidos
    roundPixels: true, // Evita que sprites fiquem tremendo ao se moverem
  },

  input: {
    gamepad: true,
  },

  scene: [CenaPreload, CenaStart, Charmenu, CenaSelecaoMapa, CenaPrincipal, CenaHistoria, CenaGameOver, CenaCreditos],
};

new Phaser.Game(config);
