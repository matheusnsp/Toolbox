const express = require('express');
const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.set('trust proxy', true); // detecta https/host reais atrás de proxy (hospedagem)
app.use(cors());
app.use(express.json());

// ── Headers de isolamento (opcionais) ──
// A versão single-thread do FFmpeg.wasm NÃO exige SharedArrayBuffer,
// portanto NÃO usamos Cross-Origin-Embedder-Policy: require-corp,
// que bloquearia o carregamento dos cores/libs vindos das CDNs.
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders(res, filePath) {
    // Content-Type correto para os arquivos do FFmpeg servidos localmente,
    // senão o import() de módulo / instanciação do wasm falha.
    if (filePath.endsWith('.wasm')) res.setHeader('Content-Type', 'application/wasm');
    else if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'text/javascript');
  }
}));

const DOWNLOAD_DIR = path.join(__dirname, 'public', 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

// Caminhos dos binários. O build.sh baixa ffmpeg e yt-dlp para ./bin.
// Se existirem lá, usa-os; senão cai pro PATH do sistema (ambiente local).
const LOCAL_BIN = path.join(__dirname, 'bin');
const YTDLP  = process.env.YTDLP_PATH ||
  (fs.existsSync(path.join(LOCAL_BIN, 'yt-dlp')) ? path.join(LOCAL_BIN, 'yt-dlp') : 'yt-dlp');
const FFMPEG = process.env.FFMPEG_PATH ||
  (fs.existsSync(path.join(LOCAL_BIN, 'ffmpeg')) ? path.join(LOCAL_BIN, 'ffmpeg') : 'ffmpeg');

function cleanOldFiles() {
  const now = Date.now();
  try {
    fs.readdirSync(DOWNLOAD_DIR).forEach(f => {
      const fp = path.join(DOWNLOAD_DIR, f);
      try { if (now - fs.statSync(fp).mtimeMs > 10 * 60 * 1000) fs.unlinkSync(fp); } catch {}
    });
  } catch {}
}
setInterval(cleanOldFiles, 5 * 60 * 1000);

// ── ENCURTADOR PRÓPRIO ──
const urlMap = {}; // { code: originalUrl }

function randomCode(len = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

app.post('/api/shorten', (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith('http')) return res.status(400).json({ error: 'URL inválida.' });
  let code = randomCode();
  while (urlMap[code]) code = randomCode(); // garante único
  urlMap[code] = url;

  // Monta o link curto com o domínio real de quem acessou (funciona tanto em
  // localhost quanto no domínio publicado). Respeita proxy reverso (x-forwarded-*).
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
  const host  = req.headers['x-forwarded-host'] || req.get('host');
  res.json({ short: `${proto}://${host}/r/${code}` });
});

app.get('/r/:code', (req, res) => {
  const dest = urlMap[req.params.code];
  if (!dest) return res.status(404).send('Link não encontrado.');
  res.redirect(dest);
});

// ── INFO ──
app.post('/api/info', (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes('youtube'))
    return res.status(400).json({ error: 'URL inválida. Cole um link do YouTube.' });

  const args = [
    '--dump-single-json', '--no-warnings', '--no-playlist',
    '--skip-download', '--flat-playlist',
    '--extractor-args', 'youtube:skip=dash,hls', url
  ];

  execFile(YTDLP, args, { timeout: 20000 }, (err, stdout, stderr) => {
    if (err) return res.status(400).json({ error: 'Não foi possível acessar o vídeo.' });
    try {
      const info = JSON.parse(stdout);
      const formats = info.formats || [];
      const heights = [...new Set(
        formats.filter(f => f.vcodec && f.vcodec !== 'none' && f.height).map(f => f.height)
      )].sort((a, b) => b - a).slice(0, 7);
      res.json({
        title: info.title, thumbnail: info.thumbnail,
        duration: info.duration, uploader: info.uploader,
        view_count: info.view_count,
        heights: heights.length ? heights : [1080, 720, 480, 360]
      });
    } catch { res.status(500).json({ error: 'Erro ao processar informações.' }); }
  });
});

// ── DOWNLOAD (SSE) ──
app.get('/api/download', (req, res) => {
  const { url, format, quality } = req.query;
  if (!url) return res.status(400).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = obj => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  const ts = Date.now();
  const isAudio = format === 'mp3';
  const outTpl = path.join(DOWNLOAD_DIR, `%(title).60s_${ts}.%(ext)s`);

  let args;
  if (isAudio) {
    args = [
      '--no-playlist', '--no-warnings', '-x',
      '--audio-format', 'mp3', '--audio-quality', '0',
      '--concurrent-fragments', '8', '--buffer-size', '16K',
      '--ffmpeg-location', FFMPEG, '-o', outTpl,
      '--print', 'after_move:filepath', url
    ];
  } else {
    const h = quality || 'best';
    const fmt = h === 'best'
      ? 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
      : `bestvideo[height<=${h}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${h}]+bestaudio/best[height<=${h}]`;
    args = [
      '--no-playlist', '--no-warnings', '-f', fmt,
      '--merge-output-format', 'mp4',
      '--concurrent-fragments', '8', '--buffer-size', '16K',
      '--ffmpeg-location', FFMPEG, '-o', outTpl,
      '--print', 'after_move:filepath', url
    ];
  }

  const proc = spawn(YTDLP, args);
  let filePath = null;

  proc.stdout.on('data', d => {
    d.toString().split('\n').filter(Boolean).forEach(line => {
      if (/^\/.*\.(mp3|mp4|m4a|webm|mkv)$/.test(line.trim())) filePath = line.trim();
      send({ type: 'log', line });
    });
  });

  proc.stderr.on('data', d => {
    d.toString().split('\n').filter(Boolean).forEach(line => {
      const m = line.match(/\[download\]\s+([\d.]+)%/);
      if (m) send({ type: 'progress', percent: parseFloat(m[1]) });
      else send({ type: 'log', line });
    });
  });

  proc.on('close', code => {
    if (code === 0) {
      if (!filePath) {
        const files = fs.readdirSync(DOWNLOAD_DIR)
          .map(f => ({ name: f, time: fs.statSync(path.join(DOWNLOAD_DIR, f)).mtime.getTime() }))
          .sort((a, b) => b.time - a.time);
        if (files.length) filePath = path.join(DOWNLOAD_DIR, files[0].name);
      }
      if (filePath && fs.existsSync(filePath)) {
        const filename = path.basename(filePath);
        send({ type: 'done', filename, url: `/downloads/${encodeURIComponent(filename)}` });
      } else {
        send({ type: 'error', message: 'Arquivo não encontrado após download.' });
      }
    } else {
      send({ type: 'error', message: 'Falha no download. Tente novamente.' });
    }
    res.end();
  });

  req.on('close', () => proc.kill());
});

const PORT = process.env.PORT || 3737;
app.listen(PORT, () => console.log(`\n🎬 Toolbox rodando em http://localhost:${PORT}\n`));