import { registrarAtaqueEspecial } from "../../../Objetos/SistemaCombateEspecial.js";

export default class NeSpecial {
  constructor(personagem, special, estado) {
    this.personagem = personagem;
    this.scene = personagem.scene;
    this.special = special;
    this.estado = estado;
    this.projetil = null;
    this.hitboxes = [];
    this.registros = [];
    this.finalizado = false;
    this.cartas = false;
    this.alvosAtingidos = new Set();
    this.aoAtualizarPose = this.aoAtualizarPose.bind(this);
  }

  executar() {
    const sprite = this.personagem.sprite;
    this.direcao = sprite.flipX ? -1 : 1;
    if (this.special.propriedades?.travarMovimentoAir) sprite.setVelocityX(0);
    sprite.on("animationupdate", this.aoAtualizarPose);
    this.aoAtualizarPose(sprite.anims.currentAnim, sprite.anims.currentFrame);
  }

  aoAtualizarPose(animacao, frame) {
    if (this.finalizado || this.projetil || animacao?.key !== this.special.animacao) return;
    if (Number(frame?.textureFrame) < this.special.frameProjetil) return;
    this.criarProjetil();
  }

  criarProjetil() {
    const sprite = this.personagem.sprite;
    sprite.off("animationupdate", this.aoAtualizarPose);
    const efeito = this.scene.add.sprite(
      sprite.x + this.special.offsetProjetilX * this.direcao,
      sprite.y + this.special.offsetProjetilY,
      this.special.texturaProjetil ?? "Slan_NS-efect",
      0,
    );
    this.projetil = efeito;
    this.inicioProjetil = this.scene.time.now;
    this.origemProjetilX = efeito.x;
    this.origemProjetilY = efeito.y;
    efeito.setScale(this.special.escalaProjetil ?? 1);
    efeito.setFlipX(this.direcao < 0);
    efeito.setDepth(sprite.depth + 1);
    this.scene.camHUD?.ignore(efeito);
    const escala = this.special.escalaProjetil ?? 1;
    for (const caixa of this.special.hitboxesProjetil) {
      const hitbox = this.scene.add.zone(
        efeito.x + caixa.offsetX * escala * this.direcao,
        efeito.y + caixa.offsetY * escala,
        caixa.largura * escala,
        caixa.altura * escala,
      );
      this.scene.physics.add.existing(hitbox);
      hitbox.body.setAllowGravity(false);
      hitbox.body.setImmovable(true);
      hitbox.body.debugBodyColor = 0xff0000;
      this.scene.camHUD?.ignore(hitbox);
      this.hitboxes.push(hitbox);
    }

    this.registrarProjetil();
    efeito.on("animationupdate", (animacao, frame) => {
      if (!this.cartas && Number(frame.textureFrame) >= (this.special.framesCorte ?? 3)) {
        this.cartas = true;
        this.hitboxes.forEach((hitbox) => { hitbox.body.debugBodyColor = 0x00ffff; });
        // Mantem o corpo para colisao com projeteis, sem atingir personagens.
        this.registros.forEach((registro) => registro.remover());
        this.registrarProjetil();
      }
    });
    efeito.once("animationcomplete", () => this.destruirProjetil());
    efeito.once("destroy", () => this.finalizar());
    efeito.play(this.special.animacaoProjetil ?? "slan_NS-efect");
  }

  atualizar() {
    if (!this.projetil?.active || !this.special.velocidadeProjetil) return;
    const progresso = Math.min(
      1,
      (this.scene.time.now - this.inicioProjetil) / 1000 *
        this.special.velocidadeProjetil / this.special.distanciaProjetil,
    );
    const distancia = this.special.distanciaProjetil *
      progresso * progresso * (3 - 2 * progresso);
    this.projetil.x = this.origemProjetilX + distancia * this.direcao;
    this.projetil.y = this.origemProjetilY +
      (this.special.distanciaProjetilY ?? 0) * progresso * progresso * (3 - 2 * progresso);
    const escala = this.special.escalaProjetil ?? 1;
    this.hitboxes.forEach((hitbox, indice) => {
      const caixa = this.special.hitboxesProjetil[indice];
      hitbox.setPosition(
        this.projetil.x + caixa.offsetX * escala * this.direcao,
        this.projetil.y + caixa.offsetY * escala,
      );
      hitbox.body.updateFromGameObject();
    });
  }

  registrarProjetil() {
    this.registros = this.hitboxes.map((hitbox) => registrarAtaqueEspecial(this, hitbox, {
      categoria: "projetil",
      persistirAoColidirProjetil: true,
      contraAtacavel: !this.cartas,
      aoColidir: () => this.destruirProjetil(),
      aoAtingirAlvo: this.cartas ? undefined : (alvo) => this.acertar(alvo),
    }));
  }

  acertar(alvo) {
    if (this.finalizado || this.cartas || this.alvosAtingidos.has(alvo)) return;
    this.alvosAtingidos.add(alvo);
    const propriedades = this.special.propriedades;
    alvo.receberDano(propriedades.dano, propriedades, {
      direcao: this.direcao,
      x: this.projetil.x,
      y: this.projetil.y,
    });
    const som = this.personagem.sons?.[propriedades.tipoSomImpacto];
    if (som) this.personagem.tocarSomSorteado(som, { volume: 0.15 });
  }

  destruirProjetil() {
    this.projetil?.destroy();
    this.projetil = null;
    this.finalizar();
  }

  finalizar() {
    if (this.finalizado) return;
    this.finalizado = true;
    this.registros.forEach((registro) => registro.remover());
    this.registros = [];
    this.hitboxes.forEach((hitbox) => hitbox.destroy());
    this.hitboxes = [];
    this.personagem.sprite.off("animationupdate", this.aoAtualizarPose);
    const lista = this.personagem.logicasEspeciaisAtivas;
    const indice = lista.indexOf(this);
    if (indice >= 0) lista.splice(indice, 1);
  }

  cancelar() {
    this.personagem.sprite.off("animationupdate", this.aoAtualizarPose);
    // Depois de criado, o corte termina sua animacao independente da pose.
    if (!this.projetil) this.finalizar();
  }
}
