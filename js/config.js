
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    fps: {
        target: 30,
        forceSetTimeout: true
    },

    parent: "game-conteiner",
  physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 900 },
            debug: true
      }
    },
    scale: {
        mode: Phaser.Scale.FIT,       
        autoCenter: Phaser.Scale.CENTER_BOTH 
    },

  pointers: {
      activePointers: 3,
    },

    render: {
        pixelArt: true,      // Desativa o anti-aliasing
        antialias: false,    // Garante que os pixels fiquem 100% nítidos
        roundPixels: true    // Evita que sprites fiquem tremendo ao se moverem
    },


 //scene: [CenaPreload, Charmenu, CenaPrincipal]
   
}
export default config;