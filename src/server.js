'use strict';

const { createServer } = require('./app');

const port = Number(process.env.PORT) || 81;
const server = createServer();

server.listen(port, () => {
  console.log(`Servidor ouvindo em http://localhost:${port} (versão ${process.env.APP_VERSION || 'dev'})`);
});

// Encerra de forma limpa no "docker stop" ou no Ctrl+C.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
