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

    if (jogador1?.sprite && jogador1 !== this.personagem) {
      this.overlaps.push(
        this.scene.physics.add.overlap(
          this.projetil,
          jogador1.sprite,
          () => this.acertar(jogador1)
        )
      );
    }

    if (jogador2?.sprite && jogador2 !== this.personagem) {
      this.overlaps.push(
        this.scene.physics.add.overlap(
          this.projetil,
          jogador2.sprite,
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
    const tempoPreso = 2500; // Tempo preso em ms
    const tempoImunidade = 900; // Tempo de invencibilidade à teia após ser solto (1.2s)

    if (!alvo || !alvo.sprite || !alvo.sprite.body) return;

    // ATIVA A IMUNIDADE/ESTADO DE PRESO NO OPONENTE
    alvo.estaPresoNaTeia = true;
    alvo.imuneTeia = true;

    // 1. TRAVA ABSOLUTA DO OPONENTE
    alvo.sprite.body.setVelocity(0, 0);
    alvo.sprite.body.moves = false; 

    // 2. CÁLCULO DE ESCALA PARA BONECOS GRANDES
    const alturaAlvo = alvo.sprite.body.height || 95;
    const escalaTeia = Math.max(1, alturaAlvo / 80);

    // 3. CRIAÇÃO E POSICIONAMENTO DA TEIA OVERLAY
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

    // 4. DESCONGELAR APÓS O TEMPO
    this.scene.time.delayedCall(tempoPreso, () => {
      this.scene.events.off("update", seguirOponente);

      // Reativa o movimento do oponente
      if (alvo.sprite && alvo.sprite.body) {
        alvo.sprite.body.moves = true;
      }

      // Desmarca o estado de preso
      alvo.estaPresoNaTeia = false;

      // Animação da teia desfazendo
      if (teiaPresa && teiaPresa.active) {
        teiaPresa.anims.play("spy_web_trap_end");
        teiaPresa.once("animationcomplete", () => {
          teiaPresa.destroy();
        });
      }

      // TIMER DE IMUNIDADE (Cooldown antes de poder ser preso de novo)
      this.scene.time.delayedCall(tempoImunidade, () => {
        alvo.imuneTeia = false;
      });
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