// Encontra o primeiro topo cruzado entre dois passos, mesmo em alta velocidade.
export function encontrarChaoCruzado(anterior, atual, plataformas) {
  const queda = atual.bottom - anterior.bottom;
  if (queda <= 0) return null;
  let contato = null;
  for (const p of plataformas) {
    if (!p?.enable || anterior.bottom > p.top + 1 || atual.bottom < p.top) continue;
    const t = Math.max(0, (p.top - anterior.bottom) / queda);
    const left = anterior.left + (atual.left - anterior.left) * t;
    if (left + atual.width <= p.left || left >= p.right) continue;
    if (!contato || t < contato.t) contato = { t, left, top: p.top };
  }
  return contato;
}

export function garantirQuiqueImpacto(personagem) {
  const scene = personagem.scene;
  const sprite = personagem.sprite;
  const limites = () => ({ left: sprite.body.left, bottom: sprite.body.bottom, width: sprite.body.width });
  let anterior = limites();
  const fim = scene.time.now + 5000;
  const remover = () => {
    scene.events.off('postupdate', atualizar);
    scene.events.off('shutdown', remover);
    sprite.off('destroy', remover);
  };
  const atualizar = () => {
    const body = sprite.body;
    if (!sprite.active || !body?.enable || personagem.eliminado || scene.time.now >= fim ||
        personagem.maquinaEstados.estadoAtual?.nome !== 'dano' || body.velocity.y < 0) {
      remover(); return;
    }
    const solidas = scene.mapaAtual?.plataformas?.getChildren() ?? [];
    const sistema = scene.sistemaPlataformasAtravessaveis;
    const ignorarAte = sistema?.jogadores.get(personagem)?.ignorarAte ?? 0;
    const atravessaveis = scene.time.now >= ignorarAte ? sistema?.grupo.getChildren() ?? [] : [];
    const atual = limites();
    const contato = encontrarChaoCruzado(anterior, atual, [...solidas, ...atravessaveis].map(p => p.body));
    if (contato) {
      const vx = body.velocity.x;
      const quique = Math.max(500, body.velocity.y * 0.4);
      body.reset(sprite.x + contato.left - body.left, sprite.y + contato.top - body.bottom);
      body.setVelocity(vx, -quique);
      personagem.sincronizarHurtbox();
      remover();
    } else {
      anterior = atual;
    }
  };
  scene.events.on('postupdate', atualizar);
  scene.events.once('shutdown', remover);
  sprite.once('destroy', remover);
}
