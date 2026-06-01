// ════════════════════════════════════════
//  CONVERSOR — Modal Integration
//  Adicione este arquivo ao seu HTML:
//  <script src="converter-modal.js"></script>
// ════════════════════════════════════════

// ── STATE (isolado do resto do app) ─────
const _conv = {
  file: null,
  fromExt: null,
  toExt: null,
  ffmpegLoaded: false,
  ffmpegInst: null,
  ffmpegFetch: null,
};

// ════════════════════════════════════════
//  MAPA DE CONVERSÕES
// ════════════════════════════════════════
const CONV_FORMATS = {
  png:   { label:'PNG',   cat:'image',    to:['jpg','jpeg','webp','gif','bmp','ico'] },
  jpg:   { label:'JPG',   cat:'image',    to:['png','jpeg','webp','gif','bmp','ico'] },
  jpeg:  { label:'JPEG',  cat:'image',    to:['png','jpg','webp','gif','bmp','ico'] },
  webp:  { label:'WEBP',  cat:'image',    to:['png','jpg','jpeg','gif','bmp','ico'] },
  gif:   { label:'GIF',   cat:'image',    to:['png','jpg','jpeg','webp','bmp','ico'] },
  bmp:   { label:'BMP',   cat:'image',    to:['png','jpg','jpeg','webp','gif','ico'] },
  tiff:  { label:'TIFF',  cat:'image',    to:['png','jpg','jpeg','webp','gif','bmp','ico'] },
  tif:   { label:'TIF',   cat:'image',    to:['png','jpg','jpeg','webp','gif','bmp','ico'] },
  svg:   { label:'SVG',   cat:'image',    to:['png','jpg','jpeg','webp','gif','bmp','ico'] },
  ico:   { label:'ICO',   cat:'image',    to:['png','jpg','jpeg','webp','gif','bmp'] },
  heic:  { label:'HEIC',  cat:'image',    to:['png','jpg','jpeg','webp','gif','bmp','ico'] },
  heif:  { label:'HEIF',  cat:'image',    to:['png','jpg','jpeg','webp','gif','bmp','ico'] },
  avif:  { label:'AVIF',  cat:'image',    to:['png','jpg','jpeg','webp','gif','bmp','ico'] },
  pdf:   { label:'PDF',   cat:'document', to:['txt','docx'] },
  docx:  { label:'DOCX',  cat:'document', to:['pdf','txt','md'] },
  txt:   { label:'TXT',   cat:'document', to:['pdf','html','md'] },
  md:    { label:'MD',    cat:'document', to:['html','pdf','txt'] },
  html:  { label:'HTML',  cat:'document', to:['pdf','md','txt'] },
  json:  { label:'JSON',  cat:'data',     to:['csv','xml','yaml','txt'] },
  csv:   { label:'CSV',   cat:'data',     to:['json','xlsx','xml','yaml','txt'] },
  xlsx:  { label:'XLSX',  cat:'data',     to:['csv','json','txt'] },
  xls:   { label:'XLS',   cat:'data',     to:['csv','json','xlsx','txt'] },
  xml:   { label:'XML',   cat:'data',     to:['json','csv','txt'] },
  yaml:  { label:'YAML',  cat:'data',     to:['json','xml','csv','txt'] },
  yml:   { label:'YML',   cat:'data',     to:['json','xml','csv','txt'] },
  toml:  { label:'TOML',  cat:'data',     to:['json','yaml','txt'] },
  mp3:   { label:'MP3',   cat:'audio',    to:['wav','ogg','aac','flac','m4a'] },
  wav:   { label:'WAV',   cat:'audio',    to:['mp3','ogg','aac','flac','m4a'] },
  ogg:   { label:'OGG',   cat:'audio',    to:['mp3','wav','aac','flac'] },
  aac:   { label:'AAC',   cat:'audio',    to:['mp3','wav','ogg','flac'] },
  flac:  { label:'FLAC',  cat:'audio',    to:['mp3','wav','ogg','aac'] },
  m4a:   { label:'M4A',   cat:'audio',    to:['mp3','wav','ogg','aac'] },
  opus:  { label:'OPUS',  cat:'audio',    to:['mp3','wav','ogg'] },
  wma:   { label:'WMA',   cat:'audio',    to:['mp3','wav','ogg','aac'] },
  mp4:   { label:'MP4',   cat:'video',    to:['mp3','wav','ogg','avi','mkv','webm','gif','mov'] },
  webm:  { label:'WEBM',  cat:'video',    to:['mp4','mp3','wav','ogg','avi'] },
  mov:   { label:'MOV',   cat:'video',    to:['mp4','mp3','wav','webm','avi'] },
  avi:   { label:'AVI',   cat:'video',    to:['mp4','mp3','wav','webm','mkv'] },
  mkv:   { label:'MKV',   cat:'video',    to:['mp4','mp3','wav','webm','avi'] },
  flv:   { label:'FLV',   cat:'video',    to:['mp4','mp3','wav','webm'] },
  wmv:   { label:'WMV',   cat:'video',    to:['mp4','mp3','wav','avi'] },
  m4v:   { label:'M4V',   cat:'video',    to:['mp4','mp3','wav','webm'] },
  ts:    { label:'TS',    cat:'video',    to:['mp4','mp3','wav','webm'] },
  ttf:   { label:'TTF',   cat:'font',     to:['woff','woff2','otf'] },
  otf:   { label:'OTF',   cat:'font',     to:['ttf','woff','woff2'] },
  woff:  { label:'WOFF',  cat:'font',     to:['ttf','woff2','otf'] },
  woff2: { label:'WOFF2', cat:'font',     to:['ttf','woff','otf'] },
  eot:   { label:'EOT',   cat:'font',     to:['ttf','woff','woff2'] },
};

const CONV_CAT_ICONS = {
  image:'🖼️', document:'📄', data:'📊', audio:'🎵', video:'🎬', font:'🔤'
};

// ════════════════════════════════════════
//  buildConv — retorna o HTML do modal
// ════════════════════════════════════════
function buildConv() {
  return `
<style>
  /* ── Conversor: estilos escopados ── */
  #convWrap *{ box-sizing:border-box; }
  #convWrap {
    font-family: 'IBM Plex Mono', monospace;
    padding: 4px 0 8px;
  }

  /* Drop zone */
  #convDrop {
    border: 1.5px dashed #3a3a40;
    border-radius: 12px;
    padding: 40px 24px;
    text-align: center;
    cursor: pointer;
    transition: border-color .18s, background .18s;
    background: #18181a;
    position: relative;
  }
  #convDrop:hover, #convDrop.over {
    border-color: #7c6af7;
    background: rgba(124,106,247,.05);
  }
  #convDrop input[type=file] {
    position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%;
  }
  #convDropIcon {
    font-size: 28px; margin-bottom: 10px;
  }
  #convDropTitle {
    font-size: 13px; color: #e8e8ea; margin-bottom: 4px;
  }
  #convDropSub {
    font-size: 11px; color: #666670; line-height: 1.6;
  }

  /* File bar */
  #convFileBar {
    display:flex; align-items:center; gap:12px;
    background:#18181a; border:1px solid #2e2e33;
    border-radius:10px; padding:10px 14px; margin-bottom:16px;
  }
  #convFileIco {
    font-size:20px; flex-shrink:0;
  }
  #convFileMeta { flex:1; min-width:0; }
  #convFileName {
    font-size:12px; font-weight:500; color:#e8e8ea;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px;
  }
  #convFileSize {
    font-size:10px; color:#666670;
  }
  #convResetBtn {
    background:none; border:1px solid #3a3a40; color:#666670;
    border-radius:7px; padding:4px 10px; font-size:10px;
    font-family:inherit; cursor:pointer; flex-shrink:0;
    transition:color .15s, border-color .15s;
  }
  #convResetBtn:hover { color:#e8e8ea; border-color:#666670; }

  /* Label */
  .conv-label {
    font-size:9px; font-weight:500; letter-spacing:.14em;
    text-transform:uppercase; color:#666670; margin-bottom:8px;
  }

  /* Format grid */
  #convFmtGrid {
    display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px;
  }
  .conv-fmt-btn {
    font-family:inherit; font-size:10px; font-weight:500;
    padding:6px 10px; border:1px solid #2e2e33;
    border-radius:7px; background:#18181a; color:#666670;
    cursor:pointer; transition:all .14s;
    text-transform:uppercase; letter-spacing:.06em;
  }
  .conv-fmt-btn:hover { border-color:#3a3a40; color:#e8e8ea; }
  .conv-fmt-btn.active {
    border-color:#7c6af7; background:rgba(124,106,247,.1); color:#a594fb;
  }

  /* Options */
  #convOptsBlock {
    background:#18181a; border:1px solid #2e2e33;
    border-radius:10px; padding:12px 14px; margin-bottom:16px;
  }
  .conv-opt-row {
    display:flex; align-items:center; gap:10px; margin-bottom:10px;
  }
  .conv-opt-row:last-child { margin-bottom:0; }
  .conv-opt-label { font-size:11px; color:#666670; min-width:68px; }
  .conv-opt-row input[type=range] {
    flex:1; accent-color:#7c6af7; height:3px; cursor:pointer;
  }
  .conv-opt-val {
    font-size:10px; color:#e8e8ea; min-width:30px; text-align:right;
  }
  .conv-opt-row input[type=number] {
    background:#222225; border:1px solid #2e2e33; border-radius:6px;
    color:#e8e8ea; font-family:inherit; font-size:10px;
    padding:4px 8px; width:80px; outline:none;
  }
  .conv-opt-row input[type=number]:focus { border-color:#7c6af7; }
  .conv-opt-mid { font-size:11px; color:#44444c; }
  .conv-opt-check {
    display:flex; align-items:center; gap:5px;
    font-size:11px; color:#666670; cursor:pointer; user-select:none;
  }
  .conv-opt-check input { accent-color:#7c6af7; cursor:pointer; }

  /* Convert button */
  #convBtn {
    width:100%; padding:12px;
    background:#7c6af7; color:#fff;
    border:none; border-radius:10px;
    font-family:inherit; font-size:12px; font-weight:500;
    letter-spacing:.08em; cursor:pointer;
    transition:opacity .15s, transform .1s;
    display:flex; align-items:center; justify-content:center; gap:8px;
  }
  #convBtn:hover:not(:disabled) { opacity:.88; }
  #convBtn:active:not(:disabled) { transform:scale(.99); }
  #convBtn:disabled { opacity:.3; cursor:not-allowed; }

  /* Spinner */
  #convSpin {
    width:13px; height:13px;
    border:2px solid rgba(255,255,255,.2);
    border-top-color:#fff; border-radius:50%;
    animation:convSpin .7s linear infinite; display:none;
  }
  #convSpin.on { display:block; }
  @keyframes convSpin { to { transform:rotate(360deg); } }

  /* Progress */
  #convProgress {
    background:#18181a; border:1px solid #2e2e33;
    border-radius:10px; padding:14px; margin-top:14px;
  }
  #convProgHead {
    display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;
  }
  #convProgStatus {
    font-size:9px; letter-spacing:.14em;
    text-transform:uppercase; color:#a594fb;
  }
  #convProgPct { font-size:11px; color:#666670; }
  #convProgTrack {
    height:2px; background:#2e2e33; border-radius:2px;
    overflow:hidden; margin-bottom:7px;
  }
  #convProgFill {
    height:100%; background:#7c6af7; border-radius:2px;
    transition:width .25s ease;
  }
  #convProgLog { font-size:10px; color:#666670; }

  /* Error */
  #convErr {
    background:rgba(248,113,113,.06); border:1px solid rgba(248,113,113,.2);
    border-radius:10px; padding:10px 12px;
    font-size:11px; color:#f87171; margin-top:12px; display:none;
  }

  /* Done */
  #convDone {
    text-align:center; padding:20px 0 8px;
  }
  #convDoneCheck {
    width:44px; height:44px;
    background:rgba(52,211,153,.1); border:1px solid rgba(52,211,153,.25);
    border-radius:12px; display:flex; align-items:center; justify-content:center;
    margin:0 auto 14px; color:#34d399;
    animation:convPop .4s cubic-bezier(.34,1.56,.64,1) both;
  }
  #convDoneCheck svg { width:20px; height:20px; }
  @keyframes convPop {
    0%   { transform:scale(.6); opacity:0; }
    100% { transform:scale(1);  opacity:1; }
  }
  #convDoneTitle { font-size:14px; font-weight:400; color:#e8e8ea; margin-bottom:4px; }
  #convDoneInfo  { font-size:10px; color:#666670; margin-bottom:16px; }
  #convDoneLink {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(52,211,153,.1); color:#34d399;
    border:1px solid rgba(52,211,153,.2);
    border-radius:10px; padding:10px 22px;
    font-family:inherit; font-size:11px; font-weight:500;
    text-decoration:none; transition:background .15s; margin-bottom:8px;
  }
  #convDoneLink:hover { background:rgba(52,211,153,.16); }
  #convDoneLink svg { width:14px; height:14px; }
  #convAgainBtn {
    display:block; background:none; border:none;
    color:#666670; font-family:inherit; font-size:10px;
    cursor:pointer; text-decoration:underline;
    text-underline-offset:3px; margin:6px auto 0;
  }
  #convAgainBtn:hover { color:#e8e8ea; }
</style>

<div id="convWrap">
  <!-- STEP 1: drop -->
  <div id="convStep1">
    <div id="convDrop">
      <input type="file" id="convFileInput" onchange="convOnFileChange(this)">
      <div id="convDropIcon">📂</div>
      <div id="convDropTitle">Arraste um arquivo ou clique para selecionar</div>
      <div id="convDropSub">Imagens · Documentos · Áudio · Vídeo · Dados · Fontes<br>Processado localmente, sem servidor</div>
    </div>
  </div>

  <!-- STEP 2: converter -->
  <div id="convStep2" style="display:none">
    <div id="convFileBar">
      <div id="convFileIco"></div>
      <div id="convFileMeta">
        <div id="convFileName"></div>
        <div id="convFileSize"></div>
      </div>
      <button id="convResetBtn" onclick="convReset()">↩ trocar</button>
    </div>
    <div class="conv-label">Converter para</div>
    <div id="convFmtGrid"></div>
    <div id="convOptsBlock" style="display:none">
      <div id="convOptsInner"></div>
    </div>
    <button id="convBtn" onclick="convRun()" disabled>
      <span id="convSpin"></span>
      <span id="convBtnLabel">⚡ Converter</span>
    </button>
    <div id="convErr"></div>
    <div id="convProgress" style="display:none">
      <div id="convProgHead">
        <span id="convProgStatus">processando</span>
        <span id="convProgPct">0%</span>
      </div>
      <div id="convProgTrack"><div id="convProgFill" style="width:0%"></div></div>
      <div id="convProgLog">Iniciando...</div>
    </div>
  </div>

  <!-- STEP 3: done -->
  <div id="convStep3" style="display:none">
    <div id="convDone">
      <div id="convDoneCheck">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div id="convDoneTitle">Arquivo convertido!</div>
      <div id="convDoneInfo"></div>
      <a id="convDoneLink" href="#" download class="btn-dl">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16"/></svg>
        Baixar arquivo
      </a>
      <button id="convAgainBtn" onclick="convReset()">Converter outro arquivo</button>
    </div>
  </div>
</div>`;
}

// ════════════════════════════════════════
//  afterConvOpen — chamado após modal abrir
// ════════════════════════════════════════
function afterConvOpen() {
  const drop = document.getElementById('convDrop');
  if (!drop) return;

  // Reset state ao abrir
  _conv.file = null;
  _conv.fromExt = null;
  _conv.toExt = null;

  drop.addEventListener('dragover', e => {
    e.preventDefault(); drop.classList.add('over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => {
    e.preventDefault(); drop.classList.remove('over');
    const f = e.dataTransfer.files[0];
    if (f) convLoadFile(f);
  });
}

// ════════════════════════════════════════
//  FILE LOAD
// ════════════════════════════════════════
function convOnFileChange(input) {
  if (input.files[0]) convLoadFile(input.files[0]);
}

function convLoadFile(f) {
  const ext  = f.name.split('.').pop().toLowerCase();
  const info = CONV_FORMATS[ext];
  if (!info) { convShowErr('".' + ext + '" não é suportado.'); return; }

  _conv.file = f;
  _conv.fromExt = ext;
  _conv.toExt = null;

  convHideErr();
  document.getElementById('convStep1').style.display = 'none';
  document.getElementById('convStep2').style.display = 'block';
  document.getElementById('convStep3').style.display = 'none';
  document.getElementById('convProgress').style.display = 'none';

  document.getElementById('convFileIco').textContent  = CONV_CAT_ICONS[info.cat] || '📁';
  document.getElementById('convFileName').textContent = f.name;
  document.getElementById('convFileSize').textContent = convFmtBytes(f.size) + ' · ' + info.label;

  document.getElementById('convFmtGrid').innerHTML = info.to.map(t =>
    `<button class="conv-fmt-btn" id="convFmt_${t}" onclick="convSelectTo('${t}')">.${t}</button>`
  ).join('');

  document.getElementById('convBtn').disabled = true;
  document.getElementById('convOptsBlock').style.display = 'none';
}

// ════════════════════════════════════════
//  SELECT TARGET FORMAT
// ════════════════════════════════════════
function convSelectTo(ext) {
  _conv.toExt = ext;
  document.querySelectorAll('.conv-fmt-btn').forEach(b => b.classList.remove('active'));
  const sel = document.getElementById('convFmt_' + ext);
  if (sel) sel.classList.add('active');
  document.getElementById('convBtn').disabled = false;
  convBuildOptions();
}

function convBuildOptions() {
  const from = _conv.fromExt, to = _conv.toExt;
  const fromCat = CONV_FORMATS[from]?.cat;
  let html = '';

  if (fromCat === 'image' && ['jpeg','jpg','webp'].includes(to)) {
    html += `
      <div class="conv-opt-row">
        <span class="conv-opt-label">Qualidade</span>
        <input type="range" id="convOptQuality" min="10" max="100" value="92"
          oninput="document.getElementById('convOptQualVal').textContent=this.value+'%'">
        <span class="conv-opt-val" id="convOptQualVal">92%</span>
      </div>`;
  }

  if (fromCat === 'image' && CONV_FORMATS[to]?.cat === 'image') {
    html += `
      <div class="conv-opt-row">
        <span class="conv-opt-label">Largura px</span>
        <input type="number" id="convOptW" placeholder="auto">
        <span class="conv-opt-mid">×</span>
        <input type="number" id="convOptH" placeholder="auto">
        <label class="conv-opt-check">
          <input type="checkbox" id="convOptAspect" checked> proporção
        </label>
      </div>`;
  }

  const ob = document.getElementById('convOptsBlock');
  document.getElementById('convOptsInner').innerHTML = html;
  ob.style.display = html ? 'block' : 'none';
}

// ════════════════════════════════════════
//  RESET
// ════════════════════════════════════════
function convReset() {
  _conv.file = null; _conv.fromExt = null; _conv.toExt = null;
  const fi = document.getElementById('convFileInput');
  if (fi) fi.value = '';
  document.getElementById('convStep1').style.display = 'block';
  document.getElementById('convStep2').style.display = 'none';
  document.getElementById('convStep3').style.display = 'none';
  document.getElementById('convProgress').style.display = 'none';
  convHideErr();
}

// ════════════════════════════════════════
//  PROGRESS
// ════════════════════════════════════════
function convSetProgress(show, status, pct, log) {
  const pb   = document.getElementById('convProgress');
  const btn  = document.getElementById('convBtn');
  const spin = document.getElementById('convSpin');
  if (!pb) return;
  pb.style.display  = show ? 'block' : 'none';
  btn.disabled      = show;
  show ? spin.classList.add('on') : spin.classList.remove('on');
  if (status) document.getElementById('convProgStatus').textContent = status;
  if (pct !== undefined) {
    document.getElementById('convProgPct').textContent  = pct + '%';
    document.getElementById('convProgFill').style.width = pct + '%';
  }
  if (log) document.getElementById('convProgLog').textContent = log;
}

function convShowErr(msg) {
  const b = document.getElementById('convErr');
  if (b) { b.textContent = msg; b.style.display = 'block'; }
}
function convHideErr() {
  const b = document.getElementById('convErr');
  if (b) b.style.display = 'none';
}
function convFmtBytes(n) {
  if (n < 1024)    return n + ' B';
  if (n < 1048576) return (n/1024).toFixed(1) + ' KB';
  return (n/1048576).toFixed(2) + ' MB';
}

// ════════════════════════════════════════
//  SCRIPT LOADER
// ════════════════════════════════════════
function convLoadScript(src, globalKey, isModule) {
  return new Promise((res, rej) => {
    if (window[globalKey]) return res();
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      const t = setInterval(() => {
        if (window[globalKey]) { clearInterval(t); res(); }
      }, 100);
      // timeout after 30s
      setTimeout(() => { clearInterval(t); if (!window[globalKey]) rej(new Error('Timeout ao carregar: ' + src)); }, 30000);
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    if (isModule) s.type = 'module';
    s.onload = () => {
      // Se um global foi informado, aguarda ele aparecer (scripts UMD
      // como FFmpeg podem definir o global logo após o onload).
      if (globalKey && !window[globalKey]) {
        let tries = 0;
        const t = setInterval(() => {
          if (window[globalKey]) { clearInterval(t); res(); }
          else if (++tries > 100) { clearInterval(t); res(); } // ~10s, resolve mesmo assim
        }, 100);
      } else {
        res();
      }
    };
    s.onerror = () => rej(new Error('Falha ao carregar: ' + src));
    document.head.appendChild(s);
  });
}

// ════════════════════════════════════════
//  RUN DISPATCHER
// ════════════════════════════════════════
async function convRun() {
  if (!_conv.file || !_conv.toExt) return;
  convHideErr();
  const file = _conv.file, from = _conv.fromExt, to = _conv.toExt;
  const cat  = CONV_FORMATS[from]?.cat;
  const base = file.name.replace(/\.[^.]+$/, '');
  convSetProgress(true, 'processando', 5, 'Preparando...');

  try {
    let result;
    if      (cat === 'image')                   result = await convImage(file, from, to, base);
    else if (cat === 'document')                result = await convDocument(file, from, to, base);
    else if (cat === 'data')                    result = await convData(file, from, to, base);
    else if (cat === 'audio' || cat === 'video') result = await convMedia(file, from, to, base);
    else if (cat === 'font')                    result = await convFont(file, from, to, base);
    else throw new Error('Categoria não suportada.');

    convSetProgress(true, 'concluído', 100, 'Pronto!');
    await new Promise(r => setTimeout(r, 400));

    const url = URL.createObjectURL(result.blob);
    document.getElementById('convDoneLink').href     = url;
    document.getElementById('convDoneLink').download = result.outName;
    document.getElementById('convDoneInfo').textContent = result.outName + ' · ' + convFmtBytes(result.blob.size);
    document.getElementById('convStep2').style.display = 'none';
    document.getElementById('convStep3').style.display = 'block';
  } catch (err) {
    convSetProgress(false);
    convShowErr(err.message || 'Erro na conversão.');
  }
}

// ════════════════════════════════════════
//  IMAGENS
// ════════════════════════════════════════
async function convImage(file, from, to, base) {
  convSetProgress(true, 'decodificando', 20, 'Lendo imagem...');
  let source;        // algo que drawImage aceita (ImageBitmap ou HTMLImageElement)
  let srcW = 0, srcH = 0;

  if (from === 'heic' || from === 'heif') {
    await convLoadScript('https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js', 'heic2any');
    convSetProgress(true, 'convertendo', 40, 'Convertendo HEIC...');
    let conv = await heic2any({ blob: file, toType: 'image/png' });
    if (Array.isArray(conv)) conv = conv[0];
    source = await createImageBitmap(conv);
    srcW = source.width; srcH = source.height;
  } else if (from === 'svg') {
    const text = await file.text();
    const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    source = await new Promise((res, rej) => {
      const img = new Image();
      img.onload  = () => res(img);
      img.onerror = () => rej(new Error('Falha ao ler SVG.'));
      img.src = url;
    });
    // SVG pode não ter dimensões intrínsecas → cai num fallback
    srcW = source.naturalWidth  || source.width  || 0;
    srcH = source.naturalHeight || source.height || 0;
    if (!srcW || !srcH) {
      const vb = (text.match(/viewBox\s*=\s*["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/i));
      if (vb) { srcW = Math.round(+vb[1]); srcH = Math.round(+vb[2]); }
    }
    if (!srcW || !srcH) { srcW = 1024; srcH = 1024; } // último recurso
  } else if (from === 'tiff' || from === 'tif') {
    // O navegador não decodifica TIFF nativamente → usa UTIF.js
    await convLoadScript('https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.min.js', 'UTIF');
    convSetProgress(true, 'decodificando', 40, 'Decodificando TIFF...');
    const ab   = await file.arrayBuffer();
    const ifds = UTIF.decode(ab);
    UTIF.decodeImage(ab, ifds[0]);
    const rgba = UTIF.toRGBA8(ifds[0]);
    srcW = ifds[0].width; srcH = ifds[0].height;
    const tmp = document.createElement('canvas');
    tmp.width = srcW; tmp.height = srcH;
    const tctx = tmp.getContext('2d');
    const imgd = tctx.createImageData(srcW, srcH);
    imgd.data.set(rgba);
    tctx.putImageData(imgd, 0, 0);
    source = tmp; // canvas serve como source para drawImage
  } else {
    source = await createImageBitmap(file);
    srcW = source.width; srcH = source.height;
  }

  convSetProgress(true, 'renderizando', 60, 'Renderizando canvas...');

  let w = srcW, h = srcH;
  const rw = parseInt(document.getElementById('convOptW')?.value);
  const rh = parseInt(document.getElementById('convOptH')?.value);
  const keepAspect = document.getElementById('convOptAspect')?.checked !== false;
  if (rw && !rh && keepAspect) { h = Math.round(h * rw / w); w = rw; }
  else if (rh && !rw && keepAspect) { w = Math.round(w * rh / h); h = rh; }
  else if (rw && rh) { w = rw; h = rh; }

  // ICO: forçar tamanho máximo de 256 (limite do formato)
  if (to === 'ico' && (w > 256 || h > 256)) {
    const scale = 256 / Math.max(w, h);
    w = Math.round(w * scale); h = Math.round(h * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  // formatos sem canal alpha → fundo branco
  if (to === 'jpeg' || to === 'jpg' || to === 'bmp') {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(source, 0, 0, w, h);

  convSetProgress(true, 'exportando', 85, 'Codificando saída...');
  const quality = (parseInt(document.getElementById('convOptQuality')?.value) || 92) / 100;

  // Formatos suportados nativamente pelo canvas.toBlob: png, jpeg, webp.
  // BMP, GIF e ICO são codificados manualmente a partir do canvas.
  if (to === 'png' || to === 'jpeg' || to === 'jpg' || to === 'webp') {
    const mime = (to === 'jpg' || to === 'jpeg') ? 'image/jpeg'
               : to === 'webp' ? 'image/webp' : 'image/png';
    const blob = await new Promise((res, rej) => {
      canvas.toBlob(b => b ? res(b) : rej(new Error('Falha ao codificar imagem.')), mime, quality);
    });
    if (!blob) throw new Error('Falha ao codificar imagem.');
    return { blob, outName: base + '.' + to };
  }

  const imgData = ctx.getImageData(0, 0, w, h);

  if (to === 'bmp') {
    return { blob: convEncodeBmp(imgData), outName: base + '.bmp' };
  }
  if (to === 'gif') {
    return { blob: await convEncodeGif(imgData), outName: base + '.gif' };
  }
  if (to === 'ico') {
    // ICO embute um PNG (suportado por todos os SOs modernos)
    const png = await new Promise((res, rej) => {
      canvas.toBlob(b => b ? res(b) : rej(new Error('Falha ao gerar PNG para ICO.')), 'image/png');
    });
    const pngBuf = new Uint8Array(await png.arrayBuffer());
    return { blob: convEncodeIco(pngBuf, w, h), outName: base + '.ico' };
  }

  throw new Error(`Conversão de imagem para ${to} não suportada.`);
}

// ── BMP (24-bit, sem compressão) ──
function convEncodeBmp(imgData) {
  const { width: w, height: h, data } = imgData;
  const rowSize  = Math.floor((24 * w + 31) / 32) * 4; // alinhado a 4 bytes
  const pixelArr = rowSize * h;
  const fileSize = 54 + pixelArr;
  const buf = new ArrayBuffer(fileSize);
  const dv  = new DataView(buf);

  // BITMAPFILEHEADER
  dv.setUint8(0, 0x42); dv.setUint8(1, 0x4D);  // 'BM'
  dv.setUint32(2, fileSize, true);
  dv.setUint32(10, 54, true);                  // offset dos pixels
  // BITMAPINFOHEADER
  dv.setUint32(14, 40, true);
  dv.setInt32(18, w, true);
  dv.setInt32(22, h, true);                    // positivo = bottom-up
  dv.setUint16(26, 1, true);
  dv.setUint16(28, 24, true);
  dv.setUint32(34, pixelArr, true);

  let offset = 54;
  for (let y = h - 1; y >= 0; y--) {           // BMP é bottom-up
    let rowStart = offset;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      dv.setUint8(offset++, data[i + 2]); // B
      dv.setUint8(offset++, data[i + 1]); // G
      dv.setUint8(offset++, data[i]);     // R
    }
    while ((offset - rowStart) % 4 !== 0) dv.setUint8(offset++, 0); // padding
  }
  return new Blob([buf], { type: 'image/bmp' });
}

// ── ICO contendo um PNG ──
function convEncodeIco(pngBytes, w, h) {
  const header = new ArrayBuffer(6 + 16);
  const dv = new DataView(header);
  dv.setUint16(0, 0, true);    // reserved
  dv.setUint16(2, 1, true);    // type = icon
  dv.setUint16(4, 1, true);    // count
  dv.setUint8(6, w >= 256 ? 0 : w);
  dv.setUint8(7, h >= 256 ? 0 : h);
  dv.setUint8(8, 0);           // paleta
  dv.setUint8(9, 0);
  dv.setUint16(10, 1, true);   // planes
  dv.setUint16(12, 32, true);  // bpp
  dv.setUint32(14, pngBytes.length, true);
  dv.setUint32(18, 22, true);  // offset do PNG
  return new Blob([header, pngBytes], { type: 'image/x-icon' });
}

// ── GIF via gif.js (suporta export real) ──
let _gifLibLoaded = false;
function convEncodeGif(imgData) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!_gifLibLoaded) {
        await convLoadScript('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js', 'GIF');
        _gifLibLoaded = true;
      }
      // worker do gif.js como blob (evita problema de cross-origin)
      const workerStr = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js').then(r => r.text());
      const workerUrl = URL.createObjectURL(new Blob([workerStr], { type: 'application/javascript' }));

      const gif = new GIF({ workers: 1, quality: 10, width: imgData.width, height: imgData.height, workerScript: workerUrl });
      const c = document.createElement('canvas');
      c.width = imgData.width; c.height = imgData.height;
      c.getContext('2d').putImageData(imgData, 0, 0);
      gif.addFrame(c, { delay: 0 });
      gif.on('finished', blob => { URL.revokeObjectURL(workerUrl); resolve(blob); });
      gif.render();
    } catch (e) { reject(new Error('Falha ao codificar GIF: ' + e.message)); }
  });
}

// ════════════════════════════════════════
//  DOCUMENTOS
// ════════════════════════════════════════
async function convDocument(file, from, to, base) {
  // Only read as text for text-based source formats
  const isTextBased = ['md','html','txt'].includes(from);
  const text = isTextBased ? await file.text() : '';

  if (from === 'md' && to === 'html') {
    await convLoadScript('https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js', 'marked');
    convSetProgress(true, 'convertendo', 50, 'Renderizando Markdown...');
    const body = (typeof marked === 'function') ? marked(text) : marked.parse(text);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7}</style></head><body>${body}</body></html>`;
    return { blob: new Blob([html], { type:'text/html' }), outName: base + '.html' };
  }
  if (from === 'md' && to === 'txt') {
    const clean = text.replace(/#{1,6}\s/g,'').replace(/[*_`~]/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1');
    return { blob: new Blob([clean], { type:'text/plain' }), outName: base + '.txt' };
  }
  if (from === 'md' && to === 'pdf') {
    const clean = text.replace(/#{1,6}\s/g,'').replace(/[*_`~]/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1');
    return convTxtToPdf(clean, base);
  }
  if (from === 'html' && to === 'md') {
    const md = text
      .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_,n,c) => '#'.repeat(+n)+' '+c.replace(/<[^>]+>/g,'')+'\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi,'**$1**').replace(/<em[^>]*>(.*?)<\/em>/gi,'_$1_')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,'[$2]($1)')
      .replace(/<li[^>]*>(.*?)<\/li>/gi,'- $1\n')
      .replace(/<br\s*\/?>/gi,'\n').replace(/<p[^>]*>(.*?)<\/p>/gi,'$1\n\n')
      .replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ')
      .replace(/\n{3,}/g,'\n\n').trim();
    return { blob: new Blob([md], { type:'text/plain' }), outName: base + '.md' };
  }
  if (from === 'html' && to === 'txt') {
    const plain = text.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/\n{3,}/g,'\n\n').trim();
    return { blob: new Blob([plain], { type:'text/plain' }), outName: base + '.txt' };
  }
  if (from === 'html' && to === 'pdf') {
    const plain = text.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    return convTxtToPdf(plain, base);
  }
  if (from === 'txt' && to === 'pdf') return convTxtToPdf(text, base);
  if (from === 'txt' && to === 'html') {
    const escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7;white-space:pre-wrap}</style></head><body>${escaped}</body></html>`;
    return { blob: new Blob([html], { type:'text/html' }), outName: base + '.html' };
  }
  if (from === 'txt' && to === 'md') {
    return { blob: new Blob([text], { type:'text/plain' }), outName: base + '.md' };
  }
  if (from === 'docx') {
    convSetProgress(true, 'lendo docx', 30, 'Extraindo texto...');
    await convLoadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', 'mammoth');
    const ab  = await file.arrayBuffer();
    const res = await mammoth.convertToHtml({ arrayBuffer: ab });
    const html = res.value;
    if (to === 'html') return { blob: new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${html}</body></html>`],{type:'text/html'}), outName: base+'.html' };
    if (to === 'txt')  { const t = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); return { blob: new Blob([t],{type:'text/plain'}), outName: base+'.txt' }; }
    if (to === 'md') {
      const md = html
        .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi,(_,n,c)=>'#'.repeat(+n)+' '+c.replace(/<[^>]+>/g,'')+'\n\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi,'**$1**').replace(/<em[^>]*>(.*?)<\/em>/gi,'_$1_')
        .replace(/<p[^>]*>(.*?)<\/p>/gi,'$1\n\n').replace(/<[^>]+>/g,'').trim();
      return { blob: new Blob([md],{type:'text/plain'}), outName: base+'.md' };
    }
    if (to === 'pdf') {
      const plain = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
      return convTxtToPdf(plain, base);
    }
  }
  if (from === 'pdf') {
    convSetProgress(true, 'lendo pdf', 25, 'Carregando pdf.js...');
    if (!window.pdfjsLib) {
      await convLoadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'pdfjsLib');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    const ab  = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      convSetProgress(true, 'extraindo', Math.round(25+(i/pdf.numPages)*55), `Página ${i}/${pdf.numPages}...`);
      const page    = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(s => s.str).join(' ') + '\n\n';
    }
    if (to === 'txt') return { blob: new Blob([fullText],{type:'text/plain'}), outName: base+'.txt' };
    if (to === 'docx') {
      convSetProgress(true, 'gerando docx', 85, 'Criando documento Word...');
      await convLoadScript('https://unpkg.com/docx@8.5.0/build/index.umd.js', 'docx');
      const { Document, Packer, Paragraph, TextRun } = window.docx;
      const paragraphs = fullText.split(/\n\n+/).filter(Boolean).map(p =>
        new Paragraph({ children: [new TextRun(p.trim())] })
      );
      const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
      const buf = await Packer.toBlob(doc);
      return { blob: buf, outName: base+'.docx' };
    }
  }
  throw new Error(`Conversão ${from} → ${to} não suportada.`);
}

async function convTxtToPdf(text, base) {
  await convLoadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf');
  convSetProgress(true, 'gerando pdf', 55, 'Criando PDF...');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  doc.setFont('helvetica'); doc.setFontSize(11);
  const lines = doc.splitTextToSize(text, 170);
  let y = 20;
  lines.forEach(line => {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.text(line, 20, y); y += 6;
  });
  convSetProgress(true, 'gerando pdf', 85, 'Finalizando...');
  return { blob: doc.output('blob'), outName: base + '.pdf' };
}

// ════════════════════════════════════════
//  DADOS
// ════════════════════════════════════════
async function convData(file, from, to, base) {
  await convLoadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX');
  const text = await file.text();
  convSetProgress(true, 'parseando', 30, 'Lendo arquivo...');

  function parseCsv(raw) {
    const lines = raw.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
    return lines.slice(1).filter(Boolean).map(line => {
      const vals = line.match(/(".*?"|[^,]+)/g) || [];
      const obj = {};
      headers.forEach((h,i) => { obj[h] = (vals[i]||'').trim().replace(/^"|"$/g,''); });
      return obj;
    });
  }
  function objsToCsv(arr) {
    if (!arr.length) return '';
    const keys = Object.keys(arr[0]);
    return [keys.join(','), ...arr.map(r => keys.map(k => JSON.stringify(r[k]??'')).join(','))].join('\n');
  }
  function toXml(obj, root='root', item='item') {
    function toNode(v, tag) {
      if (Array.isArray(v)) return v.map(x => toNode(x, item)).join('');
      if (typeof v === 'object' && v) return `<${tag}>${Object.entries(v).map(([k,val])=>toNode(val,k)).join('')}</${tag}>`;
      return `<${tag}>${String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</${tag}>`;
    }
    return `<?xml version="1.0" encoding="UTF-8"?>\n${toNode(obj,root)}`;
  }
  function toYaml(obj, indent=0) {
    const pad = '  '.repeat(indent);
    if (Array.isArray(obj)) return obj.map(v => `${pad}- ${typeof v==='object'?'\n'+toYaml(v,indent+1):v}`).join('\n');
    if (typeof obj === 'object' && obj) return Object.entries(obj).map(([k,v]) => typeof v==='object' ? `${pad}${k}:\n${toYaml(v,indent+1)}` : `${pad}${k}: ${v}`).join('\n');
    return String(obj);
  }
  function parseYaml(raw) {
    const obj = {};
    raw.split('\n').forEach(line => {
      const m = line.match(/^(\s*)([^:]+):\s*(.*)$/);
      if (m && m[3]) obj[m[2].trim()] = m[3].trim().replace(/^["']|["']$/g,'');
    });
    return obj;
  }
  function parseXml(raw) {
    const doc = new DOMParser().parseFromString(raw, 'application/xml');
    function nodeToObj(node) {
      if (node.children.length === 0) return node.textContent.trim();
      const obj = {};
      for (const child of node.children) {
        const key = child.tagName, val = nodeToObj(child);
        if (obj[key]) { if (!Array.isArray(obj[key])) obj[key]=[obj[key]]; obj[key].push(val); }
        else obj[key] = val;
      }
      return obj;
    }
    return nodeToObj(doc.documentElement);
  }
  function parseToml(raw) {
    const obj = {}, lines = raw.split('\n');
    let section = obj;
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const secM = line.match(/^\[([^\]]+)\]$/);
      if (secM) { obj[secM[1]] = {}; section = obj[secM[1]]; return; }
      const kv = line.match(/^([^=]+)=(.*)$/);
      if (kv) {
        const k = kv[1].trim();
        let v = kv[2].trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1,-1);
        section[k] = v;
      }
    });
    return obj;
  }

  convSetProgress(true, 'convertendo', 60, 'Transformando dados...');

  if (from === 'xlsx' || from === 'xls') {
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type:'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws);
    if (to === 'csv')  return { blob: new Blob([objsToCsv(data)],{type:'text/csv'}),                                  outName: base+'.csv' };
    if (to === 'json') return { blob: new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),               outName: base+'.json' };
    if (to === 'txt')  return { blob: new Blob([objsToCsv(data)],{type:'text/plain'}),                                 outName: base+'.txt' };
  }
  if (from === 'csv') {
    const data = parseCsv(text);
    if (to === 'json') return { blob: new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),               outName: base+'.json' };
    if (to === 'xml')  return { blob: new Blob([toXml(data,'data','row')],{type:'application/xml'}),                   outName: base+'.xml' };
    if (to === 'yaml') return { blob: new Blob([toYaml(data)],{type:'text/plain'}),                                    outName: base+'.yaml' };
    if (to === 'txt')  return { blob: new Blob([text],{type:'text/plain'}),                                            outName: base+'.txt' };
    if (to === 'xlsx') {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Sheet1');
      const buf = XLSX.write(wb, { bookType:'xlsx', type:'array' });
      return { blob: new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), outName: base+'.xlsx' };
    }
  }
  if (from === 'json') {
    const data = JSON.parse(text);
    const arr  = Array.isArray(data) ? data : [data];
    if (to === 'csv')  return { blob: new Blob([objsToCsv(arr)],{type:'text/csv'}),                                   outName: base+'.csv' };
    if (to === 'xml')  return { blob: new Blob([toXml(data)],{type:'application/xml'}),                                outName: base+'.xml' };
    if (to === 'yaml') return { blob: new Blob([toYaml(data)],{type:'text/plain'}),                                    outName: base+'.yaml' };
    if (to === 'txt')  return { blob: new Blob([JSON.stringify(data,null,2)],{type:'text/plain'}),                     outName: base+'.txt' };
  }
  if (from === 'xml') {
    const data = parseXml(text);
    if (to === 'json') return { blob: new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),               outName: base+'.json' };
    if (to === 'csv')  { const arr = Array.isArray(data)?data:[data]; return { blob: new Blob([objsToCsv(arr)],{type:'text/csv'}), outName: base+'.csv' }; }
    if (to === 'txt')  return { blob: new Blob([text],{type:'text/plain'}),                                            outName: base+'.txt' };
  }
  if (from === 'yaml' || from === 'yml') {
    const data = parseYaml(text);
    if (to === 'json') return { blob: new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),               outName: base+'.json' };
    if (to === 'xml')  return { blob: new Blob([toXml(data)],{type:'application/xml'}),                                outName: base+'.xml' };
    if (to === 'csv')  { const arr = Array.isArray(data)?data:[data]; return { blob: new Blob([objsToCsv(arr)],{type:'text/csv'}), outName: base+'.csv' }; }
    if (to === 'txt')  return { blob: new Blob([text],{type:'text/plain'}),                                            outName: base+'.txt' };
  }
  if (from === 'toml') {
    const data = parseToml(text);
    if (to === 'json') return { blob: new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),               outName: base+'.json' };
    if (to === 'yaml') return { blob: new Blob([toYaml(data)],{type:'text/plain'}),                                    outName: base+'.yaml' };
    if (to === 'txt')  return { blob: new Blob([text],{type:'text/plain'}),                                            outName: base+'.txt' };
  }
  throw new Error(`Conversão ${from} → ${to} não suportada.`);
}

// ════════════════════════════════════════
//  ÁUDIO / VÍDEO — FFmpeg.wasm
// ════════════════════════════════════════
async function convMedia(file, from, to, base) {
  convSetProgress(true, 'carregando', 5, 'Carregando FFmpeg.wasm...');

  if (!_conv.ffmpegLoaded) {
    convSetProgress(true, 'carregando', 8, 'Importando FFmpeg...');

    const FF_VER   = '0.12.10';
    const UTIL_VER = '0.12.1';
    const CORE_VER = '0.12.6';

    // O FFmpeg UMD instancia um Worker (814.ffmpeg.js) por caminho relativo.
    // Esse worker SÓ funciona se servido do MESMO origin (localhost), senão:
    // "Failed to construct 'Worker' ... cannot be accessed from origin".
    // Por isso preferimos os arquivos locais (rode "node setup-ffmpeg.js").
    async function hasLocal() {
      try {
        const r = await fetch('/ffmpeg/ffmpeg.js', { method: 'HEAD' });
        return r.ok;
      } catch { return false; }
    }
    const useLocal = await hasLocal();

    if (!useLocal) {
      throw new Error('FFmpeg local não encontrado. No terminal, rode "node setup-ffmpeg.js" e reinicie o servidor.');
    }

    const FF_JS   = '/ffmpeg/ffmpeg.js';
    const UTIL_JS = '/ffmpeg/util.js';
    const CORE_BASE = '/ffmpeg';

    await convLoadScript(UTIL_JS, 'FFmpegUtil');
    await convLoadScript(FF_JS,   'FFmpegWASM');

    if (!window.FFmpegWASM || !window.FFmpegUtil) {
      throw new Error('Não foi possível carregar as bibliotecas do FFmpeg.');
    }

    const { fetchFile, toBlobURL } = window.FFmpegUtil;
    const FFmpeg = window.FFmpegWASM.FFmpeg;

    _conv.ffmpegFetch = fetchFile;
    _conv.ffmpegInst  = new FFmpeg();
    _conv.ffmpegInst.on('log', ({ message }) => {
      if (message) convSetProgress(true, 'convertendo', undefined, message.slice(0, 80));
    });
    _conv.ffmpegInst.on('progress', ({ progress }) => {
      let pct = Math.round((progress || 0) * 75) + 15;
      pct = Math.max(15, Math.min(90, pct));
      convSetProgress(true, 'convertendo', pct, `Processando... ${pct}%`);
    });

    convSetProgress(true, 'carregando', 10, 'Carregando núcleo local...');
    // Servimos do mesmo origin, então podemos usar as URLs diretamente.
    // Mas o core via blob garante o MIME correto em qualquer setup.
    const coreURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`,   'text/javascript');
    const wasmURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm');

    convSetProgress(true, 'carregando', 13, 'Inicializando núcleo...');
    const loadPromise = _conv.ffmpegInst.load({ coreURL, wasmURL });
    const timeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error('Tempo esgotado ao inicializar o FFmpeg.')), 180000)
    );
    await Promise.race([loadPromise, timeout]);
    _conv.ffmpegLoaded = true;
  }

  const inFile  = 'input.'  + from;
  const outFile = 'output.' + to;
  convSetProgress(true, 'escrevendo', 14, 'Carregando arquivo...');
  await _conv.ffmpegInst.writeFile(inFile, await _conv.ffmpegFetch(file));
  convSetProgress(true, 'convertendo', 15, 'Iniciando FFmpeg...');
  await _conv.ffmpegInst.exec(convFfmpegArgs(from, to, inFile, outFile));
  convSetProgress(true, 'lendo', 92, 'Lendo saída...');
  const data = await _conv.ffmpegInst.readFile(outFile);
  const mime = convMediaMime(to);
  const blob = new Blob([data.buffer], { type: mime });
  try { await _conv.ffmpegInst.deleteFile(inFile); await _conv.ffmpegInst.deleteFile(outFile); } catch {}
  return { blob, outName: base + '.' + to };
}

function convFfmpegArgs(from, to, inFile, outFile) {
  // -threads 1 (antes do -i) força decodificação single-thread, evitando o
  // erro "Resource temporarily unavailable" no FFmpeg.wasm single-thread.
  const T = ['-threads','1'];
  if (to === 'gif')  return [...T,'-i',inFile,'-vf','fps=10,scale=480:-1:flags=lanczos','-loop','0',outFile];
  if (to === 'mp3')  return [...T,'-i',inFile,'-vn','-acodec','libmp3lame','-q:a','2',outFile];
  if (to === 'wav')  return [...T,'-i',inFile,'-vn','-acodec','pcm_s16le',outFile];
  if (to === 'ogg')  return [...T,'-i',inFile,'-vn','-acodec','libvorbis','-q:a','4',outFile];
  if (to === 'aac')  return [...T,'-i',inFile,'-vn','-acodec','aac','-b:a','192k',outFile];
  if (to === 'flac') return [...T,'-i',inFile,'-vn','-acodec','flac',outFile];
  if (to === 'm4a')  return [...T,'-i',inFile,'-vn','-acodec','aac','-movflags','+faststart',outFile];
  if (to === 'mp4')  return [...T,'-i',inFile,'-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',outFile];
  if (to === 'webm') return [...T,'-i',inFile,'-c:v','libvpx','-b:v','1M','-deadline','realtime','-cpu-used','5','-c:a','libvorbis',outFile];
  if (to === 'avi')  return [...T,'-i',inFile,'-c:v','mpeg4','-c:a','libmp3lame',outFile];
  if (to === 'mkv')  return [...T,'-i',inFile,'-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac',outFile];
  if (to === 'mov')  return [...T,'-i',inFile,'-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',outFile];
  return [...T,'-i', inFile, outFile];
}

function convMediaMime(ext) {
  const m = {
    mp3:'audio/mpeg', wav:'audio/wav', ogg:'audio/ogg', aac:'audio/aac', flac:'audio/flac', m4a:'audio/m4a',
    mp4:'video/mp4', webm:'video/webm', avi:'video/x-msvideo', mkv:'video/x-matroska', mov:'video/quicktime', gif:'image/gif'
  };
  return m[ext] || 'application/octet-stream';
}

// ════════════════════════════════════════
//  FONTES — opentype.js
// ════════════════════════════════════════
async function convFont(file, from, to, base) {
  convSetProgress(true, 'carregando', 20, 'Carregando opentype.js...');
  await convLoadScript('https://cdnjs.cloudflare.com/ajax/libs/opentype.js/1.3.4/opentype.min.js', 'opentype');
  const ab   = await file.arrayBuffer();
  convSetProgress(true, 'parseando', 40, 'Lendo fonte...');
  const font = opentype.parse(ab);
  convSetProgress(true, 'convertendo', 65, 'Convertendo...');
  if (to === 'ttf' || to === 'otf') {
    const outBuf = font.toArrayBuffer();
    const mime   = to === 'otf' ? 'font/otf' : 'font/ttf';
    return { blob: new Blob([outBuf], { type: mime }), outName: base + '.' + to };
  }
  if (to === 'woff' || to === 'woff2') {
    const sfntBuf = font.toArrayBuffer();
    if (to === 'woff2') convSetProgress(true, 'aviso', 80, 'WOFF2 encode requer servidor — exportando como WOFF.');
    return { blob: new Blob([convBuildWoff(sfntBuf)], { type:'font/woff' }), outName: base + '.woff' };
  }
  return { blob: new Blob([font.toArrayBuffer()], { type:'font/ttf' }), outName: base + '.ttf' };
}

function convBuildWoff(sfntBuffer) {
  const sfnt = new Uint8Array(sfntBuffer);
  const view = new DataView(sfntBuffer);
  const numTables = view.getUint16(4);
  const woffHeaderSize = 44 + numTables * 20;
  const totalSize = woffHeaderSize + sfnt.byteLength;
  const out  = new ArrayBuffer(totalSize);
  const outV = new DataView(out);
  const outU = new Uint8Array(out);
  outV.setUint32(0,  0x774F4646);
  outV.setUint32(4,  view.getUint32(0));
  outV.setUint32(8,  totalSize);
  outV.setUint16(12, numTables);
  outV.setUint16(14, 0);
  outV.setUint32(16, sfnt.byteLength);
  outV.setUint16(20, 1); outV.setUint16(22, 0);
  outV.setUint32(24, 0); outV.setUint16(28, 0); outV.setUint16(30, 0);
  outV.setUint32(32, 0); outV.setUint32(36, 0);
  let woffOff = 44, dataOff = woffHeaderSize;
  for (let i = 0; i < numTables; i++) {
    const d = 12 + i * 16;
    const tag = view.getUint32(d), ck = view.getUint32(d+4), off = view.getUint32(d+8), len = view.getUint32(d+12);
    outV.setUint32(woffOff,    tag);
    outV.setUint32(woffOff+4,  dataOff);
    outV.setUint32(woffOff+8,  len);
    outV.setUint32(woffOff+12, len);
    outV.setUint32(woffOff+16, ck);
    woffOff += 20;
    outU.set(sfnt.subarray(off, off+len), dataOff);
    dataOff += len;
    while (dataOff % 4 !== 0) outU[dataOff++] = 0;
  }
  return out;
}