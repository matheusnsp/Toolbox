// ════════════════════════════════════════
//  BASE64 — HTML builder
// ════════════════════════════════════════
function buildB64() {
    return `
      <label class="flabel">Texto</label>
      <textarea id="b64Input" style="width:100%;background:var(--surface);border:1px solid var(--border2);border-radius:10px;padding:12px 14px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text);resize:vertical;min-height:100px;outline:none;margin-bottom:12px;" placeholder="Digite o texto..."></textarea>
      <div class="frow">
        <button class="fbtn" onclick="b64Encode()" style="flex:1">Encode →</button>
        <button class="fbtn" onclick="b64Decode()" style="flex:1;background:var(--surface2);box-shadow:none;border:1px solid var(--border2);color:var(--text)">← Decode</button>
      </div>
      <div class="ferror" id="b64Err"></div>
      <div class="fresult" id="b64Res" style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <label class="flabel" style="margin:0">Resultado</label>
          <button class="copy-btn" id="b64Copy" onclick="copyRaw('b64Output','b64Copy')">📋 Copiar</button>
        </div>
        <textarea id="b64Output" style="width:100%;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--cyan);resize:vertical;min-height:100px;outline:none;" readonly></textarea>
      </div>
    `;
  }
  
  // ════════════════════════════════════════
  //  BASE64 — Lógica
  // ════════════════════════════════════════
  function b64Encode() {
    try {
      const v = btoa(unescape(encodeURIComponent(document.getElementById('b64Input').value)));
      document.getElementById('b64Output').value = v;
      document.getElementById('b64Res').classList.add('on');
      hideFErr('b64Err');
    } catch (e) { showFErr('b64Err', 'Erro ao encodar.'); }
  }
  
  function b64Decode() {
    try {
      const v = decodeURIComponent(escape(atob(document.getElementById('b64Input').value.trim())));
      document.getElementById('b64Output').value = v;
      document.getElementById('b64Res').classList.add('on');
      hideFErr('b64Err');
    } catch (e) { showFErr('b64Err', 'Base64 inválido.'); }
  }