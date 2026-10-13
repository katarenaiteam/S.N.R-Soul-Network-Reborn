import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

const VELOCIDADE_SUBTERRANEA = 480;
const ACELERACAO_SUBTERRANEA = 2400;
const DESACELERACAO_SUBTERRANEA = 3000;
const TEMPO_MAXIMO_SUBTERRANEO = 5000;
const PRIMEIRO_FRAME_ATAQUE = 8;
const ULTIMO_FRAME_ATAQUE = 11;

export default class TH30DoSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.fase = "mergulhando";
    this.finalizado = false;
    this.velocidadeSubterranea = 0;
    this.plataforma = null;
    this.poca = null;
    this.hitbox = null;
    this.registroAtaque = null;
    this.alvosAtingidos = new Set();
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarMergulho = this.aoCompletarMergulho.bind(this);
    this.aoCompletarSaida = this.aoCompletarSaida.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.plataforma = this.obterPlataformaAtual();
    if (!sprite?.active || !sprite.body) return;

    const body = sprite.body;
    this.gravidadeOriginal = body.allowGravity;
    this.offsetBaseCorpo = body.bottom - sprite.y;
    this.offsetCentroCorpoX = body.center.x - sprite.x;
    this.larguraCorpo = body.width;
    this.superficieY = this.plataforma?.body.top ?? body.bottom;
    this.limiteEsquerdo = this.plataforma?.body.left ?? 0;
    this.limiteDireito = this.plataforma?.body.right ?? this.scene.scale.width;
    body.setAllowGravity(false);
    sprite.setVelocity(0, 0);
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once("animationcomplete-th_dive", this.aoCompletarMergulho);
  }

  obterPlataformaAtual() {
    const spriteBody = this.personagem.sprite?.body;
    if (!spriteBody) return null;

    const atravessaveis = this.scene.sistemaPlataformasAtravessaveis?.grupo?.getChildren?.() ?? [];
    const grupoPlataformas = this.scene.mapaAtual?.plataformas;
    const plataformasSolidas = grupoPlataformas?.getChildren?.()
      ?? (grupoPlataformas?.body ? [grupoPlataformas] : []);
    const suporteMapa = this.scene.mapaAtual?.suportePlataforma;
    const plataformas = [
      ...plataformasSolidas,
      ...atravessaveis,
      ...(suporteMapa?.body ? [suporteMapa] : []),
    ];
    const candidatas = plataformas
      .filter((plataforma) => plataforma?.active !== false && plataforma.body?.enable !== false)
      .filter((plataforma) => plataforma.body?.checkCollision?.up !== false)
      .filter((plataforma) =>
        spriteBody.right > plataforma.body.left &&
        spriteBody.left < plataforma.body.right,
      );
    return candidatas
      .filter((plataforma) =>
        spriteBody.bottom >= plataforma.body.top - 32 &&
        spriteBody.bottom <= plataforma.body.top + 24,
      )
      .sort((a, b) =>
        Math.abs(spriteBody.bottom - a.body.top) - Math.abs(spriteBody.bottom - b.body.top),
      )[0] ?? null;
  }

  aoCompletarMergulho() {
    if (this.finalizado || this.fase !== "mergulhando") return;
    this.fase = "subterraneo";
    this.inicioSubterraneo = this.scene.time.now;
    const sprite = this.personagem.sprite;
    sprite.setVelocity(0, 0);
    sprite.setVisible(false);
    sprite.body.enable = false;
    this.personagem.configAnimacaoOverride = "getup";
    this.personagem.destruirHurtboxes();
    this.poca = this.scene.add.sprite(sprite.x, this.superficieY + 5, "th_soup")
      .setOrigin(0.5, 1)
      .setDepth(sprite.depth + 1);
    this.scene.physics.add.existing(this.poca);
    this.poca.body.setAllowGravity(false);
    this.poca.body.setImmovable(true);
    this.poca.body.setSize(116, 18);
    this.poca.body.updateFromGameObject();
    this.personagem.grupoHurtbox.add(this.poca);
    this.scene.camHUD?.ignore(this.poca);
    this.poca.play("th_soup_loop");
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || !frame) return;
    const quadro = Number(frame.textureFrame);
    if (animacao?.key !== "th_spike" || this.fase !== "saindo") return;

    if (quadro >= PRIMEIRO_FRAME_ATAQUE && quadro <= ULTIMO_FRAME_ATAQUE) {
      if (!this.hitbox) this.criarHitbox();
    } else if (quadro > ULTIMO_FRAME_ATAQUE) {
      this.destruirHitbox();
    }
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }
    if (this.fase === "saindo") {
      this.personagem.sprite.setVelocityX(0);
      return;
    }
    if (this.fase !== "subterraneo") return;

    const sprite = this.personagem.sprite;
    const agora = this.scene.time.now;
    const delta = Math.min(this.scene.game.loop.delta || 16.667, 50) / 1000;
    const esquerda = this.personagem.inputDown("esquerda");
    const direita = this.personagem.inputDown("direita");
    let direcao = 0;
    if (esquerda !== direita) {
      direcao = esquerda ? -1 : 1;
      sprite.setFlipX(direcao < 0);
    }
    const velocidadeAlvo = direcao * VELOCIDADE_SUBTERRANEA;
    const aceleracao = direcao === 0
      ? DESACELERACAO_SUBTERRANEA
      : ACELERACAO_SUBTERRANEA;
    this.velocidadeSubterranea = Phaser.Math.Clamp(
      velocidadeAlvo,
      this.velocidadeSubterranea - aceleracao * delta,
      this.velocidadeSubterranea + aceleracao * delta,
    );
    const larguraPlataforma = Math.max(0, this.limiteDireito - this.limiteEsquerdo);
    const meiaLarguraCorpo = Math.min(this.larguraCorpo / 2, larguraPlataforma / 2);
    const minimo = this.limiteEsquerdo + meiaLarguraCorpo - this.offsetCentroCorpoX;
    const maximo = this.limiteDireito - meiaLarguraCorpo - this.offsetCentroCorpoX;
    const proximoX = Phaser.Math.Clamp(
      sprite.x + this.velocidadeSubterranea * delta,
      minimo,
      maximo,
    );
    if (
      (proximoX <= minimo && this.velocidadeSubterranea < 0) ||
      (proximoX >= maximo && this.velocidadeSubterranea > 0)
    ) {
      this.velocidadeSubterranea = 0;
    }
    sprite.x = proximoX;
    this.poca?.setX(sprite.x);

    if (
      this.personagem.inputJustDown("special") ||
      agora - this.inicioSubterraneo >= TEMPO_MAXIMO_SUBTERRANEO
    ) {
      this.surgir();
    }
  }

  surgir() {
    if (this.finalizado || this.fase !== "subterraneo") return;
    this.fase = "saindo";
    this.velocidadeSubterranea = 0;
    const sprite = this.personagem.sprite;
    const body = sprite.body;
    this.destruirPoca();
    this.personagem.configAnimacaoOverride = null;
    sprite.setVisible(true);
    body.enable = true;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    sprite.anims.play("th_spike", true);
    this.personagem.aplicarConfiguracao("spike");
    body.updateFromGameObject();
    const offsetBaseSaida = body.bottom - sprite.y;
    sprite.setPosition(sprite.x, this.superficieY - offsetBaseSaida - 1);
    body.updateFromGameObject();
    body.prev.copy(body.position);
    body.prevFrame.copy(body.position);
    body.autoFrame?.copy(body.position);
    body.setAllowGravity(this.gravidadeOriginal);
    this.personagem.sincronizarHurtbox();
    sprite.once("animationcomplete-th_spike", this.aoCompletarSaida);
  }

  criarHitbox() {
    const sprite = this.personagem.sprite;
    const cfg = this.special.hitbox;
    this.hitbox = this.scene.add.zone(
      sprite.x + cfg.offsetX,
      this.superficieY + cfg.offsetY,
      cfg.largura,
      cfg.altura,
    );
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.scene.camHUD?.ignore(this.hitbox);
    this.registroAtaque = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.atingirAlvo(alvo),
    });
  }

  atingirAlvo(alvo) {
    if (this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    alvo.receberDano(this.special.propriedades.dano, this.special.propriedades, {
      direcao: this.personagem.sprite.flipX ? -1 : 1,
      x: this.personagem.sprite.x,
      atacante: this.personagem,
    });
  }

  destruirHitbox() {
    this.registroAtaque?.remover();
    this.registroAtaque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  destruirPoca() {
    if (!this.poca) return;
    this.personagem.grupoHurtbox.remove(this.poca, true, true);
    this.poca = null;
  }

  aoCompletarSaida() {
    this.finalizar();
  }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.limpar(false);
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
    this.removerDaListaAtiva();
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.limpar(true);
    this.removerDaListaAtiva();
  }

  limpar(restaurarSubterraneo) {
    const sprite = this.personagem.sprite;
    sprite?.off("animationupdate", this.aoAtualizarAnimacao);
    sprite?.off("animationcomplete-th_dive", this.aoCompletarMergulho);
    sprite?.off("animationcomplete-th_spike", this.aoCompletarSaida);
    this.destruirHitbox();
    this.destruirPoca();
    if (!sprite?.body) return;

    if (restaurarSubterraneo && this.fase === "subterraneo") {
      sprite.y = this.superficieY - this.offsetBaseCorpo;
    }
    sprite.body.enable = true;
    sprite.body.setAllowGravity(this.gravidadeOriginal);
    sprite.body.setVelocity(0, 0);
    sprite.body.updateFromGameObject();
    sprite.body.prev.copy(sprite.body.position);
    sprite.body.prevFrame.copy(sprite.body.position);
    sprite.body.autoFrame?.copy(sprite.body.position);
    sprite.setVisible(true);
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}
