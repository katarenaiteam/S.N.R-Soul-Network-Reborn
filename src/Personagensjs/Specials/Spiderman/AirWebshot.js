// AirWebshot.js
export default class AirWebShot {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;

    this.projetil = null;
    this.acertou = false;
    this.overlaps = [];
  }

  executar() {
    if (this.projetil) return;

    // Só executa se o Homem-Aranha estiver no ar
    if (this.personagem.sprite.body.blocked.down) return;

    // Reduz a velocidade Y para dar a leve "flutuada" no ar
    this.personagem.sprite.setVelocityY(40);

    this.criarProjetil();
  }

  criarProjetil() {
    if (!this.personagem?.sprite?.active) return;

    const sprite = this.personagem.sprite;
    const direcao = sprite.flipX ? -1 : 1;

    // Ponto de saída do tiro (mão no ar)
    const x = sprite.x + (25 * direcao);
    const y = sprite.y - 10;

    // 1. Cria o projétil da teia
    this.projetil = this.scene.physics.add.sprite(x, y, "webshot", 4);

    if (this.scene.camHUD) {
      this.scene.camHUD.ignore(this.projetil);
    }

    this.projetil.setFlipX(direcao === -1);
    this.projetil.anims.play("spy_webShot");

    this.projetil.body.setAllowGravity(false);
    this.projetil.body.setSize(30, 30);

    // Trajetória na diagonal para baixo
    const velX = 500 * direcao;
    const velY = 400; // Vai para baixo
    this.projetil.body.setVelocity(velX, velY);

    // 2. Colisão/Overlap com Inimigos
    const oponentes = [this.scene.jogador1, this.scene.jogador2].filter(
      (j) => j && j !== this.personagem
    );

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

    // 3. Destrói o projétil se tocar no chão
    this.scene.physics.add.collider(
      this.projetil,
      this.scene.plataformas || this.scene.chao,
      () => {
        if (this.projetil && this.projetil.active) {
          this.projetil.destroy();
          this.projetil = null;
        }
      }
    );
  }

  processarAcerto(alvo, projetil) {
    if (this.acertou) return;
    this.acertou = true;

    // Destrói os overlaps para evitar múltiplos acertos no mesmo frame
    this.overlaps.forEach((ov) => {
      if (ov && ov.active) ov.destroy();
    });
    this.overlaps = [];

    const props = this.special?.propriedades || {};

    // 1. Aplica o dano no alvo e verifica se foi bloqueado pela Guarda
    // Se o alvo estiver em 'guard', receberDano() retorna TRUE
    const defendeu = alvo.receberDano(props.dano || 8, props);

    // 2. SÓ PRENDE SE NÃO TIVER DEFENDIDO NA GUARDA!
    if (!defendeu && !alvo.estaPresoNaTeia && !alvo.imuneTeia) {
      this.prenderOponente(alvo);
    }

    // Destrói o projétil no impacto
    if (projetil && projetil.active) {
      projetil.destroy();
      this.projetil = null;
    }
  }

  prenderOponente(alvo) {
    alvo.estaPresoNaTeia = true;
    alvo.imuneTeia = true;

    const tempoPreso = this.special?.propriedades?.duracaoTeia || 1500;
    const tempoImunidade = 1000;

    // Muda o oponente para o EstadoTeia
    alvo.maquinaEstados.mudarEstado("teia");

    // Cria o sprite visual da teia
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

    // Faz o efeito visual seguir a posição do oponente
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

      // Imunidade após sair
      this.scene.time.delayedCall(tempoImunidade, () => {
        alvo.imuneTeia = false;
      });
    };

    // Timer natural para soltar da teia
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