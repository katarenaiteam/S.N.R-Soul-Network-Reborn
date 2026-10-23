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
            maxX: 2550,
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
        this.vidaTeto = 100;
        this.tetoQuebrado = false;
        this.posicoesAnterioresTeto = new Map();
        scene.events.on("postupdate", this.atualizarTeto, this);
        scene.events.on("postupdate", this.atualizarChuvaMatrix, this);
        scene.events.once("shutdown", () => scene.events.off("postupdate", this.atualizarTeto, this));
        scene.events.once("shutdown", () => scene.events.off("postupdate", this.atualizarChuvaMatrix, this));
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

        this.plataformaTeto = this.adicionarPlataformaColisao(1300, 700, 3000, 30);
    
      

    }

    atualizarTeto() {
        if (this.tetoQuebrado || !this.plataformaTeto?.body?.enable) return;
        const scene = this.scene;
        const teto = this.plataformaTeto.body;
        const personagens = [scene.jogador1, scene.jogador2, scene.boss].filter(Boolean);

        for (const personagem of personagens) {
            const corpo = personagem.sprite?.body;
            if (!corpo?.enable) continue;
            const anterior = this.posicoesAnterioresTeto.get(personagem);
            const atual = { top: corpo.top, bottom: corpo.bottom, left: corpo.left, right: corpo.right };
            this.posicoesAnterioresTeto.set(personagem, atual);
            if (!anterior || atual.right <= teto.left || atual.left >= teto.right) continue;

            // Detecta tanto a penetração gradual quanto um salto que cruza o teto entre frames.
            const atravessou = (atual.bottom > teto.top && atual.top < teto.bottom) ||
                (anterior.bottom <= teto.top && atual.top >= teto.bottom) ||
                (anterior.top >= teto.bottom && atual.bottom <= teto.top);
            if (atravessou) {
                this.quebrarTeto();
                return;
            }

            // Um personagem lançado contra a parte de baixo do teto causa dano ao quicar.
            if (personagem.maquinaEstados?.estadoAtual?.nome === "dano" && corpo.blocked.up &&
                !personagem._bateuNoTetoFinal) {
                personagem._bateuNoTetoFinal = true;
                this.danificarTeto(15, personagem.sprite.x, teto.top);
            } else if (!corpo.blocked.up) {
                personagem._bateuNoTetoFinal = false;
            }
            if (this.tetoQuebrado) return;
        }
    }

    registrarGolpeNoTeto(hitbox, dano) {
        if (!hitbox?.body || !this.plataformaTeto?.body?.enable || !(dano > 0)) return;
        let atingiu = false;
        const overlap = this.scene.physics.add.overlap(hitbox, this.plataformaTeto, () => {
            if (atingiu || this.tetoQuebrado) return;
            atingiu = true;
            this.danificarTeto(dano, hitbox.body.center.x, this.plataformaTeto.body.top);
        });
        hitbox.once("destroy", () => overlap.destroy());
    }

    danificarTeto(dano, x = 1300, y = 700) {
        this.vidaTeto = Math.max(0, this.vidaTeto - dano);
        const posicaoIndicativo = Math.max(y - 24, this.configCamera.limites.y + 28);
        const indicativo = this.scene.add.text(x, posicaoIndicativo, `-${dano}`, {
            fontFamily: "Arial, sans-serif", fontSize: "22px", color: "#ffcc55",
            stroke: "#111111", strokeThickness: 4
        }).setOrigin(0.5).setDepth(20);
        this.scene.camHUD?.ignore(indicativo);
        this.scene.tweens.add({
            targets: indicativo,
            y: posicaoIndicativo - 38,
            alpha: 0,
            duration: 650,
            onComplete: () => indicativo.destroy()
        });
        if (this.vidaTeto === 0) this.quebrarTeto();
    }

    criarChuvaMatrix() {
        if (this.colunasMatrix) return;
        this.colunasMatrix = [];
        const limites = this.configCamera.limites;
        const alfabeto = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const espacamento = 28;
        const quantidade = Math.ceil(limites.largura / espacamento);
        for (let indice = 0; indice < quantidade; indice += 1) {
            if (Phaser.Math.FloatBetween(0, 1) < 0.2) continue;
            const caracteres = Array.from({ length: Phaser.Math.Between(8, 16) }, () =>
                alfabeto[Phaser.Math.Between(0, alfabeto.length - 1)]);
            const x = limites.x + indice * espacamento;
            const y = Phaser.Math.Between(limites.y - limites.altura, limites.y + limites.altura);
            const cauda = this.scene.add.text(x, y, caracteres.join("\n"), {
                fontFamily: "monospace", fontSize: "16px", color: "#159447", lineSpacing: 1
            }).setDepth(-101).setAlpha(0.6);
            const cabeca = this.scene.add.text(x, y, caracteres[0], {
                fontFamily: "monospace", fontSize: "16px", color: "#c5ffd8"
            }).setDepth(-101).setAlpha(0.9);
            this.scene.camHUD?.ignore([cauda, cabeca]);
            this.colunasMatrix.push({ x, y, caracteres, cauda, cabeca, velocidade: Phaser.Math.Between(70, 150) });
        }
    }

    atualizarChuvaMatrix(_time, delta = 16.67) {
        if (!this.tetoQuebrado || !this.colunasMatrix) return;
        const limites = this.configCamera.limites;
        for (const coluna of this.colunasMatrix) {
            coluna.y += coluna.velocidade * Math.min(delta, 50) / 1000;
            coluna.cauda.setPosition(coluna.x, coluna.y);
            coluna.cabeca.setPosition(coluna.x, coluna.y);
            if (coluna.y > limites.y + limites.altura) {
                coluna.y = limites.y - Phaser.Math.Between(80, limites.altura * 2);
                coluna.velocidade = Phaser.Math.Between(70, 150);
                coluna.caracteres = coluna.caracteres.map(() => "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[
                    Phaser.Math.Between(0, 35)
                ]);
                coluna.cauda.setText(coluna.caracteres.join("\n"));
                coluna.cabeca.setText(coluna.caracteres[0]);
            }
        }
    }

    obterEstadoEspectador() {
        return { tetoQuebrado: this.tetoQuebrado };
    }

    aplicarEstadoEspectador(estado) {
        if (estado?.tetoQuebrado && !this.tetoQuebrado) this.quebrarTeto();
    }

    quebrarTeto() {
        if (this.tetoQuebrado) return;
        this.tetoQuebrado = true;
        this.plataformaTeto.body.enable = false;
        if (this.scene.cache.audio.exists("glass")) {
            this.scene.sound.play("glass", { volume: 0.65 });
        }
        this.imagemMoldura.setTexture("moldura-broke");
        this.criarChuvaMatrix();

        const parte = this.scene.add.image(
            this.imagemMoldura.x,
            this.imagemMoldura.y,
            "broke-part"
        ).setDepth(this.imagemMoldura.depth + 1)
            .setDisplaySize(this.imagemMoldura.displayWidth, this.imagemMoldura.displayHeight);
        parte.snrEfeitoProcedural = true;
        this.scene.camHUD?.ignore(parte);
        const limite = this.configCamera.limites;
        const destinoY = Math.max(limite.y + limite.altura + parte.displayHeight, this.imagemMoldura.y + parte.displayHeight);
        this.scene.tweens.add({
            targets: parte,
            y: destinoY,
            angle: 8,
            duration: 1800,
            ease: "Quad.easeIn",
            onComplete: () => parte.destroy()
        });
    }
}
