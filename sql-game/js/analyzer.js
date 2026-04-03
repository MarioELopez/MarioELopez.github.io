// =============================================================
// analyzer.js — Calculador de Costo de Consultas SQL
// Analiza una consulta antes de ejecutarla y devuelve
// un costo computacional simulado con sus factores.
// =============================================================

const QueryAnalyzer = (() => {

  // --- Tabla de costos base ---
  const COSTS = {
    BASE:                        100,
    SELECT_STAR:                 200,
    FULL_SCAN_PER_1K_ROWS:        50,
    JOIN_PER_TABLE:              150,
    CARTESIAN_JOIN:             3000,
    LIKE_LEADING_WILDCARD:       400,
    UPDATE_NO_WHERE:            5000,
    DELETE_NO_WHERE:            6000,
    DROP_TABLE:                15000,
    SUBQUERY_PER_LEVEL:          500,
    NO_LIMIT_ON_SELECT:          100,
    ORDER_BY_NO_INDEX:           250,
    WHERE_INDEX_BONUS:          -0.3,  // reducción del 30%
    LIMIT_BONUS:                -100,
    SPECIFIC_COLS_BONUS:        -150,
  };

  // Columnas con índice por tabla (simuladas)
  const INDEXED_COLS = {
    maquinas:          ['id', 'linea_id'],
    lineas_produccion: ['id'],
    paradas:           ['id', 'maquina_id', 'fecha_inicio'],
    produccion_diaria: ['id', 'linea_id', 'fecha', 'operario_id'],
    empleados:         ['id', 'departamento_id', 'rut'],
    departamentos:     ['id'],
    materiales:        ['id', 'proveedor_id', 'codigo'],
    proveedores:       ['id'],
    calidad:           ['id', 'produccion_id'],
    mantenimiento:     ['id', 'maquina_id'],
  };

  // Estimación de filas por tabla (se actualiza al cargar datos)
  let TABLE_ROWS = {
    maquinas:          50,
    lineas_produccion: 10,
    paradas:         5000,
    produccion_diaria: 10000,
    empleados:        200,
    departamentos:     15,
    materiales:       500,
    proveedores:       80,
    calidad:         8000,
    mantenimiento:   2000,
  };

  // --- Funciones de detección ---

  function detectType(upper) {
    if (/^SELECT\b/.test(upper))   return 'SELECT';
    if (/^INSERT\b/.test(upper))   return 'INSERT';
    if (/^UPDATE\b/.test(upper))   return 'UPDATE';
    if (/^DELETE\b/.test(upper))   return 'DELETE';
    if (/^DROP\b/.test(upper))     return 'DROP';
    if (/^CREATE\b/.test(upper))   return 'CREATE';
    if (/^ALTER\b/.test(upper))    return 'ALTER';
    if (/^SHOW\b/.test(upper))     return 'SHOW';
    if (/^DESCRIBE\b|^DESC\s/.test(upper)) return 'DESCRIBE';
    if (/^PRAGMA\b/.test(upper))   return 'PRAGMA';
    if (/^EXPLAIN\b/.test(upper))  return 'EXPLAIN';
    return 'OTHER';
  }

  const hasWhere      = u => /\bWHERE\b/.test(u);
  const hasSelectStar = u => /SELECT\s+\*/.test(u);
  const hasLimit      = u => /\bLIMIT\b/.test(u);
  const hasOrderBy    = u => /\bORDER\s+BY\b/.test(u);
  const hasGroupBy    = u => /\bGROUP\s+BY\b/.test(u);
  const hasLeadingWildcard = u => /LIKE\s*['"]%/.test(u);
  const countJoins    = u => (u.match(/\bJOIN\b/g) || []).length;
  const countSelects  = u => (u.match(/\bSELECT\b/g) || []).length;

  function isCartesian(upper) {
    return countJoins(upper) > 0 &&
           !/\bON\b/.test(upper) &&
           !/\bUSING\b/.test(upper);
  }

  function extractTables(sql) {
    const tables = [];
    const re = /\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    let m;
    while ((m = re.exec(sql)) !== null) {
      tables.push(m[1].toLowerCase());
    }
    return [...new Set(tables)];
  }

  function usesIndexedCol(upper) {
    for (const cols of Object.values(INDEXED_COLS)) {
      for (const col of cols) {
        if (upper.includes(col.toUpperCase())) return true;
      }
    }
    return false;
  }

  // --- Analizador principal ---

  function analyze(sql) {
    const upper = sql.toUpperCase().trim();
    const type  = detectType(upper);

    const result = {
      queryType:     type,
      cost:          COSTS.BASE,
      factors:       [],     // { label, cost, severity: 'bonus'|'penalty'|'catastrophic' }
      warnings:      [],     // códigos de advertencia
      isCatastrophic: false,
    };

    // ---- METADATOS: costo mínimo, son operaciones ligeras ----
    if (['SHOW', 'DESCRIBE', 'PRAGMA', 'EXPLAIN'].includes(type)) {
      result.cost = 80;
      result.factors.push({ label: 'Consulta de metadatos', cost: 80, severity: 'bonus' });
      return result;
    }

    // ---- CATÁSTROFES inmediatas ----
    if (type === 'DROP') {
      result.cost = COSTS.DROP_TABLE;
      result.isCatastrophic = true;
      result.warnings.push('DROP_TABLE');
      result.factors.push({ label: 'DROP TABLE — destrucción de estructura', cost: COSTS.DROP_TABLE, severity: 'catastrophic' });
      return result;
    }

    if (type === 'DELETE' && !hasWhere(upper)) {
      result.cost = COSTS.DELETE_NO_WHERE;
      result.isCatastrophic = true;
      result.warnings.push('DELETE_NO_WHERE');
      result.factors.push({ label: 'DELETE sin WHERE — borra toda la tabla', cost: COSTS.DELETE_NO_WHERE, severity: 'catastrophic' });
      return result;
    }

    if (type === 'UPDATE' && !hasWhere(upper)) {
      result.cost = COSTS.UPDATE_NO_WHERE;
      result.isCatastrophic = true;
      result.warnings.push('UPDATE_NO_WHERE');
      result.factors.push({ label: 'UPDATE sin WHERE — modifica toda la tabla', cost: COSTS.UPDATE_NO_WHERE, severity: 'catastrophic' });
      return result;
    }

    // ---- SELECT ----
    if (type === 'SELECT') {

      if (hasSelectStar(upper)) {
        result.cost += COSTS.SELECT_STAR;
        result.factors.push({ label: 'SELECT * (todas las columnas)', cost: COSTS.SELECT_STAR, severity: 'penalty' });
      } else {
        result.cost += COSTS.SPECIFIC_COLS_BONUS;
        result.factors.push({ label: 'Columnas específicas seleccionadas', cost: COSTS.SPECIFIC_COLS_BONUS, severity: 'bonus' });
      }

      if (hasLimit(upper)) {
        result.cost += COSTS.LIMIT_BONUS;
        result.factors.push({ label: 'LIMIT presente', cost: COSTS.LIMIT_BONUS, severity: 'bonus' });
      } else {
        result.cost += COSTS.NO_LIMIT_ON_SELECT;
        result.factors.push({ label: 'Sin LIMIT — descarga ilimitada', cost: COSTS.NO_LIMIT_ON_SELECT, severity: 'penalty' });
      }

      if (!hasWhere(upper)) {
        const tables = extractTables(sql);
        tables.forEach(t => {
          const rows = TABLE_ROWS[t] || 1000;
          const scanCost = Math.ceil(rows / 1000) * COSTS.FULL_SCAN_PER_1K_ROWS;
          result.cost += scanCost;
          result.factors.push({ label: `Full scan: ${t} (${rows.toLocaleString()} filas)`, cost: scanCost, severity: 'penalty' });
        });
      } else if (usesIndexedCol(upper)) {
        const reduction = Math.floor(result.cost * Math.abs(COSTS.WHERE_INDEX_BONUS));
        result.cost -= reduction;
        result.factors.push({ label: 'WHERE en columna indexada', cost: -reduction, severity: 'bonus' });
      }

      if (hasOrderBy(upper) && !usesIndexedCol(upper)) {
        result.cost += COSTS.ORDER_BY_NO_INDEX;
        result.factors.push({ label: 'ORDER BY sin índice (sort en memoria)', cost: COSTS.ORDER_BY_NO_INDEX, severity: 'penalty' });
      }
    }

    // ---- JOINs ----
    const joins = countJoins(upper);
    if (joins > 0) {
      const jCost = joins * COSTS.JOIN_PER_TABLE;
      result.cost += jCost;
      result.factors.push({ label: `${joins} JOIN(s)`, cost: jCost, severity: 'penalty' });

      if (isCartesian(upper)) {
        result.cost += COSTS.CARTESIAN_JOIN;
        result.isCatastrophic = true;
        result.warnings.push('CARTESIAN_JOIN');
        result.factors.push({ label: 'JOIN sin ON — Producto Cartesiano', cost: COSTS.CARTESIAN_JOIN, severity: 'catastrophic' });
      }
    }

    // ---- LIKE con wildcard inicial ----
    if (hasLeadingWildcard(upper)) {
      result.cost += COSTS.LIKE_LEADING_WILDCARD;
      result.factors.push({ label: "LIKE '%...' — imposible usar índice", cost: COSTS.LIKE_LEADING_WILDCARD, severity: 'penalty' });
    }

    // ---- Subconsultas ----
    const subqueries = countSelects(upper) - 1;
    if (subqueries > 0) {
      const sCost = subqueries * COSTS.SUBQUERY_PER_LEVEL;
      result.cost += sCost;
      result.factors.push({ label: `${subqueries} subconsulta(s) anidada(s)`, cost: sCost, severity: 'penalty' });
    }

    // Nunca menor a 80ms
    result.cost = Math.max(result.cost, 80);

    return result;
  }

  function updateRowCounts(counts) {
    Object.assign(TABLE_ROWS, counts);
  }

  return { analyze, updateRowCounts, COSTS, TABLE_ROWS };

})();
