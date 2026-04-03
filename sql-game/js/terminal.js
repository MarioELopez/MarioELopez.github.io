// =============================================================
// terminal.js — Controlador de la Terminal UI
// Maneja la entrada del usuario, historial de comandos,
// y el renderizado de resultados en formato de consola.
// =============================================================

class Terminal {
  constructor(outputEl, inputEl, promptEl) {
    this.output  = outputEl;
    this.input   = inputEl;
    this.prompt  = promptEl;
    this.history = [];
    this.histIdx = -1;
    this.locked  = false;
    this.onSubmit = null;
    this._bind();
  }

  _bind() {
    // Guardar referencia para poder remover el listener al destruir
    this._keydownHandler = e => {
      if (this.locked) { e.preventDefault(); return; }

      if (e.key === 'Enter') {
        const cmd = this.input.value.trim();
        if (!cmd) return;
        this.history.unshift(cmd);
        if (this.history.length > 50) this.history.pop();
        this.histIdx = -1;
        this.input.value = '';
        this.onSubmit && this.onSubmit(cmd);

      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.histIdx < this.history.length - 1) {
          this.histIdx++;
          this.input.value = this.history[this.histIdx];
          setTimeout(() => this.input.setSelectionRange(9999, 9999), 0);
        }

      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.histIdx > 0) {
          this.histIdx--;
          this.input.value = this.history[this.histIdx];
        } else {
          this.histIdx = -1;
          this.input.value = '';
        }
      }
    };
    this.input.addEventListener('keydown', this._keydownHandler);
  }

  // Desconecta todos los listeners — CRÍTICO para no dejar residuos al salir del juego
  destroy() {
    if (this._keydownHandler) {
      this.input.removeEventListener('keydown', this._keydownHandler);
      this._keydownHandler = null;
    }
    this.onSubmit = null;
    this.locked   = false;
  }

  // ---- Métodos de output ----

  _append(text, cls) {
    const el = document.createElement('div');
    el.className = `tline ${cls}`;
    el.textContent = text;
    this.output.appendChild(el);
    this.output.scrollTop = this.output.scrollHeight;
    return el;
  }

  _appendHTML(html, cls) {
    const el = document.createElement('div');
    el.className = `tline ${cls}`;
    el.innerHTML = html;
    this.output.appendChild(el);
    this.output.scrollTop = this.output.scrollHeight;
    return el;
  }

  printCommand(cmd) {
    this._append(`planta@sistema:~$ ${cmd}`, 'tline-cmd');
  }

  print(text, cls = 'tline-out') {
    this._append(text, cls);
  }

  printError(msg) {
    this._append(`ERROR: ${msg}`, 'tline-err');
  }

  printSuccess(msg) {
    this._append(`✓ ${msg}`, 'tline-ok');
  }

  printInfo(msg) {
    this._append(msg, 'tline-info');
  }

  printSeparator() {
    this._append('─'.repeat(60), 'tline-sep');
  }

  // Renderiza resultados SQL como tabla ASCII con scroll horizontal
  // Las tablas anchas se desplazan lateralmente en lugar de partir líneas.
  printTable(columns, rows) {
    if (!columns || columns.length === 0) {
      this.printInfo('(sin columnas)');
      return;
    }
    if (!rows || rows.length === 0) {
      this.printInfo('Empty set (0 rows)');
      return;
    }

    // Calcular ancho de cada columna (sin truncar — scroll se encarga del overflow)
    const widths = columns.map((col, i) => {
      const dataMax = rows.reduce((m, row) => {
        const v = row[i] !== null && row[i] !== undefined ? String(row[i]) : 'NULL';
        return Math.max(m, v.length);
      }, 0);
      return Math.max(col.length, dataMax);
    });

    const sep  = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';
    const head = '|' + columns.map((c, i) => ` ${c.padEnd(widths[i])} `).join('|') + '|';

    // Wrapper con scroll horizontal — evita el word-wrap que deforma las tablas
    const wrapper = document.createElement('div');
    wrapper.className = 'tbl-scroll';

    const addLine = (text, cls) => {
      const el = document.createElement('div');
      el.className = `tline ${cls}`;
      el.textContent = text;
      wrapper.appendChild(el);
    };

    addLine(sep,  'tline-tbl');
    addLine(head, 'tline-tbl-h');
    addLine(sep,  'tline-tbl');

    rows.forEach(row => {
      const line = '|' + row.map((v, i) => {
        const s = v !== null && v !== undefined ? String(v) : 'NULL';
        return ` ${s.padEnd(widths[i])} `;
      }).join('|') + '|';
      addLine(line, 'tline-tbl');
    });

    addLine(sep, 'tline-tbl');

    this.output.appendChild(wrapper);
    this.output.scrollTop = this.output.scrollHeight;
    this.printInfo(`${rows.length} row(s) in set`);
  }

  // Renderiza resultado de PRAGMA table_info como DESCRIBE
  printDescribe(rows) {
    if (!rows || rows.length === 0) {
      this.printError('Tabla no encontrada.');
      return;
    }
    const cols   = ['Field', 'Type', 'Null', 'Key', 'Default'];
    const mapped = rows.map(r => [
      r[1] || '',   // name
      r[2] || '',   // type
      r[3] ? 'NO' : 'YES',  // notnull
      r[5] ? 'PRI' : '',    // pk
      r[4] !== null ? String(r[4]) : 'NULL',  // dflt_value
    ]);
    this.printTable(cols, mapped);
  }

  // Renderiza lista de tablas como SHOW TABLES
  printShowTables(rows) {
    if (!rows || rows.length === 0) {
      this.printInfo('Empty set — no hay tablas cargadas aún.');
      return;
    }
    const tableNames = rows.map(r => [r[0]]);
    this.printTable(['Tables_in_planta'], tableNames);
  }

  // Muestra cuántas filas fueron afectadas (para INSERT/UPDATE/DELETE)
  printAffected(n) {
    this.printInfo(`Query OK, ${n} row(s) affected`);
  }

  // Progress line temporal (se reemplaza)
  printProgress(msg) {
    const el = this._append(msg, 'tline-prog');
    el.id = '_prog';
    return el;
  }

  updateProgress(msg) {
    const el = document.getElementById('_prog');
    if (el) el.textContent = msg;
  }

  removeProgress() {
    const el = document.getElementById('_prog');
    if (el) el.remove();
  }

  // ---- Control de input ----

  lock(placeholder = 'Espera...') {
    this.locked = true;
    this.input.disabled = true;
    this.input.placeholder = placeholder;
    if (this.prompt) this.prompt.style.opacity = '0.4';
  }

  unlock(placeholder = 'Ingresa tu consulta SQL...') {
    this.locked = false;
    this.input.disabled = false;
    this.input.placeholder = placeholder;
    this.input.focus();
    if (this.prompt) this.prompt.style.opacity = '1';
  }

  clear() {
    this.output.innerHTML = '';
  }

  focus() {
    this.input.focus();
  }

  // Mensaje de bienvenida al iniciar el juego
  printWelcome() {
    this.printSeparator();
    this.print('Sistema de Gestión Industrial — PLANTADB v2.4.1', 'tline-system');
    this.print('Copyright © Planta Industrial S.A. Todos los derechos reservados.', 'tline-system');
    this.print('Conexión establecida. Usuario: analista_junior', 'tline-system');
    this.printSeparator();
    this.print('');
  }
}
