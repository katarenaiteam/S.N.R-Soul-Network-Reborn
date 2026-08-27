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

    const padDash = this._botaoPadPressionado(pad, 4);
    const padAtack = this._botaoPadPressionado(pad, 3);
    const padPular = this._botaoPadPressionado(pad, 2);
    const padSpecial = this._botaoPadPressionado(pad, 1);
    const padGuard = this._botaoPadPressionado(pad, 6);
    const padTaunt = this._botaoPadPressionado(pad, 5);

    this.estadoAtual.esquerda = this._teclaDown("esquerda") || padEsquerda;
    this.estadoAtual.direita = this._teclaDown("direita") || padDireita;
    this.estadoAtual.cima = this._teclaDown("cima") || padCima || padPular;
    this.estadoAtual.baixo = this._teclaDown("baixo") || padBaixo;
    this.estadoAtual.dash = this._teclaDown("dash") || padDash;
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
    return !!this.estadoAtual[nome] && !this.estadoAnterior[nome];
  }

  acabouDeSoltar(nome) {
    return !this.estadoAtual[nome] && !!this.estadoAnterior[nome];
  }

  salvarAnterior() {
    this.estadoAnterior = { ...this.estadoAtual };
  }
}
