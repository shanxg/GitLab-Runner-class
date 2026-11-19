'use strict';

const http = require('node:http');

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function send(res, status, contentType, body) {
  res.writeHead(status, { 'Content-Type': `${contentType}; charset=utf-8` });
  res.end(body);
}

/**
 * Cria o servidor HTTP da aplicação, sem colocá-lo para ouvir.
 *
 * Rotas:
 *   GET /        -> página simples mostrando a versão
 *   GET /health  -> {"status":"ok","version":"..."}  (útil para conferir o deploy)
 *
 * A versão vem da variável de ambiente APP_VERSION (padrão: "dev").
 */
function createServer({ version = process.env.APP_VERSION || 'dev' } = {}) {
  return http.createServer((req, res) => {
    if (req.method !== 'GET') {
      return send(res, 405, 'text/plain', 'Método não permitido');
    }

    if (req.url === '/health') {
      return send(res, 200, 'application/json', JSON.stringify({ status: 'ok', version }));
    }

    if (req.url === '/') {
      return send(res, 200, 'text/html', [
        '<!doctype html>',
        '<html lang="pt-BR"><head><meta charset="utf-8"><title>GitLab Runner - estudos</title></head>',
        '<body style="font-family: sans-serif; margin: 3rem">',
        '<h1>Pipeline funcionando</h1>',
        `<p>Versão: <strong>${escapeHtml(version)}</strong></p>`,
        '</body></html>',
      ].join('\n'));
    }

    return send(res, 404, 'text/plain', 'Não encontrado');
  });
}

module.exports = { createServer };
