import config from './config.js'
import Start from "./scenes/start.js";

class Game extends Phaser.Game {
    constructor() {
        super(config);

        this.scene.add("Start", Start);
        this.scene.start("Start");
 }
}

window.onload = () => {
    const game = new Game();
};