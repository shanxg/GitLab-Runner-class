'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = createServer({ version: '1.2.3' });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test('GET /health responde ok com a versão', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok', version: '1.2.3' });
});

test('GET / mostra a versão na página', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /1\.2\.3/);
});

test('rota inexistente devolve 404', async () => {
  const res = await fetch(`${baseUrl}/nao-existe`);
  assert.equal(res.status, 404);
});

test('método diferente de GET devolve 405', async () => {
  const res = await fetch(`${baseUrl}/health`, { method: 'POST' });
  assert.equal(res.status, 405);
});
