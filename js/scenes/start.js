class Start extends Phaser.Scene {
    constructor() {
        super("Start");
    }

    preload() { 

    this.load.image("Madomenu1", "/assets/Menus/Madomenu1.png"); 

    }
    
    create() {

        this.add
            .image(400, 225, "Madomenu1")
            .setInteractive()
            .on("pointerdown", () => {
                this.scene.stop();
                this.scene.start("Preloader");
            });
           
    }

    update() {}
}

export default Start;
