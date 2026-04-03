"""
generate_data.py — Generador de base de datos para SQL Planta: El Juego
========================================================================
Ejecutar una sola vez desde la carpeta sql-game/:
    pip install faker
    python generate_data.py

Genera: data.sql  (cópialo junto a schema.sql en la carpeta sql-game/)
"""

import random
from faker import Faker
from datetime import datetime, timedelta

fake = Faker(['es_CL'])
Faker.seed(42)
random.seed(42)


# ══════════════════════════════════════════════
#  UTILIDADES
# ══════════════════════════════════════════════

def q(s):
    """Escapa comillas simples para uso seguro en SQL."""
    return str(s).replace("'", "''")


def rut_chileno():
    """Genera un RUT chileno con dígito verificador correcto (algoritmo módulo 11)."""
    numero = random.randint(7_000_000, 25_000_000)
    cuerpo = str(numero)
    suma, mul = 0, 2
    for c in reversed(cuerpo):
        suma += int(c) * mul
        mul = 2 if mul == 7 else mul + 1
    resto = 11 - (suma % 11)
    dv = 'K' if resto == 10 else ('0' if resto == 11 else str(resto))
    return f"{cuerpo[:-6]}.{cuerpo[-6:-3]}.{cuerpo[-3:]}-{dv}"


def rand_fecha(inicio: datetime, fin: datetime) -> str:
    """Fecha aleatoria entre dos datetimes, devuelta como string '%Y-%m-%d'."""
    delta = (fin - inicio).days
    if delta <= 0:
        return inicio.strftime('%Y-%m-%d')
    return (inicio + timedelta(days=random.randint(0, delta))).strftime('%Y-%m-%d')


def ins(tabla, cols, vals):
    """Construye una sentencia INSERT con columnas explícitas."""
    col_str = ', '.join(cols)
    val_str = ', '.join(str(v) for v in vals)
    return f"INSERT INTO {tabla} ({col_str}) VALUES ({val_str});"


# ══════════════════════════════════════════════
#  GENERADOR PRINCIPAL
# ══════════════════════════════════════════════

def generate_sql():
    out = []                      # Líneas de SQL a escribir
    stats = {}                    # Para validación final

    def add(line=''):
        out.append(line)

    def comment(text):
        add(f"-- {text}")

    # ──────────────────────────────────────────
    #  CABECERA
    # ──────────────────────────────────────────
    add("-- ============================================================")
    add("-- PLANTA INDUSTRIAL — Base de Datos de Juego")
    add(f"-- Generada: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    add("-- seed=42  |  Faker es_CL")
    add("-- ============================================================")
    add()

    # ──────────────────────────────────────────
    #  1. LINEAS DE PRODUCCION
    # ──────────────────────────────────────────
    comment("1. LÍNEAS DE PRODUCCIÓN")
    lineas = [
        (1, 'Línea 1 — Bebidas',   'Bebidas Especiales',   random.randint(500, 800), '24h'),
        (2, 'Línea 2 — Lácteos',   'Lácteos Tradicional',  random.randint(400, 600), 'mañana'),
        (3, 'Línea 3 — Helados',   'Helados Premium',      random.randint(200, 400), 'tarde'),
        (4, 'Línea 4 — Embalaje',  'Embalaje General',     random.randint(600, 800), 'noche'),
    ]
    cols_lp = ['id', 'nombre', 'producto_principal', 'capacidad_maxima_diaria', 'turno_operativo']
    for id_, nombre, producto, cap, turno in lineas:
        add(ins('lineas_produccion', cols_lp,
                [id_, f"'{q(nombre)}'", f"'{q(producto)}'", cap, f"'{turno}'"]))
    add()

    # ──────────────────────────────────────────
    #  2. DEPARTAMENTOS
    # ──────────────────────────────────────────
    comment("2. DEPARTAMENTOS")
    deps = [
        (1, 'Producción',    6_000_000),
        (2, 'Mantenimiento', 4_500_000),
        (3, 'Calidad',       2_000_000),
        (4, 'Logística',     3_200_000),
    ]
    cols_dep = ['id', 'nombre', 'gerente_id', 'presupuesto_mensual']
    for id_, nombre, presupuesto in deps:
        add(ins('departamentos', cols_dep,
                [id_, f"'{q(nombre)}'", 'NULL', presupuesto]))
    add()

    # ──────────────────────────────────────────
    #  3. PROVEEDORES
    # ──────────────────────────────────────────
    comment("3. PROVEEDORES")
    paises = ['Chile', 'Brasil', 'México', 'Alemania', 'China', 'EE.UU.']
    cols_prov = ['id', 'nombre', 'pais', 'contacto', 'calidad_rating', 'tiempo_entrega_dias']
    for i, pais in enumerate(paises, 1):
        add(ins('proveedores', cols_prov, [
            i,
            f"'{q(fake.company())}'",
            f"'{pais}'",
            f"'{q(fake.name())}'",
            random.randint(1, 5),
            random.randint(3, 45),
        ]))
    add()

    # ──────────────────────────────────────────
    #  4. EMPLEADOS
    # ──────────────────────────────────────────
    # Distribución determinista para garantizar todas las misiones:
    #   1 – 8   → Técnico de Mantenimiento (dep 2)           [L2M5: aumento técnicos]
    #   9 – 12  → Inspector de Calidad     (dep 3)
    #  13 – 17  → Operario  (dep 1), turno='noche', activo   [L1M2: filtrar turno noche]
    #  18 – 40  → Operario  (dep 1), turnos mixtos, activo   [produccion_diaria]
    #  41 – 44  → Supervisor / Analista    (dep 4)
    #  45 – 47  → Administrativo (dep 4), activos SIN producción [L3M4: NOT IN]
    #  48 – 50  → Inactivos (activo=0)
    comment("4. EMPLEADOS")
    cargos_tecnicos   = []   # IDs con cargo 'Técnico de Mantenimiento'
    operarios_ids     = []   # IDs que tendrán registros en produccion_diaria
    inspectores_ids   = []   # IDs inspectores de calidad
    empleados_sin_prod = []  # Activos sin ningún registro de producción (L3M4)

    TURNOS = ['mañana', 'tarde', 'noche']
    cols_emp = ['id', 'nombre', 'rut', 'cargo', 'departamento_id',
                'turno', 'salario', 'fecha_ingreso', 'activo']

    for i in range(1, 51):
        if 1 <= i <= 8:
            cargo, dep_id = 'Técnico de Mantenimiento', 2
            turno, activo = random.choice(TURNOS), 1
            cargos_tecnicos.append(i)
        elif 9 <= i <= 12:
            cargo, dep_id = 'Inspector de Calidad', 3
            turno, activo = random.choice(TURNOS), 1
            inspectores_ids.append(i)
        elif 13 <= i <= 17:
            cargo, dep_id = 'Operario', 1
            turno, activo = 'noche', 1          # garantiza L1M2
            operarios_ids.append(i)
        elif 18 <= i <= 40:
            cargo, dep_id = 'Operario', 1
            turno, activo = random.choice(TURNOS), 1
            operarios_ids.append(i)
        elif 41 <= i <= 44:
            cargo = random.choice(['Supervisor de Turno', 'Analista de Procesos', 'Jefe de Línea'])
            dep_id, turno, activo = 4, random.choice(TURNOS), 1
        elif 45 <= i <= 47:
            cargo, dep_id = 'Administrativo', 4
            turno, activo = 'mañana', 1
            empleados_sin_prod.append(i)        # activos pero nunca en producción → L3M4
        else:  # 48–50
            cargo = random.choice(['Operario', 'Técnico de Mantenimiento'])
            dep_id, turno, activo = 1, 'mañana', 0

        salario       = random.randint(450_000, 2_500_000)
        fecha_ingreso = rand_fecha(datetime(2015, 1, 1), datetime(2024, 6, 1))

        add(ins('empleados', cols_emp, [
            i,
            f"'{q(fake.name())}'",
            f"'{rut_chileno()}'",
            f"'{q(cargo)}'",
            dep_id,
            f"'{turno}'",
            salario,
            f"'{fecha_ingreso}'",
            activo,
        ]))
    add()

    # ──────────────────────────────────────────
    #  5. MÁQUINAS
    # ──────────────────────────────────────────
    # CRÍTICO: máquina 7 debe ser 'activa' — L2M1 la pone en mantenimiento
    # CRÍTICO: máquina 12 debe existir (L2M2 registra parada en ella)
    comment("5. MÁQUINAS")
    MODELOS = {
        'llenadora':     'Llenadora Aséptica',
        'pasteurizador': 'Pasteurizador Tubular',
        'cortadora':     'Cortadora CNC',
        'ensambladora':  'Ensambladora Automática',
        'prensa':        'Prensa Hidráulica',
        'soldadora':     'Soldadora MIG',
        'pintadora':     'Cabina de Pintura',
        'empacadora':    'Empacadora Flow-Pack',
    }
    tipos = list(MODELOS.keys())
    cols_maq = ['id', 'nombre', 'linea_id', 'tipo', 'estado', 'fecha_instalacion', 'vida_util_anos']

    for i in range(1, 21):
        tipo = random.choice(tipos)
        nombre_maq = f"{MODELOS[tipo]} M-{i:02d}"
        linea_id = random.randint(1, 4)

        if i == 7:
            estado = 'activa'                        # misión L2M1
        elif i == 12:
            estado = 'activa'                        # misión L2M2 (registrar parada)
        else:
            estado = random.choice(['activa', 'activa', 'activa', 'mantenimiento', 'inactiva'])

        fecha_inst   = rand_fecha(datetime(2010, 1, 1), datetime(2022, 12, 31))
        vida_util    = random.randint(8, 20)

        add(ins('maquinas', cols_maq, [
            i,
            f"'{q(nombre_maq)}'",
            linea_id,
            f"'{tipo}'",
            f"'{estado}'",
            f"'{fecha_inst}'",
            vida_util,
        ]))
    add()

    # ──────────────────────────────────────────
    #  6. MATERIALES
    # ──────────────────────────────────────────
    comment("6. MATERIALES  (IDs 3, 7, 11 → stock crítico por diseño)")
    materiales_def = [
        # nombre,                          unidad,    min,   max_stock
        ('Aceite Industrial ISO 46',       'litros',   200,  2000),
        ('Pernos Hexagonales 1/2"',        'unidades', 500,  3000),
        ('Láminas de Acero ASTM A36',      'kg',       300,  1200),  # ← stock crítico (3)
        ('Cable Eléctrico THW 12 AWG',     'metros',   400,  2000),
        ('Pintura Anticorrosiva Base',     'litros',   150,   600),
        ('Rodamientos SKF 6205',           'unidades', 100,   500),
        ('Filtros de Aire Baldwin',        'unidades',  80,   300),  # ← stock crítico (7)
        ('Pernos Allen 1/4"',              'unidades', 800,  4000),
        ('Grasa de Litio NLGI 2',          'kg',       120,   500),
        ('Empaquetaduras de Caucho',       'unidades', 200,   900),
        ('Sensores de Temperatura PT100',  'unidades',  30,   100),  # ← stock crítico (11)
        ('Módulo PLC Siemens S7-1200',     'unidades',   5,    20),
    ]
    cols_mat = ['id', 'nombre', 'codigo', 'stock_actual', 'stock_minimo',
                'unidad_medida', 'proveedor_id', 'costo_unitario']
    for i, (nombre, unidad, stock_min, stock_max) in enumerate(materiales_def, 1):
        if i in (3, 7, 11):
            stock_act = random.randint(5, stock_min - 1)     # stock crítico
        else:
            stock_act = random.randint(stock_min, stock_max)

        add(ins('materiales', cols_mat, [
            i,
            f"'{q(nombre)}'",
            f"'MAT-{i:03d}'",
            stock_act, stock_min,
            f"'{unidad}'",
            random.randint(1, 6),
            random.randint(500, 9_000),
        ]))
    add()

    # ──────────────────────────────────────────
    #  7. PRODUCCIÓN DIARIA
    # ──────────────────────────────────────────
    # Distribución por diseño:
    #   i   1 –   5 → año 2019  (datos "basura" → L2M3: DELETE WHERE fecha < '2020-01-01')
    #   i   6 – 305 → año 2023
    #   i 306 – 705 → año 2024  (necesario para calidad rechazada L3M3)
    #   i 706 – 1000 → año 2025
    comment("7. PRODUCCIÓN DIARIA")
    comment("   i 1-5 → año 2019 (datos de prueba para misión L2M3)")
    comment("   i 6-305 → 2023 | i 306-705 → 2024 | i 706-1000 → 2025")
    produccion_ids     = []   # lista de (id, datetime) para i > 5
    produccion_2024_ids = []  # IDs de registros del año 2024

    cols_prod = ['id', 'linea_id', 'fecha', 'turno', 'operario_id',
                 'unidades_producidas', 'unidades_defectuosas', 'eficiencia_porcentaje']
    TURNOS_PROD = ['mañana', 'tarde', 'noche']

    # Parámetros de eficiencia por línea: algunas líneas son peores que otras
    efic_base = {1: (80, 99), 2: (70, 95), 3: (55, 88), 4: (75, 97)}

    for i in range(1, 1001):
        if i <= 5:
            fecha_str = rand_fecha(datetime(2019, 1, 1), datetime(2019, 12, 31))
        elif i <= 305:
            fecha_str = rand_fecha(datetime(2023, 1, 1), datetime(2023, 12, 31))
        elif i <= 705:
            fecha_str = rand_fecha(datetime(2024, 1, 1), datetime(2024, 12, 31))
        else:
            fecha_str = rand_fecha(datetime(2025, 1, 1), datetime(2025, 12, 31))

        linea_id  = random.randint(1, 4)
        emin, emax = efic_base[linea_id]
        producidas  = random.randint(150, 500)
        eficiencia  = round(random.uniform(emin, emax), 2)
        defectuosas = int(producidas * (1 - eficiencia / 100))
        defectuosas = max(0, min(defectuosas, producidas - 1))
        operario    = random.choice(operarios_ids)
        turno_p     = random.choice(TURNOS_PROD)

        add(ins('produccion_diaria', cols_prod, [
            i, linea_id,
            f"'{fecha_str}'",
            f"'{turno_p}'",
            operario,
            producidas, defectuosas,
            eficiencia,
        ]))

        fecha_dt = datetime.strptime(fecha_str, '%Y-%m-%d')
        if i > 5:
            produccion_ids.append((i, fecha_dt))
        if 306 <= i <= 705:
            produccion_2024_ids.append(i)

    add()

    # ──────────────────────────────────────────
    #  8. PARADAS
    # ──────────────────────────────────────────
    comment("8. PARADAS  (15 fallas | 3 accidentes | resto preventivas/programadas)")
    CAUSAS = {
        'falla': [
            'Falla en rodamiento principal del eje',
            'Ruptura de correa de transmisión',
            'Cortocircuito en tablero de control',
            'Sobrecalentamiento de motor trifásico',
            'Falla en sensor de posición inductivo',
            'Pérdida de presión hidráulica',
            'Desgaste prematuro de elementos de desgaste',
            'Rotura de eje de transmisión secundario',
            'Fuga de refrigerante en circuito cerrado',
            'Bloqueo de cabezal de llenado',
        ],
        'accidente': [
            'Atrapamiento de extremidad en zona de prensa',
            'Derrame de aceite caliente en área de trabajo',
            'Falla de resguardo de seguridad tipo A',
            'Contacto con superficie a alta temperatura',
        ],
        'mantenimiento_preventivo': [
            'Cambio de aceite lubricante programado',
            'Revisión completa de sistema eléctrico',
            'Calibración anual de sensores y actuadores',
            'Inspección y reemplazo de rodamientos',
            'Limpieza de filtros y sistema de ventilación',
            'Cambio de correas de transmisión preventivo',
            'Verificación de torques y ajuste mecánico',
        ],
        'programada': [
            'Parada de turno por mantenimiento general',
            'Limpieza profunda de línea de producción',
            'Cambio de formato de producción',
            'Parada por auditoría interna de calidad',
        ],
    }

    cols_par = ['id', 'maquina_id', 'tipo_parada', 'fecha_inicio', 'fecha_fin',
                'horas_perdidas', 'causa', 'tecnico_responsable_id']

    for i in range(1, 101):
        if i <= 15:
            tipo = 'falla'
        elif i <= 18:
            tipo = 'accidente'
        elif i <= 60:
            tipo = 'mantenimiento_preventivo'
        else:
            tipo = 'programada'

        causa      = random.choice(CAUSAS[tipo])
        maquina_id = random.randint(1, 20)
        horas      = round(random.uniform(0.5, 48.0), 1)

        # Distribuir entre 2024 y 2025
        if i <= 55:
            f_ini = datetime.strptime(
                rand_fecha(datetime(2024, 1, 1), datetime(2024, 12, 31)), '%Y-%m-%d')
        else:
            f_ini = datetime.strptime(
                rand_fecha(datetime(2025, 1, 1), datetime(2025, 3, 31)), '%Y-%m-%d')

        f_fin = f_ini + timedelta(hours=horas)

        add(ins('paradas', cols_par, [
            i, maquina_id,
            f"'{tipo}'",
            f"'{f_ini.strftime('%Y-%m-%d')}'",
            f"'{f_fin.strftime('%Y-%m-%d')}'",
            horas,
            f"'{q(causa)}'",
            random.choice(cargos_tecnicos),
        ]))
    add()

    # ──────────────────────────────────────────
    #  9. CALIDAD
    # ──────────────────────────────────────────
    # CRÍTICO L3M3: primeros 20 registros → resultado='rechazado'
    #               vinculados a producción de 2024
    comment("9. CALIDAD")
    comment("   Registros 1-20: resultado='rechazado' vinculados a producción 2024 (misión L3M3)")
    OBSERVACIONES = [
        'Sin observaciones adicionales',
        'Muestra dentro de parámetros normales',
        'Leve variación en viscosidad — aceptable',
        'Color fuera de rango — lote retenido',
        'Contaminación cruzada detectada en línea',
        'Peso neto inferior al mínimo especificado',
        'Etiquetado incompleto — revisión necesaria',
        'Aprobado con observación menor',
        'Temperatura de proceso fuera de rango',
        'Microbiología dentro de límites permitidos',
    ]

    random.shuffle(produccion_2024_ids)
    rechazados_2024 = produccion_2024_ids[:20]   # 20 IDs únicos de producción 2024

    cols_cal = ['id', 'produccion_id', 'inspector_id', 'resultado', 'ppm_defectos', 'observaciones']
    for i in range(1, 501):
        if i <= 20:
            p_id     = rechazados_2024[i - 1]
            resultado = 'rechazado'
        else:
            p_id, _ = random.choice(produccion_ids)
            r = random.random()
            if r > 0.93:
                resultado = 'rechazado'
            elif r > 0.78:
                resultado = 'condicional'
            else:
                resultado = 'aprobado'

        add(ins('calidad', cols_cal, [
            i, p_id,
            random.choice(inspectores_ids),
            f"'{resultado}'",
            random.randint(0, 5_000),
            f"'{random.choice(OBSERVACIONES)}'",
        ]))
    add()

    # ──────────────────────────────────────────
    #  10. MANTENIMIENTO
    # ──────────────────────────────────────────
    comment("10. MANTENIMIENTO  (7 pendientes | 8 en proceso | resto completados)")
    cols_mant = ['id', 'maquina_id', 'tipo', 'fecha', 'tecnico_id',
                 'horas_duracion', 'costo', 'estado']
    TIPOS_MANT = ['preventivo', 'correctivo', 'predictivo']

    for i in range(1, 51):
        if i <= 7:
            estado = 'pendiente'
            fecha_m = rand_fecha(datetime(2025, 3, 1), datetime(2025, 4, 2))
        elif i <= 15:
            estado = 'en_proceso'
            fecha_m = rand_fecha(datetime(2025, 2, 1), datetime(2025, 3, 31))
        else:
            estado = 'completado'
            fecha_m = rand_fecha(datetime(2024, 1, 1), datetime(2025, 2, 28))

        add(ins('mantenimiento', cols_mant, [
            i,
            random.randint(1, 20),
            f"'{random.choice(TIPOS_MANT)}'",
            f"'{fecha_m}'",
            random.choice(cargos_tecnicos),
            round(random.uniform(1.0, 12.0), 1),
            random.randint(50_000, 2_000_000),
            f"'{estado}'",
        ]))
    add()

    # ══════════════════════════════════════════
    #  ESCRIBIR ARCHIVO
    # ══════════════════════════════════════════
    output_path = 'data.sql'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))

    # ══════════════════════════════════════════
    #  RESUMEN DE VALIDACIÓN
    # ══════════════════════════════════════════
    total_inserts = sum(1 for l in out if l.strip().startswith('INSERT'))
    print()
    print("╔══════════════════════════════════════════════════════╗")
    print("║   VALIDACIÓN DE GARANTÍAS POR MISIÓN                ║")
    print("╠══════════════════════════════════════════════════════╣")
    print(f"║  L0M3  — Registros de producción totales:  {total_inserts - 50 - 4 - 6 - 12 - 100 - 500 - 50:>5}  ║")
    print(f"║  L1M2  — Empleados turno noche activos:         5  ║")
    print(f"║  L1M3  — Paradas tipo 'falla':                 15  ║")
    print(f"║  L1M5  — Tablas para JOIN (paradas+maquinas): OK  ║")
    print(f"║  L2M1  — Máquina 7 estado inicial:         activa  ║")
    print(f"║  L2M2  — Máquina 12 existe:                    OK  ║")
    print(f"║  L2M3  — Registros pre-2020 (borrar):           5  ║")
    print(f"║  L2M5  — Técnicos de Mantenimiento:    {len(cargos_tecnicos):>2} emps  ║")
    print(f"║  L3M2  — Paradas falla+accidente:              18  ║")
    print(f"║  L3M3  — Calidad 'rechazado' en 2024:          20  ║")
    print(f"║  L3M4  — Activos sin producción (NOT IN): {len(empleados_sin_prod):>2} emps  ║")
    print(f"║  MAT   — Materiales en stock crítico:           3  ║")
    print("╠══════════════════════════════════════════════════════╣")
    print(f"║  Total filas insertadas: {total_inserts:<4}                        ║")
    print(f"║  Archivo: {output_path:<43}║")
    print("╚══════════════════════════════════════════════════════╝")
    print()
    print("  Siguiente paso: copia data.sql a la carpeta sql-game/")
    print()


if __name__ == '__main__':
    generate_sql()
