(function () {
  const TREE = {
    inicio: {
      msg: "¡Hola! 👋 Soy el asistente de Dongbu. ¿En qué te puedo ayudar?",
      options: [
        { label: "Registrar vacaciones", next: "vacaciones" },
        { label: "Registrar incapacidad", next: "incapacidad" },
        { label: "No encuentro mi código", next: "codigo" },
        { label: "¿Qué pasa después de enviar?", next: "despues" },
        { label: "Soy administrador", next: "admin" },
        { label: "Hablar con RRHH", next: "rrhh" },
      ],
    },
    vacaciones: {
      msg: "Para registrar tus vacaciones: 1) Ve a la opción <b>Empleado</b>. 2) Escribe tu código y presiona <b>Buscar</b> (se completará tu nombre y puesto). 3) Elige <b>Vacación</b>. 4) Selecciona la fecha de inicio y de finalización; el sistema calcula los días automáticamente. 5) Presiona <b>Enviar registro</b>.",
      options: [
        { label: "¿Y si me equivoco de fecha?", next: "correccion" },
        { label: "Volver al menú", next: "inicio" },
      ],
    },
    incapacidad: {
      msg: "Para registrar una incapacidad: 1) Ve a la opción <b>Empleado</b> y verifica tu código. 2) Elige <b>Incapacidad</b>. 3) Selecciona las fechas. 4) Sube una foto clara o el PDF de tu constancia médica (obligatorio). 5) Presiona <b>Enviar registro</b>.",
      options: [
        { label: "¿Qué formato de foto acepta?", next: "formato_foto" },
        { label: "Volver al menú", next: "inicio" },
      ],
    },
    formato_foto: {
      msg: "Puedes subir la constancia en formato <b>JPG, PNG o PDF</b>, con un tamaño máximo de 8 MB. Procura que la foto se vea clara y completa.",
      options: [
        { label: "Volver al menú", next: "inicio" },
      ],
    },
    correccion: {
      msg: "El sistema no permite editar un registro ya enviado. Si te equivocaste, subiste mal algo, o tienes alguna consulta de aprobación, por favor escribe al número de Recursos Humanos: <a href=\"https://wa.me/50378562855\" target=\"_blank\" class=\"text-success fw-bold\">78562855</a>.",
      options: [
        { label: "Hablar con RRHH", next: "rrhh" },
        { label: "Volver al menú", next: "inicio" },
      ],
    },
    codigo: {
      msg: "Tu código de empleado es el número que aparece en tu gafete o en tu recibo de pago (ejemplo: 0050). Si no encuentras tu código o necesitas ayuda, escribe al número de Recursos Humanos: <a href=\"https://wa.me/50378562855\" target=\"_blank\" class=\"text-success fw-bold\">78562855</a>.",
      options: [
        { label: "Hablar con RRHH", next: "rrhh" },
        { label: "Volver al menú", next: "inicio" },
      ],
    },
    despues: {
      msg: "Al enviar tu registro recibirás un <b>número de folio</b> en pantalla. Eso confirma que tu información quedó guardada. El equipo administrativo revisará tu registro junto con la constancia, si aplica.",
      options: [
        { label: "Volver al menú", next: "inicio" },
      ],
    },
    admin: {
      msg: "Si eres administrador, entra desde el botón <b>Administrador</b> en la parte superior con tu usuario y clave. Ahí podrás ver todos los registros, filtrarlos por código/tipo/fecha, revisar las fotos de incapacidad y exportar un reporte en CSV.",
      options: [
        { label: "Volver al menú", next: "inicio" },
      ],
    },
    rrhh: {
      msg: "Para cualquier duda, consulta sobre tu aprobación o si necesitas ayuda tras haber subido mal algo, comunícate directamente con Recursos Humanos al <a href=\"https://wa.me/50378562855\" target=\"_blank\" class=\"text-success fw-bold\">78562855</a>. Para otros temas, yo (el bot) te seguiré ayudando con gusto.",
      options: [
        { label: "Volver al menú", next: "inicio" },
      ],
    },
  };

  const bubble = document.getElementById("chatbot-bubble");
  const panel = document.getElementById("chatbot-panel");
  const closeBtn = document.getElementById("chatbot-close");
  const body = document.getElementById("chatbot-body");

  let started = false;

  function addMsg(text, who) {
    const div = document.createElement("div");
    div.className = "chat-msg " + who;
    const bub = document.createElement("div");
    bub.className = "bubble";
    bub.innerHTML = text;
    div.appendChild(bub);
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function renderOptions(options) {
    const wrap = document.createElement("div");
    wrap.className = "chat-options";
    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.textContent = opt.label;
      btn.addEventListener("click", () => goTo(opt.next, opt.label));
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function clearOptions() {
    body.querySelectorAll(".chat-options").forEach((el) => el.remove());
  }

  function goTo(nodeKey, userLabel) {
    clearOptions();
    if (userLabel) addMsg(userLabel, "user");
    const node = TREE[nodeKey];
    setTimeout(() => {
      addMsg(node.msg, "bot");
      renderOptions(node.options);
    }, 250);
  }

  bubble.addEventListener("click", () => {
    panel.classList.toggle("d-none");
    if (!started) {
      started = true;
      const node = TREE.inicio;
      addMsg(node.msg, "bot");
      renderOptions(node.options);
    }
  });

  closeBtn.addEventListener("click", () => panel.classList.add("d-none"));
})();
