import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import IntroPartida from "../src/Objetos/IntroPartida.js";
import Personagem from "../src/Personagensjs/Personagem.js";

function preparar({ locked = false, nomes = ["SpiderMan", "Miku"], audio = true } = {}) {
  const objeto = () => ({
    setScrollFactor() { return this; }, setDepth() { return this; },
    setVisible(v) { this.visible = v; return this; },
    setTexture(t) { this.texture = t; return this; },
    setDisplaySize() { return this; }, setFrame(f) { this.frame = f; return this; },
    destroy() { this.destroyed = true; },
  });
  const sons = [];
  const sound = Object.assign(new EventEmitter(), { locked, add() {
    const som = Object.assign(new EventEmitter(), {
      duration: sons.length ? 1 : 5, seek: 0, isPlaying: false,
      play() { this.isPlaying = true; }, destroy() { this.destroyed = true; },
      completar() { this.isPlaying = false; this.emit("complete"); },
    });
    sons.push(som);
    return som;
  } });
  const jogador = (x, prefixoAnim) => {
    const miku = prefixoAnim === "miku_";
    const idle = miku
      ? { largura: 85, altura: 340, offsetX: 170, offsetY: 20, escala: 0.34 }
      : { largura: 85, altura: 96, offsetX: 50, offsetY: 95, escala: 1 };
    const personagem = {
      prefixoAnim, maquinaEstados: { estadoAtual: { nome: "idle" } },
      configAnimacoes: { idle, intro: { ...idle, offsetX: miku ? 155 : 13, offsetY: miku ? 34 : 29 } },
      sprite: {
        x, y: 700, scaleX: 1, scaleY: 1, originX: 0.5, originY: 1,
        frame: { realWidth: miku ? 334 : 200, realHeight: miku ? 360 : 200 },
        anims: { currentAnim: { key: `${prefixoAnim}idle` } },
        setVelocity() {}, setFlipX(v) { this.flipX = v; },
        setScale(v) { this.scaleX = this.scaleY = v; },
        play(config) {
          this.config = config;
          const key = typeof config === "string" ? config : config.key;
          this.anims.currentAnim = { key };
          const intro = key.endsWith("intro");
          this.frame = { realWidth: miku ? (intro ? 304 : 334) : (intro ? 126 : 200),
            realHeight: miku ? (intro ? 374 : 360) : (intro ? 134 : 200) };
        },
      },
      aplicarConfiguracao: Personagem.prototype.aplicarConfiguracao,
      obterConfigAtual: Personagem.prototype.obterConfigAtual,
      atualizarOffsetFisica: Personagem.prototype.atualizarOffsetFisica,
      tocarAnimacao: Personagem.prototype.tocarAnimacao,
      sincronizarHurtbox() { this.sincronizada = true; },
    };
    Object.assign(personagem.sprite, {
      once: EventEmitter.prototype.once, on: EventEmitter.prototype.on,
      off: EventEmitter.prototype.off, removeListener: EventEmitter.prototype.removeListener,
      emit: EventEmitter.prototype.emit,
    });
    personagem.sprite.body = {
      position: {}, prev: { copy() {} }, prevFrame: { copy() {} },
      setSize(w, h) { this.w = w; this.h = h; },
      setOffset(x, y) { this.ox = x; this.oy = y; },
      updateFromGameObject() {
        const s = personagem.sprite;
        this.position.x = s.x + (this.ox - s.frame.realWidth * s.originX) * s.scaleX;
        this.position.y = s.y + (this.oy - s.frame.realHeight * s.originY) * s.scaleY;
        this.width = this.w * s.scaleX;
        this.height = this.h * s.scaleY;
      },
    };
    return personagem;
  };
  const scene = {
    jogador1: jogador(1000, "spy_"), jogador2: jogador(1600, "miku_"),
    escolhaP1: nomes[0], escolhaP2: nomes[1], sound,
    input: { keyboard: new EventEmitter() },
    cache: { audio: { exists: () => audio } },
    add: { sprite: objeto }, scale: { width: 1920, height: 1080 },
    camJogo: { width: 1920, height: 1080, useBounds: true, ignore() {},
      setZoom(z) { this.zoom = z; return this; }, centerOn(x, y) { this.x = x; this.y = y; } },
    mapaAtual: { configCamera: {} }, anims: { exists: () => true },
    events: new EventEmitter(), physics: { world: {
      pause() { this.paused = true; }, resume() { this.paused = false; },
    } },
  };
  return { scene, sons, intro: new IntroPartida(scene) };
}

test("intro acompanha audio, apresenta P2 depois do movimento e libera somente ao fim do Fight", () => {
  const { scene, sons, intro } = preparar();
  assert.equal(scene.physics.world.paused, true);
  assert.equal(scene.jogador1.sprite.config.key, "spy_intro");
  sons[0].seek = 1.6;
  intro.atualizar(16);
  assert.ok(Math.abs(scene.camJogo.x - 1300) < 0.001);
  assert.equal(scene.jogador2.sprite.config, undefined);
  sons[0].seek = 1.85;
  intro.atualizar(16);
  assert.equal(scene.camJogo.x, 1600);
  assert.equal(scene.jogador2.sprite.config.key, "miku_intro");
  assert.equal(scene.jogador2.sprite.config.repeat, 0);
  sons[0].seek = 3.4;
  intro.atualizar(16);
  assert.ok(scene.camJogo.x < 1600 && scene.camJogo.x > 1300);
  sons[0].seek = 4.3;
  intro.atualizar(16);
  assert.equal(scene.camJogo.x, 1300);
  sons[0].completar();
  assert.equal(sons[1].isPlaying, true);
  assert.equal(intro.visual.texture, "Fight");
  assert.equal(scene.physics.world.paused, true);
  sons[1].seek = 0.95;
  intro.atualizar(16);
  assert.equal(intro.visual.frame, 9);
  sons[1].completar();
  assert.equal(intro.ativa, false);
  assert.equal(scene.physics.world.paused, false);
  assert.equal(scene.camJogo.x, 1300);
  assert.equal(scene.camJogo.useBounds, true);
  assert.equal(scene.jogador2.sincronizada, true);
});

test("cada personagem volta ao idle no fim da propria animacao antes do Fight", () => {
  const { scene, sons, intro } = preparar();
  scene.jogador1.sprite.emit("animationcomplete-spy_intro");
  assert.equal(scene.jogador1.sprite.anims.currentAnim.key, "spy_idle");
  assert.equal(intro.fight, undefined);
  assert.equal(scene.physics.world.paused, true);
  sons[0].seek = 2;
  intro.atualizar(16);
  scene.jogador2.sprite.emit("animationcomplete-miku_intro");
  assert.equal(scene.jogador2.sprite.anims.currentAnim.key, "miku_idle");
  assert.equal(intro.fight, undefined);
  assert.equal(intro.finaisAnimacao.size, 0);
});

test("shutdown remove o callback de fim da animacao em andamento", () => {
  const { scene, intro } = preparar();
  scene.events.emit("shutdown");
  scene.jogador1.sprite.emit("animationcomplete-spy_intro");
  assert.equal(scene.jogador1.sprite.anims.currentAnim.key, "spy_intro");
  assert.equal(intro.finaisAnimacao.size, 0);
});

test("shutdown cancela audio pendente antes do desbloqueio", () => {
  const { scene, sons, intro } = preparar({ locked: true });
  intro.atualizar(10000);
  assert.equal(intro.tempo, 0);
  scene.events.emit("shutdown");
  scene.sound.emit("unlocked");
  assert.equal(sons[0].isPlaying, false);
  assert.ok(sons.every(s => s.destroyed));
});

test("sem audio a intro termina e personagens fora da lista nao recebem animacao", () => {
  const { scene, intro } = preparar({ audio: false, nomes: ["FJ", "Madotsuki"] });
  intro.atualizar(3000);
  assert.equal(scene.jogador1.sprite.anims.currentAnim.key, "spy_idle");
  assert.equal(scene.jogador2.sprite.anims.currentAnim.key, "miku_idle");
  intro.atualizar(1000);
  assert.equal(intro.ativa, false);
  assert.equal(scene.physics.world.paused, false);
});

test("escala e retangulo fisico permanecem iguais ao idle na entrada e saida da intro", () => {
  const { scene, sons, intro } = preparar();
  // A Miku ja precisa estar em 0.34 mesmo antes da sua apresentacao.
  assert.equal(scene.jogador2.sprite.scaleX, 0.34);
  const retangulo = j => ({ ...j.sprite.body.position,
    width: j.sprite.body.width, height: j.sprite.body.height });
  const p1 = retangulo(scene.jogador1);
  const p2 = retangulo(scene.jogador2);
  assert.equal(p1.width, 85);
  assert.equal(p1.height, 96);
  sons[0].seek = 2;
  intro.atualizar(16);
  assert.deepEqual(retangulo(scene.jogador2), p2);
  assert.equal(scene.jogador2.sprite.scaleX, 0.34);
  sons[0].completar();
  assert.deepEqual(retangulo(scene.jogador1), p1);
  assert.deepEqual(retangulo(scene.jogador2), p2);
  sons[1].completar();
  assert.deepEqual(retangulo(scene.jogador1), p1);
  assert.deepEqual(retangulo(scene.jogador2), p2);
});
