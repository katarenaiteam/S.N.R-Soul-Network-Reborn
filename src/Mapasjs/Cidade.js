export default class Cidade {
    constructor(scene) {
        this.scene = scene;

        this.imagemFundo = scene.add.image(0, 0, 'cidade').setDisplaySize(1920, 640).setDepth(-100);
        this.imagemFundo.setOrigin(0, 0);

        this.plataformas = scene.physics.add.staticGroup();
        this.criarPlataformas();

    }

    criarPlataformas() {
        this.adicionarPlataforma(960, 530, 1000, 60);
        this.adicionarPlataforma(1300, 300, 60, 500);
    }

    adicionarPlataforma(x, y, largura, altura) {
        const p = this.scene.add.rectangle(x, y, largura, altura, 0xff0000);
        p.setOrigin(0.5, 0.5);
        this.scene.physics.add.existing(p, true);
        this.plataformas.add(p);
    }

}