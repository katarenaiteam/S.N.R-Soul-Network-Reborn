import { tocarMusicaSegura } from "../Objetos/AudioSeguro.js";

export default class SlenderMap {
    constructor(scene) {
        this.scene = scene;

        // 1. TAMANHO REDUZIDO DO MUNDO (Fica menor e mais proporcional)
        const larguraMundo = 2200;
        const alturaMundo = 1200;

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
            maxX: 2400,
            minY: -200,
            maxY: 1600
        };

        // 3. SPAWNS INICIAIS (Em cima das plataformas centralizadas)
        this.spawnsIniciais = {
            p1: { x: 660, y: 687 },
            p2: { x: 1700, y: 807 }
        };

        this.spawnsRespawn = {
            p1: { x: 660, y: 687 },
            p2: { x: 1700, y: 807 }
        };

        this.plataformas = scene.physics.add.staticGroup();
        this.criarPlataformas();
        this.areasLedge = [
            { x: 352, y: 693, largura: 34, altura: 15, direcao: 1 },
            { x: 730, y: 920, largura: 34, altura: 15, direcao: 1 },
          
            { x: 1530, y: 920, largura: 34, altura: 17, direcao:  -1 },
            { x: 1875, y: 820, largura: 34, altura: 17, direcao: -1 },
            
           
        ];

        

        // 4. A animação foi dividida entre dois spritesheets; cada quadro
        // continua ocupando o fundo inteiro do mapa.
        const chaveAnimacao = "animar-fundo-slender";
        if (!scene.anims.exists(chaveAnimacao)) {
            scene.anims.create({
                key: chaveAnimacao,
                frames: [
                    ...scene.anims.generateFrameNumbers("slen-back1", { start: 0, end: 26 }),
                    ...scene.anims.generateFrameNumbers("slen-back2", { start: 0, end: 26 })
                ],
                frameRate: 10,
                repeat: -1
            });
        }

        this.imagemFundo = scene.add.sprite(larguraMundo / 2, alturaMundo / 2, "slen-back1");
        this.imagemFundo.setDepth(-100);
        this.imagemFundo.setDisplaySize(larguraMundo, alturaMundo);
        this.imagemFundo.play(chaveAnimacao);
        this.fundos = [this.imagemFundo];
    }

    iniciarMusica() {
        if (this.musica?.isPlaying || !this.scene.sound) return;
        this.musica = tocarMusicaSegura(this.scene, 'backTv', { loop: true, volume: 0.2 });
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
adicionarPlataformaAtravessavel(x, y, largura, chaveImagem) {
    const grupo = this.scene.sistemaPlataformasAtravessaveis.grupo;

    const p = grupo.create(x, y, chaveImagem);
    p.setVisible(false);

    p.setOrigin(0.5, 0.5);
    p.setDisplaySize(largura, 60);

    // Primeiro atualiza o StaticBody para o tamanho visual.
    p.refreshBody();

    // DEPOIS reduz a colisão para a metade inferior.
    p.body.setSize(largura, 30, false);

    // metade inferior do sprite
    p.body.x = x - largura / 2;
    p.body.y = y;

    return p;
}

    // 5. PLATAFORMAS CENTRALIZADAS NO NOVO TAMANHO
    criarPlataformas() {
        this.imagemPlataforma = this.scene.add.image(1100, 943, 'slen-plat')
            .setDisplaySize(1570, 514);

        this.adicionarPlataformaColisao(650, 686, 620, 20);
        this.adicionarPlataformaColisao(1130, 912, 830, 20); 
        this.adicionarPlataformaColisao(1720, 807, 330, 20);

      

      //  this.adicionarPlataformaAtravessavel(1300, 650, 700, "Plat-trans", 450, 40);  
    }

    adicionarPlataformaColisao(x, y, largura, altura) {
        const plataforma = this.plataformas.create(x, y, 'slen-plat');
        plataforma.setVisible(false);
        plataforma.body.setSize(largura, altura);
        plataforma.body.x = x - largura / 2;
        plataforma.body.y = y;
        return plataforma;
    }
}
