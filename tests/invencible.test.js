import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import EstadoInvencible from "../src/Estados/EstadoInvencible.js";
import Personagem from "../src/Personagensjs/Personagem.js";

globalThis.Phaser = { TintModes: { SCREEN: 1 } };

function preparar() {
  const timers = [];
  const criarTimer = (config) => {
    const timer = { ...config, removido: false, remove() { this.removido = true; } };
    timers.push(timer);
    return timer;
  };
  const personagem = {
    scene: { events: new EventEmitter(), time: {
      addEvent: criarTimer,
      delayedCall: (delay, callback) => criarTimer({ delay, callback })
    } },
    sprite: { active: true, branco: false,
      setTint(cor) { this.cor = cor; return this; },
      setTintMode() { this.branco = true; return this; },
      clearTint() { this.branco = false; }
    },
    caixas: 1,
    destruirHurtboxes() { this.caixas = 0; },
    sincronizarHurtbox() { this.caixas = 1; }
  };
  personagem.estadoInvencible = new EstadoInvencible(personagem);
  return { personagem, estado: personagem.estadoInvencible, timers };
}

test("respawn remove hurtboxes e pisca durante cinco segundos", () => {
  const { personagem, estado, timers } = preparar();
  estado.entrar();
  assert.equal(personagem.caixas, 0);
  assert.equal(personagem.sprite.branco, true);
  Personagem.prototype.sincronizarHurtbox.call(personagem);
  assert.equal(personagem.caixas, 0);
  assert.equal(personagem.sprite.cor, 0);
  personagem.scene.events.emit("update", 75, 75);
  const intermediaria = personagem.sprite.cor;
  personagem.scene.events.emit("update", 150, 75);
  assert.ok(intermediaria > 0 && intermediaria < personagem.sprite.cor);
  personagem.scene.events.emit("update", 300, 150);
  assert.equal(personagem.sprite.cor, 0);
  assert.equal(timers[0].delay, 5000);
  timers[0].callback();
  assert.equal(personagem.scene.events.listenerCount("update"), 0);
  assert.equal(estado.ativo, false);
  assert.equal(personagem.caixas, 1);
  assert.equal(personagem.sprite.branco, false);
  assert.ok(timers.every(t => t.removido));
});

test("acerto encerra a protecao e respawn seguinte reinicia o prazo", () => {
  const { personagem, estado, timers } = preparar();
  estado.entrar();
  estado.aoAcertarAtaque();
  assert.equal(estado.ativo, false);
  assert.equal(personagem.caixas, 1);
  estado.entrar();
  estado.entrar();
  assert.ok(timers.slice(0, 2).every(t => t.removido));
  assert.equal(estado.ativo, true);
  assert.equal(personagem.caixas, 0);
  personagem.scene.events.emit("shutdown");
  assert.equal(estado.ativo, false);
  assert.ok(timers.every(t => t.removido));
  assert.equal(personagem.caixas, 0);
});

test("callback do mesmo frame nao reaplica brilho depois de sair", () => {
  const { personagem, estado } = preparar();
  // Simula o fim por acerto durante a emissao do update, antes do brilho.
  personagem.scene.events.on("update", () => estado.aoAcertarAtaque());
  estado.entrar();
  personagem.scene.events.emit("update", 150, 150);
  assert.equal(estado.ativo, false);
  assert.equal(personagem.sprite.branco, false);
});

test("limpa o brilho mesmo com sprite temporariamente inativo", () => {
  const { personagem, estado } = preparar();
  estado.entrar();
  personagem.sprite.active = false;
  estado.sair(false);
  assert.equal(personagem.sprite.branco, false);
  estado.atualizarBrilho(150, 150);
  assert.equal(personagem.sprite.branco, false);
});
