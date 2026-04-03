// ── TEXT SCRAMBLE (hover desktop + touch móvil) ──
var _SCHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#!';
var _stMap     = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;
var _activeCards = (typeof Set !== 'undefined') ? new Set() : null; // guard a nivel de card
function _scramble(el, cb) {
  if (_stMap && _stMap.has(el)) { clearInterval(_stMap.get(el)); }
  var orig = el.getAttribute('data-orig') || el.textContent;
  el.setAttribute('data-orig', orig);
  var step = 0, total = orig.length * 2.8;
  var iv = setInterval(function() {
    el.textContent = orig.split('').map(function(ch, i) {
      if (ch === ' ') return ' ';
      if (i < Math.floor(step / 2.8)) return orig[i];
      return _SCHARS[Math.floor(Math.random() * _SCHARS.length)];
    }).join('');
    step++;
    if (step > total) {
      clearInterval(iv);
      el.textContent = orig;
      if (_stMap) _stMap.delete(el);
      if (cb) cb();
    }
  }, 28);
  if (_stMap) _stMap.set(el, iv);
}
// Desktop: mouseenter en capture — _activeCards (card-level) evita doble disparo
document.addEventListener('mouseenter', function(e) {
  if (!window.matchMedia('(hover: hover)').matches) return;
  var card = e.target.closest('.link-card');
  if (!card) return;
  if (_activeCards && _activeCards.has(card)) return; // ya activo para esta card
  if (_activeCards) _activeCards.add(card);
  var nameEl = card.querySelector('.link-name');
  if (nameEl) _scramble(nameEl);
}, true);
// Desktop: mouseleave limpia el guard cuando el mouse sale realmente de la card
document.addEventListener('mouseleave', function(e) {
  var card = e.target.closest('.link-card');
  if (!card) return;
  // Verificar que el relatedTarget esté fuera de la card
  if (e.relatedTarget && card.contains(e.relatedTarget)) return;
  if (_activeCards) _activeCards.delete(card);
}, true);
// Móvil: touchstart dispara scramble
document.addEventListener('touchstart', function(e) {
  var card = e.target.closest('.link-card');
  if (!card) return;
  var nameEl = card.querySelector('.link-name');
  if (nameEl) _scramble(nameEl);
}, { passive: true });

// ── TYPEWRITER en tagline ──
var _twIv = null;
function typewriterEffect() {
  if (_twIv) { clearInterval(_twIv); _twIv = null; }
  var el = document.getElementById('tagline-el');
  if (!el) return;
  var text = el.getAttribute('data-tw') || el.textContent;
  el.setAttribute('data-tw', text);

  // Medir la altura real del texto completo ANTES de borrar.
  // Esto reserva exactamente el espacio que ocupa (1 línea o 2),
  // sin hardcodear nada. Se libera al terminar la animación.
  el.style.minHeight = '';
  var naturalH = el.offsetHeight;
  if (naturalH > 0) el.style.minHeight = naturalH + 'px';

  el.textContent = '';
  el.style.borderRight = '1.5px solid var(--orange2)';
  el.style.paddingRight = '2px';
  var i = 0;
  _twIv = setInterval(function() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(_twIv); _twIv = null;
      setTimeout(function() {
        if (el.parentNode) {
          el.style.borderRight = '';
          el.style.paddingRight = '';
          el.style.minHeight = ''; // liberar — texto ya está completo
        }
      }, 800);
    }
  }, 34);
}

// ══════════════════════════════════════════════════════
// ── TOAST NOTIFICATION ──
// ══════════════════════════════════════════════════════
var _toastTimer = null;
function showToast(msg, duration) {
  duration = duration || 2800;
  var el = document.getElementById('ml-toast');
  if (!el) return;
  el.textContent = msg;
  if (_toastTimer) clearTimeout(_toastTimer);
  el.classList.add('visible');
  _toastTimer = setTimeout(function() { el.classList.remove('visible'); }, duration);
}

// Mostrar toast al entrar en modo pro
if (currentMode === 'pro' && !sessionStorage.getItem('proToastShown')) {
  sessionStorage.setItem('proToastShown', '1');
  setTimeout(function() { showToast('💼 Modo Profesional activo'); }, 900);
}

// ══════════════════════════════════════════════════════
// ── HAPTIC FEEDBACK en links ──
// ══════════════════════════════════════════════════════
document.addEventListener('touchstart', function(e) {
  if (e.target.closest('.link-card') && navigator.vibrate) {
    navigator.vibrate(8);
  }
}, { passive: true });

// ══════════════════════════════════════════════════════
// ── AVATAR: LIGHTBOX (1 tap) + COIN FLIP (2 taps) ──
// ══════════════════════════════════════════════════════
var _avatarTaps = 0, _avatarTimer = null, _avatarFlipped = false;

function openLightbox() {
  var lb = document.getElementById('ml-lightbox');
  if (!lb) return;
  lb.style.display = 'flex';
  requestAnimationFrame(function() { lb.classList.add('lb-visible'); });
}
function closeLightbox() {
  var lb = document.getElementById('ml-lightbox');
  if (!lb) return;
  lb.classList.remove('lb-visible');
  setTimeout(function() { lb.style.display = 'none'; }, 220);
}

document.getElementById('ml-lightbox') && document.getElementById('ml-lightbox').addEventListener('click', closeLightbox);

function doAvatarCoinFlip() {
  var wrap = document.querySelector('.avatar-wrap');
  if (!wrap || _avatarFlipped) return;
  _avatarFlipped = true;
  var avatarEl = wrap.querySelector('.avatar');
  if (!avatarEl) return;

  var age = _calcAge();

  // Construir estructura 3D si no existe aún
  if (!wrap.querySelector('.avatar-flip-inner')) {
    var origHTML = avatarEl.innerHTML;
    avatarEl.innerHTML = '';
    var flipInner = document.createElement('div');
    flipInner.className = 'avatar-flip-inner';
    var face = document.createElement('div');
    face.className = 'avatar-face';
    face.innerHTML = origHTML;
    var back = document.createElement('div');
    back.className = 'avatar-back';
    back.innerHTML = '<div class="avatar-age">'
      + '<span class="age-emoji">🎂</span>'
      + '<span class="age-n">' + age + '</span>'
      + '<span class="age-l">años</span>'
      + '</div>';
    flipInner.appendChild(face);
    flipInner.appendChild(back);
    avatarEl.appendChild(flipInner);
  } else {
    // Actualizar edad si la estructura ya existe
    var ageEl = wrap.querySelector('.age-n');
    if (ageEl) ageEl.textContent = age;
  }

  var flipInner = wrap.querySelector('.avatar-flip-inner');
  if (!flipInner) { _avatarFlipped = false; return; }

  // Flip hacia atrás (lado con la edad)
  setTimeout(function() { flipInner.classList.add('flipped'); }, 30);

  // Volver al frente tras 2.5s
  setTimeout(function() {
    flipInner.classList.remove('flipped');
    setTimeout(function() { _avatarFlipped = false; }, 420);
  }, 2800);
}

document.addEventListener('click', function(e) {
  var wrap = e.target.closest('.avatar-wrap');
  if (!wrap) return;
  _avatarTaps++;
  if (_avatarTimer) clearTimeout(_avatarTimer);

  if (_avatarTaps >= 5) {
    // Easter egg: 5 taps rápidos → coin flip
    _avatarTaps = 0;
    doAvatarCoinFlip();
    return;
  }

  // Tras 350ms sin más taps: si fue 1 solo, abrir lightbox
  _avatarTimer = setTimeout(function() {
    if (_avatarTaps === 1) openLightbox();
    _avatarTaps = 0;
  }, 350);
});

// ── DISCORD COPY (delegado) ──
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.copy-btn[data-copy]');
  if (!btn) return;
  var text = btn.getAttribute('data-copy');
  var span = btn.querySelector('span');
  navigator.clipboard.writeText(text).then(function() {
    btn.classList.add('copied');
    span.textContent = '\u2713 Copiado';
    setTimeout(function() {
      btn.classList.remove('copied');
      span.textContent = 'COPIAR';
    }, 2000);
  });
});

// ── RIPPLE EFFECT ──
document.addEventListener('click', function(e) {
  var card = e.target.closest('.link-card');
  if (!card) return;
  var ripple = document.createElement('span');
  var rect   = card.getBoundingClientRect();
  var size   = Math.max(rect.width, rect.height);
  ripple.className = 'ripple';
  ripple.style.cssText =
    'width:' + size + 'px;height:' + size + 'px;' +
    'left:' + (e.clientX - rect.left - size / 2) + 'px;' +
    'top:'  + (e.clientY - rect.top  - size / 2) + 'px;';
  card.appendChild(ripple);
  ripple.addEventListener('animationend', function() { ripple.remove(); });
});

// ── SWIPE HORIZONTAL PARA CAMBIAR MODO (móvil) ──
if (enteredAsPro) {
  var _tx = 0, _ty = 0;
  document.addEventListener('touchstart', function(e) {
    _tx = e.touches[0].clientX;
    _ty = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - _tx;
    var dy = e.changedTouches[0].clientY - _ty;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 55) {
      // Swipe derecha → casual, swipe izquierda → pro
      switchMode(dx > 0 ? 'casual' : 'pro');
    }
  }, { passive: true });
}

// ── TILT 3D + CURSOR MAGNÉTICO (solo desktop) ──
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  var tiltStyle = document.createElement('style');
  tiltStyle.textContent = '.links { perspective: 1200px; }';
  document.head.appendChild(tiltStyle);

  var _rafId = null;
  document.addEventListener('mousemove', function(e) {
    if (_rafId) return;
    var mx = e.clientX, my = e.clientY;
    _rafId = requestAnimationFrame(function() {
      _rafId = null;
      var cards   = document.querySelectorAll('.link-card');
      var hovered = document.elementFromPoint(mx, my);
      var hovCard = hovered ? hovered.closest('.link-card') : null;
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var rect = card.getBoundingClientRect();
        var cx = rect.left + rect.width  / 2;
        var cy = rect.top  + rect.height / 2;
        if (card === hovCard) {
          // Tilt 3D en la card bajo el cursor
          var x = (mx - rect.left) / rect.width  - 0.5;
          var y = (my - rect.top)  / rect.height - 0.5;
          card.style.transform = 'translateY(-2px) rotateX(' + (-y * 6) + 'deg) rotateY(' + (x * 6) + 'deg)';
        } else {
          // Atracción magnética suave para cards cercanas
          var dx = mx - cx, dy = my - cy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            var s = (1 - dist / 140) * 0.11;
            card.style.transform = 'translate(' + (dx * s) + 'px,' + (dy * s * 0.7) + 'px)';
          } else {
            card.style.transform = '';
          }
        }
      }
    });
  });

  document.addEventListener('mouseleave', function(e) {
    var card = e.target.closest('.link-card');
    if (card) {
      var allCards = document.querySelectorAll('.link-card');
      for (var i = 0; i < allCards.length; i++) allCards[i].style.transform = '';
    }
  }, true);
}

// ── SCROLL REVEAL ──
var revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

function initReveal() {
  var els = document.querySelectorAll('.link-card, .actualmente');
  for (var i = 0; i < els.length; i++) {
    if (!els[i].classList.contains('fade-up') && !els[i].classList.contains('fade-up-card')) {
      els[i].classList.add('reveal');
      els[i].style.transitionDelay = (i * 0.05) + 's';
      revealObserver.observe(els[i]);
    }
  }
}
setTimeout(initReveal, 100);

// ── MODO TOGGLE ──
document.getElementById('mode-toggle').addEventListener('click', function(e) {
  var pill = e.target.closest('.mode-pill');
  if (pill) switchMode(pill.getAttribute('data-mode'));
});

// ── VISITED CARDS (click handler) ──
document.addEventListener('click', function(e) {
  var card = e.target.closest('.link-card[data-link-id]');
  if (!card) return;
  var lid = card.getAttribute('data-link-id');
  if (!lid) return;
  markVisited(lid);
  // Aplicar overlay inmediatamente (sin esperar a buildPage)
  if (!card.querySelector('.visited-overlay')) {
    var ov = document.createElement('div');
    ov.className = 'visited-overlay';
    card.style.position = 'relative';
    card.appendChild(ov);
  }
}, true);

// ── BOTÓN COMPARTIR (delegado) ──
document.addEventListener('click', function(e) {
  var shareBtn = e.target.closest('#share-btn');
  if (!shareBtn) return;
  var shareLabel = shareBtn.querySelector('#share-label');
  var base = CONFIG.siteUrl || window.location.origin;
  var url  = currentMode === 'pro' ? base + '#pro' : base;
  if (navigator.share) {
    navigator.share({ title: CONFIG.nombre, url: url });
  } else {
    navigator.clipboard.writeText(url).then(function() {
      shareBtn.classList.add('copied');
      shareLabel.textContent = '\u2713 Link copiado';
      setTimeout(function() {
        shareBtn.classList.remove('copied');
        shareLabel.textContent = 'Compartir p\u00e1gina';
      }, 2000);
    });
  }
});

// ── MOBILE SCROLL HERO ──
var _mheroActive = false;
var _mheroScrollFn = null;

function initMobileScrollHero() {
  // Limpiar listener previo si existía
  if (_mheroScrollFn) {
    window.removeEventListener('scroll', _mheroScrollFn, { passive: true });
    _mheroScrollFn = null;
  }
  _mheroActive = false;

  // Solo móvil (ambos modos)
  if (window.innerWidth >= 768) return;

  var app = document.getElementById('app');
  if (!app) return;

  // La foto grande solo aplica si el usuario está cerca del tope
  if (window.pageYOffset > 40) return;

  // ── Marcar la sección de perfil como hero ──────────────
  var profileEl = app.querySelector('.profile');
  if (!profileEl) return;

  // Crear wrapper hero que envuelve profile + actualmente
  var heroWrap = document.createElement('div');
  heroWrap.className = 'mob-hero';
  heroWrap.id = 'mob-hero-wrap';
  profileEl.parentNode.insertBefore(heroWrap, profileEl);
  heroWrap.appendChild(profileEl);
  var actEl = app.querySelector('#actualmente-el');
  if (actEl) heroWrap.appendChild(actEl);

  // Mover stats y share button al inicio de los links (fuera del hero)
  // ya que en móvil sin split, stats están dentro del .profile
  // → dejarlos donde están en la jerarquía del DOM

  // ── Blur scroll-driven en TODAS las tarjetas ───────────
  var allCards = app.querySelectorAll('.link-card');
  _mheroActive = true;

  function _updateCardBlur() {
    var viewH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    var cardH = allCards.length > 0 ? (allCards[0].offsetHeight || 70) : 70;
    var blurZone = cardH * 3; // 3 alturas de card = zona de transición

    for (var i = 0; i < allCards.length; i++) {
      var card = allCards[i];
      var rect = card.getBoundingClientRect();
      var distBelow = rect.top - viewH; // negativo = visible, positivo = debajo

      if (distBelow <= 0) {
        // Tarjeta visible — sin blur
        card.style.filter = '';
        card.style.opacity = '';
        card.style.pointerEvents = '';
      } else if (distBelow >= blurZone) {
        // Tarjeta bien debajo del viewport — blur completo
        card.style.filter = 'blur(8px)';
        card.style.opacity = '0.45';
        card.style.pointerEvents = 'none';
      } else {
        // Zona de transición: des-blurear progresivamente
        var ratio = distBelow / blurZone;
        card.style.filter = 'blur(' + (ratio * 8).toFixed(1) + 'px)';
        card.style.opacity = (1 - ratio * 0.55).toFixed(2);
        card.style.pointerEvents = ratio > 0.7 ? 'none' : '';
      }
    }
  }

  // ── Listener de scroll ─────────────────────────────────
  var _raf = false;
  _mheroScrollFn = function() {
    if (_raf) return;
    _raf = true;
    requestAnimationFrame(function() {
      _raf = false;
      var sy = window.pageYOffset || 0;
      var maxShrink = 140;
      var ratio = Math.min(sy / maxShrink, 1);
      var extra = Math.round((1 - ratio) * 34);
      document.documentElement.style.setProperty('--mhero-extra', extra + 'px');
      _updateCardBlur();
    });
  };
  window.addEventListener('scroll', _mheroScrollFn, { passive: true });

  // Disparar una vez para estado inicial
  _mheroScrollFn();
}

// Arrancar hero en carga inicial
setTimeout(initMobileScrollHero, 120);

// ── PYTHON CHIP: glitch aleatorio cada 7-15s para insinuar el easter egg ──
(function _schedulePyChipGlitch() {
  var delay = 7000 + Math.random() * 8000; // 7-15 segundos
  setTimeout(function() {
    var chips = document.querySelectorAll('.skill-chip');
    for (var i = 0; i < chips.length; i++) {
      if (chips[i].textContent.indexOf('Python') !== -1) {
        _scramble(chips[i]); // usa la misma función de letras locas
        break;
      }
    }
    _schedulePyChipGlitch(); // reprogramar
  }, delay);
})();
