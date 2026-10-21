import { tocarMusicaSegura } from "../Objetos/AudioSeguro.js";

export default class FinalMap {
    constructor(scene) {
        this.scene = scene;

      //  if (scene.sound) {
       //     this.musica = tocarMusicaSegura(scene, 'Gathers_Under_Night', { loop: true, volume: 0.0 });
        //}

        // 1. TAMANHO REDUZIDO DO MUNDO (Fica menor e mais proporcional)
        const larguraMundo = 2600; 
        const alturaMundo = 1400;
        const proporcaoImagem = 729 / 2157;
        const larguraMoldura = 1250;
        const alturaImagem = larguraMoldura * proporcaoImagem;
        const centroImagemY = 999;
        const esquerdaImagem = (larguraMundo - larguraMoldura) / 2;
        const topoImagem = centroImagemY - alturaImagem / 2;
        const escalaZoomCamera = scene.scale.width / 1920;
        const zoomParaPreencherAltura = scene.scale.height / alturaImagem / escalaZoomCamera;
        const zoomEfetivo = zoomParaPreencherAltura * escalaZoomCamera;
        const alturaCameraMundo = scene.scale.height / zoomEfetivo;
        const topoCamera = centroImagemY - alturaCameraMundo / 2;
        this.limitesFisicos = {
            x: 0,
            y: 0,
            largura: larguraMundo,
            altura: alturaMundo
        };

        this.configCamera = {
            limites: {
                x: esquerdaImagem,
                y: topoCamera,
                largura: larguraMoldura,
                altura: alturaCameraMundo
            },
            maxZoom: zoomParaPreencherAltura,
            minZoom: zoomParaPreencherAltura,
            distMinima: 100,
            distMaxima: 1200
        };

        // 2. LIMITES DE MORTE
        this.limitesArena = {
            minX: 100,
            maxX: 2600,
            minY: -200,
            maxY: 1600
        };

        // 3. SPAWNS INICIAIS (Em cima das plataformas centralizadas)
        this.spawnsIniciais = {
            p1: { x: 1000, y: 1150 },
            p2: { x: 1600, y: 1150 }
        };

        this.spawnsRespawn = {
            p1: { x: 1000, y: 1150 },
            p2: { x: 1600, y: 1150 }
        };

        this.plataformas = scene.physics.add.staticGroup();
        this.criarPlataformas();
        this.areasLedge = [
           // { x: 867, y: 920, largura: 40, altura: 20, direcao: 1 },
           // { x: 1733, y: 920, largura: 40, altura: 20, direcao: -1 },
            
           // { x: 2360, y: 670, largura: 40, altura: 20, direcao: -1 },
           // { x: 290, y: 670, largura: 40, altura: 20, direcao: 1 },
           
        ];

        

        const centroX = larguraMundo / 2;
        const criarCamada = (chave, profundidade, largura, altura = largura * proporcaoImagem) => scene.add.image(centroX, centroImagemY, chave)
            .setDepth(profundidade)
            .setDisplaySize(largura, altura);

        this.imagemCrio = criarCamada("crio", -100, larguraMoldura, alturaImagem);
        this.imagemFundo = this.imagemCrio;
        this.imagemMoldura = criarCamada("moldura", -99, larguraMoldura, alturaImagem);
        this.fundos = [this.imagemCrio, this.imagemMoldura];
    }



    adicionarPlataformaColisao(x, y, largura, altura) {
    const p = this.scene.add.rectangle(x, y, largura, altura, 0xffffff, 0);
    this.scene.physics.add.existing(p, true);
    this.plataformas.add(p);
    p.setVisible(false);

    // 1. Reduz o corpo físico para a metade da altura
    p.body.setSize(largura, altura);

    // 2. O truque para StaticBody: define a posição exata da caixa física
    // O topo do hitbox (body.y) vai começar exatamente no centro da imagem Y
    p.body.x = x - largura / 2;
    p.body.y = y; 

    return p;
}
adicionarPlataformaAtravessavel(x, y, largura, chaveImagem) {
    const grupo = this.scene.sistemaPlataformasAtravessaveis.grupo;

    const p = grupo.create(x, y, chaveImagem);

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
        this.adicionarPlataformaColisao(1300, 1150, 3000, 30);

        this.adicionarPlataformaColisao(1300, 700, 3000, 30);
    
      

    }
}
