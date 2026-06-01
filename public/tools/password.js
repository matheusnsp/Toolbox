// ════════════════════════════════════════
//  PASSWORD — HTML builder
// ════════════════════════════════════════
function buildPass() {
    return `
      <label class="flabel">Comprimento</label>
      <input class="finput" id="passLen" type="range" min="8" max="64" value="16" oninput="document.getElementById('passLenVal').textContent=this.value;genPass()" style="accent-color:var(--purple);margin-bottom:4px">
      <div style="text-align:center;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--purple);margin-bottom:14px"><span id="passLenVal">16</span> caracteres</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        ${[['passUpper','Maiúsculas (A-Z)'],['passLower','Minúsculas (a-z)'],['passNum','Números (0-9)'],['passSym','Símbolos (!@#...)']].map(([id, lbl]) => `
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--text)">
            <input type="checkbox" id="${id}" checked style="accent-color:var(--purple);width:15px;height:15px" onchange="genPass()"> ${lbl}
          </label>
        `).join('')}
      </div>
      <div class="fresult on" id="passRes">
        <div class="fresult-row">
          <div class="fresult-val" id="passVal" style="font-size:15px;letter-spacing:.05em"></div>
          <button class="copy-btn" id="passCopy" onclick="copyVal('passVal','passCopy')">📋</button>
        </div>
      </div>
      <button class="fbtn" onclick="genPass()" style="margin-top:12px">🔄 Nova Senha</button>
    `;
  }
  
  // ════════════════════════════════════════
  //  PASSWORD — Lógica
  // ════════════════════════════════════════
  function genPass() {
    const len = parseInt(document.getElementById('passLen')?.value || 16);
    let chars = '';
    if (document.getElementById('passUpper')?.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (document.getElementById('passLower')?.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (document.getElementById('passNum')?.checked)   chars += '0123456789';
    if (document.getElementById('passSym')?.checked)   chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';
    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
    let pass = '';
    for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    const el = document.getElementById('passVal');
    if (el) el.textContent = pass;
  }