import EstadoBase from "./EstadoBase.js";

export default class EstadoDano extends EstadoBase {

    enter() {
        this.personagem.tocarAnimacao("dano");

        this.tempoInicial = this.personagem.scene.time.now;
        
        // Hitstun proporcional à % de dano
        const acumulado = this.personagem.porcentagemDano || 0;
        this.duracaoStun = 200 + (acumulado * 3.5);

        // 🟢 Quique SUAVE (0.2 no Y evita que ele voe pro teto ao tocar o chão)
        if (this.personagem.sprite.body) {
            this.personagem.sprite.body.setBounce(0.5, 0.4);
        }
    }

    update() {
        const body = this.personagem.sprite.body;
        const agora = this.personagem.scene.time.now;

        // 🟢 Atrito progressivo: vai freando o empurrão horizontal frame a frame
        if (body) {
            body.setVelocityX(body.velocity.x * 0.92);
        }

        // Fim do Hitstun -> Devolve o controle pro jogador
        if (agora - this.tempoInicial >= this.duracaoStun) {
            if (body.blocked.down) {
                this.personagem.maquinaEstados.mudarEstado("idle");
            } else {
                this.personagem.maquinaEstados.mudarEstado("jump");
            }
        }
    }

    execute() {
        this.update();
    }

    exit() {
        // Desativa o quique ao sair do Estado de Dano
        if (this.personagem.sprite.body) {
            this.personagem.sprite.body.setBounce(0, 0);
        }
    }
}