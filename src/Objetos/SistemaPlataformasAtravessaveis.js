export default class SistemaPlataformasAtravessaveis {
  constructor(scene) {
    this.scene = scene;
    this.grupo = scene.physics.add.staticGroup();
    this.jogadores = new Map();
  }

  registrar(personagem, podeDescer = true) {
    this.jogadores.set(personagem, {
      podeDescer,
      ignorarAte: 0
    });

    this.scene.physics.add.collider(
      personagem.sprite,
      this.grupo,
      null,
      (_, plataforma) => this.podeColidir(personagem, plataforma)
    );
  }

  podeColidir(personagem, plataforma) {
    const dados = this.jogadores.get(personagem);
    const body = personagem.sprite.body;

    if (this.scene.time.now < dados.ignorarAte) return false;

    // Subindo = atravessa
    if (body.velocity.y < 0) return false;

    const baseAnterior = body.prev.y + body.height;
    const topo = plataforma.body.y;

    // Só colide se veio de cima
    return baseAnterior <= topo + 5;
  }

  atualizar() {
    for (const [personagem, dados] of this.jogadores) {
      if (!dados.podeDescer || !personagem.controle) continue;

      if (
        personagem.controle.foiDuploBaixo() &&
        personagem.sprite.body.blocked.down &&
        this.estaSobrePlataforma(personagem)
      ) {
        this.descer(personagem);
      }
    }
  }

  // A IA usa a mesma descida dos controles, sem simular um teclado fisico.
  descer(personagem) {
    const dados = this.jogadores.get(personagem);
    if (!dados?.podeDescer || !personagem.sprite.body.blocked.down ||
        !this.estaSobrePlataforma(personagem)) return false;
    if (personagem.maquinaEstados.mudarEstado("jump") === false) return false;
    dados.ignorarAte = this.scene.time.now + 200;
    personagem.sprite.setVelocityY(100);
    return true;
  }

  estaSobrePlataforma(personagem) {
    const body = personagem.sprite.body;

    return this.grupo.getChildren().some((p) => {
      const plat = p.body;

      const dentroX =
        body.right > plat.left &&
        body.left < plat.right;

      const emCima =
        Math.abs(body.bottom - plat.top) <= 8;

      return dentroX && emCima;
    });
  }
}
