# Login e moedas do espectador

## Por que aparecia `localhost`?

`localhost:3001` é o endereço da API quando ela roda na mesma máquina do navegador. Serve só para desenvolvimento local. O jogo publicado precisa chamar uma API por um endereço acessível pela internet; o navegador de outra pessoa nunca deve tentar conectar ao `localhost` do seu computador.

## Como configurar o teste online

O frontend e a API podem usar o mesmo domínio. Nesse caso, deixe `VITE_SNR_ACCOUNT_API_URL` vazio, publique o jogo e configure o servidor web para encaminhar as rotas `/api/*` à API Node na porta `3001`. O código do frontend então chama, por exemplo, `https://endereco-publico-do-jogo/api/account`.

Se a API ficar em outro domínio, configure `VITE_SNR_ACCOUNT_API_URL` com o endereço HTTPS público dela, por exemplo `https://api.seu-dominio.dev.br`, e inclua a origem pública do jogo em `SNR_ACCOUNT_ALLOWED_ORIGINS`. O endereço real depende do host que você usar; este repositório não contém essa URL nem a configuração do host.

Configure estas variáveis no ambiente de build/publicação do site, porque o Vite grava valores `VITE_*` no frontend durante o build:

- `VITE_GOOGLE_CLIENT_ID`: Client ID autorizado para a URL pública do jogo.
- `VITE_SNR_ACCOUNT_API_URL`: vazio se `/api` for encaminhado no mesmo domínio; URL HTTPS pública se a API tiver domínio próprio.
- `GOOGLE_CLIENT_ID`: o mesmo Client ID, usado pelo servidor para validar o login.
- `SNR_ACCOUNT_ALLOWED_ORIGINS`: origem HTTPS exata do jogo quando frontend e API usam domínios diferentes; pode ficar vazio para mesmo domínio.
- `SNR_ACCOUNT_DATA_DIR`: diretório de dados persistente e gravável no host da API.

## O que precisa ficar ligado

O processo `server/server.js` hospeda a API, verifica a credencial do Google e mantém o saldo no arquivo `accounts.json`. Ele também fica inscrito no tópico MQTT `vending/comando/#`; quando recebe uma compra do produto 101, credita a conta pelo e-mail Google verificado ou guarda a compra até o primeiro login. A inscrição usa o Client ID fixo `snr-account-server-v1`, para que o broker possa enfileirar mensagens durante reinícios.

Esse processo pode rodar **na mesma máquina virtual que já mantém o broker ligado**; não precisa contratar outra máquina. O broker continua recebendo e encaminhando MQTT. O processo Node, separado, assina as compras, grava o saldo em disco e responde às consultas do jogo. Configure o servidor web dessa máquina virtual para encaminhar `/api/*` à porta `3001` do processo Node. O navegador chama o domínio público do jogo; o endereço `localhost:3001` fica apenas entre o proxy e o processo na própria máquina virtual.

O processo Node precisa iniciar junto com o PC e usar um diretório persistente para `accounts.json`. Subir apenas os arquivos estáticos do jogo não inicia esse processo. O broker MQTT, sozinho, também não mantém o saldo por conta: essa gravação é feita pelo processo Node acima.

## Desenvolvimento local

Para trabalhar sem publicar, rode `npm run dev` e `npm run dev:server` em terminais separados. Configure temporariamente `VITE_SNR_ACCOUNT_API_URL=http://localhost:3001` no `.env` para o navegador de desenvolvimento chamar a API local. **Não coloque esse valor no build online.** Para a publicação, deixe a variável vazia quando `/api/*` for encaminhado no mesmo domínio, como explicado acima.
