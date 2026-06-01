// ════════════════════════════════════════
//  setup-ffmpeg.js
//  Baixa os arquivos UMD do FFmpeg.wasm para servir LOCALMENTE.
//  Rode UMA vez:   node setup-ffmpeg.js
//
//  Resolve o erro "Failed to construct 'Worker' ... cannot be accessed
//  from origin localhost": o worker do FFmpeg (814.ffmpeg.js) só funciona
//  servido do MESMO domínio. Aqui baixamos tudo para public/ffmpeg/.
// ════════════════════════════════════════
const fs    = require('fs');
const path  = require('path');
const https = require('https');

const FF_VER   = '0.12.10';
const UTIL_VER = '0.12.1';
const CORE_VER = '0.12.6';

const OUT = path.join(__dirname, 'public', 'ffmpeg');
fs.mkdirSync(OUT, { recursive: true });

// [url, nomeLocal]
const FILES = [
  // @ffmpeg/ffmpeg UMD — o ffmpeg.js e o chunk do worker (814.ffmpeg.js)
  [`https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@${FF_VER}/dist/umd/ffmpeg.js`,        'ffmpeg.js'],
  [`https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@${FF_VER}/dist/umd/814.ffmpeg.js`,    '814.ffmpeg.js'],
  // @ffmpeg/util UMD
  [`https://cdn.jsdelivr.net/npm/@ffmpeg/util@${UTIL_VER}/dist/umd/index.js`,         'util.js'],
  // @ffmpeg/core UMD — o núcleo pesado (~30 MB)
  [`https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VER}/dist/umd/ffmpeg-core.js`,   'ffmpeg-core.js'],
  [`https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VER}/dist/umd/ffmpeg-core.wasm`, 'ffmpeg-core.wasm'],
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); try { fs.unlinkSync(dest); } catch {}
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close(); try { fs.unlinkSync(dest); } catch {}
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => { try { fs.unlinkSync(dest); } catch {} reject(err); });
  });
}

(async () => {
  console.log('\nBaixando FFmpeg.wasm (UMD) para public/ffmpeg/ ...\n');
  let ok = 0;
  for (const [url, name] of FILES) {
    process.stdout.write(`  ${name} ... `);
    try {
      await download(url, path.join(OUT, name));
      const kb = (fs.statSync(path.join(OUT, name)).size / 1024).toFixed(0);
      console.log(`ok (${kb} KB)`);
      ok++;
    } catch (e) {
      console.log(`FALHOU: ${e.message}`);
    }
  }
  console.log(`\n${ok}/${FILES.length} arquivos baixados.`);
  if (ok === FILES.length) {
    console.log('Pronto! Reinicie o servidor (node server.js) e teste o conversor.\n');
  } else {
    console.log('Alguns arquivos falharam — verifique sua conexao e rode de novo.\n');
  }
})();