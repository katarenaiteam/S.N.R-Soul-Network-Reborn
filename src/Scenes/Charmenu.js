import ControleEntrada from "../Objetos/ControleEntrada.js";

export default class Charmenu extends Phaser.Scene {
    constructor() {
        super({ key: 'Charmenu' });
    }

    init(data) {
        this.modoJogo = data?.modo || "1v1";
        this.numPlayers = data?.numPlayers || 2;
    }

    create() {
        this.add.image(0, 0, "Charmenu").setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

        this.musica = this.sound.add('katarenai8bit', { loop: true, volume: 0.1 });
        this.musica.play();

        this.opcoesPersonagens = [
    
            { id: "Madotsuki", thumbKey: "Madomenu", x: 300, y: 750 },
            { id: "Dio",        thumbKey: "Diomenu",  x: 620, y: 750 },
            { id: "SpiderMan",  thumbKey: "Spidermenu",  x: 940, y: 750 },
            { id: "Ken",  thumbKey: "Kenmenu",  x: 1260, y: 750 },
            { id: "Miku",       thumbKey: "Miku_idle",  x: 1580, y: 750 }
        ];

        this.opcoesPersonagens.forEach((char) => {
            this.add.image(char.x, char.y, char.thumbKey).setOrigin(0.5).setScale(0.5);
        });

        this.indiceP1 = 0;
        this.indiceP2 = 1;

        this.p1Confirmou = false;
        // No modo história com 1 player, P2 já vem "confirmado" por padrão
        this.p2Confirmou = (this.modoJogo === "historia" && this.numPlayers === 1);

        this.bordaP1 = this.add.rectangle(0, 0, 235, 235).setStrokeStyle(4, 0xFF27F5F5);
        this.bordaP2 = this.add.rectangle(0, 0, 250, 250).setStrokeStyle(4, 0xffF527F5);

        if (this.p2Confirmou) {
            this.bordaP2.setVisible(false);
        }

        this.atualizarPosicaoBordas();

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

        this.controleP1 = new ControleEntrada(this, this.teclasP1, 0);
        this.controleP2 = new ControleEntrada(this, this.teclasP2, 1);
    }

    update() {
        if (this.p1Confirmou && this.p2Confirmou) return;

        this.controleP1.atualizar();
        if (this.numPlayers === 2) this.controleP2.atualizar();

        if (!this.p1Confirmou) {
            const esqP1 = Phaser.Input.Keyboard.JustDown(this.teclasP1.esquerda) || Phaser.Input.Keyboard.JustDown(this.teclasSetas.esquerda) || this.controleP1.acabouDeApertar("esquerda");
            const dirP1 = Phaser.Input.Keyboard.JustDown(this.teclasP1.direita) || Phaser.Input.Keyboard.JustDown(this.teclasSetas.direita) || this.controleP1.acabouDeApertar("direita");
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
                this.bordaP1.setStrokeStyle(5, 0x00ff88);
                this.checarInicioJogo();
            }
        }

        if (this.numPlayers === 2 && !this.p2Confirmou) {
            const esqP2 = Phaser.Input.Keyboard.JustDown(this.teclasP2.esquerda) || this.controleP2.acabouDeApertar("esquerda");
            const dirP2 = Phaser.Input.Keyboard.JustDown(this.teclasP2.direita) || this.controleP2.acabouDeApertar("direita");
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
                this.bordaP2.setStrokeStyle(5, 0x00ff88);
                this.checarInicioJogo();
            }
        }

        this.controleP1.salvarAnterior();
        if (this.numPlayers === 2) this.controleP2.salvarAnterior();
    }

    atualizarPosicaoBordas() {
        const charP1 = this.opcoesPersonagens[this.indiceP1];
        this.bordaP1.setPosition(charP1.x, charP1.y);

        if (this.numPlayers === 2) {
            const charP2 = this.opcoesPersonagens[this.indiceP2];
            this.bordaP2.setPosition(charP2.x, charP2.y);
        }
    }

    checarInicioJogo() {
        if (this.p1Confirmou && this.p2Confirmou) {
            if (this.musica) this.musica.stop();

            const escolhas = {
                p1: this.opcoesPersonagens[this.indiceP1].id,
                p2: this.numPlayers === 2 ? this.opcoesPersonagens[this.indiceP2].id : null,
                numPlayers: this.numPlayers,
                modo: this.modoJogo
            };

            this.time.delayedCall(1000, () => {
                if (this.modoJogo === "historia") {
                    this.scene.start("CenaHistoria", escolhas);
                } else {
                    this.scene.start("CenaSelecaoMapa", escolhas);
                }
            });
        }
    }
}