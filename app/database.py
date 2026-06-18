import sqlite3
import csv
import os
import shutil
from datetime import datetime
from werkzeug.security import generate_password_hash

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "dongbu.db"))
SEED_CSV = os.path.join(os.path.dirname(__file__), "seed_empleados.csv")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS empleados (
            codigo TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            cargo TEXT,
            fecha_ingreso TEXT,
            salario_mensual REAL,
            activo INTEGER DEFAULT 1,
            dui TEXT,
            correo TEXT,
            telefono TEXT,
            fecha_fin TEXT,
            salario_letras TEXT,
            isss TEXT,
            afp TEXT,
            isr TEXT,
            prestamo_personal TEXT,
            prestamo_bancario TEXT,
            fsv TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS registros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_empleado TEXT NOT NULL,
            tipo TEXT NOT NULL CHECK(tipo IN ('vacacion','incapacidad')),
            fecha_inicio TEXT NOT NULL,
            fecha_fin TEXT NOT NULL,
            dias INTEGER NOT NULL,
            foto_path TEXT,
            observaciones TEXT,
            fecha_registro TEXT NOT NULL,
            estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'aprobado', 'rechazado')),
            FOREIGN KEY(codigo_empleado) REFERENCES empleados(codigo)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            nombre_completo TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_type TEXT NOT NULL,
            filename TEXT NOT NULL,
            stored_path TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS generated_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_empleado TEXT NOT NULL,
            doc_type TEXT NOT NULL,
            docx_path TEXT NOT NULL,
            pdf_path TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(codigo_empleado) REFERENCES empleados(codigo)
        )
    """)

    # Dynamic migration to add 'estado' to 'registros' if it doesn't exist yet
    cur.execute("PRAGMA table_info(registros)")
    columns = [row[1] for row in cur.fetchall()]
    if "estado" not in columns:
        cur.execute("ALTER TABLE registros ADD COLUMN estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'aprobado', 'rechazado'))")

    # Dynamic migration to add columns to 'empleados' if they don't exist yet
    cur.execute("PRAGMA table_info(empleados)")
    emp_columns = [row[1] for row in cur.fetchall()]
    
    migrations = [
        ("dui", "TEXT"),
        ("correo", "TEXT"),
        ("telefono", "TEXT"),
        ("fecha_fin", "TEXT"),
        ("salario_letras", "TEXT"),
        ("isss", "TEXT"),
        ("afp", "TEXT"),
        ("isr", "TEXT"),
        ("prestamo_personal", "TEXT"),
        ("prestamo_bancario", "TEXT"),
        ("fsv", "TEXT")
    ]
    for col_name, col_type in migrations:
        if col_name not in emp_columns:
            cur.execute(f"ALTER TABLE empleados ADD COLUMN {col_name} {col_type}")

    conn.commit()

    # Seed employees only if table is empty
    cur.execute("SELECT COUNT(*) AS c FROM empleados")
    if cur.fetchone()["c"] == 0 and os.path.exists(SEED_CSV):
        with open(SEED_CSV, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = [
                (r["codigo"], r["nombre"], r["cargo"], r["fecha_ingreso"], float(r["salario_mensual"]))
                for r in reader
            ]
        cur.executemany(
            "INSERT OR IGNORE INTO empleados (codigo, nombre, cargo, fecha_ingreso, salario_mensual) VALUES (?,?,?,?,?)",
            rows,
        )
        conn.commit()
        print(f"[init_db] {len(rows)} empleados cargados desde {SEED_CSV}")

    # Seed a default admin user only if no admin exists
    cur.execute("SELECT COUNT(*) AS c FROM admin_users")
    if cur.fetchone()["c"] == 0:
        default_user = os.environ.get("ADMIN_USER", "admin")
        default_pass = os.environ.get("ADMIN_PASS", "dongbu2026")
        try:
            cur.execute(
                "INSERT OR IGNORE INTO admin_users (username, password_hash, nombre_completo) VALUES (?,?,?)",
                (default_user, generate_password_hash(default_pass), "Administrador RRHH"),
            )
            conn.commit()
            print(f"[init_db] Usuario administrador creado -> usuario: {default_user} / clave: {default_pass}")
            print("[init_db] IMPORTANTE: cambia esta clave despues del primer ingreso.")
        except sqlite3.IntegrityError:
            pass

    # Seed initial templates if they exist locally
    TEMPLATES_DIR = os.path.join(os.path.dirname(DB_PATH), "..", "app", "uploads", "templates")
    seeds = [
        ("salario", r"C:\Users\HP\Documents\Formato de constancia\Constancia de salario Firmada.docx"),
        ("laboral", r"C:\Users\HP\Documents\Formato de constancia\Constancia Laboral.docx"),
    ]
    for doc_type, src_path in seeds:
        cur.execute("SELECT id FROM templates WHERE doc_type = ? AND is_active = 1", (doc_type,))
        if not cur.fetchone() and os.path.exists(src_path):
            folder = os.path.join(TEMPLATES_DIR, doc_type)
            os.makedirs(folder, exist_ok=True)
            filename = os.path.basename(src_path)
            target = os.path.join(folder, filename)
            try:
                shutil.copy2(src_path, target)
                cur.execute(
                    "INSERT INTO templates (doc_type, filename, stored_path, is_active, created_at) VALUES (?, ?, ?, 1, ?)",
                    (doc_type, filename, target, datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                )
                conn.commit()
                print(f"[init_db] Plantilla {doc_type} precargada con éxito.")
            except Exception as e:
                print(f"[init_db] Error al precargar plantilla {doc_type}: {e}")

    conn.close()
