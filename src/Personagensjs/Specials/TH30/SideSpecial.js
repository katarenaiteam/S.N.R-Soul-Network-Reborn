import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

const FRAMES_DOS_GOLPES = [3, 6, 10, 14, 21];
const VELOCIDADE_MAXIMA_AVANCO = 550;
const ACELERACAO_AVANCO = 7000;
const DESACELERACAO_AVANCO = 1800;
const PROPRIEDADES_GOLPES_INICIAIS = {
  tipoSomImpacto: "light",
  dano: 2,
  knockbackX: 45,
  knockbackY: -110,
  knockbackFixo: true,
  tumbling: false,
};
const PROPRIEDADES_GOLPE_ASCENDENTE = {
  tipoSomImpacto: "heavy",
  dano: 3,
  knockbackX: 45,
  knockbackY: -300,
  knockbackFixo: true,
  tumbling: false,
};

export default class TH30SideSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = 1;
    this.frameAtual = -1;
    this.indiceHitAtivo = -1;
    this.hitConfirmado = false;
    this.distanciaAvancoPendente = 0;
    this.posicaoXAnterior = null;
    this.velocidadeAvanco = 0;
    this.finalizado = false;
    this.hitbox = null;
    this.ataque = null;
    this.hitboxAtual = null;
    this.alvosCarregados = new Set();
    this.ultimoHitPorAlvo = new Map();
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    if (!sprite?.active || !sprite.body) return;
    this.direcao = sprite.flipX ? -1 : 1;
    this.posicaoXAnterior = sprite.x;
    this.velocidadeAvanco = 0;
    sprite.setVelocityX(0);
    this.iniciarAvanco(20 * (this.special.multiplicadorAvanco ?? 1));
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || animacao?.key !== this.special.animacao || !frame) return;
    this.frameAtual = Number(frame.textureFrame);
    this.indiceHitAtivo = FRAMES_DOS_GOLPES.indexOf(this.frameAtual);
    if (this.indiceHitAtivo >= 3 && !this.hitConfirmado) this.indiceHitAtivo = -1;
    const avancosPorGolpe = { 3: 32, 6: 35, 10: 38, 14: 48 };
    if (avancosPorGolpe[this.frameAtual]) {
      this.iniciarAvanco(
        avancosPorGolpe[this.frameAtual] * (this.special.multiplicadorAvanco ?? 1),
      );
    }

    if (this.frameAtual > 10 && !this.hitConfirmado) {
      this.finalizar();
      return;
    }
    if (this.frameAtual > 21) {
      this.finalizar();
      return;
    }
    const hitbox = this.indiceHitAtivo >= 0
      ? this.special.hitboxes?.[this.frameAtual]
      : null;
    if (hitbox) {
      this.criarHitbox(hitbox);
    }
    else this.destruirHitbox();
  }

  iniciarAvanco(distancia) {
    this.distanciaAvancoPendente += distancia;
  }

  criarHitbox(configuracao) {
    this.destruirHitbox();
    this.hitboxAtual = configuracao;
    this.hitbox = this.scene.add.zone(0, 0, configuracao.largura, configuracao.altura);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.ataque = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.processarAcerto(alvo),
    });
    this.atualizarPosicaoHitbox();
  }

  processarAcerto(alvo) {
    if (this.finalizado || this.indiceHitAtivo < 0) return;
    const ultimoHit = this.ultimoHitPorAlvo.get(alvo) ?? -1;
    if (ultimoHit >= this.indiceHitAtivo) return;
    this.ultimoHitPorAlvo.set(alvo, this.indiceHitAtivo);

    const ehUltimoGolpe = this.indiceHitAtivo === FRAMES_DOS_GOLPES.length - 1;
    const ehGolpeAscendente = this.indiceHitAtivo === 3;
    const propriedades = ehUltimoGolpe
      ? { ...this.special.propriedades, knockbackFixo: false }
      : ehGolpeAscendente
        ? PROPRIEDADES_GOLPE_ASCENDENTE
        : PROPRIEDADES_GOLPES_INICIAIS;
    if (ehUltimoGolpe) this.alvosCarregados.delete(alvo);
    else {
      this.hitConfirmado = true;
      this.alvosCarregados.add(alvo);
    }
    if (ehGolpeAscendente) {
      this.hitConfirmado = true;
    }

    alvo.receberDano(propriedades.dano, propriedades, {
      direcao: this.direcao,
      x: this.personagem.sprite.x,
    });
    if (!ehUltimoGolpe && alvo.sprite?.body) {
      alvo.sprite.body.setVelocityX(this.personagem.sprite.body.velocity.x);
    }
  }

  atualizarPosicaoHitbox() {
    if (!this.hitbox?.active || !this.hitboxAtual) return;
    this.hitbox.setPosition(
      this.personagem.sprite.x + this.hitboxAtual.offsetX * this.direcao,
      this.personagem.sprite.y + this.hitboxAtual.offsetY,
    );
    this.hitbox.body?.updateFromGameObject();
  }

  atualizarAlvosCarregados() {
    const sprite = this.personagem.sprite;
    const velocidade = sprite.body.velocity.x;
    this.alvosCarregados.forEach((alvo) => {
      const body = alvo?.sprite?.body;
      if (!alvo?.sprite?.active || !body) {
        this.alvosCarregados.delete(alvo);
        return;
      }
      const distancia = sprite.x + 24 * this.direcao - alvo.sprite.x;
      body.setVelocityX(velocidade + Phaser.Math.Clamp(distancia * 10, -180, 180));
    });
  }

  atualizar() {
    const sprite = this.personagem.sprite;
    const body = sprite?.body;
    if (this.finalizado || !sprite?.active || !body) return;
    if (this.frameAtual >= 21) this.distanciaAvancoPendente = 0;
    const delta = Math.min(this.scene.game.loop.delta || 16.667, 50) / 1000;
    if (this.posicaoXAnterior !== null) {
      this.distanciaAvancoPendente = Math.max(
        0,
        this.distanciaAvancoPendente - Math.abs(sprite.x - this.posicaoXAnterior),
      );
    }
    this.posicaoXAnterior = sprite.x;
    const velocidadeDesejada = this.distanciaAvancoPendente > 0
      ? Math.min(VELOCIDADE_MAXIMA_AVANCO, Math.sqrt(2 * ACELERACAO_AVANCO * this.distanciaAvancoPendente))
      : 0;
    if (this.velocidadeAvanco < velocidadeDesejada) {
      this.velocidadeAvanco = Math.min(
        velocidadeDesejada,
        this.velocidadeAvanco + ACELERACAO_AVANCO * delta,
      );
    } else {
      this.velocidadeAvanco = Math.max(
        velocidadeDesejada,
        this.velocidadeAvanco - DESACELERACAO_AVANCO * delta,
      );
    }
    body.setVelocityX(this.velocidadeAvanco * this.direcao);
    this.atualizarPosicaoHitbox();
    this.atualizarAlvosCarregados();

    if ((this.direcao > 0 && body.blocked.right) || (this.direcao < 0 && body.blocked.left)) {
      this.distanciaAvancoPendente = 0;
      this.velocidadeAvanco = 0;
      this.finalizar();
    }
  }

  aoCompletarAnimacao() {
    this.finalizar();
  }

  destruirHitbox() {
    this.ataque?.remover();
    this.ataque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
    this.hitboxAtual = null;
  }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    } else {
      this.cancelar();
    }
  }

  cancelar() {
    const sprite = this.personagem.sprite;
    sprite?.off("animationupdate", this.aoAtualizarAnimacao);
    sprite?.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    this.destruirHitbox();
    this.alvosCarregados.clear();
    this.distanciaAvancoPendente = 0;
    this.velocidadeAvanco = 0;
    if (sprite?.body) sprite.body.setVelocityX(0);
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}
