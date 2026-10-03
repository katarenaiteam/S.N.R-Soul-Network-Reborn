import Miku_IA from "./Miku_IA.js";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default class Pingu_IA extends Miku_IA {
  constructor(controller) {
    super(controller);
    this.provocacaoPendente = false;
    this.proximaProvocacao = 0;
    this.ultimaProvocacaoDano = 0;
    this.especialPinguControlado = false;
    this.inicioCargaDo = null;
    this.ladoAvanco = null;
    this.direcaoSpecial = null;
  }

  provocarAposBaixa() {
    this.provocacaoPendente = true;
  }

  segurarSemPulsoPendente(tecla) {
    const timer = this.ctrl.timersPulso?.get(tecla);
    if (timer) {
      timer.remove(false);
      this.ctrl.timersPulso.delete(tecla);
    }
    this.ctrl.segurar(tecla);
  }

  controlarEspecial(bot, time) {
    const estado = bot.maquinaEstados.estadoAtual;
    const anim = estado?.specialAtual?.animacao;
    if (estado?.nome !== "special") {
      if (this.especialPinguControlado) {
        this.ctrl.soltar("special");
        this.ctrl.soltar("baixo");
        if (this.ladoAvanco) this.ctrl.soltar(this.ladoAvanco);
        if (this.direcaoSpecial) this.ctrl.soltar(this.direcaoSpecial);
      }
      this.especialPinguControlado = false;
      this.inicioCargaDo = null;
      this.ladoAvanco = null;
      this.direcaoSpecial = null;
      return false;
    }

    if (anim === "pingu_doSpecial") {
      this.especialPinguControlado = true;
      const fase = estado.logicaSpecial?.fase;
      if (fase === "preparacao" || fase === "carga") {
        this.segurarSemPulsoPendente("baixo");
        this.segurarSemPulsoPendente("special");
        if (fase === "carga" && this.inicioCargaDo === null) this.inicioCargaDo = time;
        if (fase === "carga" && time - this.inicioCargaDo >= 320) this.ctrl.soltar("baixo");
      } else if (fase === "avanco") {
        this.ctrl.soltar("baixo");
        this.ctrl.soltar("special");
        const alvo = this.ctrl.alvo ?? this.definirAlvo();
        const suporte = this.apoio(bot);
        let dir = Math.sign((alvo?.sprite.x ?? bot.sprite.x) - bot.sprite.x) ||
          estado.logicaSpecial?.direcao || (bot.sprite.flipX ? -1 : 1);
        if (suporte) {
          const pista = dir < 0 ? bot.sprite.x - suporte.left : suporte.right - bot.sprite.x;
          if (pista < 230) dir *= -1;
        }
        const tecla = dir < 0 ? "esquerda" : "direita";
        if (this.ladoAvanco && this.ladoAvanco !== tecla) this.ctrl.soltar(this.ladoAvanco);
        this.ladoAvanco = tecla;
        this.ctrl.segurar(tecla);
      } else {
        this.ctrl.soltar("baixo");
        this.ctrl.soltar("special");
      }
      return true;
    }

    if (anim === "pingu_siSpecial" || anim === "pingu_AsiSpecial") {
      this.especialPinguControlado = true;
      const duracao = anim === "pingu_siSpecial" ? 3200 : 820;
      if (this.inicioCargaDo === null) this.inicioCargaDo = time;
      if (time - this.inicioCargaDo < duracao) {
        this.segurarSemPulsoPendente("special");
        if (anim === "pingu_AsiSpecial") {
          this.direcaoSpecial = bot.sprite.flipX ? "esquerda" : "direita";
          this.ctrl.segurar(this.direcaoSpecial);
        }
      } else {
        this.ctrl.soltar("special");
        if (this.direcaoSpecial) this.ctrl.soltar(this.direcaoSpecial);
      }
      return true;
    }
    return true;
  }

  escolherRota(bot, alvo, lista) {
    const inicio = this.apoio(bot, lista);
    const fim = this.pisoDoAlvo(alvo, lista);
    if (!fim || fim === inicio || !inicio) return super.escolherRota(bot, alvo, lista);
    const g = this.ctrl.scene.physics.world.gravity?.y || 900;
    const altura = bot.forcaPulo ** 2 / (2 * g) * bot.maxPulos * 1.05;
    const alcance = bot.velocidade * Math.abs(bot.forcaPulo) / g * (bot.maxPulos + 1) * 1.35;
    const fila = [[inicio]], vistos = new Set([inicio]);
    while (fila.length) {
      const caminho = fila.shift(), atual = caminho.at(-1);
      if (atual === fim) return caminho[1];
      for (const p of lista) {
        const vao = Math.max(0, p.left - atual.right, atual.left - p.right);
        if (!vistos.has(p) && atual.top - p.top < altura && vao < alcance) {
          vistos.add(p); fila.push([...caminho, p]);
        }
      }
    }
    return null;
  }

  navegar(bot, alvo, lista, time) {
    const body = bot.sprite.body;
    const suporte = this.apoio(bot, lista);
    const destino = this.rota;
    const vao = suporte && destino
      ? Math.max(0, destino.left - suporte.right, suporte.left - destino.right)
      : 0;
    const saltoPlanejado = suporte && destino && destino !== suporte &&
      (destino.top < suporte.top - 35 ||
        (destino.top <= suporte.top + 35 && vao > 70));
    if (body.blocked.down && saltoPlanejado) {
      const margem = body.width / 2 + 24;
      const centroDestino = (destino.left + destino.right) / 2;
      const dir = Math.sign(centroDestino - bot.sprite.x) || 1;
      const xAlvo = vao > 70
        ? (dir > 0 ? suporte.right - margem : suporte.left + margem)
        : clamp(centroDestino, suporte.left + margem, suporte.right - margem);
      this.mover(xAlvo);
      if (Math.abs(bot.sprite.x - xAlvo) < 22) {
        this.mover(centroDestino);
        this.pular(bot, time);
      }
      return true;
    }
    return super.navegar(bot, alvo, lista, time);
  }

  update(time, delta) {
    const bot = this.ctrl.bot;
    if (!bot?.sprite?.active || bot.eliminado || bot.emMorteVS) {
      super.update(time, delta);
      return;
    }

    const alvo = this.definirAlvo();
    this.ctrl.alvo = alvo;
    const estadoBot = bot.maquinaEstados.estadoAtual?.nome;
    if (this.controlarEspecial(bot, time)) return;
    if (estadoBot === "taunt") {
      const distancia = alvo ? Phaser.Math.Distance.Between(
        bot.sprite.x, bot.sprite.y, alvo.sprite.x, alvo.sprite.y
      ) : Infinity;
      const ameaca = alvo && this.ameacaProxima(bot, alvo, time);
      if (alvo && (distancia < 650 || ameaca)) {
        const afastar = alvo.sprite.x < bot.sprite.x ? "direita" : "esquerda";
        this.ctrl.soltarTudo();
        this.ctrl.pulsar(afastar, 100);
      } else {
        this.ctrl.soltarTudo();
      }
      return;
    }

    if (alvo?.sprite?.active && alvo.maquinaEstados.estadoAtual?.nome === "dano") {
      const distancia = Phaser.Math.Distance.Between(
        bot.sprite.x, bot.sprite.y, alvo.sprite.x, alvo.sprite.y
      );
      if (distancia > 780 && Math.abs(alvo.sprite.body.velocity.x) > 420) {
        this.provocacaoPendente = true;
      }
    }

    const prontoParaProvocar = ["idle", "walk", "crouch"].includes(estadoBot);
    const suporteBot = this.apoio(bot);
    const distanciaAlvo = alvo ? Phaser.Math.Distance.Between(
      bot.sprite.x, bot.sprite.y, alvo.sprite.x, alvo.sprite.y
    ) : Infinity;
    const plataformaSegura = suporteBot && bot.sprite.x > suporteBot.left + 180 &&
      bot.sprite.x < suporteBot.right - 180;
    const alvoLonge = distanciaAlvo > 780;
    if (this.provocacaoPendente && !alvoLonge) this.provocacaoPendente = false;
    if (this.provocacaoPendente && time >= this.proximaProvocacao &&
        bot.sprite.body.blocked.down && plataformaSegura && alvoLonge && prontoParaProvocar &&
        time - this.ultimaProvocacaoDano > 900) {
      this.ctrl.soltarTudo();
      this.ctrl.pulsar("taunt");
      this.provocacaoPendente = false;
      this.proximaProvocacao = time + 5000;
      this.ultimaProvocacaoDano = time;
      return;
    }

    super.update(time, delta);
  }
}
