const MIRRORS = [
  'https://annas-archive.gl',
  'https://annas-archive.se',
  'https://annas-archive.li',
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { q, lang = '', ext = '' } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  const params = new URLSearchParams({ q });
  if (lang) params.set('lang', lang);
  if (ext) params.set('ext', ext);

  let html = null;
  let usedMirror = null;

  for (const mirror of MIRRORS) {
    try {
      const url = `${mirror}/search?${params.toString()}`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es,en;q=0.9',
        },
        signal: AbortSignal.timeout(9000),
      });
      if (r.ok) {
        html = await r.text();
        usedMirror = mirror;
        break;
      }
    } catch (_) {
      continue;
    }
  }

  if (!html) {
    return res.status(503).json({ error: "Anna's Archive no disponible. Intentá de nuevo en unos minutos." });
  }

  const results = parseResults(html, usedMirror);
  return res.status(200).json({ results, mirror: usedMirror });
};

function parseResults(html, mirror) {
  const results = [];
  const seen = new Set();

  // Match all /md5/ links
  const md5Regex = /href="(\/md5\/([a-f0-9]{32}))"/gi;
  let m;
  while ((m = md5Regex.exec(html)) !== null) {
    const path = m[1];
    const md5 = m[2];
    if (seen.has(md5)) continue;
    seen.add(md5);

    // Get surrounding block (~600 chars after the link)
    const blockStart = Math.max(0, m.index - 200);
    const blockEnd = Math.min(html.length, m.index + 800);
    const block = html.slice(blockStart, blockEnd);

    // Title: look for truncate class or h3
    const titleMatch =
      block.match(/class="[^"]*truncat[^"]*"[^>]*>\s*([^<]{3,150})\s*</) ||
      block.match(/<h3[^>]*>\s*([^<]{3,150})\s*<\/h3>/) ||
      block.match(/font-bold[^"]*"[^>]*>\s*([^<]{3,150})\s*</);

    if (!titleMatch) continue;
    const title = clean(titleMatch[1]);
    if (!title || title.length < 2) continue;

    // Author
    const authorMatch =
      block.match(/italic[^>]*>\s*([^<]{2,80})\s*</) ||
      block.match(/text-sm[^>]*>\s*([A-ZÀ-Ý][^<]{3,60})\s*</);
    const author = authorMatch ? clean(authorMatch[1]) : '—';

    // Year
    const yearMatch = block.match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/);
    const year = yearMatch ? yearMatch[1] : '—';

    // Size
    const sizeMatch = block.match(/(\d+\.?\d*)\s*(MB|KB|GB)/i);
    const size = sizeMatch ? `${sizeMatch[1]} ${sizeMatch[2].toUpperCase()}` : '—';

    // Format
    const fmtMatch = block.match(/\b(epub|mobi|azw3|pdf|fb2|djvu)\b/i);
    const format = fmtMatch ? fmtMatch[1].toUpperCase() : '—';

    // Language
    const langMatch = block.match(/\b(English|Spanish|Español|French|Français|German|Deutsch|Portuguese|Português|Italian|Russian|Arabic)\b/i);
    const lang = langMatch ? langMatch[1] : '—';

    results.push({ title, author, year, size, format, lang, url: `${mirror}${path}`, path });

    if (results.length >= 12) break;
  }

  return results;
}

function clean(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}
