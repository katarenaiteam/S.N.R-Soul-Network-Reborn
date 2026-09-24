import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

const TEMPO_MAXIMO_CARGA = 2500;
const TEMPO_POSE_FINAL = 250;
const DANO_BASE = 20;
// Salto curto para frente durante o golpe.
const IMPULSO_X = 305;
const IMPULSO_Y = -180;
const DURACAO_AVANCO = 320;
const HITBOX = { largura: 80, altura: 60, offsetX: 38, offsetY: -65 };

export default class NeSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.finalizado = false;
    this.liberado = false;
    this.inicioCarga = null;
    this.inicioPoseFinal = null;
    this.inicioImpulso = null;
    this.dano = DANO_BASE;
    this.multiplicadorCarga = 1;
    this.hitbox = null;
    this.alvosAtingidos = new Set();
    this.aoAtualizarAnimacao = this.aoAtualizarAnimacao.bind(this);
    this.aoCompletarAnimacao = this.aoCompletarAnimacao.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    sprite.setVelocityX(0);
    sprite.on("animationupdate", this.aoAtualizarAnimacao);
    sprite.once(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    if (!this.personagem.inputDown("special")) {
      this.liberado = true;
      this.efeitosLiberacao();
    }
    if (sprite.anims.currentFrame) {
      this.aoAtualizarAnimacao(sprite.anims.currentAnim, sprite.anims.currentFrame);
    }
  }

  aoAtualizarAnimacao(animacao, frame) {
    if (this.finalizado || animacao?.key !== this.special.animacao) return;
    const indice = Number(frame.textureFrame);
    if (indice === 1 && !this.liberado && this.personagem.inputDown("special")) {
      this.inicioCarga = this.scene.time.now;
      this.efeitoCarga = this.personagem.vfx?.tocar("npose", { loop: true });
      this.efeitoCarga?.preFX?.addColorMatrix().set([
        4, 0, 0, 0, 0,
        0, 4, 0, 0, 0,
        0, 0, 4, 0, 0,
        0, 0, 0, 3, 0,
      ]);
      this.efeitoCarga?.play({ key: "fj_npose", repeat: -1 });
      this.personagem.sprite.anims.pause();
    }
    if (indice === 3 && this.inicioImpulso === null) {
      this.inicioImpulso = this.scene.time.now;
      this.personagem.hiperArmaduraHits = 1;
      this.personagem.hiperArmaduraFonte = this;
      this.personagem.sprite.body.setVelocity(IMPULSO_X * this.direcao, IMPULSO_Y);
    }
    if (indice === 7) this.criarHitbox();
    if (indice === 8) {
      this.destruirHitbox();
      this.removerHiperArmadura();
      if (this.inicioPoseFinal === null) this.inicioPoseFinal = this.scene.time.now;
      this.personagem.sprite.anims.pause();
    }
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }
    this.atualizarImpulso();
    if (this.inicioPoseFinal !== null) {
      if (this.scene.time.now - this.inicioPoseFinal >= TEMPO_POSE_FINAL) {
        this.aoCompletarAnimacao();
      }
      return;
    }
    if (!this.liberado) {
      const tempo = this.inicioCarga === null ? 0 : this.scene.time.now - this.inicioCarga;
      if (!this.personagem.inputDown("special") || tempo >= TEMPO_MAXIMO_CARGA) {
        this.liberado = true;
        this.efeitosLiberacao();
        this.multiplicadorCarga = 1 + Math.min(1, tempo / TEMPO_MAXIMO_CARGA);
        this.dano = DANO_BASE * this.multiplicadorCarga;
        if (this.inicioCarga !== null) this.personagem.sprite.anims.resume();
      }
    }
    this.atualizarHitbox();
  }

  efeitosLiberacao() {
    this.efeitoCarga?.destroy();
    this.efeitoCarga = null;
    this.personagem.tocarSomSorteado("take-this", { volume: 0.8 });
  }

  atualizarImpulso() {
    if (this.inicioImpulso === null) return;
    const progresso = Math.min(1, (this.scene.time.now - this.inicioImpulso) / DURACAO_AVANCO);
    // Desacelera sem cortar o movimento na entrada da pose final.
    // O eixo vertical fica sob a gravidade, como no Shoryuken.
    const suavizacao = progresso * progresso * (3 - 2 * progresso);
    this.personagem.sprite.setVelocityX(IMPULSO_X * this.direcao * (1 - suavizacao));
  }

  criarHitbox() {
    if (this.hitbox) return;
    this.hitbox = this.scene.add.zone(0, 0, HITBOX.largura, HITBOX.altura);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.atualizarHitbox();
    registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.acertar(alvo),
    });
  }

  atualizarHitbox() {
    if (!this.hitbox?.active) return;
    const sprite = this.personagem.sprite;
    this.hitbox.setPosition(sprite.x + HITBOX.offsetX * this.direcao, sprite.y + HITBOX.offsetY);
    this.hitbox.body.updateFromGameObject();
  }

  acertar(alvo) {
    if (this.finalizado || !this.hitbox?.active || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    this.personagem.vfx?.tocarListaImpacto(
      [{ escolherUm: ["punch1", "punch2", "punch3"] }], alvo, this.hitbox,
    );
    alvo.receberDano(this.dano, {
      dano: this.dano,
      tipoSomImpacto: "heavy",
      knockbackX: 350 * this.multiplicadorCarga,
      knockbackY: -250 * this.multiplicadorCarga,
      tumbling: true,
    }, { direcao: this.direcao, x: this.personagem.sprite.x });
    const som = this.personagem.sons?.heavy;
    if (som) this.personagem.tocarSomSorteado(som, { volume: 0.15 });
  }

  destruirHitbox() {
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  aoCompletarAnimacao() {
    if (this.finalizado) return;
    if (this.inicioPoseFinal !== null &&
        this.scene.time.now - this.inicioPoseFinal < TEMPO_POSE_FINAL) return;
    this.cancelar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) this.estado.finalizarSpecial();
  }

  removerHiperArmadura() {
    if (this.personagem.hiperArmaduraFonte === this) {
      this.personagem.hiperArmaduraHits = 0;
      this.personagem.hiperArmaduraFonte = null;
    }
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.removerHiperArmadura();
    this.efeitoCarga?.destroy();
    this.efeitoCarga = null;
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.aoAtualizarAnimacao);
    sprite.off(`animationcomplete-${this.special.animacao}`, this.aoCompletarAnimacao);
    if (sprite.anims.currentAnim?.key === this.special.animacao && sprite.anims.isPaused) {
      sprite.anims.resume();
    }
    this.destruirHitbox();
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}
