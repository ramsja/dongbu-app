import os
import io
import csv
import uuid
from datetime import datetime, date
from functools import wraps

from flask import (
    Flask, render_template, request, redirect, url_for,
    session, jsonify, flash, send_from_directory, abort, Response
)
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash

from database import get_db, init_db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
ALLOWED_EXT = {"png", "jpg", "jpeg", "pdf"}
MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8 MB

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "cambia-esta-clave-en-produccion")
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


def parse_date(s):
    return datetime.strptime(s, "%Y-%m-%d").date()


def enviar_notificacion(empleado, tipo_registro, estado_anterior, nuevo_estado, folio):
    # Convert Row or dict to dictionary safely
    emp_dict = dict(empleado) if empleado else {}
    correo = emp_dict.get("correo")
    telefono = emp_dict.get("telefono")
    nombre = emp_dict.get("nombre")
    
    if not correo and not telefono:
        print(f"[Notificación] Sin medios de contacto para {nombre}. Notificación no enviada.")
        return False

    mensaje = ""
    if nuevo_estado == "creado":
        if tipo_registro == "incapacidad":
            mensaje = f"Estimado/a {nombre}, su solicitud de incapacidad (Folio #{folio}) ha sido recibida exitosamente en el sistema."
        else:
            mensaje = f"Estimado/a {nombre}, se ha registrado su solicitud de vacaciones (Folio #{folio}) y se encuentra en estado 'Pendiente' para aprobación."
    elif nuevo_estado == "aprobado":
        mensaje = f"Estimado/a {nombre}, su solicitud de {tipo_registro} (Folio #{folio}) ha sido APROBADA."
    elif nuevo_estado == "rechazado":
        mensaje = f"Estimado/a {nombre}, su solicitud de {tipo_registro} (Folio #{folio}) ha sido RECHAZADA."

    print(f"\n======== NOTIFICACIÓN DISPACHADA ========")
    if correo:
        print(f"PARA (Email): {correo}")
    if telefono:
        print(f"PARA (Teléfono/SMS): {telefono}")
    print(f"MENSAJE: {mensaje}")
    print(f"=========================================\n")
    return True


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("admin_id"):
            return redirect(url_for("admin_login", next=request.path))
        return view(*args, **kwargs)
    return wrapped


# ---------------------------------------------------------------------------
# Rutas publicas / empleado
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/empleado")
def empleado_form():
    return render_template("empleado.html", today=date.today().isoformat())


@app.route("/api/empleado/<codigo>")
def api_empleado(codigo):
    codigo = codigo.strip().zfill(4) if codigo.strip().isdigit() else codigo.strip()
    db = get_db()
    row = db.execute(
        "SELECT codigo, nombre, cargo, fecha_ingreso, activo, dui, correo, telefono FROM empleados WHERE codigo = ?",
        (codigo,),
    ).fetchone()
    db.close()
    if not row:
        return jsonify({"ok": False, "error": "Codigo no encontrado"}), 404
    if not row["activo"]:
        return jsonify({"ok": False, "error": "Empleado inactivo"}), 404
    return jsonify({
        "ok": True,
        "codigo": row["codigo"],
        "nombre": row["nombre"],
        "cargo": row["cargo"],
        "fecha_ingreso": row["fecha_ingreso"],
        "dui": row["dui"],
        "correo": row["correo"],
        "telefono": row["telefono"]
    })


@app.route("/api/empleado/dui/<dui>")
def api_empleado_by_dui(dui):
    dui = dui.strip()
    db = get_db()
    row = db.execute(
        "SELECT codigo, nombre, cargo, fecha_ingreso, activo, dui, correo, telefono FROM empleados WHERE dui = ?",
        (dui,),
    ).fetchone()
    db.close()
    if not row:
        return jsonify({"ok": False, "error": "DUI no encontrado"}), 404
    if not row["activo"]:
        return jsonify({"ok": False, "error": "Empleado inactivo"}), 404
    return jsonify({
        "ok": True,
        "codigo": row["codigo"],
        "nombre": row["nombre"],
        "cargo": row["cargo"],
        "fecha_ingreso": row["fecha_ingreso"],
        "dui": row["dui"],
        "correo": row["correo"],
        "telefono": row["telefono"]
    })


@app.route("/api/registro", methods=["POST"])
def api_registro():
    dui = request.form.get("dui", "").strip()
    nombre = request.form.get("nombre", "").strip()
    cargo = request.form.get("cargo", "").strip()
    correo = request.form.get("correo", "").strip()
    telefono = request.form.get("telefono", "").strip()
    tipo = request.form.get("tipo", "").strip()
    fecha_inicio_s = request.form.get("fecha_inicio", "").strip()
    fecha_fin_s = request.form.get("fecha_fin", "").strip()
    observaciones = request.form.get("observaciones", "").strip()

    if not dui:
        return jsonify({"ok": False, "error": "El DUI es obligatorio"}), 400

    if tipo not in ("vacacion", "incapacidad"):
        return jsonify({"ok": False, "error": "Tipo invalido"}), 400

    db = get_db()
    
    # Try to find employee by DUI
    emp = db.execute("SELECT * FROM empleados WHERE dui = ?", (dui,)).fetchone()
    
    if not emp:
        # If employee doesn't exist, we must create a new one!
        if not nombre or not cargo:
            db.close()
            return jsonify({"ok": False, "error": "Para un nuevo registro, el nombre y el puesto son obligatorios"}), 400
        
        # Generate next codigo
        row = db.execute("SELECT codigo FROM empleados ORDER BY CAST(codigo AS INTEGER) DESC LIMIT 1").fetchone()
        if row:
            try:
                next_val = int(row["codigo"]) + 1
                codigo = str(next_val).zfill(4)
            except ValueError:
                codigo = "2000"
        else:
            codigo = "2000"
            
        # Insert new employee
        db.execute(
            "INSERT INTO empleados (codigo, nombre, cargo, fecha_ingreso, salario_mensual, activo, dui, correo, telefono) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)",
            (codigo, nombre, cargo, date.today().isoformat(), 0.0, dui, correo, telefono)
        )
        db.commit()
        
        # Refetch the new employee to be safe
        emp = db.execute("SELECT * FROM empleados WHERE codigo = ?", (codigo,)).fetchone()
    else:
        codigo = emp["codigo"]
        updated = False
        new_correo = emp["correo"]
        new_telefono = emp["telefono"]
        if correo and correo != emp["correo"]:
            new_correo = correo
            updated = True
        if telefono and telefono != emp["telefono"]:
            new_telefono = telefono
            updated = True
        if updated:
            db.execute("UPDATE empleados SET correo = ?, telefono = ? WHERE codigo = ?", (new_correo, new_telefono, codigo))
            db.commit()
            emp = db.execute("SELECT * FROM empleados WHERE codigo = ?", (codigo,)).fetchone()

    try:
        fi = parse_date(fecha_inicio_s)
        ff = parse_date(fecha_fin_s)
    except ValueError:
        db.close()
        return jsonify({"ok": False, "error": "Fechas invalidas"}), 400

    if ff < fi:
        db.close()
        return jsonify({"ok": False, "error": "La fecha final no puede ser anterior a la fecha de inicio"}), 400

    dias = (ff - fi).days + 1

    foto_path = None
    if tipo == "incapacidad":
        file = request.files.get("foto")
        if not file or file.filename == "":
            db.close()
            return jsonify({"ok": False, "error": "Debes adjuntar la foto/constancia de incapacidad"}), 400
        if not allowed_file(file.filename):
            db.close()
            return jsonify({"ok": False, "error": "Formato de archivo no permitido (usa jpg, png o pdf)"}), 400
        ext = file.filename.rsplit(".", 1)[1].lower()
        safe_name = secure_filename(f"{codigo}_{fi.isoformat()}_{uuid.uuid4().hex[:8]}.{ext}")
        file.save(os.path.join(UPLOAD_DIR, safe_name))
        foto_path = safe_name

    cur = db.execute(
        """INSERT INTO registros (codigo_empleado, tipo, fecha_inicio, fecha_fin, dias, foto_path, observaciones, fecha_registro)
           VALUES (?,?,?,?,?,?,?,?)""",
        (codigo, tipo, fi.isoformat(), ff.isoformat(), dias, foto_path, observaciones,
         datetime.now().isoformat(timespec="seconds")),
    )
    db.commit()
    new_id = cur.lastrowid
    
    # Send simulated notification
    enviar_notificacion(emp, tipo, None, "creado", new_id)
    
    db.close()

    msg = "Incapacidad recibida exitosamente." if tipo == "incapacidad" else ""
    return jsonify({"ok": True, "folio": new_id, "dias": dias, "nombre": emp["nombre"], "msg": msg})


@app.route("/registro/confirmacion/<int:folio>")
def confirmacion(folio):
    db = get_db()
    row = db.execute(
        """SELECT r.*, e.nombre, e.cargo FROM registros r
           JOIN empleados e ON e.codigo = r.codigo_empleado
           WHERE r.id = ?""",
        (folio,),
    ).fetchone()
    db.close()
    if not row:
        abort(404)
    return render_template("confirmacion.html", r=row)


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        db = get_db()
        user = db.execute("SELECT * FROM admin_users WHERE username = ?", (username,)).fetchone()
        db.close()
        if user and check_password_hash(user["password_hash"], password):
            session["admin_id"] = user["id"]
            session["admin_username"] = user["username"]
            nxt = request.args.get("next") or url_for("admin_dashboard")
            return redirect(nxt)
        flash("Usuario o clave incorrectos", "error")
    return render_template("admin_login.html")


@app.route("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("admin_login"))


@app.route("/admin")
@login_required
def admin_dashboard():
    db = get_db()

    codigo = request.args.get("codigo", "").strip()
    tipo = request.args.get("tipo", "").strip()
    desde = request.args.get("desde", "").strip()
    hasta = request.args.get("hasta", "").strip()

    query = """
        SELECT r.id, r.codigo_empleado, e.nombre, e.cargo, r.tipo, r.fecha_inicio, r.fecha_fin,
               r.dias, r.foto_path, r.observaciones, r.fecha_registro, r.estado
        FROM registros r
        JOIN empleados e ON e.codigo = r.codigo_empleado
        WHERE 1=1
    """
    params = []
    if codigo:
        query += " AND (r.codigo_empleado LIKE ? OR e.dui LIKE ?)"
        params.append(f"%{codigo}%")
        params.append(f"%{codigo}%")
    if tipo in ("vacacion", "incapacidad"):
        query += " AND r.tipo = ?"
        params.append(tipo)
    if desde:
        query += " AND r.fecha_inicio >= ?"
        params.append(desde)
    if hasta:
        query += " AND r.fecha_fin <= ?"
        params.append(hasta)
    query += " ORDER BY r.fecha_registro DESC"

    registros = db.execute(query, params).fetchall()

    total_empleados = db.execute("SELECT COUNT(*) c FROM empleados WHERE activo = 1").fetchone()["c"]
    total_vacaciones = db.execute("SELECT COUNT(*) c, COALESCE(SUM(dias),0) d FROM registros WHERE tipo='vacacion'").fetchone()
    total_incapacidades = db.execute("SELECT COUNT(*) c, COALESCE(SUM(dias),0) d FROM registros WHERE tipo='incapacidad'").fetchone()

    db.close()

    return render_template(
        "admin_dashboard.html",
        registros=registros,
        total_empleados=total_empleados,
        total_vacaciones=total_vacaciones,
        total_incapacidades=total_incapacidades,
        filtros={"codigo": codigo, "tipo": tipo, "desde": desde, "hasta": hasta},
    )


@app.route("/admin/foto/<path:filename>")
@login_required
def admin_foto(filename):
    return send_from_directory(UPLOAD_DIR, filename)


@app.route("/admin/export.csv")
@login_required
def admin_export_csv():
    db = get_db()
    rows = db.execute(
        """SELECT r.id, r.codigo_empleado, e.nombre, e.cargo, r.tipo, r.fecha_inicio, r.fecha_fin,
                  r.dias, r.observaciones, r.fecha_registro, r.estado
           FROM registros r JOIN empleados e ON e.codigo = r.codigo_empleado
           ORDER BY r.fecha_registro DESC"""
    ).fetchall()
    db.close()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Folio", "Codigo", "Nombre", "Cargo", "Tipo", "Fecha Inicio", "Fecha Fin", "Dias", "Observaciones", "Fecha Registro", "Estado"])
    for r in rows:
        writer.writerow([r["id"], r["codigo_empleado"], r["nombre"], r["cargo"], r["tipo"],
                          r["fecha_inicio"], r["fecha_fin"], r["dias"], r["observaciones"], r["fecha_registro"], r["estado"]])

    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=reporte_dongbu.csv"},
    )


@app.route("/admin/registro/delete/<int:id>", methods=["POST"])
@login_required
def admin_delete_registro(id):
    db = get_db()
    db.execute("DELETE FROM registros WHERE id = ?", (id,))
    db.commit()
    db.close()
    flash(f"Registro con Folio #{id} eliminado correctamente.", "ok")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/registro/approve/<int:id>", methods=["POST"])
@login_required
def admin_approve_registro(id):
    db = get_db()
    row = db.execute(
        """SELECT r.*, e.nombre, e.correo, e.telefono FROM registros r 
           JOIN empleados e ON e.codigo = r.codigo_empleado 
           WHERE r.id = ?""", (id,)
    ).fetchone()
    if row:
        db.execute("UPDATE registros SET estado = 'aprobado' WHERE id = ?", (id,))
        db.commit()
        enviar_notificacion(row, row["tipo"], "pendiente", "aprobado", id)
    db.close()
    flash(f"El Folio #{id} ha sido aprobado.", "ok")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/registro/reject/<int:id>", methods=["POST"])
@login_required
def admin_reject_registro(id):
    db = get_db()
    row = db.execute(
        """SELECT r.*, e.nombre, e.correo, e.telefono FROM registros r 
           JOIN empleados e ON e.codigo = r.codigo_empleado 
           WHERE r.id = ?""", (id,)
    ).fetchone()
    if row:
        db.execute("UPDATE registros SET estado = 'rechazado' WHERE id = ?", (id,))
        db.commit()
        enviar_notificacion(row, row["tipo"], "pendiente", "rechazado", id)
    db.close()
    flash(f"El Folio #{id} ha sido rechazado.", "ok")
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/empleados")
@login_required
def admin_empleados():
    q = request.args.get("q", "").strip()
    db = get_db()
    if q:
        rows = db.execute(
            "SELECT * FROM empleados WHERE codigo LIKE ? OR nombre LIKE ? OR cargo LIKE ? OR dui LIKE ? ORDER BY codigo",
            (f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"),
        ).fetchall()
    else:
        rows = db.execute("SELECT * FROM empleados ORDER BY codigo").fetchall()
    db.close()
    return render_template("admin_empleados.html", empleados=rows, q=q)


@app.route("/admin/empleados/nuevo", methods=["POST"])
@login_required
def admin_nuevo_empleado():
    codigo = request.form.get("codigo", "").strip()
    dui = request.form.get("dui", "").strip()
    nombre = request.form.get("nombre", "").strip()
    cargo = request.form.get("cargo", "").strip()
    fecha_ingreso = request.form.get("fecha_ingreso", "").strip()
    salario = request.form.get("salario", "").strip()
    correo = request.form.get("correo", "").strip()
    telefono = request.form.get("telefono", "").strip()

    if not dui or not nombre or not cargo:
        flash("DUI, Nombre y Puesto son obligatorios.", "error")
        return redirect(url_for("admin_empleados"))

    db = get_db()
    
    # Check duplicate DUI
    dup = db.execute("SELECT * FROM empleados WHERE dui = ?", (dui,)).fetchone()
    if dup:
        db.close()
        flash(f"Ya existe un empleado con el DUI {dui}.", "error")
        return redirect(url_for("admin_empleados"))

    if codigo:
        dup_cod = db.execute("SELECT * FROM empleados WHERE codigo = ?", (codigo,)).fetchone()
        if dup_cod:
            db.close()
            flash(f"Ya existe un empleado con el código {codigo}.", "error")
            return redirect(url_for("admin_empleados"))
    else:
        # Generate next codigo
        row = db.execute("SELECT codigo FROM empleados ORDER BY CAST(codigo AS INTEGER) DESC LIMIT 1").fetchone()
        if row:
            try:
                next_val = int(row["codigo"]) + 1
                codigo = str(next_val).zfill(4)
            except ValueError:
                codigo = "2000"
        else:
            codigo = "2000"

    try:
        sal_val = float(salario) if salario else 0.0
    except ValueError:
        sal_val = 0.0

    if not fecha_ingreso:
        fecha_ingreso = date.today().isoformat()

    db.execute(
        "INSERT INTO empleados (codigo, nombre, cargo, fecha_ingreso, salario_mensual, activo, dui, correo, telefono) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)",
        (codigo, nombre, cargo, fecha_ingreso, sal_val, dui, correo, telefono)
    )
    db.commit()
    db.close()
    flash(f"Empleado {nombre} (Código: {codigo}) agregado correctamente.", "ok")
    return redirect(url_for("admin_empleados"))


@app.route("/admin/empleados/editar/<codigo>", methods=["POST"])
@login_required
def admin_editar_empleado(codigo):
    dui = request.form.get("dui", "").strip()
    nombre = request.form.get("nombre", "").strip()
    cargo = request.form.get("cargo", "").strip()
    fecha_ingreso = request.form.get("fecha_ingreso", "").strip()
    salario = request.form.get("salario", "").strip()
    correo = request.form.get("correo", "").strip()
    telefono = request.form.get("telefono", "").strip()

    if not nombre or not cargo:
        flash("Nombre y Puesto son obligatorios.", "error")
        return redirect(url_for("admin_empleados"))

    db = get_db()

    # Check employee exists
    emp = db.execute("SELECT * FROM empleados WHERE codigo = ?", (codigo,)).fetchone()
    if not emp:
        db.close()
        flash(f"No se encontró un empleado con código {codigo}.", "error")
        return redirect(url_for("admin_empleados"))

    # Check DUI uniqueness (if changed)
    if dui and dui != emp["dui"]:
        dup = db.execute("SELECT * FROM empleados WHERE dui = ? AND codigo != ?", (dui, codigo)).fetchone()
        if dup:
            db.close()
            flash(f"Ya existe otro empleado con el DUI {dui}.", "error")
            return redirect(url_for("admin_empleados"))

    try:
        sal_val = float(salario) if salario else emp["salario_mensual"]
    except ValueError:
        sal_val = emp["salario_mensual"]

    if not fecha_ingreso:
        fecha_ingreso = emp["fecha_ingreso"]

    db.execute(
        """UPDATE empleados SET dui = ?, nombre = ?, cargo = ?, fecha_ingreso = ?,
           salario_mensual = ?, correo = ?, telefono = ? WHERE codigo = ?""",
        (dui or emp["dui"], nombre, cargo, fecha_ingreso, sal_val, correo, telefono, codigo)
    )
    db.commit()
    db.close()
    flash(f"Empleado {nombre} (Código: {codigo}) actualizado correctamente.", "ok")
    return redirect(url_for("admin_empleados"))


@app.route("/admin/cambiar-clave", methods=["GET", "POST"])
@login_required
def admin_cambiar_clave():
    if request.method == "POST":
        actual = request.form.get("actual", "")
        nueva = request.form.get("nueva", "")
        confirmar = request.form.get("confirmar", "")
        db = get_db()
        user = db.execute("SELECT * FROM admin_users WHERE id = ?", (session["admin_id"],)).fetchone()
        if not check_password_hash(user["password_hash"], actual):
            flash("La clave actual no es correcta", "error")
        elif len(nueva) < 6:
            flash("La nueva clave debe tener al menos 6 caracteres", "error")
        elif nueva != confirmar:
            flash("Las claves no coinciden", "error")
        else:
            db.execute("UPDATE admin_users SET password_hash = ? WHERE id = ?",
                       (generate_password_hash(nueva), user["id"]))
            db.commit()
            flash("Clave actualizada correctamente", "ok")
        db.close()
    return render_template("admin_cambiar_clave.html")


@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=False)
else:
    init_db()
