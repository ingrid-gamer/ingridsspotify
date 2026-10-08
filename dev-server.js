import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const port = Number(process.env.PORT || 4173);

const contentTypes = {
    '.css':  'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico':  'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg':  'image/jpeg',
    '.js':   'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png':  'image/png',
    '.svg':  'image/svg+xml',
    '.txt':  'text/plain; charset=utf-8',
    '.webp': 'image/webp'
};

const server = createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end('Method not allowed');
        return;
    }

    try {
        const requestUrl = new URL(request.url || '/', 'http://localhost');
        let pathname = decodeURIComponent(requestUrl.pathname);
        if (pathname.endsWith('/')) pathname += 'index.html';

        const filePath = resolve(projectRoot, `.${pathname}`);
        if (filePath !== projectRoot && !filePath.startsWith(`${projectRoot}${sep}`)) {
            response.writeHead(403);
            response.end('Forbidden');
            return;
        }

        const relativePath = relative(projectRoot, filePath);
        if (relativePath !== 'index.html' && !relativePath.startsWith(`js${sep}`)) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }

        const fileInfo = await stat(filePath);
        if (!fileInfo.isFile()) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }

        const body = await readFile(filePath);
        response.writeHead(200, {
            'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Content-Length': body.length,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff'
        });
        response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
        if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') {
            response.writeHead(404);
            response.end('Not found');
            return;
        }

        if (error instanceof URIError) {
            response.writeHead(400);
            response.end('Bad request');
            return;
        }

        console.error('Error al servir el archivo:', error);
        response.writeHead(500);
        response.end('Internal server error');
    }
});

server.listen(port, '127.0.0.1', () => {
    console.log(`Dashboard local: http://localhost:${port}`);
    console.log('Presiona Ctrl+C para detener el servidor.');
});
