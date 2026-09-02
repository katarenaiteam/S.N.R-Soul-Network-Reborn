function obterRegistro(scene) {
  if (!scene.registroCombateEspecial) {
    scene.registroCombateEspecial = new Set();
  }
  return scene.registroCombateEspecial;
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
    aoColidir: opcoes.aoColidir,
    colisores: new Set(),
    encerrado: false,
  };

  const remover = () => {
    if (entrada.encerrado) return;
    entrada.encerrado = true;
    entrada.colisores.forEach((colisor) => colisor?.destroy());
    entrada.colisores.clear();
    registro.delete(entrada);
  };
  entrada.remover = remover;
  objeto.once?.("destroy", remover);

  if (entrada.categoria === "projetil") {
    registro.forEach((outra) => {
      if (
        outra.encerrado ||
        outra.categoria !== "projetil" ||
        outra.dono === entrada.dono ||
        !outra.objeto?.active
      ) return;

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
