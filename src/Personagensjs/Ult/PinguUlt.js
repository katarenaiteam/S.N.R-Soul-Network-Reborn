import { gerarQuadrosUltimateBackground } from "../../Objetos/QuadrosUltimateBackground.js";
import { registrarAtaqueEspecial } from "../../Objetos/SistemaCombateEspecial.js";

const DURACAO_POSE = 2800;
const DURACAO_ZOOM = 850;
const DURACAO_CHUVA = 6000;
const INTERVALO_METEOROS = 190;

export default class PinguUlt {
  constructor(personagem, config, estadoFSM) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.config = config;
    this.estadoFSM = estadoFSM;
    this.cancelada = false;
    this.finalizada = false;
    this.finalizando = false;
    this.timers = new Set();
    this.projeteis = new Set();
    this.spritesUlt = new Set();
    this.estadoAtores = [];
    this.estadoVisibilidadeCenario = [];
    this.efeitosCenario = [];
    this.fundoUlt = null;
    this.focaChegando = null;
    this.focaDancando = null;
  }

  executar() {
    const sprite = this.personagem.sprite;
    if (!sprite?.active || !sprite.body) {
      this.estadoFSM.finalizarUlt();
      return;
    }

    const camera = this.scene.cameras.main;
    this.zoomOriginal = camera.zoom;
    this.centroOriginal = { x: camera.midPoint.x, y: camera.midPoint.y };
    this.movesOriginalPingu = sprite.body.moves;
    this.funcaoCameraOriginal = this.scene.atualizarCamera;
    this.physicsPausadaAntes = this.scene.physics.world.isPaused;
    this.scene.atualizarCamera = () => {};
    camera.stopFollow();

    this.congelarAtores();
    this.esconderCenario();
    this.ativarFundoUltimate();
    this.scene.physics.pause();

    sprite.body.setVelocity(0, 0);
    sprite.body.setAllowGravity(false);
    sprite.anims.play("pingu_ultPose", true);
    this.personagem.aplicarConfiguracao("ultPose");

    camera.pan(sprite.x, sprite.y - 35, 250, "Power2");
    camera.zoomTo(this.zoomOriginal * 1.45, 250);
    this.enviarFoca();
    this.agendar(DURACAO_POSE, () => this.iniciarDancaEChuva());
  }

  congelarAtores() {
    const atores = [
      this.scene.jogador1,
      this.scene.jogador2,
      this.scene.jogador3,
      this.scene.jogador4,
      this.scene.boss,
    ].filter((ator, indice, lista) => ator && lista.indexOf(ator) === indice);

    atores.forEach((ator) => {
      const sprite = ator.sprite;
      const body = sprite?.body;
      const estado = {
        ator,
        moves: body?.moves,
        velocityX: body?.velocity.x ?? 0,
        velocityY: body?.velocity.y ?? 0,
        animacaoPausada: sprite?.anims?.isPaused ?? false,
        visible: sprite?.visible ?? true,
        updateFSM: ator.maquinaEstados?.update,
      };
      this.estadoAtores.push(estado);

      if (ator === this.personagem) return;
      if (body) {
        body.setVelocity(0, 0);
        body.moves = false;
      }
      sprite?.anims?.pause();
      if (ator.maquinaEstados) ator.maquinaEstados.update = () => {};
      sprite?.setVisible(false);
    });
  }

  atualizar() {
    this.ajustarFundoUltimate();
  }

  restaurarAtores() {
    this.estadoAtores.forEach(({ ator, moves, velocityX, velocityY, animacaoPausada, visible, updateFSM }) => {
      const body = ator.sprite?.body;
      if (body) {
        body.moves = moves;
        body.setVelocity(velocityX, velocityY);
      }
      if (ator !== this.personagem) {
        if (ator.maquinaEstados && updateFSM) ator.maquinaEstados.update = updateFSM;
        if (!animacaoPausada) ator.sprite?.anims?.resume();
        ator.sprite?.setVisible(visible);
      }
    });
    this.estadoAtores = [];
  }

  esconderCenario() {
    const mapa = this.scene.mapaAtual;
    const visuais = [mapa?.imagemFundo, ...(mapa?.objetosTeloes ?? [])].filter(Boolean);
    visuais.forEach((objeto) => {
      this.estadoVisibilidadeCenario.push({ objeto, visible: objeto.visible });
      objeto.setVisible(false);
    });

    const plataformas = mapa?.plataformas?.getChildren?.() ?? [];
    plataformas.forEach((objeto) => {
      this.estadoVisibilidadeCenario.push({ objeto, visible: objeto.visible });
      objeto.setVisible(false);
    });
  }

  restaurarCenario() {
    this.estadoVisibilidadeCenario.forEach(({ objeto, visible }) => {
      if (objeto?.active) objeto.setVisible(visible);
    });
    this.estadoVisibilidadeCenario = [];
  }

  ativarFundoUltimate() {
    if (!this.scene.textures.exists("ultimateback1")) return;
    if (!this.scene.anims.exists("pingu_ultimateback")) {
      this.scene.anims.create({
        key: "pingu_ultimateback",
        frames: gerarQuadrosUltimateBackground(this.scene),
        frameRate: 36,
        repeat: -1,
      });
    }

    this.fundoUlt = this.scene.add.sprite(0, 0, "ultimateback1", 0);
    this.fundoUlt.setDepth(-90);
    this.fundoUlt.setScrollFactor(1);
    this.fundoUlt.play("pingu_ultimateback");
    this.ajustarFundoUltimate();
    this.scene.camHUD?.ignore(this.fundoUlt);
  }

  ajustarFundoUltimate() {
    if (!this.fundoUlt?.active) return;
    const camera = this.scene.cameras.main;
    this.fundoUlt.setPosition(camera.midPoint.x, camera.midPoint.y);
    this.fundoUlt.setDisplaySize(camera.width / camera.zoom, camera.height / camera.zoom);
  }

  enviarFoca() {
    const spritePingu = this.personagem.sprite;
    const destinoX = spritePingu.x + 115;
    const destinoY = spritePingu.y;
    // A animação já desloca a foca para a esquerda dentro dos próprios frames.
    // Mantém o objeto parado e toca a passagem uma única vez.
    const foca = this.scene.add.sprite(spritePingu.x + 230, destinoY, "Pingu_Fgo", 0);
    foca.setScale(1).setDepth(spritePingu.depth + 2);
    this.scene.camHUD?.ignore(foca);
    this.focaChegando = foca;
    this.spritesUlt.add(foca);

    foca.once("animationcomplete", () => {
      this.focaChegando = null;
      this.removerSprite(foca);
      if (!this.cancelada) this.tocarDancaFoca(destinoX, destinoY);
    });
    foca.play({ key: "pingu_Fgo", repeat: 0 });
  }

  tocarDancaFoca(x, y) {
    if (this.focaChegando?.active) this.removerSprite(this.focaChegando);
    if (this.focaDancando?.active) this.removerSprite(this.focaDancando);
    const foca = this.scene.add.sprite(x, y, "Pingu_Fdance", 0);
    foca.setOrigin(0.5, 1).setScale(1.25).setDepth(this.personagem.sprite.depth + 2);
    foca.play("pingu_Fdance");
    this.scene.camHUD?.ignore(foca);
    this.focaDancando = foca;
    this.spritesUlt.add(foca);
  }

  iniciarDancaEChuva() {
    if (this.cancelada) return;
    this.tweenFoca?.stop();
    if (this.focaChegando?.active) this.removerSprite(this.focaChegando);
    const sprite = this.personagem.sprite;
    sprite.anims.play("pingu_dance", true);
    this.personagem.aplicarConfiguracao("dance");

    this.tocarDancaFoca(sprite.x + 115, sprite.y);

    this.restaurarCenario();
    this.restaurarVisibilidadeAtores();
    this.prepararZoomMapa();
  }

  restaurarVisibilidadeAtores() {
    this.estadoAtores.forEach(({ ator, visible }) => {
      if (ator !== this.personagem && ator.sprite?.active) ator.sprite.setVisible(visible);
    });
  }

  prepararZoomMapa() {
    const camera = this.scene.cameras.main;
    const limites = this.scene.mapaAtual?.configCamera?.limites;
    const x = limites ? limites.x + limites.largura / 2 : this.personagem.sprite.x;
    const y = limites ? limites.y + limites.altura / 2 : this.personagem.sprite.y;
    const margem = 70 * (this.scene.scale.width / 1920);
    const zoomMapaAjustado = limites
      ? Math.min((camera.width - margem * 2) / limites.largura, (camera.height - margem * 2) / limites.altura)
      : this.zoomOriginal * 0.65;
    const zoomMapa = zoomMapaAjustado * 1.45;

    if (this.fundoUlt?.active) {
      this.scene.tweens.add({ targets: this.fundoUlt, alpha: 0, duration: DURACAO_ZOOM });
    }
    camera.pan(x, y, DURACAO_ZOOM, "Cubic.easeInOut");
    camera.zoomTo(zoomMapa, DURACAO_ZOOM);

    this.agendar(DURACAO_ZOOM, () => {
      this.fundoUlt?.destroy();
      this.fundoUlt = null;
      this.restaurarAtores();
      if (!this.physicsPausadaAntes) this.scene.physics.resume();
      this.iniciarChuvaMeteoros();
    });
  }

  iniciarChuvaMeteoros() {
    this.personagem.sprite.body.setVelocity(0, 0);
    this.personagem.sprite.body.setAllowGravity(false);
    this.personagem.sprite.body.moves = false;

    this.criarMeteoro();
    this.eventoMeteoros = this.scene.time.addEvent({
      delay: INTERVALO_METEOROS,
      loop: true,
      callback: () => this.criarMeteoro(),
    });
    this.agendar(DURACAO_CHUVA, () => {
      this.eventoMeteoros?.remove(false);
      this.eventoMeteoros = null;
      this.agendar(1700, () => this.finalizarUlt());
    });
  }

  criarMeteoro() {
    if (this.cancelada || this.finalizando) return;
    const limites = this.scene.mapaAtual?.configCamera?.limites ?? {
      x: 0,
      y: 0,
      largura: this.scene.scale.width,
      altura: this.scene.scale.height,
    };
    const escalaResolucao = this.scene.scale.width / 1920;
    const centroX = limites.x + limites.largura / 2;
    const faixaCentral = limites.largura * 0.25;
    const x = Phaser.Math.Between(centroX - faixaCentral, centroX + faixaCentral);
    const y = limites.y - 30;
    const meteoro = this.scene.physics.add.sprite(x, y, "Pingu_ultF", 0);
    meteoro.setScale(0.38 * escalaResolucao).setDepth(this.personagem.sprite.depth + 5);
    meteoro.setRotation(-Math.PI / 2);
    meteoro.body.setAllowGravity(false);
    meteoro.body.setCollideWorldBounds(false);
    meteoro.body.setSize(410, 300);
    meteoro.body.setVelocity(Phaser.Math.Between(-55, 55), Phaser.Math.Between(600, 800));
    meteoro.anims.play("pingu_ultF");
    this.scene.camHUD?.ignore(meteoro);

    const registro = this.registrarProjetil(meteoro, 50, false);
    const plataformas = this.scene.mapaAtual?.plataformas;
    if (plataformas) {
      registro.colisor = this.scene.physics.add.collider(
        meteoro,
        plataformas,
        (_objeto, plataforma) => this.quebrarMeteoro(registro, plataforma),
      );
    }
    registro.timer = this.agendar(2200, () => this.removerProjetil(registro));
  }

  quebrarMeteoro(registro, plataforma) {
    if (!this.projeteis.has(registro)) return;
    const x = registro.sprite.x;
    const y = plataforma?.body?.top ?? registro.sprite.y;
    this.removerProjetil(registro);

    [-1, 0, 1].forEach((direcao) => {
      const fragmento = this.scene.physics.add.sprite(x, y - 26, "Pingu_ultF", 0);
      fragmento.setScale(0.15 * (this.scene.scale.width / 1920))
        .setDepth(this.personagem.sprite.depth + 6);
      fragmento.setRotation(-Math.PI / 2);
      fragmento.body.setAllowGravity(true);
      fragmento.body.setCollideWorldBounds(false);
      fragmento.body.setSize(410, 300);
      fragmento.body.setVelocity(direcao * Phaser.Math.Between(260, 500), -Phaser.Math.Between(360, 560));
      fragmento.anims.play("pingu_ultF");
      this.scene.camHUD?.ignore(fragmento);

      const pedaco = this.registrarProjetil(fragmento, 25, true);
      pedaco.timer = this.agendar(850, () => this.removerProjetil(pedaco));
      this.scene.tweens.add({
        targets: fragmento,
        alpha: 0,
        delay: 500,
        duration: 350,
        onComplete: () => this.removerProjetil(pedaco),
      });
    });
  }

  registrarProjetil(sprite, dano, fragmento) {
    const registro = { sprite, dano, fragmento, ataque: null, colisor: null, timer: null };
    this.projeteis.add(registro);
    registro.ataque = registrarAtaqueEspecial(this, sprite, {
      categoria: "projetil",
      aoColidir: () => this.removerProjetil(registro),
      aoAtingirAlvo: (alvo) => this.acertarComMeteoro(registro, alvo),
    });
    return registro;
  }

  acertarComMeteoro(registro, alvo) {
    if (!this.projeteis.has(registro) || !alvo?.sprite?.active) return;
    const direcao = alvo.sprite.x < registro.sprite.x ? -1 : 1;
    alvo.receberDano(registro.dano, {
      tipoSomImpacto: "heavy",
      knockbackX: registro.fragmento ? 600 : 1000,
      knockbackY: registro.fragmento ? -700 : -1350,
      knockbackFixo: true,
      tumbling: true,
    }, { direcao, x: registro.sprite.x, y: registro.sprite.y });
    this.removerProjetil(registro);
  }

  removerProjetil(registro) {
    if (!this.projeteis.has(registro)) return;
    this.projeteis.delete(registro);
    registro.timer?.remove(false);
    registro.timer = null;
    if (registro.colisor?.active) registro.colisor.destroy();
    registro.colisor = null;
    registro.ataque?.remover();
    registro.ataque = null;
    if (registro.sprite?.active) {
      registro.sprite.body?.stop();
      registro.sprite.destroy();
    }
  }

  agendar(duracao, callback) {
    let timer;
    timer = this.scene.time.delayedCall(duracao, () => {
      this.timers.delete(timer);
      if (!this.cancelada && !this.finalizada) callback();
    });
    this.timers.add(timer);
    return timer;
  }

  ajustarCameraOriginal() {
    const camera = this.scene.cameras.main;
    camera.pan(this.centroOriginal.x, this.centroOriginal.y, 600, "Cubic.easeInOut");
    camera.zoomTo(this.zoomOriginal, 600);
    this.agendar(620, () => {
      this.scene.atualizarCamera = this.funcaoCameraOriginal;
      this.scene.atualizarCamera?.();
      this.finalizada = true;
      this.estadoFSM.finalizarUlt();
    });
  }

  finalizarUlt() {
    if (this.finalizando || this.finalizada) return;
    this.finalizando = true;
    this.eventoMeteoros?.remove(false);
    this.eventoMeteoros = null;
    this.projeteis.forEach((registro) => this.removerProjetil(registro));
    this.limparTimers();
    this.restaurarCenario();
    this.restaurarAtores();
    this.fundoUlt?.destroy();
    this.fundoUlt = null;
    this.tweenFoca?.stop();
    this.spritesUlt.forEach((sprite) => sprite?.destroy());
    this.spritesUlt.clear();
    if (!this.physicsPausadaAntes) this.scene.physics.resume();
    this.personagem.sprite.body.setAllowGravity(true);
    this.personagem.sprite.body.moves = this.movesOriginalPingu;
    this.personagem.sprite.body.setVelocity(0, 0);
    this.ajustarCameraOriginal();
  }

  limparTimers() {
    this.timers.forEach((timer) => timer.remove(false));
    this.timers.clear();
  }

  removerSprite(sprite) {
    if (!sprite) return;
    this.spritesUlt.delete(sprite);
    sprite.destroy();
  }

  cancelar() {
    if (this.cancelada || this.finalizando) return;
    this.cancelada = true;
    this.finalizada = true;
    this.eventoMeteoros?.remove(false);
    this.eventoMeteoros = null;
    this.projeteis.forEach((registro) => this.removerProjetil(registro));
    this.limparTimers();
    this.tweenFoca?.stop();
    if (this.fundoUlt) this.scene.tweens.killTweensOf(this.fundoUlt);
    this.scene.tweens.killTweensOf(this.scene.cameras.main);
    this.fundoUlt?.destroy();
    this.fundoUlt = null;
    this.spritesUlt.forEach((sprite) => sprite?.destroy());
    this.spritesUlt.clear();
    this.restaurarCenario();
    this.restaurarAtores();
    if (this.personagem.sprite?.body) this.personagem.sprite.body.moves = this.movesOriginalPingu;
    if (!this.physicsPausadaAntes) this.scene.physics.resume();
    this.scene.atualizarCamera = this.funcaoCameraOriginal;
    this.scene.cameras.main.setZoom(this.zoomOriginal);
    this.scene.cameras.main.centerOn(this.centroOriginal.x, this.centroOriginal.y);
  }
}
