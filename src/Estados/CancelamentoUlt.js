export function tentarCancelarEmUlt(estado, acertou) {
  const p = estado.personagem;
  if (!p.inputDown("atack") || !p.inputDown("special")) {
    estado.intentCancelUlt = false;
    return false;
  }
  const ult = p.maquinaEstados.estados.ult;
  if (!p.ult || !ult?.podeEntrar() || (p.podeUsarUlt && !p.podeUsarUlt())) return false;
  if (p.inputJustDown("atack") || p.inputJustDown("special")) {
    estado.intentCancelUlt = true;
    estado.intentCancel = true;
  }
  if (!acertou || !estado.intentCancelUlt) return false;
  return p.maquinaEstados.mudarEstado("ult") === true;
}
