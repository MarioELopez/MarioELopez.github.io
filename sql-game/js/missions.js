// =============================================================
// missions.js — Definición de Misiones y Niveles
// Cada misión tiene: diálogos del NPC, condición de éxito,
// posibles trampas, logros asociados y el sprite del personaje.
// =============================================================

const MISSIONS = [

  // ===========================================================
  // NIVEL 0 — EXPLORACIÓN: Aprende a conocer una base de datos
  // Personaje: Neysa (F1) — Supervisora técnica, directa y con carácter
  // ===========================================================

  {
    id: 'L0M1', level: 0,
    levelName: 'Nivel 0 — Primer Día',
    character: 'F1',
    title: 'Conoce el terreno',
    intro: [
      '¡Hola! Soy Neysa. Supervisora de turno. Sí, ya sé, no me veo como supervisora — pero aquí estoy.',
      'Bienvenido a la planta. Antes de que el Ing. Vega te empiece a bombardear con pedidos, necesitas conocer el sistema.',
      'Primero lo primero: dime qué tablas tenemos en esta base de datos.',
      'Si no tienes idea de cómo hacerlo, escribe  pista  en la terminal. Sin drama, todos empezamos desde cero.',
    ],
    successDialog: [
      '¡Sí! Eso era exactamente. Ya sé que sabes dónde estás parado.',
      'Bien, sigamos antes de que Vega nos encuentre aquí charlando.',
    ],
    failDialog: 'Mmm, eso no era lo que necesitaba. Muéstrame las tablas del sistema. Escribe  pista  si no sabes cómo.',
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
      'En esta planta hay una regla: no se toca nada sin conocerlo primero. La aprendí a las malas.',
      'Dame las columnas y sus tipos. Solo eso. Escribe  pista  si necesitas el comando exacto.',
    ],
    successDialog: [
      '¡Ahí está! Eso es exactamente lo que necesitaba.',
      'Conocer antes de tocar. Buena costumbre. De verdad.',
    ],
    failDialog: 'Ey, te pedí la estructura, no los datos. Son cosas distintas. Escribe  pista  si no sabes cómo.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase().trim();
        return (type === 'DESCRIBE' ||
                (type === 'PRAGMA' && u.includes('TABLE_INFO') && u.includes('EMPLEADOS')));
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
      'Oye, escucha. El Ing. Vega es... intenso. Tipo, muy intenso.',
      'En cualquier momento te va a pedir datos de producción y si traes 5.000 filas de golpe, te va a mirar feo.',
      'Practica aquí conmigo: dame una muestra de la tabla de producción diaria.',
      'Solo una muestra. No el dump completo. LIMIT es tu mejor amigo. Escribe  pista  si lo necesitas.',
    ],
    successDialog: [
      '¡Sí! Exactamente eso. Rápido, limpio, sin inundar la pantalla.',
      'Con esa costumbre vas a sobrevivir con Vega. O al menos lo vas a intentar jaja.',
    ],
    failDialog: '¡Ey! ¿Para qué trajiste TODOS los registros? Te pedí una muestra. Usa LIMIT. Escribe  pista  si no sabes cómo.',
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

  // ===========================================================
  // NIVEL 1 — CONSULTAS BÁSICAS
  // Personaje: Ing. Vega (F2) — Gerente de planta, impaciente
  // ===========================================================

  {
    id: 'L1M1', level: 1,
    levelName: 'Nivel 1 — Consultas Básicas',
    character: 'F2',
    title: 'Lista de empleados activos',
    intro: [
      'Soy el Ing. Vega. Gerente de planta.',
      'Neysa me dijo que pasaste el primer día. Bien.',
      'Ahora trabaja de verdad. Necesito la lista de empleados activos.',
      'Solo nombre y cargo. No me traigas todas las columnas. Ya sé lo que hay en esa tabla.',
    ],
    successDialog: ['Correcto. Columnas específicas, sin descargar basura innecesaria.'],
    failDialog: '¿Por qué me traes todas las columnas? Solo pedí nombre y cargo. Escribe  pista  si lo necesitas.',
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
    character: 'F2',
    title: 'Filtrar por turno',
    intro: [
      'Dame los empleados del turno de noche. Solo los activos.',
      'Hay problemas con la Línea 2 en ese turno y necesito saber quién está ahí.',
    ],
    successDialog: ['Bien. ¿Ves lo rápido que fue con un filtro correcto?'],
    failDialog: 'Eso no es lo que necesito. Filtra por turno de noche, no me traigas a todos. Escribe  pista  si lo necesitas.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               /NOCHE/.test(u) &&
               /WHERE/.test(u);
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L1M3', level: 1,
    character: 'F2',
    title: 'Conteo de paradas',
    intro: [
      '¿Cuántas paradas de tipo falla tuvimos este año?',
      'Solo el número. No me traigas la lista completa.',
    ],
    successDialog: ['Eso es lo que necesitaba. Un número concreto.'],
    failDialog: 'Te pedí un número, no una lista. Existe COUNT() para eso. Escribe  pista  si no lo recuerdas.',
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
    character: 'F2',
    title: 'Peores líneas de producción',
    intro: [
      'Muéstrame las líneas ordenadas por eficiencia, de menor a mayor.',
      'Necesito saber cuál es la que más problemas tiene.',
    ],
    successDialog: ['Ahora tengo algo con qué entrar a la reunión.'],
    failDialog: 'El dato sin orden no me sirve. Necesito que esté ordenado de peor a mejor. Escribe  pista  si lo necesitas.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('ORDER BY') &&
               (u.includes('EFICIENCIA') || u.includes('LINEA'));
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L1M5', level: 1,
    character: 'F2',
    title: 'Primer JOIN',
    intro: [
      'Quiero ver las paradas con el nombre de la máquina que paró, no el ID.',
      'En una reunión con gerencia, los IDs no significan nada.',
    ],
    successDialog: ['Así se trabaja. Datos que cualquiera puede leer.'],
    failDialog: 'Solo me trajiste IDs de máquina. Necesito el nombre. Cruza las tablas. Escribe  pista  si no sabes cómo hacer el JOIN.',
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

  // ===========================================================
  // NIVEL 2 — OPERACIONES: INSERT, UPDATE, DELETE con cuidado
  // Personaje: Ing. Vega (F2) — Ahora más exigente
  // ===========================================================

  {
    id: 'L2M1', level: 2,
    levelName: 'Nivel 2 — Operaciones de Datos',
    character: 'F2',
    title: 'Actualizar estado de máquina',
    intro: [
      'La máquina número 7 entró a mantenimiento esta mañana.',
      'Actualiza su estado en el sistema. Solo esa máquina.',
    ],
    successDialog: ['Correcto. Rápido y sin dañar nada.'],
    failDialog: 'Algo salió mal. Revisa que tengas el WHERE correcto.',
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
        '¡Acabas de cambiar el estado de TODAS las máquinas de la planta!',
        'Llama a IT. Ahora. Tenemos que restaurar el estado desde el respaldo.',
      ],
    },
    achievement: null,
  },

  {
    id: 'L2M2', level: 2,
    character: 'F2',
    title: 'Registrar nueva parada',
    intro: [
      'La Línea 3 tuvo una parada por falla a las 08:30 de hoy.',
      'Registra esa parada. La máquina afectada es la número 12.',
    ],
    successDialog: ['Registrado. Así se documenta un evento de planta.'],
    failDialog: 'El registro no quedó completo. Verifica que insertaste en la tabla correcta con todos los campos.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'INSERT' &&
               u.includes('PARADAS');
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L2M3', level: 2,
    character: 'F2',
    title: '⚠ Borrar registros de prueba',
    intro: [
      'Hay registros de prueba en la tabla de producción del sistema anterior.',
      'Son los que tienen fecha anterior al 2020.',
      'Bórralos.',
    ],
    successDialog: ['Bien. Solo lo que correspondía, nada más. Así se trabaja.'],
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
        const u = sql.toUpperCase();
        return u.includes('DELETE') && u.includes('PRODUCCION') && !u.includes('WHERE');
      },
      trapDialog: [
        '¡¿Qué acabas de hacer?!',
        '¡Borraste TODOS los registros de producción! ¡Años de datos!',
        'Eso es una auditoría fallida. Tenemos que llamar a respaldo AHORA.',
      ],
    },
    achievement: null,
  },

  {
    id: 'L2M4', level: 2,
    character: 'F2',
    title: 'Promedio de defectos por línea',
    intro: [
      'Necesito el promedio de unidades defectuosas por línea de producción.',
      'Agrúpalos y ordénalos de mayor a menor problema.',
      'Tengo una reunión en una hora.',
    ],
    successDialog: ['Ahora sí tengo números para la reunión.'],
    failDialog: 'Los datos no están agrupados por línea. No me sirven así.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('GROUP BY') &&
               (u.includes('AVG') || u.includes('SUM') || u.includes('DEFECTUOSA'));
      }
    },
    trapPossible: false,
    achievement: 'GROUP_MASTER',
  },

  {
    id: 'L2M5', level: 2,
    character: 'F2',
    title: '⚠ Ajuste salarial de técnicos',
    intro: [
      'Salió la resolución de ajuste salarial.',
      'Los técnicos de mantenimiento tienen un aumento del 8%.',
      'Actualiza los salarios.',
    ],
    successDialog: ['Correcto. Solo los técnicos, como se pidió.'],
    failDialog: 'Eso no está bien. Revisa a quiénes afectaste exactamente.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'UPDATE' &&
               u.includes('SALARIO') &&
               u.includes('WHERE') &&
               (u.includes('TECNICO') || u.includes('CARGO') || u.includes('MANTENIMIENTO'));
      }
    },
    trapPossible: true,
    trapCondition: {
      check: sql => {
        const u = sql.toUpperCase();
        return u.includes('UPDATE') && u.includes('SALARIO') && !u.includes('WHERE');
      },
      trapDialog: [
        '¿Subiste el sueldo a TODOS los empleados?',
        'Eso son millones de pesos que no estaban en el presupuesto.',
        '¿Sabe RRHH lo que acabas de hacer?',
      ],
    },
    achievement: null,
  },

  // ===========================================================
  // NIVEL 3 — ANÁLISIS EJECUTIVO
  // Personaje: Dir. Morales (A1) — Ejecutivo, frío y formal
  // ===========================================================

  {
    id: 'L3M1', level: 3,
    levelName: 'Nivel 3 — Análisis Ejecutivo',
    character: 'A1',
    title: 'Reporte de eficiencia por línea',
    intro: [
      'Buenos días. Soy el Director Morales.',
      'Necesito el top 5 de líneas con mayor tasa de defectos del último año.',
      'Quiero: nombre de línea, total producido, total defectuoso y porcentaje.',
      'Ordenado de peor a mejor. Para el directorio.',
    ],
    successDialog: ['Esto es lo que necesito. Bien ejecutado.'],
    failDialog: 'El reporte está incompleto. Tengo una presentación en una hora.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('JOIN') &&
               u.includes('GROUP BY') &&
               u.includes('ORDER BY') &&
               u.includes('LIMIT');
      }
    },
    trapPossible: false,
    achievement: 'ANALYST',
  },

  {
    id: 'L3M2', level: 3,
    character: 'A1',
    title: 'Costo de paradas por tipo',
    intro: [
      '¿Cuántas horas perdimos por paradas no programadas este año?',
      'Agrúpelo por tipo de parada y por máquina.',
      'Solo las de tipo falla o accidente.',
    ],
    successDialog: ['Estos números van directo al informe de pérdidas operacionales.'],
    failDialog: 'Los filtros no están correctamente aplicados. Solo falla y accidente.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               u.includes('PARADAS') &&
               u.includes('GROUP BY') &&
               u.includes('WHERE') &&
               (u.includes('FALLA') || u.includes('ACCIDENTE'));
      }
    },
    trapPossible: false,
    achievement: null,
  },

  {
    id: 'L3M3', level: 3,
    character: 'A1',
    title: '⚠ Limpieza de registros de calidad',
    intro: [
      'El auditor solicitó eliminar los registros de calidad rechazados del año anterior.',
      'Están en la tabla de calidad.',
      'Proceda.',
    ],
    successDialog: [
      'Correcto. Solo lo del año anterior, como se solicitó.',
      'El auditor tendrá los datos limpios para su revisión.',
    ],
    failDialog: null,
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'DELETE' &&
               u.includes('CALIDAD') &&
               u.includes('WHERE') &&
               (u.includes('FECHA') || u.includes('RESULTADO') || u.includes('RECHAZADO'));
      }
    },
    trapPossible: true,
    trapCondition: {
      check: sql => {
        const u = sql.toUpperCase();
        return u.includes('DELETE') && u.includes('CALIDAD') && !u.includes('WHERE');
      },
      trapDialog: [
        'Acaba de eliminar la tabla de calidad completa.',
        'Eso incluye registros activos que el auditor necesita revisar.',
        'Esto constituye una falla grave de auditoría. Área legal ha sido notificada.',
      ],
    },
    achievement: 'TRAP_SURVIVOR',
  },

  {
    id: 'L3M4', level: 3,
    character: 'A1',
    title: 'Empleados sin actividad reciente',
    intro: [
      'Necesito saber qué empleados no tienen registros de producción en los últimos 6 meses.',
      'Solo nombre y cargo.',
      'Vamos a revisar esas asignaciones.',
    ],
    successDialog: [
      'Lista recibida.',
      'Gracias. Puede retirarse.',
    ],
    failDialog: 'Necesito los empleados SIN registros, no los que sí tienen.',
    successCondition: {
      check: (type, sql, result) => {
        const u = sql.toUpperCase();
        return type === 'SELECT' &&
               (u.includes('NOT IN') || u.includes('NOT EXISTS') ||
                (u.includes('LEFT JOIN') && u.includes('NULL'))) &&
               u.includes('EMPLEADOS');
      }
    },
    trapPossible: false,
    achievement: 'SUBQUERY_PRO',
  },

];

// Agrupación por niveles para el engine
const LEVELS = {
  0: { name: 'Primer Día',           missions: MISSIONS.filter(m => m.level === 0) },
  1: { name: 'Consultas Básicas',    missions: MISSIONS.filter(m => m.level === 1) },
  2: { name: 'Operaciones de Datos', missions: MISSIONS.filter(m => m.level === 2) },
  3: { name: 'Análisis Ejecutivo',   missions: MISSIONS.filter(m => m.level === 3) },
};
