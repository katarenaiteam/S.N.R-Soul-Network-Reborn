# Ataques normais com varios acertos

Configure `multiHit` dentro de qualquer entrada de `personagem.golpes`.
O ataque continua no `EstadoAtack`, com os mesmos cancelamentos por acerto.
Sem `multiHit`, o golpe continua usando seu `frameHitbox` habitual.

## Automatico

Um aperto executa a lista uma vez. A quantidade de entradas em `hits` determina
a quantidade de hitboxes. Exemplo de configuracao dentro de um golpe:

```js
multiHit: {
  tipo: "automatico",
  hits: [
    { inicio: 100, duracao: 50, offsetX: 40, offsetY: -70,
      propriedades: { dano: 2, knockbackX: 10, knockbackY: 0, knockbackFixo: true } },
    { inicio: 200, duracao: 50, offsetX: 50,
      propriedades: { dano: 6, knockbackX: 400, knockbackY: -300 } },
  ],
},
```

`inicio` e `duracao` sao obrigatorios, em milissegundos. Os inicios contam a partir
da entrada no ataque. Liste os pulsos em ordem, com duracoes positivas, sem
sobreposicao. Deixe a `duracao` do golpe cobrir o ultimo pulso e sua recuperacao.

Cada entrada pode substituir `offsetX`, `offsetY`, `largura`, `altura`,
`propriedades`, `somImpacto`, `somVento` e `vfxAcerto`. Os campos omitidos herdam
os valores do golpe. As propriedades tambem sao herdadas individualmente:
use `tumbling: false` ou `knockbackFixo: false` quando precisar desfazer uma
propriedade do golpe base. Os offsets da hitbox seguem a direcao do personagem;
`offsetVisualX/Y` em `configAnimacoes` continuam ajustando apenas o desenho.

Cada pulso acerta cada alvo uma unica vez, mesmo se tocar varias hurtboxes.
Em FPS baixo, os pulsos atrasam para preservar sua duracao, em vez de aplicar
varios danos de uma vez. Por isso a finalizacao pode passar da duracao nominal.

## Combo rapido

Use a mesma lista de `hits`, adicionando estes campos a `multiHit`:

```js
tipo: "comboRapido",
maxHits: 10,
intervaloInput: 250,
duracaoCiclo: 200,
```

A lista se repete a cada `duracaoCiclo` ms. O periodo nunca fica menor que o fim
do ultimo pulso. `maxHits` limita hitboxes criadas, inclusive as que erram;
se omitido, executa apenas uma passagem pela lista.

O jogador precisa apertar novamente antes de passar `intervaloInput` ms
(padrao: 250). Apenas segurar o botao nao prolonga o ataque. Ao parar antes do
limite, termina o pulso ativo e sua animacao e encerra o ataque sem finalizador.
Somente ao atingir `maxHits` entra automaticamente em `comboProximo`,
sem exigir acerto ou outro aperto. Esse tipo encerra pelo limite/input, em vez
da duracao e janela de combo comuns. Cancelamentos por acerto continuam tendo
prioridade; dano, dash ou outra interrupcao removem os pulsos restantes.

Para alternar animacoes, cada entrada de `hits` pode definir `animacao` e
`antecipacao`: quantos ms antes da hitbox a animacao comeca. Crie essas animacoes
com `repeat: 0` e suas configuracoes individuais em `configAnimacoes`.
O sistema espera a animacao terminar antes de iniciar o proximo pulso.
Exemplo: `{ inicio: 225, duracao: 55, animacao: "fj_comboRapido2", antecipacao: 125 }`
comeca a animacao aos 100 ms e cria a hitbox aos 225 ms.
Use como `animacao` do golpe a primeira da sequencia. Sem animacoes por pulso,
tambem e possivel usar uma unica animacao em loop (`repeat: -1`).
O golpe ocupa uma posicao normal na sequencia `neutro1`, `neutro2` etc.

## FJ

- `neutro3`: combo rapido, ate 10 pulsos, exigindo apertos a cada 250 ms.
- `neutro4`: antigo terceiro golpe, com a animacao `fj_atack3` preservada.
- `side`: tres pulsos automaticos de 3, 3 e 6 de dano, com arremesso no ultimo.
- `fj_comboRapido1`, `fj_comboRapido2`, `fj_comboRapido3`: respectivamente frames
  0–3, 4–13 e 14–19 de `FJ_speedNeu`, a 40 FPS, alternando em um ciclo de 500 ms.
  Ajuste cada visual em `configAnimacoes.comboRapido1`, `comboRapido2` e `comboRapido3`.
