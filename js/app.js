// ── DETECTAR MODO ──
function getMode() {
  return window.location.hash === '#pro' ? 'pro' : 'casual';
}

var currentMode = getMode();
if (currentMode === 'pro') sessionStorage.setItem('proSession', '1');
var enteredAsPro = (currentMode === 'pro') || sessionStorage.getItem('proSession') === '1';

// ── VISITED CARDS: inicializar ANTES de buildPage() ──────────────
var _visited = {};
try { _visited = JSON.parse(sessionStorage.getItem('visitedCards') || '{}'); } catch(e) {}
// (markVisited y applyVisitedOverlay se definen más abajo pero se usan aquí vía hoisting)

// Aplicar duración del blob del avatar desde config
if (CONFIG.avatarBlobDuration) {
  document.documentElement.style.setProperty('--avatar-blob-duration', CONFIG.avatarBlobDuration);
}

// ── EDAD DINÁMICA: nació en febrero 2000; cambia cada febrero ──
function _calcAge() {
  var now = new Date();
  var age = now.getFullYear() - 2000;
  if (now.getMonth() < 1) age--; // getMonth() 0=ene, 1=feb; antes de feb resta 1
  return age;
}

function getModeConfig() {
  return CONFIG.modos[currentMode];
}

// ── ACTUALIZAR TOGGLE VISUAL ──
function updateToggleUI() {
  var toggle = document.getElementById('mode-toggle');
  if (!toggle) return;
  toggle.style.display = enteredAsPro ? 'flex' : 'none';
  var pills = toggle.querySelectorAll('.mode-pill');
  for (var i = 0; i < pills.length; i++) {
    pills[i].classList.toggle('active', pills[i].getAttribute('data-mode') === currentMode);
    pills[i].setAttribute('aria-pressed', pills[i].getAttribute('data-mode') === currentMode ? 'true' : 'false');
  }
}

// ── MAPA DE LABELS DE SECCIÓN ──
var SECTION_LABELS = {
  '_social':             'Redes Sociales',
  '_profesional':        'Profesional',
  '_profesional_toggle': 'Profesional'
};

// ── ICONOS SVG ──
var ICONOS = {
  ig: '<svg viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
  tt: '<svg viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  dc: '<svg viewBox="0 0 24 24" fill="white"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
  sp: '<svg viewBox="0 0 24 24" fill="white"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>',
  duo: '<img src="LOGO_DUOLINGO.png" style="width:26px;height:26px;object-fit:contain;" alt="Duolingo">',
  li:  '<svg viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  gh:  '<svg viewBox="0 0 24 24" fill="white"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>',
  cv:  '<svg viewBox="0 0 24 24" fill="white"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2zm0-4h5v2H8V7z"/></svg>',
  strava: '<svg viewBox="0 0 24 24" fill="white"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>'
};

var ARROW = '<svg class="link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

// ── IDs con rel="me" para verificación de identidad ──
var REL_ME_IDS = { instagram: true, linkedin: true, github: true };

// ── DELAY MÁXIMO para animaciones (evita acumulación en listas largas) ──
var MAX_DELAY = 0.9;

// ── CONSTRUIR PÁGINA ──
function buildPage() {
  window.scrollTo(0, 0);
  var app  = document.getElementById('app');
  var modo = getModeConfig();

  updateToggleUI();

  var skillsHTML = '';
  var skillsList = (modo.skills || CONFIG.skills);
  if (modo.mostrarSkills && skillsList) {
    skillsHTML = '<div class="skills fade-up" style="animation-delay:0.33s">';
    for (var i = 0; i < skillsList.length; i++) {
      var s = skillsList[i];
      skillsHTML += '<span class="skill-chip">' + s.icono + ' ' + s.nombre + '</span>';
    }
    skillsHTML += '</div>';
  }

  var badgeHTML = '';
  if (modo.badge) {
    badgeHTML =
      '<span class="badge fade-up" style="animation-delay:0.4s">' +
        '<span class="badge-dot"><svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4"/></svg></span> ' +
        modo.badge +
      '</span>';
  }

  var actualmenteHTML = '';
  if (modo.actualmente) {
    actualmenteHTML =
      '<div class="actualmente fade-up" id="actualmente-el" style="animation-delay:0.42s">' +
        '<span>\uD83D\uDD28</span>' +
        '<span><strong>Actualmente:</strong> ' + modo.actualmente + '</span>' +
      '</div>';
  }

  var descripcionHTML = '';
  if (modo.descripcion) {
    descripcionHTML = '<p class="descripcion fade-up" style="animation-delay:0.28s">' + modo.descripcion + '</p>';
  }

  var isSplit = window.innerWidth >= 768;

  var _avatarHTML =
    '<div class="avatar-wrap fade-up" style="animation-delay:0.05s">' +
      '<div class="avatar">' +
        '<picture>' +
          '<source srcset="FOTO_PERFIL.webp" type="image/webp">' +
          '<img src="FOTO_PERFIL.jpg" alt="Mario E. L\u00f3pez C." loading="eager" fetchpriority="high">' +
        '</picture>' +
      '</div>' +
    '</div>';
  var _nameTagHTML =
    '<h1 class="fade-up" style="animation-delay:0.15s">' + CONFIG.nombre + '</h1>' +
    '<p class="tagline fade-up" id="tagline-el" style="animation-delay:0.22s">' + modo.tagline + '</p>' +
    descripcionHTML;
  var _statsHTML =
    '<div class="stats-row fade-up" style="animation-delay:0.44s">' +
      '<div class="stat-card">' +
        '<span class="stat-value" id="stat-streak"><span class="skeleton-val">&nbsp;&nbsp;&nbsp;&nbsp;</span></span>' +
        '<span class="stat-label">\uD83D\uDD25 Racha Duolingo</span>' +
      '</div>' +
      '<div class="stat-card">' +
        '<span class="stat-value" id="stat-km"><span class="skeleton-val">&nbsp;&nbsp;&nbsp;&nbsp;</span></span>' +
        '<span class="stat-label">\uD83D\uDEB4 Km en Strava</span>' +
      '</div>' +
    '</div>';
  var _shareHTML =
    '<button class="share-btn fade-up" id="share-btn" aria-label="Compartir p\u00e1gina" style="animation-delay:0.46s">' +
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
        '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>' +
        '<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' +
      '</svg>' +
      '<span id="share-label">Compartir p\u00e1gina</span>' +
    '</button>';
  var _footerHTML =
    '<p class="footer">\u00a9 ' + new Date().getFullYear() + ' ' + CONFIG.footer + '</p>' +
    '<p class="footer-update" id="last-updated"></p>';

  if (isSplit) {
    app.innerHTML =
      '<div class="split-screen">' +
        '<div class="split-left">' +
          '<div class="profile">' + _avatarHTML + _nameTagHTML + skillsHTML + badgeHTML + '</div>' +
          actualmenteHTML +
        '</div>' +
        '<div class="split-right">' +
          _statsHTML + _shareHTML +
          '<div class="links" id="links-container"></div>' +
          _footerHTML +
        '</div>' +
      '</div>';
  } else {
    app.innerHTML =
      '<div class="profile">' +
        _avatarHTML + _nameTagHTML + skillsHTML + badgeHTML +
        _statsHTML + _shareHTML +
      '</div>' +
      actualmenteHTML +
      '<div class="links" id="links-container"></div>' +
      _footerHTML;
  }

  var container  = document.getElementById('links-container');
  var ordenLinks = modo.ordenLinks;

  for (var idx = 0; idx < ordenLinks.length; idx++) {
    var entry = ordenLinks[idx];

    // ✅ Delay con tope máximo para evitar acumulación
    var delay = Math.min(0.45 + idx * 0.07, MAX_DELAY);

    if (entry === '_profesional_toggle') {
      // Contar cuántos links reales hay dentro de la sección colapsable
      var proCount = 0;
      for (var ci = idx + 1; ci < ordenLinks.length; ci++) {
        var cEntry = ordenLinks[ci];
        if (cEntry.startsWith('_')) break;
        for (var cj = 0; cj < CONFIG.links.length; cj++) {
          if (CONFIG.links[cj].id === cEntry) { proCount++; break; }
        }
      }
      var countBadge = proCount > 0
        ? ' <span style="font-size:0.6rem;opacity:0.5;font-weight:400;letter-spacing:0">· ' + proCount + '</span>'
        : '';

      var toggleDiv = document.createElement('div');
      toggleDiv.className = 'section-toggle fade-up';
      toggleDiv.style.animationDelay = delay + 's';
      toggleDiv.setAttribute('role', 'button');
      toggleDiv.setAttribute('tabindex', '0');
      toggleDiv.setAttribute('aria-expanded', 'false');
      toggleDiv.setAttribute('aria-controls', 'collapsible-profesional');
      toggleDiv.innerHTML =
        '<p class="section-label">' + SECTION_LABELS[entry] + countBadge + '</p>' +
        '<svg class="section-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
      container.appendChild(toggleDiv);

      var collapsible = document.createElement('div');
      collapsible.className = 'section-collapsible';
      collapsible.id = 'collapsible-profesional';
      container.appendChild(collapsible);

      (function(td) {
        function toggleSection() {
          var col    = document.getElementById('collapsible-profesional');
          var isOpen = td.classList.toggle('open');
          col.classList.toggle('open');
          td.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
        td.addEventListener('click', toggleSection);
        td.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(); }
        });
      })(toggleDiv);

      container = collapsible;
      continue;
    }

    if (SECTION_LABELS[entry]) {
      var label = document.createElement('p');
      label.className = 'section-label fade-up';
      label.style.animationDelay = delay + 's';
      label.textContent = SECTION_LABELS[entry];
      container.appendChild(label);
      continue;
    }

    var link = null;
    for (var j = 0; j < CONFIG.links.length; j++) {
      if (CONFIG.links[j].id === entry) { link = CONFIG.links[j]; break; }
    }
    if (!link) continue;
    if (link.id === 'cv' && !modo.mostrarCV) continue;

    // Discord: botón de copiar usuario
    if (link.id === 'discord' && link.discordUser) {
      var dcWrapper = document.createElement('div');
      dcWrapper.className = 'link-card fade-up-card';
      dcWrapper.style.animationDelay = delay + 's';
      dcWrapper.style.cursor = 'default';
      dcWrapper.setAttribute('tabindex', '0');
      dcWrapper.setAttribute('role', 'group');
      dcWrapper.setAttribute('aria-label', 'Discord: ' + link.discordUser + '. Presion\u00e1 Enter para copiar el usuario.');
      dcWrapper.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var btn = dcWrapper.querySelector('.copy-btn[data-copy]');
          if (btn) btn.click();
        }
      });
      dcWrapper.innerHTML =
        '<div class="link-icon ' + link.icono + '">' + (ICONOS[link.icono] || '') + '</div>' +
        '<div class="link-info">' +
          '<span class="link-name">' + link.nombre + '</span>' +
          '<span class="link-handle">' + link.handle + '</span>' +
        '</div>' +
        '<button class="copy-btn" data-copy="' + link.discordUser + '" aria-label="Copiar usuario de Discord">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
            '<rect x="9" y="9" width="13" height="13" rx="2"/>' +
            '<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>' +
          '</svg>' +
          '<span>COPIAR</span>' +
        '</button>';
      container.appendChild(dcWrapper);
      continue;
    }

    // CV con botón de descarga
    if (link.id === 'cv' && link.urlDescarga) {
      var cvWrapper = document.createElement('div');
      cvWrapper.className = 'link-card fade-up-card';
      cvWrapper.style.animationDelay = delay + 's';
      cvWrapper.style.cursor = 'pointer';
      cvWrapper.setAttribute('tabindex', '0');
      cvWrapper.setAttribute('role', 'button');
      cvWrapper.setAttribute('aria-label', 'Ver Curr\u00edculum Vitae de Mario E. L\u00f3pez (se abre en Canva)');
      (function(url) {
        cvWrapper.addEventListener('click', function() { window.open(url, '_blank'); });
        cvWrapper.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.open(url, '_blank'); }
        });
      })(link.url);
      cvWrapper.innerHTML =
        '<div class="link-icon ' + link.icono + '">' + (ICONOS[link.icono] || '') + '</div>' +
        '<div class="link-info">' +
          '<span class="link-name">' + link.nombre + '</span>' +
          '<span class="link-handle">' + link.handle + '</span>' +
        '</div>' +
        '<a class="download-btn" href="' + link.urlDescarga + '" download target="_blank" onclick="event.stopPropagation()" aria-label="Descargar CV en PDF">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
            '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>' +
            '<polyline points="7 10 12 15 17 10"/>' +
            '<line x1="12" y1="15" x2="12" y2="3"/>' +
          '</svg>' +
          'PDF' +
        '</a>';
      container.appendChild(cvWrapper);
      continue;
    }

    // Link normal
    var a = document.createElement('a');
    a.className = 'link-card fade-up-card';
    a.style.animationDelay = delay + 's';
    a.href = link.url;
    a.target = '_blank';
    a.setAttribute('data-link-id', link.id);
    // ✅ rel="me" en links de identidad propia (Instagram, LinkedIn, GitHub)
    a.rel = REL_ME_IDS[link.id] ? 'noopener me' : 'noopener';

    var handleId  = link.id === 'strava' ? ' id="strava-handle"' : '';
    var rightHTML = ARROW;

    if (link.id === 'duolingo' && CONFIG.streakActivo !== false) {
      rightHTML = '<span class="streak-badge">\uD83D\uDD25 <span class="streak-num">0</span></span>';
    }

    a.innerHTML =
      '<div class="link-icon ' + link.icono + '">' + (ICONOS[link.icono] || '') + '</div>' +
      '<div class="link-info">' +
        '<span class="link-name">' + link.nombre + '</span>' +
        '<span class="link-handle"' + handleId + '>' + link.handle + '</span>' +
      '</div>' +
      rightHTML;

    // Visited overlay si el usuario ya visitó este link
    a.style.position = 'relative';
    applyVisitedOverlay(a, link.id);

    container.appendChild(a);
  }
}

// ── TOGGLE DE MODO ──
function switchMode(newMode) {
  if (newMode === currentMode) return;
  var app = document.getElementById('app');

  // Fade out
  app.style.transition = 'opacity 0.2s ease, filter 0.2s ease';
  app.style.opacity = '0';
  app.style.filter = 'blur(3px)';

  setTimeout(function() {
    currentMode = newMode;
    window.location.hash = currentMode === 'pro' ? '#pro' : '';
    buildPage(); loadStrava(); animateStreak(); loadMeta();

    // Fade in — todo se reconstruye fluidamente junto
    app.style.transition = 'opacity 0.32s ease, filter 0.32s ease';
    requestAnimationFrame(function() {
      app.style.opacity = '1';
      app.style.filter = 'blur(0)';
      setTimeout(typewriterEffect, 200);
      setTimeout(initMobileScrollHero, 60);
    });
  }, 210);
}

document.getElementById('mode-toggle').addEventListener('click', function(e) {
  var pill = e.target.closest('.mode-pill');
  if (pill) switchMode(pill.getAttribute('data-mode'));
});

// ── STRAVA STATS ──
function loadStrava() {
  fetch('./strava.json?v=' + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var el = document.getElementById('strava-handle');
      if (el && data.display && data.km_alltime > 0) {
        el.textContent = '\uD83D\uDEB4 ' + data.display;
      }
      // Stat card de km — quitar skeleton y poner dato real
      var statKm = document.getElementById('stat-km');
      if (statKm) {
        statKm.textContent = data.km_alltime > 0
          ? Math.round(data.km_alltime).toLocaleString('es')
          : '–';
      }
    })
    .catch(function() {
      // Si falla el fetch, quitar skeleton con guión
      var statKm = document.getElementById('stat-km');
      if (statKm) statKm.textContent = '–';
    });
}

// ── CALCULAR STREAK DESDE FECHA ──
function calcularStreak() {
  var inicio = new Date(CONFIG.fechaInicioStreak + 'T00:00:00');
  var hoy    = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.floor((hoy - inicio) / (1000 * 60 * 60 * 24));
}

// ── CONTADOR ANIMADO DUOLINGO ──
function animateStreak() {
  if (CONFIG.streakActivo === false) return;
  var el = document.querySelector('.streak-num');
  var target = calcularStreak();

  // Poblar stat card de racha — quitar skeleton y poner dato real
  var statStreak = document.getElementById('stat-streak');
  if (statStreak) statStreak.textContent = target.toLocaleString('es');

  if (!el) return;
  var duration = 1200;
  var start    = performance.now();
  function update(now) {
    var elapsed  = now - start;
    var progress = Math.min(elapsed / duration, 1);
    var ease     = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  }
  setTimeout(function() { requestAnimationFrame(update); }, 500);
}

// ── META: ÚLTIMA ACTUALIZACIÓN ──
function timeAgo(dateStr) {
  var diff = Math.floor((new Date() - new Date(dateStr)) / 86400000);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'ayer';
  if (diff <  7) return 'hace ' + diff + ' días';
  if (diff < 30) return 'hace ' + Math.floor(diff / 7) + (Math.floor(diff / 7) === 1 ? ' semana' : ' semanas');
  if (diff < 365) { var m = Math.floor(diff / 30); return 'hace ' + m + (m === 1 ? ' mes' : ' meses'); }
  var y = Math.floor(diff / 365); return 'hace ' + y + (y === 1 ? ' año' : ' años');
}

function formatDate(dateStr) {
  var meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  var d = new Date(dateStr);
  return d.getDate() + ' ' + meses[d.getMonth()] + ' ' + d.getFullYear();
}

function loadMeta() {
  var el = document.getElementById('last-updated');
  if (!el) return;

  // Mostrar fallback desde config.js inmediatamente
  if (CONFIG.lastUpdated) {
    el.textContent = 'Actualizado ' + timeAgo(CONFIG.lastUpdated) + ' · ' + formatDate(CONFIG.lastUpdated);
  }

  // Intentar sobreescribir con meta.json (más preciso, generado por git/GitHub Actions)
  fetch('./meta.json?v=' + Date.now())
    .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function(data) {
      if (!data.last_updated) return;
      el.textContent = 'Actualizado ' + timeAgo(data.last_updated) + ' · ' + formatDate(data.last_updated);
    })
    .catch(function() {}); // silencioso — el fallback ya está visible
}

// ── VISITED CARDS (sessionStorage) ──
// _visited se inicializa arriba del script antes de buildPage()

function markVisited(linkId) {
  _visited[linkId] = 1;
  try { sessionStorage.setItem('visitedCards', JSON.stringify(_visited)); } catch(e) {}
}

function applyVisitedOverlay(card, linkId) {
  if (!_visited[linkId]) return;
  if (!card.querySelector('.visited-overlay')) {
    var ov = document.createElement('div');
    ov.className = 'visited-overlay';
    card.style.position = 'relative';
    card.appendChild(ov);
  }
}
