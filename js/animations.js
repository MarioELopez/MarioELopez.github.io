// ══════════════════════════════════════════════════════
// ── GIROSCOPIO → partículas ──
// ══════════════════════════════════════════════════════
window._gyroX = 0; window._gyroY = 0;
if (typeof DeviceOrientationEvent !== 'undefined') {
  var _gyroPermission = false;
  function _initGyro() {
    window.addEventListener('deviceorientation', function(e) {
      // gamma = inclinación izquierda/derecha (-90 a 90)
      // beta  = inclinación frente/atrás (-180 a 180)
      window._gyroX = (e.gamma || 0) / 90 * 1.2;  // normalizado -1.2 a 1.2
      window._gyroY = Math.max(-1, Math.min(1, (e.beta  || 0) / 60));
    }, { passive: true });
  }
  // iOS 13+ requiere permiso explícito
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    document.addEventListener('touchend', function _reqGyro() {
      if (_gyroPermission) return;
      DeviceOrientationEvent.requestPermission().then(function(state) {
        if (state === 'granted') { _gyroPermission = true; _initGyro(); }
      }).catch(function() {});
      document.removeEventListener('touchend', _reqGyro);
    }, { once: true });
  } else {
    _initGyro();
  }
}

// ── PARTÍCULAS DE FONDO ──
(function() {
  var cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
  document.body.insertBefore(cv, document.body.firstChild);
  var cx = cv.getContext('2d');
  var W, H, pts;

  var COLORS = [
    'rgba(212,104,42,',   // naranja
    'rgba(232,146,77,',   // naranja claro
    'rgba(108,99,255,',   // violeta
    'rgba(167,139,250,',  // violeta claro
  ];

  function init() {
    W = cv.width  = window.innerWidth;
    H = cv.height = window.innerHeight;
    var N = Math.min(55, Math.floor(W * H / 14000));
    pts = [];
    for (var i = 0; i < N; i++) {
      pts.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r:  Math.random() * 2 + 1,
        c:  COLORS[Math.floor(Math.random() * COLORS.length)],
        o:  Math.random() * 0.18 + 0.1
      });
    }
  }

  function draw() {
    cx.clearRect(0, 0, W, H);
    // Líneas entre partículas cercanas
    for (var i = 0; i < pts.length; i++) {
      for (var j = i + 1; j < pts.length; j++) {
        var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 130) {
          cx.beginPath();
          cx.strokeStyle = 'rgba(212,104,42,' + (0.14 * (1 - dist/130)) + ')';
          cx.lineWidth = 0.7;
          cx.moveTo(pts[i].x, pts[i].y);
          cx.lineTo(pts[j].x, pts[j].y);
          cx.stroke();
        }
      }
    }
    // Puntos
    for (var k = 0; k < pts.length; k++) {
      var p = pts[k];
      p.x += p.vx + (window._gyroX || 0) * 0.4;
      p.y += p.vy + (window._gyroY || 0) * 0.4;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      cx.beginPath();
      cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      cx.fillStyle = p.c + p.o + ')';
      cx.fill();
    }
    requestAnimationFrame(draw);
  }

  init();
  window.addEventListener('resize', init);
  draw();
})();

// ── GLITCH EFFECT ──
var _glitchCount = 0, _glitchTimer = null;
function triggerGlitch(callback) {
  document.body.classList.add('glitch-fx');
  setTimeout(function() {
    document.body.classList.remove('glitch-fx');
    if (callback) callback();
  }, 420);
}

// ── MATRIX RAIN ───────────────────────────────────────────────────────
var _matrixRunning = false;
function _runMatrix() {
  if (_matrixRunning) { _tPrint(_tLine('[matrix ya está corriendo]', 'ts')); return; }
  _matrixRunning = true;
  var COLS = 42, ROWS = 14;
  var chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789MARIO'.split('');
  var grid = [];
  var drops = [];
  for (var ci = 0; ci < COLS; ci++) {
    drops[ci] = Math.floor(Math.random() * ROWS);
    grid.push(new Array(ROWS).fill(' '));
  }
  var out = document.getElementById('t-out');
  var placeholder = document.createElement('pre');
  placeholder.className = 'matrix-block';
  placeholder.style.cssText = 'margin:4px 0;font-size:0.7em;line-height:1.2;color:#0f0;';
  if (out) out.appendChild(placeholder);
  var frames = 0, maxFrames = 48;
  var iv = setInterval(function() {
    for (var c = 0; c < COLS; c++) {
      for (var r = ROWS - 1; r > 0; r--) grid[c][r] = grid[c][r-1];
      grid[c][0] = Math.random() > 0.5 ? chars[Math.floor(Math.random()*chars.length)] : ' ';
    }
    var lines = [];
    for (var r = 0; r < ROWS; r++) {
      lines.push(grid.map(function(col) { return col[r]; }).join(''));
    }
    placeholder.textContent = lines.join('\n');
    if (out) out.scrollTop = out.scrollHeight;
    frames++;
    if (frames >= maxFrames) {
      clearInterval(iv);
      _matrixRunning = false;
      placeholder.style.color = '#0f06';
      setTimeout(function() {
        if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
        _tPrint(_tLine('[wake up, mario...]', 'ts'));
      }, 600);
    }
  }, 80);
}
