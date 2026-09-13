import EstadoBase from "./EstadoBase.js";

export default class EstadoAtordoado extends EstadoBase {
  constructor(personagem) {
    super(personagem);

    this.duracao = 6000;
    this.tempoInicial = 0;

    this.animChaveAtual = null;
    this.efeitoStun = null;

    this.fnFimAnimacao = null;
  }

  enter() {
    const p = this.personagem;
    const sprite = p.sprite;

    this.tempoInicial =
      p.scene.time.now;

    sprite.body?.setVelocityX(0);

    // =========================================================
    // ANIMAÇÃO DO PERSONAGEM
    // =========================================================

    p.tocarAnimacao("stun", true);

    this.animChaveAtual =
      `${p.prefixoAnim}stun`;

    const animData =
      p.scene.anims.get(
        this.animChaveAtual
      );

    const emLoop =
      animData?.repeat === -1;


    // Se NÃO for loop:
    // toca uma vez e congela no último frame.
    if (!emLoop) {
      this.fnFimAnimacao = () => {
        if (
          p.maquinaEstados.estadoAtual !==
          this
        ) {
          return;
        }

        sprite.anims.pause();
      };

      sprite.once(
        `animationcomplete-${this.animChaveAtual}`,
        this.fnFimAnimacao
      );
    }


    // =========================================================
    // EFEITO NA CABEÇA
    // =========================================================

    this.efeitoStun =
      p.vfx.tocar("stun");
  }

  execute() {
    const p = this.personagem;

    // Sem controle enquanto estiver atordoado.
    p.sprite.body?.setVelocityX(0);

    const tempoPassado =
      p.scene.time.now -
      this.tempoInicial;

    if (
      tempoPassado >=
      this.duracao
    ) {
      this.sairDoStun();
    }
  }

  sairDoStun() {
    if (
      this.personagem.maquinaEstados
        .estadoAtual !== this
    ) {
      return;
    }

    if (
      this.personagem.sprite.body
        ?.blocked.down
    ) {
      this.personagem.maquinaEstados
        .mudarEstado("idle");
    } else {
      this.personagem.maquinaEstados
        .mudarEstado("jump");
    }
  }

  exit() {
    const sprite =
      this.personagem.sprite;

    if (
      this.fnFimAnimacao &&
      this.animChaveAtual
    ) {
      sprite.off(
        `animationcomplete-${this.animChaveAtual}`,
        this.fnFimAnimacao
      );
    }

    this.fnFimAnimacao = null;

    sprite.anims?.resume();

    if (this.efeitoStun) {
      this.personagem.vfx
        .destruirEfeito(
          this.efeitoStun
        );

      this.efeitoStun = null;
    }
  }
}