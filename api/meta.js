const OL_UA = 'Kinok/1.0 (kindle book finder; github.com/kinok)';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { key } = req.query;
  if (!key || !/^\/works\/OL\d+W$/.test(key)) {
    return res.status(400).json({ error: 'Invalid key' });
  }

  try {
    const [workRes, ratingsRes] = await Promise.allSettled([
      fetch(`https://openlibrary.org${key}.json`, {
        headers: { 'User-Agent': OL_UA },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`https://openlibrary.org${key}/ratings.json`, {
        headers: { 'User-Agent': OL_UA },
        signal: AbortSignal.timeout(6000),
      }),
    ]);

    let description = '';
    if (workRes.status === 'fulfilled' && workRes.value.ok) {
      const work = await workRes.value.json();
      if (typeof work.description === 'string') description = work.description;
      else if (work.description?.value) description = work.description.value;
      // strip markdown-style links and excess whitespace
      description = description
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\r?\n+/g, ' ')
        .trim();
      if (description.length > 400) description = description.slice(0, 397) + '…';
    }

    let ratingCount = null;
    if (ratingsRes.status === 'fulfilled' && ratingsRes.value.ok) {
      const rd = await ratingsRes.value.json();
      ratingCount = rd?.summary?.count || null;
    }

    return res.status(200).json({ description, ratingCount });
  } catch (e) {
    return res.status(200).json({ description: '', ratingCount: null });
  }
};
