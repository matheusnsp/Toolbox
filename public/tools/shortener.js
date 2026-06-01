function buildShort() {
  return `
    <label class="flabel">🌐 URL para encurtar</label>
    <div class="frow">
      <input class="finput" id="shortUrl" placeholder="https://exemplo.com/link-longo..." style="margin:0">
      <button class="fbtn" id="shortBtn" onclick="doShorten()" style="width:auto;padding:12px 18px;white-space:nowrap">
        <span class="spin" id="shortSpin"></span><span id="shortTxt">Encurtar</span>
      </button>
    </div>
    <div class="ferror" id="shortErr"></div>
    <div class="fresult" id="shortRes">
      <label class="flabel" style="margin-bottom:8px">✅ Link encurtado</label>
      <div class="fresult-row">
        <div class="fresult-val" id="shortVal" onclick="copyVal('shortVal','shortCopy')"></div>
        <button class="copy-btn" id="shortCopy" onclick="copyVal('shortVal','shortCopy')">📋 Copiar</button>
      </div>
    </div>
    <div class="hist-wrap" id="shortHist">
      <span class="hist-label">Histórico</span>
      <div id="shortHistList"></div>
    </div>
  `;
}

let shortHist_ = [];

async function doShorten() {
  const url = document.getElementById('shortUrl').value.trim();
  if (!url) return showFErr('shortErr', 'Cole uma URL.');
  if (!url.startsWith('http')) return showFErr('shortErr', 'URL deve começar com http:// ou https://');
  document.getElementById('shortSpin').classList.add('on');
  document.getElementById('shortTxt').textContent = 'Encurtando';
  document.getElementById('shortBtn').disabled = true;
  hideFErr('shortErr');
  document.getElementById('shortRes').classList.remove('on');
  try {
    const r = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Erro ao encurtar.');
    document.getElementById('shortVal').textContent = d.short;
    document.getElementById('shortRes').classList.add('on');
    document.getElementById('shortCopy').className = 'copy-btn';
    shortHist_.unshift({ orig: url, short: d.short });
    if (shortHist_.length > 5) shortHist_.pop();
    renderShortHist();
    document.getElementById('shortUrl').value = '';
  } catch (e) { showFErr('shortErr', e.message); }
  finally {
    document.getElementById('shortSpin').classList.remove('on');
    document.getElementById('shortTxt').textContent = 'Encurtar';
    document.getElementById('shortBtn').disabled = false;
  }
}

function renderShortHist() {
  if (!shortHist_.length) return;
  const w = document.getElementById('shortHist');
  w.classList.add('on');
  document.getElementById('shortHistList').innerHTML = shortHist_.map(h => `
    <div class="hist-item" onclick="navigator.clipboard.writeText('${h.short}')">
      <span class="hist-orig">${h.orig}</span>
      <span class="hist-short">${h.short}</span>
    </div>
  `).join('');
}
