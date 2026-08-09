export default class Charmenu extends Phaser.Scene {
    constructor() {
        super({ key: 'Charmenu' });
    }

    create() {
        // 1. Fundo com a imagem que já contém os textos desenhados
        this.add.image(0, 0, "Charmenu").setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

        // 3. musicar
        this.musica = this.sound.add('katarenai8bit', { loop: true, volume: 0 });
        this.musica.play();

        // 2. Mapeamento dos 3 personagens e as posições de suas miniaturas na tela
        this.opcoesPersonagens = [
            { id: "Frederick", thumbKey: "FJmenu", x: 300, y: 750 },
            { id: "Madotsuki", thumbKey: "Madomenu", x: 620, y: 750 },
            { id: "Morrigan",  thumbKey: "Morrmenu",  x: 940, y: 750 },
            { id: "Dio",  thumbKey: "Diomenu",  x: 1260, y: 750 },
            { id: "SpiderMan",  thumbKey: "Spidermenu",  x: 1580, y: 750 },
            { id: "Miku",  thumbKey: "Miku_idle",  x: 400, y: 1250 }
        ];

        // Desenha as 3 miniaturas
        this.opcoesPersonagens.forEach((char) => {
            this.add.image(char.x, char.y, char.thumbKey).setOrigin(0.5).setScale(0.5);
        });

        // 3. Posições iniciais dos jogadores na grade
        this.indiceP1 = 0; // Frederick
        this.indiceP2 = 1; // Madotsuki

        this.p1Confirmou = false;
        this.p2Confirmou = false;

        //
        this.bordaP1 = this.add.rectangle(0, 0, 235, 235).setStrokeStyle(4, 0xFF27F5F5);
        this.bordaP2 = this.add.rectangle(0, 0, 250, 250).setStrokeStyle(4, 0xffF527F5);

        this.atualizarPosicaoBordas();

        // 5. Configuração dos Controles
        // P1: A/D para mover, F para confirmar
        this.teclasP1 = this.input.keyboard.addKeys({
            esquerda: Phaser.Input.Keyboard.KeyCodes.A,
            direita:  Phaser.Input.Keyboard.KeyCodes.D,
            confirmar: Phaser.Input.Keyboard.KeyCodes.F
        });

        // P2: J/L para mover, O para confirmar
        this.teclasP2 = this.input.keyboard.addKeys({
            esquerda: Phaser.Input.Keyboard.KeyCodes.J,
            direita:  Phaser.Input.Keyboard.KeyCodes.L,
            confirmar: Phaser.Input.Keyboard.KeyCodes.O
        });
    }

    update() {
        if (this.p1Confirmou && this.p2Confirmou) return;

        // --- CONTROLES P1 ---
        if (!this.p1Confirmou) {
            if (Phaser.Input.Keyboard.JustDown(this.teclasP1.esquerda)) {
                this.indiceP1 = (this.indiceP1 - 1 + this.opcoesPersonagens.length) % this.opcoesPersonagens.length;
                this.atualizarPosicaoBordas();
            }
            if (Phaser.Input.Keyboard.JustDown(this.teclasP1.direita)) {
                this.indiceP1 = (this.indiceP1 + 1) % this.opcoesPersonagens.length;
                this.atualizarPosicaoBordas();
            }
            if (Phaser.Input.Keyboard.JustDown(this.teclasP1.confirmar)) {
                this.p1Confirmou = true;
                this.bordaP1.setStrokeStyle(5, 0x00ff88); // Verde ao confirmar
                this.checarInicioJogo();
            }
        }

        // --- CONTROLES P2 ---
        if (!this.p2Confirmou) {
            if (Phaser.Input.Keyboard.JustDown(this.teclasP2.esquerda)) {
                this.indiceP2 = (this.indiceP2 - 1 + this.opcoesPersonagens.length) % this.opcoesPersonagens.length;
                this.atualizarPosicaoBordas();
            }
            if (Phaser.Input.Keyboard.JustDown(this.teclasP2.direita)) {
                this.indiceP2 = (this.indiceP2 + 1) % this.opcoesPersonagens.length;
                this.atualizarPosicaoBordas();
            }
            if (Phaser.Input.Keyboard.JustDown(this.teclasP2.confirmar)) {
                this.p2Confirmou = true;
                this.bordaP2.setStrokeStyle(5, 0x00ff88); // Verde ao confirmar
                this.checarInicioJogo();
            }
        }
    }

    atualizarPosicaoBordas() {
        const charP1 = this.opcoesPersonagens[this.indiceP1];
        const charP2 = this.opcoesPersonagens[this.indiceP2];

        this.bordaP1.setPosition(charP1.x, charP1.y);
        this.bordaP2.setPosition(charP2.x, charP2.y);
    }

    checarInicioJogo() {
        if (this.p1Confirmou && this.p2Confirmou) {
            const escolhas = {
                p1: this.opcoesPersonagens[this.indiceP1].id,
                p2: this.opcoesPersonagens[this.indiceP2].id
            };

            if (this.musica) {
            this.musica.stop();
         }

            // Espera 1 segundo com as bordas em verde e inicia a cenaPrincipal
            this.time.delayedCall(1000, () => {
                this.scene.start("cenaPrincipal", escolhas);
            });
        }
    }
}