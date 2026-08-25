//import * as Phaser from "phaser";
import EstadoBase from "./EstadoBase.js";

export default class EstadoJump extends EstadoBase {
  enter() {
    // Toca a animação de pulo
    this.personagem.tocarAnimacao("jump");

    // Aplica a força do pulo e incrementa o contador
  }

  execute() {
    // 1. Dash no ar
  if (
  this.personagem.inputJustDown("dash") &&
  this.personagem.podeDash &&
  this.personagem.dashs < this.personagem.maxDash
 ) {
  this.personagem.maquinaEstados.mudarEstado("dash");
  return;
 }

    // 2. Pulo Duplo (se apertar W de novo enquanto estiver no ar)
    if (
      this.personagem.inputJustDown("cima") &&
      this.personagem.pulos < this.personagem.maxPulos
    ) {
      // Chama a função central da classe Personagem, que aplica a velocidade,
      // incrementa o contador e dispara o som do pulo!
      this.personagem.pular();

      // Força a animação de pulo a reiniciar visualmente no ar
      this.personagem.tocarAnimacao("jump", true); 
    }

    // 3. Controle do Pulo Variável (Corta o pulo pela metade se soltar a tecla W)
    if (
      this.personagem.inputJustUp("cima") &&
      this.personagem.sprite.body.velocity.y < 0
    ) {
      this.personagem.sprite.setVelocityY(
        this.personagem.sprite.body.velocity.y * 0.5,
      );
    }

    //atacar
    if (this.personagem.inputJustDown("atack")) {
      this.personagem.maquinaEstados.mudarEstado("atack");
      return;
    }


    // indo pro special
    if (this.personagem.inputJustDown("special")) {
    //  Pega o tipo do special primeiro
    const tipoSpecial = this.personagem.obterTipoSpecial ? this.personagem.obterTipoSpecial() : "neutro";

    // SÓ entra no estado de special se NÃO estiver em cooldown!
    if (this.personagem.podeUsarSpecial(tipoSpecial)) {
        this.personagem.maquinaEstados.mudarEstado("special");
        return;
    }
    }



    // 4. Movimentação Horizontal no ar
    if (this.personagem.inputDown("esquerda")) {
      this.personagem.sprite.setFlipX(true);
      const velAtual = this.personagem.sprite.body.velocity.x;
      const velAlvo = -this.personagem.velocidade;

      // Se vindo do dash estiver mais rápido que a velocidade normal, desacelera suavemente até ela
      if (velAtual < velAlvo) {
        this.personagem.sprite.setVelocityX(velAtual * 0.92);
      } else {
        this.personagem.sprite.setVelocityX(velAlvo);
      }
    } else if (this.personagem.inputDown("direita")) {
      this.personagem.sprite.setFlipX(false);
      const velAtual = this.personagem.sprite.body.velocity.x;
      const velAlvo = this.personagem.velocidade;

      // Se vindo do dash estiver mais rápido que a velocidade normal, desacelera suavemente até ela
      if (velAtual > velAlvo) {
        this.personagem.sprite.setVelocityX(velAtual * 0.92);
      } else {
        this.personagem.sprite.setVelocityX(velAlvo);
      }
    } else {
      // Sem direcionais segurados: desaceleração suave da inércia no ar
      const velX = this.personagem.sprite.body.velocity.x;
      this.personagem.sprite.setVelocityX(velX * 0.95);
    }

    // 5. Transição de volta para o chão
    if (this.personagem.sprite.body.blocked.down) {
      // Se estiver segurando para andar ao tocar o chão, vai pra walk, senão idle
      if (
        this.personagem.inputDown("esquerda") ||
        this.personagem.inputDown("direita")
      ) {
        this.personagem.maquinaEstados.mudarEstado("walk");
      } else {
        this.personagem.maquinaEstados.mudarEstado("idle");
      }
      return;
    }
  }
}