export default class EstadoBase {
    /**
     * @param {Personagem} personagem - Referência ao personagem que possui este estado
     */
    constructor(personagem) {
        // Guarda a referência do personagem para que os estados filhos
        // possam acessar o sprite, velocidade, teclas e métodos dele
        this.personagem = personagem;
    }

    /**
     * Executado UMA VEZ no momento exato em que o estado é ativado.
     * Use para: tocar animação inicial, aplicar impulsos, redefinir gravidade.
     */
    enter() {}

    /**
     * Executado A CADA FRAME enquanto o estado estiver ativo (loop do jogo).
     * Use para: ler comandos de entrada do jogador, checar colisões/física.
     */
    execute() {}

    /**
     * Executado UMA VEZ quando o estado vai ser substituído por outro.
     * Use para: cancelar timers, resetar variáveis temporárias, restaurar valores.
     */
    exit() {}
}