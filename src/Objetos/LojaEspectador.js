const RAIO_RODA = 650;
const TAMANHO_ITEM = 400;
const ANGULO_INICIAL_SLOT = Math.PI / 4;

export default class LojaEspectador {
  constructor(scene, mqtt) {
    this.scene = scene;
    this.mqtt = mqtt;
    this.aberta = false;
    this.arrastando = false;
    this.indiceSlot = 0;
    this.rotacaoRoda = 0;
    this.ultimaCompra = -Infinity;
    this.itens = [
      { efeito: "miku-rain", textura: "shop-miku-rain", rotulo: "MIKU RAIN" },
      { efeito: "less", textura: "less-shop", rotulo: "LESS", escolherJogador: true },
      { efeito: "puppet", textura: "puppet-shop", rotulo: "PUPPET" },
      { efeito: "life", textura: "Lup-shop", rotulo: "LIFE", escolherJogador: true },
      { efeito: "slen-shop", textura: "slen-shop", rotulo: "SLENDER", escolherJogador: true },
      { efeito: "1hit", textura: "1hit-shop", rotulo: "1 HIT" },
      { efeito: "froze-shop", textura: "froze-shop", rotulo: "FROZE", escolherJogador: true },
      { efeito: "lava-shop", textura: "lava-shop", rotulo: "LAVA" },
      { efeito: "raio", textura: "raio-shop", rotulo: "RAIO", escolherJogador: true },
      { efeito: "ult-shop", textura: "ult-shop", rotulo: "ULT", escolherJogador: true },
      { efeito: "dead-shop", textura: "dead-shop", rotulo: "DEAD", escolherJogador: true },
    ];
    this.escolhendoJogador = false;
    this.escala = Math.min(scene.scale.width / 1920, scene.scale.height / 1080);
    this.centroX = 0;
    this.centroY = 0;
    this.raio = RAIO_RODA * this.escala;

    this.roda = scene.add.graphics().setScrollFactor(0).setDepth(4001).setVisible(false);
    this.iconeLoja = scene.add.image(55 * this.escala, 55 * this.escala, "shop-icon")
      .setDisplaySize(86 * this.escala, 86 * this.escala)
      .setScrollFactor(0)
      .setDepth(4002)
      .setInteractive({ useHandCursor: true });
    this.iconesItens = this.itens.map((item) => scene.add.image(0, 0, item.textura)
      .setOrigin(0.5)
      .setDisplaySize(TAMANHO_ITEM * this.escala, TAMANHO_ITEM * this.escala)
      .setScrollFactor(0)
      .setDepth(4003)
      .setVisible(false));
    this.iconeItem = this.iconesItens[this.indiceSlot];
    this.rotulo = scene.add.text(0, 0, "MIKU RAIN", {
      fontFamily: "RetroFont, monospace",
      fontSize: `${22 * this.escala}px`,
      color: "#eafff1",
      align: "center",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4003).setVisible(false);
    this.preco = scene.add.text(0, 0, "GRÁTIS", {
      fontFamily: "RetroFont, monospace",
      fontSize: `${18 * this.escala}px`,
      color: "#9cffbb",
      align: "center",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4003).setVisible(false);
    this.fechar = scene.add.text(55 * this.escala, 55 * this.escala, "×", {
      fontFamily: "monospace",
      fontSize: `${54 * this.escala}px`,
      color: "#ffffff",
      align: "center",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(4004).setVisible(false)
      .setInteractive({ useHandCursor: true });
    const centroEscolhaX = this.raio * 0.62;
    const centroEscolhaY = this.raio * 0.63;
    this.fundoEscolha = scene.add.rectangle(
      centroEscolhaX,
      centroEscolhaY,
      370 * this.escala,
      210 * this.escala,
      0x0b1b10,
      0.96,
    ).setScrollFactor(0).setDepth(4004).setVisible(false);
    this.textoEscolha = scene.add.text(
      centroEscolhaX,
      centroEscolhaY - 65 * this.escala,
      "ESCOLHER JOGADOR",
      {
        fontFamily: "RetroFont, monospace",
        fontSize: `${19 * this.escala}px`,
        color: "#eafff1",
        align: "center",
      },
    ).setOrigin(0.5).setScrollFactor(0).setDepth(4005).setVisible(false);
    this.botoesJogador = [1, 2].map((jogador, indice) => {
      const x = centroEscolhaX + (indice === 0 ? -76 : 76) * this.escala;
      const fundo = scene.add.rectangle(x, centroEscolhaY + 15 * this.escala, 128 * this.escala, 76 * this.escala, 0x1c5934, 1)
        .setScrollFactor(0)
        .setDepth(4005)
        .setVisible(false)
        .setInteractive({ useHandCursor: true });
      const texto = scene.add.text(x, centroEscolhaY + 15 * this.escala, `P${jogador}`, {
        fontFamily: "RetroFont, monospace",
        fontSize: `${25 * this.escala}px`,
        color: "#ffffff",
        align: "center",
      }).setOrigin(0.5).setScrollFactor(0).setDepth(4006).setVisible(false);
      const escolher = (pointer) => {
        this.pointerIgnorado = pointer.id;
        this.finalizarCompraComJogador(jogador);
      };
      fundo.on("pointerdown", escolher);
      this.scene.events.once("shutdown", () => fundo.off("pointerdown", escolher));
      return { fundo, texto };
    });

    this.aoClicarIcone = (pointer) => {
      this.abrir();
      this.pointerIgnorado = pointer.id;
    };
    this.aoClicarFechar = (pointer) => {
      this.fecharRoda();
      this.pointerIgnorado = pointer.id;
    };
    this.aoPressionar = (pointer) => this.iniciarArrasto(pointer);
    this.aoMover = (pointer) => this.atualizarArrasto(pointer);
    this.aoSoltar = (pointer) => this.finalizarArrasto(pointer);
    this.aoEncerrar = () => this.destruir();
    this.iconeLoja.on("pointerdown", this.aoClicarIcone);
    this.fechar.on("pointerdown", this.aoClicarFechar);
    scene.input.on("pointerdown", this.aoPressionar);
    scene.input.on("pointermove", this.aoMover);
    scene.input.on("pointerup", this.aoSoltar);
    scene.events.once("shutdown", this.aoEncerrar);

    this.objetos = [
      this.roda,
      this.iconeLoja,
      ...this.iconesItens,
      this.rotulo,
      this.preco,
      this.fechar,
      this.fundoEscolha,
      this.textoEscolha,
      ...this.botoesJogador.flatMap(({ fundo, texto }) => [fundo, texto]),
    ];
  }

  abrir() {
    if (this.aberta) return;
    this.aberta = true;
    this.iconeLoja.setVisible(false);
    this.roda.setVisible(true);
    this.iconesItens.forEach((icone) => icone.setVisible(true));
    this.rotulo.setVisible(true);
    this.preco.setVisible(true);
    this.fechar.setVisible(true);
    this.mostrarEscolhaJogador(false);
    this.desenharRoda();
  }

  fecharRoda() {
    this.aberta = false;
    this.arrastando = false;
    this.roda.setVisible(false);
    this.iconesItens.forEach((icone) => icone.setVisible(false));
    this.rotulo.setVisible(false);
    this.preco.setVisible(false);
    this.fechar.setVisible(false);
    this.mostrarEscolhaJogador(false);
    this.iconeLoja.setVisible(true);
  }

  mostrarEscolhaJogador(visible) {
    this.escolhendoJogador = visible;
    this.fundoEscolha.setVisible(visible);
    this.textoEscolha.setVisible(visible);
    this.botoesJogador.forEach(({ fundo, texto }) => {
      fundo.setVisible(visible);
      texto.setVisible(visible);
    });
    this.iconesItens.forEach((icone) => icone.setVisible(this.aberta && !visible));
    this.rotulo.setVisible(this.aberta && !visible);
    this.preco.setVisible(this.aberta && !visible);
  }

  desenharRoda() {
    this.roda.clear();
    const raioInterior = this.raio * 0.68;
    const segmentos = 128;
    this.roda.fillStyle(0x07170d, 0.96);
    for (let indice = 0; indice < segmentos; indice += 1) {
      const anguloInicio = (indice / segmentos) * Math.PI * 2;
      const anguloFim = ((indice + 1) / segmentos) * Math.PI * 2;
      this.roda.fillPoints([
        {
          x: this.centroX + Math.cos(anguloInicio) * this.raio,
          y: this.centroY + Math.sin(anguloInicio) * this.raio,
        },
        {
          x: this.centroX + Math.cos(anguloFim) * this.raio,
          y: this.centroY + Math.sin(anguloFim) * this.raio,
        },
        {
          x: this.centroX + Math.cos(anguloFim) * raioInterior,
          y: this.centroY + Math.sin(anguloFim) * raioInterior,
        },
        {
          x: this.centroX + Math.cos(anguloInicio) * raioInterior,
          y: this.centroY + Math.sin(anguloInicio) * raioInterior,
        },
      ], true, true);
    }
    this.roda.lineStyle(6 * this.escala, 0x50e17c, 0.95);
    this.roda.strokeCircle(this.centroX, this.centroY, this.raio);
    this.roda.lineStyle(3 * this.escala, 0xa5ed69, 0.85);
    this.roda.strokeCircle(this.centroX, this.centroY, raioInterior);
    this.roda.lineStyle(2 * this.escala, 0x37b85f, 0.75);
    const passoAngular = (Math.PI * 2) / this.itens.length;
    for (let indice = 0; indice < this.itens.length; indice += 1) {
      const angulo = this.rotacaoRoda + ANGULO_INICIAL_SLOT + passoAngular / 2 + indice * passoAngular;
      this.roda.lineBetween(
        Math.cos(angulo) * raioInterior,
        Math.sin(angulo) * raioInterior,
        Math.cos(angulo) * this.raio,
        Math.sin(angulo) * this.raio,
      );
    }

    const raioItem = this.raio * 0.84;
    this.iconesItens.forEach((icone, indice) => {
      const angulo = ANGULO_INICIAL_SLOT + this.rotacaoRoda + indice * passoAngular;
      icone.setPosition(
        this.centroX + Math.cos(angulo) * raioItem,
        this.centroY + Math.sin(angulo) * raioItem,
      );
    });
    this.iconeItem = this.iconesItens[this.indiceSlot];
    const tamanhoItem = TAMANHO_ITEM * this.escala;
    const tamanhoItemInativo = TAMANHO_ITEM * 0.68 * this.escala;
    this.iconesItens.forEach((icone, indice) => {
      const tamanho = indice === this.indiceSlot ? tamanhoItem : tamanhoItemInativo;
      icone.setDisplaySize(tamanho, tamanho);
    });
    const item = this.itens[this.indiceSlot];
    this.iconeItem.setDisplaySize(tamanhoItem, tamanhoItem);
    this.rotulo.setText(item.rotulo);
    this.rotulo.setPosition(this.iconeItem.x, this.iconeItem.y + tamanhoItem * 0.68);
    this.preco.setPosition(this.iconeItem.x, this.iconeItem.y + tamanhoItem * 0.95);
    this.fechar.setPosition(55 * this.escala, 55 * this.escala);
  }

  iniciarArrasto(pointer) {
    if (!this.aberta || this.escolhendoJogador) return;
    if (pointer.id === this.pointerIgnorado) return;
    this.arrastando = true;
    this.anguloAnterior = Math.atan2(pointer.y - this.centroY, pointer.x - this.centroX);
    this.deslocamentoAngular = 0;
    this.xInicial = pointer.x;
    this.yInicial = pointer.y;
  }

  atualizarArrasto(pointer) {
    if (!this.aberta || this.escolhendoJogador || !this.arrastando || !pointer.isDown) return;
    const anguloAtual = Math.atan2(pointer.y - this.centroY, pointer.x - this.centroX);
    let delta = anguloAtual - this.anguloAnterior;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    this.deslocamentoAngular += delta;
    this.anguloAnterior = anguloAtual;
  }

  finalizarArrasto(pointer) {
    if (pointer.id === this.pointerIgnorado) {
      this.pointerIgnorado = null;
      return;
    }
    if (!this.aberta || this.escolhendoJogador || !this.arrastando) return;
    this.arrastando = false;
    const distanciaArrasto = Phaser.Math.Distance.Between(
      this.xInicial,
      this.yInicial,
      pointer.x,
      pointer.y,
    );
    if (distanciaArrasto > 24 * this.escala) {
      const deslocamentoMinimo = Math.PI / 18;
      if (Math.abs(this.deslocamentoAngular) < deslocamentoMinimo) return;
      const direcao = Math.sign(this.deslocamentoAngular);
      const proximoSlot = (this.indiceSlot - direcao + this.itens.length) % this.itens.length;
      const animacao = { rotacao: this.rotacaoRoda };
      this.scene.tweens.add({
        targets: animacao,
        rotacao: this.rotacaoRoda + direcao * ((Math.PI * 2) / this.itens.length),
        duration: 180,
        ease: "Power2",
        onUpdate: () => {
          this.rotacaoRoda = animacao.rotacao;
          this.desenharRoda();
        },
        onComplete: () => {
          this.indiceSlot = proximoSlot;
          this.rotacaoRoda = animacao.rotacao;
          this.desenharRoda();
        },
      });
      return;
    }

    if (Phaser.Math.Distance.Between(pointer.x, pointer.y, this.iconeItem.x, this.iconeItem.y) <= TAMANHO_ITEM * this.escala / 2) {
      this.comprarItem();
    }
  }

  comprarItem() {
    const agora = this.scene.time.now;
    if (agora - this.ultimaCompra < 500) return;
    this.ultimaCompra = agora;

    const item = this.itens[this.indiceSlot];
    if (item.escolherJogador) {
      this.mostrarEscolhaJogador(true);
      return;
    }

    this.publicarCompra(item.efeito);
  }

  finalizarCompraComJogador(jogador) {
    if (!this.escolhendoJogador) return;
    this.publicarCompra(this.itens[this.indiceSlot].efeito, jogador);
  }

  publicarCompra(efeito, jogador) {
    this.mqtt?.publish("shop/purchase", {
      efeito,
      jogador,
      pedidoId: `${this.mqtt.clientId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
    this.fecharRoda();
  }

  destruir() {
    this.scene.input.off("pointerdown", this.aoPressionar);
    this.scene.input.off("pointermove", this.aoMover);
    this.scene.input.off("pointerup", this.aoSoltar);
    this.iconeLoja.off("pointerdown", this.aoClicarIcone);
    this.fechar.off("pointerdown", this.aoClicarFechar);
    this.scene.events.off("shutdown", this.aoEncerrar);
    this.objetos.forEach((objeto) => objeto.destroy());
  }
}