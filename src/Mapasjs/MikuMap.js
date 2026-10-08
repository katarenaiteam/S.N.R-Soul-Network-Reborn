import { tocarMusicaSegura } from "../Objetos/AudioSeguro.js";

export default class MikuMap {
    constructor(scene) {
        this.scene = scene;

        if (scene.sound) {
            this.musica = tocarMusicaSegura(scene, 'm-doll', { loop: true, volume: 0.2 });
        }

        const larguraMundo = 2340;
        const alturaMundo = 1260;
        const origemX = 130;
        const origemY = 140;

        this.configCamera = {
            limites: {
                x: origemX,
                y: origemY,
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
            minX: -50,
            maxX: 2650,
            minY: -100,
            maxY: 1700
        };

        // 3. SPAWNS INICIAIS (Em cima das plataformas centralizadas)
        this.spawnsIniciais = {
            p1: { x: 990, y: 801 },
            p2: { x: 1600, y: 801 }
        };

        this.spawnsRespawn = {
            p1: { x: 990, y: 801 },
            p2: { x: 1600, y: 601 }
        };

        this.plataformas = scene.physics.add.staticGroup();
        this.criarPlataformas();
        this.areasLedge = [
            { x: 719, y: 820, largura: 40, altura: 30, direcao: 1 },
            { x: 1882, y: 820, largura: 40, altura: 30, direcao: -1 },
            
          
           
        ];

        

        if (!this.scene.anims.exists("tocarFundo")) {
            this.scene.anims.create({
                key: "tocarFundo",
                frames: this.scene.anims.generateFrameNumbers("show-back"),
                frameRate: 10,
                repeat: -1
            });
        }

        // 4. FUNDO REDIMENSIONADO PARA 2340x1260
        this.imagemFundo = scene.add.sprite(origemX + larguraMundo / 2, origemY + alturaMundo / 2, 'show-back');
        this.imagemFundo.setDepth(-100);
        this.imagemFundo.setDisplaySize(larguraMundo, alturaMundo);
        this.imagemFundo.play("tocarFundo");
        this.criarTeloes();
    }

    criarTeloes() {
        const scene = this.scene;
        const sx = this.configCamera.limites.largura / 1920;
        const sy = this.configCamera.limites.altura / 1080;
        this.objetosTeloes = [];
        this.historia = scene.sys.settings.key === "CenaHistoria";
        this.inicioTeloes = scene.time.now;

        if (!scene.anims.exists("miku-telao-ruido")) {
            scene.anims.create({
                key: "miku-telao-ruido",
                frames: scene.anims.generateFrameNumbers("efeito-baner"),
                frameRate: 12,
                repeat: -1,
            });
        }

        // Coordenadas das aberturas na arte original de 1920x1080.
        const criarTela = (pontos, profundidade = -99) => {
            const xs = pontos.map(p => p[0]);
            const ys = pontos.map(p => p[1]);
            const x = this.configCamera.limites.x + (Math.min(...xs) + Math.max(...xs)) / 2 * sx;
            const y = this.configCamera.limites.y + (Math.min(...ys) + Math.max(...ys)) / 2 * sy;
            const largura = (Math.max(...xs) - Math.min(...xs)) * sx;
            const altura = (Math.max(...ys) - Math.min(...ys)) * sy;
            const fundo = scene.add.rectangle(x, y, largura, altura, 0x030916)
                .setDepth(profundidade);
            const efeito = scene.add.sprite(x, y, "efeito-baner")
                .setDisplaySize(largura, altura).setDepth(profundidade + 2)
                .setBlendMode("SCREEN").setAlpha(0.35)
                .play("miku-telao-ruido");
            this.objetosTeloes.push(fundo, efeito);
            return { x, y, largura, altura, profundidade };
        };

        this.telaEsquerda = criarTela([[19, 237], [104, 255], [102, 393], [18, 380]], -103);
        this.telaDireita = criarTela([[1814, 255], [1900, 237], [1901, 381], [1816, 393]], -103);
        const centro = criarTela([[676, 182], [1243, 182], [1243, 397], [674, 397]]);
        for (const tela of [this.telaEsquerda, this.telaDireita]) {
            tela.banner = scene.add.image(tela.x, tela.y, "FJ_baner")
                .setDepth(tela.profundidade + 1);
            this.objetosTeloes.push(tela.banner);
        }
        this.numeroEsquerda = scene.add.image(centro.x - 130 * sx, centro.y, "0.png")
            .setDisplaySize(100 * sx, 120 * sy).setDepth(-98);
        this.numeroDireita = scene.add.image(centro.x + 130 * sx, centro.y, "0.png")
            .setDisplaySize(100 * sx, 120 * sy).setDepth(-98);
        const separador = scene.add.rectangle(centro.x, centro.y, 35 * sx, 8 * sy, 0xffffff)
            .setDepth(-98);
        this.objetosTeloes.push(this.numeroEsquerda, this.numeroDireita, separador);
        this.atualizarTeloes();

        const ignorarHUD = () => {
            const objetos = [...this.objetosTeloes, this.suportePlataforma]
                .filter(objeto => objeto instanceof Phaser.GameObjects.GameObject);
            if (objetos.length) scene.camHUD?.ignore(objetos);
        };
        scene.events.once("create", ignorarHUD);
        scene.events.on("postupdate", this.atualizarTeloes, this);
        scene.events.once("shutdown", () => {
            scene.events.off("create", ignorarHUD);
            scene.events.off("postupdate", this.atualizarTeloes, this);
        });
    }

    atualizarTeloes() {
        if (!this.imagemFundo.visible) return;
        const scene = this.scene;
        const banners = {
            FJ: "FJ_baner", Frederick: "FJ_baner", Aigis: "Aig_baner",
            SpiderMan: "Spy_baner", Pingu: "Pin_baner", Storm: "Stor_baner",
            Miku: "Miku_baner", Ken: "Ken_baner", Slenderman: "Slen_baner",
            Goku: "GK_baner", TH: "TH_baner",
        };
        const exibirP2 = this.historia && scene.numPlayers === 2 &&
            Math.floor((scene.time.now - this.inicioTeloes) / 3000) % 2 === 1;
        const atualizarBanner = (tela, personagem) => {
            const chave = banners[personagem];
            tela.banner.setVisible(Boolean(chave));
            if (!chave || tela.chave === chave) return;
            tela.chave = chave;
            tela.banner.setTexture(chave);
            tela.banner.setScale(Math.min(tela.largura / tela.banner.width, tela.altura / tela.banner.height));
        };
        atualizarBanner(this.telaEsquerda, exibirP2 ? scene.escolhaP2 : scene.escolhaP1);
        atualizarBanner(this.telaDireita, this.historia ? scene.inimigoNome : scene.escolhaP2);
        const vidasAdversario = this.historia ? scene.vidasBoss : scene.vidasP2;
        const vidasJogador = exibirP2 ? scene.vidasP2 : scene.vidasP1;
        const pontos = vidas => Math.max(0, Math.min(3, 3 - (vidas ?? 3)));
        this.numeroEsquerda.setTexture(`${pontos(vidasAdversario)}.png`);
        this.numeroDireita.setTexture(`${pontos(vidasJogador)}.png`);
    }



    adicionarPlataformaSprite(x, y, chaveImagem, larguraPixels, alturaPixels) {
    const p = this.plataformas.create(x, y, chaveImagem);
    p.setOrigin(0.5, 0.2);
    p.setDisplaySize(larguraPixels, alturaPixels);

    // 1. Reduz o corpo físico para a metade da altura
    const metadeAltura = alturaPixels / 1.3;
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
        const plataforma = this.adicionarPlataformaSprite(1300, 800, 'miku-plat', 1200, 70); // Plataforma principal
        this.suportePlataforma = this.scene.add.image(plataforma.x, plataforma.y, 'suport')
            // O centro da grade fica em x=81 na imagem de 269 pixels.
            .setOrigin(81 / 269, 0)
            .setDepth(plataforma.depth - 1);
        this.suportePlataforma.displayHeight = this.configCamera.limites.y + this.configCamera.limites.altura - plataforma.y;
      //  this.adicionarPlataformaSprite(2150, 650, 'plat525', 450, 60);
      //  this.adicionarPlataformaSprite(500, 650, 'plat525', 450, 60);

      //  this.adicionarPlataformaAtravessavel(1300, 650, 700, "Plat-trans", 450, 40);  
    }
}
