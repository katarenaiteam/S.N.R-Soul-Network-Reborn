import { tocarMusicaSegura } from "../Objetos/AudioSeguro.js";

export default class Cidade {
    constructor(scene) {
        this.scene = scene;

        if (scene.sound) {
            this.musica = tocarMusicaSegura(scene, 'ClockTower', { loop: true, volume: 0.05 });
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
            p1: { x: 1000, y: 835 },
            p2: { x: 1600, y: 835 }
        };

        this.spawnsRespawn = {
            p1: { x: 1000, y: 750 },
            p2: { x: 1600, y: 750 }
        };

        this.plataformas = scene.physics.add.staticGroup();
        this.criarPlataformas();
        // Areas de recuperacao: centro x/y, largura e altura em pixels.
        this.areasLedge = [
            { x: 860, y: 890, largura: 30, altura: 35, direcao: 1 },
            { x: 1740, y: 890, largura: 30, altura: 35, direcao: -1 },
            { x: 2105, y: 640, largura: 40, altura: 50, direcao: -1 },
            { x: 490, y: 612, largura: 40, altura: 50, direcao: 1 },
        ];

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
    p.body.y = y - (alturaPixels / 3);

    return p;
}

    // 6. PLATAFORMAS POSICIONADAS NO PADRÃO DO NOVO MUNDO
    criarPlataformas() {
        this.adicionarPlataformaSprite(1300, 900, 'plat-cidade', 900, 120); // Plataforma principal

        this.adicionarPlataformaSprite(1900, 650, 'plat-cidade', 450, 120);
        this.adicionarPlataformaSprite(700, 625, 'plat-cidade', 450, 120);
    
    }
}
