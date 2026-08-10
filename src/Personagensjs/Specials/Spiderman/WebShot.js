export default class WebShot {
  constructor(personagem, config = {}) {
    this.personagem = personagem;
    this.config = config;
  }

  executar() {
    console.log("WebShot executado!");
    console.log("Personagem:", this.personagem.nomePersonagem);
  }
}