import {
  destruirColisor,
  obterAlvosCombate,
  registrarAtaqueEspecial,
} from "../../../Objetos/SistemaCombateEspecial.js";

export default class AupSpecial {
  constructor(personagem, special) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.minis = [];
  }

  executar() {
    const direcao = this.personagem.sprite.flipX ? -1 : 1;
    const impulsosX = [-190, -75, 75, 190];

    this.personagem.tocarSomSorteado("yata", {
      volume: this.special.volumeSom ?? 0.75,
      detune: 0,
    });

    impulsosX.forEach((impulsoX, indice) => {
        this.criarMini(indice, impulsoX * direcao);
    });
  }

  criarMini(indice, impulsoX) {
    const origem = this.personagem.sprite;
    const mini = this.scene.physics.add.sprite(
      origem.x + (indice - 1.5) * 14,
      origem.y - 55,
      "Miku_puppet",
      0
    );
    mini.setOrigin(0.5, 1);
    mini.setScale(this.special.escalaMini ?? 0.25);
    mini.setDepth(origem.depth + 1);
    mini.setFlipX(impulsoX < 0);
    mini.play("miku_puppet_move");
    mini.body.setSize(55, 75);
    mini.body.setVelocity(impulsoX, -430 - indice * 24);
    mini.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(mini);

    const entrada = {
      sprite: mini,
      dono: this.personagem,
      grupoHurtbox: null,
      hurtbox: null,
      overlaps: [],
      colisoresRecebidos: new Set(),
      colliderMapa: null,
      timerVida: null,
      ativo: true,
      destruida: false,
    };
    entrada.receberDano = () => {
      this.destruirMini(entrada);
      return false;
    };
    entrada.registrarColisorRecebido = (colisor) => {
      if (colisor) entrada.colisoresRecebidos.add(colisor);
    };
    this.minis.push(entrada);

    entrada.grupoHurtbox = this.scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    entrada.hurtbox = this.scene.add.zone(mini.x, mini.y - 18, 34, 38);
    entrada.grupoHurtbox.add(entrada.hurtbox);
    entrada.hurtbox.body.setAllowGravity(false);
    entrada.hurtbox.body.setImmovable(true);
    entrada.hurtbox.body.debugBodyColor = 0x00ff00;

    if (!this.scene.alvosAtaqueExtras) this.scene.alvosAtaqueExtras = [];
    this.scene.alvosAtaqueExtras.push(entrada);

    const plataformas = this.scene.mapaAtual?.plataformas;
    if (plataformas) {
      entrada.colliderMapa = this.scene.physics.add.collider(mini, plataformas);
    }

    obterAlvosCombate(this.personagem).forEach((alvo) => {
      entrada.overlaps.push(this.scene.physics.add.overlap(
        mini,
        alvo.grupoHurtbox,
        () => this.acertar(entrada, alvo),
        null,
        this
      ));
    });

    registrarAtaqueEspecial(this, mini, {
      categoria: "projetil",
      aoColidir: () => this.destruirMini(entrada),
    });

    entrada.timerVida = this.scene.time.delayedCall(
      this.special.tempoVidaMini ?? 15000,
      () => this.destruirMini(entrada)
    );
  }

  acertar(entrada, alvo) {
    if (entrada.destruida || !alvo?.sprite?.active) return;
    const direcao = alvo.sprite.x >= entrada.sprite.x ? 1 : -1;
    alvo.receberDano(
      this.special.propriedades?.dano ?? 1,
      this.special.propriedades ?? {},
      { x: entrada.sprite.x, direcao }
    );
    this.destruirMini(entrada);
  }

  obterAlvoMaisProximo(mini) {
    return obterAlvosCombate(this.personagem).reduce((maisPerto, alvo) => {
      if (!maisPerto) return alvo;
      return Math.abs(alvo.sprite.x - mini.x) < Math.abs(maisPerto.sprite.x - mini.x)
        ? alvo
        : maisPerto;
    }, null);
  }

  atualizar() {
    this.minis.forEach((entrada) => {
      const mini = entrada.sprite;
      if (entrada.destruida || !mini?.active) return;

      entrada.hurtbox?.setPosition(mini.x, mini.y - 18);
      if (!mini.body.blocked.down) return;

      const alvo = this.obterAlvoMaisProximo(mini);
      if (!alvo) {
        mini.setVelocityX(0);
        return;
      }

      const direcao = alvo.sprite.x >= mini.x ? 1 : -1;
      mini.setFlipX(direcao < 0);
      mini.setVelocityX((this.special.velocidadeMini ?? 210) * direcao);
    });
  }

  destruirMini(entrada) {
    if (!entrada || entrada.destruida) return;
    entrada.destruida = true;
    entrada.ativo = false;

    // O Arcade Physics ainda pode estar percorrendo estes corpos no callback
    // de colisão. Desativa agora e só destrói no próximo ciclo.
    if (entrada.sprite?.body) entrada.sprite.body.enable = false;
    if (entrada.hurtbox?.body) entrada.hurtbox.body.enable = false;

    if (this.scene.alvosAtaqueExtras) {
      this.scene.alvosAtaqueExtras = this.scene.alvosAtaqueExtras.filter(
        (alvo) => alvo !== entrada
      );
    }

    this.scene.time.delayedCall(0, () => {
      entrada.colisoresRecebidos.forEach((colisor) => {
        destruirColisor(colisor);
      });
      entrada.colisoresRecebidos.clear();
      entrada.overlaps.forEach((overlap) => {
        destruirColisor(overlap);
      });
      entrada.overlaps = [];
      destruirColisor(entrada.colliderMapa);
      entrada.colliderMapa = null;
      entrada.timerVida?.remove(false);
      entrada.timerVida = null;
      entrada.grupoHurtbox?.clear(true, true);
      entrada.grupoHurtbox = null;
      entrada.hurtbox = null;
      entrada.sprite?.destroy();
      entrada.sprite = null;

      if (this.minis.every((mini) => mini.destruida)) {
        this.removerDaListaAtiva();
      }
    });
  }

  removerDaListaAtiva() {
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  // As mini-puppets persistem depois que a pose de invocação termina.
  cancelar() {}
}
