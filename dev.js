const http = require('http');
const fs = require('fs');
const path = require('path');
const handler = require('./api/search.js');
const downloadHandler = require('./api/download.js');
const metaHandler = require('./api/meta.js');

const PORT = 3000;

function shimRes(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
  };
  res.end = res.end.bind(res);
  return res;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/search') {
    req.query = Object.fromEntries(url.searchParams);
    shimRes(res);
    try {
      await handler(req, res);
    } catch (e) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    }
    return;
  }

  if (url.pathname === '/api/meta') {
    req.query = Object.fromEntries(url.searchParams);
    shimRes(res);
    try { await metaHandler(req, res); } catch (e) {
      if (!res.headersSent) { res.writeHead(200); res.end(JSON.stringify({ description: '', ratingCount: null })); }
    }
    return;
  }

  if (url.pathname === '/api/download') {
    req.query = Object.fromEntries(url.searchParams);
    shimRes(res);
    try {
      await downloadHandler(req, res);
    } catch (e) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    }
    return;
  }

  const MIME = { '.html':'text/html;charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.css':'text/css', '.js':'text/javascript' };
  const safe = url.pathname.replace(/\.\./g, '').replace(/^\//, '') || 'index.html';
  const filePath = path.join(__dirname, 'public', safe);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      const idx = path.join(__dirname, 'public', 'index.html');
      fs.readFile(idx, (e2, d2) => {
        if (e2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
        res.end(d2);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Kinok en http://localhost:${PORT}`);
});
