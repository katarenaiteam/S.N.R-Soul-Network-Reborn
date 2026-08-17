import EstadoBase from "./EstadoBase.js";

export default class EstadoGuard extends EstadoBase {
  constructor(personagem) {
    super(personagem);
    this.esferaVisual = null;
  }

  enter() {
    const agora = this.personagem.scene.time.now;

    // 1. IMPEDE DE ENTRAR se estiver em Cooldown (carimbo de tempo do Personagem)
    // OU se o escudo estiver com vida zerada
    if (agora < this.personagem.tempoLiberacaoGuard || this.personagem.vidaGuard <= 0) {
      this.sairParaEstadoPadrao();
      return;
    }

    // 2. Trava movimento e toca animação
    this.personagem.tocarAnimacao("guard");
    this.personagem.sprite.setVelocityX(0);

    // 3. Desenha o escudo visual
    this.criarEsferaVisual();
  }

  execute() {
    // A) Se o escudo zerou (foi quebrado via receberDano), sai imediatamente
    if (this.personagem.vidaGuard <= 0) {
      this.sairParaEstadoPadrao();
      return;
    }

    // B) Se soltou o botão de defesa, sai da guarda
    const segurandoGuard = this.personagem.inputDown("guard");
    if (!segurandoGuard) {
      this.sairParaEstadoPadrao();
      return;
    }

    // C) Freia o recuo causado pelo impacto de golpes no escudo
    if (this.personagem.sprite.body) {
      this.personagem.sprite.body.setVelocityX(
        this.personagem.sprite.body.velocity.x * 0.8
      );
    }

    // D) Atualiza o tamanho e posição da esfera visual
    this.atualizarEsferaVisual();
  }

  exit() {
    this.destruirEsferaVisual();
  }

  sairParaEstadoPadrao() {
    if (this.personagem.sprite.body.blocked.down) {
      this.personagem.maquinaEstados.mudarEstado("idle");
    } else {
      this.personagem.maquinaEstados.mudarEstado("jump");
    }
  }

  // --- ESFERA VISUAL QUE ENCOLHE COM DANO ---

  criarEsferaVisual() {
    this.destruirEsferaVisual();

    const cena = this.personagem.scene;
    this.esferaVisual = cena.add.graphics();

    if (cena.camHUD) {
      cena.camHUD.ignore(this.esferaVisual);
    }

    this.atualizarEsferaVisual();
  }

  atualizarEsferaVisual() {
    if (!this.esferaVisual) return;

    this.esferaVisual.clear();

    // O raio encolhe dinamicamente conforme a vida restante da guarda
    const proporcaoVida = Math.max(
      0.15,
      this.personagem.vidaGuard / this.personagem.guardMaximo
    );
    const raio = 45 * proporcaoVida;

    this.esferaVisual.fillStyle(0x00ffff, 0.35); // Ciano semi-transparente
    this.esferaVisual.lineStyle(2, 0xffffff, 0.8); // Borda branca
    this.esferaVisual.fillCircle(0, 0, raio);
    this.esferaVisual.strokeCircle(0, 0, raio);

    this.esferaVisual.setPosition(
      this.personagem.sprite.x,
      this.personagem.sprite.y - 40
    );
    this.esferaVisual.setDepth(this.personagem.sprite.depth + 1);
  }

  destruirEsferaVisual() {
    if (this.esferaVisual) {
      this.esferaVisual.destroy();
      this.esferaVisual = null;
    }
  }
}