//import * as Phaser from "phaser";
import CenaPrincipal from "./Scenes/CenaPrincipal.js";
import CenaPreload from "./Scenes/CenaPreLoad.js";
import Charmenu from "./Scenes/Charmenu.js";
import CenaStart from "./Scenes/CenaStart.js";
import CenaGameOver from "./Scenes/GameOver.js";
import CenaSelecaoMapa from "./Scenes/SeleçaoMapas.js";
import CenaHistoria from "./Scenes/CenaHistoria.js";
import CenaHistoria2 from "./Scenes/CenaHistoria2.js";
import CenaHistoria3 from "./Scenes/CenaHistoria3.js";
import CenaCreditos from "./Scenes/CenaCreditos.js";
import IntroMovie from "./Scenes/IntroMovie.js";
import CenaPreloadVersus from "./Scenes/CenaPreloadVersus.js";
import CenaEspectador from "./Scenes/CenaEspectador.js";
import { instalarComandosDebug } from "./DebugConsole.js";
import configMQTT from "./Objetos/ConfigMQTT.js";

const config = {
  type: Phaser.AUTO,
  // Resolucao interna Full HD; o FIT preserva a proporcao na tela.
  width: 1366,
  height: 768,
  fps: {
    target: 30,
    forceSetTimeout: true,
  },

  parent: "game-container",
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

  mqtt: configMQTT,

  scene: [CenaPreload, CenaStart, IntroMovie, Charmenu, CenaSelecaoMapa, CenaPreloadVersus, CenaPrincipal, CenaHistoria, CenaHistoria2, CenaHistoria3, CenaGameOver, CenaCreditos, CenaEspectador],
};

const game = new Phaser.Game(config);
window.__SNR_GAME_DEBUG__ = game;
game.registry.set("mqttConfig", config.mqtt);
if (new URLSearchParams(window.location.search).get("espectador") !== "1") {
  instalarComandosDebug(game);
}
