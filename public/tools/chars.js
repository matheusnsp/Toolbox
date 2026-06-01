// ════════════════════════════════════════
//  CHAR COUNTER — HTML builder
// ════════════════════════════════════════
function buildChars() {
    return `
      <label class="flabel">Cole ou digite seu texto</label>
      <textarea id="charsInput" oninput="countChars()" style="width:100%;background:var(--surface);border:1px solid var(--border2);border-radius:10px;padding:12px 14px;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--text);resize:vertical;min-height:140px;outline:none;margin-bottom:14px;" placeholder="Digite ou cole seu texto aqui..."></textarea>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px" id="charStats">
        ${['Caracteres', 'Palavras', 'Linhas'].map(l => `
          <div style="background:var(--surface);border:1px solid var(--border2);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:24px;font-weight:700;font-family:'JetBrains Mono',monospace" id="stat${l}">0</div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px">${l}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // ════════════════════════════════════════
  //  CHAR COUNTER — Lógica
  // ════════════════════════════════════════
  function countChars() {
    const t = document.getElementById('charsInput').value;
    document.getElementById('statCaracteres').textContent = t.length;
    document.getElementById('statPalavras').textContent   = t.trim() ? t.trim().split(/\s+/).length : 0;
    document.getElementById('statLinhas').textContent     = t ? t.split('\n').length : 0;
  }