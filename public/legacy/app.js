/* =========================================================
   TutorAula · Lógica de frontend
   RF-02 búsqueda/filtrado · RF-03 agenda · RF-04 pago · RF-05 sala
   ========================================================= */
(function () {
  "use strict";

  var API = "/api";

  /* ---------- Datos de respaldo (si la API no está disponible) ---------- */
  var MATERIAS_FALLBACK = [
    "Cálculo Integral", "Cálculo Diferencial", "Álgebra", "Física Mecánica",
    "Química", "Biología", "Lectura Crítica", "Historia", "Inglés", "Programación"
  ];

  var TUTORES_FALLBACK = [
    { id: 1, nombre: "Laura Gómez", ciudad: "Bogotá", nivel_educativo: "universidad", titulo_profesional: "Magíster en Matemáticas", biografia: "Diez años enseñando cálculo a estudiantes de grado 11 y primeros semestres.", precio_hora: 45000, calificacion_prom: 4.9, total_resenas: 132, materias: "Cálculo Integral, Cálculo Diferencial, Álgebra" },
    { id: 2, nombre: "Carlos Ramírez", ciudad: "Medellín", nivel_educativo: "universidad", titulo_profesional: "Ingeniero Físico", biografia: "Especialista en física mecánica y preparación ICFES con método de problemas.", precio_hora: 38000, calificacion_prom: 4.7, total_resenas: 88, materias: "Física Mecánica, Cálculo Integral" },
    { id: 3, nombre: "Ana Torres", ciudad: "Cali", nivel_educativo: "bachillerato", titulo_profesional: "Licenciada en Química", biografia: "Acompaño a estudiantes de bachillerato en química y biología desde cero.", precio_hora: 30000, calificacion_prom: 4.8, total_resenas: 61, materias: "Química, Biología" },
    { id: 4, nombre: "Miguel Sánchez", ciudad: "Barranquilla", nivel_educativo: "icfes", titulo_profesional: "Licenciado en Lenguas", biografia: "Lectura crítica e inglés enfocados en pruebas Saber 11.", precio_hora: 27000, calificacion_prom: 4.6, total_resenas: 45, materias: "Lectura Crítica, Inglés" },
    { id: 5, nombre: "Daniela Ruiz", ciudad: "Bogotá", nivel_educativo: "universidad", titulo_profesional: "Ingeniera de Sistemas", biografia: "Programación desde lógica básica hasta estructuras de datos.", precio_hora: 52000, calificacion_prom: 5.0, total_resenas: 74, materias: "Programación, Álgebra" },
    { id: 6, nombre: "Andrés Peña", ciudad: "Bucaramanga", nivel_educativo: "primaria", titulo_profesional: "Normalista Superior", biografia: "Refuerzo escolar en matemáticas y lectura para primaria.", precio_hora: 22000, calificacion_prom: 4.4, total_resenas: 33, materias: "Álgebra, Lectura Crítica" }
  ];

  var RESENAS_FALLBACK = [
    { estudiante: "Sofía Herrera", tutor: "Laura Gómez", puntuacion: 5, comentario: "Laura explica el cálculo integral con ejemplos clarísimos. Pasé de 2.8 a 4.5." },
    { estudiante: "Julián Castro", tutor: "Miguel Sánchez", puntuacion: 5, comentario: "Excelente preparación para lectura crítica del ICFES, muy puntual y organizado." },
    { estudiante: "Valentina Ríos", tutor: "Ana Torres", puntuacion: 4, comentario: "Química dejó de ser mi materia imposible. Las guías son muy útiles." }
  ];

  var HORARIOS = [
    "Lun 08:00", "Lun 10:00", "Mar 09:00", "Mie 14:00",
    "Jue 16:00", "Vie 10:00", "Vie 18:00", "Sab 09:00"
  ];

  /* ---------- Estado ---------- */
  var estado = {
    tutores: [],
    materias: [],
    tutorSeleccionado: null,
    horarioSeleccionado: null,
    token: window.localStorage.getItem("ta_token") || null,
    usuario: JSON.parse(window.localStorage.getItem("ta_usuario") || "null")
  };

  /* ---------- Utilidades ---------- */
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function money(valor) {
    return "$" + Number(valor).toLocaleString("es-CO", { maximumFractionDigits: 0 });
  }

  function estrellas(nota) {
    var llenas = Math.round(Number(nota));
    var salida = "";
    for (var i = 1; i <= 5; i++) salida += i <= llenas ? "★" : "☆";
    return salida;
  }

  function iniciales(nombre) {
    return nombre.split(" ").map(function (p) { return p.charAt(0); }).join("").slice(0, 2).toUpperCase();
  }

  function escapar(texto) {
    var div = document.createElement("div");
    div.textContent = texto == null ? "" : String(texto);
    return div.innerHTML;
  }

  var toastTimer = null;
  function toast(mensaje) {
    var el = $("#toast");
    el.textContent = mensaje;
    el.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.hidden = true; }, 3200);
  }

  function pedir(ruta, opciones) {
    var config = opciones || {};
    var headers = { "Content-Type": "application/json" };
    if (estado.token) headers.Authorization = "Bearer " + estado.token;
    return fetch(API + ruta, {
      method: config.method || "GET",
      headers: headers,
      body: config.body ? JSON.stringify(config.body) : undefined
    }).then(function (respuesta) {
      return respuesta.json().then(function (datos) {
        if (!respuesta.ok) throw new Error(datos.error || "Error de servidor");
        return datos;
      });
    });
  }

  /* ---------- Navegación ---------- */
  function initNav() {
    var navbar = $("#navbar");
    window.addEventListener("scroll", function () {
      navbar.classList.toggle("is-scrolled", window.scrollY > 10);
    });
    $("#navToggle").addEventListener("click", function () {
      $("#navLinks").classList.toggle("is-open");
    });
    $$("#navLinks a").forEach(function (enlace) {
      enlace.addEventListener("click", function () { $("#navLinks").classList.remove("is-open"); });
    });
  }

  /* ---------- Animaciones de entrada ---------- */
  function initReveal() {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("is-visible");
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(function (el) { observador.observe(el); });
  }

  /* ---------- RF-02: carga y filtrado ---------- */
  function cargarMaterias() {
    return pedir("/materias")
      .then(function (lista) { return lista.map(function (m) { return m.nombre; }); })
      .catch(function () { return MATERIAS_FALLBACK; })
      .then(function (nombres) {
        estado.materias = nombres;
        [$("#qsMateria"), $("#fMateria")].forEach(function (select) {
          nombres.forEach(function (nombre) {
            var opcion = document.createElement("option");
            opcion.value = nombre;
            opcion.textContent = nombre;
            select.appendChild(opcion);
          });
        });
      });
  }

  function cargarTutores() {
    return pedir("/tutores")
      .catch(function () { return TUTORES_FALLBACK; })
      .then(function (lista) {
        estado.tutores = Array.isArray(lista) && lista.length ? lista : TUTORES_FALLBACK;
        aplicarFiltros();
      });
  }

  function aplicarFiltros() {
    var texto = $("#fBuscar").value.trim().toLowerCase();
    var materia = $("#fMateria").value;
    var nivel = $("#fNivel").value;
    var precioMax = Number($("#fPrecio").value);
    var califMin = Number($("#fCalificacion").value);

    var filtrados = estado.tutores.filter(function (t) {
      var coincideTexto = !texto ||
        t.nombre.toLowerCase().indexOf(texto) !== -1 ||
        String(t.biografia || "").toLowerCase().indexOf(texto) !== -1 ||
        String(t.materias || "").toLowerCase().indexOf(texto) !== -1;
      var coincideMateria = !materia || String(t.materias || "").indexOf(materia) !== -1;
      var coincideNivel = !nivel || t.nivel_educativo === nivel;
      var coincidePrecio = Number(t.precio_hora) <= precioMax;
      var coincideCalif = Number(t.calificacion_prom) >= califMin;
      return coincideTexto && coincideMateria && coincideNivel && coincidePrecio && coincideCalif;
    });

    render(filtrados);
  }

  function render(lista) {
    var grid = $("#tutorGrid");
    grid.innerHTML = "";
    $("#resultsCount").textContent = lista.length + (lista.length === 1 ? " tutor disponible" : " tutores disponibles");
    $("#emptyState").hidden = lista.length !== 0;

    lista.forEach(function (t, indice) {
      var tarjeta = document.createElement("article");
      tarjeta.className = "tutor-card";
      tarjeta.style.animationDelay = (indice * 55) + "ms";
      tarjeta.innerHTML =
        '<div class="tutor-top">' +
          '<div class="avatar">' + escapar(iniciales(t.nombre)) + "</div>" +
          "<div>" +
            "<h3>" + escapar(t.nombre) + "</h3>" +
            '<p class="tutor-meta">' + escapar(t.titulo_profesional || "") + " · " + escapar(t.ciudad || "") + "</p>" +
            '<p class="stars">' + estrellas(t.calificacion_prom) + ' <span class="tutor-meta">' + Number(t.calificacion_prom).toFixed(1) + " (" + t.total_resenas + ")</span></p>" +
          "</div>" +
        "</div>" +
        '<p class="tutor-bio">' + escapar(t.biografia || "") + "</p>" +
        '<div class="tags">' + String(t.materias || "").split(", ").filter(Boolean).map(function (m) {
          return '<span class="tag">' + escapar(m) + "</span>";
        }).join("") + "</div>" +
        '<div class="tutor-foot">' +
          '<div class="tutor-price"><strong>' + money(t.precio_hora) + "</strong><span> /hora</span></div>" +
          '<button class="btn btn-primary" type="button">Agendar</button>' +
        "</div>";

      tarjeta.querySelector("button").addEventListener("click", function () { abrirReserva(t); });
      grid.appendChild(tarjeta);
    });
  }

  function initFiltros() {
    ["#fBuscar", "#fMateria", "#fNivel"].forEach(function (sel) {
      $(sel).addEventListener("input", aplicarFiltros);
    });
    $("#fPrecio").addEventListener("input", function () {
      $("#fPrecioVal").textContent = money(this.value);
      aplicarFiltros();
    });
    $("#fCalificacion").addEventListener("input", function () {
      $("#fCalificacionVal").textContent = Number(this.value).toFixed(1) + " ★";
      aplicarFiltros();
    });
    $("#btnLimpiar").addEventListener("click", function () {
      $("#fBuscar").value = "";
      $("#fMateria").value = "";
      $("#fNivel").value = "";
      $("#fPrecio").value = 60000;
      $("#fPrecioVal").textContent = money(60000);
      $("#fCalificacion").value = 0;
      $("#fCalificacionVal").textContent = "0.0 ★";
      aplicarFiltros();
    });

    $("#quickSearch").addEventListener("submit", function (evento) {
      evento.preventDefault();
      $("#fMateria").value = $("#qsMateria").value;
      $("#fNivel").value = $("#qsNivel").value;
      aplicarFiltros();
      $("#tutores").scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- Testimonios (RF-06) ---------- */
  function cargarTestimonios() {
    pedir("/resenas/destacadas")
      .catch(function () { return RESENAS_FALLBACK; })
      .then(function (lista) {
        var datos = Array.isArray(lista) && lista.length ? lista : RESENAS_FALLBACK;
        $("#testimonials").innerHTML = datos.map(function (r) {
          return '<article class="testimonial reveal">' +
            '<p class="stars">' + estrellas(r.puntuacion) + "</p>" +
            "<p>“" + escapar(r.comentario) + "”</p>" +
            '<footer><span class="avatar" style="width:34px;height:34px;font-size:.75rem">' + escapar(iniciales(r.estudiante)) + "</span>" +
            "<span>" + escapar(r.estudiante) + " · sobre " + escapar(r.tutor) + "</span></footer>" +
            "</article>";
        }).join("");
        initReveal();
      });
  }

  /* ---------- Modales ---------- */
  function abrirModal(id) { $(id).hidden = false; document.body.style.overflow = "hidden"; }
  function cerrarModal(id) { $(id).hidden = true; document.body.style.overflow = ""; }

  function initModales() {
    $$("[data-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        cerrarModal("#" + el.closest(".modal").id);
      });
    });
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape") { cerrarModal("#authModal"); cerrarModal("#bookModal"); }
    });
  }

  /* ---------- RF-01: autenticación ---------- */
  function initAuth() {
    $$("[data-open-auth]").forEach(function (boton) {
      boton.addEventListener("click", function () {
        cambiarTab(boton.getAttribute("data-open-auth"));
        abrirModal("#authModal");
      });
    });

    $$(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () { cambiarTab(tab.getAttribute("data-tab")); });
    });

    $("#authForm").addEventListener("submit", function (evento) {
      evento.preventDefault();
      var esRegistro = $('.tab[data-tab="registro"]').classList.contains("is-active");
      var email = $("#auEmail").value.trim();
      var password = $("#auPassword").value;
      var nombre = $("#auNombre").value.trim();
      var error = $("#authError");
      error.hidden = true;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        error.textContent = "Ingresa un correo electrónico válido.";
        error.hidden = false;
        return;
      }
      if (password.length < 8) {
        error.textContent = "La contraseña debe tener al menos 8 caracteres.";
        error.hidden = false;
        return;
      }
      if (esRegistro && nombre.length < 3) {
        error.textContent = "Escribe tu nombre completo.";
        error.hidden = false;
        return;
      }

      var ruta = esRegistro ? "/auth/registro" : "/auth/login";
      var cuerpo = esRegistro
        ? { nombre: nombre, email: email, password: password, rol: $("#auRol").value, precio_hora: $("#auRol").value === "tutor" ? 35000 : undefined }
        : { email: email, password: password };

      pedir(ruta, { method: "POST", body: cuerpo })
        .then(function (datos) {
          estado.token = datos.token;
          estado.usuario = datos.usuario;
          window.localStorage.setItem("ta_token", datos.token);
          window.localStorage.setItem("ta_usuario", JSON.stringify(datos.usuario));
          cerrarModal("#authModal");
          toast("¡Bienvenido/a, " + datos.usuario.nombre + "!");
        })
        .catch(function () {
          // Modo demostración sin backend activo
          estado.usuario = { nombre: nombre || email.split("@")[0], email: email, rol: esRegistro ? $("#auRol").value : "estudiante" };
          window.localStorage.setItem("ta_usuario", JSON.stringify(estado.usuario));
          cerrarModal("#authModal");
          toast("Sesión iniciada en modo demostración.");
        });
    });
  }

  function cambiarTab(nombreTab) {
    $$(".tab").forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-tab") === nombreTab); });
    var esRegistro = nombreTab === "registro";
    $("#fieldNombre").hidden = !esRegistro;
    $("#fieldRol").hidden = !esRegistro;
    $("#authTitle").textContent = esRegistro ? "Crear cuenta" : "Iniciar sesión";
    $("#authError").hidden = true;
  }

  /* ---------- RF-03/04/05: reserva, pago y sala ---------- */
  function irPaso(numero) {
    $$(".stepper li").forEach(function (li) {
      li.classList.toggle("is-active", Number(li.getAttribute("data-step")) <= numero);
    });
    $$(".step-panel").forEach(function (panel) {
      panel.hidden = Number(panel.getAttribute("data-panel")) !== numero;
    });
  }

  function abrirReserva(tutor) {
    estado.tutorSeleccionado = tutor;
    estado.horarioSeleccionado = null;

    $("#bookTutor").textContent = tutor.nombre + " · " + money(tutor.precio_hora) + " por hora";
    var contenedor = $("#slots");
    contenedor.innerHTML = "";

    HORARIOS.forEach(function (horario, indice) {
      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "slot";
      boton.textContent = horario;
      if (indice % 4 === 3) { boton.disabled = true; boton.textContent = horario + " (ocupado)"; }
      boton.addEventListener("click", function () {
        $$(".slot").forEach(function (s) { s.classList.remove("is-selected"); });
        boton.classList.add("is-selected");
        estado.horarioSeleccionado = horario;
        $("#btnIrPago").disabled = false;
      });
      contenedor.appendChild(boton);
    });

    $("#btnIrPago").disabled = true;
    irPaso(1);
    abrirModal("#bookModal");
  }

  function initReserva() {
    $("#btnIrPago").addEventListener("click", function () {
      var tutor = estado.tutorSeleccionado;
      $("#paySummary").innerHTML =
        "<div><strong>Tutor:</strong> " + escapar(tutor.nombre) + "</div>" +
        "<div><strong>Horario:</strong> " + escapar(estado.horarioSeleccionado) + "</div>" +
        "<div><strong>Duración:</strong> 60 minutos · Virtual</div>" +
        '<div class="total"><span>Total a pagar</span><span>' + money(tutor.precio_hora) + "</span></div>";
      irPaso(2);
    });

    $("#payMetodo").addEventListener("change", function () {
      $("#fieldTarjeta").hidden = this.value !== "tarjeta";
    });

    $("#payTarjeta").addEventListener("input", function () {
      var digitos = this.value.replace(/\D/g, "").slice(0, 16);
      this.value = digitos.replace(/(.{4})/g, "$1 ").trim();
    });

    $("#payVence").addEventListener("input", function () {
      var digitos = this.value.replace(/\D/g, "").slice(0, 4);
      this.value = digitos.length > 2 ? digitos.slice(0, 2) + "/" + digitos.slice(2) : digitos;
    });

    $("#payForm").addEventListener("submit", function (evento) {
      evento.preventDefault();
      var error = $("#payError");
      error.hidden = true;

      if ($("#payMetodo").value === "tarjeta") {
        var numero = $("#payTarjeta").value.replace(/\s/g, "");
        if (numero.length < 15) { error.textContent = "Número de tarjeta inválido."; error.hidden = false; return; }
        if (!/^\d{2}\/\d{2}$/.test($("#payVence").value)) { error.textContent = "Fecha de vencimiento inválida (MM/AA)."; error.hidden = false; return; }
        if ($("#payCvv").value.length < 3) { error.textContent = "CVV inválido."; error.hidden = false; return; }
      }

      var boton = $("#btnPagar");
      boton.disabled = true;
      boton.textContent = "Procesando pago…";

      window.setTimeout(function () {
        var referencia = "TA-2026-" + Math.random().toString(16).slice(2, 10).toUpperCase();
        var sala = "https://meet.tutoraula.co/sala-" + Math.random().toString(36).slice(2, 10);
        $("#payRef").textContent = "Referencia de pago " + referencia + " · " + money(estado.tutorSeleccionado.precio_hora);
        $("#roomLink").textContent = sala;
        boton.disabled = false;
        boton.textContent = "Pagar y confirmar";
        irPaso(3);
        toast("Pago aprobado. Tu sala virtual está lista.");
      }, 1400);
    });

    $("#btnCopiar").addEventListener("click", function () {
      var enlace = $("#roomLink").textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(enlace);
      toast("Enlace copiado al portapapeles.");
    });

    $("#btnEntrar").addEventListener("click", function () {
      toast("Abriendo la sala virtual de la tutoría…");
      cerrarModal("#bookModal");
    });
  }

  /* ---------- Planes ---------- */
  function initPlanes() {
    $$("[data-plan]").forEach(function (boton) {
      boton.addEventListener("click", function () {
        toast('Plan "' + boton.getAttribute("data-plan") + '" seleccionado. Elige tu tutor para continuar.');
        $("#tutores").scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* ---------- Arranque ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReveal();
    initFiltros();
    initModales();
    initAuth();
    initReserva();
    initPlanes();
    cargarMaterias().then(cargarTutores);
    cargarTestimonios();
  });
})();
