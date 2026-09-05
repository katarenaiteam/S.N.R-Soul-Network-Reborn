const ALIASES_CENAS = {
  preload: "CenaPreload",
  start: "CenaStart",
  menu: "CenaStart",
  personagens: "Charmenu",
  charmMenu: "Charmenu",
  mapas: "CenaSelecaoMapa",
  luta: "cenaPrincipal",
  fase: "cenaPrincipal",
  historia: "CenaHistoria",
  gameover: "CenaGameOver",
  creditos: "CenaCreditos",
};

function normalizar(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function instalarComandosDebug(game) {
  let removerDiagnosticoSpecial = null;
  const obterCenas = () => Object.keys(game.scene.keys);

  const resolverCena = (nome) => {
    const procurado = normalizar(nome);
    const alias = Object.entries(ALIASES_CENAS).find(
      ([apelido]) => normalizar(apelido) === procurado,
    );
    if (alias) return alias[1];
    return obterCenas().find((key) => normalizar(key) === procurado);
  };

  const cenaAtual = () => {
    const ativas = game.scene.getScenes(true);
    return ativas[ativas.length - 1] ?? null;
  };

  const api = {
    game,

    cenas() {
      const ativas = new Set(game.scene.getScenes(true).map((scene) => scene.scene.key));
      const resultado = obterCenas().map((nome) => ({
        cena: nome,
        ativa: ativas.has(nome),
      }));
      console.table(resultado);
      return resultado;
    },

    atual() {
      const scene = cenaAtual();
      const nome = scene?.scene.key ?? null;
      console.log(nome ? `Cena atual: ${nome}` : "Nenhuma cena esta ativa.");
      return nome;
    },

    ir(nome, dados = {}) {
      const destino = resolverCena(nome);
      if (!destino) {
        console.error(`Cena '${nome}' nao encontrada. Use cenas() para listar.`);
        return false;
      }

      // Inclui cenas pausadas/adormecidas e encerra antes de iniciar o destino.
      // Nao deixa um start enfileirado na cena antiga entre comandos do console.
      game.scene.getScenes(false).forEach((scene) => {
        if (scene.sys.isActive() || scene.sys.isPaused() || scene.sys.isSleeping()) {
          game.scene.stop(scene.scene.key);
        }
      });
      game.sound.stopAll();
      game.scene.start(destino, dados ?? {});
      console.log(`Indo para: ${destino}`);
      return true;
    },

    resetar(dados) {
      const scene = cenaAtual();
      if (!scene) {
        console.error("Nenhuma cena ativa para reiniciar.");
        return false;
      }

      let dadosReset = dados;
      if (dadosReset === undefined && scene.scene.key === "cenaPrincipal") {
        dadosReset = {
          p1: scene.escolhaP1,
          p2: scene.escolhaP2,
          ClasseMapa: scene.ClasseMapa,
        };
      }

      api.ir(scene.scene.key, dadosReset ?? {});
      console.log(`Cena reiniciada: ${scene.scene.key}`);
      return true;
    },

    diagnosticarSpecials() {
      removerDiagnosticoSpecial?.();

      const aoPressionar = (evento) => {
        if (evento.code !== "KeyG" && evento.code !== "KeyK") return;

        // Aguarda o update do jogo ler o mesmo evento antes de registrar.
        requestAnimationFrame(() => {
          const scene = game.scene.getScene("cenaPrincipal");
          if (!scene?.scene.isActive()) return;

          const jogador = evento.code === "KeyG" ? scene.jogador1 : scene.jogador2;
          const controle = jogador?.controle;
          const tipo = jogador?.obterTipoSpecial?.();
          console.log(`[special ${evento.code}]`, {
            eventoNativoRecebido: true,
            estado: jogador?.maquinaEstados?.estadoAtual?.nome,
            esquerda: controle?.estaApertado("esquerda"),
            direita: controle?.estaApertado("direita"),
            cima: controle?.estaApertado("cima"),
            baixo: controle?.estaApertado("baixo"),
            special: controle?.estaApertado("special"),
            tipoResolvido: tipo,
            existe: !!jogador?.specials?.[tipo],
            podeUsar: jogador?.podeUsarSpecial?.(tipo),
          });
        });
      };

      window.addEventListener("keydown", aoPressionar);
      removerDiagnosticoSpecial = () => window.removeEventListener("keydown", aoPressionar);
      console.log("Diagnostico ligado. Volte ao jogo e tente o special direcional do P1.");
      return true;
    },

    ajuda() {
      console.log([
        "Comandos de teste:",
        "  cenas()                 lista todas as telas",
        "  atual()                 mostra a tela atual",
        "  ir('luta')              abre uma tela",
        "  resetar()               reinicia a tela/fase atual",
        "  SNR.diagnosticarSpecials() registra a leitura de G/K",
        "Aliases: preload, start, personagens, mapas, luta, historia, gameover, creditos",
      ].join("\n"));
    },
  };

  window.SNR = api;
  window.cenas = api.cenas.bind(api);
  window.atual = api.atual.bind(api);
  window.ir = api.ir.bind(api);
  window.resetar = api.resetar.bind(api);

  console.log("Comandos de teste carregados. Digite SNR.ajuda() no console.");
}
