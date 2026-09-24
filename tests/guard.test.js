import test from 'node:test';
import assert from 'node:assert/strict';
import Personagem from '../src/Personagensjs/Personagem.js';
import EstadoGuard from '../src/Estados/EstadoGuard.js';

function lutador(flipX = false) {
  const p = Object.create(Personagem.prototype);
  Object.assign(p, {
    guardMaximo: 50, vidaGuard: 50, porcentagemDano: 0,
    tempoCooldownGuard: 3000, comboHitsRecebidos: 0, tempoUltimoHit: -Infinity,
    sons: {}, tocarSomSorteado() {}, aplicarBoostUltPorDano() {},
    sprite: { x: 100, flipX, setDepth() {}, body: {
      velocity: { x: 0, y: 0 },
      setVelocity(x, y) { this.velocity = { x, y }; },
      setVelocityX(x) { this.velocity.x = x; },
    } },
    vfx: { destruirEfeito() {}, tocar(nome, config) { return { nome, config }; } },
    maquinaEstados: {
      estadoAtual: { nome: 'guard', atualizarBrilho() {} },
      mudarEstado(nome) { this.estadoAtual = { nome }; },
    },
  });
  p.scene = { jogador1: p, jogador2: { sprite: { x: 200, setDepth() {} } }, time: { now: 100 } };
  return p;
}

const golpe = { knockbackFixo: true, hitstunFixoFrames: 15 };

for (const flip of [false, true]) {
  const frente = flip ? -1 : 1;
  test(`bloqueia pela frente e recebe dano pelas costas (flipX=${flip})`, () => {
    const p = lutador(flip);
    assert.equal(p.receberDano(10, golpe, { direcao: -frente }), true);
    assert.equal(p.vidaGuard, 40);
    assert.equal(p.porcentagemDano, 0);
    assert.equal(p.receberDano(10, golpe, { direcao: frente }), false);
    assert.equal(p.vidaGuard, 40);
    assert.equal(p.porcentagemDano, 10);
    assert.equal(p.maquinaEstados.estadoAtual.nome, 'dano');
  });
}

test('usa a chegada do projetil mesmo se o dono estiver do outro lado', () => {
  const p = lutador();
  p.scene.jogador2.sprite.x = 0;
  assert.equal(p.podeDefender(), false);
  assert.equal(p.podeDefender({ x: 200 }), true);
  assert.equal(p.podeDefender({ x: 95, direcao: -1 }), true);
  assert.equal(p.podeDefender({ x: 105, direcao: 1 }), false);
});

test('quebra frontal gera efeito vermelho, atordoa e aplica cooldown', () => {
  const p = lutador();
  assert.equal(p.receberDano(60, golpe, { direcao: -1 }), false);
  assert.equal(p.vidaGuard, 0);
  assert.equal(p.maquinaEstados.estadoAtual.nome, 'atordoado');
  assert.equal(p.tempoLiberacaoGuard, 3100);
  assert.equal(p.efeitoGuard.nome, 'brokeguard');
  assert.equal(p.efeitoGuard.config.corGuard, 0xff3030);
});

test('cor progride de azul a vermelho conforme a resistencia cai', () => {
  const p = lutador();
  assert.equal(p.obterCorGuard(), 0x2090ff);
  let anterior = p.obterCorGuard();
  for (const vida of [40, 25, 10, 0]) {
    p.vidaGuard = vida;
    const cor = p.obterCorGuard();
    assert.ok((cor >> 16) > (anterior >> 16));
    assert.ok((cor & 255) < (anterior & 255));
    anterior = cor;
  }
  assert.equal(anterior, 0xff3030);
});

test('sair da guarda remove o brilho e preserva apenas o efeito de quebra', () => {
  for (const vida of [30, 0]) {
    const p = lutador();
    p.vidaGuard = vida;
    let brilhoRemovido = false;
    let efeitoRemovido = false;
    p.vfx.destruirEfeito = () => { efeitoRemovido = true; };
    const estado = new EstadoGuard(p);
    estado.brilho = { destroy() { brilhoRemovido = true; } };
    estado.exit();
    assert.equal(brilhoRemovido, true);
    assert.equal(efeitoRemovido, vida > 0);
    assert.equal(estado.brilho, null);
  }
});
