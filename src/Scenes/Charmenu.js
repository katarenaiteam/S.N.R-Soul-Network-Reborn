import ControleEntrada from "../Objetos/ControleEntrada.js";

export default class Charmenu extends Phaser.Scene {
    constructor() {
        super({ key: 'Charmenu' });
    }

    create() {
        // 1. Fundo com a imagem que já contém os textos desenhados
        this.add.image(0, 0, "Charmenu").setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

        // 2. Música
        this.musica = this.sound.add('katarenai8bit', { loop: true, volume: 0.1 });
        this.musica.play();

        // 3. Mapeamento dos personagens e posições
        this.opcoesPersonagens = [
            { id: "Frederick", thumbKey: "FJmenu", x: 300, y: 750 },
            { id: "Madotsuki", thumbKey: "Madomenu", x: 620, y: 750 },
            { id: "Morrigan",  thumbKey: "Morrmenu",  x: 940, y: 750 },
            { id: "Dio",        thumbKey: "Diomenu",  x: 1260, y: 750 },
            { id: "SpiderMan",  thumbKey: "Spidermenu",  x: 1580, y: 750 },
            { id: "Miku",       thumbKey: "Miku_idle",  x: 400, y: 1250 }
        ];

        // Desenha as miniaturas
        this.opcoesPersonagens.forEach((char) => {
            this.add.image(char.x, char.y, char.thumbKey).setOrigin(0.5).setScale(0.5);
        });

        // 4. Posições iniciais e estados de confirmação
        this.indiceP1 = 0; // Frederick
        this.indiceP2 = 1; // Madotsuki

        this.p1Confirmou = false;
        this.p2Confirmou = false;

        this.bordaP1 = this.add.rectangle(0, 0, 235, 235).setStrokeStyle(4, 0xFF27F5F5);
        this.bordaP2 = this.add.rectangle(0, 0, 250, 250).setStrokeStyle(4, 0xffF527F5);

        this.atualizarPosicaoBordas();

        // 5. Mapeamento das Teclas do Teclado
        this.teclasP1 = this.input.keyboard.addKeys({
            esquerda: Phaser.Input.Keyboard.KeyCodes.A,
            direita:  Phaser.Input.Keyboard.KeyCodes.D,
            confirmar: Phaser.Input.Keyboard.KeyCodes.F
        });

        this.teclasP2 = this.input.keyboard.addKeys({
            esquerda: Phaser.Input.Keyboard.KeyCodes.J,
            direita:  Phaser.Input.Keyboard.KeyCodes.L,
            confirmar: Phaser.Input.Keyboard.KeyCodes.O
        });

        this.teclasSetas = this.input.keyboard.addKeys({
            esquerda: Phaser.Input.Keyboard.KeyCodes.LEFT,
            direita: Phaser.Input.Keyboard.KeyCodes.RIGHT
        });

        // Instancia os gerenciadores de controle (suporta teclado + gamepad)
        this.controleP1 = new ControleEntrada(this, this.teclasP1, 0);
        this.controleP2 = new ControleEntrada(this, this.teclasP2, 1);
    }

    update() {
        if (this.p1Confirmou && this.p2Confirmou) return;

        // Atualiza os controles
        this.controleP1.atualizar();
        this.controleP2.atualizar();

        // --- CONTROLES P1 ---
        if (!this.p1Confirmou) {
            const esqP1 = Phaser.Input.Keyboard.JustDown(this.teclasP1.esquerda) || Phaser.Input.Keyboard.JustDown(this.teclasSetas.esquerda) || this.controleP1.acabouDeApertar("esquerda");
            const dirP1 = Phaser.Input.Keyboard.JustDown(this.teclasP1.direita) || Phaser.Input.Keyboard.JustDown(this.teclasSetas.direita) || this.controleP1.acabouDeApertar("direita");
            
            // Aceita a tecla F diretamente do teclado OU as ações do controle/gamepad
            const confP1 = Phaser.Input.Keyboard.JustDown(this.teclasP1.confirmar) || this.controleP1.acabouDeApertar("confirmar") || this.controleP1.acabouDeApertar("atack") || this.controleP1.acabouDeApertar("special");

            if (esqP1) {
                this.indiceP1 = (this.indiceP1 - 1 + this.opcoesPersonagens.length) % this.opcoesPersonagens.length;
                this.atualizarPosicaoBordas();
            }
            if (dirP1) {
                this.indiceP1 = (this.indiceP1 + 1) % this.opcoesPersonagens.length;
                this.atualizarPosicaoBordas();
            }
            if (confP1) {
                this.p1Confirmou = true;
                this.bordaP1.setStrokeStyle(5, 0x00ff88); // Verde ao confirmar
                this.checarInicioJogo();
            }
        }

        // --- CONTROLES P2 ---
        if (!this.p2Confirmou) {
            const esqP2 = Phaser.Input.Keyboard.JustDown(this.teclasP2.esquerda) || this.controleP2.acabouDeApertar("esquerda");
            const dirP2 = Phaser.Input.Keyboard.JustDown(this.teclasP2.direita) || this.controleP2.acabouDeApertar("direita");
            
            // Aceita a tecla O diretamente do teclado OU as ações do controle/gamepad
            const confP2 = Phaser.Input.Keyboard.JustDown(this.teclasP2.confirmar) || this.controleP2.acabouDeApertar("confirmar") || this.controleP2.acabouDeApertar("atack") || this.controleP2.acabouDeApertar("special");

            if (esqP2) {
                this.indiceP2 = (this.indiceP2 - 1 + this.opcoesPersonagens.length) % this.opcoesPersonagens.length;
                this.atualizarPosicaoBordas();
            }
            if (dirP2) {
                this.indiceP2 = (this.indiceP2 + 1) % this.opcoesPersonagens.length;
                this.atualizarPosicaoBordas();
            }
            if (confP2) {
                this.p2Confirmou = true;
                this.bordaP2.setStrokeStyle(5, 0x00ff88); // Verde ao confirmar
                this.checarInicioJogo();
            }
        }

        this.controleP1.salvarAnterior();
        this.controleP2.salvarAnterior();
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

            this.time.delayedCall(1000, () => {
                this.scene.start("CenaSelecaoMapa", escolhas);
            });
        }
    }
}