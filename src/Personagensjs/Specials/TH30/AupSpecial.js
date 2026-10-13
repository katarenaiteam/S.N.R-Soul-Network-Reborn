import {
  destruirColisor,
  registrarAtaqueEspecial,
} from "../../../Objetos/SistemaCombateEspecial.js";
import { conduzirAlvoShoryuken } from "../Ken/shoryuken.js";

const FRAMES_DOS_HITS = [1, 3, 5, 7];
const FRAME_IMPULSO = 1;
const VELOCIDADE_PROJETIL = 190;
const DANO_PROJETIL = {
  tipoSomImpacto: "light",
  dano: 2,
  knockbackX: 90,
  knockbackY: -100,
  tumbling: false,
};
const DANO_HITS_INICIAIS = {
  tipoSomImpacto: "light",
  dano: 2,
  knockbackX: 35,
  knockbackY: -90,
  tumbling: false,
};

export default class TH30AupSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.finalizado = false;
    this.impulsoAplicado = false;
    this.indiceHitAtivo = -1;
    this.hitbox = null;
    this.registroHitbox = null;
    this.ultimoHitPorAlvo = new Map();
    this.alvosCarregados = new Set();
    this.projeteis = new Set();
    this.projeteisCriados = false;
    this.alvoParaProjeteis = null;
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    if (!sprite?.active || !sprite.body) return;
    sprite.setVelocity(0, 0);
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once("animationcomplete-th_AdoSpecial", this.aoCompletarAnimacao);
    this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || animacao?.key !== this.special.animacao || !frame) return;
    const quadro = Number(frame.index);
    if (!this.impulsoAplicado && Number(frame.textureFrame) >= FRAME_IMPULSO) {
      this.impulsoAplicado = true;
      const direcao = this.personagem.sprite.flipX ? -1 : 1;
      this.personagem.sprite.setVelocity(150 * direcao, -720);
    }

    this.indiceHitAtivo = FRAMES_DOS_HITS.reduce(
      (indice, quadroHit, i) => quadro >= quadroHit ? i : indice,
      -1,
    );
    if (quadro >= FRAMES_DOS_HITS[0] && quadro <= FRAMES_DOS_HITS.at(-1)) {
      this.criarHitbox();
    } else {
      this.destruirHitbox();
    }
  }

  criarHitbox() {
    if (this.hitbox) return;
    const sprite = this.personagem.sprite;
    const cfg = this.special.hitbox;
    this.hitbox = this.scene.add.zone(sprite.x, sprite.y, cfg.largura, cfg.altura);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.scene.camHUD?.ignore(this.hitbox);
    this.registroHitbox = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.atingirAlvo(alvo),
    });
    this.atualizarPosicaoHitbox();
  }

  atualizarPosicaoHitbox() {
    if (!this.hitbox?.active) return;
    const sprite = this.personagem.sprite;
    const cfg = this.special.hitbox;
    const direcao = sprite.flipX ? -1 : 1;
    this.hitbox.setPosition(
      sprite.x + cfg.offsetX * direcao,
      sprite.y + cfg.offsetY,
    );
    this.hitbox.body.updateFromGameObject();
  }

  atingirAlvo(alvo) {
    if (this.finalizado || this.indiceHitAtivo < 0) return;
    const ultimoHit = this.ultimoHitPorAlvo.get(alvo) ?? -1;
    if (ultimoHit >= this.indiceHitAtivo) return;
    this.ultimoHitPorAlvo.set(alvo, this.indiceHitAtivo);

    const ultimoGolpe = this.indiceHitAtivo === FRAMES_DOS_HITS.length - 1;
    const propriedades = ultimoGolpe ? this.special.propriedades : DANO_HITS_INICIAIS;
    alvo.receberDano(propriedades.dano, propriedades, {
      direcao: this.personagem.sprite.flipX ? -1 : 1,
      x: this.personagem.sprite.x,
      atacante: this.personagem,
    });
    if (ultimoGolpe) this.alvosCarregados.delete(alvo);
    else this.alvosCarregados.add(alvo);

    this.alvoParaProjeteis ??= alvo;
  }

  criarProjeteis(alvo) {
    const sprite = this.personagem.sprite;
    for (const deslocamentoX of [-55, 55]) {
      const projetil = this.scene.physics.add.sprite(
        sprite.x + deslocamentoX,
        sprite.y - 65,
        "th_proj",
        0,
      );
      projetil
        .setScale(0.75)
        .setDepth(sprite.depth + 1);
      projetil.body.setAllowGravity(false);
      projetil.body.setSize(34, 34, false);
      projetil.body.setOffset(0, 44);
      projetil.anims.play("th_proj_voo");
      this.scene.camHUD?.ignore(projetil);

      const registro = { projetil, alvo, ataque: null, colisor: null, timer: null };
      registro.ataque = registrarAtaqueEspecial(this, projetil, {
        categoria: "projetil",
        aoColidir: () => this.removerProjetil(registro),
        aoAtingirAlvo: (alvoAtingido) => this.atingirComProjetil(registro, alvoAtingido),
      });
      const plataformas = this.scene.mapaAtual?.plataformas || this.scene.plataformas || this.scene.chao;
      if (plataformas) {
        registro.colisor = this.scene.physics.add.collider(
          projetil,
          plataformas,
          () => this.removerProjetil(registro),
        );
      }
      registro.timer = this.scene.time.delayedCall(6000, () => this.removerProjetil(registro));
      projetil.once("destroy", () => this.removerProjetil(registro, true));
      this.projeteis.add(registro);
    }
  }

  atualizar() {
    for (const registro of [...this.projeteis]) this.atualizarProjetil(registro);
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }
    this.alvosCarregados.forEach((alvo) => {
      if (!alvo?.sprite?.active || !alvo.sprite.body) {
        this.alvosCarregados.delete(alvo);
        return;
      }
      conduzirAlvoShoryuken(
        this.personagem.sprite,
        alvo.sprite,
        this.personagem.sprite.flipX ? -1 : 1,
      );
    });
    this.atualizarPosicaoHitbox();
  }

  atualizarProjetil(registro) {
    const projetil = registro.projetil;
    if (!projetil?.active || !projetil.body) {
      this.removerProjetil(registro);
      return;
    }
    const bodyAlvo = registro.alvo?.sprite?.body;
    if (!registro.alvo?.sprite?.active || !bodyAlvo) return;
    const dx = bodyAlvo.center.x - projetil.body.center.x;
    const dy = bodyAlvo.center.y - projetil.body.center.y;
    const distancia = Math.hypot(dx, dy) || 1;
    projetil.body.setVelocity(
      dx / distancia * VELOCIDADE_PROJETIL,
      dy / distancia * VELOCIDADE_PROJETIL,
    );
    projetil.setFlipX(dx < 0);
  }

  atingirComProjetil(registro, alvo) {
    if (!registro.projetil?.active) return;
    const direcao = registro.projetil.body.velocity.x < 0 ? -1 : 1;
    alvo.receberDano(DANO_PROJETIL.dano, DANO_PROJETIL, {
      x: registro.projetil.x,
      direcao,
      atacante: this.personagem,
    });
    this.removerProjetil(registro);
  }

  removerProjetil(registro, jaDestruido = false) {
    if (!this.projeteis.delete(registro)) return;
    const projetil = registro?.projetil;
    registro.projetil = null;
    destruirColisor(registro.colisor);
    registro.timer?.remove(false);
    registro.ataque?.remover();
    if (!jaDestruido && projetil?.active) projetil.destroy();
    this.removerDaListaSeVazio();
  }

  destruirHitbox() {
    this.registroHitbox?.remover();
    this.registroHitbox = null;
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  aoCompletarAnimacao() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.destruirHitbox();
    if (this.alvoParaProjeteis && !this.projeteisCriados) {
      this.projeteisCriados = true;
      this.criarProjeteis(this.alvoParaProjeteis);
    }
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
    this.removerDaListaSeVazio();
  }

  cancelar() {
    if (!this.finalizado) this.finalizado = true;
    const sprite = this.personagem.sprite;
    sprite?.off("animationupdate", this.aoAtualizarAnimacao);
    sprite?.off("animationcomplete-th_AdoSpecial", this.aoCompletarAnimacao);
    this.destruirHitbox();
    this.alvosCarregados.clear();
    this.removerDaListaSeVazio();
  }

  removerDaListaSeVazio() {
    if (this.projeteis.size > 0) return;
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}
