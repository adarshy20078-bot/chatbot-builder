import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import voiceAgentHandler from './api/voice-agent.js';
import webhookHandler from './api/webhook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const HOST = '127.0.0.1';

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3001'}`);
  const pathname = parsedUrl.pathname;

  // Helper to parse JSON body
  const parseBody = () => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });

  // Attach query & body to req for serverless function compatibility
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());
  req.body = await parseBody();

  // API Routes
  if (pathname === '/api/voice-agent') {
    return voiceAgentHandler(req, res);
  }

  if (pathname === '/api/webhook') {
    return webhookHandler(req, res);
  }

  // Serve static files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      let contentType = 'text/html';
      if (filePath.endsWith('.js')) contentType = 'text/javascript';
      if (filePath.endsWith('.css')) contentType = 'text/css';
      if (filePath.endsWith('.json')) contentType = 'application/json';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Apex AI Voice Agent Platform running live at: http://${HOST}:${PORT}`);
});
