// Retangulos em coordenadas do mundo; x/y representam o centro da area.
export default class SistemaLedge {
  constructor(areas = []) {
    this.areas = areas;
    this.contatos = new WeakMap();
    this.cooldowns = new WeakMap();
  }

  criarVisualizacao(scene) {
    this.visualizacao?.destroy();
    const grafico = scene.add.graphics().setDepth(1000);
    grafico.lineStyle(2, 0x00ffcc, 1);
    for (const area of this.areas) {
      const x = area.x - area.largura / 2;
      const y = area.y - area.altura / 2;
      grafico.strokeRect(x, y, area.largura, area.altura);
    }
    this.visualizacao = grafico;
    this.atualizarVisualizacao(scene);
    return grafico;
  }

  atualizarVisualizacao(scene) {
    const mundo = scene.physics.world;
    this.visualizacao?.setVisible(
      Boolean(mundo.drawDebug) && mundo.debugGraphic?.visible !== false
    );
  }

  atualizar(personagem) {
    const body = personagem?.sprite?.body;
    if (!body || !personagem.sprite.active || !body.enable || personagem.eliminado || personagem.emMorteVS) {
      if (personagem) this.contatos.delete(personagem);
      return;
    }
    const anteriores = this.contatos.get(personagem) ?? new Set();
    const atuais = new Set(this.areas.filter(area =>
      body.right > area.x - area.largura / 2 &&
      body.left < area.x + area.largura / 2 &&
      body.bottom > area.y - area.altura / 2 &&
      body.top < area.y + area.altura / 2
    ));
    this.contatos.set(personagem, atuais);
    const agora = personagem.scene.time.now;
    const estado = personagem.maquinaEstados.estadoAtual?.nome;
    if (body.blocked.down || ["dead", "ult", "teia"].includes(estado) ||
        agora < (this.cooldowns.get(personagem) ?? 0)) return;

    const area = [...atuais].find(item => !anteriores.has(item));
    if (!area) return;
    const direcao = area.direcao ?? (personagem.sprite.flipX ? -1 : 1);
    const impulsoX = direcao * Math.abs(area.impulsoHorizontal ?? 120);
    if (!personagem.maquinaEstados.mudarEstado("crouch", { ledge: true, impulsoX })) return;
    personagem.pulos = Math.max(0, personagem.pulos - 1);
    personagem.isTumbling = false;
    personagem.sprite.setFlipX(direcao < 0);
    personagem.sprite.setVelocityX(impulsoX);
    personagem.sprite.setVelocityY(-Math.abs(area.impulso ?? 360));
    personagem.aplicarSquashPouso(1.3);
    this.cooldowns.set(personagem, agora + 600);
    const protecao = personagem.estadoInvencible;
    // Preserva uma protecao de respawn que ainda tenha mais tempo restante.
    if (!protecao.ativo || protecao.expiracao.getRemaining() < 600) protecao.entrar(600);
    protecao.protecaoLedgeAte = agora + 600;
  }
}
