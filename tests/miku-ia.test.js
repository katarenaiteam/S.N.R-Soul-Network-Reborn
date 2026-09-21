import test from 'node:test';
import assert from 'node:assert/strict';
import MikuIA from '../src/Objetos/Miku_IA.js';
import BotController from '../src/Objetos/BotController.js';
import SistemaPlataformas from '../src/Objetos/SistemaPlataformasAtravessaveis.js';
import EstadoDano from '../src/Estados/EstadoDano.js';

const plataforma = (left, right, top) => ({ body: { enable: true, left, right, top, y: top, bottom: top + 30, width: right - left } });
function personagem(x, y) {
  const p = {
    pulos: 0, maxPulos: 2, velocidade: 280, forcaPulo: -600, vidas: 3,
    vidaGuard: 50, porcentagemDano: 0,
    golpes: Object.fromEntries(['neutro1', 'side', 'agachado', 'air_neutro', 'air_cima', 'air_side', 'air_agachado'].map(k => [k, {}])),
    specials: Object.fromEntries(['neutro', 'agachado', 'lado', 'air_cima', 'air_lado', 'air_neutro', 'air_agachado'].map(k => [k, {}])),
    podeUsarSpecial: () => true, podeUsarAtaque: () => true, podeDarDash: () => true,
    maquinaEstados: { estadoAtual: { nome: 'idle' }, mudarEstado(nome) { this.estadoAtual = { nome }; return true; } },
    sprite: {
      x, y, active: true, flipX: false, anims: { currentAnim: { key: 'idle' } },
      body: { width: 30, height: 115, velocity: { x: 0, y: 0 }, blocked: { down: true }, enable: true },
      setFlipX(v) { this.flipX = v; }, setVelocityY(v) { this.body.velocity.y = v; },
    },
  };
  Object.defineProperties(p.sprite.body, {
    left: { get: () => p.sprite.x - 15 }, right: { get: () => p.sprite.x + 15 },
    top: { get: () => p.sprite.y - 115 }, bottom: { get: () => p.sprite.y },
  });
  return p;
}

function preparar() {
  const solidas = [plataforma(850, 1750, 900), plataforma(1925, 2375, 650)];
  const trans = [plataforma(950, 1650, 650)];
  const scene = {
    time: { now: 0, delayedCall: () => ({ remove() {} }) },
    physics: { world: { gravity: { y: 900 } }, add: { collider() {} } },
    mapaAtual: { plataformas: { getChildren: () => solidas }, areasLedge: [{ x: 1733, y: 920, largura: 40, altura: 20 }] },
    jogador1: personagem(1000, 900), alvosAtaqueExtras: [],
  };
  const ctrl = new BotController(scene);
  ctrl.bot = personagem(1400, 900);
  const sistema = Object.create(SistemaPlataformas.prototype);
  Object.assign(sistema, { scene, grupo: { getChildren: () => trans }, jogadores: new Map() });
  sistema.registrar(ctrl.bot);
  scene.sistemaPlataformasAtravessaveis = sistema;
  const ia = new MikuIA(ctrl);
  ctrl.setCerebro(ia);
  return { scene, ctrl, ia, bot: ctrl.bot, alvo: scene.jogador1, solidas, trans, sistema };
}

test('pressao acompanha ataques observados e volta a cair quando o jogador para', () => {
  const { ia, alvo } = preparar();
  for (let t = 0; t < 10000; t += 50) ia.observar(alvo, t, 50);
  const calma = ia.agressividade;
  assert.ok(calma >= 0.18 && calma < 0.25);
  for (let t = 10000; t < 25000; t += 50) {
    alvo.maquinaEstados.estadoAtual = { nome: 'atack', tempoInicio: Math.floor(t / 450) * 450 };
    ia.observar(alvo, t, 50);
  }
  const agressiva = ia.agressividade;
  assert.ok(agressiva > 0.7);
  alvo.maquinaEstados.estadoAtual = { nome: 'idle' };
  for (let t = 25000; t < 50000; t += 50) ia.observar(alvo, t, 50);
  assert.ok(ia.agressividade < 0.3);
  ia.agressividade = calma; ia.executar('neutro1', false, 0);
  const pausaCalma = ia.proximoAtaque;
  ia.agressividade = agressiva; ia.executar('neutro1', false, 0);
  assert.ok(ia.proximoAtaque < pausaCalma - 400);
});

test('desce pela plataforma atravessavel em direcao ao jogador abaixo', () => {
  const { ia, bot, sistema, scene, ctrl } = preparar();
  bot.sprite.y = 650;
  scene.time.now = 1000;
  ia.update(1000, 16);
  assert.equal(bot.maquinaEstados.estadoAtual.nome, 'jump');
  assert.equal(bot.sprite.body.velocity.y, 100);
  assert.equal(sistema.jogadores.get(bot).ignorarAte, 1200);
  assert.equal(ctrl.teclas.special.justDown, false);
  assert.equal(ctrl.teclas.cima.justDown, false);
  bot.sprite.body.blocked.down = false;
  bot.sprite.y = 700;
  ia.update(1300, 16);
  assert.equal(ctrl.teclas.cima.justDown, false, 'nao salta de volta para a plataforma alta');
});

test('sai da plataforma lateral e salta o vao rumo ao piso do jogador', () => {
  const { ia, bot, ctrl } = preparar();
  bot.sprite.x = 2100; bot.sprite.y = 650;
  ia.update(1000, 16);
  assert.equal(ctrl.teclas.esquerda.isDown, true);
  bot.sprite.x = 1940;
  ia.update(1300, 16);
  assert.equal(ctrl.teclas.cima.justDown, true);
  bot.sprite.body.blocked.down = false; bot.sprite.y = 600; bot.sprite.x = 1880;
  ia.update(1600, 16);
  assert.equal(ctrl.teclas.esquerda.isDown, true);
  assert.equal(ia.rota.top, 900);
});

test('sobe direto por baixo de plataforma atravessavel', () => {
  const { ia, alvo, ctrl } = preparar();
  alvo.sprite.y = 650;
  ia.update(1000, 16);
  assert.equal(ctrl.teclas.cima.justDown, true);
  assert.equal(ctrl.teclas.direita.isDown, false);
});

test('recuperacao usa up-special quando os pulos acabaram', () => {
  const { ia, bot, ctrl } = preparar();
  bot.sprite.x = 1880; bot.sprite.y = 1050; bot.pulos = 2;
  bot.sprite.body.blocked.down = false; bot.sprite.body.velocity.y = 220;
  ia.update(1000, 16);
  assert.equal(ctrl.teclas.special.justDown, false, 'primeiro orienta o movimento');
  ia.update(1080, 16);
  assert.equal(ctrl.teclas.special.justDown, true);
  assert.equal(ctrl.teclas.cima.isDown, true);
  assert.equal(ctrl.teclas.cima.justDown, false);
});

test('nao interrompe o impulso automatico do ledge', () => {
  const { ia, bot, ctrl } = preparar();
  bot.maquinaEstados.estadoAtual = { nome: 'crouch', ledgeAte: 1500 };
  ctrl.segurar('baixo');
  ia.update(1000, 16);
  assert.ok(Object.values(ctrl.teclas).every(t => !t.isDown && !t.justDown));
});

test('usa notas a distancia quando puppet esta em cooldown', () => {
  const { ia, bot, ctrl } = preparar();
  bot.specials.agachado.logica = { obterCarga: () => 0 };
  ia.update(1000, 16);
  assert.equal(ctrl.teclas.special.justDown, true);
  assert.equal(ctrl.teclas.baixo.isDown, false);
  assert.equal(ctrl.teclas.esquerda.isDown, false, 'nota neutra, sem spin acidental');
});

test('puppet alterna para suporte e nao recebe o mesmo comando repetidamente', () => {
  const { ia, bot, scene, ctrl } = preparar();
  bot.porcentagemDano = 100;
  const puppet = { dono: bot, ativo: true, modo: 'ataque', alternarModo() {} };
  scene.alvosAtaqueExtras.push(puppet);
  ia.update(1000, 16);
  assert.equal(ctrl.teclas.baixo.isDown, true);
  assert.equal(ctrl.teclas.special.justDown, true);
  puppet.modo = 'suporte'; ctrl.soltarTudo();
  ia.update(7000, 16);
  assert.equal(ctrl.teclas.baixo.isDown, false);
});

test('usa normais de perto e confirma combo somente se acertou', () => {
  const { ia, bot, alvo, ctrl } = preparar();
  alvo.sprite.x = 1350;
  ia.update(1000, 16);
  assert.equal(ctrl.teclas.atack.justDown, true);
  ctrl.soltarTudo();
  bot.maquinaEstados.estadoAtual = { nome: 'atack', tempoInicio: 1000, jaAcertou: false,
    golpeAtual: { comboProximo: 'neutro2', comboJanelaInicio: 200, comboJanelaFim: 300 } };
  ia.update(1250, 16);
  assert.equal(ctrl.teclas.atack.justDown, false);
  bot.maquinaEstados.estadoAtual.jaAcertou = true;
  ia.update(1260, 16);
  assert.equal(ctrl.teclas.atack.justDown, true);
});

test('reage a ameaca proxima mesmo em agressividade baixa', () => {
  const { ia, alvo, ctrl } = preparar();
  ia.agressividade = 0.18; alvo.sprite.x = 1320;
  alvo.maquinaEstados.estadoAtual = { nome: 'atack' };
  ia.update(1000, 16);
  assert.equal(ctrl.teclas.guard.isDown, true);
});

test('descida respeita registro, permissao e apoio real', () => {
  const { sistema, bot } = preparar();
  assert.equal(sistema.descer(bot), false, 'piso solido');
  bot.sprite.y = 650;
  sistema.jogadores.get(bot).podeDescer = false;
  assert.equal(sistema.descer(bot), false);
  sistema.jogadores.get(bot).podeDescer = true;
  assert.equal(sistema.descer(bot), true);
});

test('para inputs durante pausa e troca para P2 quando P1 foi eliminado', () => {
  const { ia, scene, ctrl } = preparar();
  ctrl.segurar('esquerda'); scene.physics.world.isPaused = true;
  ia.update(1000, 16);
  assert.equal(ctrl.teclas.esquerda.isDown, false);
  scene.physics.world.isPaused = false;
  scene.jogador1.eliminado = true; scene.jogador2 = personagem(1200, 900);
  ia.update(2000, 16);
  assert.equal(ctrl.alvo, scene.jogador2);
});

test('nao segue o jogador para fora da borda do piso', () => {
  const { ia, bot, alvo, ctrl } = preparar();
  bot.sprite.x = 1685; alvo.sprite.x = 1810; alvo.sprite.y = 1010;
  ia.agressividade = 0.9;
  ia.update(1000, 16);
  assert.equal(ctrl.teclas.direita.isDown, false);
  assert.equal(ctrl.teclas.cima.justDown, false);
});

test('recuperacao nao tenta subir a plataforma alta que esta fora de alcance', () => {
  const { ia, bot } = preparar();
  bot.sprite.x = 2200; bot.sprite.y = 1200; bot.pulos = 2;
  bot.sprite.body.blocked.down = false; bot.sprite.body.velocity.y = 200;
  ia.update(1000, 16);
  assert.equal(ia.rota.top, 900);
});

test('apos hitstun sai de dano antes de gastar o comando de up-special', () => {
  const { ia, bot, ctrl, scene } = preparar();
  bot.sprite.x = 1800; bot.sprite.y = 1100; bot.pulos = 2;
  bot.sprite.body.blocked.down = false;
  const estado = Object.create(EstadoDano.prototype);
  Object.assign(estado, { personagem: bot, nome: 'dano', tempoInicial: 0, duracaoStun: 500,
    puloBufferAte: 0, atualizarAnimacaoDano() {} });
  bot.maquinaEstados.estadoAtual = estado;
  bot.scene = scene; bot.isTumbling = true;
  bot.inputDown = k => ctrl.teclas[k]?.isDown;
  bot.inputJustDown = k => ctrl.teclas[k]?.justDown;
  scene.game = { loop: { delta: 16 } }; scene.time.now = 1000;
  bot.sprite.body.setVelocityX = x => { bot.sprite.body.velocity.x = x; };
  ia.update(1000, 16);
  assert.equal(ctrl.teclas.esquerda.justDown, true);
  assert.equal(ctrl.teclas.special.justDown, false);
  estado.execute();
  assert.equal(bot.maquinaEstados.estadoAtual.nome, 'jump');
  assert.equal(bot.isTumbling, false);
});
