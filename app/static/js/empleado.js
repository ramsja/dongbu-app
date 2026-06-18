document.addEventListener("DOMContentLoaded", function () {
  const duiInput = document.getElementById("dui");
  const btnBuscar = document.getElementById("btn-buscar");
  const nombreInput = document.getElementById("nombre");
  const cargoInput = document.getElementById("cargo");
  const correoInput = document.getElementById("correo");
  const telefonoInput = document.getElementById("telefono");
  const feedback = document.getElementById("dui-feedback");

  const fechaInicio = document.getElementById("fecha_inicio");
  const fechaFin = document.getElementById("fecha_fin");
  const diasSpan = document.getElementById("dias-calculados");

  const radios = document.querySelectorAll('input[name="tipo"]');
  const fotoWrapper = document.getElementById("foto-wrapper");
  const fotoInput = document.getElementById("foto");

  const form = document.getElementById("form-registro");
  const formAlert = document.getElementById("form-alert");
  const btnEnviar = document.getElementById("btn-enviar");

  let empleadoValido = false;

  function buscarEmpleado() {
    const dui = duiInput.value.trim();
    nombreInput.value = "";
    cargoInput.value = "";
    correoInput.value = "";
    telefonoInput.value = "";
    nombreInput.setAttribute("readonly", "readonly");
    cargoInput.setAttribute("readonly", "readonly");
    correoInput.setAttribute("readonly", "readonly");
    telefonoInput.setAttribute("readonly", "readonly");
    empleadoValido = false;
    feedback.textContent = "";
    feedback.className = "form-text";

    if (!dui) return;

    fetch(`/api/empleado/dui/${encodeURIComponent(dui)}`)
      .then(r => r.json().then(data => ({ status: r.status, data })))
      .then(({ status, data }) => {
        if (status === 200 && data.ok) {
          nombreInput.value = data.nombre;
          cargoInput.value = data.cargo;
          correoInput.value = data.correo || "";
          telefonoInput.value = data.telefono || "";
          empleadoValido = true;
          feedback.textContent = "Empleado encontrado.";
          feedback.className = "form-text text-success";
          
          if (!data.correo) {
            correoInput.removeAttribute("readonly");
          }
          if (!data.telefono) {
            telefonoInput.removeAttribute("readonly");
          }
        } else {
          nombreInput.removeAttribute("readonly");
          cargoInput.removeAttribute("readonly");
          correoInput.removeAttribute("readonly");
          telefonoInput.removeAttribute("readonly");
          empleadoValido = true;
          feedback.textContent = "DUI no registrado. Puedes ingresar tus datos manualmente.";
          feedback.className = "form-text text-info";
        }
      })
      .catch(() => {
        nombreInput.removeAttribute("readonly");
        cargoInput.removeAttribute("readonly");
        correoInput.removeAttribute("readonly");
        telefonoInput.removeAttribute("readonly");
        empleadoValido = true;
        feedback.textContent = "Error de conexión. Puedes ingresar tus datos manualmente.";
        feedback.className = "form-text text-warning";
      });
  }

  btnBuscar.addEventListener("click", buscarEmpleado);
  duiInput.addEventListener("blur", buscarEmpleado);
  duiInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); buscarEmpleado(); }
  });

  function calcularDias() {
    if (fechaInicio.value && fechaFin.value) {
      const fi = new Date(fechaInicio.value);
      const ff = new Date(fechaFin.value);
      const diff = Math.round((ff - fi) / (1000 * 60 * 60 * 24)) + 1;
      diasSpan.textContent = diff > 0 ? diff : 0;
    } else {
      diasSpan.textContent = "0";
    }
  }
  fechaInicio.addEventListener("change", calcularDias);
  fechaFin.addEventListener("change", calcularDias);

  function toggleFoto() {
    const tipo = document.querySelector('input[name="tipo"]:checked').value;
    if (tipo === "incapacidad") {
      fotoWrapper.style.display = "block";
      fotoInput.setAttribute("required", "required");
    } else {
      fotoWrapper.style.display = "none";
      fotoInput.removeAttribute("required");
      fotoInput.value = "";
    }
  }
  radios.forEach(r => r.addEventListener("change", toggleFoto));
  toggleFoto();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    formAlert.innerHTML = "";

    if (!empleadoValido) {
      formAlert.innerHTML = `<div class="alert alert-danger">Primero ingresa y verifica tu DUI.</div>`;
      return;
    }

    const fd = new FormData(form);
    fd.set("dui", duiInput.value.trim());

    btnEnviar.disabled = true;
    btnEnviar.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Enviando...`;

    fetch("/api/registro", { method: "POST", body: fd })
      .then(r => r.json().then(data => ({ status: r.status, data })))
      .then(({ status, data }) => {
        if (status === 200 && data.ok) {
          window.location.href = `/registro/confirmacion/${data.folio}`;
        } else {
          formAlert.innerHTML = `<div class="alert alert-danger">${data.error || "Ocurrió un error al guardar el registro."}</div>`;
          btnEnviar.disabled = false;
          btnEnviar.innerHTML = `<i class="fa-solid fa-paper-plane me-1"></i>Enviar registro`;
        }
      })
      .catch(() => {
        formAlert.innerHTML = `<div class="alert alert-danger">Error de conexión. Intenta de nuevo.</div>`;
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = `<i class="fa-solid fa-paper-plane me-1"></i>Enviar registro`;
      });
  });
});
