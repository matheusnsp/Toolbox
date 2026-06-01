// ════════════════════════════════════════
//  DATA — Lista de ferramentas
// ════════════════════════════════════════
const tools = [
    { id:'yt',    ico:'🎬', name:'Download YouTube',      desc:'Baixe vídeos MP4 ou áudio MP3',          color:'tc-purple', cat:'media',  action:true },
    { id:'short', ico:'🔗', name:'Encurtador de Links',   desc:'Crie URLs curtas instantaneamente',       color:'tc-blue',   cat:'links',  action:true },
    { id:'qr',    ico:'📱', name:'Gerador de QR Code',    desc:'Gere QR Codes de qualquer URL ou texto', color:'tc-cyan',   cat:'utils',  action:true },
    { id:'conv',  ico:'🔄', name:'Conversor de Arquivos', desc:'Imagens, vídeo, áudio, docs, fontes e dados', color:'tc-green',  cat:'files',  action:true },
    { id:'lorem', ico:'📝', name:'Gerador de Lorem Ipsum',desc:'Gere texto de preenchimento',             color:'tc-orange', cat:'utils',  action:true },
    { id:'chars', ico:'🔢', name:'Contador de Caracteres',desc:'Conte caracteres, palavras e linhas',     color:'tc-pink',   cat:'utils',  action:true },
    { id:'code',  ico:'<>', name:'Formatador de Código',   desc:'Formate JSON, JS, TS, React, Python e mais', color:'tc-yellow', cat:'files',  action:true },
    { id:'b64',   ico:'🔐', name:'Base64',                desc:'Encode e decode em Base64',               color:'tc-red',    cat:'utils',  action:true },
    { id:'img',   ico:'🖼️', name:'Otimizador de Imagem',  desc:'Reduza o tamanho de imagens',            color:'tc-cyan',   cat:'media',  action:true   },
    { id:'audio', ico:'🎙️', name:'Transcrição de Áudio',  desc:'Converta fala em texto no seu navegador', color:'tc-purple', cat:'media',  action:true },    { id:'pass',  ico:'🔑', name:'Gerador de Senha',      desc:'Crie senhas seguras e aleatórias',        color:'tc-green',  cat:'utils',  action:true },
    { id:'hash',  ico:'#',  name:'Gerador de Hash',       desc:'MD5, SHA1, SHA256 de qualquer texto',     color:'tc-orange', cat:'utils',  action:true },
  ];
  
  let activeCat = 'all';
  
  // ════════════════════════════════════════
  //  GRID
  // ════════════════════════════════════════
  function renderGrid(list) {
    const g = document.getElementById('toolGrid');
    g.innerHTML = list.map(t => `
      <div class="tool-card ${t.color} ${t.soon ? 'soon' : ''}" onclick="${t.soon ? '' : `openModal('${t.id}')`}">
        <div class="tool-header">
          <div class="tool-icon">${t.ico}</div>
          <div class="tool-name">${t.name}</div>
        </div>
        <div class="tool-desc">${t.desc}</div>
        ${t.soon
          ? '<span class="soon-badge">Em breve</span>'
          : `<span class="tool-tag">${catLabel(t.cat)}</span>`}
      </div>
    `).join('');
  }
  
  function catLabel(c) {
    return { media:'Mídia', links:'Links', files:'Arquivos', utils:'Utilidades' }[c] || c;
  }
  
  // ════════════════════════════════════════
  //  FILTROS
  // ════════════════════════════════════════
  function filterCat(cat) {
    activeCat = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('on', b.dataset.cat === cat));
    applyFilter();
  }
  
  function filterTools() {
    applyFilter();
    const q      = document.getElementById('searchInput').value.trim();
    const hasSrch = q.length > 0;
    document.getElementById('featuredSection').style.display = hasSrch ? 'none' : '';
    document.getElementById('catTabs').style.display         = hasSrch ? 'none' : '';
  }
  
  function applyFilter() {
    const q    = document.getElementById('searchInput').value.toLowerCase();
    const list = tools.filter(t =>
      (activeCat === 'all' || t.cat === activeCat) &&
      (!q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))
    );
    renderGrid(list);
  }
  
  // ════════════════════════════════════════
  //  MODAL
  // ════════════════════════════════════════
  function openModal(id) {
    const t = tools.find(x => x.id === id);
    if (!t || t.soon) return;
    document.getElementById('modalIco').textContent   = t.ico;
    document.getElementById('modalTitle').textContent = t.name;
    document.getElementById('modalBody').innerHTML    = buildModalContent(id);
    document.getElementById('overlay').classList.add('on');
    document.body.style.overflow = 'hidden';
    afterModalOpen(id);
  }
  
  function closeModal() {
    document.getElementById('overlay').classList.remove('on');
    document.body.style.overflow = '';
    if (window._es) { try { window._es.close(); } catch {} }
  }
  
  function closeOnBg(e) {
    if (e.target === document.getElementById('overlay')) closeModal();
  }
  
  // ════════════════════════════════════════
  //  MODAL CONTENT DISPATCHER
  // ════════════════════════════════════════
  function buildModalContent(id) {
    switch (id) {
      case 'yt':    return buildYt();
      case 'short': return buildShort();
      case 'qr':    return buildQr();
      case 'lorem': return buildLorem();
      case 'chars': return buildChars();
      case 'conv':  return buildConv();
      case 'img':   return buildImg();
      case 'code':  return buildCode();
      case 'b64':   return buildB64();
      case 'pass':  return buildPass();
      case 'hash':  return buildHash();
      case 'audio': return buildTrx();
      default:      return '<p>Em breve.</p>';
    }
  }
  
  function afterModalOpen(id) {
    if (id === 'pass') genPass();
    if (id === 'code') afterCodeOpen();
    if (id === 'conv')  afterConvOpen();
    if (id === 'img')  afterImgOpen();
    if (id === 'audio') afterTrxOpen();
  }
  
  // ════════════════════════════════════════
  //  SHARED UTILS
  // ════════════════════════════════════════
  function copyVal(valId, btnId) {
    navigator.clipboard.writeText(document.getElementById(valId).textContent).then(() => {
      const b = document.getElementById(btnId);
      b.classList.add('ok'); b.textContent = '✅ Copiado';
      setTimeout(() => { b.classList.remove('ok'); b.innerHTML = '📋 Copiar'; }, 2000);
    });
  }
  
  function copyRaw(inputId, btnId) {
    navigator.clipboard.writeText(document.getElementById(inputId).value).then(() => {
      const b = document.getElementById(btnId);
      b.classList.add('ok'); b.textContent = '✅ Copiado';
      setTimeout(() => { b.classList.remove('ok'); b.innerHTML = '📋 Copiar'; }, 2000);
    });
  }
  
  function showFErr(id, msg) {
    const e = document.getElementById(id);
    if (e) { e.textContent = '⚠ ' + msg; e.classList.add('on'); }
  }
  
  function hideFErr(id) {
    document.getElementById(id)?.classList.remove('on');
  }
  
  function fmtDur(s) {
    if (!s) return '';
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  
  // ════════════════════════════════════════
  //  KEYBOARD SHORTCUTS
  // ════════════════════════════════════════
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
  });
  
  document.getElementById('ytUrl')?.addEventListener('keydown', e => { if (e.key === 'Enter') ytFetch(); });
  document.getElementById('shortUrl')?.addEventListener('keydown', e => { if (e.key === 'Enter') doShorten(); });
  
  // ════════════════════════════════════════
  //  INIT
  // ════════════════════════════════════════
  renderGrid(tools);