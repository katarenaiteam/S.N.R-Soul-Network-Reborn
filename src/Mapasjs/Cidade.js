export default class Cidade {
    constructor(scene) {
        this.scene = scene;

        // Plataformas
        this.plataformas = scene.physics.add.staticGroup();
        this.criarPlataformas();

        // Cria a animação do fundo usando o gerenciador da cena (this.scene.anims)
        if (!this.scene.anims.exists("tocarFundo")) {
            this.scene.anims.create({
                key: "tocarFundo",
                frames: this.scene.anims.generateFrameNumbers("matrix"),
                frameRate: 10,
                repeat: -1
            });
        }

        // Criamos um Sprite (em vez de Image) para que ele possa executar animações
        this.imagemFundo = scene.add.sprite(960, 540, 'matrix')
            .setDisplaySize(1920, 1080)
            .setDepth(-100);

        this.imagemFundo.play("tocarFundo");
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