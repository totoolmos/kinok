import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Kinok</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=600, initial-scale=1.0, maximum-scale=1.0" />
      </Head>
      <style global jsx>{`
        * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        body {
          background:#fff; color:#000;
          font-family:'Georgia','Times New Roman',serif;
          width:100%; max-width:600px;
          margin:0 auto; min-height:100vh; font-size:18px;
        }
        .screen { display:none; min-height:100vh; }
        .screen.active { display:flex; flex-direction:column; }

        /* HOME */
        #screen-home { align-items:center; justify-content:center; padding:48px 36px 40px; }
        #logo { width:220px; display:block; margin:0 auto 8px; filter:grayscale(100%); }
        #logo-fallback { display:none; font-size:44px; font-weight:bold; letter-spacing:6px; text-align:center; margin-bottom:8px; }
        .lema { font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#888; text-align:center; margin-bottom:52px; }
        .divider { width:100%; border:none; border-top:1.5px solid #000; margin-bottom:36px; }
        .main-btn { width:100%; padding:28px 20px; border:2px solid #000; background:#fff; font-family:'Georgia',serif; font-size:22px; font-weight:bold; letter-spacing:2px; text-align:center; cursor:pointer; display:block; }
        .main-btn:active { background:#000; color:#fff; }
        .flex1 { flex:1; }
        .lang-row { display:flex; width:100%; border:2px solid #000; margin-top:24px; }
        .lang-chip { flex:1; padding:14px 0; text-align:center; font-family:'Georgia',serif; font-size:14px; border-right:1px solid #000; cursor:pointer; letter-spacing:1px; font-weight:bold; }
        .lang-chip:last-child { border-right:none; }
        .lang-chip.selected { background:#000; color:#fff; }
        .lang-chip:active { background:#000; color:#fff; }
        .version-line { font-size:10px; color:#ccc; letter-spacing:1px; text-align:center; margin-top:20px; }

        /* SEARCH */
        #screen-search { padding:0; }
        .page-header { padding:20px 22px 16px; border-bottom:2px solid #000; display:flex; align-items:center; gap:14px; }
        .page-header h2 { font-size:22px; font-weight:bold; letter-spacing:1px; }
        .back-btn { font-size:22px; cursor:pointer; padding:0 4px; line-height:1; }
        .back-btn:active { opacity:0.5; }
        #search-display { margin:20px 20px 14px; border:2px solid #000; padding:14px 16px; font-size:24px; font-family:'Georgia',serif; background:#f4f4f4; min-height:58px; display:flex; align-items:center; word-break:break-all; }
        .cursor { display:inline-block; width:2px; height:1.1em; background:#000; animation:blink 1s step-end infinite; margin-left:3px; flex-shrink:0; }
        @keyframes blink { 50%{opacity:0;} }
        .keyboard { padding:0 10px 10px; flex:1; }
        .kb-row { display:flex; justify-content:center; gap:5px; margin-bottom:5px; }
        .key { flex:1; max-width:52px; height:46px; border:1.5px solid #000; background:#fff; font-size:16px; font-family:'Georgia',serif; font-weight:bold; display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; -webkit-user-select:none; }
        .key:active { background:#000; color:#fff; }
        .key.wide { max-width:none; flex:2; font-size:13px; }
        .key.widest { max-width:none; flex:5; font-size:13px; }
        .key.action-key { background:#000; color:#fff; font-size:13px; letter-spacing:1px; }
        .key.action-key:active { background:#333; }

        /* RESULTS */
        #screen-results { padding:0; }
        .results-inner { overflow-y:auto; flex:1; }
        .result-item { padding:18px 20px; border-bottom:1px solid #888; cursor:pointer; }
        .result-item:active { background:#000; color:#fff; }
        .result-item:active .rm { color:#ccc; }
        .rt { font-size:18px; font-weight:bold; margin-bottom:4px; line-height:1.3; }
        .rm { font-size:13px; color:#555; }
        .rfmt { display:inline-block; border:1px solid #000; padding:1px 6px; font-size:11px; margin-right:6px; font-weight:bold; letter-spacing:1px; }
        .empty-msg { padding:50px 24px; text-align:center; font-size:16px; color:#777; font-style:italic; line-height:1.8; }
        .loading-msg { padding:60px 24px; text-align:center; font-size:18px; color:#555; letter-spacing:1px; }
        .loading-dots::after { content:''; animation:dots 1.5s steps(3,end) infinite; }
        @keyframes dots { 0%{content:''} 33%{content:'.'} 66%{content:'..'} 100%{content:'...'} }

        /* BOOK */
        #screen-book, #screen-format { padding:0; }
        .book-row { display:flex; gap:16px; padding:20px 20px 16px; border-bottom:1px solid #ddd; }
        .book-cover { width:90px; height:134px; background:#e8e8e8; border:1px solid #000; display:flex; align-items:center; justify-content:center; font-size:30px; flex-shrink:0; }
        .book-info h3 { font-size:18px; margin-bottom:5px; line-height:1.3; }
        .book-author { font-size:13px; color:#555; margin-bottom:10px; }
        .book-tags { display:flex; gap:6px; flex-wrap:wrap; }
        .tag { border:1px solid #000; padding:3px 8px; font-size:11px; letter-spacing:0.5px; }
        .dl-label { font-size:11px; letter-spacing:3px; text-transform:uppercase; padding:14px 20px 10px; color:#555; border-bottom:1px solid #ddd; }
        .dl-btn { display:flex; align-items:center; gap:12px; padding:20px 20px; border-bottom:1px solid #888; font-size:19px; font-family:'Georgia',serif; font-weight:bold; cursor:pointer; background:#fff; letter-spacing:1px; }
        .dl-btn:active { background:#000; color:#fff; }
        .dl-sub { font-size:12px; font-weight:normal; color:#777; margin-left:auto; font-style:italic; letter-spacing:0; }
        .dl-btn:active .dl-sub { color:#ccc; }
        .open-link-btn { margin:16px 20px; border:2px solid #000; padding:18px; font-size:16px; font-family:'Georgia',serif; text-align:center; cursor:pointer; background:#fff; font-weight:bold; }
        .open-link-btn:active { background:#000; color:#fff; }
        .fmt-grid { display:grid; grid-template-columns:1fr 1fr; margin:22px; border:2px solid #000; }
        .fmt-btn { padding:32px; font-size:22px; font-family:'Georgia',serif; font-weight:bold; text-align:center; border:1px solid #aaa; background:#fff; letter-spacing:2px; cursor:pointer; line-height:1; }
        .fmt-btn:active { background:#000; color:#fff; }
        .fmt-sub { font-size:11px; font-weight:normal; display:block; margin-top:6px; letter-spacing:0; color:#666; font-style:italic; }
        .fmt-btn:active .fmt-sub { color:#ccc; }
      `}</style>

      {/* HOME */}
      <div id="screen-home" className="screen active">
        <img id="logo" src="https://i.ibb.co/C5XKQs8C/Proyecto-nuevo-10.png" alt="Kinok" />
        <div id="logo-fallback">KINOK</div>
        <div className="lema">All the Books. Always With You.</div>
        <hr className="divider" />
        <div className="main-btn" onClick={() => showScreen('search')}>⌕ &nbsp;Buscar libro</div>
        <div className="flex1"></div>
        <div className="lang-row" id="lang-row">
          <div className="lang-chip selected" data-lang="">Todos</div>
          <div className="lang-chip" data-lang="es">ES</div>
          <div className="lang-chip" data-lang="en">EN</div>
          <div className="lang-chip" data-lang="pt">PT</div>
          <div className="lang-chip" data-lang="fr">FR</div>
          <div className="lang-chip" data-lang="de">DE</div>
        </div>
        <div className="version-line">KINOK v1.0 — All the Books. Always With You.</div>
      </div>

      {/* SEARCH */}
      <div id="screen-search" className="screen">
        <div className="page-header">
          <span className="back-btn" onClick={() => showScreen('home')}>◀</span>
          <h2>Buscar</h2>
        </div>
        <div id="search-display"><span id="qtext"></span><span className="cursor"></span></div>
        <div className="keyboard">
          <div className="kb-row">
            {'qwertyuiop'.split('').map(c => <div key={c} className="key" data-c={c}>{c.toUpperCase()}</div>)}
          </div>
          <div className="kb-row">
            {'asdfghjkl'.split('').map(c => <div key={c} className="key" data-c={c}>{c.toUpperCase()}</div>)}
          </div>
          <div className="kb-row">
            {'zxcvbnm'.split('').map(c => <div key={c} className="key" data-c={c}>{c.toUpperCase()}</div>)}
            <div className="key wide" data-c="BACK">⌫</div>
          </div>
          <div className="kb-row">
            {'1234567890'.split('').map(c => <div key={c} className="key" data-c={c}>{c}</div>)}
          </div>
          <div className="kb-row">
            <div className="key wide" data-c="APOS">&apos;</div>
            <div className="key widest" data-c="SPACE">ESPACIO</div>
            <div className="key wide" data-c="DOT">.</div>
            <div className="key wide action-key" data-c="SEARCH">BUSCAR</div>
          </div>
        </div>
      </div>

      {/* RESULTS */}
      <div id="screen-results" className="screen">
        <div className="page-header">
          <span className="back-btn" onClick={() => showScreen('search')}>◀</span>
          <h2 id="results-heading">Resultados</h2>
        </div>
        <div className="results-inner" id="results-list"></div>
      </div>

      {/* BOOK */}
      <div id="screen-book" className="screen">
        <div className="page-header">
          <span className="back-btn" onClick={() => showScreen('results')}>◀</span>
          <h2>Descargar</h2>
        </div>
        <div className="book-row">
          <div className="book-cover">📖</div>
          <div className="book-info" id="book-info"></div>
        </div>
        <div className="dl-label">Elegir formato</div>
        <div className="dl-btn" onClick={() => pickFormat('epub')}>↓ EPUB <span className="dl-sub">recomendado Kindle</span></div>
        <div className="dl-btn" onClick={() => pickFormat('mobi')}>↓ MOBI <span className="dl-sub">Kindle antiguo</span></div>
        <div className="dl-btn" onClick={() => pickFormat('azw3')}>↓ AZW3 <span className="dl-sub">nativo Amazon</span></div>
        <div className="dl-btn" onClick={() => pickFormat('pdf')}>↓ PDF <span className="dl-sub">diseño fijo</span></div>
        <div className="open-link-btn" onClick={() => openInAnna()}>🔗 Abrir en Anna&apos;s Archive</div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        var query = '';
        var selLang = '';
        var selBook = null;
        var allResults = [];

        document.getElementById('logo').onerror = function() {
          this.style.display = 'none';
          document.getElementById('logo-fallback').style.display = 'block';
        };

        function showScreen(id) {
          document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
          document.getElementById('screen-' + id).classList.add('active');
          window.scrollTo(0, 0);
        }

        // Lang chips
        document.getElementById('lang-row').addEventListener('click', function(e) {
          var chip = e.target.closest('.lang-chip');
          if (!chip) return;
          document.querySelectorAll('.lang-chip').forEach(function(c){ c.classList.remove('selected'); });
          chip.classList.add('selected');
          selLang = chip.dataset.lang;
        });

        // Keyboard
        document.querySelector('.keyboard').addEventListener('click', function(e) {
          var key = e.target.closest('.key');
          if (!key) return;
          handleKey(key.dataset.c);
        });

        function handleKey(c) {
          if (c === 'BACK') { query = query.slice(0, -1); }
          else if (c === 'SPACE') { query += ' '; }
          else if (c === 'DOT') { query += '.'; }
          else if (c === 'APOS') { query += "'"; }
          else if (c === 'SEARCH') { doSearch(); return; }
          else { query += c.toLowerCase(); }
          document.getElementById('qtext').textContent = query;
        }

        document.addEventListener('keydown', function(e) {
          if (!document.getElementById('screen-search').classList.contains('active')) return;
          if (e.key === 'Backspace') { e.preventDefault(); query = query.slice(0,-1); document.getElementById('qtext').textContent = query; }
          else if (e.key === 'Enter') { doSearch(); }
          else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { query += e.key; document.getElementById('qtext').textContent = query; }
        });

        async function doSearch() {
          if (!query.trim()) return;
          showScreen('results');
          document.getElementById('results-heading').textContent = '"' + query + '"';
          document.getElementById('results-list').innerHTML = '<div class="loading-msg">Buscando<span class="loading-dots"></span></div>';
          try {
            var params = new URLSearchParams({ q: query });
            if (selLang) params.set('lang', selLang);
            var r = await fetch('/api/search?' + params.toString());
            var data = await r.json();
            if (!r.ok || data.error) { showError(data.error || 'Error al buscar'); return; }
            allResults = data.results || [];
            renderResults();
          } catch(err) {
            showError('Sin conexión. Revisá tu red e intentá de nuevo.');
          }
        }

        function renderResults() {
          var list = document.getElementById('results-list');
          if (!allResults.length) {
            list.innerHTML = '<div class="empty-msg">Sin resultados para "' + esc(query) + '".<br>Probá otro título o autor.</div>';
            return;
          }
          list.innerHTML = allResults.map(function(r, i) {
            return '<div class="result-item" onclick="openBook(' + i + ')">' +
              '<div class="rt">' + esc(r.title) + '</div>' +
              '<div class="rm">' + (r.format !== '—' ? '<span class="rfmt">' + esc(r.format) + '</span>' : '') + esc(r.author) + ' · ' + esc(r.year) + ' · ' + esc(r.size) + '</div>' +
            '</div>';
          }).join('');
        }

        function showError(msg) {
          document.getElementById('results-list').innerHTML = '<div class="empty-msg">' + esc(msg) + '</div>';
        }

        function openBook(i) {
          selBook = allResults[i];
          document.getElementById('book-info').innerHTML =
            '<h3>' + esc(selBook.title) + '</h3>' +
            '<div class="book-author">' + esc(selBook.author) + '</div>' +
            '<div class="book-tags">' +
              (selBook.year !== '—' ? '<span class="tag">' + esc(selBook.year) + '</span>' : '') +
              (selBook.lang !== '—' ? '<span class="tag">' + esc(selBook.lang) + '</span>' : '') +
              (selBook.size !== '—' ? '<span class="tag">' + esc(selBook.size) + '</span>' : '') +
              (selBook.format !== '—' ? '<span class="tag">' + esc(selBook.format) + '</span>' : '') +
            '</div>';
          showScreen('book');
        }

        function pickFormat(ext) {
          if (!selBook) return;
          var origin = 'https://annas-archive.gl';
          try { origin = new URL(selBook.url).origin; } catch(e){}
          var url;
          if (selBook.path && selBook.path.startsWith('/md5/')) {
            url = origin + selBook.path;
          } else {
            url = origin + '/search?q=' + encodeURIComponent(selBook.title) + '&ext=' + ext + (selLang ? '&lang=' + selLang : '');
          }
          window.open(url, '_blank');
        }

        function openInAnna() {
          if (!selBook) return;
          window.open(selBook.url, '_blank');
        }

        function esc(str) {
          if (!str) return '';
          return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }
      `}} />
    </>
  );
}
