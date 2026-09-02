import { obterAlvosCombate, registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class WebShot {
  constructor(personagem, special) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;

    this.projetil = null;
    this.acertou = false;
    this.timer = null;
    this.overlaps = [];
  }

  executar() {
    if (this.projetil || this.timer) return;

    // Delay de 400ms para casar com a animação do Homem-Aranha
    this.timer = this.scene.time.delayedCall(400, () => {
      this.timer = null;
      this.criarProjetil();
    });
  }

  criarProjetil() {
    if (!this.personagem || !this.personagem.sprite || !this.personagem.sprite.active) return;

    const sprite = this.personagem.sprite;
    const direcao = sprite.flipX ? -1 : 1;

    const x = sprite.x + 30 * direcao;
    const y = sprite.y - 60;

    this.projetil = this.scene.physics.add.sprite(x, y, "webshot", 4);

    if (this.scene.camHUD) {
      this.scene.camHUD.ignore(this.projetil);
    }

    this.projetil.setFlipX(direcao === -1);
    this.projetil.anims.play("spy_webShot");

    this.projetil.body.setAllowGravity(false);
    this.projetil.body.debugBodyColor = 0xff0000;
    this.projetil.body.setSize(30, 30);
    this.projetil.body.setVelocityX(600 * direcao);

    registrarAtaqueEspecial(this, this.projetil, {
      categoria: "projetil",
      aoColidir: () => this.destruirEmChoque(),
    });

    // Colisão com Inimigos
    const oponentes = obterAlvosCombate(this.personagem);

    this.overlaps = [];

    oponentes.forEach((oponente) => {
      if (!oponente) return;

      const overlap = this.scene.physics.add.overlap(
        this.projetil,
        oponente.grupoHurtbox,
        () => {
          this.processarAcerto(oponente, this.projetil);
        },
        null,
        this
      );

      this.overlaps.push(overlap);
    });
  }

  processarAcerto(alvo, projetil) {
    if (this.acertou) return;
    this.acertou = true;

    // Remove os overlaps para evitar acertos múltiplos
    this.overlaps.forEach((ov) => {
      if (ov && ov.active) ov.destroy();
    });
    this.overlaps = [];

    const props = this.special?.propriedades || {};

    // 1. Aplica o dano no alvo e verifica se foi bloqueado pela Guarda
    const defendeu = alvo.receberDano(props.dano || 8, props);

    // 2. SÓ PRENDE SE NÃO TIVER DEFENDIDO NA GUARDA!
    if (!defendeu && alvo.maquinaEstados && !alvo.estaPresoNaTeia && !alvo.imuneTeia) {
      this.prenderOponente(alvo);
    }

    // Destrói o projétil no impacto
    if (projetil && projetil.active) {
      projetil.destroy();
      this.projetil = null;
    }
  }

  destruirEmChoque() {
    if (this.acertou) return;
    this.acertou = true;
    this.overlaps.forEach((overlap) => overlap?.destroy());
    this.overlaps = [];
    this.projetil?.destroy();
    this.projetil = null;
  }

  prenderOponente(alvo) {
    alvo.estaPresoNaTeia = true;
    alvo.imuneTeia = true;

    const tempoPreso = this.special?.propriedades?.duracaoTeia || 1500;
    const tempoImunidade = 1000;

    // Força o oponente a ir para o EstadoTeia
    alvo.maquinaEstados.mudarEstado("teia");

    // Cria a animação visual da teia no oponente
    const teiaPresa = this.scene.add.sprite(
      alvo.sprite.x,
      alvo.sprite.y - 40,
      "spider_effects"
    );

    if (this.scene.camHUD) {
      this.scene.camHUD.ignore(teiaPresa);
    }

    teiaPresa.setDepth(alvo.sprite.depth + 1);
    teiaPresa.anims.play("spy_web_trap_start");

    alvo.teiaPresaSprite = teiaPresa;

    // Atualiza a posição da teia junto com o oponente
    const seguirOponente = () => {
      if (teiaPresa && teiaPresa.active && alvo.sprite) {
        teiaPresa.setPosition(alvo.sprite.x, alvo.sprite.y - 40);
      }
    };
    this.scene.events.on("update", seguirOponente);

    alvo.atualizarTeia = seguirOponente;

    // Função para desfazer a teia (se tomar dano ou acabar o tempo)
    alvo.estourarTeia = (tocarAnimacao = true) => {
      alvo.estaPresoNaTeia = false;

      if (alvo.timerTeia) {
        alvo.timerTeia.remove(false);
        alvo.timerTeia = null;
      }

      this.scene.events.off("update", seguirOponente);

      if (teiaPresa && teiaPresa.active) {
        if (tocarAnimacao) {
          teiaPresa.anims.play("spy_web_trap_end");
          teiaPresa.once("animationcomplete", () => {
            teiaPresa.destroy();
          });
        } else {
          teiaPresa.destroy();
        }
      }

      alvo.teiaPresaSprite = null;

      // Timer de imunidade
      this.scene.time.delayedCall(tempoImunidade, () => {
        alvo.imuneTeia = false;
      });
    };

    // Timer natural de tempo esgotado (caso ninguém bata nele)
    alvo.timerTeia = this.scene.time.delayedCall(tempoPreso, () => {
      if (alvo.estaPresoNaTeia) {
        alvo.estourarTeia(true);

        if (alvo.sprite.body.blocked.down) {
          alvo.maquinaEstados.mudarEstado("idle");
        } else {
          alvo.maquinaEstados.mudarEstado("jump");
        }
      }
    });
  }

  atualizar() {
    if (this.projetil && this.projetil.active) {
      if (Math.abs(this.projetil.x - this.personagem.sprite.x) > 1000) {
        this.projetil.destroy();
        this.projetil = null;
      }
    }
  }
}
