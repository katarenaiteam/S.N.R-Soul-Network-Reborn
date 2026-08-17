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
    this.projetil.setOrigin(0.5, 0.5);

    this.projetil.anims.play("spy_webShot");
    this.projetil.body.setAllowGravity(false);
    this.projetil.body.setVelocityX(1000 * direcao);

    const larguraHitbox = 50;
    const alturaHitbox = 30;
    this.projetil.body.setSize(larguraHitbox, alturaHitbox, false);
    this.projetil.body.setOffset((200 - larguraHitbox) / 2, (200 - alturaHitbox) / 2);

 const jogador1 = this.scene.jogador1;
    const jogador2 = this.scene.jogador2;

    if (jogador1?.grupoHurtbox && jogador1 !== this.personagem) {
      this.overlaps.push(
        this.scene.physics.add.overlap(
          this.projetil,
          jogador1.grupoHurtbox, // 👈 Ajustado de jogador1.sprite para grupoHurtbox
          () => this.acertar(jogador1)
        )
      );
    }

    if (jogador2?.grupoHurtbox && jogador2 !== this.personagem) {
      this.overlaps.push(
        this.scene.physics.add.overlap(
          this.projetil,
          jogador2.grupoHurtbox, // 👈 Ajustado de jogador2.sprite para grupoHurtbox
          () => this.acertar(jogador2)
        )
      );
    }
  }

  acertar(alvo) {
    if (alvo === this.personagem) return;
    if (this.acertou) return;

    // NOVO: Se o alvo já está preso ou imune à teia, o tiro passa direto sem prender novamente
    if (alvo.estaPresoNaTeia || alvo.imuneTeia) {
      return;
    }

    this.acertou = true;
    console.log("WEBSHOT PRENDEU:", alvo.nomePersonagem);

    // 1. Aplica dano inicial
    if (typeof alvo.receberDano === "function") {
      alvo.receberDano(
        this.special?.propriedades?.dano || 10,
        this.special?.propriedades
      );
    }

    // 2. Prende e congela o oponente
    this.prenderOponente(alvo);

    // Destrói o projétil da teia que estava voando
    if (this.projetil && this.projetil.active) {
      this.projetil.destroy();
      this.projetil = null;
    }
  }

  prenderOponente(alvo) {
    const tempoPreso = 2500;
    const tempoImunidade = 900;

    if (!alvo || !alvo.sprite || !alvo.sprite.body) return;

    // Se ele já tiver uma teia presa, destrói a antiga antes de aplicar
    if (alvo.estourarTeia) {
      alvo.estourarTeia(false); // Estoura a teia anterior sem tocar a animação duplicada
    }

    alvo.estaPresoNaTeia = true;
    alvo.imuneTeia = true;

    alvo.maquinaEstados.mudarEstado("teia");
    alvo.sprite.body.setVelocityX(0);
    alvo.sprite.body.setAllowGravity(true);

    const alturaAlvo = alvo.sprite.body.height || 95;
    const escalaTeia = Math.max(1, alturaAlvo / 80);

    const centroY = alvo.sprite.y - (alturaAlvo / 2);
    const teiaPresa = this.scene.add.sprite(alvo.sprite.x, centroY, "webshot");
    
    teiaPresa.setDepth(alvo.sprite.depth + 10);
    teiaPresa.setScale(escalaTeia);

    if (this.scene.camHUD) {
      this.scene.camHUD.ignore(teiaPresa);
    }

    teiaPresa.anims.play("spy_web_trap_start");

    const seguirOponente = () => {
      if (teiaPresa && teiaPresa.active && alvo.sprite) {
        const posY = alvo.sprite.y - ((alvo.sprite.body.height || 95) / 2);
        teiaPresa.setPosition(alvo.sprite.x, posY);
      }
    };

    this.scene.events.on("update", seguirOponente);

    // Guarda as referências no próprio oponente para que o estourarTeia possa acessar
    alvo.teiaPresaSprite = teiaPresa;
    alvo.seguirOponenteTeia = seguirOponente;

    // Função para estourar/destruir a teia
    alvo.estourarTeia = (tocarAnimacao = true) => {
      alvo.estaPresoNaTeia = false;

      // Cancela o timer principal se ainda estiver ativo
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
        this.destruir();
      }
    }
  }

  destruir() {
    this.overlaps.forEach((overlap) => {
      if (overlap && overlap.active) overlap.destroy();
    });
    this.overlaps = [];

    if (this.timer) {
      this.timer.remove(false);
      this.timer = null;
    }

    if (this.projetil && this.projetil.active) {
      this.projetil.destroy();
    }

    this.projetil = null;
  }
}