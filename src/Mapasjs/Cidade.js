export default class Cidade {
    constructor(scene) {
        this.scene = scene;

        if (scene.sound) {
            this.musica = scene.sound.add('ClockTower', { loop: true, volume: 0.05 });
            this.musica.play();
        }

        // 1. TAMANHO DO MUNDO (Seguindo o padrão do SkyTowers)
        const larguraMundo = 2600; 
        const alturaMundo = 1400;

        this.configCamera = {
            limites: {
                x: 0,
                y: 0,
                largura: larguraMundo,
                altura: alturaMundo
            },
            maxZoom: 2.2,
            minZoom: 0.9,
            distMinima: 100,
            distMaxima: 1200
        };

        // 2. LIMITES DE MORTE
        this.limitesArena = {
            minX: -200,
            maxX: 2800,
            minY: -200,
            maxY: 1600
        };

        // 3. SPAWNS INICIAIS E RESPAWNS
        this.spawnsIniciais = {
            p1: { x: 1000, y: 750 },
            p2: { x: 1600, y: 750 }
        };

        this.spawnsRespawn = {
            p1: { x: 1000, y: 750 },
            p2: { x: 1600, y: 750 }
        };

        this.plataformas = scene.physics.add.staticGroup();
        this.criarPlataformas();

        // 4. ANIMAÇÃO DE FUNDO
        if (!this.scene.anims.exists("tocarFundoCidade")) {
            this.scene.anims.create({
                key: "tocarFundoCidade",
                frames: this.scene.anims.generateFrameNumbers("cidade"),
                frameRate: 10,
                repeat: -1
            });
        }

        // 5. FUNDO REDIMENSIONADO E CENTRALIZADO (2600x1400)
        this.imagemFundo = scene.add.sprite(larguraMundo / 2, alturaMundo / 2, 'cidade');
        this.imagemFundo.setDepth(-100);
        this.imagemFundo.setDisplaySize(larguraMundo, alturaMundo);
        this.imagemFundo.play("tocarFundoCidade");
    }

    // Método para plataformas em blocos sem sprite (Cores Sólidas)
    adicionarPlataformaBloco(x, y, largura, altura, cor = 0xff0000) {
        // Cria o formato geométrico do retângulo
        const p = this.scene.add.rectangle(x, y, largura, altura, cor);
        p.setOrigin(0.5, 0.5);
        
        // Ativa física estática
        this.scene.physics.add.existing(p, true);
        this.plataformas.add(p);

        return p;
    }

    // 6. PLATAFORMAS POSICIONADAS NO PADRÃO DO NOVO MUNDO
    criarPlataformas() {
        this.adicionarPlataformaBloco(1300, 900, 900, 60); // Plataforma principal
        this.adicionarPlataformaBloco(1800, 650, 450, 60);
        this.adicionarPlataformaBloco(800, 500, 450, 60);
    
    }
}