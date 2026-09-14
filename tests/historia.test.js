import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.Phaser = {
  Scene: class {},
  Math: { Clamp: (x, a, b) => Math.max(a, Math.min(b, x)), Linear: (a, b, t) => a + (b - a) * t },
};
const { default: Historia } = await import('../src/Scenes/CenaHistoria.js');
const { obterAlvosCombate } = await import('../src/Objetos/SistemaCombateEspecial.js');
const { default: SpiderIA } = await import('../src/Objetos/Spider_IA.js');
const { default: SpiderUlt } = await import('../src/Personagensjs/Ult/SpiderUlt.js');

function lutador(x = 1000) {
  const sprite = { active: true, x, y: 750,
    disableBody() { this.active = false; this.body.enable = false; },
    body: { enable: true },
  };
  return { sprite, vidas: 3, eliminado: false, grupoHurtbox: { getChildren: () => [] },
    atualizarCargaUlt(delta) { this.cargaDelta = delta; }, update() { this.updates = (this.updates ?? 0) + 1; },
    maquinaEstados: { estados: {} },
  };
}
function cena(coop = true) {
  const s = new Historia();
  s.init({ numPlayers: coop ? 2 : 1 });
  s.jogador1 = lutador(); s.jogador2 = coop ? lutador(1100) : null; s.boss = lutador(1600);
  s.vidasP1 = 3; s.vidasP2 = coop ? 3 : 0; s.vidasBoss = 3;
  s.participantes = [s.jogador1, s.jogador2, s.boss].filter(Boolean).map(jogador => ({
    jogador, vidas: jogador === s.boss ? 'vidasBoss' : jogador === s.jogador1 ? 'vidasP1' : 'vidasP2',
    spawn: { x: jogador.sprite.x, y: 750 }, textoVidas: { setText() {} }, hud: { setAlpha() {} },
  }));
  s.botIA = { update() {}, soltarTudo() {} }; s.sound = { stopAll() {} };
  s.scene = { key: 'CenaHistoria', start() { s.encerramentos = (s.encerramentos ?? 0) + 1; } };
  s.limparAcao = () => {};
  s.respawnar = jogador => { jogador.respawns = (jogador.respawns ?? 0) + 1; };
  s.limitesArena = { minX: -200, maxX: 2800, minY: -200, maxY: 1600 };
  s.mapaAtual = { configCamera: { maxZoom: 2, limites: { x: 0, y: 0, largura: 2600, altura: 1400 } } };
  s.camJogo = { width: 1920, height: 1080, zoom: 1, setZoom(z) { this.zoom = z; }, centerOn(x,y) { this.x=x; this.y=y; } };
  for (const { jogador } of s.participantes) jogador.scene = s;
  return s;
}

test('3 vidas permitem apenas 2 respawns; P2 continua apos P1 eliminado', () => {
  const s = cena();
  for (let i=0; i<8; i++) s.processarQueda(s.jogador1);
  assert.equal(s.vidasP1, 0); assert.equal(s.jogador1.respawns, 2);
  assert.equal(s.jogador1.sprite.active, false); assert.equal(s.partidaEncerrada, false);
  assert.deepEqual(obterAlvosCombate(s.boss), [s.jogador2]);
  const ia = new SpiderIA({ scene: s, bot: s.boss });
  assert.equal(ia.definirAlvo(), s.jogador2);
  s.update(0,16); assert.equal(s.jogador1.updates, undefined); assert.equal(s.jogador2.updates,1);
  for (let i=0; i<5; i++) s.processarQueda(s.jogador2);
  assert.equal(s.vidasP2,0); assert.equal(s.encerramentos,1);
});

test('solo termina na terceira queda e boss tambem tem limite de vidas', () => {
  for (const boss of [false,true]) {
    const s=cena(false), alvo=boss?s.boss:s.jogador1;
    for(let i=0;i<5;i++)s.processarQueda(alvo);
    assert.equal(alvo.vidas,0);assert.equal(alvo.respawns,2);assert.equal(s.encerramentos,1);
  }
});

test('carga de ult atualiza para todos os participantes ativos', () => {
  const s=cena();s.update(0,100);
  for(const {jogador} of s.participantes)assert.equal(jogador.cargaDelta,100);
});

test('ataques e SpiderUlt respeitam equipes no cooperativo', () => {
  const s=cena();
  assert.deepEqual(obterAlvosCombate(s.jogador1),[s.boss]);
  assert.deepEqual(obterAlvosCombate(s.jogador2),[s.boss]);
  assert.deepEqual(obterAlvosCombate(s.boss),[s.jogador1,s.jogador2]);
  assert.equal(new SpiderUlt(s.jogador1,{},{}).oponente,s.boss);
  s.jogador1.eliminado=true;
  assert.equal(new SpiderUlt(s.boss,{},{}).oponente,s.jogador2);
});

test('camera inclui P2 distante e ignora eliminados sem zoom invalido', () => {
  const s=cena();s.jogador2.sprite.x=2500;s.atualizarCamera();
  const cam=s.camJogo;
  for(const {jogador} of s.participantes) {
    assert.ok(Math.abs(jogador.sprite.x-cam.x)<=cam.width/cam.zoom/2);
    assert.ok(Math.abs(jogador.sprite.y-cam.y)<=cam.height/cam.zoom/2);
  }
  s.jogador2.eliminado=true;s.jogador2.sprite.x=99999;s.atualizarCamera();
  assert.ok(Number.isFinite(cam.x)&&Number.isFinite(cam.y)&&cam.zoom>0);
  assert.ok(cam.x<2600);
  cam.width=4000;cam.height=3000;s.atualizarCamera();
  assert.ok(Number.isFinite(cam.x)&&Number.isFinite(cam.y));
});

test('reiniciar solo limpa referencias do cooperativo anterior', () => {
  const s=cena();s.atualizarCamera=()=>{};s.init({numPlayers:1});
  assert.equal(s.jogador2,null);assert.equal(s.partidaEncerrada,false);
  assert.equal(Object.hasOwn(s,'atualizarCamera'),false);
});
