import EstadoBase from "../Estados/EstadoBase.js";

const TEMPO_CODIGOS = 3000;
const LETRAS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコ";
const ABERTURAS = {
  R: [[1,.36],[.98,.39],[.98,.46],[.94,.48],[.91,.52],[.96,.55],[.90,.58],[.86,.62],[.93,.64],[.90,.69],[.96,.72],[1,.69]],
  L: [[0,.35],[.04,.39],[.08,.41],[.10,.47],[.16,.50],[.12,.53],[.16,.57],[.13,.61],[.09,.63],[.04,.62],[0,.60]],
  U: [[.44,0],[.43,.05],[.41,.07],[.43,.12],[.45,.16],[.50,.19],[.54,.14],[.59,.12],[.60,.07],[.55,.04],[.55,0]],
  D: [[.29,1],[.33,.97],[.37,.94],[.38,.91],[.41,.90],[.42,.86],[.47,.87],[.51,.84],[.56,.86],[.58,.92],[.63,.90],[.68,.94],[.67,1]],
};
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function ladoDaQueda(x, y, limites) {
  const minX = limites.minX ?? limites.esquerda;
  const maxX = limites.maxX ?? limites.direita;
  const minY = limites.minY ?? limites.topo;
  const maxY = limites.maxY ?? limites.baixo;
  // Nos cantos, escolhe a borda mais ultrapassada proporcionalmente a arena.
  return [
    ["L", (minX - x) / (maxX - minX)], ["R", (x - maxX) / (maxX - minX)],
    ["U", (minY - y) / (maxY - minY)], ["D", (y - maxY) / (maxY - minY)],
  ].sort((a, b) => b[1] - a[1])[0][0];
}

class VidroMatrix {
  constructor(scene, jogador, lado, id) {
    this.scene = scene;
    this.lado = lado;
    this.tempo = 0;
    this.chave = `morte-vs-${id}`;
    this.textura = scene.textures.createCanvas(this.chave, 640, 640);
    this.contexto = this.textura.getContext();
    this.vidro = scene.textures.get(`quebrado${lado}2`).getSourceImage();
    this.imagem = scene.add.image(0, 0, this.chave).setOrigin(0).setScrollFactor(0).setDepth(1800);
    scene.camJogo.ignore(this.imagem);
    const cam = scene.camJogo;
    const ox = cam.width * cam.originX;
    const oy = cam.height * cam.originY;
    const px = cam.x + ox + (jogador.sprite.x - cam.scrollX - ox) * cam.zoom;
    const py = cam.y + oy + (jogador.sprite.y - cam.scrollY - oy) * cam.zoom;
    this.posicaoBorda = (lado === "L" || lado === "R") ? py / scene.scale.height : px / scene.scale.width;
    this.colunas = Array.from({ length: 46 }, (_, i) => ({ x: i * 14, y: Math.random() * 800, velocidade: 70 + Math.random() * 126 }));
    const centros = { R: [570,350], L: [70,320], U: [320,70], D: [320,570] };
    const angulos = { R: Math.PI, L: 0, U: Math.PI / 2, D: -Math.PI / 2 };
    this.particulas = Array.from({ length: 55 }, (_, indice) => {
      const angulo = angulos[lado];
      const velocidade = 320 + Math.random() * 220;
      const dispersao = ((indice % 11) - 5) * 30 + (Math.random() - .5) * 8;
      const distancia = Math.floor(indice / 11) * 32;
      return { x: centros[lado][0] - Math.sin(angulo) * dispersao + Math.cos(angulo) * distancia,
        y: centros[lado][1] + Math.cos(angulo) * dispersao + Math.sin(angulo) * distancia, vx: Math.cos(angulo) * velocidade,
        vy: Math.sin(angulo) * velocidade, letra: LETRAS[Math.floor(Math.random() * LETRAS.length)] };
    });
    this.atualizar(0);
  }

  atualizar(delta) {
    this.tempo += delta / 1000;
    const ctx = this.contexto;
    ctx.clearRect(0, 0, 640, 640);
    ctx.save();
    const ancoras = { R: [640,350], L: [0,320], U: [320,0], D: [320,640] };
    const [ax, ay] = ancoras[this.lado];
    const progressoEntrada = Math.min(1, this.tempo / .09);
    const escalaEntrada = .8 + .2 * (1 - (1 - progressoEntrada) ** 3);
    ctx.translate(ax, ay);
    const escalaVidro = 1.6 * escalaEntrada;
    ctx.scale(escalaVidro, escalaVidro);
    ctx.translate(-ax, -ay);
    ctx.save();
    ctx.beginPath();
    const centrosMascara = { R: [1, .54], L: [0, .50], U: [.5, 0], D: [.5, 1] };
    const [cx, cy] = centrosMascara[this.lado];
    ABERTURAS[this.lado].forEach(([x,y], i) => {
      const px = (cx + (x - cx) * 1.25) * 640;
      const py = (cy + (y - cy) * 1.25) * 640 - (this.lado === "U" ? 10 : 0);
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 640, 640);
    ctx.font = "bold 14px monospace";
    for (const coluna of this.colunas) {
      const cabeca = (coluna.y + this.tempo * coluna.velocidade) % 840;
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = i === 0 ? "#d4ffe4" : `rgba(0,255,105,${1 - i / 17})`;
        const indice = (Math.floor(this.tempo * 9) + Math.floor(coluna.x) + i * 7) % LETRAS.length;
        ctx.fillText(LETRAS[indice], coluna.x, cabeca - i * 16);
      }
    }
    ctx.restore();
    ctx.drawImage(this.vidro, 0, 0, 640, 640);
    ctx.restore();
    ctx.font = "bold 28px monospace";
    ctx.fillStyle = "#baffd3";
    ctx.shadowColor = "#00ff70";
    ctx.shadowBlur = 10;
    ctx.globalAlpha = Math.min(1, Math.max(0, (.95 - this.tempo) / .5));
    for (const p of this.particulas) {
      const deslocamento = .4 * (1 - Math.exp(-this.tempo / .4));
      ctx.fillText(p.letra, p.x + p.vx * deslocamento, p.y + p.vy * deslocamento);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    this.textura.refresh();
    const { width: w, height: h } = this.scene.scale;
    const tamanho = Math.min(w, h) * 1.1;
    const vertical = this.lado === "L" || this.lado === "R";
    const x = vertical ? (this.lado === "L" ? 0 : w - tamanho)
      : clamp(this.posicaoBorda * w - tamanho / 2, Math.min(0, w - tamanho), Math.max(0, w - tamanho));
    const y = vertical ? clamp(this.posicaoBorda * h - tamanho / 2, Math.min(0, h - tamanho), Math.max(0, h - tamanho))
      : (this.lado === "U" ? 0 : h - tamanho);
    this.imagem.setPosition(x, y).setDisplaySize(tamanho, tamanho);
  }

  destruir() {
    this.imagem.destroy();
    this.scene.textures.remove(this.chave);
  }
}

export default class MorteVS {
  constructor(scene) {
    this.scene = scene;
    this.pendentes = new Map();
    this.sequencia = 0;
    this.tvAtiva = false;
    this.aoFimTV = () => this.concluirTV();
    scene.events.once("shutdown", () => this.destruir());
  }

  iniciar(jogador, pontoRespawn, numero) {
    if (this.pendentes.has(jogador) || jogador.eliminado) return false;
    this.scene.camJogo.shake(140, 0.007);
    const efeito = new VidroMatrix(this.scene, jogador,
      ladoDaQueda(jogador.sprite.x, jogador.sprite.y, this.scene.limitesArena), ++this.sequencia);
    const invulneravel = jogador.invulneravel;
    const fsm = jogador.maquinaEstados;
    if (!fsm.estados.morteVS) fsm.adicionarEstado("morteVS", new EstadoBase(jogador));
    fsm.mudarEstado("morteVS");
    for (const logica of [...(jogador.logicasEspeciaisAtivas ?? [])]) logica.cancelar?.();
    jogador.emMorteVS = true;
    jogador.eliminado = true;
    jogador.invulneravel = true;
    jogador.sprite.setVelocity(0, 0).setVisible(false).setActive(false);
    jogador.sprite.body.enable = false;
    jogador.destruirHurtboxes();
    this.pendentes.set(jogador, { jogador, pontoRespawn, numero, efeito, invulneravel,
      inicio: this.scene.time.now });
    return true;
  }

  atualizar(delta) {
    for (const entrada of this.pendentes.values()) entrada.efeito?.atualizar(delta);
    if (this.tvAtiva || !this.pendentes.size) return;
    // Cada morte recebe seus tres segundos, inclusive mortes simultaneas.
    const prontas = [...this.pendentes.values()].filter(e => this.scene.time.now - e.inicio >= TEMPO_CODIGOS);
    if (!prontas.length) return;
    this.loteTV = prontas;
    this.tvAtiva = true;
    for (const entrada of prontas) {
      entrada.efeito.destruir();
      entrada.efeito = null;
    }
    this.scene.overlayMorte.setVisible(true).play("TVefect");
    this.scene.overlayMorte.once("animationcomplete", this.aoFimTV);
  }

  concluirTV() {
    this.scene.overlayMorte.setVisible(false);
    const fim = this.loteTV.some(e => (e.numero === 1 ? this.scene.vidasP1 : this.scene.vidasP2) <= 0);
    if (fim) {
      this.scene.sound.stopAll();
      this.scene.scene.start("CenaGameOver");
      return;
    }
    for (const e of this.loteTV) {
      this.pendentes.delete(e.jogador);
      e.jogador.emMorteVS = false;
      e.jogador.eliminado = false;
      e.jogador.invulneravel = e.invulneravel;
      e.jogador.sprite.setActive(true).setVisible(true);
      e.jogador.sprite.body.enable = true;
      e.jogador.sprite.body.setAllowGravity(true);
      this.scene.respawnar(e.jogador, e.pontoRespawn);
    }
    this.loteTV = [];
    this.tvAtiva = false;
  }

  destruir() {
    this.scene.overlayMorte.off("animationcomplete", this.aoFimTV);
    for (const entrada of this.pendentes.values()) entrada.efeito?.destruir();
    this.pendentes.clear();
  }
}
