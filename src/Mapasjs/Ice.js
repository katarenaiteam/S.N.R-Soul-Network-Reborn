import { tocarMusicaSegura } from "../Objetos/AudioSeguro.js";

export default class Ice {
    constructor(scene) {
        this.scene = scene;
        this.escorregadio = true;

      //  if (scene.sound) {
      //      this.musica = tocarMusicaSegura(scene, 'Gathers_Under_Night', { loop: true, volume: 0.0 });
      //  }

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
            maxY: 1700
        };

        // 3. SPAWNS INICIAIS (Em cima das plataformas centralizadas)
        this.spawnsIniciais = {
            p1: { x: 600, y: 940 },
            p2: { x: 1600, y: 840 }
        };

        this.spawnsRespawn = {
            p1: { x: 600, y: 930 },
            p2: { x: 1600, y: 840 }
        };

        this.plataformas = scene.physics.add.staticGroup();
        this.criarPlataformas();
        this.areasLedge = [
            { x: 367, y: 940, largura: 40, altura: 20, direcao: 1 },
            { x: 1110, y: 940, largura: 40, altura: 20, direcao: -1 },
            { x: 1463, y: 850, largura: 40, altura: 20, direcao: 1 },
            
            { x: 2234, y: 850, largura: 40, altura: 20, direcao: -1 },
      
        ];

        

        if (!this.scene.anims.exists("ice-tocarFundo")) {
            this.scene.anims.create({
                key: "ice-tocarFundo",
                frames: this.scene.anims.generateFrameNumbers("ice-back"),
                frameRate: 10,
                repeat: -1
            });
        }

        // 4. FUNDO REDIMENSIONADO PARA 2600x1400
        this.imagemFundo = scene.add.sprite(larguraMundo / 2, alturaMundo / 2, 'ice-back');
        this.imagemFundo.setDepth(-100);
        this.imagemFundo.setDisplaySize(larguraMundo, alturaMundo);
        this.imagemFundo.play("ice-tocarFundo");
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
    p.body.y = y  - (alturaPixels / 2.5); 

    return p;
}
adicionarPlataformaAtravessavel(x, y, largura, chaveImagem) {
    const grupo = this.scene.sistemaPlataformasAtravessaveis.grupo;

    const p = grupo.create(x, y, chaveImagem);

    p.setOrigin(0.5, 0.2);
    p.setDisplaySize(largura, 60);

    // Primeiro atualiza o StaticBody para o tamanho visual.
    p.refreshBody();

    // DEPOIS reduz a colisão para a metade inferior.
    p.body.setSize(largura, 60, false);

    // metade inferior do sprite
    p.body.x = x - largura / 2;
    p.body.y = y; 

    return p;
}

    // 5. PLATAFORMAS CENTRALIZADAS NO NOVO TAMANHO
    criarPlataformas() {
        this.adicionarPlataformaSprite(1850, 900, 'ice-plat', 800, 160); // Plataforma principal1
        this.adicionarPlataformaSprite(750, 1000, 'ice-plat', 800, 160); // Plataforma principal2
       

        this.adicionarPlataformaAtravessavel(750, 700, 400, "ice-trans", 450, 40);
        this.adicionarPlataformaAtravessavel(1850, 600, 400, "ice-trans", 450, 40);
    }
}
