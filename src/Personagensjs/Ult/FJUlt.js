import { registrarAtaqueEspecial } from "../../Objetos/SistemaCombateEspecial.js";

const TEMPO_FOCO = 300;
const TEMPO_VOO = 6000;
const DESCIDA_LEVITACAO = 55;
const VELOCIDADE_SUBIDA_ULT = 850;
const VELOCIDADE_CENTRO_ULT = 600;
const GRAVIDADE_SUBIDA_ULT = -500;
const COMPENSACAO_GRAVIDADE_LEVITACAO = -900;
const IMPULSO_MERGULHO = 1750;
import { gerarQuadrosUltimateBackground } from "../../Objetos/QuadrosUltimateBackground.js";

const HITBOX_MERGULHO = { largura: 130, altura: 180, offsetY: -100 };
const HITBOX_EXPLOSAO = { largura: 230, altura: 120, offsetY: -60 };
const DANO_EXPLOSAO = 90;

export default class FJUlt {
  constructor(personagem, config, estadoFSM) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.config = config;
    this.estadoFSM = estadoFSM;
    this.cancelada = false;
    this.finalizada = false;
    this.timers = new Set();
    this.sprites = new Set();
    this.hitboxMergulho = null;
    this.registroMergulho = null;
    this.registroExplosao = null;
    this.alvosAtingidos = new Set();
    this.visibilidadePersonagens = [];
    this.visibilidadePlataformas = [];
    this.estadoAlvoCarregado = null;
    this.fundoUlt = null;
    this.hurtboxesHabilitadas = new Map();
  }

  executar() {
    const sprite = this.personagem.sprite;
    if (!sprite?.active || !sprite.body) {
      this.finalizar();
      return;
    }

    const cam = this.scene.cameras.main;
    this.zoomOriginal = cam.zoom;
    this.scrollOriginal = { x: cam.scrollX, y: cam.scrollY };
    this.physicsPausadaAntes = this.scene.physics.world.isPaused;
    this.funcaoCameraOriginal = this.scene.atualizarCamera;
    this.scene.atualizarCamera = () => {};
    this.desativarHurtboxes();
    this.esconderCenario();
    this.ativarFundoUltimate();
    this.scene.physics.pause();
    sprite.body.setVelocity(0, 0);
    sprite.body.setAllowGravity(false);
    sprite.anims.stop();

    cam.stopFollow();
    cam.pan(sprite.x, sprite.y - 55, TEMPO_FOCO, "Power2");
    cam.zoomTo(this.zoomOriginal * 1.7, TEMPO_FOCO);
    this.agendar(TEMPO_FOCO, () => this.iniciarTelaVermelha());
  }

  esconderCenario() {
    const fundo = this.scene.mapaAtual?.imagemFundo;
    this.fundoOriginal = fundo ?? null;
    this.visibilidadeFundo = fundo?.visible ?? true;
    fundo?.setVisible(false);

    const mapa = this.scene.mapaAtual;
    const plataformas = [
      ...(mapa?.plataformas?.getChildren?.() ?? []),
      ...(this.scene.sistemaPlataformasAtravessaveis?.grupo?.getChildren?.() ?? []),
      ...(mapa?.objetosTeloes ?? []),
      mapa?.suportePlataforma,
    ].filter(Boolean);
    this.visibilidadePlataformas = plataformas.map((objeto) => ({ objeto, visible: objeto.visible }));
    plataformas.forEach((objeto) => objeto.setVisible(false));

    const personagens = [this.scene.jogador1, this.scene.jogador2, this.scene.jogador3,
      this.scene.jogador4, this.scene.boss].filter((alvo) => alvo && alvo !== this.personagem);
    this.visibilidadePersonagens = personagens.map((alvo) => ({
      sprite: alvo.sprite,
      visible: alvo.sprite?.visible ?? true,
    }));
    this.visibilidadePersonagens.forEach(({ sprite }) => sprite?.setVisible(false));
  }

  ativarFundoUltimate() {
    if (this.fundoUlt?.active || !this.scene.textures.exists("ultimateback1")) return;
    if (!this.scene.anims.exists("fj_ultimateback")) {
      this.scene.anims.create({
        key: "fj_ultimateback",
        frames: gerarQuadrosUltimateBackground(this.scene),
        frameRate: 36,
        repeat: -1,
      });
    }
    this.fundoUlt = this.scene.add.sprite(0, 0, "ultimateback1", 0);
    this.fundoUlt.setDepth((this.fundoOriginal?.depth ?? -100) + 1);
    this.fundoUlt.setScrollFactor(1);
    this.fundoUlt.play("fj_ultimateback");
    this.scene.camHUD?.ignore(this.fundoUlt);
    this.ajustarFundoNaCamera();
  }

  ajustarFundoNaCamera() {
    if (!this.fundoUlt?.active) return;
    const cam = this.scene.cameras.main;
    this.fundoUlt.setPosition(cam.midPoint.x, cam.midPoint.y);
    this.fundoUlt.setDisplaySize(cam.width / cam.zoom, cam.height / cam.zoom);
  }

  desativarHurtboxes() {
    this.personagem.hurtboxesAtivas?.forEach((hurtbox) => {
      if (!hurtbox?.active || !hurtbox.body) return;
      if (!this.hurtboxesHabilitadas.has(hurtbox)) {
        this.hurtboxesHabilitadas.set(hurtbox, hurtbox.body.enable);
      }
      hurtbox.body.enable = false;
    });
  }

  restaurarHurtboxes() {
    this.hurtboxesHabilitadas.forEach((habilitada, hurtbox) => {
      if (hurtbox?.active && hurtbox.body) hurtbox.body.enable = habilitada;
    });
    this.hurtboxesHabilitadas.clear();
  }

  iniciarTelaVermelha() {
    if (this.cancelada) return;
    const cam = this.scene.cameras.main;
    this.retanguloVermelho = this.scene.add.image(cam.midPoint.x, cam.midPoint.y, "FJ-red");
    this.retanguloVermelho.setScrollFactor(1).setDepth(100000);
    this.eyes = this.scene.add.sprite(cam.midPoint.x, cam.midPoint.y, "FJ-eyes", 0);
    this.eyes.setScrollFactor(1).setDepth(100001);
    this.scene.camHUD?.ignore([this.retanguloVermelho, this.eyes]);
    this.sprites.add(this.retanguloVermelho);
    this.sprites.add(this.eyes);
    this.ajustarTelaUltimate();
    this.eyes.once("animationcomplete-fj_ult_eyes", () => this.iniciarPrepare());
    this.eyes.play("fj_ult_eyes");
  }

  iniciarPrepare() {
    if (this.cancelada) return;
    this.removerSprite(this.retanguloVermelho);
    this.removerSprite(this.eyes);
    this.retanguloVermelho = null;
    this.eyes = null;

    const sprite = this.personagem.sprite;
    this.personagem.aplicarConfiguracao("idle");
    sprite.anims.play("fj_prepare", true);
    sprite.once("animationcomplete-fj_prepare", this.aoTerminarParteIntro, this);

    const efeito = this.scene.add.sprite(sprite.x, sprite.y - 85, "FJ_ultN", 0);
    efeito.setScale(0.5).setAlpha(0.65).setDepth(sprite.depth + 1);
    this.scene.camHUD?.ignore(efeito);
    this.sprites.add(efeito);
    efeito.once("animationcomplete-fj_ultN", () => {
      this.removerSprite(efeito);
      this.aoTerminarParteIntro();
    });
    efeito.play("fj_ultN");
    this.scene.tweens.add({
      targets: efeito,
      alpha: 0,
      delay: 200,
      duration: 600,
      ease: "Quad.easeOut",
    });
    this.partesIntroTerminadas = 0;
  }

  aoTerminarParteIntro() {
    this.partesIntroTerminadas = (this.partesIntroTerminadas ?? 0) + 1;
    if (this.partesIntroTerminadas === 2) this.iniciarVoo();
  }

  iniciarVoo() {
    if (this.cancelada) return;
    const sprite = this.personagem.sprite;
    const body = sprite.body;
    this.restaurarCenario();
    if (!this.physicsPausadaAntes) this.scene.physics.resume();
    const cam = this.scene.cameras.main;
    cam.setZoom(this.zoomOriginal);
    cam.setScroll(this.scrollOriginal.x, this.scrollOriginal.y);
    this.scene.atualizarCamera = this.funcaoCameraOriginal;
    this.vooIniciado = true;

    this.personagem.pular({ mudarEstado: false });
    const baseCorpoY = body.bottom;
    this.personagem.aplicarConfiguracao("jump");
    body.updateFromGameObject();
    sprite.y += baseCorpoY - body.bottom;
    body.updateFromGameObject();
    body.setAllowGravity(true);
    body.setGravityY(GRAVIDADE_SUBIDA_ULT);
    body.setVelocityY(-VELOCIDADE_SUBIDA_ULT);
    sprite.play("fj_jump", true);
    const limitesArena = this.scene.mapaAtual?.configCamera?.limites;
    const plataformas = this.scene.mapaAtual?.plataformas?.getChildren?.() ?? [];
    const pisoPrincipal = plataformas
      .filter((plataforma) => plataforma.body?.enable)
      .sort((a, b) => b.body.width - a.body.width)[0];
    const alturaVisivel = cam.height / cam.zoom;
    this.alvoVoo = {
      x: limitesArena
        ? limitesArena.x + limitesArena.largura / 2
        : cam.scrollX + cam.width / cam.zoom / 2,
      y: pisoPrincipal
        ? pisoPrincipal.body.top - alturaVisivel * 0.55
        : cam.scrollY + alturaVisivel * 0.2,
    };
    this.subindoUlt = true;
  }

  iniciarMergulho() {
    if (this.cancelada || this.mergulhando) return;
    this.emVoo = false;
    this.mergulhando = true;
    this.tweenVoo?.stop();
    const sprite = this.personagem.sprite;
    const body = sprite.body;
    body.setAllowGravity(true);
    body.setGravityY(0);
    const baseCorpoY = body.bottom;
    this.personagem.aplicarConfiguracao("idle");
    body.updateFromGameObject();
    sprite.y += baseCorpoY - body.bottom;
    body.updateFromGameObject();
    body.setVelocity(0, IMPULSO_MERGULHO);
    sprite.play("fj_ult_dive", true);

    this.hitboxMergulho = this.scene.add.zone(
      sprite.x,
      sprite.y + HITBOX_MERGULHO.offsetY,
      HITBOX_MERGULHO.largura,
      HITBOX_MERGULHO.altura,
    );
    this.scene.physics.add.existing(this.hitboxMergulho);
    this.hitboxMergulho.body.setAllowGravity(false);
    this.hitboxMergulho.body.setImmovable(true);
    this.hitboxMergulho.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(this.hitboxMergulho);
    this.registroMergulho = registrarAtaqueEspecial(this, this.hitboxMergulho, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.prenderAlvoNoMergulho(alvo),
    });
  }

  prenderAlvoNoMergulho(alvo) {
    if (this.estadoAlvoCarregado || alvo.invulneravel || alvo.sprite?.body?.blocked?.down || !alvo.sprite?.body) return;
    const sprite = alvo.sprite;
    this.estadoAlvoCarregado = {
      alvo,
      moves: sprite.body.moves,
      velocityX: sprite.body.velocity.x,
      velocityY: sprite.body.velocity.y,
      gravity: sprite.body.allowGravity,
      animacaoPausada: sprite.anims.isPaused,
      updateFSM: alvo.maquinaEstados?.update,
    };
    sprite.body.moves = false;
    sprite.body.setVelocity(0, 0);
    sprite.anims.pause();
    if (alvo.maquinaEstados) alvo.maquinaEstados.update = () => {};
  }

  atualizar() {
    if (this.cancelada || this.finalizada) return;
    this.desativarHurtboxes();
    this.ajustarFundoNaCamera();
    this.ajustarTelaUltimate();

    if (this.emVoo) {
      const sprite = this.personagem.sprite;
      sprite.body.setGravityY(COMPENSACAO_GRAVIDADE_LEVITACAO);
      if (this.personagem.inputDown("esquerda")) sprite.setVelocityX(-this.personagem.velocidade);
      else if (this.personagem.inputDown("direita")) sprite.setVelocityX(this.personagem.velocidade);
      else sprite.setVelocityX(0);
      if (this.personagem.inputJustDown("atack") || this.scene.time.now >= this.fimVoo) {
        this.iniciarMergulho();
      }
    }

    if (this.subindoUlt) {
      const sprite = this.personagem.sprite;
      const body = sprite.body;
      body.setGravityY(GRAVIDADE_SUBIDA_ULT);
      const dx = this.alvoVoo.x - sprite.x;
      body.setVelocityX(Math.abs(dx) < 12 ? 0 : Math.sign(dx) * VELOCIDADE_CENTRO_ULT);
      if (sprite.y <= this.alvoVoo.y && Math.abs(dx) < 12) {
        sprite.y = this.alvoVoo.y;
        body.updateFromGameObject();
        body.setVelocity(0, DESCIDA_LEVITACAO / (TEMPO_VOO / 1000));
        body.setAllowGravity(false);
        body.setGravityY(0);
        this.subindoUlt = false;
        this.emVoo = true;
        this.fimVoo = this.scene.time.now + TEMPO_VOO;
        sprite.play("fj_jump_float", true);
      }
    }

    if (this.mergulhando) {
      const sprite = this.personagem.sprite;
      if (this.hitboxMergulho?.active) {
        this.hitboxMergulho.setPosition(sprite.x, sprite.y + HITBOX_MERGULHO.offsetY);
        this.hitboxMergulho.body.updateFromGameObject();
      }
      if (this.estadoAlvoCarregado) {
        const { alvo } = this.estadoAlvoCarregado;
        if (alvo?.sprite?.active) {
          alvo.sprite.setPosition(sprite.x, sprite.y - 70);
          alvo.sincronizarHurtbox?.();
        } else {
          this.liberarAlvoCarregado();
        }
      }
      if (sprite.body.blocked.down) this.iniciarImpacto();
    }
    if (this.impactou && this.hitboxExplosao?.active) {
      this.hitboxExplosao.setPosition(
        this.personagem.sprite.x,
        this.personagem.sprite.y + HITBOX_EXPLOSAO.offsetY,
      );
      this.hitboxExplosao.body.updateFromGameObject();
    }
  }

  iniciarImpacto() {
    if (!this.mergulhando || this.impactou) return;
    this.impactou = true;
    this.mergulhando = false;
    const sprite = this.personagem.sprite;
    this.assentarNoChao();
    this.registroMergulho?.remover();
    this.registroMergulho = null;
    this.hitboxMergulho?.destroy();
    this.hitboxMergulho = null;
    sprite.play("fj_ult_land", true);
    sprite.anims.pause();
    this.agendar(600, () => {
      if (sprite.active && sprite.anims.isPaused) sprite.anims.resume();
    });
    sprite.once("animationcomplete-fj_ult_land", () => {
      this.animacaoPousoTerminou = true;
      this.verificarFimImpacto();
    });

    const explosao = this.scene.add.sprite(sprite.x, sprite.y - 190, "FJ-ultExplosion", 0);
    explosao.setScale(0.75).setAlpha(0.55).setDepth(sprite.depth + 2);
    this.scene.camHUD?.ignore(explosao);
    this.sprites.add(explosao);
    explosao.once("animationcomplete-fj_ult_explosion", () => {
      this.removerSprite(explosao);
      this.animacaoExplosaoTerminou = true;
      this.verificarFimImpacto();
    });
    explosao.play("fj_ult_explosion");
    this.scene.tweens.add({
      targets: explosao,
      alpha: 0,
      delay: 250,
      duration: 1750,
      ease: "Quad.easeOut",
    });

    const hitbox = this.scene.add.zone(
      sprite.x,
      sprite.y + HITBOX_EXPLOSAO.offsetY,
      HITBOX_EXPLOSAO.largura,
      HITBOX_EXPLOSAO.altura,
    );
    this.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);
    hitbox.body.debugBodyColor = 0xff0000;
    this.scene.camHUD?.ignore(hitbox);
    this.registroExplosao = registrarAtaqueEspecial(this, hitbox, {
      categoria: "corpo",
      contraAtacarDono: true,
      aoAtingirAlvo: (alvo) => this.danificarNaExplosao(alvo, hitbox),
    });
    this.hitboxExplosao = hitbox;
    this.liberarAlvoCarregado();
  }

  danificarNaExplosao(alvo, hitbox) {
    if (this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    const p = this.personagem.sprite;
    alvo.receberDano(DANO_EXPLOSAO, {
      tipoSomImpacto: "heavy",
      knockbackX: 1600,
      knockbackY: -2300,
      knockbackFixo: true,
      tumbling: true,
    }, { direcao: alvo.sprite.x < p.x ? -1 : 1, x: p.x, y: p.y });
    if (this.alvosAtingidos.size === 1) {
      const som = this.personagem.sons?.heavy;
      if (som) this.personagem.tocarSomSorteado(som, { volume: 0.35 });
    }
  }

  assentarNoChao() {
    const sprite = this.personagem.sprite;
    const body = sprite.body;
    const plataformas = [
      ...(this.scene.mapaAtual?.plataformas?.getChildren?.() ?? []),
      ...(this.scene.sistemaPlataformasAtravessaveis?.grupo?.getChildren?.() ?? []),
    ];
    const apoio = plataformas
      .filter((plataforma) => plataforma.active !== false && plataforma.body?.enable)
      .filter((plataforma) => body.right > plataforma.body.left && body.left < plataforma.body.right)
      .filter((plataforma) => plataforma.body.top >= body.bottom - 32)
      .sort((a, b) => Math.abs(a.body.top - body.bottom) - Math.abs(b.body.top - body.bottom))[0];
    this.alturaChaoUlt = apoio?.body.top ?? body.bottom;
    sprite.y += this.alturaChaoUlt - body.bottom;
    body.updateFromGameObject();
    body.setAllowGravity(false);
    body.setGravityY(0);
    body.setVelocity(0, 0);
    body.blocked.down = true;
    body.touching.down = true;
  }

  confirmarContatoChao() {
    const sprite = this.personagem.sprite;
    const body = sprite?.body;
    if (!body || this.alturaChaoUlt === undefined) return;
    sprite.y += this.alturaChaoUlt - body.bottom;
    body.updateFromGameObject();
    body.blocked.down = true;
    body.touching.down = true;
    body.setVelocity(0, 0);
  }

  verificarFimImpacto() {
    if (!this.animacaoPousoTerminou || !this.animacaoExplosaoTerminou) return;
    this.registroExplosao?.remover();
    this.hitboxExplosao?.destroy();
    this.registroExplosao = null;
    this.hitboxExplosao = null;
    this.finalizar();
  }

  liberarAlvoCarregado() {
    const salvo = this.estadoAlvoCarregado;
    if (!salvo) return;
    const { alvo } = salvo;
    if (alvo?.sprite?.body) {
      alvo.sprite.body.moves = salvo.moves;
      alvo.sprite.body.setAllowGravity(salvo.gravity);
      alvo.sprite.body.setVelocity(0, 0);
      if (!salvo.animacaoPausada) alvo.sprite.anims.resume();
      if (alvo.maquinaEstados) alvo.maquinaEstados.update = salvo.updateFSM;
      alvo.sincronizarHurtbox?.();
    }
    this.estadoAlvoCarregado = null;
  }

  ajustarTelaUltimate() {
    const cam = this.scene.cameras.main;
    if (this.retanguloVermelho?.active) {
      this.retanguloVermelho.setPosition(cam.midPoint.x, cam.midPoint.y);
      const larguraVisivel = cam.width / cam.zoom;
      const alturaVisivel = cam.height / cam.zoom;
      this.retanguloVermelho.setDisplaySize(larguraVisivel, alturaVisivel * 0.32);
    }
    if (this.eyes?.active) {
      this.eyes.setPosition(cam.midPoint.x, cam.midPoint.y);
      const larguraVisivel = cam.width / cam.zoom;
      const alturaVisivel = cam.height / cam.zoom;
      const larguraOlhos = Math.min(larguraVisivel * 0.9, alturaVisivel * 0.28 * (1410 / 250));
      this.eyes.setDisplaySize(larguraOlhos, larguraOlhos * (250 / 1410));
    }
  }

  restaurarCenario() {
    if (this.fundoOriginal?.active) this.fundoOriginal.setVisible(this.visibilidadeFundo);
    this.fundoUlt?.destroy();
    this.fundoUlt = null;
    this.visibilidadePlataformas.forEach(({ objeto, visible }) => {
      if (objeto?.active) objeto.setVisible(visible);
    });
    this.visibilidadePersonagens.forEach(({ sprite, visible }) => {
      if (sprite?.active) sprite.setVisible(visible);
    });
    this.visibilidadePlataformas = [];
    this.visibilidadePersonagens = [];
  }

  removerSprite(sprite) {
    if (!sprite) return;
    this.sprites.delete(sprite);
    if (sprite.active) sprite.destroy();
  }

  agendar(delay, callback) {
    const timer = this.scene.time.delayedCall(delay, () => {
      this.timers.delete(timer);
      if (!this.cancelada) callback();
    });
    this.timers.add(timer);
    return timer;
  }

  finalizar() {
    if (this.finalizada) return;
    this.finalizada = true;
    this.limpar();
    this.estadoFSM.finalizarUlt();
    if (this.impactou) {
      this.personagem.aplicarConfiguracao("idle");
      this.confirmarContatoChao();
      const body = this.personagem.sprite.body;
      body.setAllowGravity(false);
      body.setGravityY(0);
      body.setVelocity(0, 0);
      body.blocked.down = true;
      body.touching.down = true;
      this.scene.time.delayedCall(50, () => {
        const sprite = this.personagem.sprite;
        if (!sprite?.active || !sprite.body) return;
        this.confirmarContatoChao();
        sprite.body.setAllowGravity(true);
        sprite.body.setGravityY(0);
      });
    }
  }

  cancelar() {
    if (this.finalizada || this.cancelada) return;
    this.cancelada = true;
    this.limpar();
  }

  limpar() {
    this.timers.forEach((timer) => timer.remove(false));
    this.timers.clear();
    this.tweenVoo?.stop();
    const sprite = this.personagem.sprite;
    sprite.off("animationcomplete-fj_prepare", this.aoTerminarParteIntro, this);
    sprite.off("animationcomplete-fj_ult_land");
    this.registroMergulho?.remover();
    this.registroExplosao?.remover();
    this.hitboxMergulho?.destroy();
    this.hitboxExplosao?.destroy();
    this.hitboxMergulho = null;
    this.hitboxExplosao = null;
    this.liberarAlvoCarregado();
    this.sprites.forEach((efeito) => { if (efeito.active) efeito.destroy(); });
    this.sprites.clear();
    this.restaurarCenario();
    this.restaurarHurtboxes();
    this.scene.atualizarCamera = this.funcaoCameraOriginal;
    const cam = this.scene.cameras.main;
    if (cam?.active) {
      cam.resetFX();
      if (this.zoomOriginal !== undefined) cam.setZoom(this.zoomOriginal);
      if (!this.vooIniciado) {
        cam.setScroll(this.scrollOriginal?.x ?? cam.scrollX, this.scrollOriginal?.y ?? cam.scrollY);
      }
    }
    if (!this.physicsPausadaAntes) this.scene.physics.resume();
    if (sprite?.body) {
      this.confirmarContatoChao();
      sprite.body.setAllowGravity(true);
      sprite.body.setGravityY(0);
    }
  }
}
