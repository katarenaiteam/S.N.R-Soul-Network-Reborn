export default class GerenciadorEstados {
    constructor() {

        this.estados ={};

        this.estadoAtual = null;
    }

     /**
     * Cadastra um novo estado no gerenciador
     * @param {string} nome - O identificador do estado (ex: "idle")
     * @param {EstadoBase} estadoInstanciado - A instância da classe do estado
     */
    adicionarEstado(nome, estadoInstanciado) {
        this.estados[nome] = estadoInstanciado;
    }

    /**
     * Faz a transição de um estado para outro
     * @param {string} nome - O nome do estado para o qual quer mudar
     */
    mudarEstado(nome) {
        // 1. Trava de segurança: se o estado não existir no dicionário, ignora
        if (!this.estados[nome]) {
            console.warn(`O estado "${nome}" não foi registrado!`);
            return;
        }

        // 2. Se já existe um estado rodando, manda ele "limpar a casa" antes de sair
        if (this.estadoAtual) {
            this.estadoAtual.exit();
        }

        // 3. Define o novo estado como atual
        this.estadoAtual = this.estados[nome];

        // 4. Executa a preparação inicial do novo estado
        this.estadoAtual.enter();
    }

    /**
     * Atualização contínua (deve ser chamada dentro do update do Personagem)
     */
    update() {
        // Se houver algum estado ativo, roda o código de loop dele
        if (this.estadoAtual) {
            this.estadoAtual.execute();
        }
    }
}