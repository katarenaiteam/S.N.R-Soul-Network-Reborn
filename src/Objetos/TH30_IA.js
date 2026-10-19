import Miku_IA from "./Miku_IA.js";

export default class TH30_IA extends Miku_IA {
  constructor(controller) {
    super(controller);
    this.mergulhoAcionado = null;
  }

  controlarMergulho(bot, alvo, estado, time) {
    const logica = estado.logicaSpecial;
    if (estado.specialAtual?.animacao !== "th_dive" || logica?.fase !== "subterraneo") {
      this.mergulhoAcionado = null;
      return false;
    }

    this.ctrl.soltar("cima");
    this.ctrl.soltar("baixo");
    this.ctrl.soltar("atack");
    this.ctrl.soltar("guard");
    if (this.mergulhoAcionado === logica) return true;

    const margem = (logica.larguraCorpo ?? 60) / 2;
    const destino = Phaser.Math.Clamp(
      alvo.sprite.x,
      logica.limiteEsquerdo + margem,
      logica.limiteDireito - margem,
    );
    const diferenca = destino - bot.sprite.x;
    if (Math.abs(diferenca) > 38) {
      this.ctrl.soltar(diferenca < 0 ? "direita" : "esquerda");
      this.ctrl.segurar(diferenca < 0 ? "esquerda" : "direita");
    } else {
      this.ctrl.soltar("esquerda");
      this.ctrl.soltar("direita");
      this.ctrl.soltar("special");
      this.ctrl.pulsar("special", 45);
      this.mergulhoAcionado = logica;
    }
    return true;
  }

  update(time, delta) {
    const bot = this.ctrl.bot;
    const estado = bot?.maquinaEstados?.estadoAtual;
    if (estado?.nome === "special") {
      const alvo = this.definirAlvo();
      this.ctrl.alvo = alvo;
      if (alvo && this.controlarMergulho(bot, alvo, estado, time)) return;
    } else {
      this.mergulhoAcionado = null;
    }
    super.update(time, delta);
  }

  podeSpecial(tipo) {
    const bot = this.ctrl.bot;
    if (tipo === "agachado") {
      const alvo = this.ctrl.alvo ?? this.definirAlvo();
      const distancia = alvo ? Math.abs(alvo.sprite.x - bot.sprite.x) : Infinity;
      return bot.sprite.body.blocked.down && distancia < 190 &&
        super.podeSpecial(tipo);
    }
    if (tipo === "neutro" || tipo === "air_neutro") {
      const alvo = this.ctrl.alvo ?? this.definirAlvo();
      const distancia = alvo ? Math.abs(alvo.sprite.x - bot.sprite.x) : Infinity;
      return distancia >= 210 && distancia <= 680 && super.podeSpecial(tipo);
    }
    return super.podeSpecial(tipo);
  }

  prioridadeAtaqueIA(tipo, nota, especial) {
    if (!especial) return nota;
    if (tipo === "neutro" || tipo === "air_neutro") return nota + 35;
    if (tipo === "lado" || tipo === "air_lado") return nota + 12;
    if (tipo === "agachado") return nota + 8;
    if (tipo === "air_cima" || tipo === "air_agachado") return nota + 10;
    return nota;
  }
}
