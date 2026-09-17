import DoSpecial from "./DoSpecial.js";
import { encontrarChaoCruzado } from "../../../Objetos/QuiqueImpacto.js";

const VELOCIDADE_X = 460;
const VELOCIDADE_Y = 720;
const DURACAO_EXPLOSAO = 180;

export default class AdoSpecial extends DoSpecial {
  executar() {
    this.fase = "preparo";
    this.gravidadeOriginal = this.personagem.sprite.body.allowGravity;
    this.personagem.sprite.body.setAllowGravity(false);
    this.personagem.sprite.setVelocityY(0);
    super.executar();
    this.corpoAnterior = this.limitesCorpo();
    this.aoFimGround = () => this.finalizar();
    this.personagem.sprite.once("animationcomplete-fj_ground", this.aoFimGround);
  }

  aoAtualizarAnimacao(anim, frame) {
    if (this.finalizado || anim?.key !== this.special.animacao) return;
    if (Number(frame.textureFrame) >= 2 && this.fase === "preparo") {
      this.fase = "mergulho";
      this.criarHitbox();
    }
  }

  // A animacao termina, mas a pose de mergulho permanece ate a aterrissagem.
  aoCompletarAnimacao() {}

  limitesCorpo() {
    const body = this.personagem.sprite.body;
    return { left: body.left, bottom: body.bottom, width: body.width };
  }

  alinharPouso(centroX, baseY) {
    const sprite = this.personagem.sprite;
    const body = sprite.body;
    body.updateFromGameObject();
    sprite.x += centroX - body.center.x;
    sprite.y += baseY - body.bottom;
    body.updateFromGameObject();
    // Evita reaplicar no postUpdate o deslocamento que ja foi aplicado a sprite.
    body.prev.copy(body.position);
    body.prevFrame.copy(body.position);
    body.autoFrame?.copy(body.position);
    body.setVelocity(0, 0);
  }

  encontrarPouso() {
    const solidas = this.scene.mapaAtual?.plataformas?.getChildren() ?? [];
    const sistema = this.scene.sistemaPlataformasAtravessaveis;
    const ignorarAte = sistema?.jogadores.get(this.personagem)?.ignorarAte ?? 0;
    const atravessaveis = this.scene.time.now >= ignorarAte ? sistema?.grupo.getChildren() ?? [] : [];
    return encontrarChaoCruzado(this.corpoAnterior, this.limitesCorpo(),
      [...solidas, ...atravessaveis].filter(p => p.active !== false && p.body?.checkCollision?.up !== false).map(p => p.body));
  }

  atualizar() {
    if (this.finalizado) return;
    const sprite = this.personagem.sprite;
    if (!sprite?.active || this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }
    const contato = this.fase === "mergulho" ? this.encontrarPouso() : null;
    if (contato) {
      this.alinharPouso(contato.left + sprite.body.width / 2, contato.top);
      this.pousar();
    } else if (this.fase !== "ground" && sprite.body.blocked.down) {
      this.pousar();
    } else if (this.fase === "mergulho") {
      sprite.setVelocity(VELOCIDADE_X * this.direcao, VELOCIDADE_Y);
    }
    if (this.fase === "ground" && this.scene.time.now - this.inicioExplosao >= DURACAO_EXPLOSAO) {
      this.destruirHitbox();
    }
    this.atualizarHitbox();
    this.corpoAnterior = this.limitesCorpo();
  }

  pousar() {
    this.personagem.tocarSomSorteado("ground", { volume: 0.8 });
    const sprite = this.personagem.sprite;
    this.impacto = { x: sprite.body.center.x, y: sprite.body.bottom };
    this.fase = "ground";
    sprite.setVelocity(0, 0);
    sprite.body.setAllowGravity(this.gravidadeOriginal);
    this.destruirHitbox();
    this.alvosAtingidos.clear();
    this.personagem.tocarAnimacao("ground", true);
    // A nova pose tem outra caixa: mantem a base no topo onde houve o impacto.
    this.alinharPouso(this.impacto.x, this.impacto.y);
    sprite.body.blocked.down = true;
    this.personagem.sincronizarHurtbox();
    this.inicioExplosao = this.scene.time.now;
    this.criarHitbox();
    this.efeito = this.scene.add.sprite(this.impacto.x, this.impacto.y + 28, "ground_effect")
      .setOrigin(0.5, 0.75).setScale(0.4, 0.3).setBlendMode("ADD")
      .setDepth(Math.max(1000, sprite.depth + 1));
    this.scene.camHUD?.ignore(this.efeito);
    this.efeito.play("fj_ground_effect");
    this.efeito.once("animationcomplete", () => {
      this.efeito?.destroy();
      this.efeito = null;
    });
  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const sprite = this.personagem.sprite;
    const ground = this.fase === "ground";
    this.hitbox.setSize(ground ? 140 : 60, ground ? 40 : 55);
    this.hitbox.body.setSize(this.hitbox.width, this.hitbox.height);
    this.hitbox.setPosition(ground ? this.impacto.x : sprite.x + 38 * this.direcao,
      ground ? this.impacto.y - 20 : sprite.y - 30);
    this.hitbox.body.updateFromGameObject();
  }

  acertar(alvo) {
    if (this.finalizado || !this.hitbox?.active || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    const ground = this.fase === "ground";
    const direcao = ground ? (alvo.sprite.x < this.impacto.x ? -1 : 1) : this.direcao;
    const dano = ground ? 10 : 14;
    this.personagem.vfx?.tocarListaImpacto(
      [{ escolherUm: ["punch1", "punch2", "punch3"] }], alvo, this.hitbox,
    );
    const somImpacto = this.personagem.sons?.heavy;
    if (somImpacto) this.personagem.tocarSomSorteado(somImpacto, { volume: 0.15 });
    alvo.receberDano(dano, {
      dano, tipoSomImpacto: "heavy", tumbling: true,
      knockbackX: ground ? 360 : 180,
      knockbackY: ground ? -300 : 180,
    }, { direcao, x: ground ? this.impacto.x : this.personagem.sprite.x });
  }

  finalizar() {
    if (this.finalizado) return;
    // O efeito termina sua animacao mesmo depois da recuperacao do personagem.
    const efeito = this.efeito;
    this.efeito = null;
    if (efeito?.active) efeito.once("animationcomplete", () => efeito.destroy());
    this.cancelar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) this.estado.finalizarSpecial();
  }

  cancelar() {
    if (this.finalizado) return;
    const sprite = this.personagem.sprite;
    sprite.off("animationcomplete-fj_ground", this.aoFimGround);
    if (sprite.body) sprite.body.setAllowGravity(this.gravidadeOriginal);
    this.efeito?.destroy();
    this.efeito = null;
    super.cancelar();
  }
}
