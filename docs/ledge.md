# Recuperacao de borda

Cada ativacao devolve um pulo gasto, sem ultrapassar o total de pulos do personagem. Permanecer dentro da area nao devolve pulos adicionais.

Cada mapa define `this.areasLedge`, uma lista de retangulos invisiveis no jogo normal. Com o debug da fisica ligado, aparece apenas o contorno verde-agua, sem preenchimento. Ao desligar o debug, o contorno desaparece automaticamente:

```js
this.areasLedge = [
    { x: 830, y: 880, largura: 40, altura: 60, direcao: 1, impulso: 360, impulsoHorizontal: 120 }
];
```

`x` e `y` sao o centro da area no mundo, e `largura` e `altura` sao seu tamanho em pixels. Posicione cada area do lado de fora da borda, perto do topo. `impulso` e a velocidade vertical para cima (padrao 360 px/s). `impulsoHorizontal` controla o avanco (padrao 120 px/s). Use `direcao: 1` para entrar na plataforma pela borda esquerda e `direcao: -1` pela direita. Sem direcao configurada, usa o lado para o qual o personagem olha.

Ao entrar no ar, o personagem assume imediatamente o ultimo frame da animacao de agachar por 350 ms, recebe impulso para cima e para dentro da plataforma e fica invencivel por 600 ms, mesmo se acertar um ataque nesse periodo. Depois dos 350 ms, volta ao controle normal. O avanco horizontal e mantido durante a pose, inclusive se a parede bloquear o personagem antes de ele superar o topo. A fisica continua ativa: nao ha teletransporte ou personagem preso na borda. Uma invencibilidade de respawn mais longa e preservada.

Ficar dentro da area nao renova o efeito. Uma nova ativacao exige sair e entrar novamente, depois do intervalo de 600 ms. Contatos no chao, durante morte, ultimate ou aprisionamento na teia nao ativam a recuperacao. Mapas sem `areasLedge` continuam funcionando sem ledges.

Ao ativar, aplica a mesma compressao visual do pouso, com intensidade 30% maior e a mesma duracao curta (65 ms para comprimir e 65 ms para voltar).
