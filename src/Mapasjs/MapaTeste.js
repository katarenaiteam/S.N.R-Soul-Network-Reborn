export default class MapaTeste {
    constructor(scene) {
        this.scene = scene;

        if (scene.sound) {
            this.musica = scene.sound.add("No_More", { loop: true, volume: 0.1 });
            this.musica.play();
        }

        const larguraMundo = 2600;
        const alturaMundo = 1400;

        this.configCamera = {
            limites: { x: 0, y: 0, largura: larguraMundo, altura: alturaMundo },
            maxZoom: 2.0,
            minZoom: 0.9,
            distMinima: 100,
            distMaxima: 1200
        };

        this.limitesArena = {
            minX: -200,
            maxX: 2800,
            minY: -200,
            maxY: 1600
        };

        this.spawnsIniciais = {
            p1: { x: 900, y: 850 },
            p2: { x: 1450, y: 850 }
        };

        this.spawnsRespawn = {
            p1: { x: 900, y: 850 },
            p2: { x: 1450, y: 850 }
        };

        this.plataformas = scene.physics.add.staticGroup();
        this.criarPlataformas();

        if (!scene.anims.exists("tocarFundoTeste")) {
            scene.anims.create({
                key: "tocarFundoTeste",
                frames: scene.anims.generateFrameNumbers("backtest"),
                frameRate: 10,
                repeat: -1
            });
        }

        this.imagemFundo = scene.add.sprite(larguraMundo / 2, alturaMundo / 2, "backtest");
        this.imagemFundo.setDepth(-100);
        this.imagemFundo.setDisplaySize(larguraMundo, alturaMundo);
        this.imagemFundo.play("tocarFundoTeste");
    }

    adicionarBloco(x, y, largura, altura, visivel = true) {
        const corPlataforma = 0x102a5e;
        const plataforma = this.scene.add.rectangle(
            x,
            y,
            largura,
            altura,
            corPlataforma,
            visivel ? 1 : 0
        );

        this.scene.physics.add.existing(plataforma, true);
        this.plataformas.add(plataforma);
        return plataforma;
    }

    criarPlataformas() {
        // Formas convertidas da topografia de referência para o mundo 2600 x 1400.
        this.adicionarBloco(142, 600, 112, 680);      // Parede alta à esquerda
        this.adicionarBloco(299, 1052, 426, 224);     // Base inferior esquerda
        this.adicionarBloco(1118, 1094, 1212, 140);   // Plataforma principal
        this.adicionarBloco(2128, 765, 580, 268);     // Plataforma direita
        this.adicionarBloco(2115, 150, 592, 92);      // Plataforma superior direita

        this.criarRampa();
    }

    criarRampa() {
        const corPlataforma = 0x102a5e;

        // Acabamento visual inclinado da rampa.
        const rampaVisual = this.scene.add.triangle(
            509,
            940,
            0, 0,
            275, 84,
            0, 84,
            corPlataforma
        ).setOrigin(0, 0);
        rampaVisual.setDepth(0);
        this.scene.physics.add.existing(rampaVisual, true);
        this.plataformas.add(rampaVisual);
        rampaVisual.body.enable = false;

        // A física Arcade não suporta rampas estáticas inclinadas; degraus pequenos
        // e invisíveis acompanham a superfície sem alterar o desenho da plataforma.
        const quantidadeDegraus = 28;
        const larguraDegrau = 275 / quantidadeDegraus;
        for (let i = 0; i < quantidadeDegraus; i += 1) {
            const x = 509 + (i + 0.5) * larguraDegrau;
            const topo = 940 + ((i + 1) / quantidadeDegraus) * 84;
            this.adicionarBloco(x, topo + 35, larguraDegrau + 2, 70, false);
        }
    }
}
