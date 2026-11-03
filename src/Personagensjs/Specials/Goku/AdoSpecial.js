import { encontrarChaoCruzado } from "../../../Objetos/QuiqueImpacto.js";
import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class GokuAdoSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = 1;
    this.fase = "preparo";
    this.finalizado = false;
    this.hitbox = null;
    this.registroAtaque = null;
    this.alvosAtingidos = new Set();
    this.alvoCarregado = null;
    this.gravidadeOriginal = true;
    this.corpoAnterior = null;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    this.gravidadeOriginal = sprite.body.allowGravity;
    sprite.body.setAllowGravity(false);
    sprite.setVelocity(0, 0);
    this.corpoAnterior = this.limitesCorpo();
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || animacao?.key !== this.special.animacao || !frame) return;
    if (this.fase === "preparo" && Number(frame.textureFrame) >= this.special.frameInicioMergulho) {
      this.fase = "mergulho";
      this.personagem.sprite.setVelocity(
        this.special.velocidadeMergulhoX * this.direcao,
        this.special.velocidadeMergulhoY,
      );
      this.criarHitbox();
    }
  }

  aoCompletarAnimacao() {
    if (this.finalizado || this.fase !== "mergulho") return;
    this.personagem.sprite.anims.pause();
  }

  limitesCorpo() {
    const body = this.personagem.sprite.body;
    return { left: body.left, bottom: body.bottom, width: body.width };
  }

  obterContatoChao() {
    const plataformasSolidas = this.scene.mapaAtual?.plataformas?.getChildren?.() ?? [];
    const sistema = this.scene.sistemaPlataformasAtravessaveis;
    const ignorarAte = sistema?.jogadores.get(this.personagem)?.ignorarAte ?? 0;
    const plataformasAtravessaveis = this.scene.time.now >= ignorarAte
      ? sistema?.grupo.getChildren?.() ?? []
      : [];
    const plataformas = [...plataformasSolidas, ...plataformasAtravessaveis]
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
    if (this.hitbox) return;
    const cfg = this.special.hitbox;
    this.hitbox = this.scene.add.zone(0, 0, cfg.largura, cfg.altura);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.registroAtaque = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.acertar(alvo),
    });
    this.atualizarHitbox();
  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const cfg = this.special.hitbox;
    this.hitbox.setPosition(
      this.personagem.sprite.x + cfg.offsetX * this.direcao,
      this.personagem.sprite.y + cfg.offsetY,
    );
    this.hitbox.body.updateFromGameObject();
  }

  acertar(alvo) {
    if (this.finalizado || this.alvosAtingidos.has(alvo) || alvo.invulneravel) return;
    if (this.alvoCarregado && this.alvoCarregado.alvo !== alvo) return;
    this.alvosAtingidos.add(alvo);
    alvo.receberDano(this.special.propriedades.dano, this.special.propriedades, {
      x: this.personagem.sprite.x,
      direcao: this.direcao,
      atacante: this.personagem,
    });

    if (alvo.sprite?.body && !alvo.sprite.body.blocked.down) {
      this.prenderAlvo(alvo);
    }
  }

  prenderAlvo(alvo) {
    const sprite = alvo.sprite;
    const body = sprite.body;
    this.alvoCarregado = {
      alvo,
      moves: body.moves,
      gravidade: body.allowGravity,
      velocidadeX: body.velocity.x,
      animacaoPausada: sprite.anims.isPaused,
      atualizarEstado: alvo.maquinaEstados?.update,
    };
    body.moves = false;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    sprite.anims.pause();
    if (alvo.maquinaEstados) alvo.maquinaEstados.update = () => {};
    if (!this.posicionarAlvoCarregado()) this.encerrarNaParede();
  }

  posicionarAlvoCarregado() {
    const carregado = this.alvoCarregado;
    if (!carregado?.alvo.sprite?.active) return;
    const spriteGoku = this.personagem.sprite;
    const spriteAlvo = carregado.alvo.sprite;
    const destinoX = spriteGoku.x + this.special.offsetAlvoX * this.direcao;
    const destinoY = spriteGoku.y - this.special.offsetAlvoY;
    if (!this.caminhoAlvoLivre(spriteAlvo, destinoX, destinoY)) return false;
    spriteAlvo.setPosition(destinoX, destinoY);
    spriteAlvo.body.updateFromGameObject();
    carregado.alvo.sincronizarHurtbox?.();
    return true;
  }

  caminhoAlvoLivre(spriteAlvo, destinoX, destinoY) {
    const body = spriteAlvo.body;
    const deslocamentoX = destinoX - spriteAlvo.x;
    const deslocamentoY = destinoY - spriteAlvo.y;
    const distancia = Math.max(Math.abs(deslocamentoX), Math.abs(deslocamentoY));
    const passos = Math.max(1, Math.ceil(distancia / 8));
    const solidas = [
      this.scene.mapaAtual?.plataformas,
      this.scene.plataformas,
      this.scene.chao,
    ].filter((grupo, indice, grupos) => grupo && grupos.indexOf(grupo) === indice)
      .flatMap((grupo) => grupo.getChildren?.() ?? [])
      .filter((objeto) => objeto.active !== false && objeto.body?.enable)
      .map((objeto) => new Phaser.Geom.Rectangle(
        objeto.body.left,
        objeto.body.top,
        objeto.body.width,
        objeto.body.height,
      ));

    for (let passo = 1; passo <= passos; passo += 1) {
      const fracao = passo / passos;
      const caixa = new Phaser.Geom.Rectangle(
        body.left + deslocamentoX * fracao,
        body.top + deslocamentoY * fracao,
        body.width,
        body.height,
      );
      if (solidas.some((solida) => Phaser.Geom.Intersects.RectangleToRectangle(caixa, solida))) {
        return false;
      }
    }
    return true;
  }

  encerrarNaParede() {
    if (this.finalizado) return;
    this.personagem.sprite.setVelocity(0, 0);
    this.cancelar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
  }

  liberarAlvo(pousou = false) {
    const carregado = this.alvoCarregado;
    if (!carregado) return;
    this.alvoCarregado = null;
    const { alvo } = carregado;
    const spriteGoku = this.personagem.sprite;
    const spriteAlvo = alvo?.sprite;
    const body = spriteAlvo?.body;
    if (!body) return;

    if (pousou) {
      spriteAlvo.x = spriteGoku.x + this.special.offsetAlvoX * this.direcao;
      body.updateFromGameObject();
      spriteAlvo.y += spriteGoku.body.bottom - body.bottom;
      body.updateFromGameObject();
    }
    body.moves = carregado.moves;
    body.setAllowGravity(carregado.gravidade);
    body.setVelocity(pousou ? carregado.velocidadeX : 0, 0);
    if (pousou) {
      body.blocked.down = true;
      body.touching.down = true;
    }
    if (!carregado.animacaoPausada) spriteAlvo.anims.resume();
    if (alvo.maquinaEstados) alvo.maquinaEstados.update = carregado.atualizarEstado;
    alvo.sincronizarHurtbox?.();
  }

  atualizar() {
    if (this.finalizado) return;
    const sprite = this.personagem.sprite;
    if (!sprite?.active || this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }

    if (this.fase === "mergulho") {
      const contato = this.obterContatoChao();
      if (contato) {
        this.alinharNoChao(contato);
        this.pousar();
        return;
      }
      if (sprite.body.blocked.down) {
        this.pousar();
        return;
      }
      sprite.setVelocity(
        this.special.velocidadeMergulhoX * this.direcao,
        this.special.velocidadeMergulhoY,
      );
      if (!this.posicionarAlvoCarregado()) {
        this.encerrarNaParede();
        return;
      }
      this.atualizarHitbox();
    }
    this.corpoAnterior = this.limitesCorpo();
  }

  pousar() {
    const sprite = this.personagem.sprite;
    sprite.setVelocity(0, 0);
    sprite.body.setAllowGravity(this.gravidadeOriginal);
    sprite.body.blocked.down = true;
    sprite.body.touching.down = true;
    this.liberarAlvo(true);
    this.cancelar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
  }

  destruirHitbox() {
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizado = true;
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.aoAtualizarAnimacao);
    sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    sprite.body?.setAllowGravity(this.gravidadeOriginal);
    this.liberarAlvo();
    this.destruirHitbox();
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}

GokuAdoSpecial.configuracao = {
  animacao: "gk_AdoSpecial",
  configuracaoAnimacao: "AdoSpecial",
  logica: GokuAdoSpecial,
  propriedades: {
    travarMovimentoAir: true,
    tipoSomImpacto: "heavy",
    dano: 20,
    knockbackX: 240,
    knockbackY: 320,
    tumbling: true,
  },
  frameInicioMergulho: 2,
  velocidadeMergulhoX: 180,
  velocidadeMergulhoY: 760,
  offsetAlvoX: 18,
  offsetAlvoY: 70,
  hitbox: {
    largura: 76,
    altura: 58,
    offsetX: 24,
    offsetY: -36,
  },
};
