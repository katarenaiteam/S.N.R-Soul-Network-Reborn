import Miku_IA from "./Miku_IA.js";

const clamp = (valor, minimo, maximo) => Math.max(minimo, Math.min(maximo, valor));

export default class Slenderman_IA extends Miku_IA {
  escolherRota(bot, alvo, lista) {
    const inicio = this.apoio(bot, lista);
    const fim = this.pisoDoAlvo(alvo, lista);
    if (!fim || fim === inicio || !inicio) return super.escolherRota(bot, alvo, lista);

    const gravidade = this.ctrl.scene.physics.world.gravity?.y || 900;
    const altura = bot.forcaPulo ** 2 / (2 * gravidade) * bot.maxPulos * 1.05;
    const alcance = bot.velocidade * Math.abs(bot.forcaPulo) / gravidade * (bot.maxPulos + 1) * 1.35;
    const fila = [[inicio]];
    const vistos = new Set([inicio]);

    while (fila.length) {
      const caminho = fila.shift();
      const atual = caminho.at(-1);
      if (atual === fim) return caminho[1];

      for (const plataforma of lista) {
        const vao = Math.max(0, plataforma.left - atual.right, atual.left - plataforma.right);
        if (!vistos.has(plataforma) && atual.top - plataforma.top < altura && vao < alcance) {
          vistos.add(plataforma);
          fila.push([...caminho, plataforma]);
        }
      }
    }

    return null;
  }

  prioridadeAtaqueIA(tipo, nota, especial) {
    if (especial && tipo === "neutro") return nota + 28;
    if (especial && tipo === "agachado") return nota + 12;
    if (especial && tipo === "lado") return nota - 15;
    if (tipo === "side" || tipo === "air_side") return nota + 8;
    return nota;
  }

  navegar(bot, alvo, lista, time) {
    const body = bot.sprite.body;
    const suporte = this.apoio(bot, lista);

    if (this.saltoPendente) {
      const { origem, destino, xPouso, inicio } = this.saltoPendente;
      if (suporte === destino || (body.blocked.down && suporte && suporte !== origem)) {
        this.saltoPendente = null;
        this.rota = null;
        return false;
      }
      if (time - inicio <= 1800) {
        this.mover(xPouso);
        if (body.blocked.down && suporte === origem) this.pular(bot, time);
        return true;
      }
      this.saltoPendente = null;
    }

    const destino = this.rota;
    const vao = suporte && destino
      ? Math.max(0, destino.left - suporte.right, suporte.left - destino.right)
      : 0;
    const saltoNecessario = suporte && destino && destino !== suporte &&
      (destino.top < suporte.top - 35 || (destino.top <= suporte.top + 35 && vao > 70));

    if (body.blocked.down && saltoNecessario) {
      const margem = body.width / 2 + 24;
      const centroDestino = (destino.left + destino.right) / 2;
      const direcao = Math.sign(centroDestino - bot.sprite.x) || 1;
      const xSaida = vao > 70
        ? (direcao > 0 ? suporte.right - margem : suporte.left + margem)
        : clamp(centroDestino, suporte.left + margem, suporte.right - margem);
      this.mover(xSaida);

      if (Math.abs(bot.sprite.x - xSaida) < 22) {
        const xPouso = clamp(centroDestino, destino.left + margem, destino.right - margem);
        this.mover(centroDestino);
        if (this.pular(bot, time)) {
          this.saltoPendente = { origem: suporte, destino, xPouso, inicio: time };
        }
      }
      return true;
    }

    return super.navegar(bot, alvo, lista, time);
  }
}
