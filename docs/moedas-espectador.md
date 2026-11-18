# Moedas SNR no modo espectador

## Configuracao

Copie `.env.example` para `.env` e preencha `VITE_GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_ID` com o mesmo OAuth Client ID do tipo Web. Configure no Google Cloud os dominios do jogo em origens JavaScript autorizadas. Nao coloque segredos OAuth nesse arquivo do frontend.

O servico usa `FEIRA_MQTT_BROKER_URL` e `FEIRA_MQTT_TOPIC` para receber o produto 101. Para publicar compras da loja na partida, configure `SNR_MQTT_BROKER_URL`, `SNR_MQTT_TOPIC_PREFIX` e `SNR_ROOM` com os valores usados pelo jogo host.

## Desenvolvimento

Execute `npm run server` em um terminal e `npm run dev` em outro. O Vite encaminha `/api` para a API local na porta 3001. O saldo fica salvo em `SNR_LEDGER_FILE` e permanece apos reiniciar o servico.

## Hospedagem

O servico Node precisa ficar ligado continuamente, com armazenamento persistente para o arquivo do ledger. O dominio do jogo deve encaminhar `/api/*` a esse servico. Se a API ficar em outro dominio, configure `SNR_WEB_ORIGIN` para a origem exata do jogo e `VITE_SNR_API_URL` para a URL publica da API. Se a API for encaminhada pelo mesmo dominio do jogo, deixe `VITE_SNR_API_URL` vazio. O servico e o frontend precisam usar o mesmo OAuth Client ID.

## Limites do evento da Feira

O servico credita uma moeda SNR por mensagem do produto 101 associada a um e-mail. Para evitar credito duplicado apos reentrega, a Feira precisa enviar `transactionId`, `purchaseId` ou `orderId` unico. As mensagens de exemplo fornecidas nao mostram esse identificador, entao, sem ele, o servico nao consegue distinguir uma compra nova de uma reentrega. O servico tambem precisa estar conectado ao broker da Feira para receber e persistir os eventos; recuperacao de eventos publicados enquanto o proprio servico esteve fora do ar depende de retencao, fila duravel ou API de historico da Feira.
