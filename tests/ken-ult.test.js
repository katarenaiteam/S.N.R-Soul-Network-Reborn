import test from 'node:test';
import assert from 'node:assert/strict';
import KenUlt from '../src/Personagensjs/Ult/KenUlt.js';
import { conduzirAlvoShoryuken } from '../src/Personagensjs/Specials/Ken/shoryuken.js';

globalThis.Phaser = { Math: { Clamp: (v, min, max) => Math.max(min, Math.min(max, v)) } };

function preparar() {
  const camera = {
    zoom: 1.4, scrollX: 0, scrollY: 0, stopFollow() {}, shake() {}, resetFX() {},
    setScroll(x,y) { this.scrollX=x; this.scrollY=y; },
    setZoom(v) { this.zoom = v; },
    centerOn(x, y) { this.centro = { x, y }; }
  };
  const scene = {
    scene: { key: 'cenaPrincipal' }, time: { now: 0, paused: false },
    game: { loop: { delta: 1000 / 60 } }, cameras: { main: camera },
    atualizarCamera() {}, physics: { pause() {}, resume() {} }
  };
  function personagem(x) {
    return {
      scene, grupoHurtbox: {}, porcentagemDano: 0,
      sons: { light: ["soco"], heavy: ["socoForte"] },
      tocarSomSorteado(sons) { this.ultimoSom = sons; },
      maquinaEstados: { update() {}, estadoAtual: { nome: 'dano', tempoInicial: 0, duracaoStun: 1250 } },
      sprite: {
        active: true, x, y: 200,
        body: {
          moves: true, velocity: { x: 0, y: 0 }, blocked: { down: false },
          setVelocity(x, y) { this.velocity = { x, y }; },
          setVelocityX(x) { this.velocity.x = x; },
          setGravityY(y) { this.gravidade = y; }, setAllowGravity() {}
        },
        anims: {
          isPaused: false,
          pause() { this.isPaused = true; }, resume() { this.isPaused = false; },
          play(config) { this.config = config; }
        }, on() {}, off() {}
      },
      receberDano(dano, propriedades) {
        if (this.invulneravel || this.maquinaEstados.estadoAtual.nome === 'guard') return true;
        this.porcentagemDano += dano;
        this.impacto = propriedades;
        this.sprite.body.setVelocity(propriedades.knockbackX, propriedades.knockbackY);
      }
    };
  }
  const ken = personagem(100), alvo = personagem(140);
  scene.jogador1 = ken; scene.jogador2 = alvo;
  const ult = new KenUlt(ken, {}, { finalizarUlt() { ult.cancelar(); } });
  const timers = [];
  ult.agendar = (ms, fn) => { timers.push({ ms, fn }); };
  ult.agendarFinal = ult.agendar;
  ult.iniciarTremorFinal = () => {};
  ult.criarImpactoNormal = ult.criarVFX = ult.criarLaunch = () => {};
  ult.ajustarFundoNaCamera = ult.ativarHitbox = ult.atualizarHitbox = () => {};
  const avancar = () => {
    const timer = timers.shift();
    assert.ok(timer);
    scene.time.now += timer.ms;
    timer.fn();
    return timer.ms;
  };
  return { ult, ken, alvo, camera, scene, avancar, timers };
}

test('tres janelas de acerto, sem repeticao por overlap, e ate 50 por salto', () => {
  const { ult, alvo, avancar, camera } = preparar();
  for (const salto of [1, 2]) {
    ult.numeroShoryuken = salto;
    ult.ultimoHit.clear(); ult.danoPorAlvo.clear();
    const antes = alvo.porcentagemDano;
    for (const frame of [4, 11, 18]) {
      ult.frameUltAtual = frame;
      ult.processarAcerto(alvo);
      const dano = alvo.porcentagemDano;
      ult.processarAcerto(alvo);
      assert.equal(alvo.porcentagemDano, dano);
      assert.equal(avancar(), salto === 2 && frame === 18 ? 1300 : 180);
      ult.processarAcerto(alvo);
      assert.ok(alvo.porcentagemDano - antes <= 50);
    }
    assert.equal(alvo.porcentagemDano - antes, 50);
  }
  assert.equal(alvo.impacto.knockbackX, 650);
  assert.equal(alvo.porcentagemDano, 100);
  assert.equal(alvo.impacto.knockbackY, -1700);
  assert.equal(camera.zoom, 1.4);
});

test('retencao usa velocidade do Shoryuken sem teleportar nem suspender a FSM', () => {
  const { ult, ken, alvo } = preparar();
  const updateOriginal = alvo.maquinaEstados.update;
  const posicao = { x: alvo.sprite.x, y: alvo.sprite.y };
  ken.sprite.body.setVelocity(150, -480);
  conduzirAlvoShoryuken(ken.sprite, alvo.sprite, 1);
  const esperado = { ...alvo.sprite.body.velocity };
  alvo.sprite.body.setVelocity(0, 0);
  ult.prenderAlvo(alvo); ult.atualizarAlvosCarregados();
  assert.deepEqual(alvo.sprite.body.velocity, esperado);
  assert.deepEqual({ x: alvo.sprite.x, y: alvo.sprite.y }, posicao);
  assert.equal(alvo.sprite.body.moves, true);
  assert.equal(alvo.maquinaEstados.update, updateOriginal);
});

test('queda conserva avanco com desaceleracao gradual nos dois sentidos', () => {
  for (const direcao of [-1, 1]) {
    const { ult, ken } = preparar();
    ult.direcao = direcao; ult.puloIniciado = true;
    ken.sprite.body.setVelocity(150 * direcao, 50);
    ult.atualizar();
    assert.ok(Math.abs(ken.sprite.body.velocity.x) > 65);
    assert.ok(Math.abs(ken.sprite.body.velocity.x) < 150);
    assert.equal(Math.sign(ken.sprite.body.velocity.x), direcao);
    assert.equal(ken.sprite.body.gravidade, 900);
  }
});

test('close final e imediato e cancelamento restaura corpos, FSM e camera', () => {
  const { ult, alvo, ken, camera } = preparar();
  const updateOriginal = alvo.maquinaEstados.update;
  ult.executarImpactoFinal(alvo);
  assert.equal(camera.zoom, 3.2);
  assert.deepEqual(ken.ultimoSom, ["socoForte"]);
  assert.equal(ken.scene.time.paused, true);
  assert.deepEqual(camera.centro, { x: 120, y: 135 });
  assert.equal(ken.sprite.body.moves, false);
  assert.equal(alvo.sprite.body.moves, false);
  assert.equal(alvo.porcentagemDano, 0);
  ult.zoomOriginal = 1.4;
  ult.cancelar();
  assert.equal(alvo.sprite.body.moves, true);
  assert.equal(ken.sprite.body.moves, true);
  assert.equal(alvo.maquinaEstados.update, updateOriginal);
  assert.equal(camera.zoom, 1.4);
  assert.equal(ken.scene.time.paused, false);
});

test('defesa e invulnerabilidade nao iniciam a retencao', () => {
  for (const defesa of ['guard', 'invulneravel']) {
    const { ult, alvo, timers } = preparar();
    if (defesa === 'guard') alvo.maquinaEstados.estadoAtual.nome = defesa;
    else alvo.invulneravel = true;
    ult.numeroShoryuken = 1; ult.frameUltAtual = 4;
    ult.processarAcerto(alvo);
    assert.equal(ult.alvosCarregados.size, 0);
    assert.equal(alvo.porcentagemDano, 0);
    assert.equal(timers.length, 0);
  }
});
