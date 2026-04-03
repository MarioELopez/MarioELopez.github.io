// =============================================================
// db.js — Motor de base de datos (alasql)
// Usa alasql (ya cargado en el portafolio) en lugar de sql.js.
// Funciona en file://, GitHub Pages y cualquier servidor HTTP.
// Sin WebAssembly, sin fetch, sin servidor local requerido.
// =============================================================

const GameDB = (() => {

  let _ready = false;

  // ---- Inicialización ----

  function init() {
    // alasql ya está disponible globalmente (cargado por el portafolio)
    if (typeof alasql === 'undefined') {
      throw new Error('alasql no está disponible. Verifica que está cargado.');
    }
    // Los datos se cargan via GAME_DB_SETUP() (script data.js)
    if (typeof GAME_DB_SETUP === 'function') {
      GAME_DB_SETUP();
    } else {
      throw new Error('data.js no cargado: GAME_DB_SETUP no definida.');
    }
    _ready = true;
    _updateRowCounts();
    console.log('[GameDB] alasql + data.js inicializados OK');
  }

  // No-ops para compatibilidad con engine.js que llama loadSchema/loadData
  function loadSchema() { /* ya cargado en init() */ }
  function loadData()   { /* ya cargado en init() */ }

  // ---- Metadatos de tablas ----

  function _getTableList() {
    try {
      const db = alasql.databases[alasql.useid];
      if (!db) return [];
      return Object.keys(db.tables)
        .filter(t => t && !t.startsWith('?') && !/^\d/.test(t))
        .sort();
    } catch (_) { return []; }
  }

  function _getColumnInfo(tableName) {
    try {
      const db = alasql.databases[alasql.useid];
      if (!db || !db.tables[tableName]) return [];
      const cols = db.tables[tableName].columns || [];
      return cols.map((col, i) => ({
        cid:       i,
        name:      col.columnid || col.column || String(col),
        type:      col.dbtypeid || col.type || 'STRING',
        notnull:   0,
        dflt_value:null,
        pk:        (col.primarykey || col.pk) ? 1 : 0,
      }));
    } catch (_) { return []; }
  }

  // ---- Traductor MySQL → equivalentes ----

  const TRANSLATIONS = [
    // SHOW TABLES
    {
      match: /^\s*SHOW\s+TABLES\s*;?\s*$/i,
      handle: () => ({
        columns: ['Tables_in_planta'],
        rows: _getTableList().map(n => [n]),
        rowsAffected: 0, translatedType: 'SHOW', display: 'SHOW_TABLES',
      }),
    },
    // SHOW DATABASES / SCHEMAS
    {
      match: /^\s*SHOW\s+(DATABASES|SCHEMAS)\s*;?\s*$/i,
      handle: () => ({
        columns: ['Database'],
        rows: [['planta_industrial']],
        rowsAffected: 0, translatedType: 'SHOW', display: 'SHOW_DATABASES',
      }),
    },
    // DESCRIBE table / DESC table
    {
      match: /^\s*(?:DESCRIBE|DESC)\s+(\w+)\s*;?\s*$/i,
      handle: m => {
        const cols = _getColumnInfo(m[1]);
        return {
          columns: ['cid','name','type','notnull','dflt_value','pk'],
          rows: cols.map(c => [c.cid, c.name, c.type, c.notnull, c.dflt_value, c.pk]),
          rowsAffected: 0, translatedType: 'DESCRIBE',
          display: `DESCRIBE ${m[1].toUpperCase()}`, tableName: m[1],
        };
      },
    },
    // SHOW COLUMNS FROM table
    {
      match: /^\s*SHOW\s+COLUMNS\s+FROM\s+(\w+)\s*;?\s*$/i,
      handle: m => {
        const cols = _getColumnInfo(m[1]);
        return {
          columns: ['cid','name','type','notnull','dflt_value','pk'],
          rows: cols.map(c => [c.cid, c.name, c.type, c.notnull, c.dflt_value, c.pk]),
          rowsAffected: 0, translatedType: 'DESCRIBE',
          display: `SHOW COLUMNS FROM ${m[1].toUpperCase()}`, tableName: m[1],
        };
      },
    },
    // sqlite_master → tabla list (engine.js lo genera internamente para SHOW TABLES)
    {
      match: /sqlite_master/i,
      handle: () => ({
        columns: ['Tables_in_planta'],
        rows: _getTableList().map(n => [n]),
        rowsAffected: 0, translatedType: 'SHOW', display: 'SHOW_TABLES',
      }),
    },
    // PRAGMA table_info(tname) (engine.js lo genera internamente para DESCRIBE)
    {
      match: /^\s*PRAGMA\s+table_info\s*\(\s*(\w+)\s*\)\s*;?\s*$/i,
      handle: m => {
        const cols = _getColumnInfo(m[1]);
        return {
          columns: ['cid','name','type','notnull','dflt_value','pk'],
          rows: cols.map(c => [c.cid, c.name, c.type, c.notnull, c.dflt_value, c.pk]),
          rowsAffected: 0, translatedType: 'DESCRIBE',
          display: `DESCRIBE ${m[1].toUpperCase()}`, tableName: m[1],
        };
      },
    },
  ];

  // ---- Ejecución ----

  function execute(rawSql) {
    if (!_ready) return { error: 'Base de datos no inicializada.' };

    const trimmed = rawSql.trim();

    // Interceptar comandos especiales primero
    for (const t of TRANSLATIONS) {
      const m = trimmed.match(t.match);
      if (m) return t.handle(m);
    }

    // Ejecutar SQL con alasql
    try {
      const isSelect = /^\s*SELECT\b/i.test(trimmed);
      const result = alasql(trimmed);

      if (isSelect) {
        if (!Array.isArray(result) || result.length === 0) {
          return { columns: [], rows: [], rowsAffected: 0, translatedType: null, display: null };
        }
        const columns = Object.keys(result[0]);
        const rows = result.map(row => columns.map(c => (row[c] !== undefined ? row[c] : null)));
        return { columns, rows, rowsAffected: 0, translatedType: null, display: null };
      } else {
        // DML: alasql devuelve número de filas afectadas
        const affected = typeof result === 'number' ? result : 0;
        _updateRowCounts();
        return { columns: [], rows: [], rowsAffected: affected, translatedType: null, display: null };
      }
    } catch (err) {
      return { error: err.message };
    }
  }

  // ---- Utilidades ----

  function _updateRowCounts() {
    const tables = _getTableList();
    const counts = {};
    tables.forEach(t => {
      try {
        const r = alasql('SELECT COUNT(*) AS c FROM `' + t + '`');
        counts[t] = r && r[0] ? r[0].c : 0;
      } catch (_) { counts[t] = 0; }
    });
    if (typeof QueryAnalyzer !== 'undefined') {
      QueryAnalyzer.updateRowCounts(counts);
    }
  }

  // Reinicia la DB a su estado inicial (para replay)
  function reset() {
    if (typeof GAME_DB_SETUP === 'function') {
      GAME_DB_SETUP();
      _updateRowCounts();
      console.log('[GameDB] DB reseteada OK');
    }
  }

  // Snapshot de una tabla (para validación de misiones)
  function snapshot(tableName) {
    try {
      const result = alasql('SELECT * FROM `' + tableName + '`');
      if (!result || result.length === 0) return { columns: [], rows: [] };
      const columns = Object.keys(result[0]);
      const rows = result.map(row => columns.map(c => (row[c] !== undefined ? row[c] : null)));
      return { columns, rows };
    } catch (_) {
      return { columns: [], rows: [] };
    }
  }

  function isReady() { return _ready; }

  return { init, loadSchema, loadData, execute, reset, snapshot, isReady };

})();
