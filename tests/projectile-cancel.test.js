import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import Hadouken from "../src/Personagensjs/Specials/Ken/hadouken.js";
import WebShot from "../src/Personagensjs/Specials/Spiderman/WebShot.js";
import AirWebShot from "../src/Personagensjs/Specials/Spiderman/AirWebshot.js";
import EstadoSpecial from "../src/Estados/EstadoSpecial.js";
import GerenciadorEstados from "../src/Estados/GerenciadorEstados.js";

function preparar(Logica, animacao) {
  const timers = [];
  const personagem = {
    scene: {
      events: new EventEmitter(),
      sound: { locked: false, play() {} },
      time: {
        delayedCall(atraso, callback) {
          const timer = { callback, removido: false, remove() { this.removido = true; } };
          timers.push(timer);
          return timer;
        }
      },
      physics: { add: { sprite() { assert.fail("Projetil criado depois da interrupcao"); } } }
    },
    sprite: {
      active: true,
      angle: 0,
      body: { blocked: { down: false } },
      setVelocityX() {},
      setVelocityY() {},
      setAngle(angulo) { this.angle = angulo; }
    },
    tocarSomSorteado() {},
    logicasEspeciaisAtivas: [],
    maquinaEstados: new GerenciadorEstados()
  };
  const estado = new EstadoSpecial(personagem);
  const logica = new Logica(personagem, { animacao }, estado);
  estado.logicaSpecial = logica;
  personagem.logicasEspeciaisAtivas.push(logica);
  personagem.maquinaEstados.estadoAtual = estado;
  for (const nome of ["dano", "teia", "jump"]) {
    personagem.maquinaEstados.adicionarEstado(nome, { enter() {}, exit() {} });
  }
  return { personagem, estado, logica, timers };
}

for (const [nome, Logica, animacao] of [
  ["Hadouken terrestre", Hadouken, "ken_neSpecial"],
  ["Hadouken aereo", Hadouken, "ken_AneSpecial"],
  ["Webshot", WebShot, "spy_neSpecial"]
]) {
  for (const interrupcao of ["dano", "teia", "agarrao"]) {
    test(`${nome}: cancela preparacao por ${interrupcao}`, () => {
      const { personagem, estado, logica, timers } = preparar(Logica, animacao);
      logica.executar();
      assert.equal(timers.length, 1);
      // O agarrão encerra o special por finalizarSpecial().
      if (interrupcao === "agarrao") estado.finalizarSpecial();
      else personagem.maquinaEstados.mudarEstado(interrupcao);
      assert.equal(timers[0].removido, true);
      assert.equal(personagem.logicasEspeciaisAtivas.includes(logica), false);
      // Mesmo um callback antigo não pode produzir um disparo tardio.
      timers[0].callback();
      logica.executar();
      assert.equal(timers.length, 1);
      assert.equal(logica.projetil, null);
    });
  }
}

for (const Logica of [Hadouken, WebShot, AirWebShot]) {
  test(`${Logica.name}: preserva projetil ja disparado`, () => {
    const { personagem, logica } = preparar(Logica);
    const projetil = { active: true, destroy() { assert.fail("Disparo destruido"); } };
    logica.projetil = projetil;
    if (Logica === AirWebShot) {
      logica.anguloOriginal = 0;
      personagem.sprite.angle = -35;
    }
    personagem.maquinaEstados.mudarEstado("dano");
    assert.equal(logica.projetil, projetil);
    assert.equal(personagem.logicasEspeciaisAtivas.includes(logica), true);
    assert.equal(personagem.sprite.angle, 0);
  });
}
