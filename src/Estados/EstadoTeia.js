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
        // quando a teia acabar.
    }

    exit() {
        const body = this.personagem.sprite.body;

        if (body) {
            body.setVelocityX(0);
        }
    }
}