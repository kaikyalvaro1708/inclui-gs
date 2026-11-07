// Servidor estático para desenvolvimento, sem dependências: `npm start`.
// Em produção, quem serve a pasta site/ é o S3 (ou qualquer servidor de arquivos).
// Os módulos ES do navegador não funcionam abrindo o HTML direto do disco (file://),
// por isso é preciso um servidor, mesmo que simples.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const ROOT = resolve('site');
const PORT = Number(process.env.PORT) || 5173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function fileFor(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const target = normalize(join(ROOT, decoded));
  // Impede sair da pasta site/ com "../".
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null;
  try {
    const stats = statSync(target);
    if (stats.isDirectory()) return fileFor(`${decoded.replace(/\/?$/, '/')}index.html`);
    return target;
  } catch {
    return null;
  }
}

createServer((request, response) => {
  let file = null;
  try {
    file = fileFor(request.url ?? '/');
  } catch {
    // URL malformada: cai no 404.
  }
  const status = file ? 200 : 404;
  file ??= join(ROOT, '404.html');
  response.writeHead(status, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(file).pipe(response);
}).listen(PORT, () => {
  console.log(`Inclui+ em http://localhost:${PORT}`);
});
