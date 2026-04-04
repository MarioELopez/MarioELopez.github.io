// =============================================================
// engine.js — Motor Principal del Juego
// Máquina de estados que coordina todos los módulos:
// terminal, personaje, DB, analizador, simulador, validador
// y logros. Es el único archivo que los conecta entre sí.
// =============================================================

class GameEngine {

  // Estados posibles del motor
  static STATES = {
    BOOTING:         'BOOTING',
    SPLASH:          'SPLASH',
    DIALOG:          'DIALOG',
    WAITING_INPUT:   'WAITING_INPUT',
    PROCESSING:      'PROCESSING',
    MISSION_SUCCESS: 'MISSION_SUCCESS',
    MISSION_FAIL:    'MISSION_FAIL',
    TRAP:            'TRAP',
    LEVEL_END:       'LEVEL_END',
    GAME_OVER:       'GAME_OVER',
  };

  constructor(config) {
    // Módulos inyectados
    this.terminal  = config.terminal;
    this.character = config.character;
    this.simEl     = config.simElements;   // elementos del DOM del simulador

    // Estado del juego
    this.state          = GameEngine.STATES.BOOTING;
    this.currentLevel   = 0;
    this.currentMission = 0;
    this.score          = 0;
    this.attempts       = 0;   // intentos en misión actual
    this.totalAttempts  = 0;
    this.schemaSQL      = '';

    // Elementos DOM auxiliares
    this.scoreEl       = config.scoreEl;
    this.accuracyEl    = config.accuracyEl;
    this.levelBadgeEl  = config.levelBadgeEl;
    this.missionTitleEl= config.missionTitleEl;
    this.dotsEl        = config.dotsEl;

    // Flag para detener el engine al salir (evita listeners zombie)
    this._stopped = false;

    // Timer para misiones cronometradas (L4)
    this._timerTimeout  = null;
    this._timerInterval = null;

    // Binding del input de la terminal
    this.terminal.onSubmit = cmd => this._onInput(cmd);
  }

  // ---- Persistencia en localStorage ----

  static SAVE_KEY    = 'sql_planta_progress';
  static BROKEN_KEY  = 'sql_planta_broken';

  _save() {
    try {
      const data = {
        level:         this.currentLevel,
        mission:       this.currentMission,
        score:         this.score,
        totalAttempts: this.totalAttempts,
        unlocked:      AchievementSystem.getUnlocked().map(a => a.id),
        savedAt:       Date.now(),
      };
      localStorage.setItem(GameEngine.SAVE_KEY, JSON.stringify(data));
    } catch (_) { /* localStorage puede estar bloqueado en algunos contextos */ }
  }

  _loadSave() {
    try {
      const raw = localStorage.getItem(GameEngine.SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Validar que los campos básicos existen
      if (typeof data.level !== 'number' || typeof data.mission !== 'number') return null;
      return data;
    } catch (_) { return null; }
  }

  _clearSave() {
    try { localStorage.removeItem(GameEngine.SAVE_KEY); } catch (_) {}
  }

  _setBroken() {
    try { localStorage.setItem(GameEngine.BROKEN_KEY, '1'); } catch (_) {}
  }

  _clearBroken() {
    try { localStorage.removeItem(GameEngine.BROKEN_KEY); } catch (_) {}
  }

  _isBroken() {
    try { return !!localStorage.getItem(GameEngine.BROKEN_KEY); } catch (_) { return false; }
  }

  // ---- Arranque ----

  async start() {
    this._setState(GameEngine.STATES.BOOTING);
    this.terminal.lock('Cargando sistema...');
    this.terminal.printWelcome();
    this.terminal.print('Inicializando base de datos...', 'tline-system');

    try {
      // GameDB.init() carga los datos desde data.js (sin fetch, sin WebAssembly)
      GameDB.init();

      // ── Comprobar estado de DB rota (easter egg DELETE sin WHERE) ──
      const brokenFlag = this._isBroken();
      if (brokenFlag) {
        this._showBrokenState();
        return;
      }

      // Comprobar si hay progreso guardado
      const save = this._loadSave();
      if (save) {
        this.terminal.print('Progreso guardado detectado.', 'tline-ok');
        this.terminal.print('  Escribe  continuar  para retomar, o  start  para empezar nuevo.', 'tline-info');
        this.terminal.print('');
        this._setState(GameEngine.STATES.SPLASH);
        this.terminal.unlock('continuar / start');
        this.terminal.onSubmit = cmd => {
          const lower = cmd.toLowerCase().trim();
          this.terminal.printCommand(cmd);
          if (lower === 'continuar' || lower === 'continue' || lower === 'resume') {
            this.terminal.onSubmit = c => this._onInput(c);
            this._restoreFromSave(save);
          } else if (lower === 'start') {
            this._clearSave();
            this.terminal.onSubmit = c => this._onInput(c);
            this._startLevel(0);
          } else {
            this._handleSystemCommand(cmd);
          }
        };
        return;
      }

      this.terminal.print('Base de datos lista.', 'tline-ok');
      this.terminal.printSeparator();
      this.terminal.print('');

      setTimeout(() => this._showSplash(), 800);

    } catch (err) {
      this.terminal.printError('No se pudo inicializar la base de datos: ' + err.message);
    }
  }

  _restoreFromSave(save) {
    this.currentLevel   = save.level;
    this.currentMission = save.mission;
    this.score          = save.score || 0;
    this.totalAttempts  = save.totalAttempts || 0;
    // Restaurar logros desbloqueados
    if (Array.isArray(save.unlocked)) {
      save.unlocked.forEach(id => AchievementSystem.unlock(id));
    }
    this._updateScoreUI();
    this.terminal.print('');
    this.terminal.printInfo(`── Retomando: Nivel ${this.currentLevel}, misión ${this.currentMission + 1} ──`);
    this.terminal.print('');
    const charMap = { 0: 'F1', 1: 'F1', 2: 'F1', 3: 'F1', 4: 'F1', 5: 'F2', 6: 'F2', 7: 'F2', 8: 'F2', 9: 'F2', 10: 'A1' };
    this.character.setSprite(charMap[this.currentLevel] || 'F1');
    if (this.levelBadgeEl) this.levelBadgeEl.textContent = `NIVEL ${this.currentLevel}`;
    this._presentMission(this._currentMission());
  }

  _showSplash() {
    this._setState(GameEngine.STATES.SPLASH);
    this.terminal.lock('Escribe  start  para comenzar...');
    this.terminal.print('╔══════════════════════════════════════════╗', 'tline-system');
    this.terminal.print('║        SQL PLANTA — EL JUEGO v1.0        ║', 'tline-system');
    this.terminal.print('║   Pon a prueba tus habilidades en SQL    ║', 'tline-system');
    this.terminal.print('╚══════════════════════════════════════════╝', 'tline-system');
    this.terminal.print('');
    this.terminal.print('  Escribe  start  para iniciar el juego.', 'tline-info');
    this.terminal.print('  Escribe  help   para ver comandos disponibles.', 'tline-info');
    this.terminal.print('');
    this.terminal.unlock('Escribe start para comenzar...');
  }

  // ---- Procesamiento de input ----

  _onInput(raw) {
    if (this._stopped) return;
    const cmd = raw.trim();
    if (!cmd) return;

    // Comandos del sistema disponibles en cualquier estado
    if (this._handleSystemCommand(cmd)) return;

    // Splash screen — solo acepta "start"
    if (this.state === GameEngine.STATES.SPLASH) {
      if (cmd.toLowerCase() === 'start') {
        this.terminal.printCommand(cmd);
        this._startLevel(0);
      } else {
        this.terminal.printCommand(cmd);
        this.terminal.printError(`Comando desconocido: "${cmd}". Escribe start para jugar.`);
      }
      return;
    }

    // Durante diálogo, ignorar input SQL
    if (this.state === GameEngine.STATES.DIALOG) return;

    // En procesamiento, ignorar
    if (this.state === GameEngine.STATES.PROCESSING) return;

    // Modo juego activo
    if (this.state === GameEngine.STATES.WAITING_INPUT) {
      this.terminal.printCommand(cmd);
      this._processQuery(cmd);
    }
  }

  _handleSystemCommand(cmd) {
    const lower = cmd.toLowerCase().trim();
    if (lower === 'help' || lower === '\\h') {
      this._printHelp();
      return true;
    }
    if (lower === 'clear' || lower === 'cls') {
      this.terminal.clear();
      return true;
    }
    if (lower === 'status') {
      this._printStatus();
      return true;
    }
    if (lower === 'score') {
      this._printScore();
      return true;
    }
    if (lower === 'logros' || lower === 'achievements') {
      this._printAchievements();
      return true;
    }
    if (lower === 'pista' || lower === 'ayuda' || lower === 'hint') {
      this._speakHint();
      return true;
    }
    if (lower === 'orden' || lower === 'objetivo' || lower === 'mision' || lower === 'misión') {
      this._speakOrden();
      return true;
    }
    // Salir del juego y volver al portafolio
    if (lower === 'salir' || lower === 'exit' || lower === 'quit') {
      this.terminal.print('Cerrando SQL Planta... Hasta pronto.', 'tline-ok');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sql-game-exit'));
      }, 600);
      return true;
    }
    return false;
  }

  // ---- Pipeline de consulta ----

  _processQuery(sql) {
    this._setState(GameEngine.STATES.PROCESSING);
    this.terminal.lock('Procesando...');
    this.attempts++;
    this.totalAttempts++;
    this._lastSQL = sql;

    // 1 — Analizar costo
    const analysis = QueryAnalyzer.analyze(sql);

    // Detectar DELETE sin WHERE (easter egg)
    const isDeleteNoWhere = analysis.warnings && analysis.warnings.includes('DELETE_NO_WHERE');

    // 2 — Activar efecto de glitch durante la animación catastrófica
    const gameEl = document.getElementById('game-container');
    if (isDeleteNoWhere && gameEl) {
      gameEl.classList.add('glitch-active');
    }

    // 3 — Iniciar simulación visual
    const simFn = analysis.isCatastrophic
      ? WeightSimulator.runCatastrophic.bind(WeightSimulator)
      : WeightSimulator.run.bind(WeightSimulator);

    simFn(analysis, this.simEl, () => {
      // Quitar glitch al finalizar la animación
      if (gameEl) gameEl.classList.remove('glitch-active');

      // 4 — Easter egg: DELETE sin WHERE → estado roto permanente
      if (isDeleteNoWhere) {
        GameDB.execute(sql);  // ejecutar el DELETE de verdad
        AchievementSystem.unlock('DELETE_WITHOUT_WHERE');
        this._triggerBrokenState();
        return;
      }

      // 5 — Ejecutar contra la DB real
      const execResult = GameDB.execute(sql);

      // 6 — Mostrar resultado en terminal
      this._renderResult(sql, analysis, execResult);

      // 7 — Validar contra la misión
      this._validateQuery(sql, analysis, execResult);
    });
  }

  _renderResult(sql, analysis, result) {
    if (result.error) {
      this.terminal.printError(result.error);
      return;
    }

    const { translatedType, display, tableName } = result;

    // Render especial para DESCRIBE
    if (translatedType === 'DESCRIBE') {
      this.terminal.printDescribe(result.rows);
      return;
    }

    // Render especial para SHOW TABLES
    const upper = sql.toUpperCase().trim();
    if (/^SHOW\s+TABLES/i.test(upper) || upper.includes('SQLITE_MASTER')) {
      this.terminal.printShowTables(result.rows);
      return;
    }

    // Resultado con filas
    if (result.rows && result.rows.length > 0) {
      this.terminal.printTable(result.columns, result.rows);
      return;
    }

    // Operación de modificación
    if (result.rowsAffected !== undefined && result.rowsAffected >= 0
        && ['INSERT','UPDATE','DELETE'].includes(analysis.queryType)) {
      this.terminal.printAffected(result.rowsAffected);
      return;
    }

    // Resultado vacío
    this.terminal.printInfo('Empty set (0 rows)');

    // Mostrar análisis de costo si fue penalizado
    if (analysis.cost > 500 || analysis.isCatastrophic) {
      this._printCostWarning(analysis);
    }
  }

  _printCostWarning(analysis) {
    this.terminal.print('');
    this.terminal.print('── Análisis de consulta ──────────────────', 'tline-sep');
    analysis.factors.forEach(f => {
      const prefix = f.severity === 'bonus' ? '  + ' : f.severity === 'catastrophic' ? '  ⚠ ' : '  - ';
      const sign   = f.cost >= 0 ? `+${f.cost}` : `${f.cost}`;
      this.terminal.print(`${prefix}${f.label} (${sign} pts)`,
        f.severity === 'bonus' ? 'tline-ok' : f.severity === 'catastrophic' ? 'tline-err' : 'tline-warn');
    });
    this.terminal.print(`  Costo total: ${analysis.cost} pts`, 'tline-info');
    this.terminal.print('──────────────────────────────────────────', 'tline-sep');
    this.terminal.print('');
  }

  // ---- Validación de misión ----

  _validateQuery(sql, analysis, execResult) {
    const mission = this._currentMission();
    if (!mission) return;

    const validation = Validator.validate(
      mission,
      analysis.queryType,
      sql,
      execResult
    );

    // Revisar logros antes de decidir éxito/fallo
    AchievementSystem.check(analysis, mission.id, validation.success);

    if (validation.code === 'TRAP_TRIGGERED') {
      this._onTrap(mission);
      return;
    }

    if (validation.success) {
      this._onMissionSuccess(mission);
      return;
    }

    // No completó — dar feedback y seguir esperando
    this._onQueryFailed(validation.code, mission, analysis);
  }

  // ---- Handlers de estado ----

  _onMissionSuccess(mission) {
    this._clearMissionTimer();
    this._setState(GameEngine.STATES.MISSION_SUCCESS);
    this.score += Math.max(100 - (this.attempts - 1) * 15, 10);
    this._updateScoreUI();
    this._save();  // guardar progreso al completar misión
    this.terminal.print('');
    this.terminal.printSuccess('¡Misión completada!');
    this.terminal.print('');

    AchievementSystem.unlockForMission(mission.achievement);
    if (mission.trapPossible) AchievementSystem.recordTrapSurvived();

    this.character.speak(
      mission.successDialog,
      {
        state: 'HAPPY',
        onEnd: () => this._advanceMission(),
      }
    );
  }

  _onTrap(mission) {
    this._setState(GameEngine.STATES.TRAP);
    this.terminal.print('');
    this.terminal.printError('¡OPERACIÓN CATASTRÓFICA EJECUTADA!');
    this.terminal.print('');
    this.score = Math.max(0, this.score - 50);
    this._updateScoreUI();

    // Desbloquear logro del error
    const w = QueryAnalyzer.analyze(this._lastSQL || '');
    w.warnings.forEach(code => {
      if (code === 'DELETE_NO_WHERE') AchievementSystem.unlock('DELETE_WITHOUT_WHERE');
      if (code === 'UPDATE_NO_WHERE') AchievementSystem.unlock('UPDATE_ALL');
      if (code === 'CARTESIAN_JOIN')  AchievementSystem.unlock('CARTESIAN_CHAOS');
    });

    this.character.panic(
      mission.trapCondition.trapDialog.join('\n\n'),
      () => {
        // Resetear DB al estado previo y reintentar misión
        GameDB.reset();
        this.attempts = 0;
        this.terminal.print('');
        this.terminal.printInfo('── Base de datos restaurada desde respaldo ──');
        this.terminal.print('');
        this._presentMission(mission);
      }
    );
  }

  _onQueryFailed(code, mission, analysis) {
    this._setState(GameEngine.STATES.WAITING_INPUT);
    this.terminal.unlock();

    // Comentario del personaje cada 2 intentos fallidos
    if (this.attempts % 2 === 0) {
      const reactions = [
        { text: 'Eso no es lo que pedí. Inténtalo de nuevo.', state: 'ANGRY' },
        { text: 'Sigue intentando. Revisa lo que te pedí.', state: 'STRICT' },
        { text: '...', state: 'THINKING' },
      ];
      const r = reactions[Math.floor(Math.random() * reactions.length)];
      this.character.react(r.text, r.state, 4500);
    }

    // Mostrar análisis si fue muy costoso
    if (analysis.cost > 800) {
      this._printCostWarning(analysis);
    }
  }

  // ---- Navegación de misiones ----

  _startLevel(levelIndex) {
    this.currentLevel   = levelIndex;
    this.currentMission = 0;
    const level = LEVELS[levelIndex];
    if (!level) { this._gameOver(); return; }

    this.terminal.print('');
    this.terminal.printSeparator();
    this.terminal.print(`  ${level.name.toUpperCase()}`, 'tline-system');
    this.terminal.printSeparator();
    this.terminal.print('');

    if (this.levelBadgeEl) this.levelBadgeEl.textContent = `NIVEL ${levelIndex}`;

    // Cambiar personaje según el nivel (0-4 = Neysa, 5-9 = Ing. Luis, 10+ = Dir. Morales)
    const charMap = { 0: 'F1', 1: 'F1', 2: 'F1', 3: 'F1', 4: 'F1', 5: 'F2', 6: 'F2', 7: 'F2', 8: 'F2', 9: 'F2', 10: 'A1' };
    this.character.setSprite(charMap[levelIndex] || 'F1');

    this._presentMission(this._currentMission());
  }

  _presentMission(mission) {
    if (!mission) { this._levelEnd(); return; }
    this._clearMissionTimer();
    this._setState(GameEngine.STATES.DIALOG);
    this.attempts = 0;
    this.terminal.lock('Espera el diálogo...');

    if (this.missionTitleEl) this.missionTitleEl.textContent = mission.title;
    this._updateDots();

    this.character.speak(mission.intro, {
      state: 'STRICT',
      onEnd: () => {
        this._setState(GameEngine.STATES.WAITING_INPUT);
        this.terminal.unlock();
        this.terminal.print('');
        this.terminal.printInfo(`── Misión: ${mission.title} ──`);
        if (mission.timed && mission.timeLimitMs) {
          const secs = Math.floor(mission.timeLimitMs / 1000);
          this.terminal.printInfo(`⏱ Tiempo límite: ${secs} segundos`);
          this._startMissionTimer(mission.timeLimitMs);
        }
        this.terminal.print('');
      }
    });
  }

  _advanceMission() {
    this.currentMission++;
    this._save();  // guardar índice de misión actualizado
    const next = this._currentMission();
    if (next) {
      setTimeout(() => this._presentMission(next), 600);
    } else {
      this._levelEnd();
    }
  }

  _levelEnd() {
    this._setState(GameEngine.STATES.LEVEL_END);
    const nextLevel = this.currentLevel + 1;

    this.terminal.print('');
    this.terminal.printSeparator();
    this.terminal.print(`  Nivel ${this.currentLevel} completado.`, 'tline-ok');
    this.terminal.print(`  Puntuación: ${this.score}`, 'tline-ok');
    this.terminal.printSeparator();
    this.terminal.print('');

    if (LEVELS[nextLevel]) {
      this.terminal.printInfo('Escribe  next  para continuar al siguiente nivel.');
      this.terminal.unlock('Escribe next para continuar...');
      this.terminal.onSubmit = cmd => {
        if (cmd.toLowerCase().trim() === 'next') {
          this.terminal.printCommand(cmd);
          this.terminal.onSubmit = c => this._onInput(c);
          this._startLevel(nextLevel);
        } else {
          this._handleSystemCommand(cmd);
        }
      };
    } else {
      this._gameOver(true);
    }
  }

  _gameOver(win = false) {
    this._setState(GameEngine.STATES.GAME_OVER);
    this.terminal.print('');
    this.terminal.printSeparator();
    if (win) {
      this.terminal.print('  ¡JUEGO COMPLETADO!', 'tline-ok');
      this.terminal.print(`  Puntuación final: ${this.score}`, 'tline-ok');
      this.terminal.print('  Eres un analista de datos de planta.', 'tline-ok');
    } else {
      this.terminal.print('  FIN DEL JUEGO', 'tline-err');
      this.terminal.print(`  Puntuación: ${this.score}`, 'tline-info');
    }
    this.terminal.printSeparator();
    this.terminal.print('');
    this.terminal.printInfo('Escribe  restart  para volver a jugar.');
    this.terminal.unlock('Escribe restart para volver a jugar...');
    this.terminal.onSubmit = cmd => {
      if (cmd.toLowerCase().trim() === 'restart') {
        this.terminal.printCommand(cmd);
        this.terminal.onSubmit = c => this._onInput(c);
        this._restart();
      }
    };
  }

  _restart() {
    this._clearSave();
    this._clearBroken();
    this._clearMissionTimer();
    this.score          = 0;
    this.currentLevel   = 0;
    this.currentMission = 0;
    this.attempts       = 0;
    this.totalAttempts  = 0;
    this.terminal.clear();
    this._updateScoreUI();
    GameDB.reset();
    this.terminal.printWelcome();
    setTimeout(() => this._startLevel(0), 400);
  }

  // ---- Helpers ----

  _currentMission() {
    const level = LEVELS[this.currentLevel];
    if (!level) return null;
    return level.missions[this.currentMission] || null;
  }

  _setState(s) {
    this.state = s;
  }

  _updateScoreUI() {
    if (this.scoreEl) this.scoreEl.textContent = this.score;
    if (this.accuracyEl && this.totalAttempts > 0) {
      const successCount = Math.round(this.score / 100);
      const pct = Math.round((successCount / this.totalAttempts) * 100);
      this.accuracyEl.textContent = pct + '%';
    }
  }

  _updateDots() {
    if (!this.dotsEl) return;
    const level = LEVELS[this.currentLevel];
    if (!level) return;
    this.dotsEl.innerHTML = level.missions.map((_, i) => {
      const cls = i < this.currentMission ? 'dot-done'
                : i === this.currentMission ? 'dot-active' : 'dot-pending';
      return `<span class="mission-dot ${cls}"></span>`;
    }).join('');
  }

  // ---- Comandos de sistema ----

  _printHelp() {
    this.terminal.print('');
    this.terminal.print('── Comandos del sistema ──', 'tline-sep');
    this.terminal.print('  start      Inicia el juego', 'tline-info');
    this.terminal.print('  next       Avanza al siguiente nivel', 'tline-info');
    this.terminal.print('  restart    Reinicia el juego', 'tline-info');
    this.terminal.print('  status     Muestra estado actual de la misión', 'tline-info');
    this.terminal.print('  score      Muestra tu puntuación', 'tline-info');
    this.terminal.print('  logros     Muestra logros desbloqueados', 'tline-info');
    this.terminal.print('  orden      Repite el objetivo de la misión actual', 'tline-info');
    this.terminal.print('  clear      Limpia la pantalla', 'tline-info');
    this.terminal.print('  salir      Volver al portafolio', 'tline-info');
    this.terminal.print('  help       Muestra esta ayuda', 'tline-info');
    this.terminal.print('');
    this.terminal.print('── Comandos SQL disponibles ──', 'tline-sep');
    this.terminal.print('  SHOW TABLES               Lista las tablas', 'tline-info');
    this.terminal.print('  DESCRIBE <tabla>          Muestra estructura de tabla', 'tline-info');
    this.terminal.print('  SELECT / INSERT / UPDATE / DELETE ...', 'tline-info');
    this.terminal.print('');
  }

  // Repite la misión actual como diálogo del personaje
  _speakOrden() {
    const mission = this._currentMission();
    if (!mission) {
      this.character.react('No hay misión activa ahora mismo.', 'THINKING', 3000);
      return;
    }
    const intro = Array.isArray(mission.intro) ? mission.intro : [mission.intro];
    const lines = [`Misión: ${mission.title}`, ...intro];
    this._speakIfReady(lines, 'STRICT');
  }

  // Da una pista como diálogo del personaje (no imprime en terminal)
  _speakHint() {
    const mission = this._currentMission();
    let lines = [];

    // ── Nivel 0: Neysa — pistas completas (inducción) ─────────
    if (this.currentLevel === 0) {
      const hints = {
        'L0M1': [
          'Sin pena, prueba esto:',
          'SHOW TABLES;',
          'Le pregunta al sistema qué tablas existen. Así de simple.',
        ],
        'L0M2': [
          'Usa DESCRIBE empleados;',
          'También vale DESC empleados; — los dos hacen lo mismo.',
        ],
        'L0M3': [
          'SELECT * FROM produccion_diaria LIMIT 5;',
          'El número después de LIMIT controla cuántas filas ves.',
        ],
      };
      lines = hints[mission ? mission.id : ''] || ['No tengo pista para esto. ¡Confío en ti!'];

    // ── Nivel 1: Neysa — pistas parciales ─────────────────────
    } else if (this.currentLevel === 1) {
      const hints = {
        'L1M1': ['Solo por esta vez:', 'SELECT nombre, cargo FROM empleados WHERE activo = 1;', 'La próxima lo resuelves tú.'],
        'L1M2': ['Filtra por la columna turno con valor \'noche\'.', 'Y que activo = 1.'],
        'L1M3': ['SELECT COUNT(*) FROM paradas...', 'WHERE tipo_parada = \'falla\'. Eso es todo.'],
        'L1M4': ['ORDER BY eficiencia_porcentaje ASC.', 'Tabla produccion_diaria.'],
        'L1M5': ['JOIN maquinas ON paradas.maquina_id = maquinas.id', 'Trae el nombre de la máquina.'],
      };
      lines = hints[mission ? mission.id : ''] || ['No tengo pista para eso. Piénsalo un poco más.'];

    // ── Nivel 2: Neysa — pistas muy escuetas ──────────────────
    } else if (this.currentLevel === 2) {
      const hints = {
        'L2M1': ['GROUP BY linea_id con AVG(unidades_defectuosas).'],
        'L2M2': ['SUM(horas_perdidas) GROUP BY tipo_parada.'],
        'L2M3': ['JOIN con AVG(unidades_producidas) / capacidad_maxima_diaria.'],
        'L2M4': ['GROUP BY maquina_id HAVING COUNT(*) > 2.'],
        'L2M5': ['WHERE salario > (SELECT AVG(salario) FROM empleados)'],
      };
      lines = hints[mission ? mission.id : ''] || ['Piensa en el objetivo y en las tablas involucradas.'];

    // ── Nivel 3: Neysa — seria, sin lujos ─────────────────────
    } else if (this.currentLevel === 3) {
      const hints = {
        'L3M1': ['INSERT INTO paradas (maquina_id, tipo_parada, fecha_inicio, ...) VALUES (...)'],
        'L3M2': ['UPDATE maquinas SET estado = \'mantenimiento\' WHERE id = 7'],
        'L3M3': ['UPDATE empleados SET salario = salario * 1.05 WHERE cargo LIKE \'%tecnico%\''],
        'L3M4': ['DELETE FROM produccion_diaria WHERE fecha < \'2020-01-01\'', '¡No olvides el WHERE!'],
        'L3M5': ['SELECT COUNT(*) FROM produccion_diaria WHERE fecha < \'2020-01-01\''],
      };
      lines = hints[mission ? mission.id : ''] || ['Revisa la misión. Piensa dos veces antes de ejecutar.'];

    // ── Nivel 4: sin pistas — ya deberías poder solo ──────────
    } else {
      lines = [
        'Aquí no hay pistas.',
        'Si llegaste al nivel 4 es porque ya sé que puedes resolverlo solo.',
      ];
    }

    this._speakIfReady(lines, 'THINKING');
  }

  // Habla por el personaje si el juego está en espera de input;
  // si no, usa react() breve para no interrumpir un diálogo en curso.
  _speakIfReady(lines, stateKey = 'TALKING') {
    if (this.state === GameEngine.STATES.WAITING_INPUT) {
      this._setState(GameEngine.STATES.DIALOG);
      this.terminal.lock('Escucha...');
      this.character.speak(lines, {
        state: stateKey,
        onEnd: () => {
          this._setState(GameEngine.STATES.WAITING_INPUT);
          this.terminal.unlock();
        },
      });
    } else {
      // El personaje ya está hablando — reacción rápida sin interrumpir
      this.character.react(lines[0] || '...', stateKey, 3500);
    }
  }

  _printStatus() {
    const m = this._currentMission();
    const lvl = LEVELS[this.currentLevel];
    this.terminal.print('');
    this.terminal.print('── Estado actual ──', 'tline-sep');
    this.terminal.print(`  Nivel:   ${this.currentLevel} — ${lvl ? lvl.name : '—'}`, 'tline-info');
    this.terminal.print(`  Misión:  ${m ? m.title : '—'}`, 'tline-info');
    this.terminal.print(`  Puntos:  ${this.score}`, 'tline-info');
    this.terminal.print(`  Intentos en misión actual: ${this.attempts}`, 'tline-info');
    this.terminal.print('');
  }

  _printScore() {
    this.terminal.print('');
    this.terminal.print(`  Puntuación: ${this.score} pts`, 'tline-ok');
    this.terminal.print(`  Intentos totales: ${this.totalAttempts}`, 'tline-info');
    this.terminal.print('');
  }

  _printAchievements() {
    const list = AchievementSystem.getUnlocked();
    this.terminal.print('');
    this.terminal.print('── Logros desbloqueados ──', 'tline-sep');
    if (list.length === 0) {
      this.terminal.print('  Aún no has desbloqueado logros.', 'tline-info');
    } else {
      list.forEach(a => {
        this.terminal.print(`  ${a.icon} ${a.name} — ${a.desc}`, 'tline-ok');
      });
    }
    this.terminal.print('');
  }

  // ---- Timer para misiones cronometradas ----

  _startMissionTimer(ms) {
    this._clearMissionTimer();
    let remaining = Math.floor(ms / 1000);

    // Avisos intermedios de Neysa
    this._timerInterval = setInterval(() => {
      remaining -= 15;
      if (remaining <= 0) return;
      if (this.state !== GameEngine.STATES.WAITING_INPUT) return;
      if (remaining <= 30) {
        this.character.react(`¡${remaining} segundos! ¡MUÉVETE!`, 'PANIC', 3000);
      } else if (remaining <= 60) {
        this.character.react(`¡Quedan ${remaining} segundos!`, 'ANGRY', 2500);
      }
    }, 15000);

    // Timeout final
    this._timerTimeout = setTimeout(() => {
      this._clearMissionTimer();
      this._onTimerExpired();
    }, ms);
  }

  _clearMissionTimer() {
    if (this._timerTimeout)  { clearTimeout(this._timerTimeout);   this._timerTimeout  = null; }
    if (this._timerInterval) { clearInterval(this._timerInterval); this._timerInterval = null; }
  }

  _onTimerExpired() {
    if (this.state !== GameEngine.STATES.WAITING_INPUT) return;
    this.terminal.printError('⏱ ¡TIEMPO AGOTADO!');
    this.score = Math.max(0, this.score - 30);
    this._updateScoreUI();
    this._save();
    this._speakIfReady([
      '¡Se acabó el tiempo! El turno no espera.',
      'Pierdes 30 puntos y pasamos a la siguiente misión. La próxima muévete más rápido.',
    ], 'PANIC');
    setTimeout(() => {
      if (this.state !== GameEngine.STATES.WAITING_INPUT &&
          this.state !== GameEngine.STATES.DIALOG) return;
      this._advanceMission();
    }, 6000);
  }

  // ---- Easter egg: DB rota por DELETE sin WHERE ----

  _triggerBrokenState() {
    this._clearMissionTimer();
    this._setBroken();
    this._setState(GameEngine.STATES.GAME_OVER);

    this.terminal.print('');
    this.terminal.printError('⚠ OPERACIÓN IRREVERSIBLE — BASE DE DATOS DESTRUIDA');
    this.terminal.print('');

    this.character.panic(
      '¿¡¿Qué acabas de hacer?!\n\nUn DELETE sin WHERE. Sin filtro. Sin confirmación.\n\nBorraste toda la tabla. No hay respaldo aquí. La base de datos de la planta está destruida.\n\nEl sistema no puede continuar. Tu única opción es escribir  restart  para reinicializar todo desde cero.',
      () => {
        this.terminal.printError('Sistema bloqueado. Escribe  restart  para recuperar la base de datos.');
        this.terminal.unlock('Escribe restart para recuperar...');
        this.terminal.onSubmit = cmd => {
          if (cmd.toLowerCase().trim() === 'restart') {
            this.terminal.printCommand(cmd);
            this.terminal.onSubmit = c => this._onInput(c);
            this._restart();
          }
        };
      }
    );
  }

  _showBrokenState() {
    this._setState(GameEngine.STATES.GAME_OVER);
    const gameEl = document.getElementById('game-container');

    // Activar glitch brevemente
    if (gameEl) gameEl.classList.add('glitch-active');
    setTimeout(() => { if (gameEl) gameEl.classList.remove('glitch-active'); }, 2500);

    this.terminal.printError('⚠ ERROR CRÍTICO: BASE DE DATOS CORROMPIDA');
    this.terminal.print('El sistema detectó una destrucción masiva de datos en la sesión anterior.', 'tline-info');
    this.terminal.print('');

    setTimeout(() => {
      this.character.panic(
        '¡Sabía que ibas a hacer eso!\n\nBorraste toda la tabla sin WHERE. Sin pensar en las consecuencias.\n\nEl sistema está roto. Tienes que reiniciarlo todo para recuperar la base de datos.\n\nEscribe  restart  cuando estés listo para aceptar las consecuencias.',
        () => {
          this.terminal.printInfo('Escribe  restart  para reinicializar la base de datos.');
          this.terminal.unlock('Escribe restart...');
          this.terminal.onSubmit = cmd => {
            if (cmd.toLowerCase().trim() === 'restart') {
              this.terminal.printCommand(cmd);
              this.terminal.onSubmit = c => this._onInput(c);
              this._restart();
            }
          };
        }
      );
    }, 2800);
  }
}
