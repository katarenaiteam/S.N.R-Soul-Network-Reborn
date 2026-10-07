export default class ControleEntrada {
  constructor(scene, teclasTeclado, padIndex = 0) {
    this.scene = scene;
    this.teclasTeclado = teclasTeclado;
    this.padIndex = padIndex;
    this.deadZone = 0.3;

    this.estadoAtual = {
      esquerda: false,
      direita: false,
      cima: false,
      baixo: false,
      dash: false,
      atack: false,
      special: false,
      guard: false,
      taunt: false,
    };

    this.estadoAnterior = { ...this.estadoAtual };
    this.ultimoBaixo = -Infinity;
    this.duploBaixo = false;
    this.ultimosToquesLaterais = { esquerda: -Infinity, direita: -Infinity };
    this.duploLateral = false;
  }

  get pad() {
    const gamepadPlugin = this.scene.input?.gamepad;
    const pluginPad = gamepadPlugin?.gamepads?.[this.padIndex];
    if (pluginPad?.connected) return pluginPad;
    return null;
  }

  atualizar() {
    const pad = this.pad;
    const x = pad?.axes?.length ? pad.axes[0].getValue() : 0;
    const y = pad?.axes?.length ? pad.axes[1].getValue() : 0;

    const padEsquerda = x < -this.deadZone;
    const padDireita = x > this.deadZone;
    const padCima = y < -this.deadZone;
    const padBaixo = y > this.deadZone;

    const baixoAgora = this._teclaDown("baixo") || padBaixo;
    const esquerdaAgora = this._teclaDown("esquerda") || padEsquerda;
    const direitaAgora = this._teclaDown("direita") || padDireita;

    this.duploBaixo = false;
    this.duploLateral = false;

    if (baixoAgora && !this.estadoAtual.baixo) {
    const agora = this.scene.time.now;

    if (agora - this.ultimoBaixo <= 500) {
    this.duploBaixo = true;
    this.ultimoBaixo = -Infinity;
     } else {
    this.ultimoBaixo = agora;
     }
    }

    for (const direcao of ["esquerda", "direita"]) {
      if (this.estadoAtual[direcao] || !(direcao === "esquerda" ? esquerdaAgora : direitaAgora)) continue;
      const agora = this.scene.time.now;
      if (agora - this.ultimosToquesLaterais[direcao] <= 250) {
        this.duploLateral = true;
        this.ultimosToquesLaterais[direcao] = -Infinity;
      } else {
        this.ultimosToquesLaterais[direcao] = agora;
      }
    }

    const padAtack = this._botaoPadPressionado(pad, 2);
    const padPular = this._botaoPadPressionado(pad, 3);
    const padSpecial = this._botaoPadPressionado(pad, 9);
    const padGuard = this._botaoPadPressionado(pad, 1);
    const padTaunt = this._botaoPadPressionado(pad, 5);

    this.estadoAtual.esquerda = esquerdaAgora;
    this.estadoAtual.direita = direitaAgora;
    this.estadoAtual.cima = this._teclaDown("cima") || padCima || padPular;
    this.estadoAtual.baixo = baixoAgora;
    // Dash humano usa duplo toque lateral; dash dedicado permanece para controles virtuais.
    this.estadoAtual.dash = false;
    this.estadoAtual.atack = this._teclaDown("atack") || padAtack;
    this.estadoAtual.special = this._teclaDown("special") || padSpecial;
    this.estadoAtual.guard = this._teclaDown("guard") || padGuard;
    this.estadoAtual.taunt = this._teclaDown("taunt") || padTaunt;
  }

  _teclaDown(nome) {
    return !!this.teclasTeclado?.[nome]?.isDown;
  }

  _botaoPadPressionado(pad, index) {
    if (!pad || !pad.buttons || !pad.buttons[index]) return false;
    return pad.buttons[index].pressed;
  }

  estaApertado(nome) {
    return !!this.estadoAtual[nome];
  }

  acabouDeApertar(nome) {
    if (nome === "dash") return this.duploLateral;
    return !!this.estadoAtual[nome] && !this.estadoAnterior[nome];
  }

  acabouDeSoltar(nome) {
    return !this.estadoAtual[nome] && !!this.estadoAnterior[nome];
  }

  salvarAnterior() {
    this.estadoAnterior = { ...this.estadoAtual };
  }

  foiDuploBaixo() {
  return this.duploBaixo;
 }

  foiDuploLateral() {
    return this.duploLateral;
  }
}
