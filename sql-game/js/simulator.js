// =============================================================
// simulator.js — Simulador de Peso Visual de Consultas
// Convierte el costo calculado por analyzer.js en una
// experiencia visual de espera realista en la terminal.
// =============================================================

const WeightSimulator = (() => {

  // Convierte costo a milisegundos con variación aleatoria ±15%
  function costToDelay(cost) {
    let base;
    if      (cost < 200)   base = 400;
    else if (cost < 500)   base = 1200;
    else if (cost < 1000)  base = 3000;
    else if (cost < 2000)  base = 6000;
    else if (cost < 5000)  base = 14000;
    else if (cost < 8000)  base = 22000;
    else                   base = 35000;

    const jitter = base * (0.85 + Math.random() * 0.30);
    return Math.floor(jitter);
  }

  // Mensajes de progreso según el tipo de análisis
  const SCAN_MESSAGES = [
    'Iniciando plan de ejecución...',
    'Analizando estadísticas de tabla...',
    'Buscando índices disponibles...',
    'Escaneando bloques de datos...',
    'Aplicando filtros WHERE...',
    'Cargando páginas en buffer pool...',
    'Resolviendo referencias de clave foránea...',
    'Ordenando conjunto de resultados...',
    'Aplicando proyección de columnas...',
    'Transfiriendo resultado al cliente...',
  ];

  const CATASTROPHIC_MESSAGES = [
    '⚠ Iniciando operación masiva...',
    '⚠ Adquiriendo bloqueo exclusivo de tabla...',
    '⚠ Sin cláusula WHERE detectada...',
    '⚠ Procesando todos los registros...',
    '⚠ El sistema está bloqueado para otras consultas...',
    '⚠ Operación irreversible en progreso...',
  ];

  // Genera un número de filas ficticio creciente para la animación
  function* rowCounter(maxRows, steps) {
    for (let i = 0; i <= steps; i++) {
      yield Math.floor((maxRows / steps) * i);
    }
  }

  // Animación de barra de progreso
  function animateBar(fillEl, durationMs, onComplete) {
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const pct = Math.min(elapsed / durationMs, 1);
      // Curva que se ralentiza al final para más realismo
      const eased = pct < 0.8
        ? pct / 0.8 * 0.85
        : 0.85 + (pct - 0.8) / 0.2 * 0.15;
      fillEl.style.width = (eased * 100) + '%';
      if (pct < 1) {
        requestAnimationFrame(tick);
      } else {
        fillEl.style.width = '100%';
        onComplete && onComplete();
      }
    }
    requestAnimationFrame(tick);
  }

  // --- Simulación principal ---
  function run(analysisResult, elements, onComplete) {
    const {
      overlayEl,
      titleEl,
      fillEl,
      rowsEl,
      memoryEl,
      messageEl
    } = elements;

    const delay = costToDelay(analysisResult.cost);
    const isCatastrophic = analysisResult.isCatastrophic;
    const estimatedRows = Math.floor(analysisResult.cost * 4.7);
    const messages = isCatastrophic ? CATASTROPHIC_MESSAGES : SCAN_MESSAGES;

    // Mostrar overlay
    overlayEl.classList.remove('hidden');
    overlayEl.classList.toggle('catastrophic', isCatastrophic);

    titleEl.textContent = isCatastrophic
      ? '⚠ OPERACIÓN PELIGROSA EN CURSO...'
      : 'Ejecutando consulta...';

    // Animar barra de progreso
    animateBar(fillEl, delay, null);

    // Ciclar mensajes de estado
    let msgIndex = 0;
    messageEl.textContent = messages[0];
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      messageEl.textContent = messages[msgIndex];
    }, Math.floor(delay / messages.length));

    // Animar contador de filas
    let rowsShown = 0;
    const rowStep = Math.ceil(estimatedRows / (delay / 120));
    const rowInterval = setInterval(() => {
      rowsShown = Math.min(rowsShown + rowStep, estimatedRows);
      rowsEl.textContent = `Filas procesadas: ${rowsShown.toLocaleString('es-CL')}`;
    }, 120);

    // Animar uso de memoria (ficticio)
    let memMB = 0.1;
    const memTarget = (analysisResult.cost / 1000) * 48 + 2;
    const memInterval = setInterval(() => {
      memMB = Math.min(memMB + memTarget / (delay / 150), memTarget);
      memoryEl.textContent = `Memoria: ${memMB.toFixed(1)} MB`;
    }, 150);

    // Completar después del delay
    setTimeout(() => {
      clearInterval(msgInterval);
      clearInterval(rowInterval);
      clearInterval(memInterval);
      overlayEl.classList.add('hidden');
      onComplete && onComplete();
    }, delay);
  }

  // Simulación catastrófica especial (freeze dramático)
  function runCatastrophic(analysisResult, elements, onComplete) {
    const { overlayEl, titleEl, fillEl, rowsEl, memoryEl, messageEl } = elements;

    overlayEl.classList.remove('hidden');
    overlayEl.classList.add('catastrophic');
    titleEl.textContent = '⚠ OPERACIÓN IRREVERSIBLE EN CURSO...';

    let phase = 0;
    const phases = [
      { msg: 'Adquiriendo bloqueo exclusivo de tabla...', pct: 15 },
      { msg: '⚠ Recorriendo TODOS los registros...', pct: 35 },
      { msg: '⚠ El sistema no puede aceptar otras consultas...', pct: 55 },
      { msg: '⚠⚠ Operación sin posibilidad de rollback...', pct: 75 },
      { msg: '⚠⚠⚠ Confirmando cambios irreversibles...', pct: 92 },
      { msg: 'Finalizando...', pct: 100 },
    ];

    const phaseDelay = 1800;

    function nextPhase() {
      if (phase >= phases.length) {
        overlayEl.classList.add('hidden');
        onComplete && onComplete();
        return;
      }
      const p = phases[phase];
      messageEl.textContent = p.msg;
      fillEl.style.width = p.pct + '%';
      rowsEl.textContent = `Filas afectadas: ${Math.floor(p.pct * 482).toLocaleString('es-CL')}`;
      memoryEl.textContent = `Memoria: ${(p.pct * 0.9).toFixed(1)} MB`;
      phase++;
      setTimeout(nextPhase, phaseDelay);
    }

    nextPhase();
  }

  return { run, runCatastrophic, costToDelay };

})();
