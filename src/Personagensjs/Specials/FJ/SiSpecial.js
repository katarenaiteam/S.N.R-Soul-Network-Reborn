import EstadoBase from "../../../Estados/EstadoBase.js";
import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

const PAUSA_CAPTURA = 600;
const PAUSA_ERRO = 200;
const VELOCIDADE_AVANCO = 550;
const DURACAO_AVANCO = 400;
const TEMPO_ACELERACAO = 120;
const HITBOX = { largura: 60, altura: 75, offsetX: 60, offsetY: -75 };

// Um estado sem leitura de comandos encerra tambem o ataque/special anterior.
class EstadoAgarradoFJ extends EstadoBase {
  enter({ dono }) {
    this.dono = dono;
    const p = this.personagem;
    const body = p.sprite.body;
    this.original = { moves: body.moves, gravidade: body.allowGravity, invulneravel: p.invulneravel };
    p.tocarAnimacao("dano", true);
    p.sprite.anims.pause();
    p.invulneravel = true;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
    body.moves = false;
    this.execute();
  }

  execute() {
    this.personagem.sprite.body.setVelocity(0, 0);
    this.dono.posicionarAlvo();
  }

  exit() {
    const p = this.personagem;
    p.invulneravel = this.original.invulneravel;
    if (p.sprite?.body) {
      p.sprite.body.moves = this.original.moves;
      p.sprite.body.setAllowGravity(this.original.gravidade);
      p.sprite.body.updateFromGameObject();
      p.sprite.anims.resume();
    }
  }
}

export default class SiSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.alvo = null;
    this.hitbox = null;
    this.finalizado = false;
    this.fase = "avanco";
    this.aoFrame = this.aoFrame.bind(this);
    this.aoFim = this.aoFim.bind(this);
    this.cancelar = this.cancelar.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    this.inicio = this.scene.time.now;
    sprite.setVelocityX(0);
    sprite.on("animationupdate", this.aoFrame);
    sprite.on("animationcomplete", this.aoFim);
    sprite.once("destroy", this.cancelar);
    this.scene.events.once("shutdown", this.cancelar);
    if (sprite.anims.currentFrame) this.aoFrame(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoFrame(anim, frame) {
    if (this.finalizado) return;
    if (anim.key === "fj_siSpecial" && this.fase === "avanco") {
      const indice = Number(frame.textureFrame);
      if (indice >= 1 && indice <= 3) this.criarHitbox();
      else this.destruirHitbox();
      if (indice === 2) {
        this.fase = "erro";
        this.inicioErro = this.scene.time.now;
        this.personagem.sprite.anims.pause();
      }
    }
    if (anim.key === "fj_grab" && Number(frame.textureFrame) === 9) this.lancarAlvo();
  }

  criarHitbox() {
    if (this.hitbox) return;
    this.hitbox = this.scene.add.zone(0, 0, HITBOX.largura, HITBOX.altura);
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.posicionarHitbox();
    registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.capturar(alvo),
    });
  }

  capturar(alvo) {
    if (this.finalizado || !["avanco", "erro"].includes(this.fase) || this.alvo ||
        alvo.invulneravel || !alvo.sprite?.active || !alvo.sprite.body ||
        !alvo.maquinaEstados || alvo.maquinaEstados.estadoAtual?.nome === "agarradoFJ") return;
    this.alvo = alvo;
    this.fase = "pausa";
    this.inicioPausa = this.scene.time.now;
    this.destruirHitbox();
    const sprite = this.personagem.sprite;
    sprite.setVelocityX(0);
    sprite.anims.pause(sprite.anims.currentAnim.frames[2]);
    const fsm = alvo.maquinaEstados;
    if (!fsm.estados.agarradoFJ) fsm.adicionarEstado("agarradoFJ", new EstadoAgarradoFJ(alvo));
    this.estadoAlvo = fsm.estados.agarradoFJ;
    fsm.mudarEstado("agarradoFJ", { dono: this });
    this.personagem.tocarSomSorteado("grab", { volume: 0.8 });
  }

  posicionarHitbox() {
    if (!this.hitbox?.active) return;
    const sprite = this.personagem.sprite;
    this.hitbox.setPosition(sprite.x + HITBOX.offsetX * this.direcao, sprite.y + HITBOX.offsetY);
    this.hitbox.body.updateFromGameObject();
  }

  posicionarAlvo() {
    if (!this.alvo?.sprite?.active) return;
    const sprite = this.personagem.sprite;
    this.alvo.sprite.setPosition(sprite.x + 65 * this.direcao, sprite.y);
    this.alvo.sprite.body.updateFromGameObject();
    this.alvo.sincronizarHurtbox();
  }

  atualizar() {
    if (this.finalizado) return;
    if (!this.personagem.sprite?.active || this.personagem.maquinaEstados.estadoAtual !== this.estado ||
        (this.alvo && (!this.alvo.sprite?.active || this.alvo.maquinaEstados.estadoAtual !== this.estadoAlvo))) {
      this.finalizar();
      return;
    }
    if (["avanco", "erro", "recuperacao"].includes(this.fase)) {
      const tempo = Math.max(0, this.scene.time.now - this.inicio);
      const acelerando = tempo < TEMPO_ACELERACAO;
      const progresso = Math.min(1, acelerando
        ? tempo / TEMPO_ACELERACAO
        : (tempo - TEMPO_ACELERACAO) / (DURACAO_AVANCO - TEMPO_ACELERACAO));
      const curva = progresso * progresso * (3 - 2 * progresso);
      // Mesma aceleracao do aereo; no solo a frenagem termina em repouso.
      this.personagem.sprite.setVelocityX(VELOCIDADE_AVANCO * (acelerando ? curva : 1 - curva) * this.direcao);
    }
    if (this.fase === "erro") {
      this.posicionarHitbox();
      if (this.scene.time.now - this.inicioErro >= PAUSA_ERRO) {
        this.fase = "recuperacao";
        this.destruirHitbox();
        this.personagem.sprite.anims.resume();
      }
      return;
    }
    if (this.fase === "avanco") {
      this.posicionarHitbox();
    } else if (this.fase !== "recuperacao") {
      this.personagem.sprite.setVelocityX(0);
      this.posicionarAlvo();
      if (this.fase === "pausa" && this.scene.time.now - this.inicioPausa >= PAUSA_CAPTURA) {
        this.fase = "grab";
        this.personagem.sprite.anims.resume();
        this.personagem.tocarAnimacao("grab", true);
      }
    }
  }

  aoFim(anim) {
    if (this.finalizado) return;
    if (anim.key === "fj_siSpecial" && ["avanco", "recuperacao"].includes(this.fase)) this.finalizar();
    if (anim.key === "fj_grab" && this.fase === "grab") {
      this.finalizar();
    }
  }

  lancarAlvo() {
    if (this.fase !== "grab" || !this.alvo || this.alvoLancado) return;
    this.personagem.tocarSomSorteado("c-mon", { volume: 0.8 });
    const alvo = this.soltarAlvo();
    // A fisica e o estado de dano seguem normalmente durante o voo,
    // mas os comandos continuam bloqueados ate o fim da animacao do FJ.
    this.alvoLancado = alvo;
    this.comandosOriginais = new Map();
    for (const nome of ["inputDown", "inputJustDown", "inputJustUp", "podeUsarAtaque", "podeUsarSpecial"]) {
      this.comandosOriginais.set(nome, Object.getOwnPropertyDescriptor(alvo, nome));
      alvo[nome] = () => false;
    }
    this.personagem.vfx?.tocarListaImpacto(
      [{ escolherUm: ["punch1", "punch2", "punch3"] }], alvo, this.hitbox,
    );
    const somImpacto = this.personagem.sons?.heavy;
    if (somImpacto) this.personagem.tocarSomSorteado(somImpacto, { volume: 0.15 });
    alvo.receberDano(18, {
      dano: 18, knockbackX: 700, knockbackY: -350, tumbling: true,
      tipoSomImpacto: "heavy",
    }, { direcao: this.direcao, x: this.personagem.sprite.x });
  }

  restaurarComandos() {
    if (!this.alvoLancado) return;
    for (const [nome, descriptor] of this.comandosOriginais) {
      if (descriptor) Object.defineProperty(this.alvoLancado, nome, descriptor);
      else delete this.alvoLancado[nome];
    }
    this.alvoLancado = null;
    this.comandosOriginais = null;
  }

  soltarAlvo() {
    const alvo = this.alvo;
    this.alvo = null;
    if (alvo && alvo.maquinaEstados.estadoAtual === this.estadoAlvo) {
      if (alvo.sprite?.active && alvo.sprite.body) {
        alvo.maquinaEstados.mudarEstado(alvo.sprite.body.blocked.down ? "idle" : "jump");
      } else {
        this.estadoAlvo.exit();
      }
    }
    return alvo;
  }

  destruirHitbox() {
    this.hitbox?.destroy();
    this.hitbox = null;
  }

  finalizar() {
    this.cancelar();
    if (this.personagem.sprite?.active && this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.personagem.sprite.setVelocityX(0);
      this.estado.finalizarSpecial();
    }
  }

  cancelar() {
    if (this.finalizado) return;
    this.finalizado = true;
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.aoFrame);
    sprite.off("animationcomplete", this.aoFim);
    sprite.off("destroy", this.cancelar);
    this.scene.events.off("shutdown", this.cancelar);
    if (sprite.anims?.currentAnim?.key === "fj_siSpecial" && sprite.anims.isPaused) sprite.anims.resume();
    this.destruirHitbox();
    this.soltarAlvo();
    this.restaurarComandos();
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }
}
