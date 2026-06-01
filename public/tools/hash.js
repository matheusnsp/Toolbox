// ════════════════════════════════════════
//  HASH — HTML builder
// ════════════════════════════════════════
function buildHash() {
    return `
      <label class="flabel">Texto para gerar hash</label>
      <textarea id="hashInput" oninput="genHash()" style="width:100%;background:var(--surface);border:1px solid var(--border2);border-radius:10px;padding:12px 14px;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--text);resize:vertical;min-height:80px;outline:none;margin-bottom:14px;" placeholder="Digite qualquer texto..."></textarea>
      <div style="display:flex;flex-direction:column;gap:10px" id="hashResults">
        ${['MD5 (simulado)', 'SHA-1', 'SHA-256', 'SHA-512'].map(a => `
          <div style="background:var(--surface);border:1px solid var(--border2);border-radius:10px;padding:12px 14px">
            <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px">${a}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--cyan);word-break:break-all" id="hash${a.replace(/[^a-z0-9]/gi, '_')}">—</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // ════════════════════════════════════════
  //  HASH — Lógica
  // ════════════════════════════════════════
  async function genHash() {
    const txt = document.getElementById('hashInput').value;
    if (!txt) {
      ['MD5__simulado_', 'SHA_1', 'SHA_256', 'SHA_512'].forEach(k => {
        const el = document.getElementById('hash' + k);
        if (el) el.textContent = '—';
      });
      return;
    }
    const enc  = new TextEncoder();
    const data = enc.encode(txt);
  
    const sha1   = await crypto.subtle.digest('SHA-1', data);   setHash('SHA_1', sha1);
    const sha256 = await crypto.subtle.digest('SHA-256', data); setHash('SHA_256', sha256);
    const sha512 = await crypto.subtle.digest('SHA-512', data); setHash('SHA_512', sha512);
  
    const elMd5 = document.getElementById('hashMD5__simulado_');
    if (elMd5) elMd5.textContent = '(MD5 não suportado nativamente no browser)';
  }
  
  function setHash(id, buf) {
    const el = document.getElementById('hash' + id);
    if (el) el.textContent = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }