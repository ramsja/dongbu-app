# Sistema de Vacaciones e Incapacidades — Dongbu Corporation

Aplicación web para que los empleados registren sus días de **vacación** e
**incapacidad** (con foto/constancia adjunta), y para que el área de
**Administración/RRHH** consulte reportes y exporte la información.

Incluye:
- Base de datos precargada con los **545 empleados** del reporte
  `empleados_v3.pdf` (código, nombre, puesto, fecha de ingreso, salario).
- Formulario de autoservicio: el empleado escribe su código y el sistema
  completa automáticamente su nombre y puesto.
- Registro de vacaciones (fechas) e incapacidades (fechas + foto/PDF de la
  constancia, obligatoria).
- Panel de Administrador con login, filtros, totales y exportación a CSV.
- Asistente/chatbox guiado (preguntas frecuentes), 100% local, sin costo ni
  conexión a internet.
- Todo empaquetado en Docker para instalarlo en cualquier servidor o PC en
  minutos.

## 1. Requisitos

- Tener instalado **Docker** y **Docker Compose**.
  (En Windows/Mac: instala "Docker Desktop". En Linux: `docker` y el plugin
  `docker compose`.)

## 2. Cómo levantar la aplicación

Desde la carpeta del proyecto (donde está el archivo `docker-compose.yml`):

```bash
docker compose up -d --build
```

Esto va a:
1. Construir la imagen con todo lo necesario (Python, Flask, etc).
2. Crear la base de datos SQLite la primera vez que arranque y **cargar
   automáticamente los 545 empleados** desde el reporte.
3. Crear un usuario administrador por defecto.
4. Dejar la app corriendo en segundo plano.

Abre tu navegador en:

```
http://localhost:8080
```

(Si lo instalas en un servidor de la empresa, cambia `localhost` por la IP
de ese servidor, por ejemplo `http://192.168.1.50:8080`, para que cualquier
persona en la red lo pueda usar desde su celular o computadora.)

## 3. Usuario administrador por defecto

```
Usuario:  admin
Clave:    dongbu2026
```

**Importante:** ingresa al panel y ve a "Cambiar clave" para definir una
contraseña propia lo antes posible. También puedes definir el usuario y
clave inicial directamente en `docker-compose.yml` (variables `ADMIN_USER`
y `ADMIN_PASS`) **antes** del primer arranque.

## 4. Uso — Empleado

1. Entrar a la página principal y elegir **"Soy Empleado"**.
2. Escribir el código de empleado y presionar **Buscar** (se completa el
   nombre y el puesto automáticamente).
3. Elegir si es **Vacación** o **Incapacidad**.
4. Seleccionar fecha de inicio y fin (los días se calculan solos).
5. Si es incapacidad, subir la foto o PDF de la constancia (obligatorio).
6. Presionar **Enviar registro** — queda un número de folio como
   comprobante.

## 5. Uso — Administrador

1. Entrar con usuario y clave desde el botón **Administrador**.
2. En el **Panel** se ven totales de empleados, vacaciones e incapacidades,
   y la tabla completa de registros con filtros por código, tipo y fechas.
3. Se puede abrir la foto/constancia de cada incapacidad con un clic.
4. Botón **Exportar CSV** para descargar el reporte y abrirlo en Excel.
5. En **Empleados** se puede buscar a cualquier persona del listado de 545.

## 6. Datos y respaldo

- La base de datos vive en `./data/dongbu.db` (carpeta en tu propio
  servidor/computadora, fuera del contenedor) — **no se pierde** si
  reinicias o actualizas la app.
- Las fotos de incapacidad se guardan en `./app/uploads/`.
- Para respaldar la información, simplemente copia esas dos carpetas a otro
  lugar (USB, otro servidor, etc.) periódicamente.

## 7. Apagar / reiniciar / actualizar

```bash
docker compose down        # apagar
docker compose up -d       # volver a encender (sin perder datos)
docker compose up -d --build   # reconstruir si se modifica el código
```

## 8. Estructura del proyecto

```
dongbu-app/
├── app/
│   ├── app.py                # Rutas y lógica de la aplicación (Flask)
│   ├── database.py           # Conexión SQLite y carga inicial de empleados
│   ├── seed_empleados.csv    # Los 545 empleados extraídos del PDF
│   ├── static/                # CSS, JS y el chatbot guiado
│   ├── templates/             # Páginas HTML
│   └── uploads/                # Fotos de incapacidad (persistente)
├── data/                      # Base de datos SQLite (persistente)
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## 9. Notas

- El chatbot incluido es un asistente guiado de preguntas frecuentes (no usa
  inteligencia artificial externa), por lo que funciona sin costo y sin
  necesitar internet. Si en el futuro quieres un chatbot con IA real
  (respuestas más inteligentes/abiertas), se puede integrar pero
  requeriría una API key y tendría un costo de uso.
- El sistema registra los días que el empleado reporta; no calcula
  automáticamente límites legales de vacación, ya que esas reglas no
  estaban definidas en el reporte original. Se puede agregar después si
  se definen las políticas de la empresa.
