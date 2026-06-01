// ════════════════════════════════════════
//  LOREM IPSUM — HTML builder
// ════════════════════════════════════════
function buildLorem() {
    return `
      <label class="flabel">Quantidade de parágrafos</label>
      <div class="frow" style="align-items:center">
        <input class="finput" id="loremCount" type="number" value="3" min="1" max="20" style="margin:0;max-width:100px">
        <button class="fbtn" onclick="genLorem()" style="flex:1">Gerar</button>
      </div>
      <div class="fresult" id="loremRes" style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <label class="flabel" style="margin:0">Resultado</label>
          <button class="copy-btn" id="loremCopy" onclick="copyRaw('loremText','loremCopy')">📋 Copiar</button>
        </div>
        <textarea id="loremText" style="width:100%;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);resize:vertical;min-height:160px;outline:none;" readonly></textarea>
      </div>
    `;
  }
  
  // ════════════════════════════════════════
  //  LOREM IPSUM — Lógica
  // ════════════════════════════════════════
  const loremBase  = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
  const loremExtra = [
    'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
    'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio.',
    'Nullam varius, turpis molestie dictum semper, est augue commodo nisl.',
    'Donec nec justo eget felis facilisis fermentum. Aliquam porttitor mauris sit amet orci.',
    'Aenean dignissim pellentesque felis. Vestibulum commodo felis quis tortor.',
  ];
  
  function genLorem() {
    const n = parseInt(document.getElementById('loremCount').value) || 3;
    let out = '';
    for (let i = 0; i < n; i++) {
      out += (i === 0 ? loremBase : loremExtra[i % loremExtra.length] + ' ' + loremBase) + '\n\n';
    }
    document.getElementById('loremText').value = out.trim();
    document.getElementById('loremRes').classList.add('on');
  }