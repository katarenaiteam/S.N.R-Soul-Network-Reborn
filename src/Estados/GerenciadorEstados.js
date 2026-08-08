export default class GerenciadorEstados {
  constructor() {
    this.estados = {};

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
  mudarEstado(nome, dados = {}) {
    if (!this.estados[nome]) {
      console.warn(`O estado "${nome}" não foi registrado!`);
      return;
    }

    if (this.estadoAtual) {
      this.estadoAtual.exit();
    }

    this.estadoAtual = this.estados[nome];

    this.estadoAtual.enter(dados);
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
