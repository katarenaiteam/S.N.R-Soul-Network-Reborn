import EstadoBase from "./EstadoBase.js";
import { tocarSomSeguro } from "../Objetos/AudioSeguro.js";

export default class EstadoTeia extends EstadoBase {

    enter() {
        this.apertosMovimento = 0;
        this.tempoPresoOriginal = this.personagem.tempoPresoTeiaAtual ?? this.personagem.timerTeia?.delay ?? 1500;
        this.tweenTremorTeia = null;
        tocarSomSeguro(this.personagem.scene, "preso", { volume: 0.2 });
        const body = this.personagem.sprite.body;

        if (body) {
            body.setVelocityX(0);
            body.setAllowGravity(true);
        }

        // Esconde o sprite do personagem para não vazar a imagem por trás da teia
        if (this.personagem.sprite) {
            this.personagem.sprite.setVisible(false);
        }
    }

    execute() {
        const body = this.personagem.sprite.body;

        if (body) {
            body.setVelocityX(0);
            body.setAllowGravity(true);
        }

        const direcoes = ["esquerda", "direita", "cima", "baixo"];
        const apertadas = direcoes.filter((direcao) => this.personagem.inputJustDown(direcao));
        if (apertadas.length > 0) {
            this.apertosMovimento += apertadas.length;
            const reducaoMaxima = Math.min(this.tempoPresoOriginal - 800, 1200);
            const reducao = Math.min(this.apertosMovimento * 60, reducaoMaxima);
            if (this.personagem.timerTeia) {
                this.personagem.timerTeia.delay = this.tempoPresoOriginal - reducao;
            }
            apertadas.forEach(() => this.tremerCasulo());
        }
    }

    tremerCasulo() {
        const teia = this.personagem.teiaPresaSprite;
        if (!teia?.active) return;
        this.tweenTremorTeia?.stop();
        const deslocamento = this.personagem.deslocamentoTremorTeia ?? { x: 0, y: 0 };
        this.personagem.deslocamentoTremorTeia = deslocamento;
        deslocamento.x = 0;
        deslocamento.y = 0;
        const intensidade = Math.min(3 + this.apertosMovimento * 0.2, 6);
        const deslocamentoX = Phaser.Math.Between(-intensidade, intensidade) || intensidade;
        this.tweenTremorTeia = this.personagem.scene.tweens.add({
            targets: deslocamento,
            x: deslocamentoX,
            y: 0,
            duration: 30,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                deslocamento.x = 0;
                deslocamento.y = 0;
                if (teia.active) teia.setPosition(this.personagem.sprite.x, this.personagem.sprite.y - 40);
                this.tweenTremorTeia = null;
            }
        });
    }

    exit() {
        this.tweenTremorTeia?.stop();
        this.tweenTremorTeia = null;
        if (this.personagem.deslocamentoTremorTeia) {
            this.personagem.deslocamentoTremorTeia.x = 0;
            this.personagem.deslocamentoTremorTeia.y = 0;
        }
        tocarSomSeguro(this.personagem.scene, "solto", { volume: 0.04 });
        // receberDano já aplicou o impulso do ataque antes da troca de estado.
        // Preserve os dois eixos ao soltar a teia.

        // Restaura a visibilidade do personagem ao sair do estado preso
        if (this.personagem.sprite) {
            this.personagem.sprite.setVisible(true);
        }

        //  SE FOR ATACADO ENQUANTO ESTÁ PRESO:
        if (this.personagem.teiaPresaSprite && this.personagem.teiaPresaSprite.active) {
            const teia = this.personagem.teiaPresaSprite;

            if (this.personagem.timerTeia) {
                this.personagem.timerTeia.remove(false);
                this.personagem.timerTeia = null;
            }

            if (this.personagem.seguirOponenteTeia) {
                this.personagem.scene.events.off("update", this.personagem.seguirOponenteTeia);
            }

            teia.anims.play("spy_web_trap_end");
            teia.once("animationcomplete", () => {
                teia.destroy();
            });

            this.personagem.estaPresoNaTeia = false;
            this.personagem.teiaPresaSprite = null;

            this.personagem.imuneTeia = true;
            this.personagem.scene.time.delayedCall(900, () => {
                this.personagem.imuneTeia = false;
            });
        }
    }
}
