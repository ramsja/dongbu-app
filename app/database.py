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
        ("fsv", "TEXT"),
        ("departamento", "TEXT"),
        ("fecha_contratacion", "TEXT"),
        ("dias_vacacion_pendientes", "REAL DEFAULT 0")
    ]
    for col_name, col_type in migrations:
        if col_name not in emp_columns:
            cur.execute(f"ALTER TABLE empleados ADD COLUMN {col_name} {col_type}")

    # Dynamic migration to add 'generado_por' to 'generated_documents' if it doesn't exist yet
    cur.execute("PRAGMA table_info(generated_documents)")
    doc_columns = [row[1] for row in cur.fetchall()]
    if "generado_por" not in doc_columns:
        cur.execute("ALTER TABLE generated_documents ADD COLUMN generado_por TEXT DEFAULT 'admin'")

    conn.commit()

    # Seed/update employees from seed_mvp_employees.json
    mvp_json_path = os.path.join(os.path.dirname(__file__), "seed_mvp_employees.json")
    if os.path.exists(mvp_json_path):
        try:
            import json
            with open(mvp_json_path, "r", encoding="utf-8") as f:
                employees = json.load(f)
            
            imported_count = 0
            for emp in employees:
                try:
                    raw_code = emp.get("employee_code") or emp.get("id")
                    if not raw_code:
                        continue
                    codigo = str(int(raw_code)).zfill(4) if isinstance(raw_code, (int, float)) or (isinstance(raw_code, str) and raw_code.isdigit()) else str(raw_code).strip().zfill(4)
                    
                    nombre = str(emp.get("full_name", "")).strip()
                    if not nombre:
                        continue
                        
                    dui = str(emp.get("dui", "")).strip() if emp.get("dui") else None
                    cargo = str(emp.get("job_title", "")).strip() if emp.get("job_title") else None
                    
                    ingreso = emp.get("hire_date")
                    if ingreso:
                        ingreso = str(ingreso).strip()[:10]
                    else:
                        ingreso = None
                        
                    fin = emp.get("end_date")
                    if fin:
                        fin = str(fin).strip()[:10]
                    else:
                        fin = None
                        
                    salario_raw = emp.get("salary")
                    if salario_raw:
                        cleaned_sal = "".join(c for c in str(salario_raw) if c.isdigit() or c == '.')
                        salario = float(cleaned_sal) if cleaned_sal else 0.0
                    else:
                        salario = 0.0
                        
                    salario_letras = str(emp.get("salary_words", "")).strip() if emp.get("salary_words") else None
                    isss = str(emp.get("isss", "")).strip() if emp.get("isss") else None
                    afp = str(emp.get("afp", "")).strip() if emp.get("afp") else None
                    isr = str(emp.get("isr", "")).strip() if emp.get("isr") else None
                    personal = str(emp.get("personal_loan", "")).strip() if emp.get("personal_loan") else None
                    bank = str(emp.get("bank_loan", "")).strip() if emp.get("bank_loan") else None
                    fsv = str(emp.get("fsv", "")).strip() if emp.get("fsv") else None
                    
                    cur.execute("SELECT codigo FROM empleados WHERE codigo = ?", (codigo,))
                    if cur.fetchone():
                        cur.execute(
                            """
                            UPDATE empleados
                            SET nombre=?, cargo=?, fecha_ingreso=?, salario_mensual=?,
                                dui=?, fecha_fin=?, salario_letras=?, isss=?, afp=?, isr=?,
                                prestamo_personal=?, prestamo_bancario=?, fsv=?
                            WHERE codigo=?
                            """,
                            (nombre, cargo, ingreso, salario, dui, fin, salario_letras, isss, afp, isr, personal, bank, fsv, codigo)
                        )
                    else:
                        cur.execute(
                            """
                            INSERT INTO empleados (
                                codigo, nombre, cargo, fecha_ingreso, salario_mensual, activo, dui,
                                fecha_fin, salario_letras, isss, afp, isr, prestamo_personal, prestamo_bancario, fsv
                            ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (codigo, nombre, cargo, ingreso, salario, dui, fin, salario_letras, isss, afp, isr, personal, bank, fsv)
                        )
                    imported_count += 1
                except Exception as ex:
                    print(f"[init_db] Error processing JSON employee row: {ex}")
            conn.commit()
            print(f"[init_db] {imported_count} empleados cargados/actualizados desde {mvp_json_path}")
        except Exception as e:
            print(f"[init_db] Error al leer seed_mvp_employees.json: {e}")

    # Seed/update employees from Control de vacaciones.xlsx
    excel_path = r"C:\Users\HP\Documents\Control de vacaciones.xlsx"
    if os.path.exists(excel_path):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(excel_path, data_only=True)
            if "Empleados" in wb.sheetnames:
                sheet = wb["Empleados"]
                imported_count = 0
                for idx in range(5, sheet.max_row + 1):
                    row = [cell.value for cell in sheet[idx]]
                    if not row or len(row) < 9 or row[1] is None:
                        continue
                    
                    try:
                        raw_code = row[1]
                        codigo = str(int(raw_code)).zfill(4) if isinstance(raw_code, (int, float)) else str(raw_code).strip().zfill(4)
                        
                        nombre = str(row[2]).strip()
                        
                        ingreso_dt = row[3]
                        if isinstance(ingreso_dt, datetime):
                            fecha_ingreso = ingreso_dt.strftime("%Y-%m-%d")
                        elif ingreso_dt:
                            fecha_ingreso = str(ingreso_dt).strip()[:10]
                        else:
                            fecha_ingreso = ""
                            
                        contratacion_dt = row[4]
                        if isinstance(contratacion_dt, datetime):
                            fecha_contratacion = contratacion_dt.strftime("%Y-%m-%d")
                        elif contratacion_dt:
                            fecha_contratacion = str(contratacion_dt).strip()[:10]
                        else:
                            fecha_contratacion = ""
                            
                        salario = float(row[5]) if row[5] is not None else 0.0
                        departamento = str(row[6]).strip() if row[6] else ""
                        cargo = str(row[7]).strip() if row[7] else ""
                        
                        estado = str(row[8]).strip().lower() if row[8] else "activo"
                        activo = 1 if estado in ("activo", "active", "1") else 0
                        
                        dias_vac = float(row[14]) if (len(row) > 14 and row[14] is not None) else 0.0
                        
                        cur.execute("SELECT codigo FROM empleados WHERE codigo = ?", (codigo,))
                        if cur.fetchone():
                            cur.execute(
                                """
                                UPDATE empleados
                                SET nombre=?, cargo=?, fecha_ingreso=?, salario_mensual=?,
                                    activo=?, departamento=?, fecha_contratacion=?, dias_vacacion_pendientes=?
                                WHERE codigo=?
                                """,
                                (nombre, cargo, fecha_ingreso, salario, activo, departamento, fecha_contratacion, dias_vac, codigo)
                            )
                        else:
                            cur.execute(
                                """
                                INSERT INTO empleados (
                                    codigo, nombre, cargo, fecha_ingreso, salario_mensual, activo,
                                    departamento, fecha_contratacion, dias_vacacion_pendientes
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                """,
                                (codigo, nombre, cargo, fecha_ingreso, salario, activo, departamento, fecha_contratacion, dias_vac)
                            )
                        imported_count += 1
                    except Exception as ex:
                        print(f"[init_db] Error procesando fila {idx} del Excel: {ex}")
                wb.close()
                conn.commit()
                print(f"[init_db] {imported_count} empleados cargados/actualizados desde {excel_path}")
        except Exception as e:
            print(f"[init_db] Error al leer Control de vacaciones.xlsx: {e}")

    # Seed employees from SEED_CSV only if table is empty (fallback)
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
