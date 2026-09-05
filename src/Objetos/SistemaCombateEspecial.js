function obterRegistro(scene) {
  if (!scene.registroCombateEspecial) {
    scene.registroCombateEspecial = new Set();
  }
  return scene.registroCombateEspecial;
}

export function destruirColisor(colisor) {
  if (colisor?.active && colisor.world) {
    colisor.destroy();
  }
}

function obterLimitesCorpo(objeto) {
  const body = objeto?.body;
  if (!objeto?.active || !body?.enable || !Number.isFinite(body.x) || !Number.isFinite(body.y)) return null;
  return new Phaser.Geom.Rectangle(body.left, body.top, body.width, body.height);
}

function obterHurtboxesValidas(alvo) {
  const grupo = alvo?.grupoHurtbox;
  if (!grupo?.active || typeof grupo.getChildren !== "function") return [];
  return grupo.getChildren().filter((hurtbox) => obterLimitesCorpo(hurtbox));
}

export function obterAlvosCombate(personagem) {
  const scene = personagem.scene;
  const jogadores = scene.scene.key === "CenaHistoria"
    ? [personagem === scene.boss ? scene.jogador1 : scene.boss]
    : [scene.jogador1, scene.jogador2, scene.jogador3, scene.jogador4];
  const extras = scene.alvosAtaqueExtras ?? [];

  return [...new Set([...jogadores, ...extras])].filter((alvo) =>
    alvo &&
    alvo !== personagem &&
    alvo.dono !== personagem &&
    alvo.sprite?.active &&
    alvo.grupoHurtbox
  );
}

export function registrarAtaqueEspecial(logica, objeto, opcoes = {}) {
  if (!objeto?.active) return null;
  const scene = logica.scene;
  const registro = obterRegistro(scene);
  const entrada = {
    logica,
    objeto,
    dono: logica.personagem,
    categoria: opcoes.categoria ?? "corpo",
    contraAtacavel: opcoes.contraAtacavel !== false,
    // So ataques ligados ao lutador podem transferir o contra-ataque ao dono.
    // Invocacoes e projeteis devem apenas acionar o counter.
    contraAtacarDono: opcoes.contraAtacarDono === true,
    aoColidir: opcoes.aoColidir,
    aoAtingirAlvo: opcoes.aoAtingirAlvo,
    colisores: new Set(),
    encerrado: false,
  };

  const remover = () => {
    if (entrada.encerrado) return;
    entrada.encerrado = true;
    entrada.colisores.forEach((colisor) => {
      // O mesmo overlap pertence aos dois ataques. O primeiro lado pode já
      // tê-lo destruído enquanto o segundo está sendo removido.
      destruirColisor(colisor);
    });
    entrada.colisores.clear();
    if (entrada.verificarAlvos) {
      scene.events.off("postupdate", entrada.verificarAlvos);
    }
    registro.delete(entrada);
  };
  entrada.remover = remover;
  objeto.once?.("destroy", remover);

  if (entrada.aoAtingirAlvo) {
    entrada.verificarAlvos = () => {
      const limitesObjeto = obterLimitesCorpo(objeto);
      if (!limitesObjeto || entrada.encerrado) return;

      obterAlvosCombate(entrada.dono).forEach((alvo) => {
        if (entrada.encerrado) return;
        const atingiu = obterHurtboxesValidas(alvo).some((hurtbox) => {
          const limitesHurtbox = obterLimitesCorpo(hurtbox);
          return limitesHurtbox && Phaser.Geom.Intersects.RectangleToRectangle(
            limitesObjeto,
            limitesHurtbox,
          );
        });
        if (atingiu && !entrada.encerrado) entrada.aoAtingirAlvo(alvo, objeto);
      });
    };
    scene.events.on("postupdate", entrada.verificarAlvos);
  }

  if (entrada.categoria === "projetil") {
    registro.forEach((outra) => {
      if (
        outra.encerrado ||
        outra.categoria !== "projetil" ||
        outra.dono === entrada.dono ||
        !outra.objeto?.active
      ) return;

      if (!objeto.body || !outra.objeto.body) return;
      const colisor = scene.physics.add.overlap(objeto, outra.objeto, () => {
        if (entrada.encerrado || outra.encerrado) return;
        entrada.aoColidir?.(outra);
        outra.aoColidir?.(entrada);
        entrada.remover();
        outra.remover();
      });
      entrada.colisores.add(colisor);
      outra.colisores.add(colisor);
    });
  }

  registro.add(entrada);
  return entrada;
}

export function obterAtaquesEspeciaisInimigos(scene, personagem) {
  return [...obterRegistro(scene)].filter((entrada) =>
    !entrada.encerrado &&
    entrada.contraAtacavel &&
    entrada.dono !== personagem &&
    entrada.objeto?.active
  );
}
