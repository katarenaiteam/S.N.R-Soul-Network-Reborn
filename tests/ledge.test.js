import test from "node:test";
import assert from "node:assert/strict";
import SistemaLedge from "../src/Objetos/SistemaLedge.js";
import EstadoCrouch from "../src/Estados/EstadoCrouch.js";
import EstadoInvencible from "../src/Estados/EstadoInvencible.js";

function preparar() {
  const entradas = [];
  const protecoes = [];
  const personagem = {
    pulos: 2,
    scene: { time: { now: 0 }, anims: { exists: () => false } },
    sprite: {
      active: true,
      anims: {
        currentAnim: { getLastFrame: () => "agachado" },
        pause(frame) { this.frame = frame; this.pausada = true; },
        resume() { this.pausada = false; }
      },
      body: { enable: true, left: 0, right: 20, top: 0, bottom: 20, blocked: { down: false } },
      setVelocityY(y) { this.vy = y; },
      setVelocityX(x) { this.vx = x; },
      setFlipX(valor) { this.flipX = valor; },
      off() {}
    },
    tocarAnimacao(anim) { this.anim = anim; },
    aplicarSquashPouso(intensidade) { this.intensidadeSquash = intensidade; },
    maquinaEstados: {
      estadoAtual: { nome: "jump" },
      mudarEstado(nome, dados) { entradas.push({ nome, dados }); return true; }
    },
    estadoInvencible: {
      ativo: false,
      entrar(ms) { protecoes.push(ms); this.ativo = true; },
      expiracao: { getRemaining: () => 5000 }
    }
  };
  const sistema = new SistemaLedge([{ x: 10, y: 10, largura: 40, altura: 60 }]);
  return { personagem, sistema, entradas, protecoes };
}

test("entrada aplica impulso e protecao; permanencia e reentrada precoce nao renovam", () => {
  const { personagem: p, sistema, entradas, protecoes } = preparar();
  sistema.atualizar(p);
  assert.deepEqual(entradas, [{ nome: "crouch", dados: { ledge: true, impulsoX: 120 } }]);
  assert.equal(p.sprite.vy, -360);
  assert.equal(p.sprite.vx, 120);
  assert.equal(p.intensidadeSquash, 1.3);
  assert.equal(p.pulos, 1);
  assert.deepEqual(protecoes, [600]);
  sistema.atualizar(p);
  p.sprite.body.left = 100;
  sistema.atualizar(p);
  p.scene.time.now = 100;
  p.sprite.body.left = 0;
  sistema.atualizar(p);
  p.scene.time.now = 601;
  sistema.atualizar(p);
  assert.equal(entradas.length, 1);
  assert.equal(p.pulos, 1);
  p.sprite.body.left = 100;
  sistema.atualizar(p);
  p.sprite.body.left = 0;
  sistema.atualizar(p);
  assert.equal(entradas.length, 2);
  assert.equal(p.pulos, 0);
});

test("ignora chao e estados incompativeis e preserva respawn mais longo", () => {
  for (const nome of ["dead", "ult", "teia"]) {
    const { personagem: p, sistema, entradas } = preparar();
    p.maquinaEstados.estadoAtual.nome = nome;
    sistema.atualizar(p);
    assert.equal(entradas.length, 0);
  }
  const { personagem: p, sistema, entradas, protecoes } = preparar();
  p.sprite.body.blocked.down = true;
  sistema.atualizar(p);
  assert.equal(entradas.length, 0);
  p.sprite.body.blocked.down = false;
  p.sprite.body.left = 100;
  sistema.atualizar(p);
  p.sprite.body.left = 0;
  p.estadoInvencible.ativo = true;
  sistema.atualizar(p);
  assert.equal(entradas.length, 1);
  assert.deepEqual(protecoes, []);
});

test("ledge usa imediatamente a pose agachada e mantem o avanco por 350 ms", () => {
  const { personagem: p, entradas } = preparar();
  const estado = new EstadoCrouch(p);
  estado.enter({ ledge: true, impulsoX: 180 });
  assert.equal(p.anim, "crouch");
  assert.equal(p.sprite.anims.frame, "agachado");
  assert.equal(p.sprite.anims.pausada, true);
  p.sprite.vx = 0; // A colisao com a lateral pode zerar o avanco.
  p.scene.time.now = 349;
  estado.execute();
  assert.equal(p.sprite.vx, 180);
  assert.equal(entradas.length, 0);
  p.scene.time.now = 350;
  estado.execute();
  assert.equal(entradas[0].nome, "jump");
  estado.exit();
  assert.equal(estado.ledgeAte, 0);
  assert.equal(p.sprite.anims.pausada, false);
});

test("impulso segue o interior da borda mesmo olhando para fora", () => {
  for (const direcao of [-1, 1]) {
    const { personagem: p, sistema } = preparar();
    sistema.areas[0].direcao = direcao;
    sistema.areas[0].impulsoHorizontal = 200;
    sistema.areas[0].impulso = 520;
    p.sprite.flipX = direcao === 1;
    sistema.atualizar(p);
    assert.equal(p.sprite.vx, direcao * 200);
    assert.equal(p.sprite.vy, -520);
    assert.equal(p.sprite.flipX, direcao === -1);
  }
});

test("acertar ataque respeita os 600 ms de protecao do ledge", () => {
  const { personagem: p } = preparar();
  const estado = new EstadoInvencible(p);
  estado.protecaoLedgeAte = 600;
  let saidas = 0;
  estado.sair = () => saidas++;
  p.scene.time.now = 599;
  estado.aoAcertarAtaque();
  assert.equal(saidas, 0);
  p.scene.time.now = 600;
  estado.aoAcertarAtaque();
  assert.equal(saidas, 1);
});
