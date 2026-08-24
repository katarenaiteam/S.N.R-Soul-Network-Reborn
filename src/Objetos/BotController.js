// Objetos/BotController.js
export default class BotController {
  constructor(scene) {
    this.scene = scene;
    this.bot = null;
    this.alvo = null;
    this.cerebro = null; // Recebe qualquer IA específica (Spider_IA, Batman_IA, etc.)

    this.teclas = {
      esquerda: { isDown: false, justDown: false, justUp: false, isVirtual: true },
      direita:  { isDown: false, justDown: false, justUp: false, isVirtual: true },
      cima:     { isDown: false, justDown: false, justUp: false, isVirtual: true },
      baixo:    { isDown: false, justDown: false, justUp: false, isVirtual: true },
      dash:     { isDown: false, justDown: false, justUp: false, isVirtual: true },
      atack:    { isDown: false, justDown: false, justUp: false, isVirtual: true },
      special:  { isDown: false, justDown: false, justUp: false, isVirtual: true },
      guard:    { isDown: false, justDown: false, justUp: false, isVirtual: true }
    };

    this.teclasParaZerar = [];
  }

  // Define qual cérebro vai controlar este hardware virtual
  setCerebro(InstanciaCerebro) {
    this.cerebro = InstanciaCerebro;
  }

  update(time, delta) {
    // Executa a limpeza dos impulsos de input
    while (this.teclasParaZerar.length > 0) {
      const item = this.teclasParaZerar.pop();
      if (this.teclas[item.tecla]) {
        this.teclas[item.tecla][item.prop] = false;
      }
    }

    // Se houver um cérebro acoplado, delega a lógica para ele
    if (this.cerebro) {
      this.cerebro.update(time, delta);
    }
  }

  segurar(nomeTecla) {
    if (this.teclas[nomeTecla]) {
      this.teclas[nomeTecla].isDown = true;
    }
  }

  soltar(nomeTecla) {
    if (this.teclas[nomeTecla] && this.teclas[nomeTecla].isDown) {
      this.teclas[nomeTecla].isDown = false;
      this.teclas[nomeTecla].justUp = true;
      this.teclasParaZerar.push({ tecla: nomeTecla, prop: "justUp" });
    }
  }

  pulsar(nomeTecla) {
    if (!this.teclas[nomeTecla]) return;

    this.teclas[nomeTecla].isDown = true;
    this.teclas[nomeTecla].justDown = true;
    this.teclasParaZerar.push({ tecla: nomeTecla, prop: "justDown" });

    this.scene.time.delayedCall(40, () => {
      this.soltar(nomeTecla);
    });
  }

  soltarTudo() {
    for (let t in this.teclas) {
      if (this.teclas[t].isDown) {
        this.teclas[t].justUp = true;
        this.teclasParaZerar.push({ tecla: t, prop: "justUp" });
      }
      this.teclas[t].isDown = false;
      this.teclas[t].justDown = false;
    }
  }
}