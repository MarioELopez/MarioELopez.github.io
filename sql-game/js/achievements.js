// =============================================================
// achievements.js — Sistema de Logros
// Define todos los logros del juego y gestiona su desbloqueo.
// =============================================================

const AchievementSystem = (() => {

  const DEFS = {
    // --- Exploración ---
    EXPLORER_1: {
      id: 'EXPLORER_1',
      icon: '🗺️',
      name: 'Mapa en mano',
      desc: 'Ejecutaste tu primer SHOW TABLES.',
    },
    SMART_EXPLORER: {
      id: 'SMART_EXPLORER',
      icon: '🔍',
      name: 'Vista previa inteligente',
      desc: 'Usaste LIMIT para explorar sin descargar todo.',
    },
    SCHEMA_READER: {
      id: 'SCHEMA_READER',
      icon: '📋',
      name: 'Lector de esquemas',
      desc: 'Describiste la estructura de una tabla correctamente.',
    },

    // --- Buenas prácticas ---
    NO_STAR: {
      id: 'NO_STAR',
      icon: '🎯',
      name: 'Sin comodines',
      desc: 'Completaste 3 misiones seguidas sin usar SELECT *.',
    },
    INDEX_LOVER: {
      id: 'INDEX_LOVER',
      icon: '⚡',
      name: 'Amante de los índices',
      desc: 'Usaste 5 veces WHERE en columna indexada.',
    },
    LIMITER: {
      id: 'LIMITER',
      icon: '🛑',
      name: 'Sabe cuándo parar',
      desc: 'Usaste LIMIT en 5 consultas de selección.',
    },

    // --- SQL avanzado ---
    FIRST_JOIN: {
      id: 'FIRST_JOIN',
      icon: '🔗',
      name: 'Primer cruce',
      desc: 'Ejecutaste tu primer JOIN correctamente.',
    },
    GROUP_MASTER: {
      id: 'GROUP_MASTER',
      icon: '📊',
      name: 'Maestro del GROUP BY',
      desc: 'Agrupaste y ordenaste datos en una sola consulta.',
    },
    SUBQUERY_PRO: {
      id: 'SUBQUERY_PRO',
      icon: '🧩',
      name: 'Consulta dentro de consulta',
      desc: 'Resolviste una misión usando subconsulta o NOT IN.',
    },
    ANALYST: {
      id: 'ANALYST',
      icon: '📈',
      name: 'Analista de planta',
      desc: 'Generaste un reporte completo con JOIN + GROUP BY + ORDER BY + LIMIT.',
    },

    // --- Trampas evitadas ---
    TRAP_SURVIVOR: {
      id: 'TRAP_SURVIVOR',
      icon: '🛡️',
      name: 'Sobreviviente',
      desc: 'Completaste una misión trampa sin cometer el error.',
    },
    TRIPLE_TRAP: {
      id: 'TRIPLE_TRAP',
      icon: '🏆',
      name: 'Intocable',
      desc: 'Superaste 3 misiones trampa sin caer en ninguna.',
    },

    // --- Errores (se desbloquean al cometerlos — educativos) ---
    DELETE_WITHOUT_WHERE: {
      id: 'DELETE_WITHOUT_WHERE',
      icon: '💀',
      name: 'El clásico error',
      desc: 'Ejecutaste un DELETE sin WHERE. Ahora nunca lo olvidarás.',
    },
    UPDATE_ALL: {
      id: 'UPDATE_ALL',
      icon: '😱',
      name: 'Actualización masiva',
      desc: 'Actualizaste TODA una tabla sin WHERE. RRHH no está contento.',
    },
    CARTESIAN_CHAOS: {
      id: 'CARTESIAN_CHAOS',
      icon: '🌀',
      name: 'El producto cartesiano',
      desc: 'Hiciste un JOIN sin ON. El sistema tardó 30 segundos en responder.',
    },
    SELECT_STAR_STORM: {
      id: 'SELECT_STAR_STORM',
      icon: '⭐',
      name: 'Lluvia de columnas',
      desc: 'Usaste SELECT * 5 veces en una misión. El Ing. Vega suspiró.',
    },

    // --- Eficiencia ---
    SPEED_RUN: {
      id: 'SPEED_RUN',
      icon: '⚡',
      name: 'Consulta relámpago',
      desc: 'Obtuviste un costo de ejecución menor a 150 puntos.',
    },
    OPTIMIZER: {
      id: 'OPTIMIZER',
      icon: '🔧',
      name: 'El optimizador',
      desc: 'Reduciste el costo de tu consulta más de un 50% en un segundo intento.',
    },
  };

  // Estado interno
  const unlocked = new Set();
  const counters  = {
    noStarStreak:     0,
    indexedWhereUses: 0,
    limitUses:        0,
    trapsSurvived:    0,
    selectStarCount:  0,
    lastCost:         null,
  };

  // Sistema de popups apilados — cada logro aparece como tarjeta independiente
  const TOAST_DURATION_MS = 6000;   // cuánto tiempo visible
  const TOAST_EXIT_MS     = 500;    // duración de la animación de salida

  let stackEl = null;  // #achievement-stack en el DOM

  function init(elements) {
    // Crear el contenedor de la pila si no existe
    stackEl = document.getElementById('achievement-stack');
    if (!stackEl) {
      stackEl = document.createElement('div');
      stackEl.id = 'achievement-stack';
      document.body.appendChild(stackEl);
    }
  }

  function unlock(id) {
    if (unlocked.has(id)) return false;
    unlocked.add(id);
    const def = DEFS[id];
    if (!def) return false;
    _showToast(def);
    return true;
  }

  function _showToast(def) {
    if (!stackEl) return;

    // Crear tarjeta individual
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML =
      '<span class="toast-icon">' + def.icon + '</span>' +
      '<div class="toast-body">' +
        '<span class="toast-label">Logro desbloqueado</span>' +
        '<span class="toast-name">' + def.name + '</span>' +
        '<span class="toast-desc">' + def.desc + '</span>' +
      '</div>';

    stackEl.appendChild(toast);

    // Auto-dismiss después de TOAST_DURATION_MS
    setTimeout(function() {
      toast.classList.add('toast-exit');
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, TOAST_EXIT_MS);
    }, TOAST_DURATION_MS);
  }

  // Revisión automática post-consulta
  function check(analysisResult, missionId, success) {
    const { queryType, cost, warnings, isCatastrophic } = analysisResult;

    // --- Logros por errores cometidos ---
    if (warnings.includes('DELETE_NO_WHERE')) unlock('DELETE_WITHOUT_WHERE');
    if (warnings.includes('UPDATE_NO_WHERE')) unlock('UPDATE_ALL');
    if (warnings.includes('CARTESIAN_JOIN'))  unlock('CARTESIAN_CHAOS');

    if (queryType === 'SELECT' && analysisResult.factors.some(f => f.label.includes('SELECT *'))) {
      counters.selectStarCount++;
      if (counters.selectStarCount >= 5) unlock('SELECT_STAR_STORM');
    }

    // --- Logros por buenas prácticas ---
    if (cost < 150) unlock('SPEED_RUN');

    if (analysisResult.factors.some(f => f.label.includes('indexada'))) {
      counters.indexedWhereUses++;
      if (counters.indexedWhereUses >= 5) unlock('INDEX_LOVER');
    }

    if (analysisResult.factors.some(f => f.label.includes('LIMIT'))) {
      counters.limitUses++;
      if (counters.limitUses >= 5) unlock('LIMITER');
    }

    // Racha sin SELECT *
    const usedStar = analysisResult.factors.some(f => f.label.includes('SELECT *'));
    if (!usedStar && success) {
      counters.noStarStreak++;
      if (counters.noStarStreak >= 3) unlock('NO_STAR');
    } else {
      counters.noStarStreak = 0;
    }

    // Optimizador: costo < 50% del intento anterior
    if (counters.lastCost !== null && cost < counters.lastCost * 0.5) {
      unlock('OPTIMIZER');
    }
    counters.lastCost = cost;
  }

  // Llamar cuando el jugador supera una misión trampa sin caer
  function recordTrapSurvived() {
    unlock('TRAP_SURVIVOR');
    counters.trapsSurvived++;
    if (counters.trapsSurvived >= 3) unlock('TRIPLE_TRAP');
  }

  // Desbloquear logros de misión específica
  function unlockForMission(achievementId) {
    if (achievementId) unlock(achievementId);
  }

  function getUnlocked() {
    return [...unlocked].map(id => DEFS[id]).filter(Boolean);
  }

  return {
    init,
    unlock,
    check,
    recordTrapSurvived,
    unlockForMission,
    getUnlocked,
    DEFS,
  };

})();
