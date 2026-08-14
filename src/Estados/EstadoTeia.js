import EstadoBase from "./EstadoBase.js";

export default class EstadoTeia extends EstadoBase {

    enter() {
        const body = this.personagem.sprite.body;

        if (body) {
            body.setVelocityX(0);
            body.setAllowGravity(true);
        }
    }

    execute() {
        const body = this.personagem.sprite.body;

        if (body) {
            // Impede movimento horizontal,
            // mas deixa a gravidade funcionar.
            body.setVelocityX(0);
            body.setAllowGravity(true);
        }

        // O WebShot vai tirar o personagem desse estado
        // quando a teia acabar por tempo.
    }

    exit() {
        const body = this.personagem.sprite.body;

        if (body) {
            body.setVelocityX(0);
        }

        // 🕸️ SE FOR ATACADO ENQUANTO ESTÁ PRESO:
        // Se a teia ainda estiver ativa no sprite quando sair do estado (ex: tomou dano),
        // cancela os timers e toca a animação de estourar/desmanchar a teia!
        if (this.personagem.teiaPresaSprite && this.personagem.teiaPresaSprite.active) {
            const teia = this.personagem.teiaPresaSprite;

            // Cancela o timer natural de 2.5s que estava rodando no WebShot
            if (this.personagem.timerTeia) {
                this.personagem.timerTeia.remove(false);
                this.personagem.timerTeia = null;
            }

            // Desliga a função que faz a teia seguir o personagem
            if (this.personagem.seguirOponenteTeia) {
                this.personagem.scene.events.off("update", this.personagem.seguirOponenteTeia);
            }

            // Toca a animação da teia desfazendo
            teia.anims.play("spy_web_trap_end");
            teia.once("animationcomplete", () => {
                teia.destroy();
            });

            // Limpa as flags do personagem
            this.personagem.estaPresoNaTeia = false;
            this.personagem.teiaPresaSprite = null;

            // Ativa o cooldown/imunidade para não ser preso logo em seguida
            this.personagem.imuneTeia = true;
            this.personagem.scene.time.delayedCall(900, () => {
                this.personagem.imuneTeia = false;
            });
        }
    }
}