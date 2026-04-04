// =============================================================
// missions.js — Definición de Misiones y Niveles
// Niveles 0-4: Neysa (Supervisora) — 23 misiones
// Niveles 5-9: Ing. Luis Salas (Gerente) — próximamente
// Niveles 10-14: Dir. Morales (Director) — próximamente
// =============================================================

const MISSIONS = [

  // ============================================================
  // NIVEL 0 — INDUCCIÓN: Primer día en la planta
  // Neysa te presenta el sistema. Tono amigable pero directo.
  // ============================================================

  {
    id: 'L0M1', level: 0,
    levelName: 'Nivel 0 — Primer Día',
    character: 'F1',
    title: 'Conoce el terreno',
    intro: [
      '¡Hola! Soy Neysa. Supervisora de producción. Sé lo que estás pensando — sí, soy joven para el cargo.',
      'Bienvenido a la planta. Antes de que alguien te empiece a bombardear con pedidos, necesitas conocer el sistema.',
      'Primero lo primero: dime qué tablas tenemos en esta base de datos.',
    ],
    successDialog: [
      '¡Eso era exactamente! Ya sé que sabes dónde estás parado.',
      'Bien, sigamos. Hay mucho por aprender y el turno no espera.',
    ],
    failDialog: 'Mmm, eso no era lo que necesitaba. Muéstrame las tablas del sistema.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase().trim();
        return type === 'SHOW' || type === 'PRAGMA' ||
               (u.includes('SQLITE_MASTER') && u.includes('TABLE'));
      }
    },
    trapPossible: false,
    achievement: 'EXPLORER_1',
  },

  {
    id: 'L0M2', level: 0,
    character: 'F1',
    title: 'Conoce la estructura',
    intro: [
      '¡Bien! Ya sabes que existen las tablas. Un paso más.',
      'Ahora necesito que conozcas la estructura de la tabla de empleados antes de tocarla.',
      'En esta planta hay una regla: no se toca nada sin conocerlo primero. Yo la aprendí a las malas.',
      'Dame las columnas y sus tipos. Solo eso.',
    ],
    successDialog: [
      '¡Ahí está! Eso es exactamente lo que necesitaba.',
      'Conocer antes de tocar. Buena costumbre. De verdad.',
    ],
    failDialog: 'Ey, te pedí la estructura, no los datos. Son cosas distintas.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase().trim();
        const hasRows = result && result.rows && result.rows.length > 0;
        return hasRows && (
          (type === 'DESCRIBE' && u.includes('EMPLEADOS')) ||
          (type === 'PRAGMA' && u.includes('TABLE_INFO') && u.includes('EMPLEADOS'))
        );
      }
    },
    trapPossible: false,
    achievement: 'SCHEMA_READER',
  },

  {
    id: 'L0M3', level: 0,
    character: 'F1',
    title: 'Vista previa inteligente',
    intro: [
      'A ver. Hay operarios que hacen consultas y traen 5.000 filas de golpe.',
      'Saturan el sistema, no pueden leer nada, y me interrumpen para preguntarme qué pasó.',
      'Practica aquí conmigo: dame una muestra de la tabla de producción diaria. Solo una muestra.',
    ],
    successDialog: [
      '¡Sí! Exactamente eso. Rápido, limpio, sin inundar la pantalla.',
      'Con esa costumbre vas a sobrevivir muy bien acá.',
    ],
    failDialog: '¡Ey! ¿Para qué trajiste TODOS los registros? Te pedí una muestra, no todo el historial.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               /\bLIMIT\b/.test(u) &&
               /produccion_diaria|produccion/.test(u.toLowerCase());
      }
    },
    trapPossible: false,
    achievement: 'SMART_EXPLORER',
  },

  // ============================================================
  // NIVEL 1 — OPERACIONES DEL TURNO: Neysa necesita datos reales
  // Consultas básicas: filtros, conteos, orden, primer JOIN.
  // ============================================================

  {
    id: 'L1M1', level: 1,
    levelName: 'Nivel 1 — Operaciones del Turno',
    character: 'F1',
    title: 'Lista de empleados activos',
    intro: [
      'Ok, inducción terminada. Ahora trabaja de verdad.',
      'Necesito la lista de empleados activos. Solo nombre y cargo.',
      'No me traigas todas las columnas — ya sé lo que hay en esa tabla y en pantalla chica se hace un desastre.',
    ],
    successDialog: [
      '¡Así! Columnas específicas, sin basura innecesaria.',
      'Esa es la diferencia entre una consulta útil y un volcado de datos.',
    ],
    failDialog: '¿Por qué me traes todas las columnas? Solo pedí nombre y cargo. Prueba de nuevo.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               !u.includes('SELECT *') &&
               u.includes('NOMBRE') && u.includes('CARGO') &&
               u.includes('ACTIVO');
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L1M2', level: 1,
    character: 'F1',
    title: 'Turno de noche: ¿quién está?',
    intro: [
      'Tengo que coordinar la Línea 2 esta noche y necesito saber quién está en ese turno.',
      'Solo los activos, sin incluir a los que ya no trabajan acá.',
      'Filtra correctamente — los dos filtros son importantes.',
    ],
    successDialog: [
      'Perfecto. Con esto puedo asignar roles sin llamar a nadie.',
      '¿Ves lo rápido que fue con los filtros bien aplicados?',
    ],
    failDialog: 'Eso no es lo que necesito. Necesito turno = \'noche\' Y activo = 1. Los dos.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        const hasRows = result && result.rows && result.rows.length > 0;
        return type === 'SELECT' &&
               hasRows &&
               /NOCHE/.test(u) &&
               /WHERE/.test(u) &&
               /ACTIVO/.test(u);
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L1M3', level: 1,
    character: 'F1',
    title: 'Conteo de paradas por falla',
    intro: [
      'Estoy cerrando el informe del mes y necesito un número concreto.',
      '¿Cuántas paradas de tipo "falla" hay registradas en el sistema?',
      'Solo el número. No la lista completa — el número.',
    ],
    successDialog: [
      'Gracias. Un número concreto, eso es lo que necesito para el informe.',
      'Así se trabaja: datos precisos, no novelas.',
    ],
    failDialog: 'Te pedí un número, no una lista. COUNT() es lo que necesitas aquí.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('COUNT') &&
               u.includes('PARADAS');
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L1M4', level: 1,
    character: 'F1',
    title: 'Líneas con más problemas',
    intro: [
      'Necesito ver la producción ordenada por eficiencia, de menor a mayor.',
      'Quiero saber cuál línea tiene más problemas primero.',
      'Tabla produccion_diaria, columna eficiencia_porcentaje.',
    ],
    successDialog: [
      '¡Eso! La peor línea al tope, fácil de leer.',
      'Con esto sé a dónde ir primero cuando empiece el turno.',
    ],
    failDialog: 'El dato sin orden no me sirve. Necesito que esté ordenado de peor a mejor eficiencia.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('ORDER BY') &&
               (u.includes('EFICIENCIA') || u.includes('PRODUCCION'));
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L1M5', level: 1,
    character: 'F1',
    title: 'Paradas con nombre de máquina',
    intro: [
      'El parte de paradas tiene puro número de máquina y nadie sabe qué significa eso.',
      'Necesito el listado de paradas pero con el nombre de la máquina, no el ID.',
      'Para eso tienes que cruzar tablas. Inténtalo.',
    ],
    successDialog: [
      '¡Así sí! Ahora cualquiera puede leer el parte sin memorizar IDs.',
      'Los JOINs son tus amigos. Empiézate a acostumbrar.',
    ],
    failDialog: 'Solo me trajiste IDs de máquina. Necesito el nombre. Cruza las tablas con JOIN.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('JOIN') &&
               u.includes('MAQUINAS') &&
               u.includes('PARADAS');
      }
    },
    trapPossible: false,
    achievement: 'FIRST_JOIN',
  },

  // ============================================================
  // NIVEL 2 — ANÁLISIS DE PRODUCCIÓN: Datos procesados, no brutos
  // GROUP BY, AVG/SUM, cálculos derivados, HAVING, subconsultas.
  // ============================================================

  {
    id: 'L2M1', level: 2,
    levelName: 'Nivel 2 — Análisis de Producción',
    character: 'F1',
    title: 'Defectos promedio por línea',
    intro: [
      'Bien, ya sé que sabes buscar datos. Ahora necesito que los proceses.',
      'Dame el promedio de unidades defectuosas por línea de producción.',
      'Agrúpalos y ordénalos de mayor a menor problema.',
      'Tengo que saber dónde concentrar la supervisión esta semana.',
    ],
    successDialog: [
      '¡Así me gusta! Datos agrupados y comparables.',
      'Con este resumen sé en cuál línea tengo que estar encima.',
    ],
    failDialog: 'Los datos no están agrupados por línea. Necesito GROUP BY con AVG.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('GROUP BY') &&
               (u.includes('AVG') || u.includes('SUM')) &&
               (u.includes('DEFECTUOSA') || u.includes('PRODUCCION'));
      }
    },
    trapPossible: false,
    achievement: 'GROUP_MASTER',
  },

  {
    id: 'L2M2', level: 2,
    character: 'F1',
    title: 'Horas perdidas por tipo de parada',
    intro: [
      'Necesito cuántas horas en total hemos perdido, agrupadas por tipo de parada.',
      'Quiero saber si las fallas o el mantenimiento nos cuesta más tiempo.',
      'Tabla paradas, columna horas_perdidas. Agrupa por tipo_parada.',
    ],
    successDialog: [
      '¡Perfecto! Ahora tengo con qué justificar inversión en mantenimiento preventivo.',
      'Estos números son el argumento que le presento al gerente.',
    ],
    failDialog: 'Necesito las horas totales agrupadas por tipo. Usa GROUP BY y SUM.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('PARADAS') &&
               u.includes('GROUP BY') &&
               (u.includes('SUM') || u.includes('HORAS_PERDIDAS'));
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L2M3', level: 2,
    character: 'F1',
    title: 'Índice de rendimiento por línea',
    intro: [
      'El rendimiento real de una línea es lo que produce dividido entre su capacidad máxima diaria.',
      'Necesito ese ratio por línea: AVG(unidades_producidas) / capacidad_maxima_diaria.',
      'Cruza lineas_produccion con produccion_diaria. Agrupa por línea.',
      'Si el valor es menor que 1, la línea está por debajo de su capacidad.',
    ],
    successDialog: [
      '¡Exacto! Con este ratio de rendimiento sé qué líneas están sub-operando.',
      'Eso se llama análisis — no solo mostrar datos, sino procesarlos.',
    ],
    failDialog: 'No es el cálculo que pedí. Cruza las tablas, agrupa por línea y calcula el ratio.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('JOIN') &&
               (u.includes('AVG') || u.includes('/')) &&
               (u.includes('CAPACIDAD') || u.includes('LINEA')) &&
               u.includes('GROUP BY');
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L2M4', level: 2,
    character: 'F1',
    title: 'Máquinas con más de 2 paradas',
    intro: [
      'Quiero saber qué máquinas han tenido más de 2 paradas registradas.',
      'Solo las que tienen más de 2. Las que tienen 2 o menos, no me interesan.',
      'Para filtrar grupos ya agrupados existe un comando específico. ¿Sabes cuál?',
    ],
    successDialog: [
      '¡Exacto! HAVING filtra grupos, WHERE filtra filas. Son distintos.',
      'Con esto sé qué máquinas hay que revisar con urgencia.',
    ],
    failDialog: 'Necesito que filtres los grupos con HAVING, no con WHERE. Solo máquinas con más de 2 paradas.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('PARADAS') &&
               u.includes('GROUP BY') &&
               u.includes('HAVING') &&
               u.includes('COUNT');
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L2M5', level: 2,
    character: 'F1',
    title: 'Empleados por encima del salario promedio',
    intro: [
      'Tengo que enviar un reporte de quiénes están por encima del salario promedio de toda la planta.',
      'Dame los empleados cuyo salario supera el promedio.',
      'Eso requiere una subconsulta dentro del WHERE.',
    ],
    successDialog: [
      '¡Bien hecho! Subconsultas anidadas — ya estás pensando como analista.',
      'Estos son los que recursos humanos va a revisar primero.',
    ],
    failDialog: 'No está correcto. Necesitas: WHERE salario > (SELECT AVG(salario) FROM empleados).',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        // La subconsulta genera un segundo SELECT dentro del SQL
        return type === 'SELECT' &&
               u.includes('EMPLEADOS') &&
               u.includes('AVG') &&
               u.includes('SALARIO') &&
               u.split('SELECT').length > 2;
      }
    },
    trapPossible: false,
    achievement: 'SUBQUERY_PRO',
  },

  // ============================================================
  // NIVEL 3 — MODIFICACIÓN DE DATOS: DML con consecuencias reales
  // INSERT, UPDATE con cálculo, DELETE con WHERE — y una trampa fatal.
  // ============================================================

  {
    id: 'L3M1', level: 3,
    levelName: 'Nivel 3 — Modificación de Datos',
    character: 'F1',
    title: 'Registrar parada no planificada',
    intro: [
      'Escucha, esto ya no es solo consultar. Ahora vas a modificar datos reales.',
      'La máquina 12 acaba de parar por falla eléctrica. Son las 08:30 de hoy.',
      'Registra esa parada en el sistema. Tabla paradas.',
      'Si metes datos incorrectos, yo soy la responsable. Así que hazlo bien.',
    ],
    successDialog: [
      'Registrado. El sistema ya tiene constancia de la parada.',
      'Así es como se documenta un evento — en el momento, no horas después.',
    ],
    failDialog: 'El registro no quedó completo. Verifica que insertaste en la tabla paradas con los campos necesarios.',
    successCondition: {
      check: (type, sql, result) => {
        return type === 'INSERT' &&
               sql.toUpperCase().includes('PARADAS');
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L3M2', level: 3,
    character: 'F1',
    title: '⚠ Cambiar estado de máquina',
    intro: [
      'La máquina número 7 entró a mantenimiento programado esta mañana.',
      'Actualiza su estado en el sistema a "mantenimiento".',
      'Ojo — solo esa máquina. Si olvidas el WHERE, sabes lo que pasa.',
    ],
    successDialog: [
      'Correcto. Solo la máquina 7, nada más.',
      'Rápido y sin dañar nada. Así me gusta.',
    ],
    failDialog: 'Algo salió mal. Revisa que tengas el WHERE apuntando solo a la máquina 7.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'UPDATE' &&
               u.includes('MAQUINAS') &&
               u.includes('WHERE') &&
               u.includes('ESTADO');
      }
    },
    trapPossible: true,
    trapCondition: {
      check: sql => {
        const u = sql.toUpperCase();
        return u.includes('UPDATE') && u.includes('MAQUINAS') && !u.includes('WHERE');
      },
      trapDialog: [
        '¿Qué hiciste?',
        '¡Acabas de poner TODAS las máquinas de la planta en mantenimiento!',
        '¡La Línea 1, la 2, la 3, la 4 — todas paradas al mismo tiempo!',
        'Restaurando desde respaldo. No vuelvas a hacer eso.',
      ],
    },
    achievement: null,
  },

  {
    id: 'L3M3', level: 3,
    character: 'F1',
    title: '⚠ Ajuste salarial por cargo',
    intro: [
      'Salió la resolución de ajuste salarial aprobada por gerencia.',
      'Los técnicos de mantenimiento tienen un aumento del 5%.',
      'Actualiza los salarios. Solo los técnicos. El cálculo va directo en el UPDATE.',
      'Piensa bien el WHERE antes de ejecutar.',
    ],
    successDialog: [
      'Correcto. Solo los técnicos, como se pidió.',
      'Buen manejo — con WHERE y con el cálculo directo en la columna.',
    ],
    failDialog: 'Eso no está bien. Revisa el WHERE — solo deben subir los empleados con cargo de técnico.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'UPDATE' &&
               u.includes('EMPLEADOS') &&
               u.includes('SALARIO') &&
               u.includes('WHERE') &&
               (u.includes('TECNICO') || u.includes('CARGO'));
      }
    },
    trapPossible: true,
    trapCondition: {
      check: sql => {
        const u = sql.toUpperCase();
        return u.includes('UPDATE') && u.includes('EMPLEADOS') && u.includes('SALARIO') && !u.includes('WHERE');
      },
      trapDialog: [
        '¡No, no, NO!',
        '¡Le subiste el sueldo a TODOS los empleados de la planta!',
        'Son cientos de miles de pesos que no estaban en el presupuesto.',
        'Recursos Humanos ya me está llamando. Restaurando desde respaldo.',
      ],
    },
    achievement: null,
  },

  {
    id: 'L3M4', level: 3,
    character: 'F1',
    title: '⚠⚠ Limpiar registros obsoletos',
    intro: [
      'El auditor solicitó eliminar los registros de prueba del sistema antiguo.',
      'Son los de la tabla produccion_diaria con fecha anterior al año 2020.',
      'Esta operación es IRREVERSIBLE. Usa el WHERE o pierdes ABSOLUTAMENTE TODO.',
      'No te digo más. Piénsalo bien antes de ejecutar.',
    ],
    successDialog: [
      'Bien. Solo lo de antes del 2020, nada más.',
      'La operación correcta con el filtro correcto. Así se hace.',
    ],
    failDialog: null,
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'DELETE' &&
               u.includes('WHERE') &&
               (u.includes('FECHA') || u.includes('2020') || u.includes('2019'));
      }
    },
    trapPossible: true,
    trapCondition: {
      check: sql => {
        const u = sql.toUpperCase().trim();
        return /DELETE\s+FROM\s+\w+/i.test(sql) && !u.includes('WHERE');
      },
      trapDialog: ['...'],  // El engine maneja este caso como easter egg
      isDeleteEasterEgg: true,
    },
    achievement: 'TRAP_SURVIVOR',
  },

  {
    id: 'L3M5', level: 3,
    character: 'F1',
    title: 'Verificar la limpieza',
    intro: [
      'Bien. Ahora confirma que el DELETE quedó correcto.',
      'Cuántos registros de producción quedan con fecha anterior a 2020.',
      'Si lo hiciste bien, deberían ser cero.',
    ],
    successDialog: [
      'Cero registros viejos. La tabla quedó limpia.',
      'Esa verificación final es la diferencia entre un operador descuidado y uno confiable.',
    ],
    failDialog: 'Ese no es el resultado esperado. Verifica que el DELETE anterior fue correcto.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('COUNT') &&
               (u.includes('FECHA') || u.includes('2020') || u.includes('PRODUCCION'));
      }
    },
    trapPossible: false,
    achievement: null,
  },

  // ============================================================
  // NIVEL 4 — ANÁLISIS BAJO PRESIÓN: Neysa necesita datos YA
  // Multi-JOIN, subconsultas, misiones con tiempo límite.
  // ============================================================

  {
    id: 'L4M1', level: 4,
    levelName: 'Nivel 4 — Análisis Bajo Presión',
    character: 'F1',
    title: 'Reporte de eficiencia operativa',
    intro: [
      'Tengo una reunión en 15 minutos con el gerente y me pidió un reporte completo.',
      'Necesito: nombre de línea, total producido, total defectuoso y porcentaje de defectos.',
      'Cruza lineas_produccion con produccion_diaria. Agrupa por línea. Ordena de peor a mejor.',
      '¡Muévete!',
    ],
    successDialog: [
      '¡Eso! Esto es exactamente lo que necesitaba para la reunión.',
      'Llegué con datos reales. Gracias.',
    ],
    failDialog: 'El reporte está incompleto. Necesito JOIN, GROUP BY, porcentaje calculado y ORDER BY.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('JOIN') &&
               u.includes('GROUP BY') &&
               u.includes('ORDER BY') &&
               (u.includes('LINEA') || u.includes('PRODUCCION'));
      }
    },
    trapPossible: false,
    achievement: 'ANALYST',
  },

  {
    id: 'L4M2', level: 4,
    character: 'F1',
    title: 'Proveedores de materiales críticos',
    intro: [
      'Necesito saber qué proveedores suministran los materiales que están bajo stock mínimo.',
      'Cruza materiales con proveedores. Filtra donde stock_actual sea menor que stock_minimo.',
      'Dame: nombre del material, stock actual, stock mínimo, nombre del proveedor.',
    ],
    successDialog: [
      '¡Perfecto! Con esto llamo directamente a los proveedores correctos.',
      'Consulta orientada a decisiones — exactamente lo que necesito.',
    ],
    failDialog: 'No es lo que pedí. Necesito JOIN entre materiales y proveedores filtrando por stock bajo mínimo.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('JOIN') &&
               u.includes('MATERIALES') &&
               u.includes('PROVEEDORES') &&
               (u.includes('STOCK') || u.includes('MINIMO'));
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L4M3', level: 4,
    character: 'F1',
    title: '🚨 URGENTE: Técnicos de paradas activas',
    timed: true,
    timeLimitMs: 90000,
    intro: [
      '¡ESCUCHA! Tenemos una emergencia en la Línea 2 ahora mismo.',
      'Necesito saber INMEDIATAMENTE quién es el técnico responsable de cada parada activa.',
      'Paradas activas = las que no tienen fecha_fin registrada.',
      '¡Cruza paradas con empleados usando tecnico_responsable_id! Tienes 90 segundos.',
    ],
    successDialog: [
      '¡GRACIAS! Llamando al técnico ahora mismo.',
      'Eso es exactamente lo que pasa cuando el sistema y el analista responden rápido.',
    ],
    failDialog: 'No es correcto. Necesito JOIN entre paradas y empleados, filtrando paradas sin fecha_fin.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('JOIN') &&
               u.includes('PARADAS') &&
               u.includes('EMPLEADOS') &&
               (u.includes('TECNICO') || u.includes('FECHA_FIN'));
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L4M4', level: 4,
    character: 'F1',
    title: 'Inspectores de calidad: resumen',
    intro: [
      'El área de calidad necesita un análisis de resultados por inspector.',
      'Necesito: nombre del inspector, total de revisiones, cuántas pasaron y cuántas fueron rechazadas.',
      'Cruza calidad con empleados. Agrupa por inspector.',
    ],
    successDialog: [
      'Exacto. Así puedo ver si algún inspector tiene un patrón fuera de lo normal.',
      'Este tipo de análisis es lo que se hace antes de una auditoría seria.',
    ],
    failDialog: 'El análisis no está completo. Necesito la cuenta de aprobados y rechazados por inspector.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('JOIN') &&
               u.includes('CALIDAD') &&
               u.includes('EMPLEADOS') &&
               u.includes('GROUP BY') &&
               u.includes('COUNT');
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L4M5', level: 4,
    character: 'F1',
    title: '🚨 Resumen de cierre de turno',
    timed: true,
    timeLimitMs: 120000,
    intro: [
      '¡Último reto! Resumen completo del turno para el informe de cierre.',
      'Por línea de producción necesito: nombre de línea, total producido, eficiencia promedio y total de paradas.',
      'Cruza produccion_diaria, lineas_produccion y paradas. Agrupa por línea.',
      'Este informe sale a las 18:00 en punto. Tienes 2 minutos.',
    ],
    successDialog: [
      '¡Lo lograste! Este es el resumen que cierra el turno.',
      'Sabes construir consultas complejas bajo presión. Eso tiene valor real.',
      'Bienvenido al equipo. De verdad.',
    ],
    failDialog: 'No está completo. Necesito datos de las tres tablas combinadas y agrupados por línea.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        const tables = [
          u.includes('PRODUCCION_DIARIA'),
          u.includes('LINEAS_PRODUCCION'),
          u.includes('PARADAS'),
        ].filter(Boolean).length;
        return type === 'SELECT' &&
               tables >= 2 &&
               u.includes('GROUP BY') &&
               u.includes('JOIN') &&
               (u.includes('AVG') || u.includes('SUM') || u.includes('COUNT'));
      }
    },
    trapPossible: false,
    achievement: null,
  },

];

// Agrupación por niveles para el engine
const LEVELS = {
  0: { name: 'Primer Día',              missions: MISSIONS.filter(m => m.level === 0) },
  1: { name: 'Operaciones del Turno',   missions: MISSIONS.filter(m => m.level === 1) },
  2: { name: 'Análisis de Producción',  missions: MISSIONS.filter(m => m.level === 2) },
  3: { name: 'Modificación de Datos',   missions: MISSIONS.filter(m => m.level === 3) },
  4: { name: 'Análisis Bajo Presión',   missions: MISSIONS.filter(m => m.level === 4) },
};
