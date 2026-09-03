import { tocarMusicaSegura } from "../Objetos/AudioSeguro.js";

export default class SkyTowers {
    constructor(scene) {
        this.scene = scene;

        if (scene.sound) {
            this.musica = tocarMusicaSegura(scene, 'Gathers_Under_Night', { loop: true, volume: 0.1 });
        }

        // 1. TAMANHO REDUZIDO DO MUNDO (Fica menor e mais proporcional)
        const larguraMundo = 2600; 
        const alturaMundo = 1400;

        this.configCamera = {
            limites: {
                x: 0,
                y: 0,
                largura: larguraMundo,
                altura: alturaMundo
            },
            maxZoom: 2.0,
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

        // 3. SPAWNS INICIAIS (Em cima das plataformas centralizadas)
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

        if (!this.scene.anims.exists("tocarFundo")) {
            this.scene.anims.create({
                key: "tocarFundo",
                frames: this.scene.anims.generateFrameNumbers("525"),
                frameRate: 10,
                repeat: -1
            });
        }

        // 4. FUNDO REDIMENSIONADO PARA 2600x1400
        this.imagemFundo = scene.add.sprite(larguraMundo / 2, alturaMundo / 2, '525');
        this.imagemFundo.setDepth(-100);
        this.imagemFundo.setDisplaySize(larguraMundo, alturaMundo);
        this.imagemFundo.play("tocarFundo");
    }

    adicionarPlataformaSprite(x, y, chaveImagem, larguraPixels, alturaPixels) {
    const p = this.plataformas.create(x, y, chaveImagem);
    p.setOrigin(0.5, 0.5);
    p.setDisplaySize(larguraPixels, alturaPixels);

    // 1. Reduz o corpo físico para a metade da altura
    const metadeAltura = alturaPixels / 2;
    p.body.setSize(larguraPixels, metadeAltura);

    // 2. O truque para StaticBody: define a posição exata da caixa física
    // O topo do hitbox (body.y) vai começar exatamente no centro da imagem Y
    p.body.x = x - (larguraPixels / 2);
    p.body.y = y; 

    return p;
}

    // 5. PLATAFORMAS CENTRALIZADAS NO NOVO TAMANHO
    criarPlataformas() {
        this.adicionarPlataformaSprite(1300, 900, 'plat525', 900, 60); // Plataforma principal
        this.adicionarPlataformaSprite(1800, 650, 'plat525', 450, 60);
        this.adicionarPlataformaSprite(800, 500, 'plat525', 450, 60);
        this.adicionarPlataformaSprite(1500, 380, 'plat525', 450, 60);
    }
}