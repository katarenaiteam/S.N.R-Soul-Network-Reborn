const limitar = (valor, min, max) => Math.max(min, Math.min(max, valor));

// A direção do golpe continua dominante. Posição e movimento apenas desviam
// o ângulo, sem sortear resultados nem aumentar a força do lançamento.
export function ajustarDirecaoKnockback(vx, vy, body, origem, propriedades = {}) {
  const forca = Math.hypot(vx, vy);
  const influencia = limitar(propriedades.influenciaImpacto ??
    (propriedades.knockbackFixo ? 0 : 1), 0, 1);
  if (!forca || !influencia) return { x: vx, y: vy };

  const nx = vx / forca;
  const ny = vy / forca;
  const centroX = body.center?.x ?? body.left + body.width / 2;
  const centroY = body.center?.y ?? body.top + body.height / 2;
  const dx = Number.isFinite(origem?.x) && Number.isFinite(centroX)
    ? limitar((centroX - origem.x) / Math.max(body.width || 1, 40), -1, 1) : 0;
  const dy = Number.isFinite(origem?.y) && Number.isFinite(centroY)
    ? limitar((centroY - origem.y) / Math.max(body.height || 1, 60), -1, 1) : 0;
  const movimentoX = (body.velocity?.x ?? 0) + (origem?.velocidadeX ?? 0) * 0.25;
  const movimentoY = (body.velocity?.y ?? 0) + (origem?.velocidadeY ?? 0) * 0.25;
  const posicaoLateral = limitar(-ny * dx + nx * dy, -1, 1);
  const movimentoLateral = limitar((-ny * movimentoX + nx * movimentoY) / 700, -1, 1);
  const desvio = (posicaoLateral * 13 + movimentoLateral * 5) * influencia * Math.PI / 180;
  const anguloBase = Math.atan2(vy, vx);
  let angulo = anguloBase + desvio;
  // Um golpe descendente continua descendente; um launcher continua subindo.
  if (vy < 0) angulo = limitar(angulo, -Math.PI + 0.01, -0.01);
  if (vy > 0) angulo = limitar(angulo, 0.01, Math.PI - 0.01);
  return { x: Math.cos(angulo) * forca, y: Math.sin(angulo) * forca };
}

// O vetor contextual serve apenas para desenhar uma curva curta no percurso.
// Nunca substitui a velocidade do golpe: rotacionar a velocidade mudava o
// tempo de voo e o alcance, mesmo preservando o módulo do impulso.
export function calcularCurvaKnockback(vx, vy, body, origem, propriedades = {}) {
  const forca = Math.hypot(vx, vy);
  if (!forca) return { x: 0, y: 0 };
  const direcao = ajustarDirecaoKnockback(vx, vy, body, origem, propriedades);
  const escala = 80 / forca;
  return { x: (direcao.x - vx) * escala, y: (direcao.y - vy) * escala };
}

export function calcularQuiqueChao(base, multiplicadorY, fixo = false) {
  // Quique curto: força base reduzida e crescimento suave, limitado a 35%.
  const crescimento = fixo ? 0 : limitar((multiplicadorY / 0.65 - 1) * 0.07, 0, 0.35);
  return Math.max(0, base ?? 0) * 0.55 * (1 + crescimento);
}
