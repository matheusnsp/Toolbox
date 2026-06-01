// ════════════════════════════════════════
//  QR CODE — HTML builder
// ════════════════════════════════════════
function buildQr() {
    return `
      <label class="flabel">Texto ou URL</label>
      <input class="finput" id="qrInput" placeholder="https://exemplo.com ou qualquer texto..." oninput="qrPreview()">
      <div style="text-align:center;margin-top:4px">
        <canvas id="qrCanvas" width="220" height="220" style="border-radius:12px;background:#fff;padding:12px;display:none"></canvas>
        <div id="qrPlaceholder" style="width:220px;height:220px;background:var(--surface);border:1px solid var(--border2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px;margin:0 auto">Digite algo acima</div>
      </div>
      <button class="fbtn" id="qrDlBtn" onclick="qrDownload()" style="margin-top:16px;display:none">⬇ Baixar QR Code</button>
    `;
  }
  
  // ════════════════════════════════════════
  //  QR CODE — Lógica
  // ════════════════════════════════════════
  function qrPreview() {
    const txt    = document.getElementById('qrInput').value.trim();
    const canvas = document.getElementById('qrCanvas');
    const ph     = document.getElementById('qrPlaceholder');
    const btn    = document.getElementById('qrDlBtn');
    if (!txt) {
      canvas.style.display = 'none';
      ph.style.display     = '';
      btn.style.display    = 'none';
      return;
    }
    canvas.style.display = '';
    ph.style.display     = 'none';
    btn.style.display    = 'flex';
    drawQR(canvas, txt);
  }
  
  function drawQR(canvas, text) {
    const size = 220;
    const ctx  = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { ctx.drawImage(img, 0, 0, size, size); };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}&bgcolor=ffffff&color=000000&margin=10`;
  }
  
  function qrDownload() {
    const canvas = document.getElementById('qrCanvas');
    const a      = document.createElement('a');
    a.download = 'qrcode.png';
    a.href     = canvas.toDataURL();
    a.click();
  }