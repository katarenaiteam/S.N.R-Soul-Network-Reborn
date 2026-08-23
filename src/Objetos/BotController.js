export default class BotController {
    constructor(scene, bot, alvo, nivelDificuldade = 'medio') {
        this.scene = scene;
        this.bot = bot;
        this.alvo = alvo;
        this.dificuldade = nivelDificuldade;

        // Simula a estrutura exata de teclas que os seus jogadores usam
        this.teclas = {
            esquerda: { isDown: false },
            direita: { isDown: false },
            cima: { isDown: false },
            baixo: { isDown: false },
            ataque: { isDown: false },
            defesa: { isDown: false }
        };

        // Cronômetro de tempo de reação (em milissegundos)
        this.tempoUltimaDecisao = 0;
        this.intervaloDecisao = 200; // Toma decisões a cada 200ms (1/5 de segundo)
    }

    update(time) {
        if (!this.bot || !this.alvo || !this.bot.active || !this.alvo.active) {
            this.zerarComandos();
            return;
        }

        // Limita a tomada de decisão para simular o tempo de reação
        if (time > this.tempoUltimaDecisao + this.intervaloDecisao) {
            this.tomarDecisao();
            this.tempoUltimaDecisao = time;
        }
    }

    tomarDecisao() {
        this.zerarComandos();

        const dx = this.alvo.sprite.x - this.bot.sprite.x;
        const dy = this.alvo.sprite.y - this.bot.sprite.y;
        const distAbsolutaX = Math.abs(dx);

        const alcanceAtaque = 120; // Ajuste conforme a área do hit do seu jogo

        // LÓGICA DE DECISÃO
        if (distAbsolutaX > alcanceAtaque) {
            // Longe do jogador: anda na direção dele
            if (dx > 0) {
                this.teclas.direita.isDown = true;
            } else {
                this.teclas.esquerda.isDown = true;
            }
        } else {
            // Perto do jogador: ataca ou defende
            const sorteio = Math.random();

            if (sorteio < 0.6) {
                // 60% de chance de atacar
                this.teclas.ataque.isDown = true;
            } else {
                // 40% de chance de defender
                this.teclas.defesa.isDown = true;
            }
        }

        // Se o alvo pulou e está acima, chance de pular/anti-aéreo
        if (dy < -80 && Math.random() < 0.4) {
            this.teclas.cima.isDown = true;
        }
    }

    zerarComandos() {
        this.teclas.esquerda.isDown = false;
        this.teclas.direita.isDown = false;
        this.teclas.cima.isDown = false;
        this.teclas.baixo.isDown = false;
        this.teclas.ataque.isDown = false;
        this.teclas.defesa.isDown = false;
    }
}