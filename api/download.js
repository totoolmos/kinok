const { Readable } = require('stream');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

module.exports = async function handler(req, res) {
  const { title = '', author = '', isbn = '' } = req.query;
  if (!title) return res.status(400).json({ error: 'Falta el título' });

  // Search libgen.li for a matching file
  const md5s = await findMd5s(title, author, isbn);

  for (const md5 of md5s) {
    try {
      const ok = await libgenDownload(md5, title, author, res);
      if (ok) return;
    } catch (_) {}
  }

  // Fallback: redirect to Anna's Archive search
  if (!res.headersSent) {
    const q = encodeURIComponent((title + ' ' + author).trim());
    res.writeHead(302, { Location: `https://annas-archive.gl/search?q=${q}` });
    res.end();
  }
};

// Find MD5 hashes by searching libgen.li (ISBN first for precision, then title+author)
async function findMd5s(title, author, isbn) {
  const seen = new Set();
  const results = [];
  const add = md5 => { if (!seen.has(md5)) { seen.add(md5); results.push(md5); } };

  // ISBN search (most precise)
  if (isbn) {
    try {
      const isbnMd5s = await libgenSearchMd5s(isbn);
      isbnMd5s.forEach(add);
    } catch (_) {}
  }

  // Title + author search
  const q = (title + (author ? ' ' + author : '')).trim().slice(0, 100);
  try {
    const titleMd5s = await libgenSearchMd5s(q);
    titleMd5s.forEach(add);
  } catch (_) {}

  // Title only (broader)
  if (author) {
    try {
      const titleOnlyMd5s = await libgenSearchMd5s(title.slice(0, 80));
      titleOnlyMd5s.forEach(add);
    } catch (_) {}
  }

  return results.slice(0, 8);
}

async function libgenSearchMd5s(q) {
  const url =
    `https://libgen.li/index.php?req=${encodeURIComponent(q)}&res=10&lg_topic=libgen&open=0&view=simple&phrase=1&column=def`;
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'en-US,en;q=0.5' },
    redirect: 'follow',
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`libgen ${r.status}`);
  const html = await r.text();

  const seen = new Set();
  const md5s = [];
  const re = /[?&]md5=([a-f0-9]{32})/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const md5 = m[1].toLowerCase();
    if (!seen.has(md5)) { seen.add(md5); md5s.push(md5); }
  }
  return md5s;
}

// Two-step libgen.li download: ads.php → get.php?key=... → file
async function libgenDownload(md5, title, author, res) {
  const r1 = await fetch(`https://libgen.li/ads.php?md5=${md5}`, {
    headers: { 'User-Agent': UA, Accept: 'text/html', Referer: 'https://libgen.li/' },
    redirect: 'follow',
    signal: AbortSignal.timeout(12000),
  });
  if (!r1.ok) return false;

  const html = await r1.text();
  const m = html.match(/href="(get\.php\?md5=[^"]+)"/i);
  if (!m) return false;

  const dlUrl = 'https://libgen.li/' + m[1];
  return streamFile(dlUrl, 'https://libgen.li/', title, author, res);
}

async function streamFile(url, referer, title, author, res) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: '*/*', Referer: referer },
    redirect: 'follow',
    signal: AbortSignal.timeout(120000),
  });

  if (!r.ok) return false;

  const ct = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (ct === 'text/html' || ct === 'application/xhtml+xml') return false;

  const ext = guessExt(ct, r.url || url);
  const filename = buildFilename(title, author, ext);

  const cl = r.headers.get('content-length');
  res.setHeader('Content-Type', ct || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeRFC5987(filename)}`);
  if (cl) res.setHeader('Content-Length', cl);

  const nodeStream = Readable.fromWeb(r.body);
  await new Promise((resolve, reject) => {
    nodeStream.on('error', reject);
    res.on('error', reject);
    nodeStream.pipe(res, { end: false });
    nodeStream.on('end', resolve);
  });
  res.end();
  return true;
}

function guessExt(contentType, url) {
  const ctMap = {
    'application/epub+zip': 'epub',
    'application/epub': 'epub',
    'application/x-mobipocket-ebook': 'mobi',
    'application/pdf': 'pdf',
    'application/x-fictionbook+xml': 'fb2',
  };
  if (ctMap[contentType]) return ctMap[contentType];
  const urlExt = (url || '').split('?')[0].split('.').pop().toLowerCase();
  if (['epub', 'mobi', 'azw3', 'pdf', 'fb2', 'djvu'].includes(urlExt)) return urlExt;
  return 'epub';
}

function buildFilename(title, author, ext) {
  const clean = s =>
    String(s || '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim();
  const t = clean(title).slice(0, 80) || 'Libro';
  const a = clean(author).slice(0, 50);
  return (a ? `${t} - ${a}` : t) + '.' + (ext || 'epub');
}

function encodeRFC5987(str) {
  return encodeURIComponent(str)
    .replace(/['()]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/\*/g, '%2A');
}
