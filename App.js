// ============================================================
//  NEXPLAY — app.js  (Full Application Logic)
// ============================================================

// ── DATA STORE (localStorage-backed) ──────────────────────
const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem('np_' + key)); } catch { return null; } },
  set(key, val) { localStorage.setItem('np_' + key, JSON.stringify(val)); },
  del(key) { localStorage.removeItem('np_' + key); }
};

// Initialize database if first run
function initDB() {
  if (!DB.get('users')) {
    DB.set('users', [
      {
        id: 'admin001',
        username: 'admin',
        email: 'admin@nexplay.gg',
        password: 'admin123',
        role: 'admin',
        avatar: '🛡️',
        bio: 'Administrador principal de NexPlay',
        joined: new Date().toISOString(),
        banned: false,
        favorites: [],
        history: [],
        likesGiven: 0
      }
    ]);
  }
  if (!DB.get('games')) {
    DB.set('games', [
      { id:'g1', title:'Súper Salto', dev:'PixelStudios', devId:'admin001', cover:'https://via.placeholder.com/160x160/00c9b1/fff?text=🎮', url:'https://nexplay.gg/demo', desc:'¡Salta lo más alto posible y supera obstáculos!', category:'Plataformas', tags:['salto','pixel','casual'], likes:142, dislikes:8, fire:55, wow:23, featured:true, status:'approved', plays:5420 },
      { id:'g2', title:'Carrera Extrema', dev:'SpeedDev', devId:'admin001', cover:'https://via.placeholder.com/160x160/f43f5e/fff?text=🏎️', url:'https://nexplay.gg/demo', desc:'Carreras de alta velocidad en pistas imposibles.', category:'Carreras', tags:['carreras','velocidad','3D'], likes:98, dislikes:5, fire:70, wow:40, featured:false, status:'approved', plays:3200 },
      { id:'g3', title:'Puzzle Master', dev:'BrainGames', devId:'admin001', cover:'https://via.placeholder.com/160x160/7c3aed/fff?text=🧩', url:'https://nexplay.gg/demo', desc:'Resuelve rompecabezas que desafían tu mente.', category:'Puzzle', tags:['puzzle','mente','logica'], likes:76, dislikes:3, fire:20, wow:55, featured:true, status:'approved', plays:2800 },
      { id:'g4', title:'Arena Fighter', dev:'FightCo', devId:'admin001', cover:'https://via.placeholder.com/160x160/fbbf24/000?text=🥊', url:'https://nexplay.gg/demo', desc:'Combates épicos en arenas multijugador.', category:'Acción', tags:['pelea','multijugador','acción'], likes:210, dislikes:12, fire:130, wow:88, featured:false, status:'approved', plays:8900 },
      { id:'g5', title:'Space Shooter', dev:'GalaxyDev', devId:'admin001', cover:'https://via.placeholder.com/160x160/0f172a/00c9b1?text=🚀', url:'https://nexplay.gg/demo', desc:'Defiende la galaxia de oleadas de enemigos.', category:'Acción', tags:['espacio','disparos','retro'], likes:154, dislikes:7, fire:88, wow:42, featured:true, status:'approved', plays:6100 },
      { id:'g6', title:'Tower Defense Pro', dev:'StrategyHub', devId:'admin001', cover:'https://via.placeholder.com/160x160/22c55e/fff?text=🗼', url:'https://nexplay.gg/demo', desc:'Construye tu defensa y sobrevive.', category:'Estrategia', tags:['defensa','estrategia','torres'], likes:89, dislikes:4, fire:45, wow:31, featured:false, status:'approved', plays:4100 }
    ]);
  }
  if (!DB.get('teams')) { DB.set('teams', []); }
  if (!DB.get('pendingGames')) { DB.set('pendingGames', []); }
}

// Current session
let currentUser = null;
let welcomeStep = 1;
let currentGame = null;

// ── BAD WORDS LIST (expandable) ────────────────────────────
const BAD_WORDS = ['puta','mierda','coño','culo','polla','marica','pendejo','cabron','joder','idiota','estupido','gilipollas','mamada','verga','chinga','carajo','hdp','ojete','perra','zorra','hijo de puta','bastardo','imbecil','subnormal','retrasado','mongolo'];
const RESERVED = ['admin','nexplay','moderator','mod','staff','support','root','system','null','undefined','test'];

function containsBadWord(str) {
  const s = str.toLowerCase().replace(/[0-9@$!*]/g, a => ({'0':'o','@':'a','$':'s','1':'i','!':'i','3':'e'} [a] || a));
  return BAD_WORDS.some(w => s.includes(w));
}

function isReserved(str) {
  return RESERVED.some(r => str.toLowerCase().includes(r));
}

// ── AI USERNAME CHECKER ────────────────────────────────────
let usernameTimer = null;
function checkUsername(val) {
  clearTimeout(usernameTimer);
  const fb = document.getElementById('username-feedback');
  if (!val) { fb.textContent = ''; fb.className = 'ai-hint'; return; }

  usernameTimer = setTimeout(async () => {
    fb.textContent = '🤖 Analizando...';
    fb.className = 'ai-hint';
    fb.classList.remove('hidden');

    await delay(400);

    const users = DB.get('users') || [];
    const exists = users.some(u => u.username.toLowerCase() === val.toLowerCase());

    if (val.length < 3) {
      fb.textContent = '⚠️ Demasiado corto. Mínimo 3 caracteres.';
      fb.className = 'ai-hint warn';
    } else if (val.length > 20) {
      fb.textContent = '⚠️ Demasiado largo. Máximo 20 caracteres.';
      fb.className = 'ai-hint warn';
    } else if (containsBadWord(val)) {
      fb.textContent = '🚫 IA detectó lenguaje inapropiado. Elige otro nombre.';
      fb.className = 'ai-hint bad';
    } else if (isReserved(val)) {
      fb.textContent = '🚫 Nombre reservado por el sistema. Elige otro.';
      fb.className = 'ai-hint bad';
    } else if (exists) {
      fb.textContent = '❌ Ya existe ese usuario. Prueba con ' + val + Math.floor(Math.random()*999+1);
      fb.className = 'ai-hint bad';
    } else if (!/^[a-zA-Z0-9_\-\.]+$/.test(val)) {
      fb.textContent = '⚠️ Solo letras, números, guiones y puntos.';
      fb.className = 'ai-hint warn';
    } else {
      fb.textContent = '✅ ¡Nombre disponible y aprobado por IA!';
      fb.className = 'ai-hint ok';
    }
  }, 600);
}

// ── AUTH FLOWS ─────────────────────────────────────────────
function showLogin() {
  hideAll();
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-screen').style.display = 'flex';
}

function showRegister() {
  hideAll();
  document.getElementById('register-screen').classList.remove('hidden');
  document.getElementById('register-screen').style.display = 'flex';
}

function hideAll() {
  ['splash','login-screen','register-screen','welcome-screen','main-app'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); el.style.display = ''; }
  });
}

async function doLogin() {
  const userInput = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');

  if (!userInput || !pass) {
    showErr(errEl, 'Por favor completa todos los campos.');
    return;
  }

  const users = DB.get('users') || [];
  const user = users.find(u =>
    (u.username.toLowerCase() === userInput.toLowerCase() || u.email.toLowerCase() === userInput.toLowerCase())
    && u.password === pass
  );

  if (!user) {
    showErr(errEl, '❌ Usuario o contraseña incorrectos.');
    return;
  }

  if (user.banned) {
    showErr(errEl, '🚫 Tu cuenta ha sido suspendida. Contacta soporte.');
    return;
  }

  errEl.classList.add('hidden');
  currentUser = user;
  DB.set('session', user.id);
  showWelcome(user, false);
}

async function doRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const role = document.getElementById('reg-role').value;
  const errEl = document.getElementById('reg-error');

  if (!username || !email || !pass) {
    showErr(errEl, 'Por favor completa todos los campos.');
    return;
  }

  if (containsBadWord(username)) {
    showErr(errEl, '🚫 El nombre de usuario contiene lenguaje inapropiado.');
    return;
  }

  if (isReserved(username)) {
    showErr(errEl, '🚫 Nombre reservado por el sistema.');
    return;
  }

  const users = DB.get('users') || [];
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    showErr(errEl, '❌ Ese nombre de usuario ya existe.');
    return;
  }

  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    showErr(errEl, '❌ Ese email ya está registrado.');
    return;
  }

  if (pass.length < 6) {
    showErr(errEl, '⚠️ La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  const newUser = {
    id: 'u_' + Date.now(),
    username, email, password: pass, role,
    avatar: randomEmoji(),
    bio: '',
    joined: new Date().toISOString(),
    banned: false,
    favorites: [],
    history: [],
    likesGiven: 0
  };

  users.push(newUser);
  DB.set('users', users);
  currentUser = newUser;
  DB.set('session', newUser.id);
  errEl.classList.add('hidden');
  showWelcome(newUser, true);
}

function showWelcome(user, isNew) {
  hideAll();
  welcomeStep = 1;
  document.getElementById('welcome-screen').classList.remove('hidden');
  document.getElementById('welcome-screen').style.display = 'flex';
  document.getElementById('welcome-name').textContent = user.username;
  document.getElementById('welcome-step-1').classList.remove('hidden');
  document.getElementById('welcome-step-2').classList.add('hidden');

  if (!isNew) {
    document.getElementById('welcome-title').innerHTML = `¡Hola de nuevo, <span id="welcome-name">${user.username}</span>!`;
    document.getElementById('welcome-msg').textContent = 'Nos alegra verte de nuevo. Tus juegos favoritos te esperan.';
  }
}

function welcomeNext() {
  document.getElementById('welcome-step-1').classList.add('hidden');
  document.getElementById('welcome-step-2').classList.remove('hidden');
}

function acceptTerms() {
  if (!document.getElementById('terms-check').checked) {
    showToast('Debes aceptar los términos para continuar.', 'error');
    return;
  }
  hideAll();
  enterApp();
}

function enterApp() {
  document.getElementById('main-app').classList.remove('hidden');
  document.getElementById('main-app').style.display = 'flex';
  setupNavUser();
  renderHome();
  renderCategories();
  showSection('home');
}

function setupNavUser() {
  if (!currentUser) return;
  document.getElementById('nav-avatar').textContent = currentUser.avatar || currentUser.username[0].toUpperCase();
  document.getElementById('nav-username-display').textContent = currentUser.username;

  if (currentUser.role === 'admin') {
    document.getElementById('admin-link').style.display = '';
  }
  if (currentUser.role === 'dev' || currentUser.role === 'admin') {
    document.getElementById('dev-link').style.display = '';
    document.getElementById('dev-btn').style.display = '';
  }
}

function doLogout() {
  DB.del('session');
  currentUser = null;
  document.getElementById('user-dropdown').classList.add('hidden');
  hideAll();
  document.getElementById('splash').classList.remove('hidden');
  document.getElementById('splash').style.display = 'flex';
  showToast('Sesión cerrada. ¡Hasta pronto!', 'info');
}

// ── NAVIGATION ─────────────────────────────────────────────
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById('section-' + id);
  if (sec) sec.classList.add('active');
  document.getElementById('user-dropdown').classList.add('hidden');

  if (id === 'profile') renderProfile();
  if (id === 'admin') renderAdmin();
  if (id === 'dev') renderDevPanel();
  if (id === 'favorites') renderFavorites();
  if (id === 'history') renderHistory();
}

function goHome() { showSection('home'); }

function toggleUserMenu() {
  const dd = document.getElementById('user-dropdown');
  dd.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-user')) {
    const dd = document.getElementById('user-dropdown');
    if (dd) dd.classList.add('hidden');
  }
  if (!e.target.closest('.nav-search')) {
    const sr = document.getElementById('search-results');
    if (sr) sr.classList.add('hidden');
  }
});

// ── GAME RENDERING ─────────────────────────────────────────
const CATEGORIES = [
  { name:'Acción', icon:'⚔️' },
  { name:'Puzzle', icon:'🧩' },
  { name:'Carreras', icon:'🏎️' },
  { name:'Plataformas', icon:'🏃' },
  { name:'Aventura', icon:'🗺️' },
  { name:'Deportes', icon:'⚽' },
  { name:'Estrategia', icon:'♟️' },
  { name:'Casual', icon:'🎈' },
  { name:'Multijugador', icon:'👥' },
  { name:'Tirador', icon:'🎯' },
  { name:'RPG', icon:'🧙' },
  { name:'Terror', icon:'👻' }
];

function renderHome() {
  const games = (DB.get('games') || []).filter(g => g.status === 'approved');
  renderGamesGrid('featured-games', games.filter(g => g.featured));
  renderGamesGrid('new-games', [...games].reverse().slice(0, 6));
  renderGamesGrid('popular-games', [...games].sort((a,b) => (b.plays||0)-(a.plays||0)).slice(0,6));
}

function renderCategories() {
  const grid = document.getElementById('categories-grid');
  grid.innerHTML = CATEGORIES.map(c => `
    <div class="cat-card" onclick="filterByCategory('${c.name}')">
      <div class="cat-icon">${c.icon}</div>
      <div class="cat-name">${c.name}</div>
    </div>
  `).join('');
}

function filterByCategory(cat) {
  showSection('home');
  const games = (DB.get('games') || []).filter(g => g.status === 'approved' && g.category === cat);
  document.querySelector('#section-home .section-header h2').textContent = '🎮 ' + cat;
  const heroSection = document.querySelector('#section-home .hero-banner');
  const featuredSection = document.querySelector('#section-home .section-header');
  renderGamesGrid('featured-games', games);
  document.querySelectorAll('#section-home .section-header').forEach((h,i) => { if(i>0) h.style.display='none'; });
  document.querySelectorAll('#section-home .games-grid').forEach((g,i) => { if(i>0) g.innerHTML=''; });
}

function renderGamesGrid(containerId, games) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!games || !games.length) {
    container.innerHTML = '<p style="color:var(--nx-text2);padding:20px;grid-column:1/-1">No hay juegos aquí todavía.</p>';
    return;
  }
  container.innerHTML = games.map(g => gameCard(g)).join('');
}

function gameCard(g) {
  const badge = g.featured ? '<div class="game-card-badge">⭐ Destacado</div>' : '';
  const statusBadge = g.status === 'pending' ? '<div class="game-card-badge pending">⏳ Pendiente</div>' : 
                      g.status === 'banned' ? '<div class="game-card-badge banned">🚫 Baneado</div>' : badge;
  return `
    <div class="game-card" onclick="openGame('${g.id}')">
      ${statusBadge}
      <img src="${g.cover || 'https://via.placeholder.com/160x160/1e1e35/9090b0?text=🎮'}" alt="${g.title}" onerror="this.src='https://via.placeholder.com/160x160/1e1e35/9090b0?text=🎮'" loading="lazy"/>
      <div class="game-card-info">
        <div class="game-card-title">${g.title}</div>
        <div class="game-card-meta">
          <span>👍 ${g.likes||0}</span>
          <span>🎮 ${formatNum(g.plays||0)}</span>
        </div>
      </div>
    </div>
  `;
}

function openGame(id) {
  const games = DB.get('games') || [];
  const game = games.find(g => g.id === id);
  if (!game) return;
  if (game.status === 'banned') { showToast('Este juego ha sido suspendido.', 'error'); return; }
  if (game.status === 'pending') { showToast('Este juego está pendiente de revisión.', 'info'); return; }

  currentGame = game;

  // Update play count
  const idx = games.findIndex(g => g.id === id);
  games[idx].plays = (games[idx].plays || 0) + 1;
  DB.set('games', games);

  // Add to history
  if (currentUser) {
    const users = DB.get('users') || [];
    const ui = users.findIndex(u => u.id === currentUser.id);
    if (ui !== -1) {
      users[ui].history = [id, ...(users[ui].history || []).filter(h => h !== id)].slice(0, 20);
      DB.set('users', users);
      currentUser = users[ui];
    }
  }

  showSection('game');
  document.getElementById('game-iframe').src = game.url;
  document.getElementById('gm-cover').src = game.cover;
  document.getElementById('gm-title').textContent = game.title;
  document.getElementById('gm-dev').textContent = 'por ' + game.dev;
  document.getElementById('gm-desc').textContent = game.desc;
  document.getElementById('gm-likes').textContent = game.likes || 0;
  document.getElementById('gm-dislikes').textContent = game.dislikes || 0;
  document.getElementById('gm-tags').innerHTML = (game.tags||[]).map(t => `<span class="game-tag">${t}</span>`).join('');

  // Update fav button
  const favs = currentUser ? (currentUser.favorites || []) : [];
  document.getElementById('gm-fav').classList.toggle('active', favs.includes(id));

  // Sidebar
  const otherGames = (DB.get('games')||[]).filter(g => g.status==='approved' && g.id !== id).slice(0,8);
  document.getElementById('sidebar-games').innerHTML = otherGames.map(g => `
    <div class="sidebar-game" onclick="openGame('${g.id}')">
      <img src="${g.cover}" alt="${g.title}" onerror="this.src='https://via.placeholder.com/44x44/1e1e35/9090b0?text=🎮'" />
      <div>
        <div class="sidebar-game-info">${g.title}</div>
        <div class="sidebar-game-sub">👍 ${g.likes||0}</div>
      </div>
    </div>
  `).join('');
}

function reactGame(type) {
  if (!currentGame) return;
  const games = DB.get('games') || [];
  const idx = games.findIndex(g => g.id === currentGame.id);
  if (idx === -1) return;

  if (type === 'like') {
    games[idx].likes = (games[idx].likes || 0) + 1;
    document.getElementById('gm-likes').textContent = games[idx].likes;
    document.getElementById('gm-like').classList.add('active');
    showToast('👍 ¡Te gustó!', 'success');
    if (currentUser) {
      const users = DB.get('users') || [];
      const ui = users.findIndex(u => u.id === currentUser.id);
      if (ui !== -1) { users[ui].likesGiven = (users[ui].likesGiven||0)+1; DB.set('users', users); currentUser = users[ui]; }
    }
  } else if (type === 'dislike') {
    games[idx].dislikes = (games[idx].dislikes || 0) + 1;
    document.getElementById('gm-dislikes').textContent = games[idx].dislikes;
    document.getElementById('gm-dislike').classList.add('active');
    showToast('👎 No te gustó.', 'info');
  } else if (type === 'fire') {
    games[idx].fire = (games[idx].fire || 0) + 1;
    showToast('🔥 ¡Súper caliente!', 'success');
  } else if (type === 'wow') {
    games[idx].wow = (games[idx].wow || 0) + 1;
    showToast('😮 ¡Alucinante!', 'success');
  }

  DB.set('games', games);
  currentGame = games[idx];
}

function toggleFavorite() {
  if (!currentUser) { showToast('Inicia sesión para guardar favoritos.', 'error'); return; }
  const users = DB.get('users') || [];
  const ui = users.findIndex(u => u.id === currentUser.id);
  if (ui === -1) return;
  const favs = users[ui].favorites || [];
  const isFav = favs.includes(currentGame.id);
  users[ui].favorites = isFav ? favs.filter(f => f !== currentGame.id) : [...favs, currentGame.id];
  DB.set('users', users);
  currentUser = users[ui];
  document.getElementById('gm-fav').classList.toggle('active', !isFav);
  showToast(isFav ? '💔 Eliminado de favoritos' : '❤️ Añadido a favoritos', isFav ? 'info' : 'success');
}

function shareGame() {
  showToast('🔗 Enlace copiado al portapapeles!', 'success');
}

function reportGame() {
  showToast('🚩 Juego reportado. Lo revisaremos.', 'info');
}

// ── SEARCH ─────────────────────────────────────────────────
let searchTimer = null;
function searchGames(val) {
  clearTimeout(searchTimer);
  const container = document.getElementById('search-results');
  if (!val.trim()) { container.classList.add('hidden'); return; }

  searchTimer = setTimeout(() => {
    const games = (DB.get('games') || []).filter(g =>
      g.status === 'approved' &&
      (g.title.toLowerCase().includes(val.toLowerCase()) ||
       g.category.toLowerCase().includes(val.toLowerCase()) ||
       (g.tags||[]).some(t => t.toLowerCase().includes(val.toLowerCase())))
    ).slice(0, 6);

    if (!games.length) { container.classList.add('hidden'); return; }

    container.innerHTML = games.map(g => `
      <div class="search-item" onclick="openGame('${g.id}');document.getElementById('search-results').classList.add('hidden');">
        <img src="${g.cover}" alt="${g.title}" onerror="this.src='https://via.placeholder.com/40x40/1e1e35/9090b0?text=🎮'" />
        <div>
          <div style="font-weight:700;font-size:14px">${g.title}</div>
          <div style="font-size:12px;color:var(--nx-text2)">${g.category}</div>
        </div>
      </div>
    `).join('');
    container.classList.remove('hidden');
  }, 300);
}

// ── PROFILE ────────────────────────────────────────────────
function renderProfile() {
  if (!currentUser) return;
  const u = currentUser;
  document.getElementById('profile-avatar-big').textContent = u.avatar || u.username[0];
  document.getElementById('profile-username-big').textContent = u.username;
  document.getElementById('profile-joined').textContent = 'Miembro desde ' + new Date(u.joined).toLocaleDateString('es');
  const roleBadge = document.getElementById('profile-role-badge');
  roleBadge.textContent = u.role === 'admin' ? '🛡️ Administrador' : u.role === 'dev' ? '🎮 Desarrollador' : '🕹️ Jugador';
  roleBadge.className = 'role-badge ' + u.role;

  document.getElementById('stat-played').textContent = (u.history||[]).length;
  document.getElementById('stat-likes').textContent = u.likesGiven || 0;
  document.getElementById('stat-favs').textContent = (u.favorites||[]).length;

  const historyGames = (DB.get('games')||[]).filter(g => (u.history||[]).includes(g.id)).slice(0,6);
  renderGamesGrid('profile-recent-games', historyGames);
}

function showEditProfile() {
  document.getElementById('edit-username').value = currentUser.username;
  document.getElementById('edit-bio').value = currentUser.bio || '';
  document.getElementById('edit-avatar').value = currentUser.avatar || '';
  document.getElementById('edit-profile-modal').classList.remove('hidden');
}

function saveProfile() {
  const newUsername = document.getElementById('edit-username').value.trim();
  const bio = document.getElementById('edit-bio').value.trim();
  const avatar = document.getElementById('edit-avatar').value.trim();

  if (containsBadWord(newUsername)) { showToast('🚫 Nombre inapropiado detectado.', 'error'); return; }

  const users = DB.get('users') || [];
  const ui = users.findIndex(u => u.id === currentUser.id);
  if (ui === -1) return;

  users[ui].username = newUsername || currentUser.username;
  users[ui].bio = bio;
  users[ui].avatar = avatar || currentUser.avatar;
  DB.set('users', users);
  currentUser = users[ui];

  setupNavUser();
  renderProfile();
  closeModal('edit-profile-modal');
  showToast('✅ Perfil actualizado', 'success');
}

function renderFavorites() {
  if (!currentUser) return;
  const favGames = (DB.get('games')||[]).filter(g => (currentUser.favorites||[]).includes(g.id));
  renderGamesGrid('favorites-grid', favGames);
}

function renderHistory() {
  if (!currentUser) return;
  const histGames = (DB.get('games')||[]).filter(g => (currentUser.history||[]).includes(g.id));
  renderGamesGrid('history-grid', histGames);
}

// ── DEV PANEL ──────────────────────────────────────────────
function renderDevPanel() {
  if (!currentUser || (currentUser.role !== 'dev' && currentUser.role !== 'admin')) return;
  renderTeamBox();
  renderDevGames();
}

function renderTeamBox() {
  const teams = DB.get('teams') || [];
  const team = teams.find(t => t.ownerId === currentUser.id);
  const box = document.getElementById('dev-team-box');

  if (team) {
    box.innerHTML = `
      <div class="team-display">
        <img class="team-logo-big" src="${team.logo || 'https://via.placeholder.com/64x64/1e1e35/00c9b1?text=🎮'}" onerror="this.style.fontSize='32px';this.src=''" alt="${team.name}" />
        <div class="team-info">
          <h3>${team.name} ${team.banned ? '<span style="color:var(--nx-danger)">🚫 Suspendido</span>' : ''}</h3>
          <p>${team.desc || 'Sin descripción'}</p>
          <div class="team-lock">🔒 Equipo protegido con contraseña</div>
        </div>
        <button class="btn-secondary" onclick="showModal('team-form');loadTeamForm()">✏️ Editar</button>
      </div>
    `;
  } else {
    box.innerHTML = `
      <div style="text-align:center;padding:24px">
        <div style="font-size:48px;margin-bottom:12px">🏢</div>
        <h3 style="margin-bottom:8px">Crea tu equipo o estudio</h3>
        <p style="color:var(--nx-text2);margin-bottom:20px">Configura tu identidad como desarrollador</p>
        <button class="btn-primary" onclick="showModal('team-form')">+ Crear equipo</button>
      </div>
    `;
  }
}

function loadTeamForm() {
  const teams = DB.get('teams') || [];
  const team = teams.find(t => t.ownerId === currentUser.id);
  if (team) {
    document.getElementById('team-name').value = team.name;
    document.getElementById('team-desc').value = team.desc || '';
    document.getElementById('team-logo').value = team.logo || '';
  }
}

function saveTeam() {
  const name = document.getElementById('team-name').value.trim();
  const desc = document.getElementById('team-desc').value.trim();
  const logo = document.getElementById('team-logo').value.trim();
  const pw = document.getElementById('team-pw').value;

  if (!name) { showToast('El nombre del equipo es obligatorio.', 'error'); return; }

  const teams = DB.get('teams') || [];
  const idx = teams.findIndex(t => t.ownerId === currentUser.id);
  const teamData = {
    id: idx !== -1 ? teams[idx].id : 't_' + Date.now(),
    name, desc, logo, pw,
    ownerId: currentUser.id,
    ownerName: currentUser.username,
    banned: false,
    created: new Date().toISOString()
  };

  if (idx !== -1) teams[idx] = teamData;
  else teams.push(teamData);
  DB.set('teams', teams);

  // Update games with team info
  const games = DB.get('games') || [];
  games.forEach((g,i) => { if(g.devId === currentUser.id) { games[i].dev = name; } });
  DB.set('games', games);

  closeModal('team-form');
  showToast('✅ Equipo guardado exitosamente', 'success');
  renderTeamBox();
}

function renderDevGames() {
  const games = (DB.get('games')||[]).filter(g => g.devId === currentUser.id);
  renderGamesGrid('dev-games-grid', games);
}

function showPublishGame() {
  showModal('publish-form');
}

function submitGame() {
  const name = document.getElementById('pub-name').value.trim();
  const desc = document.getElementById('pub-desc').value.trim();
  const url = document.getElementById('pub-url').value.trim();
  const cover = document.getElementById('pub-cover').value.trim();
  const category = document.getElementById('pub-category').value;
  const tags = document.getElementById('pub-tags').value.split(',').map(t=>t.trim()).filter(Boolean);

  if (!name || !desc || !url) {
    showToast('Completa los campos obligatorios.', 'error');
    return;
  }

  const teams = DB.get('teams') || [];
  const team = teams.find(t => t.ownerId === currentUser.id);

  const pendingGames = DB.get('pendingGames') || [];
  const newGame = {
    id: 'g_' + Date.now(),
    title: name, desc, url,
    cover: cover || 'https://via.placeholder.com/160x160/1e1e35/9090b0?text=🎮',
    category, tags,
    dev: team ? team.name : currentUser.username,
    devId: currentUser.id,
    likes: 0, dislikes: 0, fire: 0, wow: 0, plays: 0,
    featured: false,
    status: 'pending',
    submittedAt: new Date().toISOString()
  };

  pendingGames.push(newGame);
  DB.set('pendingGames', pendingGames);

  closeModal('publish-form');
  showToast('✅ Juego enviado para revisión. El admin lo aprobará pronto.', 'success');

  // Clear form
  ['pub-name','pub-desc','pub-url','pub-cover','pub-tags'].forEach(id => document.getElementById(id).value = '');
}

// ── ADMIN PANEL ────────────────────────────────────────────
function adminTab(tab) {
  document.querySelectorAll('.atab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('admin-' + tab).classList.add('active');
  renderAdminTab(tab);
}

function renderAdmin() {
  renderAdminTab('users');
  document.querySelectorAll('.atab').forEach((t,i) => { if(i===0) t.classList.add('active'); else t.classList.remove('active'); });
  document.querySelectorAll('.admin-content').forEach((c,i) => { if(i===0) c.classList.add('active'); else c.classList.remove('active'); });
}

function renderAdminTab(tab) {
  if (tab === 'users') renderAdminUsers();
  if (tab === 'games') renderAdminGames();
  if (tab === 'teams') renderAdminTeams();
  if (tab === 'pending') renderAdminPending();
}

function renderAdminUsers() {
  const users = DB.get('users') || [];
  document.getElementById('admin-users').innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th>
      </tr></thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>
              <div class="user-row">
                <div class="user-avatar-sm">${u.avatar||u.username[0]}</div>
                <span>${u.username}</span>
              </div>
            </td>
            <td style="color:var(--nx-text2)">${u.email}</td>
            <td><span class="role-badge ${u.role}">${u.role === 'admin' ? '🛡️ Admin' : u.role === 'dev' ? '🎮 Dev' : '🕹️ Jugador'}</span></td>
            <td><span class="status-dot ${u.banned ? 'banned' : 'active'}"></span>${u.banned ? 'Suspendido' : 'Activo'}</td>
            <td>
              <div class="admin-btns">
                ${u.id !== currentUser.id ? `
                  ${u.banned
                    ? `<button class="abtn unban" onclick="toggleBanUser('${u.id}',false)">✅ Desbanear</button>`
                    : `<button class="abtn ban" onclick="toggleBanUser('${u.id}',true)">🚫 Banear</button>`
                  }
                  ${u.role === 'player' ? `<button class="abtn promote" onclick="promoteUser('${u.id}','dev')">⬆️ Dev</button>` : ''}
                  ${u.role === 'dev' ? `<button class="abtn promote" onclick="promoteUser('${u.id}','player')">⬇️ Jugador</button>` : ''}
                ` : '<span style="color:var(--nx-text2);font-size:12px">(tú)</span>'}
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderAdminGames() {
  const games = DB.get('games') || [];
  document.getElementById('admin-games').innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>Juego</th><th>Dev</th><th>Categoría</th><th>Stats</th><th>Acciones</th>
      </tr></thead>
      <tbody>
        ${games.map(g => `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <img src="${g.cover}" width="40" height="40" style="border-radius:8px;object-fit:cover" onerror="this.style.display='none'" />
                <span style="font-weight:700">${g.title}</span>
              </div>
            </td>
            <td style="color:var(--nx-text2)">${g.dev}</td>
            <td>${g.category}</td>
            <td style="font-size:12px;color:var(--nx-text2)">👍${g.likes} 🎮${formatNum(g.plays||0)}</td>
            <td>
              <div class="admin-btns">
                ${g.featured
                  ? `<button class="abtn" onclick="toggleFeatureGame('${g.id}',false)" style="background:rgba(251,191,36,0.2);color:var(--nx-yellow);border:1px solid rgba(251,191,36,0.3)">⭐ Quitar</button>`
                  : `<button class="abtn feature" onclick="toggleFeatureGame('${g.id}',true)">⭐ Destacar</button>`
                }
                ${g.status === 'banned'
                  ? `<button class="abtn unban" onclick="toggleBanGame('${g.id}',false)">✅ Restaurar</button>`
                  : `<button class="abtn ban" onclick="toggleBanGame('${g.id}',true)">🚫 Banear</button>`
                }
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderAdminTeams() {
  const teams = DB.get('teams') || [];
  const container = document.getElementById('admin-teams');
  if (!teams.length) { container.innerHTML = '<p style="color:var(--nx-text2);padding:20px">No hay equipos registrados.</p>'; return; }
  container.innerHTML = teams.map(t => `
    <div class="team-card">
      <div class="team-card-left">
        <div class="team-card-logo">
          ${t.logo ? `<img src="${t.logo}" style="width:50px;height:50px;border-radius:12px;object-fit:cover" onerror="this.style.display='none'" />` : '🏢'}
        </div>
        <div>
          <div style="font-weight:800;font-size:16px">${t.name} ${t.banned ? '<span style="color:var(--nx-danger)">🚫</span>' : ''}</div>
          <div style="font-size:13px;color:var(--nx-text2)">${t.ownerName} · ${new Date(t.created).toLocaleDateString('es')}</div>
          <div style="font-size:13px;color:var(--nx-text2);margin-top:4px">${t.desc||''}</div>
        </div>
      </div>
      <div class="admin-btns">
        ${t.banned
          ? `<button class="abtn unban" onclick="toggleBanTeam('${t.id}',false)">✅ Desbanear</button>`
          : `<button class="abtn ban" onclick="toggleBanTeam('${t.id}',true)">🚫 Banear</button>`
        }
        <button class="abtn feature" onclick="featureTeam('${t.id}')">⭐ Destacar</button>
      </div>
    </div>
  `).join('');
}

function renderAdminPending() {
  const pending = DB.get('pendingGames') || [];
  const container = document.getElementById('admin-pending');
  if (!pending.length) { container.innerHTML = '<p style="color:var(--nx-text2);padding:20px">No hay juegos pendientes de revisión.</p>'; return; }
  container.innerHTML = pending.map(g => `
    <div class="pending-card">
      <img src="${g.cover}" alt="${g.title}" onerror="this.src='https://via.placeholder.com/60x60/1e1e35/9090b0?text=🎮'" />
      <div class="pending-info" style="flex:1">
        <h4>${g.title}</h4>
        <p>Por <strong>${g.dev}</strong> · ${g.category}</p>
        <p style="margin-top:4px;font-size:12px;color:var(--nx-text2)">${g.desc}</p>
        <a href="${g.url}" target="_blank" style="color:var(--nx-teal);font-size:12px">🔗 Ver juego</a>
      </div>
      <div class="admin-btns" style="flex-direction:column;gap:8px">
        <button class="abtn approve" onclick="approveGame('${g.id}')">✅ Aprobar</button>
        <button class="abtn reject" onclick="rejectGame('${g.id}')">❌ Rechazar</button>
      </div>
    </div>
  `).join('');
}

// ── ADMIN ACTIONS ──────────────────────────────────────────
function toggleBanUser(id, ban) {
  const users = DB.get('users') || [];
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) { users[idx].banned = ban; DB.set('users', users); }
  renderAdminUsers();
  showToast(ban ? '🚫 Usuario baneado' : '✅ Usuario desbaneado', ban ? 'error' : 'success');
}

function promoteUser(id, role) {
  const users = DB.get('users') || [];
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) { users[idx].role = role; DB.set('users', users); }
  renderAdminUsers();
  showToast(`✅ Usuario actualizado a ${role}`, 'success');
}

function toggleFeatureGame(id, feature) {
  const games = DB.get('games') || [];
  const idx = games.findIndex(g => g.id === id);
  if (idx !== -1) { games[idx].featured = feature; DB.set('games', games); }
  renderAdminGames();
  renderHome();
  showToast(feature ? '⭐ Juego destacado' : 'Destacado removido', 'success');
}

function toggleBanGame(id, ban) {
  const games = DB.get('games') || [];
  const idx = games.findIndex(g => g.id === id);
  if (idx !== -1) { games[idx].status = ban ? 'banned' : 'approved'; DB.set('games', games); }
  renderAdminGames();
  renderHome();
  showToast(ban ? '🚫 Juego baneado' : '✅ Juego restaurado', ban ? 'error' : 'success');
}

function toggleBanTeam(id, ban) {
  const teams = DB.get('teams') || [];
  const idx = teams.findIndex(t => t.id === id);
  if (idx !== -1) { teams[idx].banned = ban; DB.set('teams', teams); }
  renderAdminTeams();
  showToast(ban ? '🚫 Equipo baneado' : '✅ Equipo restaurado', ban ? 'error' : 'success');
}

function featureTeam(id) {
  showToast('⭐ Equipo destacado en la plataforma', 'success');
}

function approveGame(id) {
  const pending = DB.get('pendingGames') || [];
  const idx = pending.findIndex(g => g.id === id);
  if (idx === -1) return;
  const game = { ...pending[idx], status: 'approved', approvedAt: new Date().toISOString() };
  pending.splice(idx, 1);
  DB.set('pendingGames', pending);

  const games = DB.get('games') || [];
  games.unshift(game);
  DB.set('games', games);

  renderAdminPending();
  renderHome();
  showToast('✅ Juego aprobado y publicado', 'success');
}

function rejectGame(id) {
  const pending = DB.get('pendingGames') || [];
  const filtered = pending.filter(g => g.id !== id);
  DB.set('pendingGames', filtered);
  renderAdminPending();
  showToast('❌ Juego rechazado', 'error');
}

// ── MODALS ─────────────────────────────────────────────────
function showModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.add('hidden');
  }
});

// ── UTILS ──────────────────────────────────────────────────
function showErr(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'cardIn 0.3s ease';
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function formatNum(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n.toString();
}

function randomEmoji() {
  const emojis = ['🎮','🕹️','🎯','🎲','⚡','🔥','💎','🚀','🌟','🎪','🦁','🐉'];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDB();

  // Auto-login from session
  const sessionId = DB.get('session');
  if (sessionId) {
    const users = DB.get('users') || [];
    const user = users.find(u => u.id === sessionId);
    if (user && !user.banned) {
      currentUser = user;
      hideAll();
      enterApp();
      return;
    }
  }

  // Show splash
  document.getElementById('splash').classList.remove('hidden');
});
