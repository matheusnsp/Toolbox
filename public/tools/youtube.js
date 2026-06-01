function buildYt() {
    return `
      <label class="flabel">🔗 Link do YouTube</label>
      <div class="frow">
        <input class="finput" id="ytUrl" placeholder="https://www.youtube.com/watch?v=..." style="margin:0">
        <button class="fbtn" id="ytFetchBtn" onclick="ytFetch()" style="width:auto;padding:12px 18px;white-space:nowrap">
          <span class="spin" id="ytSpin"></span><span id="ytFetchTxt">Buscar</span>
        </button>
      </div>
      <div class="ferror" id="ytErr"></div>
      <div class="yt-preview" id="ytPreview">
        <img class="yt-thumb" id="ytThumb" src="" alt="">
        <div style="flex:1;min-width:0">
          <div class="yt-meta-title" id="ytMTitle"></div>
          <div class="yt-meta-sub" id="ytMSub"></div>
          <div class="yt-meta-size" id="ytMSize" style="font-size:12px;color:#aaa;margin-top:4px"></div>
        </div>
      </div>
      <div id="ytOpts" style="display:none">
        <div class="fmt-row">
          <div class="fmt-pill on" id="ytMp4" onclick="ytFmt('mp4')">🎬<strong>MP4</strong><span>Vídeo</span></div>
          <div class="fmt-pill" id="ytMp3" onclick="ytFmt('mp3')">🎵<strong>MP3</strong><span>Áudio</span></div>
        </div>
        <div id="ytQWrap">
          <label class="flabel">Qualidade</label>
          <div class="q-grid" id="ytQGrid"></div>
        </div>
        <div id="ytAQWrap" style="display:none">
          <label class="flabel">Qualidade do Áudio</label>
          <div class="q-grid" id="ytAQGrid">
            <div class="q-pill on top" data-aq="320" onclick="ytSetAQ(this,320)">🔥 Alta<span style="font-size:10px;display:block">320kbps</span></div>
            <div class="q-pill top" data-aq="128" onclick="ytSetAQ(this,128)">👍 Média<span style="font-size:10px;display:block">128kbps</span></div>
            <div class="q-pill" data-aq="64" onclick="ytSetAQ(this,64)">📦 Baixa<span style="font-size:10px;display:block">64kbps</span></div>
          </div>
        </div>
        <div class="yt-size-est" id="ytSizeEst" style="font-size:12px;color:#aaa;margin:6px 0 10px;text-align:center"></div>
        <button class="fbtn" id="ytDlBtn" onclick="ytDl()">⬇ Baixar Agora</button>
      </div>
      <div class="prog-wrap" id="ytProg">
        <div class="prog-top">
          <span class="prog-status" id="ytProgStatus">Baixando...</span>
          <span class="prog-pct" id="ytProgPct">0%</span>
        </div>
        <div class="prog-track"><div class="prog-fill" id="ytProgBar"></div></div>
        <div class="prog-log" id="ytProgLog">Iniciando...</div>
      </div>
      <div class="dl-success" id="ytSuccess">
        <span class="dl-success-ico">🎉</span>
        <h3>Download Pronto!</h3>
        <p id="ytSuccessSub"></p>
        <p id="ytSuccessSize" style="font-size:12px;color:#aaa;margin-top:-8px"></p>
        <a class="save-btn" id="ytSaveBtn" href="#">💾 Salvar Arquivo</a><br>
        <div id="ytMobileHint" style="display:none;font-size:12px;color:#aaa;margin-top:10px;line-height:1.5">
          📱 No celular: toque em "Salvar Arquivo", depois toque nos 3 pontos (⋮) e escolha <strong>"Abrir com Galeria"</strong> ou <strong>"Salvar na Galeria"</strong>.
        </div>
        <button class="reset-lnk" onclick="ytReset()">Baixar outro vídeo</button>
      </div>
    `;
  }
  
  let ytFmt_ = 'mp4', ytQ_ = null, ytAQ_ = 320, ytDuration_ = 0;
  
  async function ytFetch() {
    const url = document.getElementById('ytUrl').value.trim();
    if (!url) return showFErr('ytErr', 'Cole uma URL do YouTube.');
    document.getElementById('ytSpin').classList.add('on');
    document.getElementById('ytFetchTxt').textContent = 'Buscando';
    document.getElementById('ytFetchBtn').disabled = true;
    hideFErr('ytErr');
    document.getElementById('ytPreview').classList.remove('on');
    document.getElementById('ytOpts').style.display = 'none';
    try {
      const r = await fetch('/api/info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erro');
      ytDuration_ = d.duration || 0;
      document.getElementById('ytThumb').src = d.thumbnail;
      document.getElementById('ytMTitle').textContent = d.title;
      document.getElementById('ytMSub').textContent = fmtDur(d.duration) + ' · ' + (d.uploader || '');
      // Mostra tamanho estimado total no preview se disponível
      if (d.filesize) {
        document.getElementById('ytMSize').textContent = '📦 Tamanho aprox.: ' + fmtSize(d.filesize);
      } else {
        document.getElementById('ytMSize').textContent = '';
      }
      document.getElementById('ytPreview').classList.add('on');
      // Grade de qualidades de vídeo
      const hs = d.heights?.length ? d.heights : [1080, 720, 480, 360];
      const grid = document.getElementById('ytQGrid');
      grid.innerHTML = '';
      hs.forEach((h, i) => {
        const b = document.createElement('div');
        b.className = 'q-pill' + (i === 0 ? ' on top' : i === 1 ? ' top' : '');
        b.dataset.q = h; b.textContent = h + 'p';
        b.onclick = () => {
          ytQ_ = h;
          document.querySelectorAll('#ytQGrid .q-pill').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          ytUpdateSizeEst();
        };
        grid.appendChild(b);
      });
      ytQ_ = hs[0];
      ytUpdateSizeEst();
      document.getElementById('ytOpts').style.display = '';
    } catch (e) { showFErr('ytErr', e.message); }
    finally {
      document.getElementById('ytSpin').classList.remove('on');
      document.getElementById('ytFetchTxt').textContent = 'Buscar';
      document.getElementById('ytFetchBtn').disabled = false;
    }
  }
  
  // Estima tamanho do arquivo com base na duração e qualidade escolhida
  function ytUpdateSizeEst() {
    const el = document.getElementById('ytSizeEst');
    if (!ytDuration_ || ytDuration_ <= 0) { el.textContent = ''; return; }
    let kbps = 0;
    if (ytFmt_ === 'mp4') {
      const bitrateMap = { 1080: 4000, 720: 2500, 480: 1200, 360: 700, 240: 400, 144: 200 };
      kbps = bitrateMap[ytQ_] || 1500;
    } else {
      kbps = ytAQ_;
    }
    const bytes = (kbps * 1000 / 8) * ytDuration_;
    el.textContent = '📦 Tamanho estimado: ' + fmtSize(bytes);
  }
  
  function fmtSize(bytes) {
    if (!bytes || bytes <= 0) return '';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return bytes + ' B';
  }
  
  function ytSetAQ(el, kbps) {
    ytAQ_ = kbps;
    document.querySelectorAll('#ytAQGrid .q-pill').forEach(x => x.classList.remove('on'));
    el.classList.add('on');
    ytUpdateSizeEst();
  }
  
  function ytFmt(f) {
    ytFmt_ = f;
    document.getElementById('ytMp4').classList.toggle('on', f === 'mp4');
    document.getElementById('ytMp3').classList.toggle('on', f === 'mp3');
    document.getElementById('ytQWrap').style.display = f === 'mp4' ? '' : 'none';
    document.getElementById('ytAQWrap').style.display = f === 'mp3' ? '' : 'none';
    ytUpdateSizeEst();
  }
  
  function ytDl() {
    const url = document.getElementById('ytUrl').value.trim();
    document.getElementById('ytOpts').style.display = 'none';
    document.getElementById('ytPreview').classList.remove('on');
    document.getElementById('ytProg').classList.add('on');
    document.getElementById('ytDlBtn').disabled = true;
    ytSetProg(0, 'Conectando...');
  
    // Parâmetros: para MP4 usa codec H.264 (compatível com celulares/galeria)
    // Para MP3 usa a qualidade em kbps escolhida
    const p = new URLSearchParams({
      url,
      format: ytFmt_,
      quality: ytFmt_ === 'mp4' ? ytQ_ : 'best',
      audio_quality: ytFmt_ === 'mp3' ? ytAQ_ : undefined,
      // Força H.264+AAC para máxima compatibilidade mobile (abre na galeria)
      vcodec: ytFmt_ === 'mp4' ? 'h264' : undefined,
      acodec: ytFmt_ === 'mp4' ? 'aac' : undefined,
    });
  
    const es = new EventSource('/api/download?' + p);
    es.onmessage = ({ data }) => {
      const m = JSON.parse(data);
      if (m.type === 'progress') ytSetProg(m.percent, m.percent < 50 ? 'Baixando vídeo...' : m.percent < 90 ? 'Baixando áudio...' : 'Mesclando...');
      else if (m.type === 'log') {
        document.getElementById('ytProgLog').textContent = m.line.slice(0, 80);
        if (/Merging|Converting|Extracting/.test(m.line)) ytSetProg(92, 'Processando...');
      }
      else if (m.type === 'done') {
        es.close();
        ytSetProg(100, 'Concluído!');
        setTimeout(() => ytShowSuccess(m.url, m.filename, m.filesize), 500);
      }
      else if (m.type === 'error') {
        es.close();
        document.getElementById('ytProg').classList.remove('on');
        document.getElementById('ytOpts').style.display = '';
        document.getElementById('ytPreview').classList.add('on');
        document.getElementById('ytDlBtn').disabled = false;
        showFErr('ytErr', m.message);
      }
    };
    es.onerror = () => es.close();
    window._es = es;
  }
  
  function ytSetProg(pct, status) {
    document.getElementById('ytProgBar').style.width = pct + '%';
    document.getElementById('ytProgPct').textContent = Math.round(pct) + '%';
    if (status) document.getElementById('ytProgStatus').textContent = status;
  }
  
  function ytShowSuccess(dlUrl, filename, filesize) {
    document.getElementById('ytProg').classList.remove('on');
    document.getElementById('ytSuccess').classList.add('on');
    document.getElementById('ytSuccessSub').textContent = (ytFmt_ === 'mp3' ? 'MP3 · ' + ytAQ_ + 'kbps' : 'MP4 H.264') + ' · ' + (filename || '').slice(0, 50);
  
    // Tamanho real do arquivo se disponível, senão estimado
    const sizeEl = document.getElementById('ytSuccessSize');
    if (filesize && filesize > 0) {
      sizeEl.textContent = '📦 ' + fmtSize(filesize);
    } else {
      sizeEl.textContent = '';
    }
  
    // Botão de salvar — usa download attribute + type correto para mobile
    const a = document.getElementById('ytSaveBtn');
    a.href = dlUrl;
    a.download = filename || ('download.' + ytFmt_);
    // Define type MIME correto para o navegador mobile tratar corretamente
    if (ytFmt_ === 'mp4') {
      a.setAttribute('type', 'video/mp4');
    } else {
      a.setAttribute('type', 'audio/mpeg');
    }
  
    // Detecta mobile e mostra dica de salvar na galeria
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    document.getElementById('ytMobileHint').style.display = isMobile ? 'block' : 'none';
  }
  
  function ytReset() {
    document.getElementById('ytUrl').value = '';
    document.getElementById('ytPreview').classList.remove('on');
    document.getElementById('ytOpts').style.display = 'none';
    document.getElementById('ytProg').classList.remove('on');
    document.getElementById('ytSuccess').classList.remove('on');
    document.getElementById('ytDlBtn').disabled = false;
    hideFErr('ytErr');
  }