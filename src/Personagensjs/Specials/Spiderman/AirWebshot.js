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
    const y = sprite.y + -10;

    // 1. Cria o projétil da teia
    this.projetil = this.scene.physics.add.sprite(x, y, "webshot", 4);

    // Ignora a Câmera HUD para evitar o projétil fantasma na tela
    if (this.scene.camHUD) {
      this.scene.camHUD.ignore(this.projetil);
    }

    this.projetil.setFlipX(direcao === -1);
    this.projetil.setOrigin(0.5, 0.5);

    // Toca a animação da teia
    this.projetil.anims.play("spy_webShot");
    this.projetil.body.setAllowGravity(false);

    // Trajetória diagonal para baixo
    const velocidadeX = 450 * direcao;
    const velocidadeY = 320;
    this.projetil.setVelocity(velocidadeX, velocidadeY);

    // Rotaciona o sprite na direção da trajetória
    const angulo = direcao === 1 ? 35 : 145;
    this.projetil.setAngle(angulo);

    // Ajuste fino da Hitbox do Projétil
    const larguraHitbox = 40;
    const alturaHitbox = 40;
    this.projetil.body.setSize(larguraHitbox, alturaHitbox, true);

    // 2. Registra a colisão/overlap com os dois jogadores
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

    // Se o alvo já estiver preso ou imune à teia, o tiro ignora
    if (alvo.estaPresoNaTeia || alvo.imuneTeia) {
      return;
    }

    this.acertou = true;
    console.log("AIR WEBSHOT PRENDEU:", alvo.nomePersonagem);

    // 1. Dano inicial
    if (typeof alvo.receberDano === "function") {
      alvo.receberDano(
        this.special?.propriedades?.dano || 10,
        this.special?.propriedades
      );
    }

    // 2. Lógica de prender o oponente (idêntica à do WebShot do chão)
    this.prenderOponente(alvo);

    // Destrói o projétil da teia em voo
    if (this.projetil && this.projetil.active) {
      this.projetil.destroy();
      this.projetil = null;
    }
  }

  prenderOponente(alvo) {
    const tempoPreso = 2500;
    const tempoImunidade = 900;

    if (!alvo?.sprite?.body) return;

    // Se ele já tiver uma teia presa ativada, desfaz antes de reaplicar
    if (alvo.estourarTeia) {
      alvo.estourarTeia(false);
    }

    alvo.estaPresoNaTeia = true;
    alvo.imuneTeia = true;

    // Troca o estado do oponente para o "EstadoTeia"
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

    // Referências armazenadas no oponente para o EstadoTeia manipular
    alvo.teiaPresaSprite = teiaPresa;
    alvo.seguirOponenteTeia = seguirOponente;

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

  destruir() {
    this.overlaps.forEach((overlap) => {
      if (overlap && overlap.active) overlap.destroy();
    });
    this.overlaps = [];

    if (this.projetil && this.projetil.active) {
      this.projetil.destroy();
    }

    this.projetil = null;
  }
}