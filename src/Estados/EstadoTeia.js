import EstadoBase from "./EstadoBase.js";
import { tocarSomSeguro } from "../Objetos/AudioSeguro.js";

export default class EstadoTeia extends EstadoBase {

    enter() {
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
    }

    exit() {
        tocarSomSeguro(this.personagem.scene, "solto", { volume: 0.04 });
        const body = this.personagem.sprite.body;

        if (body) {
            body.setVelocityX(0);
        }

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
