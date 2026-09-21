import test from "node:test";
import assert from "node:assert/strict";
import SpiderAupSpecial from "../src/Personagensjs/Specials/Spiderman/AupSpecial.js";
import EstadoSpecial from "../src/Estados/EstadoSpecial.js";

function preparar() {
  const comandos = new Set();
  const transicoes = [];
  const timers = [];
  let tween;
  const p = {
    scene: {
      time: { delayedCall(delay, callback) {
        const timer = { delay, callback, remove() { this.removido = true; } };
        timers.push(timer);
        return timer;
      } },
      tweens: { add(config) { tween = config; return { stop() {} }; } }
    },
    sprite: { x: 10, y: 20 },
    inputJustDown: comando => comandos.has(comando),
    inputDown: comando => comandos.has(comando),
    podeDash: true, dashs: 0, maxDash: 1, pulos: 1, maxPulos: 2,
    obterTipoSpecial: () => "air_neutro",
    obterTipoAtaque: () => "air_side",
    podeUsarSpecial: () => true,
    podeUsarAtaque: () => true,
    pular() { this.pulos++; this.maquinaEstados.mudarEstado("jump"); },
    maquinaEstados: { mudarEstado(nome, dados) {
      logica.cancelar();
      transicoes.push({ nome, dados });
      return true;
    } }
  };
  const logica = new SpiderAupSpecial(p, {}, {});
  const alvo = {
    sprite: { body: {
      allowGravity: true,
      setAllowGravity(valor) { this.allowGravity = valor; },
      setVelocity() {}, updateFromGameObject() {}
    } },
    maquinaEstados: { mudarEstado() {} }
  };
  logica.ponta = { active: true, body: { setVelocity() {} }, destroy() {} };
  logica.direcao = 1;
  return { p, logica, alvo, comandos, transicoes, timers, concluir: () => tween.onComplete() };
}

for (const [comando, destino] of [["atack", "atack"], ["cima", "jump"], ["special", "special"], ["dash", "dash"]]) {
  test(`up special cancela em ${destino} somente depois de puxar`, () => {
    const c = preparar();
    c.comandos.add(comando);
    assert.equal(c.logica.tentarCancelar(), false);
    c.logica.puxarInimigo(c.alvo);
    assert.equal(c.alvo.sprite.body.allowGravity, false);
    assert.equal(c.logica.tentarCancelar(), false);
    assert.equal(c.transicoes.length, 0);
    c.concluir();
    assert.equal(c.alvo.sprite.body.allowGravity, true);
    // O estado encaminha o cancelamento e encerra o execute antes da logica antiga.
    EstadoSpecial.prototype.execute.call({ logicaSpecial: c.logica });
    assert.equal(c.transicoes[0].nome, destino);
    assert.equal(c.logica.ponta, null);
    assert.equal(c.timers[0].removido, true);
  });
}

test("nao cancela em erro ou ancoragem, nem com recursos indisponiveis", () => {
  const c = preparar();
  c.comandos.add("dash");
  for (const fase of ["grow", "extra", "falhou", "ancorada"]) {
    c.logica.fase = fase;
    assert.equal(c.logica.tentarCancelar(), false);
  }
  c.logica.fase = "puxou";
  c.comandos.add("cima");
  c.comandos.add("atack");
  c.comandos.add("special");
  c.p.dashs = c.p.maxDash;
  c.p.pulos = c.p.maxPulos;
  c.p.podeUsarAtaque = () => false;
  c.p.podeUsarSpecial = () => false;
  assert.equal(c.logica.tentarCancelar(), false);
  assert.equal(c.transicoes.length, 0);
});

test("special direcional tem prioridade sobre pulo", () => {
  const c = preparar();
  c.logica.fase = "puxou";
  c.comandos.add("cima");
  c.comandos.add("special");
  c.logica.tentarCancelar();
  assert.deepEqual(c.transicoes, [{ nome: "special", dados: { tipo: "air_neutro" } }]);
  assert.equal(c.p.pulos, 1);
});
