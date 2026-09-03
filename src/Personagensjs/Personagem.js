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
import EstadoDead from "../Estados/EstadoDead.js";   
import EstadoTaunt from "../Estados/EstadoTaunt.js";
import EstadoUlt from "../Estados/EstadoUlt.js";
import GerenciadorVFX from "../Objetos/GerenciadorVFX.js";


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
    this.specialsAereosUsados = 0;
    this.maxSpecialsAereos = 2;
    this.specials = {};
    this.logicasEspeciaisAtivas = [];
    this.invulneravel = false;
    this.hiperArmaduraHits = 0;
    this.hiperArmaduraFonte = null;
    this.comboHitsRecebidos = 0;
    this.tempoUltimoHit = -Infinity;

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

    // sons
    this.sons = {
      pulo: ['jump1'],
      pouso: ['generic-landing1', 'generic-landing2'],
      dash: ['dash1', 'dash2'],
      
      // Adicionando os 9 passos para variá-los no jogo:
      passos: [
        'genericstep1', 'genericstep2', 'genericstep3',
        'genericstep4', 'genericstep5', 'genericstep6',
        'genericstep7', 'genericstep8', 'genericstep9'
      ],

      // Soco no ar / Wind:
      wind: ['punch12'],

      // Ataques Leves (Sorteia entre os socos leves declarados no Preload):
      light: [
        'punch1', 'punch2', 'punch3', 'punch4', 'punch5',
        'punch6', 'punch7', 'punch8', 'punch9', 'punch17',
        'punch18', 'punch19', 'punch22', 'punch23'
      ],

      // Ataques Pesados:
      heavy: [
        'punch10', 'punch11', 'punch13', 'punch14', 'punch15',
        'punch16', 'punch20', 'punch21', 'punch24'
      ]
    };

    // Sprite e física
    this.sprite = scene.physics.add.sprite(x, y, keyAtlas, frameInicial);
    this.sprite.setOrigin(0.5, 1);

    //efeitos visuais
    this.configVFX = {};
    this.vfx = new GerenciadorVFX(this);

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
    this.maquinaEstados.adicionarEstado("dead", new EstadoDead(this));
    this.maquinaEstados.adicionarEstado("taunt", new EstadoTaunt(this));
    this.maquinaEstados.adicionarEstado("ult", new EstadoUlt(this));

    this.maquinaEstados.mudarEstado("idle");
  }

 
   tocarSomSorteado(chavesAudio, config = {}) {
    if (!this.scene.sound || !chavesAudio) return;
    const lista = Array.isArray(chavesAudio) ? chavesAudio : [chavesAudio];
    if (lista.length === 0) return;

    const somSorteado = Phaser.Utils.Array.GetRandom(lista);

    // Proteção: Só toca se a chave realmente existir no cache do Phaser
    if (this.scene.cache.audio.exists(somSorteado)) {
        this.scene.sound.play(somSorteado, {
            volume: config.volume ?? 0.5,
            detune: Phaser.Math.Between(-50, 50),
            ...config
        });
    } else {
        console.warn(`Aviso: O som com a chave "${somSorteado}" não existe no cache do Preload.`);
    }
}


  // --- RECEBIMENTO DE DANO ---
  receberDano(quantidade, propriedades = {}, origem = null) {
    if (this.invulneravel) return true;

    //  SE ESTIVER EM ESTADO DE GUARD:
    if (this.maquinaEstados.estadoAtual?.nome === "guard") {
      this.vidaGuard -= quantidade;

      // QUEBRA DE GUARDA:
      if (this.vidaGuard <= 0) {
        this.vidaGuard = 0; // Trava a vida em 0
        
        // Define que a guarda fica bloqueada por 3 segundos
        this.tempoLiberacaoGuard = this.scene.time.now + this.tempoCooldownGuard;

        // Ao quebrar o escudo, zera a velocidade antes de dar o Stun
        this.sprite.body.setVelocity(0, 0);

        // Mudar para o estado de Dano
        this.ultimoImpacto = propriedades;

        this.maquinaEstados.mudarEstado("dano");
        
        // Sobrescreve a duração do Stun especificamente para a Quebra de Guarda (1 segundo)
        const estadoDano = this.maquinaEstados.estados["dano"];
        if (estadoDano) {
          estadoDano.duracaoStun = 1000;
          estadoDano.tempoInicial = this.scene.time.now;
        }
        return false; // Escudo quebrou
      }

      // Repulsão de impacto leve ao defender o golpe sem quebrar
      const oponente = this.scene.jogador1 === this ? this.scene.jogador2 : this.scene.jogador1;
      const direcaoX = origem?.direcao !== undefined
        ? origem.direcao
        : origem?.x !== undefined
          ? (this.sprite.x >= origem.x ? 1 : -1)
        : (oponente && this.sprite.x > oponente.sprite.x ? 1 : -1);
      this.sprite.body.setVelocityX(direcaoX * 120);

      return true; // Bloqueado com sucesso
    }

    //. LÓGICA PADRÃO DE DANO (Quando toma golpe sem escudo):
    this.porcentagemDano += quantidade;
    if (this.textoDano) this.textoDano.setText(`${Math.floor(this.porcentagemDano)}%`);

    // Hiper armadura recebe o dano normalmente, mas um número limitado de
    // golpes não aplica knockback nem interrompe o estado atual.
    if (this.hiperArmaduraHits > 0) {
      this.hiperArmaduraHits--;
      if (this.hiperArmaduraHits === 0) this.hiperArmaduraFonte = null;
      return false;
    }

    const oponente = this.scene.jogador1 === this ? this.scene.jogador2 : this.scene.jogador1;
    const direcaoX = origem?.direcao !== undefined
      ? origem.direcao * Math.sign(propriedades.knockbackX ?? 250)
      : origem?.x !== undefined
        ? (this.sprite.x >= origem.x ? 1 : -1)
      : (oponente && this.sprite.x > oponente.sprite.x ? 1 : -1);

    const kbX = propriedades.knockbackX ?? 250;
    const kbY = propriedades.knockbackY ?? -100;

    //  Salva se o golpe exige recuperação manual por comandos
    this.isTumbling = propriedades.tumbling ?? false;


    // =====================================================
    // KNOCKBACK FIXO OU VARIÁVEL
    // =====================================================
    const knockbackFixo = propriedades.knockbackFixo ?? false;

    let multiplicadorX = 1;
    let multiplicadorY = 1;

    if (!knockbackFixo) {
      // Até 180% o dano cresce normalmente.
      // Depois de 180% ele ainda cresce, mas muito mais devagar,
      // evitando o estouro absurdo que existia nas porcentagens altas.
      const danoEscalado = this.porcentagemDano <= 180
        ? this.porcentagemDano
        : 180 + (this.porcentagemDano - 180) * 0.20;

      // Mantém a lógica original do jogo:
      // - em porcentagem baixa o lançamento começa mais controlado;
      // - X cresce muito mais com o dano que Y;
      // - perto de 180% o lançamento já é muito forte.
      multiplicadorX = 0.65 + danoEscalado / 34;
      multiplicadorY = 0.65 + danoEscalado / 135;
    }

    this.sprite.body.setVelocity(
      direcaoX * Math.abs(kbX) * multiplicadorX,
      kbY * multiplicadorY
    );

    // O EstadoDano usa a velocidade já aplicada para calcular o hitstun.
    const agora = this.scene.time.now;
    const janelaCombo = propriedades.janelaCombo ?? 1100;
    this.comboHitsRecebidos = agora - this.tempoUltimoHit <= janelaCombo
      ? this.comboHitsRecebidos + 1
      : 1;
    this.tempoUltimoHit = agora;

    // Hitstun e knockback usam curvas diferentes. A raiz quadrada impede que
    // velocidades altas transformem um lançamento em incapacidade excessiva.
    const velocidadeImpacto = Math.hypot(
      Math.abs(kbX) * multiplicadorX,
      Math.abs(kbY) * multiplicadorY
    );
    const tumbling = propriedades.tumbling ?? false;
    const baseFrames = propriedades.hitstunBaseFrames ?? (tumbling ? 19 : 13);
    const porDano = Math.min(6, quantidade * (tumbling ? 0.3 : 0.45));
    const porImpacto = Math.sqrt(velocidadeImpacto) * (tumbling ? 0.48 : 0.18);
    let hitstunFrames = propriedades.hitstunFrames
      ?? baseFrames + porDano + porImpacto;

    const minimo = propriedades.hitstunMinFrames ?? (tumbling ? 22 : 14);
    const maximo = propriedades.hitstunMaxFrames ?? (tumbling ? 42 : 24);
    hitstunFrames = Phaser.Math.Clamp(hitstunFrames, minimo, maximo);

    // Preserva combos curtos e reduz progressivamente prisões de muitos hits.
    const hitsSemDecay = propriedades.hitsSemDecay ?? 3;
    const passosDecay = Math.max(0, this.comboHitsRecebidos - hitsSemDecay);
    const multiplicadorDecay = propriedades.ignorarHitstunDecay
      ? 1
      : Math.max(0.6, 1 - passosDecay * 0.1);
    hitstunFrames = Math.max(10, hitstunFrames * multiplicadorDecay);

    this.ultimoImpacto = {
      ...propriedades,
      hitstunCalculadoMs: hitstunFrames * (1000 / 60),
      comboHits: this.comboHitsRecebidos,
    };

    // DEPOIS MUDA PARA O ESTADO DE DANO
    this.maquinaEstados.mudarEstado("dano");

    return false;
  }

  // --- LOOP PRINCIPAL ---
 update() {
    const noChao = this.sprite.body.blocked.down;

    if (noChao && !this.estavaNoChao) {
      this.pulos = 0;
      this.dashs = 0;
      this.resetarCooldownsAereos();
      this.tocarSomSorteado(this.sons.pouso, { volume: 0.4 });
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

    // Mantem a gravidade durante todo o tumbling aereo, inclusive na subida.
    if (!this.estaEmDash) {
      const tumblingNoAr = this.isTumbling && !noChao;
      this.sprite.body.setGravityY(
        this.sprite.body.velocity.y > 0 || tumblingNoAr ? 200 : 0
      );
    }

    this.controle?.atualizar();
    this.sincronizarHurtbox();
    this.processarMovimentacaoAtaque(noChao);
    this.atualizarOffsetFisica();
    this.atualizarLogicasEspeciais();
    this.vfx?.atualizar();
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
  const estadoAtack =
    this.maquinaEstados.estados["atack"];

  if (
    this.maquinaEstados.estadoAtual !==
    estadoAtack
  ) {
    return;
  }

  const movimentoXAtivo =
    estadoAtack.movimentoAtaqueXAtivo;

  // =====================================================
  // MOVIMENTO DO PERSONAGEM
  // =====================================================

  if (!movimentoXAtivo) {
    if (noChao) {
      this.sprite.setVelocityX(0);
    } else {
      const esq =
        this.inputDown("esquerda");

      const dir =
        this.inputDown("direita");

      if (esq) {
        this.sprite.setVelocityX(
          -this.velocidade
        );
      } else if (dir) {
        this.sprite.setVelocityX(
          this.velocidade
        );
      } else {
        this.sprite.setVelocityX(0);
      }
    }
  }

  // =====================================================
  // HITBOX SEGUE O PERSONAGEM
  // =====================================================

  if (
    estadoAtack.hitboxAtual?.active &&
    estadoAtack.golpeAtual
  ) {
    const direcaoOlhar =
      this.sprite.flipX ? -1 : 1;

    const golpe =
      estadoAtack.golpeAtual;

    estadoAtack.hitboxAtual.setPosition(
      this.sprite.x +
        golpe.offsetX *
        direcaoOlhar,

      this.sprite.y +
        golpe.offsetY
    );
  }
}

  atualizarOffsetFisica() {
    const cfg = this.obterConfigAtual();
    if (!cfg.largura || !this.sprite.body) return;

    const body = this.sprite.body;

    body.setSize(cfg.largura, cfg.altura, false);

    const offsetX = this.centralizarCorpoFisicoX
      ? (this.sprite.frame.realWidth - cfg.largura) / 2
      : this.sprite.flipX
        ? this.sprite.frame.realWidth - cfg.offsetX - cfg.largura
        : cfg.offsetX;

    body.setOffset(offsetX, cfg.offsetY);
  }

 inputDown(nome) {
    if (this.controle) return this.controle.estaApertado(nome);
    const tecla = this.teclas?.[nome];
    return tecla ? !!tecla.isDown : false;
  }

  inputJustDown(nome) {
    if (this.controle) return this.controle.acabouDeApertar(nome);
    const tecla = this.teclas?.[nome];
    if (!tecla) return false;
    
    // SE FOR IA: lê a flag tratada pelo BotController sem passar pelo Phaser
    if (tecla.isVirtual) {
      return !!tecla.justDown;
    }
    
    // SE FOR TECLADO REAL: usa a checagem nativa do Phaser
    return Phaser.Input.Keyboard.JustDown(tecla);
  }

  inputJustUp(nome) {
    if (this.controle) return this.controle.acabouDeSoltar(nome);
    const tecla = this.teclas?.[nome];
    if (!tecla) return false;

    // SE FOR IA: lê a flag tratada pelo BotController
    if (tecla.isVirtual) {
      return !!tecla.justUp;
    }

    // SE FOR TECLADO REAL: usa a checagem nativa do Phaser
    return Phaser.Input.Keyboard.JustUp(tecla);
  }


  obterTipoAtaque() {
  const noChao = this.sprite.body.blocked.down;

  const cima = this.inputDown("cima");
  const baixo = this.inputDown("baixo");
  const lado =
    this.inputDown("esquerda") ||
    this.inputDown("direita");

  if (noChao) {
    // PRIORIDADE: CIMA > BAIXO > LADO > NEUTRO

    if (cima && this.golpes?.cima) {
      return "cima";
    }

    if (baixo && this.golpes?.agachado) {
      return "agachado";
    }

    if (lado && this.golpes?.side) {
      return "side";
    }

    return "neutro1";
  }

  // NO AR
  if (cima && this.golpes?.air_cima) {
    return "air_cima";
  }

  if (baixo && this.golpes?.air_agachado) {
    return "air_agachado";
  }

  if (lado && this.golpes?.air_side) {
    return "air_side";
  }

  return "air_neutro";
}


  obterTipoSpecial() {
  const noChao = this.sprite.body.blocked.down;

  const cima = this.inputDown("cima");
  const baixo = this.inputDown("baixo");
  const lado =
    this.inputDown("esquerda") ||
    this.inputDown("direita");

  const existe = (tipo) => {
    const special = this.specials?.[tipo];

    return (
      special &&
      special.animacao
    );
  };

  if (noChao) {
    // PRIORIDADE: CIMA > BAIXO > LADO > NEUTRO

    if (cima && existe("cima")) {
      return "cima";
    }

    if (baixo && existe("agachado")) {
      return "agachado";
    }

    if (lado && existe("lado")) {
      return "lado";
    }

    return "neutro";
  }

  // NO AR
  if (cima && existe("air_cima")) {
    return "air_cima";
  }

  if (baixo && existe("air_agachado")) {
    return "air_agachado";
  }

  if (lado && existe("air_lado")) {
    return "air_lado";
  }

  return "air_neutro";
}

  atualizarLogicasEspeciais() {
    this.logicasEspeciaisAtivas.forEach((logica) => {
      logica.atualizar?.();
    });
  }

  // --- AÇÕES E CONTROLES ---
  pular() {
    // Permite pular enquanto o contador for menor que o máximo permitido
    if (this.pulos >= this.maxPulos) return;

    this.sprite.setVelocityY(this.forcaPulo);
    this.pulos++;

    // Toca o som em TODOS os pulos (primeiro, duplo, triplo, etc.)
    this.tocarSomSorteado(this.sons.pulo, { volume: 0.4 });

    // Força o reinício da animação/estado de pulo para dar feedback visual e sonoro
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

  resetarCooldownsAereos() {
    this.specialsAereosUsados = 0;

    Object.keys(this.cooldownsAtaque).forEach((tipoAtaque) => {
      if (tipoAtaque.startsWith("air_")) {
        delete this.cooldownsAtaque[tipoAtaque];
      }
    });

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
    const specialAereo = tipoSpecial?.startsWith("air_");

    if (
      specialAereo &&
      this.specialsAereosUsados >= this.maxSpecialsAereos
    ) {
      return false;
    }

    return (
      !this.cooldownsSpecial?.[tipoSpecial] ||
      agora >= this.cooldownsSpecial[tipoSpecial]
    );
  }

  registrarUsoSpecialAereo(tipoSpecial) {
    if (tipoSpecial?.startsWith("air_")) {
      this.specialsAereosUsados++;
    }
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
      this.hitboxAtiva = null;
    }

    this.hitboxOffset = { x: offsetX, y: offsetY };
    const direcao = this.sprite.flipX ? -1 : 1;
    const posX = this.sprite.x + offsetX * direcao;
    const posY = this.sprite.y + offsetY;

    const hitbox = this.scene.add.zone(posX, posY, largura, altura);
    this.scene.physics.add.existing(hitbox);

    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    
   
    hitbox.body.debugBodyColor = 0xff0000;

    this.hitboxAtiva = hitbox;
    return hitbox;
  }
}
