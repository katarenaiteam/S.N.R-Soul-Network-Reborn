import test from 'node:test';
import assert from 'node:assert/strict';
import FJ from '../src/Personagensjs/Frederick.js';

// Usa o FJ e a FSM reais; substitui apenas renderizacao, fisica e entrada do Phaser.
function preparar(tipo = 'side', flipX = false) {
  const hitboxes = [], colisores = [], animacoes = new Map();
  const body = () => ({
    blocked: { down: true }, velocity: { x: 0, y: 0 }, offset: {}, enable: true,
    setSize() {}, setAllowGravity() {}, setImmovable() {}, updateFromGameObject() {},
    setOffset(x, y) { this.offset = { x, y }; },
  });
  const sprite = {
    x: 100, y: 200, flipX, body: body(), frame: { realWidth: 882 },
    width: 882, height: 363, scaleX: 1, scaleY: 1,
    setOrigin(x, y) { this.originX = x; this.originY = y; },
    setScale(v) { this.scaleX = this.scaleY = v; },
    setVelocityX() {}, on() {}, off() {},
    anims: { play(key) {
      const anim = animacoes.get(key);
      this.currentAnim = { ...anim, duration: anim.frames.length * 1000 / anim.frameRate };
    } },
    play(key) { this.anims.play(key); },
  };
  const scene = {
    scene: { key: 'cenaPrincipal' }, time: { now: 0 },
    anims: { exists: key => animacoes.has(key), create: cfg => animacoes.set(cfg.key, cfg),
      generateFrameNumbers: (key, cfg = {}) =>
        (cfg.frames ?? Array.from({ length: (cfg.end ?? 0) - (cfg.start ?? 0) + 1 },
          (_, i) => (cfg.start ?? 0) + i)).map(frame => ({ key, frame })) },
    add: { zone(x, y, largura, altura) {
      const hitbox = { x, y, largura, altura, active: true,
        setPosition(x, y) { this.x = x; this.y = y; },
        destroy() { this.active = false; } };
      hitboxes.push(hitbox);
      return hitbox;
    } },
    physics: { add: {
      sprite: () => sprite, group: () => ({}), existing: obj => { obj.body = body(); },
      overlap(hitbox, grupo, callback) {
        const colisor = { hitbox, callback, active: true, world: {},
          destroy() { this.active = false; } };
        colisores.push(colisor);
        return colisor;
      },
    } },
  };
  const fj = new FJ(scene, 100, 200, {}, 0, 0);
  fj.vfx = { tocarListaImpacto() {} };
  fj.tocarSomSorteado = () => {};
  let inputs = [];
  fj.inputJustDown = tecla => inputs.includes(tecla);
  fj.inputDown = () => false;
  const recebidos = [];
  const alvo = { grupoHurtbox: {}, receberDano: (...args) => recebidos.push(args) };
  scene.jogador1 = fj;
  scene.jogador2 = alvo;
  for (const nome of ['idle', 'jump', 'dash', 'dano']) {
    fj.maquinaEstados.adicionarEstado(nome, { enter() {}, execute() {}, exit() {} });
  }
  const estado = fj.maquinaEstados.estados.atack;
  if (tipo.startsWith('neutro')) estado.comboIndex = Number(tipo.slice(6));
  fj.maquinaEstados.mudarEstado('atack', { tipo, combo: tipo.startsWith('neutro') });
  return {
    fj, estado, scene, hitboxes, colisores, recebidos, animacoes,
    atualizar(tempo, teclas = [], acertar = false) {
      scene.time.now = tempo;
      inputs = teclas;
      fj.processarMovimentacaoAtaque(true);
      fj.maquinaEstados.update();
      if (acertar) for (const colisor of colisores.filter(c => c.active)) {
        // Varias hurtboxes e varios overlaps do mesmo alvo nao multiplicam o dano.
        for (let i = 0; i < 4; i++) colisor.callback(colisor.hitbox, {});
      }
    },
  };
}

test('side cria tres pulsos automaticos com duracao, offsets e knockbacks proprios', () => {
  for (const flipX of [false, true]) {
    const t = preparar('side', flipX);
    t.atualizar(139);
    assert.equal(t.hitboxes.length, 0);
    for (const inicio of [140, 240, 340]) {
      t.atualizar(inicio, [], true);
      t.fj.sprite.x += 5;
      t.atualizar(inicio + 54, [], true);
      const hit = t.hitboxes.at(-1);
      assert.equal(hit.active, true);
      assert.equal(hit.x, t.fj.sprite.x + t.estado.dadosHitboxAtual.offsetX * (flipX ? -1 : 1));
      t.atualizar(inicio + 55);
      assert.equal(hit.active, false);
    }
    assert.deepEqual(t.recebidos.map(r => r[0]), [3, 3, 6]);
    assert.deepEqual(t.recebidos.map(r => r[1].knockbackX), [12, 18, 550]);
    assert.deepEqual(t.recebidos.map(r => r[1].knockbackY), [0, -10, -400]);
    assert.equal(t.recebidos[2][1].tumbling, true);
    assert.ok(t.recebidos.every(r => r[2].direcao === (flipX ? -1 : 1)));
    t.atualizar(500);
    assert.equal(t.fj.maquinaEstados.estadoAtual.nome, 'idle');
    assert.ok(t.colisores.every(c => !c.active));
  }
});

test('combo rapido respeita maxHits e entra sozinho no antigo finalizador', () => {
  const t = preparar('neutro3');
  const maxHits = t.estado.golpeAtual.multiHit.maxHits;
  for (let tempo = 0; tempo <= 10000 && t.estado.tipoAtaqueAtual === 'neutro3'; tempo += 10) {
    t.atualizar(tempo, tempo % 100 === 0 ? ['atack'] : [], true);
  }
  assert.equal(t.hitboxes.length, maxHits);
  assert.equal(t.recebidos.length, maxHits);
  assert.equal(t.estado.tipoAtaqueAtual, 'neutro4');
  assert.equal(t.estado.comboIndex, 4);
  assert.equal(t.fj.sprite.anims.currentAnim.key, 'fj_atack3');
  assert.equal(t.estado.golpeAtual.propriedades.dano, 8);
  for (const numero of [1, 2, 3]) {
    assert.equal(t.animacoes.get(`fj_comboRapido${numero}`).repeat, 0);
  }
});

test('parar de apertar ou apenas segurar termina o rapido sem chamar o finalizador', () => {
  const t = preparar('neutro3');
  t.fj.inputDown = tecla => tecla === 'atack';
  for (let tempo = 0; tempo <= 400; tempo += 10) t.atualizar(tempo);
  assert.equal(t.fj.maquinaEstados.estadoAtual.nome, 'idle');
  assert.equal(t.estado.comboIndex, 3);
  assert.ok(t.hitboxes.length > 0 && t.hitboxes.length < t.fj.golpes.neutro3.multiHit.maxHits);
  assert.equal(t.recebidos.length, 0);
  assert.ok(t.hitboxes.every(h => !h.active));
});

test('cancel por acerto continua disponivel entre pulsos e limpa o ataque', () => {
  const t = preparar('neutro3');
  t.atualizar(0, ['dash']);
  assert.equal(t.fj.maquinaEstados.estadoAtual, t.estado);
  t.atualizar(25, [], true);
  t.atualizar(80);
  assert.equal(t.estado.hitboxAtual, null);
  assert.equal(t.estado.jaAcertou, true);
  t.atualizar(90, ['dash']);
  assert.equal(t.fj.maquinaEstados.estadoAtual.nome, 'dash');
  const quantidade = t.recebidos.length;
  for (const c of t.colisores) c.callback(c.hitbox, {});
  t.atualizar(2000);
  assert.equal(t.recebidos.length, quantidade);
  assert.equal(t.hitboxes.length, 1);
});

test('rapido alterna tres animacoes completas e sincroniza seus pulsos', () => {
  const t = preparar('neutro3');
  for (const [numero, inicioAnimacao, inicioHit, fimAnimacao] of [
    [1, 0, 25, 100], [2, 100, 225, 350], [3, 350, 400, 500],
  ]) {
    t.atualizar(inicioAnimacao, ['atack']);
    assert.equal(t.fj.sprite.anims.currentAnim.key, `fj_comboRapido${numero}`);
    assert.equal(t.fj.obterConfigAtual(), t.fj.configAnimacoes[`comboRapido${numero}`]);
    t.atualizar(inicioHit - 1);
    assert.equal(t.hitboxes.length, numero - 1);
    t.atualizar(inicioHit, ['atack'], true);
    assert.equal(t.hitboxes.length, numero);
    t.atualizar(fimAnimacao - 1);
    assert.equal(t.fj.sprite.anims.currentAnim.key, `fj_comboRapido${numero}`);
    const frames = t.animacoes.get(`fj_comboRapido${numero}`).frames;
    assert.ok(frames.every(f => f.key === 'FJ_speedNeu' && f.frame < 20));
  }
  t.atualizar(500, ['atack']);
  assert.equal(t.fj.sprite.anims.currentAnim.key, 'fj_comboRapido1');
  assert.notEqual(t.fj.configAnimacoes.comboRapido1, t.fj.configAnimacoes.comboRapido2);
});

test('interrupcao por dano elimina hitboxes e pulsos futuros', () => {
  const t = preparar();
  t.atualizar(140, [], true);
  t.fj.maquinaEstados.mudarEstado('dano');
  t.atualizar(1000);
  assert.equal(t.hitboxes.length, 1);
  assert.ok(t.colisores.every(c => !c.active));
  assert.equal(t.fj.hitboxAtiva, null);
});

test('pulso expirado nao acerta antes de sua limpeza no proximo update', () => {
  const t = preparar();
  t.atualizar(140);
  t.scene.time.now = 195;
  t.colisores[0].callback(t.hitboxes[0], {});
  assert.equal(t.recebidos.length, 0);
});

test('golpe comum continua aplicando dano apenas uma vez', () => {
  const t = preparar('neutro1');
  t.estado.atualizarHitbox({ key: 'fj_atack1' }, { index: 2 });
  t.atualizar(100, [], true);
  t.atualizar(150, [], true);
  assert.deepEqual(t.recebidos.map(r => r[0]), [4]);
});

test('FPS baixo preserva os tres pulsos sem criar varios no mesmo update', () => {
  const t = preparar();
  for (const tempo of [200, 500, 800]) {
    const antes = t.hitboxes.length;
    t.atualizar(tempo, [], true);
    assert.equal(t.hitboxes.length, antes + 1);
  }
  t.atualizar(1100);
  assert.deepEqual(t.recebidos.map(r => r[0]), [3, 3, 6]);
  assert.equal(t.fj.maquinaEstados.estadoAtual.nome, 'idle');
});

test('combo comum continua exigindo apenas a hitbox e chega ao novo terceiro golpe', () => {
  const t = preparar('neutro1');
  t.atualizar(200, ['atack']);
  assert.equal(t.estado.tipoAtaqueAtual, 'neutro1');
  t.estado.atualizarHitbox({ key: 'fj_atack1' }, { index: 2 });
  t.atualizar(250);
  assert.equal(t.estado.tipoAtaqueAtual, 'neutro2');
  t.estado.atualizarHitbox({ key: 'fj_atack2' }, { index: 5 });
  t.atualizar(650, ['atack']);
  assert.equal(t.estado.tipoAtaqueAtual, 'neutro3');
  assert.equal(t.estado.comboIndex, 3);
});
