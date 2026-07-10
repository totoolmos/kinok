const OL = 'https://openlibrary.org';
const OL_UA = 'Kinok/1.0 (kindle book finder; github.com/kinok)';
const OL_FIELDS = 'key,title,author_name,cover_i,first_publish_year,isbn,subject,language,number_of_pages_median,ratings_average';

// AA mirrors kept as fallback
const AA_MIRRORS = [
  'https://annas-archive.gl',
  'https://annas-archive.se',
  'https://annas-archive.li',
  'https://annas-archive.org',
];
const AA_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const LANG_OL = { en: 'eng', es: 'spa', fr: 'fre', de: 'ger', pt: 'por' };

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, lang = '' } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  // Primary: Open Library (rich metadata, precise search)
  try {
    const results = await searchOpenLibrary(q, lang);
    if (results.length) return res.status(200).json({ results, source: 'ol' });
  } catch (_) {}

  // Fallback: Anna's Archive (scraping)
  const data = await Promise.any(
    AA_MIRRORS.map(m => fetchFromAA(m, q, lang))
  ).catch(() => null);

  if (!data) return res.status(503).json({ error: "Sin conexión con los servidores. Intentá de nuevo." });
  return res.status(200).json(data);
};

// ── Open Library ────────────────────────────────────────────────────────────

async function searchOpenLibrary(q, lang) {
  const params = new URLSearchParams({ q, fields: OL_FIELDS, limit: '20' });
  if (lang && LANG_OL[lang]) params.set('language', LANG_OL[lang]);

  const r = await fetch(`${OL}/search.json?${params}`, {
    headers: { 'User-Agent': OL_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`OL ${r.status}`);

  const data = await r.json();
  return (data.docs || []).slice(0, 15).map(doc => ({
    title:    doc.title || '—',
    author:   (doc.author_name || []).slice(0, 2).join(', ') || '—',
    year:     doc.first_publish_year ? String(doc.first_publish_year) : '—',
    lang:     (doc.language || [])[0] || '—',
    coverId:  doc.cover_i || null,
    isbn:     (doc.isbn || []).find(i => i.length === 13) || (doc.isbn || [])[0] || null,
    olKey:    doc.key || null,
    subjects: (doc.subject || []).slice(0, 6),
    pages:    doc.number_of_pages_median || null,
    rating:   doc.ratings_average ? doc.ratings_average.toFixed(1) : null,
    format: '—',
    size:   '—',
    path:   null,
    url:    null,
  })).filter(r => r.title !== '—');
}

// ── Anna's Archive fallback ──────────────────────────────────────────────────

async function fetchFromAA(mirror, q, lang) {
  const params = new URLSearchParams({ q });
  if (lang) params.set('lang', lang);

  const r = await fetch(`${mirror}/search?${params}`, {
    headers: { 'User-Agent': AA_UA, Accept: 'text/html', 'Accept-Language': 'en-US,en;q=0.5' },
    signal: AbortSignal.timeout(8000),
    redirect: 'follow',
  });
  if (!r.ok) throw new Error(`AA ${r.status}`);
  const html = await r.text();
  const results = parseAA(html, mirror);
  if (!results.length) throw new Error('No results');
  return { results, source: 'aa' };
}

function parseAA(html, mirror) {
  const results = [];
  const seen = new Set();
  const re = /href="(\/md5\/([a-f0-9]{32}))"/gi;
  let m;

  while ((m = re.exec(html)) !== null) {
    const [, path, md5] = m;
    if (seen.has(md5)) continue;
    seen.add(md5);

    const tagClose = html.indexOf('>', m.index + m[0].length);
    if (tagClose === -1) continue;
    const block = html.slice(tagClose + 1, tagClose + 3000);
    const lines = extractLines(block);
    if (!lines.length) continue;

    const title = lines.find(l => l.length >= 3 && l.length <= 400 && !/^[\d\s·•\-\/\[\]()]+$/.test(l) && !isFilePath(l));
    if (!title) continue;
    const ti = lines.indexOf(title);
    const rest = lines.slice(ti + 1, ti + 12);
    const author = rest.find(l => l.length >= 2 && l.length < 150 && !isFilePath(l) && !/\b(epub|pdf|mobi|azw3|fb2|djvu|mb|kb|gb|pages?|pp\b|\d{4})\b/i.test(l)) || '—';
    const meta = lines.find(l => /\b(epub|pdf|mobi|azw3|fb2|djvu)\b/i.test(l)) || '';
    const fmtM = meta.match(/\b(epub|pdf|mobi|azw3|fb2|djvu)\b/i);
    const sizeM = meta.match(/(\d+(?:\.\d+)?)\s*(MB|KB|GB)/i);
    const yearM = (meta + ' ' + rest.join(' ')).match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/);
    const langM = meta.match(/^\s*([A-Za-z]{2,})\b/);

    results.push({
      title:    clean(title),
      author:   clean(author),
      year:     yearM ? yearM[1] : '—',
      lang:     langM ? langM[1] : '—',
      format:   fmtM ? fmtM[1].toUpperCase() : '—',
      size:     sizeM ? `${sizeM[1]} ${sizeM[2].toUpperCase()}` : '—',
      coverId:  null,
      isbn:     null,
      olKey:    null,
      subjects: [],
      pages:    null,
      rating:   null,
      path,
      url: `${mirror}${path}`,
    });

    if (results.length >= 15) break;
  }
  return results;
}

function isFilePath(l) {
  return /^(lgli|upload|zlib|ia|lgrs|libgen|duxiu|scimag|comics|magz|books)\//i.test(l) ||
    (/[/\\]/.test(l) && /\.(epub|pdf|mobi|azw3|fb2|djvu|txt|rtf|doc|rar|zip)\b/i.test(l));
}

function extractLines(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .split('\n').map(s => s.trim()).filter(Boolean);
}

function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
