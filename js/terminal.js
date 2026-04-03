// ══════════════════════════════════════════════════════
// ── TERMINAL EASTER EGG ──
// ══════════════════════════════════════════════════════
var _termOpen = false;
var _termHistory = [], _termHistIdx = -1;
var _pythonMode = false;

var _termFS = {
  'README.md':      'Mario E. López C. — Portafolio personal\nIngeniería Industrial · Santa Cruz, Bolivia\nVersión: 2.0.0-easter-egg',
  'config.js':      '[archivo de configuración — edita este para actualizar links y datos]',
  'FOTO_PERFIL.jpg':'[imagen binaria — no disponible en terminal 😄]',
  'strava.json':    function() {
    return '{\n  "km_alltime": "ver página principal",\n  "ultima_actividad": "ENFRIAMIENTO ELECTORAL",\n  "velocidad": "16.9 km/h"\n}';
  },
};

// ── BASE DE DATOS RELACIONAL (alasql) ────────────────────────────────────────
// Tablas: perfil, experiencia, proyectos, habilidades, educacion, contacto, logros
var _sqlReady = false, _sqlLoading = false;

var _sqlData = {
  perfil: [
    { id:1, campo:'nombre',     valor:'Mario Eduardo López Cáceres' },
    { id:2, campo:'alias',      valor:'Mario E. López C.'           },
    { id:3, campo:'titulo',     valor:'Ingeniero Industrial'         },
    { id:4, campo:'ciudad',     valor:'Santa Cruz de la Sierra'      },
    { id:5, campo:'pais',       valor:'Bolivia'                      },
    { id:6, campo:'sitio',      valor:'marioelopez.github.io'        },
    { id:7, campo:'edad',       valor:String(_calcAge()) + ' años'   },
  ],
  experiencia: [
    { id:1, tipo:'académico',   area:'Ingeniería Industrial',   institucion:'UAGRM',            inicio:2019, fin:null,  estado:'activo'      },
    { id:2, tipo:'autodidacta', area:'Python / Automatización', institucion:'Self',              inicio:2021, fin:null,  estado:'activo'      },
    { id:3, tipo:'profesional', area:'Análisis de datos',       institucion:'Power BI & Excel',  inicio:2022, fin:null,  estado:'activo'      },
    { id:4, tipo:'académico',   area:'Lean Manufacturing',      institucion:'UAGRM',            inicio:2022, fin:2024, estado:'completado'  },
    { id:5, tipo:'personal',    area:'Desarrollo web',          institucion:'Proyecto personal', inicio:2025, fin:null,  estado:'activo'      },
  ],
  proyectos: [
    { id:1, nombre:'Portafolio v2',        stack:'HTML/CSS/JS', anio:2026, estado:'producción',  url:'marioelopez.github.io' },
    { id:2, nombre:'Automatización Excel', stack:'Python/VBA',  anio:2022, estado:'completo',    url:'privado'               },
    { id:3, nombre:'Dashboard Power BI',   stack:'Power BI',    anio:2023, estado:'completo',    url:'uso interno'           },
    { id:4, nombre:'Proyecto de grado',    stack:'Python/ML',   anio:2025, estado:'en progreso', url:'UAGRM — WIP'           },
  ],
  habilidades: [
    { id:1, nombre:'Python',             categoria:'programación', nivel:4, estrellas:'★★★★☆' },
    { id:2, nombre:'Power BI',           categoria:'datos',        nivel:4, estrellas:'★★★★☆' },
    { id:3, nombre:'Excel / VBA',        categoria:'datos',        nivel:5, estrellas:'★★★★★' },
    { id:4, nombre:'Lean Manufacturing', categoria:'ingeniería',   nivel:4, estrellas:'★★★★☆' },
    { id:5, nombre:'SQL',                categoria:'datos',        nivel:3, estrellas:'★★★☆☆' },
    { id:6, nombre:'HTML/CSS/JS',        categoria:'web',          nivel:3, estrellas:'★★★☆☆' },
    { id:7, nombre:'Inglés',             categoria:'idioma',       nivel:4, estrellas:'★★★★☆' },
    { id:8, nombre:'Git / GitHub',       categoria:'dev',          nivel:3, estrellas:'★★★☆☆' },
    { id:9, nombre:'Duolingo (inglés)',  categoria:'idioma',       nivel:3, estrellas:'★★★☆☆' },
  ],
  educacion: [
    { id:1, institucion:'UAGRM',    titulo:'Ingeniería Industrial', nivel:'universitario', inicio:2019, fin:null,  estado:'activo'    },
    { id:2, institucion:'Duolingo', titulo:'Inglés B2',             nivel:'idioma',        inicio:2024, fin:null,  estado:'activo'    },
    { id:3, institucion:'Colegio',  titulo:'Bachiller',             nivel:'secundario',    inicio:2012, fin:2018, estado:'completo'  },
  ],
  contacto: [
    { id:1, red:'GitHub',    handle:'MarioELopez',        url:'github.com/MarioELopez'           },
    { id:2, red:'LinkedIn',  handle:'marioelopezc',       url:'linkedin.com/in/marioelopezc'      },
    { id:3, red:'Instagram', handle:'marioelopez2011',    url:'instagram.com/marioelopez2011'     },
    { id:4, red:'Spotify',   handle:'mario',              url:'open.spotify.com/user/mario'       },
    { id:5, red:'Discord',   handle:'ver portafolio',     url:'marioelopez.github.io'             },
    { id:6, red:'Duolingo',  handle:'mario_elopez',       url:'duolingo.com/mario_elopez'         },
  ],
  logros: [
    { id:1, titulo:'Nacer en Santa Cruz, Bolivia',     tipo:'vita',       anio:2000 },
    { id:2, titulo:'Graduarse del colegio',            tipo:'académico',  anio:2018 },
    { id:3, titulo:'Ingreso a UAGRM',                  tipo:'académico',  anio:2019 },
    { id:4, titulo:'Primer script Python real',        tipo:'tech',       anio:2021 },
    { id:5, titulo:'1,800+ km en bicicleta',           tipo:'deporte',    anio:2023 },
    { id:6, titulo:'Racha Duolingo iniciada',          tipo:'idioma',     anio:2024 },
    { id:7, titulo:'Proyecto de grado iniciado',       tipo:'académico',  anio:2025 },
    { id:8, titulo:'Portafolio v2 lanzado con EE',     tipo:'tech',       anio:2026 },
  ],
};

// Renderiza array de objetos como tabla ASCII
function _sqlTable(rows) {
  if (!rows || rows.length === 0) return '(0 rows)';
  var cols = Object.keys(rows[0]);
  var MAX_W = 26;
  var widths = {};
  cols.forEach(function(c) { widths[c] = Math.min(MAX_W, c.length); });
  rows.forEach(function(r) {
    cols.forEach(function(c) {
      var v = (r[c] === null || r[c] === undefined) ? 'NULL' : String(r[c]);
      widths[c] = Math.min(MAX_W, Math.max(widths[c], v.length));
    });
  });
  function pad(s, w) {
    s = (s === null || s === undefined) ? 'NULL' : String(s);
    if (s.length > w) s = s.substring(0, w - 1) + '…';
    return s.padEnd(w);
  }
  var sep = '+' + cols.map(function(c) { return '-'.repeat(widths[c] + 2); }).join('+') + '+';
  var hdr = '| ' + cols.map(function(c) { return pad(c, widths[c]); }).join(' | ') + ' |';
  var body = rows.map(function(r) {
    return '| ' + cols.map(function(c) { return pad(r[c], widths[c]); }).join(' | ') + ' |';
  });
  return [sep, hdr, sep].concat(body).concat([sep]).join('\n') +
         '\n(' + rows.length + ' row' + (rows.length !== 1 ? 's' : '') + ')';
}

function _initSqlDb() {
  if (_sqlReady) return;
  _sqlReady = true;
  Object.keys(_sqlData).forEach(function(t) {
    try { alasql('DROP TABLE IF EXISTS ' + t); } catch(e) {}
    alasql('CREATE TABLE ' + t);
    alasql.tables[t].data = _sqlData[t].map(function(r) {
      var copy = {}; Object.keys(r).forEach(function(k) { copy[k] = r[k]; }); return copy;
    });
  });
}

function _execSql(cmd) {
  if (/^show\s+tables/i.test(cmd.trim())) {
    _tPrint(_tLine('Tablas en mario_portfolio.db:', 'th'));
    Object.keys(_sqlData).forEach(function(t) {
      _tPrint(_tLine('  · ' + t + ' (' + _sqlData[t].length + ' rows)', 'tc'));
    });
    _tPrint(_tLine('Prueba: SELECT * FROM habilidades WHERE nivel > 3', 'ts'));
    return;
  }
  if (/^describe\s+(\w+)/i.test(cmd.trim())) {
    var m = cmd.match(/^describe\s+(\w+)/i);
    var tbl = m[1].toLowerCase();
    if (!_sqlData[tbl]) { _tPrint(_tLine('Tabla "' + tbl + '" no existe.', 'te')); return; }
    var cols = Object.keys(_sqlData[tbl][0] || {});
    _tPrint(_tLine('Columnas de ' + tbl + ':', 'th'));
    cols.forEach(function(c) {
      var sample = _sqlData[tbl][0][c];
      _tPrint(_tLine('  ' + c.padEnd(14) + typeof sample, 'tc'));
    });
    return;
  }
  try {
    _initSqlDb();
    var result = alasql(cmd);
    if (Array.isArray(result)) {
      if (result.length === 0) {
        _tPrint(_tLine('(0 rows)', 'ts'));
      } else {
        _tPrint(_tLine(_sqlTable(result), 'th'));
      }
    } else {
      _tPrint(_tLine('→ ' + JSON.stringify(result), 'ts'));
    }
  } catch(e) {
    var msg = (e.message || String(e)).split('\n')[0].substring(0, 80);
    _tPrint(_tLine('SQL Error: ' + msg, 'te'));
  }
}

function _loadAlaSql(cb) {
  if (window.alasql) { cb(); return; }
  if (_sqlLoading) { setTimeout(function() { _loadAlaSql(cb); }, 200); return; }
  _sqlLoading = true;
  _tPrint(_tLine('Cargando alasql...', 'ts'));
  var sc = document.createElement('script');
  sc.src = 'https://cdn.jsdelivr.net/npm/alasql@4/dist/alasql.min.js';
  sc.onload  = function() { _sqlLoading = false; _tPrint(_tLine('alasql v4 listo — mario_portfolio.db conectada', 'ts')); cb(); };
  sc.onerror = function() { _sqlLoading = false; _tPrint(_tLine('Error cargando alasql. ¿Hay conexión?', 'te')); };
  document.head.appendChild(sc);
}

// Compatibilidad con código anterior que usaba _sqlTables
var _sqlTables = {};

var _gitLog = [
  { hash: 'a1b2c3d', msg: 'feat: nacer en Santa Cruz, Bolivia                [2000]' },
  { hash: 'b2c3d4e', msg: 'chore: sobrevivir el colegio                       [2018]' },
  { hash: 'c3d4e5f', msg: 'feat: iniciar Ingeniería Industrial en UAGRM       [2019]' },
  { hash: 'd4e5f6a', msg: 'feat: aprender Python + automatización             [2021]' },
  { hash: 'e5f6a7b', msg: 'feat: completar 1,800+ km en bici                  [2023]' },
  { hash: 'f6a7b8c', msg: 'feat: iniciar racha Duolingo (Inglés)              [2024]' },
  { hash: 'g7b8c9d', msg: 'wip: proyecto de grado en Ingeniería Industrial    [2025]' },
  { hash: 'h8c9d0e', msg: 'feat: lanzar este portafolio v2 con easter eggs   [2026]' },
];

function _tPrint(html) {
  var out = document.getElementById('t-out');
  if (!out) return;
  out.innerHTML += html + '\n';
  out.scrollTop = out.scrollHeight;
}

function _tLine(text, cls) {
  var safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return '<span' + (cls ? ' class="' + cls + '"' : '') + '>' + safe + '</span>';
}

// ── LAUNCHER DEL JUEGO SQL — transforma la terminal existente ────────────────
var _sqlGameActive = false;
var _sqlGameEngine = null;   // referencia para cleanup

function _launchSqlGame() {
  if (_sqlGameActive) {
    _tPrint(_tLine('El juego ya está activo. Escribe "salir" para terminarlo.', 'tc'));
    return;
  }

  _tPrint(_tLine('', ''));
  _tPrint(_tLine('▶ SQL Planta — El Juego', 'ts'));
  _tPrint(_tLine('  Cargando módulos...', 'tc'));

  // Cargar CSS del juego una sola vez
  if (!document.getElementById('sql-game-css')) {
    var cssEl = document.createElement('link');
    cssEl.id   = 'sql-game-css';
    cssEl.rel  = 'stylesheet';
    cssEl.href = './sql-game/css/game.css';
    document.head.appendChild(cssEl);
  }

  // Garantizar que alasql esté disponible antes de cargar el juego
  // (el portafolio lo carga de forma lazy; aquí lo forzamos si no está)
  function _ensureAlaSql(cb) {
    if (window.alasql) { cb(); return; }
    var sc = document.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/npm/alasql@4/dist/alasql.min.js';
    sc.onload  = function() { cb(); };
    sc.onerror = function() { _tPrint(_tLine('Error cargando alasql — sin conexión?', 'te')); };
    document.head.appendChild(sc);
  }

  // Scripts a cargar en orden (sin sql.js ni fetch — todo funciona en file://)
  var _scripts = [
    { src: './sql-game/js/analyzer.js',    skip: function() { return !!window.QueryAnalyzer; } },
    { src: './sql-game/js/simulator.js',   skip: function() { return !!window.WeightSimulator; } },
    { src: './sql-game/js/terminal.js',    skip: function() { return !!window.Terminal; } },
    { src: './sql-game/js/character.js',   skip: function() { return !!window.Character; } },
    { src: './sql-game/js/achievements.js',skip: function() { return !!window.AchievementSystem; } },
    { src: './sql-game/js/missions.js',    skip: function() { return !!window.MISSIONS; } },
    { src: './sql-game/js/validator.js',   skip: function() { return !!window.MissionValidator; } },
    { src: './sql-game/data.js',           skip: function() { return !!window.GAME_DB_SETUP; } },
    { src: './sql-game/js/db.js',          skip: function() { return !!window.GameDB; } },
    { src: './sql-game/js/engine.js',      skip: function() { return !!window.GameEngine; } },
  ];

  function _loadNext(i) {
    if (i >= _scripts.length) { _activateGameMode(); return; }
    var entry = _scripts[i];
    if (entry.skip && entry.skip()) { _loadNext(i + 1); return; }
    var s = document.createElement('script');
    s.src = entry.src;
    s.onload  = function() { _loadNext(i + 1); };
    s.onerror = function() {
      _tPrint(_tLine('Error cargando: ' + entry.src.split('/').pop(), 'te'));
    };
    document.head.appendChild(s);
  }

  // Primero asegurar alasql, luego cargar scripts del juego
  _ensureAlaSql(function() { _loadNext(0); });
}

function _activateGameMode() {
  var outEl  = document.getElementById('t-out');
  var inpEl  = document.getElementById('t-input');
  var prmEl  = document.getElementById('t-prompt');
  var termEl = document.getElementById('ml-terminal');
  var barEl  = document.getElementById('t-bar');

  // Limpiar la terminal y entrar en modo juego
  outEl.innerHTML = '';
  _sqlGameActive = true;

  // Guardar estado y actualizar título
  var _titleEl   = termEl.querySelector('.t-title');
  var _origTitle = _titleEl ? _titleEl.textContent : '';
  if (_titleEl) _titleEl.textContent = 'PLANTADB v2.4.1 — Planta Industrial S.A.';

  // Inyectar panel de personaje (usa IDs del juego → game.css los estiliza)
  var charPanel = document.createElement('div');
  charPanel.id = 'character-panel';
  charPanel.innerHTML =
    '<div id="mission-info">' +
      '<div id="level-badge">NIVEL 0</div>' +
      '<div id="mission-title">Iniciando sistema...</div>' +
      '<div id="mission-progress"><div id="mission-dots"></div></div>' +
    '</div>' +
    '<div id="character-area">' +
      '<div id="character-sprite" class="sprite-f1 state-neutral"></div>' +
    '</div>' +
    '<div id="dialog-box" class="hidden">' +
      '<div id="dialog-character-name">Supervisora</div>' +
      '<div id="dialog-text"></div>' +
      '<div id="dialog-continue">\u25bc</div>' +
    '</div>' +
    '<div id="stats-panel">' +
      '<div class="stat"><span class="stat-label">Puntos</span><span class="stat-value" id="score">0</span></div>' +
      '<div class="stat"><span class="stat-label">Precisi\u00f3n</span><span class="stat-value" id="accuracy">\u2014</span></div>' +
    '</div>' +
    '<div id="hint-btn-panel">' +
      '<button id="hint-btn" title="Pedir pista a Neysa">\uD83D\uDCA1 Pedir pista</button>' +
    '</div>' +
    '<div id="achievements-panel">' +
      '<div id="achievements-title">Logros</div>' +
      '<div id="achievements-list"></div>' +
    '</div>';
  termEl.appendChild(charPanel);

  // Inyectar overlay del simulador de peso
  var weightEl = document.createElement('div');
  weightEl.id = 'weight-overlay';
  weightEl.className = 'hidden';
  weightEl.innerHTML =
    '<div id="weight-content">' +
      '<div id="weight-title">Ejecutando consulta...</div>' +
      '<div id="weight-progress-bar"><div id="weight-progress-fill"></div></div>' +
      '<div id="weight-stats">' +
        '<span id="weight-rows">Filas procesadas: 0</span>' +
        '<span id="weight-memory">Memoria: 0 MB</span>' +
      '</div>' +
      '<div id="weight-message"></div>' +
    '</div>';
  termEl.appendChild(weightEl);

  // Inyectar contenedor de la pila de logros (reemplaza el popup único)
  var achEl = document.createElement('div');
  achEl.id = 'achievement-stack';
  document.body.appendChild(achEl);  // Va en body para no quedar limitado por el grid

  // Activar CSS grid de modo juego
  termEl.classList.add('sql-game-mode');

  // Referencias para cleanup limpio
  var _gameTerminalRef  = null;
  var _gameCharacterRef = null;

  // Función de salida — limpia TODO para no contaminar el portfolio
  function _exitGame() {
    if (!_sqlGameActive) return;
    _sqlGameActive = false;

    // 1. Detener engine (evita listeners zombie en _onInput)
    if (_sqlGameEngine) { _sqlGameEngine._stopped = true; _sqlGameEngine = null; }

    // 2. Destruir Terminal del juego → remueve keydown de #t-input
    if (_gameTerminalRef) { _gameTerminalRef.destroy(); _gameTerminalRef = null; }

    // 3. Destruir Character → remueve keydown de document
    if (_gameCharacterRef) { _gameCharacterRef.destroy(); _gameCharacterRef = null; }

    // 4. Quitar clase de grid
    termEl.classList.remove('sql-game-mode');

    // 5. Eliminar elementos inyectados
    var cp = document.getElementById('character-panel');
    var wo = document.getElementById('weight-overlay');
    var as = document.getElementById('achievement-stack');
    if (cp) cp.remove();
    if (wo) wo.remove();
    if (as) as.remove();

    // 6. Eliminar game.css — esto revierte TODOS los estilos globales del juego
    //    (font-family, colores, etc.) y restaura el portfolio intacto
    var gameCss = document.getElementById('sql-game-css');
    if (gameCss) gameCss.remove();

    // 7. Restaurar estado de la terminal del portfolio
    if (_titleEl) _titleEl.textContent = _origTitle;
    outEl.innerHTML = '';
    prmEl.textContent = 'mario@portfolio:~$ ';
    inpEl.disabled = false;
    inpEl.placeholder = 'escribe un comando...';

    window.removeEventListener('sql-game-exit', _exitGame);
    _tPrint(_tLine('← Saliste de SQL Planta. De vuelta en el portafolio.', 'tc'));
    _tPrint(_tLine('', ''));
    setTimeout(function() { inpEl.focus(); }, 50);
  }

  window.addEventListener('sql-game-exit', _exitGame);

  // Inicializar motor del juego
  try {
    var gameTerminal = new Terminal(outEl, inpEl, prmEl);
    _gameTerminalRef = gameTerminal;   // guardar ref para destroy()

    var gameCharacter = new Character(
      document.getElementById('character-sprite'),
      document.getElementById('dialog-character-name'),
      document.getElementById('dialog-text'),
      document.getElementById('dialog-box'),
      document.getElementById('dialog-continue')
    );
    _gameCharacterRef = gameCharacter;  // guardar ref para destroy()

    AchievementSystem.init({});  // stack DOM creado automáticamente por achievements.js

    var simElements = {
      overlayEl: document.getElementById('weight-overlay'),
      titleEl:   document.getElementById('weight-title'),
      fillEl:    document.getElementById('weight-progress-fill'),
      rowsEl:    document.getElementById('weight-rows'),
      memoryEl:  document.getElementById('weight-memory'),
      messageEl: document.getElementById('weight-message'),
    };

    var engine = new GameEngine({
      terminal:       gameTerminal,
      character:      gameCharacter,
      simElements:    simElements,
      scoreEl:        document.getElementById('score'),
      accuracyEl:     document.getElementById('accuracy'),
      levelBadgeEl:   document.getElementById('level-badge'),
      missionTitleEl: document.getElementById('mission-title'),
      dotsEl:         document.getElementById('mission-dots'),
    });

    _sqlGameEngine = engine;
    engine.start();

    // Botón de pista visual — delega al sistema de pistas del engine
    var hintBtn = document.getElementById('hint-btn');
    if (hintBtn) {
      hintBtn.addEventListener('click', function() {
        if (_sqlGameEngine) {
          gameTerminal.printCommand('pista');
          _sqlGameEngine._handleSystemCommand('pista');
        }
      });
    }

  } catch(err) {
    _tPrint(_tLine('Error iniciando el juego: ' + (err.message || err), 'te'));
    _exitGame();
  }
}

function _execCmd(raw) {
  var cmd = raw.trim();
  // En modo Python permitir línea vacía (señal para ejecutar bloque)
  if (!cmd && !_pythonMode) return;
  if (cmd) { _termHistory.unshift(cmd); _termHistIdx = -1; }

  // ── Comandos globales: funcionan incluso en modo Python ──────────────
  var _first = cmd.toLowerCase().split(/\s+/)[0];
  if (_first === 'juego' || _first === 'sql-game' || _first === 'game') {
    var promptStrG = _pythonMode ? (_pyIndentDepth > 0 ? '... ' : '>>> ') : 'mario@portfolio:~$ ';
    _tPrint(_tLine(promptStrG + cmd, 'tp'));
    if (_pythonMode) _exitPythonMode();
    _launchSqlGame();
    return;
  }

  // Cuando el juego SQL está activo, solo el GameEngine procesa el input
  if (_sqlGameActive) return;

  var promptStr = _pythonMode ? (_pyIndentDepth > 0 ? '... ' : '>>> ') : 'mario@portfolio:~$ ';
  _tPrint(_tLine(promptStr + (cmd || ''), 'tp'));
  // Actualizar el label visible del prompt
  var pEl = document.getElementById('t-prompt');
  if (pEl) pEl.textContent = promptStr;

  if (_pythonMode) {
    // Salir de Python
    if (cmd === 'exit()' || cmd === 'quit()') {
      _exitPythonMode();
      return;
    }

    // Línea vacía → si hay bloque acumulado, ejecutarlo
    if (cmd === '') {
      if (_pyIndentDepth > 0 && _pythonBuffer.trim()) {
        var block = _pythonBuffer;
        _pythonBuffer = '';
        _pyIndentDepth = 0;
        _updatePyPrompt(0);
        _runSkulpt(block);
      }
      return;
    }

    // Detectar apertura de bloque (línea termina en :)
    var stripped = cmd.replace(/#.*$/, '').trimRight();
    if (/:\s*$/.test(stripped)) {
      _pyIndentDepth++;
    }
    // Detectar cierre de bloque por des-indentación (vuelta a col 0 sin abrir nuevo bloque)
    else if (_pyIndentDepth > 0 && cmd.length > 0 && !/^\s/.test(cmd) && !/:\s*$/.test(stripped)) {
      // Línea sin indentación dentro de bloque = cierre implícito → acumular y ejecutar al blank
      // (comportamiento real de Python REPL)
    }

    _pythonBuffer += cmd + '\n';

    if (_pyIndentDepth === 0) {
      // Línea simple (sin bloque) → ejecutar de inmediato
      var code = _pythonBuffer;
      _pythonBuffer = '';
      _runSkulpt(code);
    } else {
      // Dentro de bloque → seguir acumulando, mostrar ...
      _updatePyPrompt(_pyIndentDepth);
    }
    return;
  }

  // SQL completo (alasql): SELECT/INSERT/UPDATE/DELETE/SHOW/DESCRIBE/JOIN/WHERE…
  if (/^(select|show|describe|insert|update|delete|create|drop|alter)\b/i.test(cmd)) {
    var _doSql = function() { _execSql(cmd); };
    if (window.alasql) { _doSql(); } else { _loadAlaSql(_doSql); }
    return;
  }

  switch(cmd.toLowerCase().split(' ')[0]) {
    case 'help':
      _tPrint(_tLine('Comandos disponibles:', 'th'));
      _tPrint(_tLine('  help                       → esta ayuda', 'tc'));
      _tPrint(_tLine('  ls                         → listar archivos', 'tc'));
      _tPrint(_tLine('  cat <archivo>              → leer archivo', 'tc'));
      _tPrint(_tLine('  whoami                     → neofetch del autor', 'tc'));
      _tPrint(_tLine('  skills                     → ver habilidades', 'tc'));
      _tPrint(_tLine('  git log                    → historia de vida', 'tc'));
      _tPrint(_tLine('  git status / branch        → estado del repo', 'tc'));
      _tPrint(_tLine('  git checkout <modo>        → cambiar a pro/casual', 'tc'));
      _tPrint(_tLine('  SHOW TABLES                → listar tablas SQL', 'tc'));
      _tPrint(_tLine('  DESCRIBE <tabla>           → columnas de una tabla', 'tc'));
      _tPrint(_tLine('  SELECT * FROM <tabla>      → consulta SQL (alasql)', 'tc'));
      _tPrint(_tLine('  SELECT … WHERE/JOIN/ORDER  → SQL completo soportado', 'tc'));
      _tPrint(_tLine('  juego                      → SQL Planta: El Juego 🎮', 'tc'));
      _tPrint(_tLine('  python                     → REPL Python real (Pyodide)', 'tc'));
      _tPrint(_tLine('  nano [archivo.py]          → editor de código con output panel', 'tc'));
      _tPrint(_tLine('  run <archivo.py>           → ejecutar archivo guardado', 'tc'));
      _tPrint(_tLine('  reset                      → limpiar pantalla + sesión Python', 'tc'));
      _tPrint(_tLine('  matrix                     → matrix rain 🟩', 'tc'));
      _tPrint(_tLine('  theme <dark|hacker|amber>  → cambiar tema', 'tc'));
      _tPrint(_tLine('  clear                      → limpiar pantalla', 'tc'));
      _tPrint(_tLine('  exit / ESC                 → cerrar terminal', 'tc'));
      break;
    case 'ls':
      var pyFiles = Object.keys(_termFS).filter(function(k) { return /\.py$/.test(k); });
      var staticFiles = 'README.md  config.js  FOTO_PERFIL.jpg  strava.json';
      var output = staticFiles + (pyFiles.length ? '  ' + pyFiles.join('  ') : '');
      _tPrint(_tLine(output, 'th'));
      if (pyFiles.length) _tPrint(_tLine('(' + pyFiles.length + ' archivo(s) Python guardado(s) en sesión)', 'ts'));
      break;
    case 'cat':
      var fname = cmd.split(/\s+/).slice(1).join(' ');
      if (!fname) { _tPrint(_tLine('uso: cat <archivo>', 'te')); break; }
      if (_termFS[fname]) {
        var content = typeof _termFS[fname] === 'function' ? _termFS[fname]() : _termFS[fname];
        _tPrint(_tLine(content, ''));
      } else {
        _tPrint(_tLine('cat: ' + fname + ': No existe el archivo', 'te'));
      }
      break;
    case 'whoami': {
      var _duoDays = Math.round((new Date() - new Date('2024-01-25')) / 86400000);
      var _narrow  = window.innerWidth < 520;
      if (_narrow) {
        // Versión compacta para pantallas pequeñas
        _tPrint(_tLine('mario@portfolio', 'th'));
        _tPrint(_tLine('─────────────────────────', 'th'));
        _tPrint(_tLine('OS:      Santa Cruz, Bolivia 🇧🇴', 'th'));
        _tPrint(_tLine('Shell:   vida.sh v' + _calcAge() + '.0', 'th'));
        _tPrint(_tLine('Carrera: Ing. Industrial · UAGRM', 'th'));
        _tPrint(_tLine('Stack:   Python · Power BI · Excel', 'th'));
        _tPrint(_tLine('Duolingo: 🦉 ' + _duoDays + ' días', 'th'));
        _tPrint(_tLine('GitHub:  MarioELopez', 'th'));
      } else {
        // Versión completa neofetch para pantallas más anchas
        _tPrint(_tLine('', ''));
        _tPrint(_tLine('   ███╗   ███╗    mario@portfolio', 'th'));
        _tPrint(_tLine('   ████╗ ████║    ─────────────────────────────────', 'th'));
        _tPrint(_tLine('   ██╔████╔██║    OS:      Santa Cruz, Bolivia 🇧🇴', 'th'));
        _tPrint(_tLine('   ██║╚██╔╝██║    Shell:   vida.sh v' + _calcAge() + '.0', 'th'));
        _tPrint(_tLine('   ██║ ╚═╝ ██║    Carrera: Ing. Industrial · UAGRM', 'th'));
        _tPrint(_tLine('   ╚═╝     ╚═╝    Stack:   Python · Power BI · Excel · VBA', 'th'));
        _tPrint(_tLine('                  Duolingo: 🦉 ' + _duoDays + ' días de racha', 'th'));
        _tPrint(_tLine('                  Activo:   proyecto de grado [WIP]', 'th'));
        _tPrint(_tLine('                  GitHub:   github.com/MarioELopez', 'th'));
        _tPrint(_tLine('', ''));
        _tPrint(_tLine('                  ■■■ dark  ■■■ orange  ■■■ green  ■■■ muted', 'tc'));
        _tPrint(_tLine('', ''));
      }
      break;
    }
    case 'skills':
      var sks = (CONFIG.modos[currentMode].skills || CONFIG.skills || []);
      _tPrint(_tLine(sks.map(function(s){ return s.icono + ' ' + s.nombre; }).join('  '), 'th'));
      break;
    case 'git':
      var sub = cmd.split(/\s+/)[1] || '';
      if (sub === 'log') {
        _tPrint(_tLine('commit history — mario/vida.git', 'ts'));
        _gitLog.forEach(function(c) {
          _tPrint(_tLine('commit ' + c.hash, 'th') + ' ' + _tLine(c.msg, ''));
        });
      } else if (sub === 'status') {
        _tPrint(_tLine('On branch ' + currentMode, 'th'));
        _tPrint(_tLine('nothing to commit, working tree clean ✓', 'tc'));
        _tPrint(_tLine('(proyecto de grado: 1 archivo sin push)', 'ts'));
      } else if (sub === 'branch') {
        _tPrint(_tLine('* ' + currentMode, 'th'));
        _tPrint(_tLine('  ' + (currentMode === 'pro' ? 'casual' : 'pro'), ''));
      } else if (sub === 'checkout') {
        var target = cmd.split(/\s+/)[2] || '';
        if (target === 'pro' || target === 'casual') {
          _tPrint(_tLine("Switched to branch '" + target + "'", 'th'));
          setTimeout(function() { closeTerminal(); switchMode(target); }, 600);
        } else {
          _tPrint(_tLine("error: pathspec '" + target + "' no coincide con ninguna rama conocida", 'te'));
          _tPrint(_tLine('Ramas válidas: pro, casual', 'tc'));
        }
      } else {
        _tPrint(_tLine("git: '" + sub + "' no es un comando git conocido aquí", 'te'));
      }
      break;
    case 'juego':
    case 'sql-game':
    case 'game':
      // Interceptado antes del switch — este bloque no debería alcanzarse
      _launchSqlGame();
      break;
    case 'nano':
    case 'edit':
    case 'vim':
    case 'vi': {
      var edFile = cmd.split(/\s+/).slice(1).join(' ').trim() || 'script.py';
      if (!/\.py$/.test(edFile)) edFile += '.py';
      if (!_skulptLoaded) {
        _loadSkulpt(function() {});  // pre-cargar Skulpt en background
      }
      _openEditor(edFile);
      _tPrint(_tLine('Abriendo editor: ' + edFile + ' (Ctrl+Enter: Run · Ctrl+S: Save · Ctrl+W: Close)', 'ts'));
      break;
    }
    case 'run': {
      var runFile = cmd.split(/\s+/).slice(1).join(' ').trim();
      if (!runFile) { _tPrint(_tLine('uso: run <archivo.py>', 'te')); break; }
      if (!/\.py$/.test(runFile)) runFile += '.py';
      var src = _termFS[runFile];
      if (!src) { _tPrint(_tLine('Error: archivo "' + runFile + '" no encontrado. Usa "ls" para ver archivos.', 'te')); break; }
      var code = typeof src === 'function' ? src() : src;
      _tPrint(_tLine('─── python ' + runFile + ' ───', 'ts'));
      if (!_skulptLoaded) {
        _loadSkulpt(function() { _runSkulpt(code); });
        _tPrint(_tLine('Cargando Python...', 'ts'));
      } else {
        _runSkulpt(code);
      }
      break;
    }
    case 'reset':
      document.getElementById('t-out').innerHTML = '';
      _pythonBuffer  = '';
      _pyIndentDepth = 0;
      _pySessionCode = '';
      _pythonMode    = false;
      var pReset = document.getElementById('t-prompt');
      if (pReset) pReset.textContent = 'mario@portfolio:~$ ';
      _tPrint(_tLine('Terminal y sesión Python reiniciadas.', 'ts'));
      break;
    case 'matrix':
      _runMatrix();
      break;
    case 'theme':
      var themeArg = cmd.split(/\s+/)[1] || '';
      _applyTermTheme(themeArg);
      break;
    case 'python':
    case 'python3':
      _tPrint(_tLine('Cargando Python (Skulpt)...', 'ts'));
      _loadSkulpt(function() {
        _pythonMode    = true;
        _pythonBuffer  = '';
        _pyIndentDepth = 0;
        _pySessionCode = '';
        var pEl4 = document.getElementById('t-prompt');
        if (pEl4) pEl4.textContent = '>>> ';
        _tPrint(_tLine('Python 3.12 (Pyodide) — numpy, pandas y más disponibles', 'ts'));
        _tPrint(_tLine('Estado persiste en sesión · import pandas → se descarga automático', 'tc'));
        _tPrint(_tLine('Bloques: terminar con línea vacía · nano script.py = editor completo', 'tc'));
        _tPrint(_tLine('exit() para salir · reset para limpiar sesión', 'tc'));
      });
      break;
    case 'clear':
      document.getElementById('t-out').innerHTML = '';
      break;
    case 'exit':
    case 'quit':
      closeTerminal();
      break;
    case 'sudo':
      _tPrint(_tLine('[sudo] password for mario: ', 'tp'));
      setTimeout(function() {
        _tPrint(_tLine('mario is not in the sudoers file. This incident will be reported.', 'te'));
        _tPrint(_tLine('(mentira, no hay sudoers aquí 😄)', 'ts'));
      }, 800);
      break;
    default:
      if (cmd) _tPrint(_tLine('bash: ' + cmd.split(' ')[0] + ': command not found — escribe "help"', 'te'));
  }
}

// ── TERMINAL THEMES ────────────────────────────────────────────────────
var _termThemes = {
  dark:   { '--t-bg':'#0d1117', '--t-txt':'#c9d1d9', '--t-th':'#58a6ff', '--t-tc':'#8b949e', '--t-tp':'#79c0ff', '--t-te':'#f85149', '--t-ts':'#3fb950' },
  hacker: { '--t-bg':'#000', '--t-txt':'#00ff41', '--t-th':'#00ff41', '--t-tc':'#00cc33', '--t-tp':'#00ffaa', '--t-te':'#ff0040', '--t-ts':'#00ff41' },
  amber:  { '--t-bg':'#1a0f00', '--t-txt':'#ffb347', '--t-th':'#ffd700', '--t-tc':'#cc8800', '--t-tp':'#ffa500', '--t-te':'#ff4444', '--t-ts':'#ffdd88' },
};
function _applyTermTheme(name) {
  var theme = _termThemes[name] || null;
  if (!theme) {
    _tPrint(_tLine('Temas disponibles: dark · hacker · amber', 'tc'));
    _tPrint(_tLine('uso: theme <nombre>', 'tc'));
    return;
  }
  var term = document.getElementById('ml-terminal');
  if (!term) return;
  Object.keys(theme).forEach(function(k) { term.style.setProperty(k, theme[k]); });
  _tPrint(_tLine('Tema "' + name + '" aplicado ✓', 'ts'));
}

// ── SKULPT (Python real) ───────────────────────────────────────────────
var _skulptLoaded = false;
var _skulptLoading = false;
var _skulptQueue = [];
var _pythonBuffer   = '';  // bloque multi-línea en curso
var _pyIndentDepth  = 0;   // profundidad de bloque actual
var _pySessionCode  = '';  // código acumulado en la sesión (estado persistente)

// ── Helpers de prompt ─────────────────────────────────────────────
function _updatePyPrompt(depth) {
  var pEl = document.getElementById('t-prompt');
  if (!pEl) return;
  pEl.textContent = depth > 0 ? '... ' : '>>> ';
}

function _exitPythonMode() {
  _pythonMode  = false;
  _pythonBuffer  = '';
  _pyIndentDepth = 0;
  _pySessionCode = '';
  _tPrint(_tLine('Saliendo de Python...', 'ts'));
  var pEl = document.getElementById('t-prompt');
  if (pEl) pEl.textContent = 'mario@portfolio:~$ ';
}

// ── Pyodide (Python real con pandas, numpy, etc.) ──────────────────
// Sustituye a Skulpt — carga lazy desde CDN oficial
var _pyodideReady   = false;
var _pyodideLoading = false;
var _pyodideInst    = null;  // instancia de pyodide

// Emit output hacia terminal o editor
function _pyEmit(text, isError, toEditor) {
  if (toEditor) {
    var outEl = document.getElementById('py-editor-out');
    if (!outEl) return;
    // Append raw text so \n characters are preserved by pre-wrap
    if (isError) {
      var errSpan = document.createElement('span');
      errSpan.className = 'te';
      errSpan.textContent = text;
      outEl.appendChild(errSpan);
    } else {
      outEl.appendChild(document.createTextNode(text));
    }
    outEl.scrollTop = outEl.scrollHeight;
  } else {
    var lines = text.replace(/\n$/, '').split('\n');
    lines.forEach(function(ln) {
      var safe = ln.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      _tPrint('<span' + (isError ? ' class="te"' : '') + '>' + safe + '</span>');
    });
  }
}

function _loadSkulpt(cb, statusFn) {
  // Reusamos el nombre _loadSkulpt para compatibilidad; en realidad carga Pyodide
  if (_pyodideReady) { _skulptLoaded = true; if(cb) cb(); return; }
  if (_pyodideLoading) { _skulptQueue.push(cb); return; }
  _pyodideLoading = true;
  _skulptLoading  = true;

  var updateStatus = statusFn || function(msg) {
    var el = document.getElementById('py-editor-status');
    if (el) el.textContent = msg;
    _tPrint(_tLine(msg, 'ts'));
  };

  updateStatus('Cargando Pyodide (~10 MB, solo la primera vez)...');

  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.3/full/pyodide.js';
  s.onload = function() {
    loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.3/full/' })
      .then(function(py) {
        _pyodideInst    = py;
        _pyodideReady   = true;
        _skulptLoaded   = true;
        _pyodideLoading = false;
        _skulptLoading  = false;
        updateStatus('✓ Python (Pyodide) listo — pandas, numpy y más disponibles');
        if (cb) cb();
        _skulptQueue.forEach(function(fn) { if(fn) fn(); });
        _skulptQueue = [];
      })
      .catch(function(err) {
        _pyodideLoading = false; _skulptLoading = false;
        updateStatus('Error iniciando Pyodide: ' + (err.message || err));
      });
  };
  s.onerror = function() {
    _pyodideLoading = false; _skulptLoading = false;
    updateStatus('Error cargando Pyodide desde CDN. ¿Hay conexión a internet?');
  };
  document.head.appendChild(s);
}

// ── Ejecutar Python con Pyodide ────────────────────────────────────
// opts.editor = true → output al panel del editor
function _runSkulpt(code, opts) {
  opts = opts || {};
  if (!_pyodideReady || !_pyodideInst) {
    _tPrint(_tLine('Python no está listo aún...', 'ts'));
    return;
  }
  var py = _pyodideInst;
  var toEditor = !!opts.editor;

  // Redirigir stdout y stderr
  var stdoutBuf = [], stderrBuf = [];
  py.setStdout({ batched: function(t) { stdoutBuf.push(t); } });
  py.setStderr({ batched: function(t) { stderrBuf.push(t); } });

  // Para el REPL, prefijar el código de sesión para estado persistente
  var fullCode = toEditor ? code : (_pySessionCode + code);

  // loadPackagesFromImports + runPythonAsync
  py.loadPackagesFromImports(fullCode)
    .then(function() { return py.runPythonAsync(fullCode); })
    .then(function(result) {
      // Flush output — para REPL suprimir el output del código viejo de sesión
      var sessionLineCount = _pySessionCode ? _pySessionCode.split('\n').length : 0;
      var combinedOut = stdoutBuf.join('');
      var combinedErr = stderrBuf.join('');

      if (combinedOut) _pyEmit(combinedOut, false, toEditor);
      if (combinedErr) _pyEmit(combinedErr, true,  toEditor);

      // Mostrar repr del resultado si no es None (comportamiento REPL)
      if (!toEditor && result !== undefined && result !== null) {
        var repr = '';
        try { repr = py.isPyProxy(result) ? result.toString() : ''; } catch(e) {}
        if (repr && repr !== 'None') _pyEmit(repr, false, false);
        try { if (py.isPyProxy(result)) result.destroy(); } catch(e) {}
      }

      // Añadir a sesión (REPL)
      if (!toEditor) _pySessionCode += '\n' + code;

      if (toEditor) {
        var statusEl = document.getElementById('py-editor-status');
        if (statusEl) statusEl.textContent = '\u2713 Ejecutado \u00b7 Ctrl+Enter: Run \u00b7 Ctrl+S: Guardar \u00b7 Ctrl+W: Cerrar';
      }
    })
    .catch(function(err) {
      var combinedOut = stdoutBuf.join('');
      var combinedErr = stderrBuf.join('');
      if (combinedOut) _pyEmit(combinedOut, false, toEditor);
      if (combinedErr) _pyEmit(combinedErr, true,  toEditor);
      var msg = err.message || String(err);
      _pyEmit(msg, true, toEditor);
      if (toEditor) {
        var statusEl = document.getElementById('py-editor-status');
        if (statusEl) statusEl.textContent = '\u2717 Error \u2014 ' + msg.split('\n')[0].substring(0, 60);
      }
    });
}

// ── EDITOR MODAL (nano) ────────────────────────────────────────────
var _editorFile = 'script.py';

function _createEditorDOM() {
  if (document.getElementById('py-editor')) return;
  var el = document.createElement('div');
  el.id = 'py-editor';
  el.innerHTML =
    '<div id="py-editor-bar">' +
      '<span id="py-editor-title">📄 script.py</span>' +
      '<button class="py-ed-btn py-ed-run"   onclick="_runEditorCode()">▶ Run</button>' +
      '<button class="py-ed-btn py-ed-save"  onclick="_saveEditorFile()">💾 Save</button>' +
      '<button class="py-ed-btn py-ed-dl"    onclick="_downloadEditorFile()">⬇ Download</button>' +
      '<button class="py-ed-btn py-ed-close" onclick="_closeEditor()">✕ Close</button>' +
    '</div>' +
    '<textarea id="py-editor-code" spellcheck="false" autocorrect="off" autocapitalize="off"' +
      ' placeholder="# Escribe Python aquí..."></textarea>' +
    '<div id="py-editor-divider"></div>' +
    '<div id="py-editor-out-label">▸ Output</div>' +
    '<div id="py-editor-out"></div>' +
    '<div id="py-editor-status">Ctrl+Enter: Ejecutar &nbsp;·&nbsp; Ctrl+S: Guardar &nbsp;·&nbsp; Ctrl+W: Cerrar</div>';
  document.body.appendChild(el);

  var area = el.querySelector('#py-editor-code');
  area.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); _runEditorCode(); }
    else if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); _saveEditorFile(); }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'w') { e.preventDefault(); _closeEditor(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      var s = this.selectionStart, en = this.selectionEnd;
      this.value = this.value.substring(0, s) + '    ' + this.value.substring(en);
      this.selectionStart = this.selectionEnd = s + 4;
    }
  });
}

function _openEditor(filename) {
  _editorFile = filename || 'script.py';
  _createEditorDOM();
  var titleEl = document.getElementById('py-editor-title');
  if (titleEl) titleEl.textContent = '📄 ' + _editorFile;
  var area = document.getElementById('py-editor-code');
  if (area) {
    if (_termFS[_editorFile] && typeof _termFS[_editorFile] !== 'function') {
      area.value = _termFS[_editorFile];
    } else if (!area.value || area.value.trim() === '') {
      area.value = '# mario@portfolio — Python Editor\n# Ctrl+Enter: Run  |  Ctrl+S: Guardar  |  Tab: Indentar\n\n';
    }
    setTimeout(function() {
      area.focus();
      area.setSelectionRange(area.value.length, area.value.length);
    }, 80);
  }
  var outEl = document.getElementById('py-editor-out');
  if (outEl) outEl.innerHTML = '';
  var statusEl = document.getElementById('py-editor-status');
  if (statusEl) statusEl.textContent = 'Ctrl+Enter: Ejecutar \u00b7 Ctrl+S: Guardar \u00b7 Ctrl+W: Cerrar';
  document.getElementById('py-editor').classList.add('open');
}

function _closeEditor() {
  var el = document.getElementById('py-editor');
  if (el) el.classList.remove('open');
  var inp = document.getElementById('t-input');
  if (inp) setTimeout(function() { inp.focus(); }, 80);
}

function _saveEditorFile() {
  var area = document.getElementById('py-editor-code');
  if (!area) return;
  _termFS[_editorFile] = area.value;
  _editorStatus('✓ Guardado: ' + _editorFile);
}

function _downloadEditorFile() {
  var area = document.getElementById('py-editor-code');
  if (!area) return;
  var blob = new Blob([area.value], { type: 'text/plain' });
  var url  = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = _editorFile; a.click();
  URL.revokeObjectURL(url);
  _editorStatus('⬇ Descargado: ' + _editorFile);
}

function _runEditorCode() {
  var area = document.getElementById('py-editor-code');
  if (!area || !area.value.trim()) return;
  var outEl = document.getElementById('py-editor-out');
  if (outEl) outEl.innerHTML = '';
  _editorStatus('⏳ Ejecutando...');

  if (!_skulptLoaded) {
    _loadSkulpt(function() { _runEditorCode(); });
    _editorStatus('Cargando Python (~1.8 MB)...');
    return;
  }
  _runSkulpt(area.value, { editor: true });
}

function _editorStatus(msg) {
  var el = document.getElementById('py-editor-status');
  if (!el) return;
  el.textContent = msg;
  setTimeout(function() {
    if (el.textContent === msg)
      el.textContent = 'Ctrl+Enter: Ejecutar \u00b7 Ctrl+S: Guardar \u00b7 Ctrl+W: Cerrar';
  }, 2500);
}

function openTerminal() {
  if (_termOpen) return;
  _termOpen = true;
  _glitchCount = 0;
  // Bloquear scroll de fondo mientras la terminal está abierta
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  var term = document.getElementById('ml-terminal');
  if (!term) return;
  term.classList.add('t-open');
  var inp = document.getElementById('t-input');
  if (inp) setTimeout(function() { inp.focus(); }, 100);
  // Mensaje de bienvenida
  var out = document.getElementById('t-out');
  if (out && !out.innerHTML) {
    _tPrint(_tLine('╔══════════════════════════════════════╗', 'th'));
    _tPrint(_tLine('║  mario@portfolio — Terminal v1.0     ║', 'th'));
    _tPrint(_tLine('╚══════════════════════════════════════╝', 'th'));
    _tPrint(_tLine('Escribe "help" para ver los comandos.', 'ts'));
    _tPrint('');
  }
}

function closeTerminal() {
  // Liberar scroll del body
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  _termOpen      = false;
  _pythonMode    = false;
  _pythonBuffer  = '';
  _pyIndentDepth = 0;
  _pySessionCode = '';
  var pEl3 = document.getElementById('t-prompt');
  if (pEl3) pEl3.textContent = 'mario@portfolio:~$ ';
  var term = document.getElementById('ml-terminal');
  if (term) {
    term.classList.remove('t-open');
    // Resetear tamaño manual del teclado virtual
    term.style.height = '';
    term.style.top    = '';
    term.style.left   = '';
    term.style.width  = '';
  }
}

// ── Terminal mobile: ajustar altura cuando el teclado virtual aparece ──
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', function() {
    var term = document.getElementById('ml-terminal');
    if (!term || !_termOpen) return;
    var vv = window.visualViewport;
    term.style.height = vv.height + 'px';
    term.style.top    = vv.offsetTop + 'px';
    term.style.left   = vv.offsetLeft + 'px';
    term.style.width  = vv.width + 'px';
    // Hacer scroll al input para que sea visible
    var inp = document.getElementById('t-in-row');
    if (inp) inp.scrollIntoView({ block: 'end' });
  });
}

// Cerrar con botón rojo y ESC
var tClose = document.getElementById('t-close');
if (tClose) tClose.addEventListener('click', closeTerminal);

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    // Primero cerrar editor si está abierto, luego el juego, luego la terminal
    var edEl = document.getElementById('py-editor');
    if (edEl && edEl.classList.contains('open')) { e.preventDefault(); _closeEditor(); return; }
    if (_sqlGameActive) { e.preventDefault(); window.dispatchEvent(new CustomEvent('sql-game-exit')); return; }
    if (_termOpen) { e.preventDefault(); closeTerminal(); return; }
  }
  if (!_termOpen) return;
  var inp = document.getElementById('t-input');
  if (!inp) return;
  if (e.key === 'Enter') {
    _execCmd(inp.value);
    inp.value = '';
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _termHistIdx = Math.min(_termHistIdx + 1, _termHistory.length - 1);
    if (_termHistory[_termHistIdx]) inp.value = _termHistory[_termHistIdx];
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    _termHistIdx = Math.max(_termHistIdx - 1, -1);
    inp.value = _termHistIdx >= 0 ? _termHistory[_termHistIdx] : '';
  }
});

// ── TRIPLE-CLIC en chip Python → glitch × 3 → terminal ──
var _chipClicks = 0, _chipTimer = null;
document.addEventListener('click', function(e) {
  // Buscar chips por texto "Python"
  var chip = e.target.closest('.skill-chip');
  if (!chip) return;
  if (chip.textContent.indexOf('Python') === -1) return;

  _chipClicks++;
  if (_chipTimer) clearTimeout(_chipTimer);

  if (_chipClicks >= 3) {
    _chipClicks = 0;
    // 3 glitches → terminal
    triggerGlitch(function() {
      setTimeout(function() {
        triggerGlitch(function() {
          setTimeout(function() {
            triggerGlitch(openTerminal);
          }, 180);
        });
      }, 180);
    });
  } else {
    // Glitch parcial por cada clic
    triggerGlitch(null);
    _chipTimer = setTimeout(function() { _chipClicks = 0; }, 1200);
  }
});

// ── TRIPLE-CLIC en chip Power BI → juego SQL ──
var _pbiClicks = 0, _pbiTimer = null;
document.addEventListener('click', function(e) {
  var chip = e.target.closest('.skill-chip');
  if (!chip) return;
  if (chip.textContent.indexOf('Power BI') === -1) return;
  _pbiClicks++;
  if (_pbiTimer) clearTimeout(_pbiTimer);
  if (_pbiClicks >= 3) {
    _pbiClicks = 0;
    openTerminal();
    setTimeout(function() {
      var inp = document.getElementById('t-input');
      if (inp) {
        inp.value = '';       // input limpio antes de activar el juego
        _execCmd('juego');    // imprime el comando en output y lanza el juego
      }
    }, 400);
  } else {
    _pbiTimer = setTimeout(function() { _pbiClicks = 0; }, 1200);
  }
});

// ── MAGIC KEYWORDS desktop: escribir CMD/sudo/matrix en cualquier parte ──
var _kwBuffer = '', _kwTimer = null;
var _magicWords = ['CMD', 'sudo', 'matrix'];
document.addEventListener('keypress', function(e) {
  if (_termOpen) return;
  // Solo si no hay foco en un input
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
  _kwBuffer += e.key;
  if (_kwTimer) clearTimeout(_kwTimer);
  _kwTimer = setTimeout(function() { _kwBuffer = ''; }, 1500);
  for (var i = 0; i < _magicWords.length; i++) {
    if (_kwBuffer.toLowerCase().endsWith(_magicWords[i].toLowerCase())) {
      _kwBuffer = '';
      triggerGlitch(openTerminal);
      break;
    }
  }
});

// ── SERVICE WORKER para PWA ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js').catch(function() {});
  });
}
