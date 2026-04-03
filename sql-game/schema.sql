-- =============================================================
-- PLANTA INDUSTRIAL — Base de Datos del Juego SQL
-- Solo estructura. Los datos se cargan por separado.
-- Compatible con SQLite (sql.js en navegador)
-- =============================================================

CREATE TABLE IF NOT EXISTS lineas_produccion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  producto_principal TEXT,
  capacidad_maxima_diaria INTEGER,
  turno_operativo TEXT
);

CREATE TABLE IF NOT EXISTS maquinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  linea_id INTEGER,
  tipo TEXT,
  estado TEXT DEFAULT 'activa',
  fecha_instalacion TEXT,
  vida_util_anos INTEGER,
  FOREIGN KEY (linea_id) REFERENCES lineas_produccion(id)
);

CREATE TABLE IF NOT EXISTS departamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  gerente_id INTEGER,
  presupuesto_mensual REAL
);

CREATE TABLE IF NOT EXISTS empleados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  rut TEXT UNIQUE,
  cargo TEXT,
  departamento_id INTEGER,
  turno TEXT,
  salario REAL,
  fecha_ingreso TEXT,
  activo INTEGER DEFAULT 1,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

CREATE TABLE IF NOT EXISTS paradas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  maquina_id INTEGER NOT NULL,
  tipo_parada TEXT,
  fecha_inicio TEXT,
  fecha_fin TEXT,
  horas_perdidas REAL,
  causa TEXT,
  tecnico_responsable_id INTEGER,
  FOREIGN KEY (maquina_id) REFERENCES maquinas(id),
  FOREIGN KEY (tecnico_responsable_id) REFERENCES empleados(id)
);

CREATE TABLE IF NOT EXISTS produccion_diaria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  linea_id INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  turno TEXT,
  operario_id INTEGER,
  unidades_producidas INTEGER DEFAULT 0,
  unidades_defectuosas INTEGER DEFAULT 0,
  eficiencia_porcentaje REAL,
  FOREIGN KEY (linea_id) REFERENCES lineas_produccion(id),
  FOREIGN KEY (operario_id) REFERENCES empleados(id)
);

CREATE TABLE IF NOT EXISTS proveedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  pais TEXT,
  contacto TEXT,
  calidad_rating INTEGER,
  tiempo_entrega_dias INTEGER
);

CREATE TABLE IF NOT EXISTS materiales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE,
  stock_actual REAL DEFAULT 0,
  stock_minimo REAL,
  unidad_medida TEXT,
  proveedor_id INTEGER,
  costo_unitario REAL,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);

CREATE TABLE IF NOT EXISTS calidad (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produccion_id INTEGER NOT NULL,
  inspector_id INTEGER,
  resultado TEXT,
  ppm_defectos REAL,
  observaciones TEXT,
  FOREIGN KEY (produccion_id) REFERENCES produccion_diaria(id),
  FOREIGN KEY (inspector_id) REFERENCES empleados(id)
);

CREATE TABLE IF NOT EXISTS mantenimiento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  maquina_id INTEGER NOT NULL,
  tipo TEXT,
  fecha TEXT,
  tecnico_id INTEGER,
  horas_duracion REAL,
  costo REAL,
  estado TEXT DEFAULT 'pendiente',
  FOREIGN KEY (maquina_id) REFERENCES maquinas(id),
  FOREIGN KEY (tecnico_id) REFERENCES empleados(id)
);
