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

    this._bindContinue();
  }

  // Sprites disponibles
  static SPRITES = {
    F1: { name: 'Neysa',          cssClass: 'sprite-f1' },
    F2: { name: 'Ing. Luis Salas', cssClass: 'sprite-f2' },
    A1: { name: 'Gerencia',       cssClass: 'sprite-a1' },
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

  setSprite(spriteKey) {
    const data = Character.SPRITES[spriteKey];
    if (!data) return;
    this.currentSprite = spriteKey;
    Object.values(Character.SPRITES).forEach(s =>
      this.spriteEl.classList.remove(s.cssClass));
    this.spriteEl.classList.add(data.cssClass);
    this.nameEl.textContent = data.name;
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
    this.isTyping    = true;
    this._currentLine = text;      // guardar línea completa para skip
    this.textEl.textContent  = '';
    this.continueEl.textContent = '';
    let i = 0;
    this.typeInterval = setInterval(() => {
      if (i < text.length) {
        this.textEl.textContent += text[i];
        i++;
      } else {
        clearInterval(this.typeInterval);
        this.typeInterval = null;
        this.isTyping = false;
        onComplete && onComplete();
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
    this.isTyping = false;
    this.setState('NEUTRAL');
    this.continueEl.textContent = this.dialogQueue.length === 0
      ? '— Pulsa ENTER para continuar —'
      : '▼ más...';
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
    this.setState(stateKey);
    this.textEl.textContent = text;
    this.nameEl.textContent = Character.SPRITES[this.currentSprite]?.name || '';
    this.continueEl.textContent = '';
    this.boxEl.classList.remove('hidden');
    this._setPanelDialog(true);
    setTimeout(() => {
      this.boxEl.classList.add('hidden');
      this._setPanelDialog(false);
      this.setState('NEUTRAL');
    }, durationMs);
  }

  // Reacción de pánico (para catástrofes) — permanece hasta callback
  panic(text, onDismiss) {
    this.setState('PANIC');
    this.textEl.textContent = text;
    this.continueEl.textContent = '— Pulsa ENTER —';
    this.boxEl.classList.remove('hidden');
    this._setPanelDialog(true);
    this.onDialogEnd = onDismiss;
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
