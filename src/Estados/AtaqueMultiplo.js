// Agenda pulsos de hitbox; colisao, dano e cancelamentos continuam no EstadoAtack.
export default class AtaqueMultiplo {
  constructor(estado, config) {
    this.estado = estado;
    this.config = config;
    this.hits = config.hits ?? [];
    this.comboRapido = config.tipo === "comboRapido";
    this.total = this.comboRapido && this.hits.length
      ? (config.maxHits ?? this.hits.length) : this.hits.length;
    this.periodo = Math.max(config.duracaoCiclo ?? 0,
      ...this.hits.map(hit => hit.inicio + hit.duracao));
    this.indice = 0;
    this.atraso = 0;
    this.ativo = false;
    this.ultimoInput = estado.tempoInicio;
  }

  get concluido() {
    return this.indice >= this.total && !this.ativo &&
      this.estado.personagem.scene.time.now >= (this.fimAnimacao ?? 0);
  }

  atualizar(agora) {
    const estado = this.estado;
    if (this.comboRapido && estado.personagem.inputJustDown("atack")) {
      this.ultimoInput = agora;
    }
    if (this.ativo && agora >= this.fimHit) {
      estado.destruirHitbox();
      this.ativo = false;
    }
    // Entre pulsos, deixa a animacao individual terminar antes de trocar.
    if (!this.ativo && !this.animacaoIniciada && agora < (this.fimAnimacao ?? 0)) return false;
    // So chama o finalizador ao completar o limite de hits.
    if (this.comboRapido && !this.ativo && !this.animacaoIniciada && (this.concluido ||
      (this.indice > 0 && agora - this.ultimoInput >= (this.config.intervaloInput ?? 250)))) {
      if (this.concluido) estado.avancarCombo();
      else estado.finalizarAtaque();
      return true;
    }
    if (!this.ativo && !this.concluido) {
      const hit = this.hits[this.indice % this.hits.length];
      const ciclo = Math.floor(this.indice / this.hits.length);
      let inicio = estado.tempoInicio + ciclo * this.periodo + hit.inicio + this.atraso;
      if (hit.animacao && !this.animacaoIniciada && agora >= inicio - (hit.antecipacao ?? 0)) {
        const atraso = agora - (inicio - (hit.antecipacao ?? 0));
        this.atraso += atraso;
        inicio += atraso;
        const personagem = estado.personagem;
        personagem.sprite.anims.play(hit.animacao);
        personagem.aplicarConfiguracao(hit.animacao.replace(personagem.prefixoAnim, ""));
        this.fimAnimacao = agora + personagem.sprite.anims.currentAnim.duration;
        this.animacaoIniciada = true;
      }
      if (agora >= inicio) {
        // Em FPS baixo, preserva cada pulso sem acumular danos num frame.
        this.atraso += agora - inicio;
        this.fimHit = agora + hit.duracao;
        this.indice++;
        this.ativo = true;
        this.animacaoIniciada = false;
        estado.criarHitbox({
          ...estado.golpeAtual,
          ...hit,
          propriedades: { ...estado.golpeAtual.propriedades, ...hit.propriedades },
        });
      }
    }
    return false;
  }
}
