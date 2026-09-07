import { destruirColisor, registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";
import { tocarSomSeguro } from "../../../Objetos/AudioSeguro.js";

export default class WebShot {
  constructor(personagem, special) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.aereo = false;
    this.projetil = null;
    this.encerrado = false;
    this.timer = null;
    this.colisorCenario = null;
    this.scene.events.once("shutdown", this.finalizarProjetil, this);
  }

  executar() {
    if (this.encerrado || this.projetil || this.timer) return;
    tocarSomSeguro(this.scene, "sp-WebBall_", { volume: 0.2 });
    this.timer = this.scene.time.delayedCall(400, () => {
      this.timer = null;
      this.criarProjetil();
    });
  }

  criarProjetil() {
    if (this.encerrado || this.projetil) return;
    if (!this.personagem.sprite?.active) {
      this.finalizarProjetil();
      return;
    }
    const sprite = this.personagem.sprite;
    const direcao = sprite.flipX ? -1 : 1;
    this.projetil = this.scene.physics.add.sprite(
      sprite.x + (this.aereo ? 25 : 30) * direcao,
      sprite.y - (this.aereo ? 10 : 60), "webshot", 4
    );
    tocarSomSeguro(this.scene, "webshot", { volume: 0.2 });
    this.scene.camHUD?.ignore(this.projetil);
    this.projetil.setFlipX(direcao < 0);
    if (this.aereo) this.projetil.setAngle(35 * direcao);
    this.projetil.anims.play("spy_webShot");
    this.projetil.body.setAllowGravity(false);
    this.projetil.body.debugBodyColor = 0xff0000;
    this.projetil.body.setSize(30, 30);
    this.projetil.body.setVelocity((this.aereo ? 500 : 600) * direcao, this.aereo ? 400 : 0);

    registrarAtaqueEspecial(this, this.projetil, {
      categoria: "projetil",
      aoColidir: () => this.finalizarProjetil(),
      aoAtingirAlvo: (alvo) => this.processarAcerto(alvo),
    });
    const plataformas = this.scene.mapaAtual?.plataformas || this.scene.plataformas || this.scene.chao;
    if (this.aereo && plataformas) {
      this.colisorCenario = this.scene.physics.add.collider(
        this.projetil, plataformas, () => this.finalizarProjetil()
      );
    }
  }

  processarAcerto(alvo) {
    if (this.encerrado) return;
    // A logica e dona das colisoes: encerra todas antes de descartar o projetil.
    this.finalizarProjetil();
    const props = this.special?.propriedades || {};
    const defendeu = alvo.receberDano(props.dano || 8, props);
    if (!defendeu && alvo.maquinaEstados && !alvo.estaPresoNaTeia && !alvo.imuneTeia) {
      this.prenderOponente(alvo);
    }
  }

  finalizarProjetil() {
    if (this.encerrado) return;
    this.encerrado = true;
    this.scene.events.off("shutdown", this.finalizarProjetil, this);
    this.timer?.remove(false);
    this.timer = null;
    destruirColisor(this.colisorCenario);
    this.colisorCenario = null;
    this.projetil?.destroy();
    this.projetil = null;
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
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
      alvo.sprite?.setVisible(true);

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
    if (this.projetil && Math.abs(this.projetil.x - this.personagem.sprite.x) > 1000) {
      this.finalizarProjetil();
    }
  }
}
