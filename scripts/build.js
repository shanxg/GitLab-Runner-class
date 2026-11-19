'use strict';

// "Build" da aplicação: limpa dist/ e copia o código de src/ para lá.
// Num projeto real, aqui entrariam etapas como transpilar TypeScript,
// minificar ou empacotar. Para os exercícios, basta gerar a pasta dist/.

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of fs.readdirSync(src)) {
  if (file.endsWith('.js')) {
    fs.copyFileSync(path.join(src, file), path.join(dist, file));
  }
}

const files = fs.readdirSync(dist);
console.log(`Build concluído: ${files.length} arquivo(s) em dist/ -> ${files.join(', ')}`);
