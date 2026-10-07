import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";
import { encontrarChaoCruzado } from "../../../Objetos/QuiqueImpacto.js";

export default class PinguAdoSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.fase = "preparo";
    this.finalizado = false;
    this.atingiuAlvo = false;
    this.hitbox = null;
    this.registroAtaque = null;
    this.timerQuique = null;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    this.personagem.tocarSomSorteado("pingu-Ado", { volume: this.personagem.sons.volumeVoz });
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    sprite.setVelocity(0, 0);
    this.gravidadeOriginal = sprite.body.allowGravity;
    sprite.body.setAllowGravity(false);
    this.corpoAnterior = this.limitesCorpo();
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    if (sprite.anims.currentFrame) {
      this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
    }
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || this.fase !== "preparo" || animacao?.key !== this.special.animacao) return;
    if (Number(frame?.textureFrame) < this.special.frameInicioMergulho) return;

    this.fase = "mergulho";
    this.personagem.sprite.body.setAllowGravity(true);
    this.personagem.sprite.setVelocity(0, this.special.velocidadeMergulho);
    this.criarHitbox();
  }

  limitesCorpo() {
    const body = this.personagem.sprite.body;
    return { left: body.left, bottom: body.bottom, width: body.width };
  }

  encontrarPouso() {
    const solidas = this.scene.mapaAtual?.plataformas?.getChildren() ?? [];
    const sistema = this.scene.sistemaPlataformasAtravessaveis;
    const ignorarAte = sistema?.jogadores.get(this.personagem)?.ignorarAte ?? 0;
    const atravessaveis = this.scene.time.now >= ignorarAte
      ? sistema?.grupo.getChildren() ?? []
      : [];
    const plataformas = [...solidas, ...atravessaveis]
      .filter((plataforma) => plataforma.active !== false && plataforma.body?.checkCollision?.up !== false)
      .map((plataforma) => plataforma.body);
    return encontrarChaoCruzado(this.corpoAnterior, this.limitesCorpo(), plataformas);
  }

  alinharNoChao(contato) {
    const sprite = this.personagem.sprite;
    const body = sprite.body;
    body.updateFromGameObject();
    sprite.x += contato.left + body.width / 2 - body.center.x;
    sprite.y += contato.top - body.bottom;
    body.updateFromGameObject();
    body.prev.copy(body.position);
    body.prevFrame.copy(body.position);
    body.autoFrame?.copy(body.position);
  }

  criarHitbox() {
    const cfg = this.special.hitbox;
    this.hitbox = this.scene.add.zone(0, 0, cfg.largura, cfg.altura);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.scene.camHUD?.ignore(this.hitbox);
    this.registroAtaque = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.acertar(alvo),
    });
    this.atualizarHitbox();
  }

  atualizarHitbox() {
    if (!this.hitbox?.active || this.fase !== "mergulho") return;
    const sprite = this.personagem.sprite;
    const cfg = this.special.hitbox;
    this.hitbox.setPosition(sprite.x + cfg.offsetX, sprite.y + cfg.offsetY);
    this.hitbox.body.updateFromGameObject();
  }

  acertar(alvo) {
    if (this.finalizado || this.fase !== "mergulho" || this.atingiuAlvo) return;
    this.atingiuAlvo = true;
    alvo.receberDano(this.special.propriedades.dano, this.special.propriedades, {
      x: this.personagem.sprite.x,
      direcao: this.direcao,
      atacante: this.personagem,
    });
    this.iniciarQuique();
  }

  iniciarQuique(contato = null) {
    if (this.fase !== "mergulho") return;
    const sprite = this.personagem.sprite;
    if (contato) this.alinharNoChao(contato);
    this.fase = "quique";
    this.destruirHitbox();
    sprite.body.setAllowGravity(true);
    sprite.setVelocity(0, -this.special.impulsoQuique);
    this.timerQuique = this.scene.time.delayedCall(
      this.special.duracaoQuique,
      () => this.finalizar(),
    );
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }

    const sprite = this.personagem.sprite;
    if (this.fase === "mergulho") {
      const contato = this.encontrarPouso();
      if (contato) {
        this.alinharNoChao(contato);
        this.iniciarQuique();
      } else if (sprite.body.blocked.down) {
        this.iniciarQuique();
      } else {
        sprite.setVelocity(0, this.special.velocidadeMergulho);
        this.atualizarHitbox();
      }
    }
    this.corpoAnterior = this.limitesCorpo();
  }

  aoCompletarAnimacao(animacao) {
    if (this.finalizado || animacao.key !== this.special.animacao || this.fase === "quique") return;
    const sprite = this.personagem.sprite;
    sprite.play(this.special.animacaoLoop, true);
  }

  destruirHitbox() {
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.timerQuique?.remove(false);
    this.timerQuique = null;
    this.destruirHitbox();
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.aoAtualizarAnimacao);
    sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    sprite.off(`animationcomplete-${this.special.animacaoLoop}`, this.aoCompletarAnimacao);
    sprite.body.setAllowGravity(this.gravidadeOriginal);
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
    this.removerDaListaAtiva();
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.timerQuique?.remove(false);
    this.timerQuique = null;
    this.destruirHitbox();
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.aoAtualizarAnimacao);
    sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    sprite.off(`animationcomplete-${this.special.animacaoLoop}`, this.aoCompletarAnimacao);
    if (sprite.body) sprite.body.setAllowGravity(this.gravidadeOriginal);
    this.removerDaListaAtiva();
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}

PinguAdoSpecial.configuracao = {
  animacao: "pingu_AdoSpecial",
  animacaoLoop: "pingu_AdoSpecial_loop",
  logica: PinguAdoSpecial,
  frameInicioMergulho: 3,
  velocidadeMergulho: 1000,
  impulsoQuique: 350,
  duracaoQuique: 300,
  cooldown: 1500,
  propriedades: {
    dano: 15,
    tipoSomImpacto: "heavy",
    knockbackX: 234,
    knockbackY: 325,
    tumbling: true,
    travarMovimentoAir: true,
  },
  hitbox: {
    largura: 52,
    altura: 48,
    offsetX: -10,
    offsetY: -28,
  },
};
