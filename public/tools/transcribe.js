// ════════════════════════════════════════
//  TRANSCRIÇÃO DE ÁUDIO — tools/transcribe.js
//  Converte fala em texto 100% no navegador (Whisper via Transformers.js).
//  Privado: o áudio nunca sai do seu dispositivo.
//  Adicione ao HTML:  <script src="tools/transcribe.js"></script>
// ════════════════════════════════════════

// ── STATE (isolado) ──
const _trx = {
    file: null,
    worker: null,      // Web Worker que roda o Whisper
    lang: 'portuguese',
    lastText: '',
  };
  
  // Modelos disponíveis (do menor/mais rápido ao maior/mais preciso)
  const TRX_MODELS = {
    tiny:  { id:'Xenova/whisper-tiny',  label:'Rápido',  size:'~75 MB'  },
    base:  { id:'Xenova/whisper-base',  label:'Médio',   size:'~145 MB' },
    small: { id:'Xenova/whisper-small', label:'Preciso', size:'~480 MB' },
  };
  let _trxModel = 'base';
  
  const TRX_INPUT = ['mp3','wav','ogg','m4a','aac','flac','opus','webm','mp4','mov','mkv'];
  
  // ════════════════════════════════════════
  //  buildTrx — HTML do modal
  // ════════════════════════════════════════
  function buildTrx() {
    return `
  <style>
    #trxWrap *{ box-sizing:border-box; }
    #trxWrap{ font-family:'IBM Plex Mono', monospace; padding:4px 0 8px; }
  
    /* Drop zone */
    #trxDrop{
      border:1.5px dashed #3a3a40; border-radius:12px;
      padding:40px 24px; text-align:center; cursor:pointer;
      transition:border-color .18s, background .18s;
      background:#18181a; position:relative;
    }
    #trxDrop:hover, #trxDrop.over{ border-color:#7c6af7; background:rgba(124,106,247,.05); }
    #trxDrop input[type=file]{ position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
    #trxDropIcon{ font-size:28px; margin-bottom:10px; }
    #trxDropTitle{ font-size:13px; color:#e8e8ea; margin-bottom:4px; }
    #trxDropSub{ font-size:11px; color:#666670; line-height:1.6; }
  
    /* File bar */
    #trxFileBar{
      display:flex; align-items:center; gap:12px;
      background:#18181a; border:1px solid #2e2e33;
      border-radius:10px; padding:10px 14px; margin-bottom:16px;
    }
    #trxFileIco{ font-size:20px; flex-shrink:0; }
    #trxFileMeta{ flex:1; min-width:0; }
    #trxFileName{
      font-size:12px; font-weight:500; color:#e8e8ea;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px;
    }
    #trxFileSize{ font-size:10px; color:#666670; }
    #trxResetBtn{
      background:none; border:1px solid #3a3a40; color:#666670;
      border-radius:7px; padding:4px 10px; font-size:10px;
      font-family:inherit; cursor:pointer; flex-shrink:0;
      transition:color .15s, border-color .15s;
    }
    #trxResetBtn:hover{ color:#e8e8ea; border-color:#666670; }
  
    .trx-label{
      font-size:9px; font-weight:500; letter-spacing:.14em;
      text-transform:uppercase; color:#666670; margin-bottom:8px;
    }
  
    /* Selects (idioma e modelo) */
    #trxOptsBlock{
      background:#18181a; border:1px solid #2e2e33;
      border-radius:10px; padding:14px; margin-bottom:16px;
    }
    .trx-row{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
    .trx-row:last-child{ margin-bottom:0; }
    .trx-row-label{ font-size:11px; color:#666670; min-width:64px; }
    .trx-row select{
      flex:1; background:#222225; border:1px solid #2e2e33; border-radius:6px;
      color:#e8e8ea; font-family:inherit; font-size:11px; padding:6px 8px;
      outline:none; cursor:pointer;
    }
    .trx-row select:focus{ border-color:#7c6af7; }
  
    /* Botão */
    #trxBtn{
      width:100%; padding:12px; background:#7c6af7; color:#fff;
      border:none; border-radius:10px; font-family:inherit;
      font-size:12px; font-weight:500; letter-spacing:.08em; cursor:pointer;
      transition:opacity .15s, transform .1s;
      display:flex; align-items:center; justify-content:center; gap:8px;
    }
    #trxBtn:hover:not(:disabled){ opacity:.88; }
    #trxBtn:active:not(:disabled){ transform:scale(.99); }
    #trxBtn:disabled{ opacity:.3; cursor:not-allowed; }
    #trxSpin{
      width:13px; height:13px; border:2px solid rgba(255,255,255,.2);
      border-top-color:#fff; border-radius:50%;
      animation:trxSpin .7s linear infinite; display:none;
    }
    #trxSpin.on{ display:block; }
    @keyframes trxSpin{ to{ transform:rotate(360deg); } }
  
    /* Progresso */
    #trxProgress{
      background:#18181a; border:1px solid #2e2e33;
      border-radius:10px; padding:14px; margin-top:14px; display:none;
    }
    #trxProgHead{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
    #trxProgStatus{ font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:#a594fb; }
    #trxProgPct{ font-size:11px; color:#666670; }
    #trxProgTrack{ height:2px; background:#2e2e33; border-radius:2px; overflow:hidden; margin-bottom:7px; }
    #trxProgFill{ height:100%; background:#7c6af7; border-radius:2px; transition:width .25s ease; }
    #trxProgLog{ font-size:10px; color:#666670; }
  
    /* Erro */
    #trxErr{
      background:rgba(248,113,113,.06); border:1px solid rgba(248,113,113,.2);
      border-radius:10px; padding:10px 12px; font-size:11px;
      color:#f87171; margin-top:12px; display:none;
    }
  
    /* Resultado */
    #trxResult{
      background:#18181a; border:1px solid #2e2e33;
      border-radius:10px; padding:14px; margin-top:14px; display:none;
    }
    #trxResultHead{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    #trxResultLbl{ font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:#666670; }
    #trxCopyBtn{
      background:none; border:1px solid #3a3a40; color:#666670;
      border-radius:7px; padding:4px 10px; font-size:10px;
      font-family:inherit; cursor:pointer; transition:color .15s, border-color .15s;
    }
    #trxCopyBtn:hover{ color:#e8e8ea; border-color:#666670; }
    #trxCopyBtn.ok{ color:#34d399; border-color:rgba(52,211,153,.3); }
    #trxText{
      width:100%; min-height:120px; resize:vertical;
      background:#0f0f10; border:1px solid #2e2e33; border-radius:8px;
      color:#e8e8ea; font-family:inherit; font-size:12px; line-height:1.6;
      padding:12px; outline:none;
    }
    #trxText:focus{ border-color:#7c6af7; }
    #trxDownloadLink{
      display:inline-flex; align-items:center; gap:6px; margin-top:10px;
      color:#666670; font-size:10px; font-family:inherit;
      text-decoration:underline; text-underline-offset:3px; cursor:pointer;
    }
    #trxDownloadLink:hover{ color:#e8e8ea; }
  </style>
  
  <div id="trxWrap">
    <!-- STEP 1: drop -->
    <div id="trxStep1">
      <div id="trxDrop">
        <input type="file" id="trxFileInput" accept="audio/*,video/*" onchange="trxOnFileChange(this)">
        <div id="trxDropIcon">🎙️</div>
        <div id="trxDropTitle">Arraste um áudio/vídeo ou clique para selecionar</div>
        <div id="trxDropSub">MP3 · WAV · OGG · M4A · MP4 · WEBM<br>Transcrito no seu navegador, sem enviar pra nenhum servidor</div>
      </div>
    </div>
  
    <!-- STEP 2: opções -->
    <div id="trxStep2" style="display:none">
      <div id="trxFileBar">
        <div id="trxFileIco">🎵</div>
        <div id="trxFileMeta">
          <div id="trxFileName"></div>
          <div id="trxFileSize"></div>
        </div>
        <button id="trxResetBtn" onclick="trxReset()">↩ trocar</button>
      </div>
  
      <div class="trx-label">Configurações</div>
      <div id="trxOptsBlock">
        <div class="trx-row">
          <span class="trx-row-label">Idioma</span>
          <select id="trxLang">
            <option value="portuguese" selected>Português</option>
            <option value="english">Inglês</option>
            <option value="spanish">Espanhol</option>
            <option value="french">Francês</option>
            <option value="german">Alemão</option>
            <option value="italian">Italiano</option>
            <option value="auto">Detectar automaticamente</option>
          </select>
        </div>
        <div class="trx-row">
          <span class="trx-row-label">Modelo</span>
          <select id="trxModelSel" onchange="trxOnModelChange(this)">
            <option value="tiny">Rápido (~75 MB)</option>
            <option value="base" selected>Médio (~145 MB)</option>
            <option value="small">Preciso (~480 MB)</option>
          </select>
        </div>
      </div>
  
      <button id="trxBtn" onclick="trxRun()">
        <span id="trxSpin"></span>
        <span id="trxBtnLabel">🎙️ Transcrever</span>
      </button>
  
      <div id="trxErr"></div>
  
      <div id="trxProgress">
        <div id="trxProgHead">
          <span id="trxProgStatus">processando</span>
          <span id="trxProgPct">0%</span>
        </div>
        <div id="trxProgTrack"><div id="trxProgFill" style="width:0%"></div></div>
        <div id="trxProgLog">Iniciando...</div>
      </div>
  
      <div id="trxResult">
        <div id="trxResultHead">
          <span id="trxResultLbl">Transcrição</span>
          <button id="trxCopyBtn" onclick="trxCopy()">📋 Copiar</button>
        </div>
        <textarea id="trxText" spellcheck="false"></textarea>
        <span id="trxDownloadLink" onclick="trxDownload()">⬇ baixar como .txt</span>
      </div>
    </div>
  </div>`;
  }
  
  // ════════════════════════════════════════
  //  afterTrxOpen
  // ════════════════════════════════════════
  function afterTrxOpen() {
    const drop = document.getElementById('trxDrop');
    if (!drop) return;
    _trx.file = null; _trx.lastText = '';
  
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('over');
      const f = e.dataTransfer.files[0];
      if (f) trxLoadFile(f);
    });
  }
  
  // ════════════════════════════════════════
  //  FILE LOAD
  // ════════════════════════════════════════
  function trxOnFileChange(input) {
    if (input.files[0]) trxLoadFile(input.files[0]);
  }
  
  function trxLoadFile(f) {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!TRX_INPUT.includes(ext) && !f.type.startsWith('audio/') && !f.type.startsWith('video/')) {
      trxShowErr('Formato não suportado. Use um arquivo de áudio ou vídeo.');
      return;
    }
    trxHideErr();
    _trx.file = f;
  
    document.getElementById('trxStep1').style.display = 'none';
    document.getElementById('trxStep2').style.display = 'block';
    document.getElementById('trxProgress').style.display = 'none';
    document.getElementById('trxResult').style.display = 'none';
  
    document.getElementById('trxFileName').textContent = f.name;
    document.getElementById('trxFileSize').textContent = trxFmtBytes(f.size);
  }
  
  function trxOnModelChange(sel) {
    _trxModel = sel.value;
    // O worker detecta a troca de modelo e recarrega automaticamente.
  }
  
  // ════════════════════════════════════════
  //  RUN — transcrever
  // ════════════════════════════════════════
  async function trxRun() {
    if (!_trx.file) return;
    trxHideErr();
    _trx.lang = document.getElementById('trxLang').value;
  
    try {
      // 1) Cria o worker (1x). Toda a inferência pesada roda nele,
      //    mantendo a aba responsiva (não congela mais).
      if (!_trx.worker) {
        _trx.worker = trxCreateWorker();
      }
  
      // 2) Decodifica o áudio para PCM mono 16 kHz na thread principal
      //    (rápido). O trabalho pesado vai pro worker.
      trxSetProgress(true, 'lendo áudio', 8, 'Decodificando áudio...');
      const audio = await trxDecodeAudio(_trx.file);
      const totalSec = audio.length / 16000;
  
      // 3) Prepara a UI de resultado (texto ao vivo)
      document.getElementById('trxResult').style.display = 'block';
      const ta = document.getElementById('trxText');
      ta.value = '';
  
      // 4) Manda pro worker e aguarda o resultado via mensagens
      const result = await new Promise((resolve, reject) => {
        _trx.resolveRun = resolve;
        _trx.rejectRun  = reject;
        let liveText = '';
  
        _trx.worker.onmessage = (e) => {
          const m = e.data;
          switch (m.type) {
            case 'model_progress': {
              const pct = Math.min(60, Math.round(10 + (m.progress / 100) * 50));
              trxSetProgress(true, 'baixando modelo', pct, `${m.file || 'modelo'} — ${Math.round(m.progress)}%`);
              break;
            }
            case 'model_ready':
              trxSetProgress(true, 'transcrevendo', 64, 'Modelo pronto. Transcrevendo...');
              break;
            case 'chunk_start': {
              const pct = Math.min(98, Math.round(64 + (m.start / Math.max(totalSec, 1)) * 34));
              trxSetProgress(true, 'transcrevendo', pct,
                `Processando ${trxFmtTime(m.start)} / ${trxFmtTime(totalSec)}...`);
              break;
            }
            case 'token':
              liveText += m.text;
              ta.value = liveText;
              ta.scrollTop = ta.scrollHeight;
              break;
            case 'done':
              resolve((m.text || liveText).trim());
              break;
            case 'error':
              reject(new Error(m.message || 'Erro no worker.'));
              break;
          }
        };
        _trx.worker.onerror = (err) => reject(new Error(err.message || 'Erro no worker.'));
  
        // transfere o buffer do áudio (zero-copy) pro worker
        _trx.worker.postMessage({
          type: 'transcribe',
          audio,
          model: TRX_MODELS[_trxModel].id,
          modelSize: TRX_MODELS[_trxModel].size,
          lang: _trx.lang,
        }, [audio.buffer]);
  
        trxSetProgress(true, 'carregando', 10,
          totalSec > 1800
            ? `Áudio longo (${Math.round(totalSec/60)} min). Vai levar um tempo...`
            : 'Carregando modelo...');
      });
  
      trxSetProgress(true, 'concluído', 100, 'Pronto!');
      await new Promise(r => setTimeout(r, 300));
  
      _trx.lastText = result;
      ta.value = result || '(nenhuma fala detectada)';
      trxSetProgress(false);  // para o spinner e reativa o botão
      document.getElementById('trxProgress').style.display = 'none';
      document.getElementById('trxResult').style.display = 'block';
    } catch (err) {
      trxSetProgress(false);
      let msg = err.message || 'Erro na transcrição.';
      if (/import|module|fetch|network/i.test(msg)) {
        msg = 'Falha ao carregar o modelo. Verifique sua conexão (a 1ª vez baixa o modelo).';
      }
      trxShowErr(msg);
    }
  }
  
  // ════════════════════════════════════════
  //  WEB WORKER — roda o Whisper sem travar a página
  // ════════════════════════════════════════
  function trxCreateWorker() {
    const workerCode = `
      let pipe = null;
      let loadedModel = null;
      let WhisperTextStreamer = null;
  
      self.onmessage = async (e) => {
        const m = e.data;
        if (m.type !== 'transcribe') return;
        try {
          const mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2');
          const { pipeline, env } = mod;
          WhisperTextStreamer = mod.WhisperTextStreamer;
          env.allowRemoteModels = true;
  
          // (re)carrega o modelo se mudou
          if (!pipe || loadedModel !== m.model) {
            pipe = await pipeline('automatic-speech-recognition', m.model, {
              progress_callback: (p) => {
                if (p.status === 'progress' && p.progress != null) {
                  self.postMessage({ type:'model_progress', progress:p.progress, file:p.file });
                }
              },
            });
            loadedModel = m.model;
          }
          self.postMessage({ type:'model_ready' });
  
          const opts = {
            chunk_length_s: 30,
            stride_length_s: 5,
            // ── Anti-repetição / anti-alucinação ──
            // no_repeat_ngram_size: impede repetir a mesma sequência de 3 tokens
            // (corta o loop "o que é o que é...").
            no_repeat_ngram_size: 3,
            repetition_penalty: 1.2,
            // temperatura em escala: se um trecho sair muito repetitivo
            // (compression_ratio alto), refaz com mais aleatoriedade.
            temperature: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
            compression_ratio_threshold: 1.35,
            // descarta trechos sem fala em vez de alucinar
            no_speech_threshold: 0.6,
            logprob_threshold: -1.0,
            condition_on_previous_text: false,
          };
          if (m.lang && m.lang !== 'auto') { opts.language = m.lang; opts.task = 'transcribe'; }
  
          if (WhisperTextStreamer && pipe.tokenizer) {
            opts.streamer = new WhisperTextStreamer(pipe.tokenizer, {
              on_chunk_start: (start) => self.postMessage({ type:'chunk_start', start }),
              callback_function: (text) => self.postMessage({ type:'token', text }),
            });
          }
  
          const out = await pipe(m.audio, opts);
          let finalText = out && out.text ? out.text : '';
          // rede de segurança: colapsa repetições absurdas que escaparem
          finalText = trxCollapseRepeats(finalText);
          self.postMessage({ type:'done', text: finalText });
        } catch (err) {
          self.postMessage({ type:'error', message: (err && err.message) || String(err) });
        }
      };
  
      // Colapsa palavras/frases repetidas em excesso (ex: "o que é o que é...")
      // Abordagem por tokens (robusta a acentos, ao contrário de \\w).
      function trxCollapseRepeats(text) {
        if (!text) return text;
        const words = text.split(/\\s+/).filter(Boolean);
        if (words.length < 8) return text;
  
        // remove repetição de frases de tamanho 1..6 palavras
        for (let size = 6; size >= 1; size--) {
          const out = [];
          let i = 0;
          while (i < words.length) {
            const phrase = words.slice(i, i + size).join(' ').toLowerCase();
            let reps = 1;
            while (
              i + (reps + 1) * size <= words.length &&
              words.slice(i + reps * size, i + (reps + 1) * size).join(' ').toLowerCase() === phrase
            ) reps++;
            // se a frase se repetiu 3+ vezes, mantém só 1
            const keep = reps >= 3 ? 1 : reps;
            for (let k = 0; k < keep * size; k++) out.push(words[i + k]);
            i += reps * size;
          }
          words.length = 0;
          words.push(...out);
        }
        return words.join(' ').replace(/\\s{2,}/g, ' ').trim();
      }
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob), { type: 'module' });
  }
  
  
  // ── Decodifica qualquer áudio/vídeo → Float32 mono 16kHz ──
  async function trxDecodeAudio(file) {
    const arrayBuf = await file.arrayBuffer();
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC({ sampleRate: 16000 });
    let decoded;
    try {
      decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
    } catch {
      await ctx.close();
      throw new Error('Não foi possível decodificar este áudio. Tente converter para MP3 ou WAV primeiro.');
    }
  
    // mistura para mono
    let pcm;
    if (decoded.numberOfChannels === 1) {
      pcm = decoded.getChannelData(0);
    } else {
      const a = decoded.getChannelData(0);
      const b = decoded.getChannelData(1);
      pcm = new Float32Array(a.length);
      for (let i = 0; i < a.length; i++) pcm[i] = (a[i] + b[i]) / 2;
    }
  
    // resample para 16 kHz se necessário
    if (decoded.sampleRate !== 16000) {
      pcm = trxResample(pcm, decoded.sampleRate, 16000);
    }
    await ctx.close();
    return pcm;
  }
  
  // resample linear simples
  function trxResample(input, fromRate, toRate) {
    if (fromRate === toRate) return input;
    const ratio = fromRate / toRate;
    const newLen = Math.round(input.length / ratio);
    const out = new Float32Array(newLen);
    for (let i = 0; i < newLen; i++) {
      const idx = i * ratio;
      const i0 = Math.floor(idx);
      const i1 = Math.min(i0 + 1, input.length - 1);
      const frac = idx - i0;
      out[i] = input[i0] * (1 - frac) + input[i1] * frac;
    }
    return out;
  }
  
  // ════════════════════════════════════════
  //  COPIAR / BAIXAR / RESET / UTILS
  // ════════════════════════════════════════
  function trxCopy() {
    const txt = document.getElementById('trxText').value;
    navigator.clipboard.writeText(txt).then(() => {
      const b = document.getElementById('trxCopyBtn');
      b.classList.add('ok'); b.textContent = '✅ Copiado';
      setTimeout(() => { b.classList.remove('ok'); b.textContent = '📋 Copiar'; }, 2000);
    });
  }
  
  function trxDownload() {
    const txt = document.getElementById('trxText').value;
    const base = (_trx.file?.name || 'transcricao').replace(/\.[^.]+$/, '');
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = base + '.txt';
    a.click();
  }
  
  function trxReset() {
    _trx.file = null; _trx.lastText = '';
    const fi = document.getElementById('trxFileInput');
    if (fi) fi.value = '';
    document.getElementById('trxStep1').style.display = 'block';
    document.getElementById('trxStep2').style.display = 'none';
    document.getElementById('trxProgress').style.display = 'none';
    document.getElementById('trxResult').style.display = 'none';
    trxHideErr();
  }
  
  function trxSetProgress(show, status, pct, log) {
    const pb = document.getElementById('trxProgress');
    const btn = document.getElementById('trxBtn');
    const spin = document.getElementById('trxSpin');
    if (!pb) return;
    pb.style.display = show ? 'block' : 'none';
    if (btn) btn.disabled = show;
    if (spin) show ? spin.classList.add('on') : spin.classList.remove('on');
    if (status) document.getElementById('trxProgStatus').textContent = status;
    if (pct !== undefined) {
      document.getElementById('trxProgPct').textContent = pct + '%';
      document.getElementById('trxProgFill').style.width = pct + '%';
    }
    if (log) document.getElementById('trxProgLog').textContent = log;
  }
  
  function trxShowErr(msg) {
    const e = document.getElementById('trxErr');
    if (e) { e.textContent = '⚠ ' + msg; e.style.display = 'block'; }
  }
  function trxHideErr() {
    const e = document.getElementById('trxErr');
    if (e) e.style.display = 'none';
  }
  function trxFmtBytes(n) {
    if (n < 1024)    return n + ' B';
    if (n < 1048576) return (n/1024).toFixed(1) + ' KB';
    return (n/1048576).toFixed(2) + ' MB';
  }
  function trxFmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }