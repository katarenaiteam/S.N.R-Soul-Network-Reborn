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

    // FIX DO FANTASMA (CÂMERA HUD):
    // Ignora a renderização do projétil na câmera da HUD para não duplicar visualmente na tela
    if (this.scene.camHUD) {
      this.scene.camHUD.ignore(this.projetil);
    }

    this.projetil.setFlipX(direcao === -1);
    this.projetil.setOrigin(0.5, 0.5);

    this.projetil.anims.play("spy_webShot");
    this.projetil.body.setAllowGravity(false);
    this.projetil.body.setVelocityX(1000 * direcao);

    // Ajuste de Hitbox centralizada no frame 200x200
    const larguraHitbox = 50;
    const alturaHitbox = 30;
    this.projetil.body.setSize(larguraHitbox, alturaHitbox, false);
    this.projetil.body.setOffset((200 - larguraHitbox) / 2, (200 - alturaHitbox) / 2);

    // Detecção de colisão (Overlap)
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
    const tempoPreso = 2500; // Tempo em ms que o alvo fica preso

    if (!alvo || !alvo.sprite || !alvo.sprite.body) return;

    // 1. TRAVA ABSOLUTA DO OPONENTE
    // Desativa a movimentação da física do Phaser para o alvo não sair do lugar
    alvo.sprite.body.setVelocity(0, 0);
    alvo.sprite.body.moves = false; 

    // 2. CÁLCULO DE ESCALA PARA BONECOS GRANDES
    // Pega a altura da caixa física do alvo para ajustar o tamanho da teia
    const alturaAlvo = alvo.sprite.body.height || 95;
    // O frame original da teia presa tem ~80px de altura utilizável
    const escalaTeia = Math.max(1, alturaAlvo / 80);

    // 3. CRIAÇÃO E POSICIONAMENTO DA TEIA OVERLAY
    // Posiciona no centro vertical do corpo do oponente
    const centroY = alvo.sprite.y - (alturaAlvo / 2);
    const teiaPresa = this.scene.add.sprite(alvo.sprite.x, centroY, "webshot");
    
    teiaPresa.setDepth(alvo.sprite.depth + 10); // Garante que fica totalmente na frente
    teiaPresa.setScale(escalaTeia); // Ajusta o tamanho dinamicamente ao personagem

    // Ignora na câmera da HUD
    if (this.scene.camHUD) {
      this.scene.camHUD.ignore(teiaPresa);
    }

    // Toca a animação de entrada da teia
    teiaPresa.anims.play("spy_web_trap_start");

    // Mantém a teia colada na posição do alvo caso o alvo seja empurrado por outro motivo
    const seguirOponente = () => {
      if (teiaPresa && teiaPresa.active && alvo.sprite) {
        const posY = alvo.sprite.y - ((alvo.sprite.body.height || 95) / 2);
        teiaPresa.setPosition(alvo.sprite.x, posY);
      }
    };

    this.scene.events.on("update", seguirOponente);

    // 4. DESCONGELAR APÓS O TEMPO
    this.scene.time.delayedCall(tempoPreso, () => {
      // Remove o ouvinte de posição
      this.scene.events.off("update", seguirOponente);

      // Reativa o movimento físico do oponente
      if (alvo.sprite && alvo.sprite.body) {
        alvo.sprite.body.moves = true;
      }

      // Animação da teia desfazendo/sumindo
      if (teiaPresa && teiaPresa.active) {
        teiaPresa.anims.play("spy_web_trap_end");
        teiaPresa.once("animationcomplete", () => {
          teiaPresa.destroy();
        });
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