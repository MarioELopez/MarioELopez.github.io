// =============================================================
// character.js — Sistema de Diálogo y Estados del Personaje
// Maneja las animaciones de estado, la cola de diálogos,
// el efecto typewriter y el cambio de sprites.
// =============================================================

class Character {
  constructor(spriteEl, nameEl, textEl, boxEl, continueEl) {
    this.spriteEl    = spriteEl;
    this.nameEl      = nameEl;
    this.textEl      = textEl;
    this.boxEl       = boxEl;
    this.continueEl  = continueEl;

    this.currentSprite  = 'F1';
    this.dialogQueue    = [];
    this.isTyping       = false;
    this.typeInterval   = null;
    this._currentLine   = '';   // texto completo de la línea que se está tipeando
    this.onDialogEnd    = null;
    this.speedMs        = 26;  // ms por carácter

    this._lastAdvance   = 0;   // timestamp para debounce del Enter
    this._DEBOUNCE_MS   = 80;

    this._reactTimer    = null; // timer para react() — cancelable para evitar solapamiento
    this._typeOnComplete = null; // callback almacenado para _skipTyping

    this._bindContinue();
  }

  // Sprites disponibles
  static SPRITES = {
    F1: { name: 'Neysa',           role: 'Supervisora',       cssClass: 'sprite-f1' },
    F2: { name: 'Ing. Luis Salas', role: 'Gerente de Planta', cssClass: 'sprite-f2' },
    A1: { name: 'Dir. Morales',    role: 'Director',          cssClass: 'sprite-a1' },
  };

  // Estados con sus clases CSS
  static STATES = {
    NEUTRAL:  'state-neutral',
    TALKING:  'state-talking',
    HAPPY:    'state-happy',
    ANGRY:    'state-angry',
    PANIC:    'state-panic',
    THINKING: 'state-thinking',
    STRICT:   'state-strict',
  };

  _bindContinue() {
    // Click en el cuadro de diálogo siempre avanza
    this._clickHandler = () => this._advanceOrSkip();
    this.boxEl.addEventListener('click', this._clickHandler);

    // ── ENTER / ESPACIO en teclado ────────────────────────────────────────────
    // FIX: usar else-if para que avanzar y skipear no se ejecuten en el mismo evento
    // Guardar referencia para poder removerlo al destruir
    this._keydownHandler = e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (this.boxEl.classList.contains('hidden')) return;

      // Debounce: ignorar eventos duplicados dentro de _DEBOUNCE_MS ms
      const now = Date.now();
      if (now - this._lastAdvance < this._DEBOUNCE_MS) return;
      this._lastAdvance = now;

      e.preventDefault();

      if (this.isTyping) {
        this._skipTyping();
      } else {
        this._advance();
      }
    };
    document.addEventListener('keydown', this._keydownHandler);
  }

  // Limpieza total — remover TODOS los listeners para no contaminar el portfolio
  destroy() {
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
      this._keydownHandler = null;
    }
    if (this._clickHandler) {
      this.boxEl.removeEventListener('click', this._clickHandler);
      this._clickHandler = null;
    }
    if (this.typeInterval) {
      clearInterval(this.typeInterval);
      this.typeInterval = null;
    }
    this.dialogQueue = [];
    this.onDialogEnd = null;
  }

  // Unifica click y teclado
  _advanceOrSkip() {
    if (this.isTyping) {
      this._skipTyping();
    } else {
      this._advance();
    }
  }

  // Actualiza nombre y cargo en el cuadro de diálogo
  _updateNameDisplay(info) {
    if (!info) return;
    if (this.nameEl) this.nameEl.textContent = info.name;
    const roleEl = document.getElementById('dialog-character-role');
    if (roleEl) roleEl.textContent = info.role || '';
  }

  setSprite(spriteKey) {
    const data = Character.SPRITES[spriteKey];
    if (!data) return;
    this.currentSprite = spriteKey;
    Object.values(Character.SPRITES).forEach(s =>
      this.spriteEl.classList.remove(s.cssClass));
    this.spriteEl.classList.add(data.cssClass);
    this._updateNameDisplay(data);
  }

  setState(stateKey) {
    Object.values(Character.STATES).forEach(s =>
      this.spriteEl.classList.remove(s));
    const cls = Character.STATES[stateKey] || Character.STATES.NEUTRAL;
    this.spriteEl.classList.add(cls);
  }

  // Marca el panel lateral para que CSS haga el toggle info↔diálogo
  _setPanelDialog(active) {
    const panel = document.getElementById('character-panel');
    if (panel) panel.classList.toggle('dialog-active', active);
  }

  // Encola una lista de líneas de diálogo y las muestra en secuencia
  speak(lines, options = {}) {
    if (!Array.isArray(lines)) lines = [lines];
    this.dialogQueue = [...lines];
    this.onDialogEnd = options.onEnd || null;
    if (options.state) this.setState(options.state);
    this.boxEl.classList.remove('hidden');
    this._setPanelDialog(true);
    this._showNext();
  }

  _showNext() {
    if (this.dialogQueue.length === 0) {
      this._endDialog();
      return;
    }
    const line = this.dialogQueue.shift();
    this.setState('TALKING');
    this._typeText(line, () => {
      this.setState('NEUTRAL');
      this.continueEl.textContent = this.dialogQueue.length === 0
        ? '— Pulsa ENTER para continuar —'
        : '▼ más...';
    });
  }

  _typeText(text, onComplete) {
    this.isTyping     = true;
    this._currentLine = text;       // guardar línea completa para skip
    this._typeOnComplete = onComplete; // guardar callback para _skipTyping
    this.textEl.textContent  = '';
    this.continueEl.textContent = '';
    let i = 0;
    this.typeInterval = setInterval(() => {
      if (i < text.length) {
        this.textEl.textContent += text[i];
        i++;
        // Scroll dentro del contenedor de texto (no del box exterior)
        this.textEl.scrollTop = this.textEl.scrollHeight;
      } else {
        clearInterval(this.typeInterval);
        this.typeInterval = null;
        this.isTyping = false;
        this._typeOnComplete = null;
        onComplete && onComplete();
        // Segundo scroll tras añadir el indicador de continuar
        requestAnimationFrame(() => {
          this.textEl.scrollTop = this.textEl.scrollHeight;
        });
      }
    }, this.speedMs);
  }

  _skipTyping() {
    if (this.typeInterval) {
      clearInterval(this.typeInterval);
      this.typeInterval = null;
    }
    // Mostrar el texto completo de la línea actual (evita pantalla en blanco)
    this.textEl.textContent = this._currentLine;
    // Scroll al final tras mostrar el texto completo
    this.textEl.scrollTop = this.textEl.scrollHeight;
    this.isTyping = false;
    this.setState('NEUTRAL');
    this.continueEl.textContent = this.dialogQueue.length === 0
      ? '— Pulsa ENTER para continuar —'
      : '▼ más...';
    // Ejecutar callback pendiente (ej. panic setupDismiss) si existe
    const cb = this._typeOnComplete;
    this._typeOnComplete = null;
    cb && cb();
  }

  _advance() {
    this._showNext();
  }

  _endDialog() {
    this.boxEl.classList.add('hidden');
    this._setPanelDialog(false);
    this.setState('NEUTRAL');
    const cb = this.onDialogEnd;
    this.onDialogEnd = null;
    cb && cb();
  }

  // Reacción rápida sin cola (para feedback de consultas)
  react(text, stateKey = 'NEUTRAL', durationMs = 4500) {
    // Cancelar timer anterior para evitar solapamiento de estados
    if (this._reactTimer) {
      clearTimeout(this._reactTimer);
      this._reactTimer = null;
    }
    this.setState(stateKey);
    this.textEl.textContent = text;
    this._updateNameDisplay(Character.SPRITES[this.currentSprite]);
    this.continueEl.textContent = '';
    this.boxEl.classList.remove('hidden');
    this._setPanelDialog(true);
    this._reactTimer = setTimeout(() => {
      this._reactTimer = null;
      this.boxEl.classList.add('hidden');
      this._setPanelDialog(false);
      this.setState('NEUTRAL');
    }, durationMs);
  }

  // Reacción de pánico (para catástrofes) — permanece hasta callback
  panic(text, onDismiss) {
    this.setState('PANIC');
    this.boxEl.classList.remove('hidden');
    this._setPanelDialog(true);
    this.continueEl.textContent = '';

    // setupDismiss: se llama al terminar de tipear (o al skipear)
    const setupDismiss = () => {
      // Restaurar estado PANIC en caso de que _skipTyping lo haya puesto en NEUTRAL
      this.setState('PANIC');
      this.continueEl.textContent = '— Pulsa ENTER —';
      const handler = () => {
        this.boxEl.classList.add('hidden');
        this._setPanelDialog(false);
        this.setState('NEUTRAL');
        document.removeEventListener('keydown', keyHandler);
        this.boxEl.removeEventListener('click', handler);
        onDismiss && onDismiss();
      };
      const keyHandler = (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
      };
      this.boxEl.addEventListener('click', handler, { once: true });
      document.addEventListener('keydown', keyHandler, { once: true });
    };

    // Usar typewriter — click durante tipeo activa _skipTyping, que a su vez
    // llama a setupDismiss gracias a _typeOnComplete
    this._typeText(text, setupDismiss);
  }

  hide() {
    this.boxEl.classList.add('hidden');
    this._setPanelDialog(false);
    this.setState('NEUTRAL');
    if (this.typeInterval) {
      clearInterval(this.typeInterval);
      this.typeInterval = null;
    }
    this._currentLine = '';
    this.dialogQueue = [];
  }
}
