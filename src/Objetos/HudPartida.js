export function criarHudPartida(jogador, personagem, x, y, ladoDireito) {
    // Os retratos usam a mesma arte-base de 800x650 da barra de ult.
    const larguraRetrato = 440;
    const alturaRetrato = larguraRetrato * (650 / 800);
    const retratoPorPersonagem = {
      SpiderMan: "Sp_portrait",
      Miku: "Miku_portrait",
      Ken: "Ken_portrait",
      FJ: "FJ_portrait",
      Slenderman: "Slan_portrait",
      Pingu: "Pingu_portrait"
    };
    const hud = this.add.container(x, y).setScrollFactor(0).setDepth(1000);
    const chaveRetrato = retratoPorPersonagem[personagem];

    if (chaveRetrato) {
      const retrato = this.add.image(0, 0, chaveRetrato)
        .setOrigin(ladoDireito ? 1 : 0, 0)
        .setDisplaySize(larguraRetrato, alturaRetrato);
      hud.add(retrato);
    }

    // A arte fica no rodape do frame de 800x650: use a mesma escala
    // do retrato para que a barra nao seja desenhada abaixo da tela.
    const barraUlt = this.add.sprite(0, 0, "ultbar", 0)
      .setOrigin(ladoDireito ? 1 : 0, 0)
      .setDisplaySize(larguraRetrato, larguraRetrato * (650 / 800));

    hud.add(barraUlt);
    hud.barraUlt = barraUlt;
    hud.frameUltAtual = 0;

    const habilidade = jogador.obterIndicadorHabilidade?.();
    if (habilidade) {
      // Sobrepoe o canto superior direito da porcentagem, atras dos numeros.
      // As duas HUDs usam a mesma disposicao local, deslocada em 435 pixels.
      const indicador = this.add.container(ladoDireito ? -35 : 400, 190)
        .setScale(1.5);
      const circulo = this.add.graphics();
      const { x: rx, y: ry, largura, altura } = habilidade.recorte;
      const icone = this.add.image(0, 0, habilidade.textura, 0);
      const escala = 68 / largura;
      // Centraliza somente o rosto recortado, sem redimensionar o sprite do jogo.
      icone.setCrop(rx, ry, largura, altura).setScale(escala);
      icone.setPosition(
        (icone.width / 2 - rx - largura / 2) * escala,
        (icone.height / 2 - ry - altura / 2) * escala,
      );
      indicador.add([circulo, icone]);
      hud.add(indicador);
      hud.indicadorHabilidade = { circulo, icone, carga: -1 };
      atualizarIndicadorHabilidade(jogador, hud);
    }

    hud.setText = (valor) => {
      const porcentagem = Math.max(0, Math.floor(Number.parseFloat(valor) || 0));
      if (hud.numero) hud.remove(hud.numero, true);

      const caracteres = [...String(porcentagem), "%"];
      const passo = 53;
      // A borda esquerda fica fixa: novos algarismos entram somente à direita.
      const inicioX = ladoDireito ? -210 : 225;
      const numero = this.add.container(0, 0);

      caracteres.forEach((caractere, indice) => {
        const porcento = caractere === "%";
        const imagem = this.add.image(
          inicioX + indice * passo,
          210,
          porcento ? "pct.png" : `${caractere}.png`,
        )
          .setOrigin(0, 0)
          .setDisplaySize(porcento ? 58 : 74, porcento ? 58 : 88);
        numero.add(imagem);
      });

      hud.add(numero);
      hud.numero = numero;
    };

    jogador.textoDano = hud;
    hud.setText(0);
    return hud;
  }


export function atualizarBarraUlt(jogador, hud) {
  atualizarIndicadorHabilidade(jogador, hud);
  if (!jogador || !hud?.barraUlt) {
    return;
  }

  const progresso = Phaser.Math.Clamp(
    jogador.ultCarga / jogador.ultCargaMax,
    0,
    1
  );

  const ultimoFrame = 65;

  const frame = progresso >= 1
    ? ultimoFrame
    : Math.floor(
        progresso * ultimoFrame
      );

  if (hud.frameUltAtual === frame) {
    return;
  }

  hud.frameUltAtual = frame;

  hud.barraUlt.setFrame(frame);
}

export function atualizarIndicadorHabilidade(jogador, hud) {
  const indicador = hud?.indicadorHabilidade;
  if (!indicador) return;
  const habilidade = jogador.obterIndicadorHabilidade();
  const carga = Math.max(0, Math.min(1, habilidade.carga));
  if (indicador.carga === carga) return;
  indicador.carga = carga;
  const { circulo, icone } = indicador;
  circulo.clear();
  circulo.fillStyle(0x808080, 1).fillCircle(0, 0, 40);
  icone.setAlpha(0.3 + 0.7 * carga);
}

