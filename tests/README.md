# Regressão dos crashes de combate

Execute `npm.cmd run dev` no Windows (`npm run dev` em outros sistemas) e abra
`http://localhost:5173/tests/combate.html`. O resultado esperado é `ALL PASS`.

O teste usa `src/phaser.min.js`, o mesmo motor carregado pelo jogo. Primeiro
demonstra a condição que gera `reading 'size'`: um collider apontando para um
grupo destruído. Isso não reproduz a sequência da partida da captura.

Em seguida executa 500 teias reais, alternando alcance e impacto, acertos por
`aoAtingirAlvo` em `postupdate`, substituição de grupos de hurtboxes durante o voo,
colisão com o mapa pelo passo de física, choque entre especiais, 100 remoções de adversários,
encerramento imediato durante `EstadoSpecial.execute()` e reinício real da cena
com projétil e disparo pendente. Verifica que colisões, listeners, timers e lógicas
não se acumulam e que os métodos do Phaser permanecem originais.

Este teste não substitui uma partida completa com todos os personagens e mapas.
Para investigar o erro `M_ID` da outra captura, é necessário obter a URL completa
de `200.js` no DevTools; esse arquivo e esse identificador não foram encontrados
no código do jogo. A captura sozinha não permite atribuí-lo a uma extensão ou ao jogo.
