import EstadoBase from "./EstadoBase.js";

export default class EstadoDano extends EstadoBase {

    enter() {
        this.personagem.tocarAnimacao("dano");

        this.tempoInicial = this.personagem.scene.time.now;
        
        const acumulado = this.personagem.porcentagemDano || 0;
        this.duracaoStun = 200 + (acumulado * 3.5);

        if (this.personagem.sprite.body) {
            this.personagem.sprite.body.setBounce(0.5, 0.4);
        }
    }

    execute() {
        const body = this.personagem.sprite.body;
        const agora = this.personagem.scene.time.now;

        if (body) {
            body.setVelocityX(body.velocity.x * 0.92);
        }

        if (agora - this.tempoInicial >= this.duracaoStun) {
            if (body.blocked.down) {
                this.personagem.maquinaEstados.mudarEstado("idle");
            } else {
                this.personagem.maquinaEstados.mudarEstado("jump");
            }
        }
    }

    exit() {
        if (this.personagem.sprite.body) {
            this.personagem.sprite.body.setBounce(0, 0);
        }
    }
}