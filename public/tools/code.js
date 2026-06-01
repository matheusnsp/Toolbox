// ════════════════════════════════════════
//  CODE FORMATTER — HTML builder
// ════════════════════════════════════════

// CDNs necessários no <head> do index.html:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/prettier/3.3.3/standalone.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/prettier/3.3.3/plugins/babel.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/prettier/3.3.3/plugins/html.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/prettier/3.3.3/plugins/postcss.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/prettier/3.3.3/plugins/typescript.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/prettier/3.3.3/plugins/markdown.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js"></script>
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/atom-one-dark.min.css">

const CODE_LANGS = [
  { id: 'json',     label: 'JSON',       prettier: 'json',       hljs: 'json'       },
  { id: 'js',       label: 'JavaScript', prettier: 'babel',      hljs: 'javascript' },
  { id: 'ts',       label: 'TypeScript', prettier: 'typescript', hljs: 'typescript' },
  { id: 'jsx',      label: 'JSX',        prettier: 'babel',      hljs: 'javascript' },
  { id: 'tsx',      label: 'TSX (React)',prettier: 'typescript', hljs: 'typescript' },
  { id: 'html',     label: 'HTML',       prettier: 'html',       hljs: 'html'       },
  { id: 'css',      label: 'CSS',        prettier: 'css',        hljs: 'css'        },
  { id: 'scss',     label: 'SCSS',       prettier: 'css',        hljs: 'scss'       },
  { id: 'markdown', label: 'Markdown',   prettier: 'markdown',   hljs: 'markdown'   },
  { id: 'python',   label: 'Python',     prettier: null,         hljs: 'python'     },
  { id: 'sql',      label: 'SQL',        prettier: null,         hljs: 'sql'        },
  { id: 'xml',      label: 'XML',        prettier: null,         hljs: 'xml'        },
  { id: 'yaml',     label: 'YAML',       prettier: null,         hljs: 'yaml'       },
  { id: 'bash',     label: 'Bash',       prettier: null,         hljs: 'bash'       },
  { id: 'java',     label: 'Java',       prettier: null,         hljs: 'java'       },
  { id: 'php',      label: 'PHP',        prettier: null,         hljs: 'php'        },
  { id: 'go',       label: 'Go',         prettier: null,         hljs: 'go'         },
  { id: 'rust',     label: 'Rust',       prettier: null,         hljs: 'rust'       },
  { id: 'cpp',      label: 'C++',        prettier: null,         hljs: 'cpp'        },
];

let _codeLang = CODE_LANGS[0];
let _codeRaw  = '';

function buildCode() {
  return `
    <div style="margin-bottom:14px">
      <label class="flabel">Linguagem</label>
      <div id="codeLangRow" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
    </div>

    <label class="flabel">Cole seu código</label>
    <textarea id="codeInput" class="finput" style="resize:vertical;min-height:130px;font-size:12px;"
      placeholder="Cole qualquer código aqui..."></textarea>

    <div class="frow">
      <button class="fbtn" onclick="doFormatCode()" style="flex:2">
        <span id="codeBtnSpinner" class="spin"></span>
        ✦ Formatar
      </button>
      <button class="fbtn" onclick="doMinifyCode()"
        style="flex:1;background:var(--surface2);box-shadow:none;border:1px solid var(--border2);color:var(--text)">
        Minificar
      </button>
      <button class="fbtn" onclick="doClearCode()"
        style="flex:0 0 44px;background:var(--surface2);box-shadow:none;border:1px solid var(--border2);color:var(--muted);padding:0">
        🗑
      </button>
    </div>

    <div class="ferror" id="codeErr"></div>

    <div class="fresult" id="codeRes" style="padding:0;overflow:hidden">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border)">
        <label class="flabel" style="margin:0">Resultado</label>
        <div style="display:flex;align-items:center;gap:8px">
          <span id="codeInfo" style="font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--muted)"></span>
          <button class="copy-btn" id="codeCopyBtn" onclick="doCopyCode()">📋 Copiar</button>
        </div>
      </div>
      <pre style="margin:0;background:#282c34;max-height:360px;overflow:auto;border-radius:0 0 12px 12px">
        <code id="codeOutput" style="font-family:'JetBrains Mono',monospace;font-size:11px;padding:14px;display:block"></code>
      </pre>
    </div>
  `;
}

// chamado após injetar o HTML no modal
function afterCodeOpen() {
  _codeLang = CODE_LANGS[0];
  _codeRaw  = '';
  const row = document.getElementById('codeLangRow');
  if (!row) return;
  row.innerHTML = '';
  CODE_LANGS.forEach(l => {
    const b = document.createElement('button');
    b.textContent  = l.label;
    b.className    = 'copy-btn';
    b.style.cssText = 'font-size:11px;padding:4px 10px;border-radius:20px;white-space:nowrap;' +
                      (l.id === _codeLang.id ? 'background:var(--purple);color:#fff;border-color:var(--purple)' : '');
    b.onclick = () => {
      _codeLang = l;
      row.querySelectorAll('button').forEach(x => {
        x.style.background  = '';
        x.style.color       = '';
        x.style.borderColor = '';
      });
      b.style.background  = 'var(--purple)';
      b.style.color       = '#fff';
      b.style.borderColor = 'var(--purple)';
    };
    row.appendChild(b);
  });
}

// ── helpers ──────────────────────────────
function _codeGetPlugins() {
  const p = window.prettierPlugins || {};
  return [p.babel, p.html, p.postcss, p.typescript, p.markdown].filter(Boolean);
}

function _codeShowResult(code) {
  _codeRaw = code;
  const el = document.getElementById('codeOutput');
  el.textContent = code;
  if (window.hljs) {
    el.className = 'language-' + _codeLang.hljs;
    hljs.highlightElement(el);
  }
  document.getElementById('codeRes').classList.add('on');
  const lines = code.split('\n').length;
  document.getElementById('codeInfo').textContent = lines + ' linhas · ' + code.length + ' chars';
}

function _codeBasicIndent(code) {
  let indent = 0;
  return code.split('\n').map(line => {
    const t = line.trim();
    if (!t) return '';
    const opens  = (t.match(/[\{\(\[]/g) || []).length;
    const closes = (t.match(/[\}\)\]]/g) || []).length;
    if (closes > opens) indent = Math.max(0, indent - (closes - opens));
    const out = '  '.repeat(indent) + t;
    if (opens > closes) indent += (opens - closes);
    return out;
  }).join('\n');
}

function _codeSqlFormat(sql) {
  const kw = ['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','ON',
    'GROUP BY','ORDER BY','HAVING','LIMIT','INSERT INTO','VALUES','UPDATE','SET',
    'DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','AND','OR','NOT','IN',
    'BETWEEN','LIKE','IS NULL','IS NOT NULL','UNION','UNION ALL','WITH','AS','DISTINCT'];
  let r = sql.replace(/\s+/g, ' ').trim();
  kw.forEach(k => { r = r.replace(new RegExp('\\b' + k + '\\b', 'gi'), '\n' + k.toUpperCase()); });
  return r.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

// ── actions ──────────────────────────────
async function doFormatCode() {
  const input = document.getElementById('codeInput').value.trim();
  if (!input) return;
  hideFErr('codeErr');

  const spin = document.getElementById('codeBtnSpinner');
  if (spin) spin.classList.add('on');

  try {
    let result = input;

    if (_codeLang.id === 'json') {
      result = JSON.stringify(JSON.parse(input), null, 2);

    } else if (_codeLang.prettier && window.prettier) {
      result = await prettier.format(input, {
        parser:   _codeLang.prettier,
        plugins:  _codeGetPlugins(),
        tabWidth: 2,
        semi:     true,
        singleQuote: false,
      });

    } else if (_codeLang.id === 'sql') {
      result = _codeSqlFormat(input);

    } else {
      result = _codeBasicIndent(input);
    }

    _codeShowResult(result);
  } catch (e) {
    showFErr('codeErr', 'Erro ao formatar: ' + e.message);
  } finally {
    if (spin) spin.classList.remove('on');
  }
}

function doMinifyCode() {
  const input = document.getElementById('codeInput').value.trim();
  if (!input) return;
  hideFErr('codeErr');
  try {
    let result;
    if (_codeLang.id === 'json') {
      result = JSON.stringify(JSON.parse(input));
    } else {
      result = input
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    _codeShowResult(result);
  } catch (e) {
    showFErr('codeErr', 'Erro ao minificar: ' + e.message);
  }
}

function doClearCode() {
  document.getElementById('codeInput').value = '';
  document.getElementById('codeRes').classList.remove('on');
  hideFErr('codeErr');
}

function doCopyCode() {
  navigator.clipboard.writeText(_codeRaw).then(() => {
    const b = document.getElementById('codeCopyBtn');
    b.classList.add('ok');
    b.textContent = '✅ Copiado';
    setTimeout(() => { b.classList.remove('ok'); b.innerHTML = '📋 Copiar'; }, 2000);
  });
}