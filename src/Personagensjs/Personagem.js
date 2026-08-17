import GerenciadorEstados from "../Estados/GerenciadorEstados.js";
import EstadoIdle from "../Estados/EstadoIdle.js";
import EstadoWalk from "../Estados/EstadoWalk.js";
import EstadoJump from "../Estados/EstadoJump.js";
import EstadoDash from "../Estados/EstadoDash.js";
import EstadoCrouch from "../Estados/EstadoCrouch.js";
import EstadoAtack from "../Estados/EstadoAtack.js";
import EstadoDano from "../Estados/EstadoDano.js";
import EstadoSpecial from "../Estados/EstadoSpecial.js";
import EstadoTeia from "../Estados/EstadoTeia.js";
import EstadoGuard from "../Estados/EstadoGuard.js";

export default class Personagem {
  constructor(
    scene,
    x,
    y,
    keyAtlas,
    frameInicial,
    config = {},
    teclas,
    prefixoAnim,
    controle,
  ) {
    this.scene = scene;
    this.teclas = teclas;
    this.controle = controle;
    this.prefixoAnim = prefixoAnim;
    this.nomePersonagem = config.nome || "Lutador";
    this.porcentagemDano = 0;
    this.podeDash = true;
    this.cooldownDash = 500;
    this.estavaNoChao = true;
    this.tempoUltimoDash = 0;
    this.cooldownsAtaque = {};
    this.cooldownsSpecial = {};
    this.specials = {};
    this.logicasEspeciaisAtivas = [];

    // Atributos
    this.velocidade = config.velocidade;
    this.forcaPulo = config.forcaPulo;
    this.maxPulos = config.maxPulos;
    this.maxDash = config.maxDash;
    this.textoDano = null;
    this.guardMaximo = 50;
    this.vidaGuard = this.guardMaximo;
    this.taxaRegeneracaoGuard = 0.04; 
    this.tempoCooldownGuard = 3000;  
    this.tempoLiberacaoGuard = 0;

    // Sprite e física
    this.sprite = scene.physics.add.sprite(x, y, keyAtlas, frameInicial);
    this.sprite.setOrigin(0.5, 1);

    // Hurtbox (Área de recepção de dano)
    this.grupoHurtbox = scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.hurtboxesAtivas = [];

    // Contadores
    this.pulos = 0;
    this.dashs = 0;

    // Máquina de Estados (FSM)
    this.maquinaEstados = new GerenciadorEstados();
    this.maquinaEstados.adicionarEstado("idle", new EstadoIdle(this));
    this.maquinaEstados.adicionarEstado("walk", new EstadoWalk(this));
    this.maquinaEstados.adicionarEstado("jump", new EstadoJump(this));
    this.maquinaEstados.adicionarEstado("dash", new EstadoDash(this));
    this.maquinaEstados.adicionarEstado("crouch", new EstadoCrouch(this));
    this.maquinaEstados.adicionarEstado("atack", new EstadoAtack(this));
    this.maquinaEstados.adicionarEstado("dano", new EstadoDano(this));
    this.maquinaEstados.adicionarEstado("special", new EstadoSpecial(this));
    this.maquinaEstados.adicionarEstado("teia", new EstadoTeia(this));
    this.maquinaEstados.adicionarEstado("guard", new EstadoGuard(this));

    this.maquinaEstados.mudarEstado("idle");
  }

  // --- RECEBIMENTO DE DANO ---
  receberDano(quantidade, propriedades = {}) {
    // 🛡️ SE ESTIVER EM ESTADO DE GUARD:
    if (this.maquinaEstados.estadoAtual?.nome === "guard") {
      this.vidaGuard -= quantidade;

      // QUEBRA DE GUARDA:
      if (this.vidaGuard <= 0) {
        this.vidaGuard = 0; // Trava a vida em 0
        
        // Define que a guarda fica bloqueada por 3 segundos a partir de agora
        this.tempoLiberacaoGuard = this.scene.time.now + this.tempoCooldownGuard;

        // Entra no estado de Dano/Stun por 1 segundo
        this.maquinaEstados.mudarEstado("dano");
        const estadoDano = this.maquinaEstados.estados["dano"];
        if (estadoDano) {
          estadoDano.duracaoStun = 1000;
          estadoDano.tempoInicial = this.scene.time.now;
        }
        return false; // Escudo quebrou
      }

      // Repulsão de impacto leve ao defender o golpe
      const oponente = this.scene.jogador1 === this ? this.scene.jogador2 : this.scene.jogador1;
      const direcaoX = this.sprite.x > oponente.sprite.x ? 1 : -1;
      this.sprite.body.setVelocityX(direcaoX * 120);

      return true; // Bloqueado com sucesso
    }

    // LÓGICA PADRÃO DE DANO (Quando toma golpe fora do escudo)
    this.porcentagemDano += quantidade;
    if (this.textoDano) this.textoDano.setText(`${Math.floor(this.porcentagemDano)}%`);

    const oponente = this.scene.jogador1 === this ? this.scene.jogador2 : this.scene.jogador1;
    const direcaoX = this.sprite.x > oponente.sprite.x ? 1 : -1;

    const kbX = propriedades.knockbackX ?? 250;
    const kbY = propriedades.knockbackY ?? -100;

    this.sprite.body.setVelocity(
      direcaoX * kbX * (1 + this.porcentagemDano / 30),
      kbY * (1 + this.porcentagemDano / 150)
    );
    this.maquinaEstados.mudarEstado("dano");

    return false;
  }

  // --- LOOP PRINCIPAL ---
 update() {
    const noChao = this.sprite.body.blocked.down;

    if (noChao && !this.estavaNoChao) {
      this.pulos = 0;
      this.dashs = 0;
    }
    this.estavaNoChao = noChao;

    // --- LÓGICA REGENERATIVA DO ESCUDO ---
    const emGuarda = this.maquinaEstados.estadoAtual?.nome === "guard";
    const emCooldown = this.scene.time.now < this.tempoLiberacaoGuard;

    if (!emGuarda) {
      // 1. Se o escudo foi QUEBRADO, mas o tempo de cooldown ACABOU de terminar:
      if (!emCooldown && this.vidaGuard <= 0) {
        this.vidaGuard = this.guardMaximo; // ⚡ VOLTA 100% INTEIRO INSTANTANEAMENTE!
      } 
      // 2. Se o escudo NÃO foi quebrado, regenera rapidamente com o tempo:
      else if (!emCooldown && this.vidaGuard < this.guardMaximo) {
        this.vidaGuard = Math.min(
          this.guardMaximo,
          this.vidaGuard + this.taxaRegeneracaoGuard
        );
      }
    }

    // Gravidade ao cair
    if (!this.estaEmDash) {
      this.sprite.body.setGravityY(this.sprite.body.velocity.y > 0 ? 200 : 0);
    }

    this.controle?.atualizar();
    this.sincronizarHurtbox();
    this.processarMovimentacaoAtaque(noChao);
    this.atualizarOffsetFisica();
    this.atualizarLogicasEspeciais();

    this.maquinaEstados.update();
    this.controle?.salvarAnterior();
  }
  // --- MÉTODOS DE SUPORTE AO UPDATE ---

  // Pega a config atual baseada na animação tocando
  obterConfigAtual() {
    const animAtual = this.sprite.anims.currentAnim?.key || "";
    const chaveAnim = animAtual.replace(this.prefixoAnim, "");
    const chaveEstado = this.maquinaEstados.estadoAtual?.nome || "idle";

    return (
      this.configAnimacoes?.[chaveAnim] ||
      this.configAnimacoes?.[chaveEstado] ||
      {}
    );
  }

  sincronizarHurtbox() {
    const cfg = this.obterConfigAtual();
    const listaConfigs = cfg.hurtboxes || [];
    const direcaoOlhar = this.sprite.flipX ? -1 : 1;

    // Se o número de caixas mudou, reinicia a lista de caixas no Grupo
    if (this.hurtboxesAtivas.length !== listaConfigs.length) {
      this.destruirHurtboxes();

      listaConfigs.forEach(() => {
        const zone = this.scene.add.zone(0, 0, 1, 1).setOrigin(0.5, 1);
        this.grupoHurtbox.add(zone);
        zone.body.setAllowGravity(false);
        zone.body.setImmovable(true);
        zone.body.debugBodyColor = 0x00ff00;
        this.hurtboxesAtivas.push(zone);
      });
    }

    // Reposiciona cada hurtbox ativa
    this.hurtboxesAtivas.forEach((zone, index) => {
      const boxCfg = listaConfigs[index];
      const offX = boxCfg.offsetX ?? 0;
      const offY = boxCfg.offsetY ?? 0;

      zone.body.setSize(boxCfg.largura, boxCfg.altura);
      zone.setPosition(
        this.sprite.x + offX * direcaoOlhar,
        this.sprite.y + offY,
      );

      zone.body.setVelocity(
        this.sprite.body.velocity.x,
        this.sprite.body.velocity.y,
      );
    });
  }

  destruirHurtboxes() {
    this.hurtboxesAtivas.forEach((hb) => hb.destroy());
    this.hurtboxesAtivas = [];
    this.grupoHurtbox.clear(true, true);
  }

  processarMovimentacaoAtaque(noChao) {
    const estadoAtack = this.maquinaEstados.estados["atack"];
    if (this.maquinaEstados.estadoAtual !== estadoAtack) return;

    const impulsoX = estadoAtack.golpeAtual?.propriedades?.impulsoX || 0;

    if (noChao) {
      if (impulsoX === 0) this.sprite.setVelocityX(0);
    } else if (estadoAtack.tipoAtaqueAtual !== "air_side" && impulsoX === 0) {
      const esq = this.inputDown("esquerda");
      const dir = this.inputDown("direita");

      if (esq) this.sprite.setVelocityX(-this.velocidade);
      else if (dir) this.sprite.setVelocityX(this.velocidade);
      else this.sprite.setVelocityX(0);
    }

    // Sincroniza Hitbox Ofensiva do ataque
    if (estadoAtack.hitboxAtual?.active && estadoAtack.golpeAtual) {
      const direcaoOlhar = this.sprite.flipX ? -1 : 1;
      const golpe = estadoAtack.golpeAtual;
      estadoAtack.hitboxAtual.setPosition(
        this.sprite.x + golpe.offsetX * direcaoOlhar,
        this.sprite.y + golpe.offsetY,
      );
    }
  }

  atualizarOffsetFisica() {
    const cfg = this.obterConfigAtual();
    if (!cfg.largura || !this.sprite.body) return;

    this.sprite.body.setSize(cfg.largura, cfg.altura, false);

    const offsetX = this.sprite.flipX
      ? this.sprite.frame.realWidth - cfg.offsetX - cfg.largura
      : cfg.offsetX;

    this.sprite.body.setOffset(offsetX, cfg.offsetY);
  }

  inputDown(nome) {
    return this.controle?.estaApertado(nome) || !!this.teclas?.[nome]?.isDown;
  }

  inputJustDown(nome) {
    if (this.controle) return this.controle.acabouDeApertar(nome);
    return Phaser.Input.Keyboard.JustDown(this.teclas?.[nome]);
  }

  inputJustUp(nome) {
    if (this.controle) return this.controle.acabouDeSoltar(nome);
    return Phaser.Input.Keyboard.JustUp(this.teclas?.[nome]);
  }

  atualizarLogicasEspeciais() {
    this.logicasEspeciaisAtivas.forEach((logica) => {
      logica.atualizar?.();
    });
  }

  // --- AÇÕES E CONTROLES ---
  pular() {
    if (this.pulos >= this.maxPulos) return;

    this.sprite.setVelocityY(this.forcaPulo);
    this.pulos++;
    this.maquinaEstados.mudarEstado("jump");
  }

  podeDarDash() {
    const agora = this.scene.time.now;
    return (
      this.podeDash &&
      this.dashs < this.maxDash &&
      agora - this.tempoUltimoDash >= this.cooldownDash
    );
  }

  podeUsarAtaque(tipoAtaque) {
    const golpe = this.golpes?.[tipoAtaque];
    if (!golpe) return false;
    return this.scene.time.now >= (this.cooldownsAtaque[tipoAtaque] || 0);
  }

  iniciarCooldownAtaque(tipoAtaque) {
    const golpe = this.golpes?.[tipoAtaque];
    if (!golpe) return;
    this.cooldownsAtaque[tipoAtaque] =
      this.scene.time.now + (golpe.cooldown || 0);
  }

  iniciarCooldownSpecial(tipoSpecial) {
    const special = this.specials?.[tipoSpecial];

    if (!special) return;

    this.cooldownsSpecial[tipoSpecial] =
      this.scene.time.now + (special.cooldown || 0);
  }

  podeUsarSpecial(tipoSpecial) {
    const agora = this.scene.time.now;

    return (
      !this.cooldownsSpecial?.[tipoSpecial] ||
      agora >= this.cooldownsSpecial[tipoSpecial]
    );
  }

  aplicarConfiguracao(nomeAnim) {
    const cfg = this.configAnimacoes?.[nomeAnim];
    if (!cfg) return;

    if (cfg.escala) this.sprite.setScale(cfg.escala);
    this.atualizarOffsetFisica();

    if (this.hurtbox?.body) {
      const hL = cfg.hurtboxLargura || cfg.largura;
      const hA = cfg.hurtboxAltura || cfg.altura;
      this.hurtbox.body.setSize(hL, hA, false);
      this.hurtbox.body.setOffset(-hL / 2, -hA / 2);
    }
  }

  tocarAnimacao(nomeAnim, forcarRestart = false) {
    const chaveAnim = `${this.prefixoAnim}${nomeAnim}`;

    // 1. Se for a mesma animação e forçarRestart for true, REINICIA DO FRAME 0
    if (this.sprite.anims.currentAnim?.key === chaveAnim) {
      if (forcarRestart) {
        this.sprite.anims.restart();
        this.aplicarConfiguracao(nomeAnim);
      }
      return; // Se já estiver tocando e NÃO for para forçar, ignora
    }

    // 2. Se for uma animação totalmente diferente, toca normalmente
    this.sprite.play(chaveAnim, true);
    this.aplicarConfiguracao(nomeAnim);
  }

  criarHitboxAtaque(offsetX, offsetY, largura, altura, dadosAtaque) {
    if (this.hitboxAtiva) {
      this.hitboxAtiva.destroy();
    }

    this.hitboxOffset = { x: offsetX, y: offsetY };
    const direcao = this.sprite.flipX ? -1 : 1;
    const posX = this.sprite.x + offsetX * direcao;
    const posY = this.sprite.y + offsetY;

    const hitbox = this.scene.add.zone(posX, posY, largura, altura);
    this.scene.physics.add.existing(hitbox);

    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    hitbox.body.setVelocity(0, 0);
    hitbox.body.debugBodyColor = 0xff0000;

    this.hitboxAtiva = hitbox;
    hitbox.once("destroy", () => {
      this.hitboxAtiva = null;
    });

    return hitbox;
  }
}