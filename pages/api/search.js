const MIRRORS = [
  'https://annas-archive.gl',
  'https://annas-archive.se',
  'https://annas-archive.li',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { q, lang = '', ext = '' } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  const params = new URLSearchParams({ q });
  if (lang) params.set('lang', lang);
  if (ext) params.set('ext', ext);
  params.set('sort', '');

  let html = null;
  let usedMirror = null;

  for (const mirror of MIRRORS) {
    try {
      const url = `${mirror}/search?${params.toString()}`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Kindle/1.0)',
          'Accept': 'text/html',
          'Accept-Language': 'es,en;q=0.9',
        },
        signal: AbortSignal.timeout(8000),
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
    return res.status(503).json({ error: 'Anna\'s Archive no disponible. Intentá de nuevo.' });
  }

  // Parse results from HTML
  const results = parseResults(html, usedMirror);
  return res.status(200).json({ results, mirror: usedMirror });
}

function parseResults(html, mirror) {
  const results = [];

  // Match book entries - each result is a link to /md5/...
  const blockRegex = /href="(\/md5\/[a-f0-9]+)"[^>]*>([\s\S]*?)(?=href="\/md5\/|$)/gi;
  let match;

  while ((match = blockRegex.exec(html)) !== null && results.length < 10) {
    const path = match[1];
    const block = match[2];

    // Extract title - usually in a div with class containing 'title' or just bold text
    const titleMatch = block.match(/class="[^"]*truncat[^"]*"[^>]*>([^<]{3,120})</) ||
                       block.match(/<h3[^>]*>([^<]{3,120})</) ||
                       block.match(/font-bold[^>]*>([^<]{3,120})</);
    if (!titleMatch) continue;
    const title = cleanText(titleMatch[1]);
    if (!title || title.length < 2) continue;

    // Author
    const authorMatch = block.match(/italic[^>]*>([^<]{2,80})</) ||
                        block.match(/text-sm[^>]*>([A-Z][a-zA-ZÀ-ÿ\s,\.]{3,60})</);
    const author = authorMatch ? cleanText(authorMatch[1]) : '—';

    // Year
    const yearMatch = block.match(/\b(19[0-9]{2}|20[0-2][0-9])\b/);
    const year = yearMatch ? yearMatch[1] : '—';

    // File size
    const sizeMatch = block.match(/(\d+\.?\d*)\s*(MB|KB|GB)/i);
    const size = sizeMatch ? `${sizeMatch[1]} ${sizeMatch[2].toUpperCase()}` : '—';

    // Extension/format
    const extMatch = block.match(/\b(epub|mobi|azw3|pdf|fb2|djvu)\b/i);
    const format = extMatch ? extMatch[1].toUpperCase() : '—';

    // Language
    const langMatch = block.match(/\b(English|Spanish|Español|French|Français|German|Deutsch|Portuguese|Português|Italian|Russian)\b/i);
    const lang = langMatch ? langMatch[1] : '—';

    results.push({
      title,
      author,
      year,
      size,
      format,
      lang,
      url: `${mirror}${path}`,
      path,
    });
  }

  // Fallback: try simpler regex if nothing found
  if (results.length === 0) {
    const simpleRegex = /href="(\/md5\/([a-f0-9]+))"/gi;
    const seen = new Set();
    let m;
    while ((m = simpleRegex.exec(html)) !== null && results.length < 8) {
      if (seen.has(m[2])) continue;
      seen.add(m[2]);
      results.push({
        title: 'Ver en Anna\'s Archive',
        author: '—',
        year: '—',
        size: '—',
        format: '—',
        lang: '—',
        url: `${mirror}${m[1]}`,
        path: m[1],
      });
    }
  }

  return results;
}

function cleanText(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
