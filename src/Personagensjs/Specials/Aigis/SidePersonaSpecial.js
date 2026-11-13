import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class AigisPersonaSideSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.direcao = personagem.sprite.flipX ? -1 : 1;
    this.persona = null;
    this.hitbox = null;
    this.ataque = null;
    this.alvosAtingidos = new Set();
    this.finalizado = false;
  }

  executar() {
    const aigis = this.personagem.sprite;
    this.direcao = aigis.flipX ? -1 : 1;
    this.tempoInicio = this.scene.time.now;
    this.xInicialPersona = aigis.x + this.direcao * this.special.offsetPersonaX;

    if (this.special.aereo) {
      const body = aigis.body;
      this.estadoCorpoOriginal = {
        gravidade: body.allowGravity,
        velocidadeX: body.velocity.x,
        velocidadeY: body.velocity.y,
      };
      body.setAllowGravity(false);
      aigis.setVelocity(0, 0);
    }

    this.persona = this.scene.add.sprite(
      this.xInicialPersona,
      aigis.y + this.special.offsetPersonaY,
      "p_siSpecial",
      0,
    )
      .setOrigin(0.5, 1)
      .setScale(this.special.escalaPersona)
      .setFlipX(aigis.flipX)
      .setDepth(aigis.depth + 1);
    this.scene.camHUD?.ignore(this.persona);
    this.persona.play(this.special.animacaoPersona);
    this.criarHitbox();
  }

  atualizar() {
    if (this.finalizado) return;
    if (this.personagem.maquinaEstados.estadoAtual !== this.estado) {
      this.cancelar();
      return;
    }

    const aigis = this.personagem.sprite;
    const tempoDecorrido = this.scene.time.now - this.tempoInicio;
    if (this.special.aereo) {
      this.persona.setPosition(
        this.xInicialPersona + this.direcao * this.special.velocidadePersona * tempoDecorrido / 1000,
        aigis.y + this.special.offsetPersonaY,
      );
    } else {
      aigis.setVelocityX(this.direcao * this.special.velocidadeCorrida);
      this.persona.setPosition(
        aigis.x + this.direcao * this.special.offsetPersonaX,
        aigis.y + this.special.offsetPersonaY,
      );
    }
    this.persona.setFlipX(aigis.flipX).setDepth(aigis.depth + 1);
    this.atualizarHitbox();

    if (tempoDecorrido >= this.special.duracaoMinima && !this.personagem.inputDown("special")) {
      this.finalizarAtaque();
    }
  }

  criarHitbox() {
    this.hitbox = this.scene.add.zone(
      0,
      0,
      this.special.hitbox.largura,
      this.special.hitbox.altura,
    );
    this.scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.setImmovable(true);
    this.hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitbox);
    this.ataque = registrarAtaqueEspecial(this, this.hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.atingirAlvo(alvo),
    });
  }

  atualizarHitbox() {
    if (!this.hitbox?.active || !this.persona?.active) return;
    this.hitbox.setPosition(
      this.persona.x + this.direcao * this.special.hitbox.offsetX,
      this.persona.y + this.special.hitbox.offsetY,
    );
    this.hitbox.body.updateFromGameObject();
  }

  atingirAlvo(alvo) {
    if (this.finalizado || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    alvo.receberDano(this.special.propriedadesAtaque.dano, this.special.propriedadesAtaque, {
      x: this.persona?.x ?? this.personagem.sprite.x,
      direcao: this.direcao,
      atacante: this.personagem,
    });
  }

  finalizarAtaque() {
    if (this.finalizado) return;
    this.finalizar();
    if (this.personagem.maquinaEstados.estadoAtual === this.estado) {
      this.estado.finalizarSpecial();
    }
  }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.ataque?.remover();
    this.ataque = null;
    this.hitbox?.destroy();
    this.hitbox = null;
    this.persona?.destroy();
    this.persona = null;

    const aigis = this.personagem.sprite;
    if (this.estadoCorpoOriginal && aigis?.body) {
      aigis.body.setAllowGravity(this.estadoCorpoOriginal.gravidade);
      aigis.setVelocity(
        this.estadoCorpoOriginal.velocidadeX,
        this.estadoCorpoOriginal.velocidadeY,
      );
      this.estadoCorpoOriginal = null;
    } else if (aigis?.body) {
      aigis.setVelocityX(0);
    }

    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    this.finalizar();
  }
}

const criarConfiguracao = (aereo) => ({
  animacao: aereo ? "ai_invoc2_special" : "ai_ult_siSpecial",
  animacaoPersona: aereo ? "ai_p_siSpecial_air" : "ai_p_siSpecial",
  configuracaoAnimacao: aereo ? "NeSpecialUltAir" : "ult_siSpecial",
  logica: AigisPersonaSideSpecial,
  cooldown: 1000,
  aereo,
  duracaoMinima: 1500,
  velocidadeCorrida: 420,
  velocidadePersona: aereo ? 105 : 420,
  offsetPersonaX: 80,
  offsetPersonaY: -5,
  escalaPersona: 0.33,
  hitbox: {
    largura: 170,
    altura: 125,
    offsetX: 92,
    offsetY: -128,
  },
  propriedades: aereo ? { travarMovimentoAir: true } : {},
  propriedadesAtaque: {
    tipoSomImpacto: "heavy",
    dano: 25,
    knockbackX: 480,
    knockbackY: -350,
    knockbackFixo: false,
    tumbling: true,
  },
});

AigisPersonaSideSpecial.configuracaoChao = criarConfiguracao(false);
AigisPersonaSideSpecial.configuracaoAr = criarConfiguracao(true);
