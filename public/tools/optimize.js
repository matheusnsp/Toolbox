// ════════════════════════════════════════
//  OTIMIZADOR DE IMAGEM — tools/optimize.js
//  Reduz o tamanho de imagens (re-encode + resize opcional)
//  100% no navegador, sem servidor.
//  Adicione ao HTML:  <script src="tools/optimize.js"></script>
// ════════════════════════════════════════

// ── STATE (isolado) ──
const _opt = {
    file: null,
    ext: null,
    bitmap: null,     // ImageBitmap original
    origW: 0,
    origH: 0,
    origSize: 0,
    lastBlob: null,   // resultado para download
  };
  
  const OPT_INPUT = ['png','jpg','jpeg','webp','bmp','gif'];
  
  // ════════════════════════════════════════
  //  buildImg — HTML do modal
  // ════════════════════════════════════════
  function buildImg() {
    return `
  <style>
    #optWrap *{ box-sizing:border-box; }
    #optWrap { font-family:'IBM Plex Mono', monospace; padding:4px 0 8px; }
  
    /* Drop zone */
    #optDrop {
      border:1.5px dashed #3a3a40; border-radius:12px;
      padding:40px 24px; text-align:center; cursor:pointer;
      transition:border-color .18s, background .18s;
      background:#18181a; position:relative;
    }
    #optDrop:hover, #optDrop.over { border-color:#7c6af7; background:rgba(124,106,247,.05); }
    #optDrop input[type=file]{ position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
    #optDropIcon{ font-size:28px; margin-bottom:10px; }
    #optDropTitle{ font-size:13px; color:#e8e8ea; margin-bottom:4px; }
    #optDropSub{ font-size:11px; color:#666670; line-height:1.6; }
  
    /* File bar */
    #optFileBar{
      display:flex; align-items:center; gap:12px;
      background:#18181a; border:1px solid #2e2e33;
      border-radius:10px; padding:10px 14px; margin-bottom:16px;
    }
    #optThumb{
      width:40px; height:40px; border-radius:7px; object-fit:cover;
      background:#222225; flex-shrink:0;
    }
    #optFileMeta{ flex:1; min-width:0; }
    #optFileName{
      font-size:12px; font-weight:500; color:#e8e8ea;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px;
    }
    #optFileSize{ font-size:10px; color:#666670; }
    #optResetBtn{
      background:none; border:1px solid #3a3a40; color:#666670;
      border-radius:7px; padding:4px 10px; font-size:10px;
      font-family:inherit; cursor:pointer; flex-shrink:0;
      transition:color .15s, border-color .15s;
    }
    #optResetBtn:hover{ color:#e8e8ea; border-color:#666670; }
  
    .opt-label{
      font-size:9px; font-weight:500; letter-spacing:.14em;
      text-transform:uppercase; color:#666670; margin-bottom:8px;
    }
  
    /* Format buttons */
    #optFmtGrid{ display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px; }
    .opt-fmt-btn{
      font-family:inherit; font-size:10px; font-weight:500;
      padding:6px 12px; border:1px solid #2e2e33;
      border-radius:7px; background:#18181a; color:#666670;
      cursor:pointer; transition:all .14s;
      text-transform:uppercase; letter-spacing:.06em;
    }
    .opt-fmt-btn:hover{ border-color:#3a3a40; color:#e8e8ea; }
    .opt-fmt-btn.active{ border-color:#7c6af7; background:rgba(124,106,247,.1); color:#a594fb; }
  
    /* Options block */
    #optOptsBlock{
      background:#18181a; border:1px solid #2e2e33;
      border-radius:10px; padding:14px; margin-bottom:16px;
    }
    .opt-row{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
    .opt-row:last-child{ margin-bottom:0; }
    .opt-row-label{ font-size:11px; color:#666670; min-width:84px; }
    .opt-row input[type=range]{ flex:1; accent-color:#7c6af7; height:3px; cursor:pointer; }
    .opt-row-val{ font-size:10px; color:#e8e8ea; min-width:42px; text-align:right; }
    .opt-row input[type=number]{
      background:#222225; border:1px solid #2e2e33; border-radius:6px;
      color:#e8e8ea; font-family:inherit; font-size:10px;
      padding:4px 8px; width:80px; outline:none;
    }
    .opt-row input[type=number]:focus{ border-color:#7c6af7; }
    .opt-mid{ font-size:11px; color:#44444c; }
    .opt-check{
      display:flex; align-items:center; gap:5px;
      font-size:11px; color:#666670; cursor:pointer; user-select:none;
    }
    .opt-check input{ accent-color:#7c6af7; cursor:pointer; }
  
    /* Botão */
    #optBtn{
      width:100%; padding:12px; background:#7c6af7; color:#fff;
      border:none; border-radius:10px; font-family:inherit;
      font-size:12px; font-weight:500; letter-spacing:.08em; cursor:pointer;
      transition:opacity .15s, transform .1s;
      display:flex; align-items:center; justify-content:center; gap:8px;
    }
    #optBtn:hover:not(:disabled){ opacity:.88; }
    #optBtn:active:not(:disabled){ transform:scale(.99); }
    #optBtn:disabled{ opacity:.3; cursor:not-allowed; }
  
    /* Erro */
    #optErr{
      background:rgba(248,113,113,.06); border:1px solid rgba(248,113,113,.2);
      border-radius:10px; padding:10px 12px; font-size:11px;
      color:#f87171; margin-top:12px; display:none;
    }
  
    /* Resultado */
    #optResult{
      background:#18181a; border:1px solid #2e2e33;
      border-radius:10px; padding:16px; margin-top:14px; display:none;
    }
    #optStats{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
    .opt-stat{ text-align:center; flex:1; }
    .opt-stat-val{ font-size:15px; color:#e8e8ea; margin-bottom:2px; }
    .opt-stat-lbl{ font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:#666670; }
    .opt-stat-arrow{ font-size:14px; color:#44444c; padding:0 8px; }
    #optSaved{ color:#34d399; }
    #optDoneLink{
      display:flex; align-items:center; justify-content:center; gap:6px;
      background:rgba(52,211,153,.1); color:#34d399;
      border:1px solid rgba(52,211,153,.2); border-radius:10px;
      padding:11px; font-family:inherit; font-size:11px; font-weight:500;
      text-decoration:none; transition:background .15s;
    }
    #optDoneLink:hover{ background:rgba(52,211,153,.16); }
    #optDoneLink svg{ width:14px; height:14px; }
  </style>
  
  <div id="optWrap">
    <!-- STEP 1: drop -->
    <div id="optStep1">
      <div id="optDrop">
        <input type="file" id="optFileInput" accept="image/*" onchange="optOnFileChange(this)">
        <div id="optDropIcon">🖼️</div>
        <div id="optDropTitle">Arraste uma imagem ou clique para selecionar</div>
        <div id="optDropSub">PNG · JPG · WEBP · BMP · GIF<br>Processado localmente, sem servidor</div>
      </div>
    </div>
  
    <!-- STEP 2: opções -->
    <div id="optStep2" style="display:none">
      <div id="optFileBar">
        <img id="optThumb" alt="">
        <div id="optFileMeta">
          <div id="optFileName"></div>
          <div id="optFileSize"></div>
        </div>
        <button id="optResetBtn" onclick="optReset()">↩ trocar</button>
      </div>
  
      <div class="opt-label">Formato de saída</div>
      <div id="optFmtGrid"></div>
  
      <div class="opt-label">Ajustes</div>
      <div id="optOptsBlock">
        <div class="opt-row" id="optQualityRow">
          <span class="opt-row-label">Qualidade</span>
          <input type="range" id="optQuality" min="10" max="100" value="80"
            oninput="document.getElementById('optQualityVal').textContent=this.value+'%'">
          <span class="opt-row-val" id="optQualityVal">80%</span>
        </div>
        <div class="opt-row">
          <span class="opt-row-label">Redimensionar</span>
          <input type="number" id="optW" placeholder="larg">
          <span class="opt-mid">×</span>
          <input type="number" id="optH" placeholder="alt">
          <label class="opt-check">
            <input type="checkbox" id="optAspect" checked> proporção
          </label>
        </div>
      </div>
  
      <button id="optBtn" onclick="optRun()">
        <span id="optSpin" style="display:none"></span>
        <span>⚡ Otimizar</span>
      </button>
  
      <div id="optErr"></div>
  
      <div id="optResult">
        <div id="optStats">
          <div class="opt-stat">
            <div class="opt-stat-val" id="optBefore">—</div>
            <div class="opt-stat-lbl">Antes</div>
          </div>
          <div class="opt-stat-arrow">→</div>
          <div class="opt-stat">
            <div class="opt-stat-val" id="optAfter">—</div>
            <div class="opt-stat-lbl">Depois</div>
          </div>
          <div class="opt-stat-arrow">·</div>
          <div class="opt-stat">
            <div class="opt-stat-val" id="optSaved">—</div>
            <div class="opt-stat-lbl">Economia</div>
          </div>
        </div>
        <a id="optDoneLink" href="#" download>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16"/></svg>
          Baixar imagem otimizada
        </a>
      </div>
    </div>
  </div>`;
  }
  
  // ════════════════════════════════════════
  //  afterImgOpen — chamado após abrir o modal
  // ════════════════════════════════════════
  function afterImgOpen() {
    const drop = document.getElementById('optDrop');
    if (!drop) return;
  
    _opt.file = null; _opt.bitmap = null; _opt.lastBlob = null;
  
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('over');
      const f = e.dataTransfer.files[0];
      if (f) optLoadFile(f);
    });
  }
  
  // ════════════════════════════════════════
  //  FILE LOAD
  // ════════════════════════════════════════
  function optOnFileChange(input) {
    if (input.files[0]) optLoadFile(input.files[0]);
  }
  
  async function optLoadFile(f) {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!OPT_INPUT.includes(ext) && !f.type.startsWith('image/')) {
      optShowErr('Formato não suportado. Use PNG, JPG, WEBP, BMP ou GIF.');
      return;
    }
    optHideErr();
  
    try {
      _opt.bitmap = await createImageBitmap(f);
    } catch {
      optShowErr('Não foi possível ler esta imagem.');
      return;
    }
  
    _opt.file = f;
    _opt.ext = ext;
    _opt.origW = _opt.bitmap.width;
    _opt.origH = _opt.bitmap.height;
    _opt.origSize = f.size;
    _opt.lastBlob = null;
  
    document.getElementById('optStep1').style.display = 'none';
    document.getElementById('optStep2').style.display = 'block';
    document.getElementById('optResult').style.display = 'none';
  
    // thumbnail
    const url = URL.createObjectURL(f);
    document.getElementById('optThumb').src = url;
    document.getElementById('optFileName').textContent = f.name;
    document.getElementById('optFileSize').textContent =
      optFmtBytes(f.size) + ' · ' + _opt.origW + '×' + _opt.origH;
  
    // formatos de saída — sugere o melhor por padrão
    const formats = ['webp','jpg','jpeg','png'];
    document.getElementById('optFmtGrid').innerHTML = formats.map((fmt,i) =>
      `<button class="opt-fmt-btn ${i===0?'active':''}" id="optFmt_${fmt}" onclick="optSelectFmt('${fmt}')">.${fmt}</button>`
    ).join('');
    _opt.outFmt = 'webp';
    optToggleQuality();
  
    // placeholders de redimensionamento
    document.getElementById('optW').placeholder = _opt.origW;
    document.getElementById('optH').placeholder = _opt.origH;
  }
  
  function optSelectFmt(fmt) {
    _opt.outFmt = fmt;
    document.querySelectorAll('.opt-fmt-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('optFmt_' + fmt)?.classList.add('active');
    optToggleQuality();
  }
  
  // PNG não usa qualidade (é lossless) — esconde o slider
  function optToggleQuality() {
    const row = document.getElementById('optQualityRow');
    if (row) row.style.display = (_opt.outFmt === 'png') ? 'none' : 'flex';
  }
  
  // jpg e jpeg são o mesmo formato
  function optIsJpeg(fmt) { return fmt === 'jpeg' || fmt === 'jpg'; }
  
  // ════════════════════════════════════════
  //  RUN
  // ════════════════════════════════════════
  async function optRun() {
    if (!_opt.bitmap) return;
    optHideErr();
    const btn = document.getElementById('optBtn');
    const spin = document.getElementById('optSpin');
    btn.disabled = true; if (spin) spin.style.display = 'block';
  
    try {
      let w = _opt.origW, h = _opt.origH;
      const rw = parseInt(document.getElementById('optW').value);
      const rh = parseInt(document.getElementById('optH').value);
      const keep = document.getElementById('optAspect').checked;
      if (rw && !rh && keep) { h = Math.round(h * rw / w); w = rw; }
      else if (rh && !rw && keep) { w = Math.round(w * rh / h); h = rh; }
      else if (rw && rh) { w = rw; h = rh; }
  
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
  
      const fmt = _opt.outFmt;
      if (optIsJpeg(fmt)) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(_opt.bitmap, 0, 0, w, h);
  
      const quality = (parseInt(document.getElementById('optQuality').value) || 80) / 100;
      const mime = optIsJpeg(fmt) ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/png';
  
      const blob = await new Promise((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('Falha ao gerar imagem.')), mime, quality)
      );
  
      _opt.lastBlob = blob;
      const base = _opt.file.name.replace(/\.[^.]+$/, '');
      const outName = base + '-otimizada.' + fmt;
  
      const url = URL.createObjectURL(blob);
      const link = document.getElementById('optDoneLink');
      link.href = url; link.download = outName;
  
      const before = _opt.origSize, after = blob.size;
      const pct = before > 0 ? Math.round((1 - after / before) * 100) : 0;
      document.getElementById('optBefore').textContent = optFmtBytes(before);
      document.getElementById('optAfter').textContent  = optFmtBytes(after);
      const savedEl = document.getElementById('optSaved');
      if (pct > 0) { savedEl.textContent = '-' + pct + '%'; savedEl.style.color = '#34d399'; }
      else         { savedEl.textContent = '+' + Math.abs(pct) + '%'; savedEl.style.color = '#f87171'; }
  
      document.getElementById('optResult').style.display = 'block';
    } catch (err) {
      optShowErr(err.message || 'Erro ao otimizar.');
    } finally {
      btn.disabled = false; if (spin) spin.style.display = 'none';
    }
  }
  
  // ════════════════════════════════════════
  //  RESET / UTILS
  // ════════════════════════════════════════
  function optReset() {
    _opt.file = null; _opt.bitmap = null; _opt.lastBlob = null;
    const fi = document.getElementById('optFileInput');
    if (fi) fi.value = '';
    document.getElementById('optStep1').style.display = 'block';
    document.getElementById('optStep2').style.display = 'none';
    document.getElementById('optResult').style.display = 'none';
    optHideErr();
  }
  
  function optShowErr(msg) {
    const e = document.getElementById('optErr');
    if (e) { e.textContent = '⚠ ' + msg; e.style.display = 'block'; }
  }
  function optHideErr() {
    const e = document.getElementById('optErr');
    if (e) e.style.display = 'none';
  }
  function optFmtBytes(n) {
    if (n < 1024)    return n + ' B';
    if (n < 1048576) return (n/1024).toFixed(1) + ' KB';
    return (n/1048576).toFixed(2) + ' MB';
  }