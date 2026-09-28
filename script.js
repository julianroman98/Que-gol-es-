document.addEventListener("DOMContentLoaded", () => {
  // Las respuestas del desafío se mantienen juntas para que cada categoría
  // pueda editarse sin cambiar la lógica del juego.
  // Cada desafío trae sus propios distractores: así no se reutilizan las mismas
  // cuatro opciones genéricas en todas las categorías.
  const desafios = {
    "Liga Argentina": {
      jugador: "Juan Román Riquelme", aceptados: ["Riquelme", "Juan Roman Riquelme", "Roman Riquelme"],
      imagen: "gol2026-09-22.webp", club: "Boca Juniors", rival: "River Plate", anio: "2001",
      opciones: {
        club: ["Boca Juniors", "Villarreal", "Argentinos Juniors", "Barcelona"],
        rival: ["River Plate", "Racing Club", "Independiente", "San Lorenzo"],
        anio: ["1999", "2001", "2002", "2003"]
      }
    },
    "Premier League": {
      jugador: "Carlos Tévez", aceptados: ["Tevez", "Carlos Tevez", "Carlos Tévez"],
      imagen: "GolPremier2026-09-22.webp", club: "Manchester City", rival: "Queens Park Rangers", anio: "2012",
      opciones: {
        club: ["Manchester City", "Manchester United", "West Ham United", "Juventus"],
        rival: ["Queens Park Rangers", "Chelsea", "Blackburn Rovers", "Manchester United"],
        anio: ["2008", "2010", "2012", "2013"]
      }
    },
    "LaLiga": {
      jugador: "Gareth Bale", aceptados: ["Gareth Bale", "Bale"],
      imagen: "golLigaEsp2026-09-22.webp", club: "Real Madrid", rival: "Barcelona", anio: "2014",
      opciones: {
        club: ["Real Madrid", "Tottenham Hotspur", "Southampton", "Inter de Milán"],
        rival: ["Barcelona", "Atlético de Madrid", "Sevilla", "Valencia"],
        anio: ["2012", "2013", "2014", "2018"]
      }
    },
    "Bundesliga": {
      jugador: "Robert Lewandowski", aceptados: ["Lewandowski", "Robert Lewandowski"],
      imagen: "golBundesliga2026-09-22.webp", club: "Bayern Múnich", rival: "Wolfsburgo", anio: "2015",
      opciones: {
        club: ["Bayern Múnich", "Borussia Dortmund", "Barcelona", "Lech Poznań"],
        rival: ["Wolfsburgo", "Mainz 05", "Borussia Dortmund", "Augsburgo"],
        anio: ["2013", "2014", "2015", "2020"]
      }
    },
    "Mundial": {
      jugador: "Diego Maradona", aceptados: ["Maradona", "Diego Maradona"],
      imagen: "golMundial2026-09-22.webp", club: "Argentina", rival: "Inglaterra", anio: "1986",
      preguntaEquipo: "¿A qué selección representaba en este partido?",
      opciones: {
        club: ["Argentina", "Brasil", "Italia", "México"],
        rival: ["Inglaterra", "Bélgica", "Alemania", "Uruguay"],
        anio: ["1978", "1982", "1986", "1990"]
      }
    },
    "Libertadores": {
      jugador: "Martín Palermo", aceptados: ["Palermo", "Martin Palermo", "Martín Palermo"],
      imagen: "golLibertadores2026-09-22.webp", club: "Boca Juniors", rival: "River Plate", anio: "2000",
      opciones: {
        club: ["Boca Juniors", "Estudiantes", "Villarreal", "Real Madrid"],
        rival: ["River Plate", "Palmeiras", "América de México", "Cerro Porteño"],
        anio: ["1998", "1999", "2000", "2007"]
      }
    }
  };
  // Estimación provisional del porcentaje de jugadores que alcanzarían ese
  // puntaje o más. Reemplazar por datos agregados cuando exista backend.
  const porcentajesEstimados = [100, 78, 52, 24, 8];
  const niveles = ["jugador", "club", "rival", "anio"];
  const consignas = {
    jugador: "¿Quién es este jugador?",
    club: "¿En qué equipo jugaba cuando marcó este gol?",
    rival: "¿Contra qué equipo fue el gol?",
    anio: "¿En qué año marcó este gol?"
  };
  const etiquetas = { club: "equipo", rival: "rival", anio: "año" };
  const landing = document.getElementById("contenedor-landing");
  const pantalla = document.getElementById("pantalla-juego");
  const tituloCategoria = document.getElementById("categoria-titulo");
  const imagen = document.getElementById("imagen-jugador");
  const consigna = document.getElementById("consigna-nivel");
  const formulario = document.getElementById("form-nivel-texto");
  const entrada = document.getElementById("input-nombre");
  const opciones = document.getElementById("contenedor-opciones");
  const feedback = document.getElementById("mensaje-feedback");
  const resultados = document.getElementById("contenedor-resultados");
  const progreso = document.getElementById("progreso-texto");
  const marcador = document.getElementById("marcador");
  let desafioActual = null;
  let indice = 0;
  let puntaje = 0;
  let bloqueado = false;

  const normalizar = (texto) => texto.toLocaleLowerCase("es")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ").trim();

  function actualizarEncabezado() {
    progreso.textContent = `Pregunta ${Math.min(indice + 1, 4)} de 4`;
    marcador.textContent = `${puntaje} ${puntaje === 1 ? "punto" : "puntos"}`;
  }

  function feedbackMostrar(texto, correcto) {
    feedback.textContent = texto;
    feedback.className = `feedback ${correcto ? "correcto" : "incorrecto"}`;
  }

  function mostrarNivel() {
    if (indice >= niveles.length) return mostrarResultados();
    const tipo = niveles[indice];
    consigna.textContent = tipo === "club" && desafioActual.preguntaEquipo ? desafioActual.preguntaEquipo : consignas[tipo];
    actualizarEncabezado();
    feedback.className = "feedback oculto";
    opciones.classList.add("oculto");
    opciones.replaceChildren();
    formulario.classList.toggle("oculto", tipo !== "jugador");
    if (tipo === "jugador") {
      entrada.value = "";
      entrada.focus();
      return;
    }
    formulario.classList.add("oculto");
    opciones.classList.remove("oculto");
    const correcta = desafioActual[tipo];
    const respuestas = [...desafioActual.opciones[tipo]].sort(() => Math.random() - 0.5);
    respuestas.forEach((respuesta) => {
      const boton = document.createElement("button");
      boton.className = "btn-opcion";
      boton.type = "button";
      boton.textContent = respuesta;
      boton.addEventListener("click", () => responder(respuesta, correcta, tipo));
      opciones.append(boton);
    });
  }

  function responder(respuesta, correcta, tipo) {
    if (bloqueado) return;
    if (normalizar(respuesta) !== normalizar(correcta)) {
      feedbackMostrar("No es esa. Probá otra vez.", false);
      return;
    }
    bloqueado = true;
    puntaje++;
    actualizarEncabezado();
    feedbackMostrar(tipo === "jugador" ? "¡Ese es!" : `¡Correcto! ${etiquetas[tipo]}: ${correcta}.`, true);
    if (tipo === "jugador") opciones.classList.add("oculto");
    setTimeout(() => {
      indice++;
      bloqueado = false;
      mostrarNivel();
    }, 850);
  }

  function iniciar(categoria) {
    desafioActual = desafios[categoria];
    if (!desafioActual) return;
    indice = 0;
    puntaje = 0;
    bloqueado = false;
    tituloCategoria.textContent = categoria;
    imagen.src = desafioActual.imagen;
    imagen.alt = `Festejo de gol de ${desafioActual.jugador}`;
    landing.classList.add("oculto");
    pantalla.classList.remove("oculto");
    formulario.classList.remove("oculto");
    resultados.classList.add("oculto");
    mostrarNivel();
  }

  function mostrarResultados() {
    formulario.classList.add("oculto");
    opciones.classList.add("oculto");
    feedback.classList.add("oculto");
    resultados.classList.remove("oculto");
    consigna.textContent = "Desafío terminado";
    const porcentaje = porcentajesEstimados[puntaje];
    document.getElementById("puntaje-final").textContent = `${puntaje} de 4 ${puntaje === 1 ? "punto" : "puntos"}`;
    document.getElementById("porcentaje-destacado").textContent = `${porcentaje}%`;
    document.getElementById("texto-percentil").textContent = `Estimamos que el ${porcentaje}% de los jugadores conseguiría este puntaje o más.`;
    document.getElementById("barra-progreso-fill").style.width = `${porcentaje}%`;
    actualizarEncabezado();
  }

  document.querySelectorAll("[data-categoria]").forEach((boton) => {
    boton.addEventListener("click", () => iniciar(boton.dataset.categoria));
  });
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (!desafioActual || indice !== 0) return;
    const entradaNormalizada = normalizar(entrada.value);
    const aceptados = desafioActual.aceptados.map(normalizar);
    if (aceptados.includes(entradaNormalizada)) responder(desafioActual.jugador, desafioActual.jugador, "jugador");
    else feedbackMostrar("Todavía no. Revisá la imagen e intentá de nuevo.", false);
  });

  function volverCategorias() {
    pantalla.classList.add("oculto");
    landing.classList.remove("oculto");
    desafioActual = null;
  }
  document.getElementById("btn-volver").addEventListener("click", volverCategorias);
  document.getElementById("btn-reiniciar-menu").addEventListener("click", volverCategorias);

  const modal = document.getElementById("modal-instrucciones");
  const cerrarModal = () => modal.classList.add("oculto");
  document.getElementById("btn-Cerrar").addEventListener("click", cerrarModal);
  document.getElementById("btn-Entendido").addEventListener("click", cerrarModal);
  modal.addEventListener("click", (evento) => { if (evento.target === modal) cerrarModal(); });
  document.addEventListener("keydown", (evento) => { if (evento.key === "Escape") cerrarModal(); });
});

