// ==UserScript==
// @name         Email Smart Unsubscribe
// @namespace    https://github.com/Baalgarthem/
// @version      2.9.1
// @description  Detecta enlaces para cancelar suscripciones en correos abiertos de Gmail y Outlook, y muestra un botón de confirmación.
// @author       Baalgarthem
// @icon         https://raw.githubusercontent.com/Baalgarthem/email-smart-unsubscribe/principal/media/email-smart-unsubscribe.ico
// @downloadURL  https://raw.githubusercontent.com/Baalgarthem/email-smart-unsubscribe/principal/dist/email-smart-unsubscribe.user.js
// @updateURL    https://raw.githubusercontent.com/Baalgarthem/email-smart-unsubscribe/principal/dist/email-smart-unsubscribe.user.js
// @match        https://mail.google.com/*
// @match        https://outlook.office.com/*
// @match        https://outlook.office365.com/*
// @match        https://outlook.live.com/*
// @match        https://navigator-lxa.mail.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/config/state.js
  var estado;
  var init_state = __esm({
    "src/config/state.js"() {
      estado = {
        bloqueado: false,
        buscando: false,
        timeoutBusqueda: null,
        observador: null,
        ultimoResultado: null,
        ultimaFirmaVista: "",
        anfitrionInterfaz: null,
        raizInterfaz: null,
        botonPrincipal: null,
        panelDiagnostico: null
      };
    }
  });

  // src/config/constants.js
  var IDENTIFICADORES, configuracion, patronHrefBaja, patronDominioMarketing, patronTextoRelevante, selectoresNativos;
  var init_constants = __esm({
    "src/config/constants.js"() {
      IDENTIFICADORES = Object.freeze({
        anfitrion: "esu-ui-host",
        boton: "esu-pill",
        aviso: "esu-notify",
        panel: "esu-panel-diagnostico"
      });
      configuracion = {
        umbralMostrar: 0.58,
        umbralAltaConfianza: 0.74,
        maximoCandidatosPorRaiz: 500,
        bloqueoMs: 2e3,
        retrasoBusquedaMs: 650,
        retrasoInicioMs: 1500,
        modoDebug: false,
        mostrarPanelDiagnostico: false,
        colores: {
          primario: "#1a73e8",
          peligro: "#d93025",
          exito: "#1e8e3e",
          advertencia: "#f9ab00",
          neutro: "#5f6368",
          panel: "#202124"
        },
        pesos: {
          fraseCritica: 45,
          fraseAlta: 32,
          fraseMedia: 20,
          fraseBaja: 10,
          hrefCritico: 42,
          dominioMarketing: 16,
          atributoFuerte: 24,
          atributoMedio: 14,
          contextoFooter: 18,
          contextoPreferencias: 16,
          contextoNewsletter: 10,
          esEnlace: 8,
          esBoton: 5,
          esAccionable: 7,
          elementoCompacto: 5,
          coherenciaNewsletterBaja: 12,
          coincidenciaDifusa: 10,
          deteccionAlgoritmicaContextual: 55,
          botonNativoCorreo: 1e3,
          huellaVisualDiscreta: 25,
          proximidadSemanticaEstricta: 40,
          cercaniaPixelRastreo: 30,
          penalizacionRiesgo: -45,
          penalizacionCuenta: -30,
          penalizacionSocial: -20,
          penalizacionCompra: -28,
          penalizacionTextoLargo: -12,
          penalizacionOculto: -100
        }
      };
      patronHrefBaja = /(?:unsubscribe|un[-_]?subscribe|unsub|opt[\-_]?out|remove[_-]?me|leave[_-]?list|stop[_-]?emails|email[_-]?(?:preferences|settings|profile|subscription)|subscription[_-]?(?:preferences|center|centre|settings)|manage[_-]?(?:subscriptions|preferences)|preference[_-]?(?:center|centre)|list[_-]?unsubscribe|cancel(?:ar)?[_-]?(?:subscription|suscripcion)|baja[_-]?(?:suscripcion|boletin)|desuscrib|edm[_-]?setting)/i;
      patronDominioMarketing = /(?:mailchimp|mandrillapp|sendgrid|sendinblue|brevo|hubspot|salesforce|pardot|marketo|eloqua|constantcontact|activecampaign|klaviyo|iterable|mailgun|sparkpost|campaign|newsletter|mailing|edm)/i;
      patronTextoRelevante = /unsubscribe|un\s*subscribe|opt\s*out|remove\s*me|stop\s*(?:receiving\s*)?(?:emails|messages)|darse?\s+de\s+baja|darme\s+de\s+baja|desuscrib|desinscrib|cancelar\s+(?:la\s+|mi\s+|tu\s+)?suscrip|baja\s+(?:de\s+)?suscrip|manage\s+(?:email\s+)?subscriptions|subscription\s+(?:preferences|center|centre)|preferencias?\s+(?:de\s+)?(?:correo|email|suscrip)|newsletter|boletin|boletín|dejar\s+de\s+recibir/i;
      selectoresNativos = [
        // Gmail native list-unsubscribe button (often a span with 'Cancelar suscripción' or similar near the sender)
        ".Ca",
        // Historically Gmail's unsubscribe button class, but it changes. 
        'span[email="unsubscribe"]',
        // Fallback pattern
        'div[data-tooltip*="unsubscribe" i]',
        'div[data-tooltip*="cancelar suscripci\xF3n" i]'
      ];
    }
  });

  // src/utils/string.js
  function normalizarTexto(texto) {
    return String(texto || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&amp;/g, "&").replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
  }
  function dividirEnPalabras(texto) {
    return normalizarTexto(texto).split(/[^a-z0-9@.]+/i).filter((palabra) => palabra.length > 1);
  }
  function limpiarFrasesRepetidas(grupos) {
    const resultado = {};
    for (const [nombre, lista] of Object.entries(grupos)) {
      const frasesVistas = /* @__PURE__ */ new Set();
      resultado[nombre] = lista.filter((frase) => {
        const fraseNormalizada = normalizarTexto(frase);
        if (!fraseNormalizada || frasesVistas.has(fraseNormalizada)) {
          return false;
        }
        frasesVistas.add(fraseNormalizada);
        return true;
      });
    }
    return resultado;
  }
  function contarCoincidencias(texto, listaFrases) {
    const textoNormalizado = normalizarTexto(texto);
    let total = 0;
    for (const frase of listaFrases) {
      if (textoNormalizado.includes(normalizarTexto(frase))) {
        total++;
      }
    }
    return total;
  }
  function encontrarMejorFrase(texto, listaFrases) {
    const textoNormalizado = normalizarTexto(texto);
    let mejorFrase = "";
    for (const frase of listaFrases) {
      const fraseNormalizada = normalizarTexto(frase);
      if (textoNormalizado.includes(fraseNormalizada) && fraseNormalizada.length > mejorFrase.length) {
        mejorFrase = fraseNormalizada;
      }
    }
    return mejorFrase;
  }
  function calcularDistanciaLevenshtein(textoA, textoB, limite = 3) {
    const a = normalizarTexto(textoA);
    const b = normalizarTexto(textoB);
    if (Math.abs(a.length - b.length) > limite) {
      return limite + 1;
    }
    const filaAnterior = Array.from(
      { length: b.length + 1 },
      (_, indice) => indice
    );
    const filaActual = new Array(b.length + 1);
    for (let indiceA = 1; indiceA <= a.length; indiceA++) {
      filaActual[0] = indiceA;
      let minimoFila = filaActual[0];
      for (let indiceB = 1; indiceB <= b.length; indiceB++) {
        const costo = a[indiceA - 1] === b[indiceB - 1] ? 0 : 1;
        filaActual[indiceB] = Math.min(
          filaAnterior[indiceB] + 1,
          filaActual[indiceB - 1] + 1,
          filaAnterior[indiceB - 1] + costo
        );
        minimoFila = Math.min(minimoFila, filaActual[indiceB]);
      }
      if (minimoFila > limite) {
        return limite + 1;
      }
      for (let indiceB = 0; indiceB <= b.length; indiceB++) {
        filaAnterior[indiceB] = filaActual[indiceB];
      }
    }
    return filaAnterior[b.length];
  }
  function calcularSimilitudJaccard(palabrasA, palabrasB) {
    const conjuntoA = new Set(palabrasA);
    const conjuntoB = new Set(palabrasB);
    if (!conjuntoA.size || !conjuntoB.size) {
      return 0;
    }
    let interseccion = 0;
    for (const palabra of conjuntoA) {
      if (conjuntoB.has(palabra)) {
        interseccion++;
      }
    }
    return interseccion / (conjuntoA.size + conjuntoB.size - interseccion);
  }
  function calcularCoincidenciaDifusa(texto) {
    const palabras = dividirEnPalabras(texto).filter((palabra) => palabra.length >= 5 && palabra.length <= 18).slice(0, 80);
    const objetivos = [
      "unsubscribe",
      "desuscribirse",
      "desinscribirse",
      "suscripcion",
      "preferences",
      "subscriptions",
      "optout",
      "newsletter",
      "boletin"
    ];
    let mejorSimilitud = 0;
    for (const palabra of palabras) {
      for (const objetivo of objetivos) {
        const distancia = calcularDistanciaLevenshtein(
          palabra,
          objetivo,
          3
        );
        if (distancia <= 2) {
          const similitud = 1 - distancia / Math.max(
            palabra.length,
            objetivo.length
          );
          mejorSimilitud = Math.max(
            mejorSimilitud,
            similitud
          );
        }
      }
    }
    return mejorSimilitud;
  }
  function encontrarIndiceFrase(texto, listaFrases) {
    const textoNormalizado = normalizarTexto(texto);
    let mejorIndice = -1;
    for (const frase of listaFrases) {
      const fraseNormalizada = normalizarTexto(frase);
      const indice = textoNormalizado.indexOf(fraseNormalizada);
      if (indice !== -1) {
        if (mejorIndice === -1 || indice < mejorIndice) {
          mejorIndice = indice;
        }
      }
    }
    return mejorIndice;
  }
  function calcularDistanciaSemantica(texto, grupoA, grupoB) {
    const indiceA = encontrarIndiceFrase(texto, grupoA);
    const indiceB = encontrarIndiceFrase(texto, grupoB);
    if (indiceA === -1 || indiceB === -1) {
      return Infinity;
    }
    return Math.abs(indiceA - indiceB);
  }
  var init_string = __esm({
    "src/utils/string.js"() {
    }
  });

  // src/utils/dom.js
  function limpiarCacheContexto() {
    cacheContexto = /* @__PURE__ */ new WeakMap();
  }
  function obtenerHrefAbsoluto(elemento) {
    const href = elemento?.href || elemento?.getAttribute?.("href") || elemento?.getAttribute?.("data-href") || elemento?.getAttribute?.("data-url") || "";
    try {
      return href ? new URL(href, location.href).href : "";
    } catch {
      return href;
    }
  }
  function obtenerTextoDeAtributos(elemento) {
    const atributos = [
      "href",
      "title",
      "aria-label",
      "aria-description",
      "alt",
      "value",
      "name",
      "id",
      "class",
      "data-testid",
      "data-test-id",
      "data-action",
      "data-link-name",
      "data-link-type",
      "data-track",
      "data-tracking",
      "data-url",
      "data-href",
      "data-qa",
      "data-cy",
      "rel",
      "target",
      "type",
      "role"
    ];
    return atributos.map((atributo) => elemento?.getAttribute?.(atributo)).filter(Boolean).join(" ");
  }
  function obtenerTextoPropio(elemento) {
    return normalizarTexto([
      elemento?.innerText,
      elemento?.textContent,
      obtenerTextoDeAtributos(elemento),
      obtenerHrefAbsoluto(elemento)
    ].filter(Boolean).join(" "));
  }
  function elementoEsVisible(elemento) {
    try {
      if (!elemento?.isConnected) {
        return false;
      }
      const ventana = elemento.ownerDocument?.defaultView || window;
      const estilo = ventana.getComputedStyle(elemento);
      if (estilo.display === "none" || estilo.visibility === "hidden" || Number(estilo.opacity) < 0.05 || estilo.pointerEvents === "none") {
        return false;
      }
      const rectangulo = elemento.getBoundingClientRect();
      if (rectangulo.width < 2 || rectangulo.height < 2) {
        return false;
      }
      return Boolean(
        elemento.offsetWidth || elemento.offsetHeight || elemento.getClientRects().length
      );
    } catch {
      return false;
    }
  }
  function obtenerContextoCercano(elemento) {
    if (cacheContexto.has(elemento)) {
      return cacheContexto.get(elemento);
    }
    const partes = [obtenerTextoPropio(elemento)];
    let actual = elemento.parentElement;
    let profundidad = 0;
    while (actual && profundidad < 4) {
      const texto = actual.innerText || actual.textContent || "";
      if (texto && texto.length < 1800) {
        partes.push(texto);
      }
      actual = actual.parentElement;
      profundidad++;
    }
    const contexto = normalizarTexto(
      partes.join(" ")
    ).slice(0, 3500);
    cacheContexto.set(elemento, contexto);
    return contexto;
  }
  function elementoPareceEstarEnFooter(elemento) {
    let actual = elemento;
    let pasos = 0;
    while (actual && pasos < 6) {
      const descripcion = normalizarTexto([
        actual.tagName,
        actual.getAttribute?.("role"),
        actual.getAttribute?.("class"),
        actual.getAttribute?.("id"),
        actual.getAttribute?.("aria-label")
      ].filter(Boolean).join(" "));
      if (/footer|pie de pagina|legal|compliance|email footer|mail footer|unsubscribe area|subscription footer|fine print/.test(
        descripcion
      )) {
        return true;
      }
      actual = actual.parentElement;
      pasos++;
    }
    return false;
  }
  function elementoTieneAccionDirecta(elemento) {
    if (!elemento) {
      return false;
    }
    return Boolean(
      elemento.tagName === "A" || elemento.tagName === "BUTTON" || elemento.onclick || elemento.getAttribute?.("href") || elemento.getAttribute?.("data-href") || elemento.getAttribute?.("data-url") || elemento.getAttribute?.("role") === "button" || /button|submit/i.test(elemento.getAttribute?.("type") || "")
    );
  }
  function obtenerElementoAccionable(elemento) {
    let actual = elemento;
    let pasos = 0;
    while (actual && pasos < 6) {
      if (elementoTieneAccionDirecta(actual)) {
        return actual;
      }
      actual = actual.parentElement;
      pasos++;
    }
    return elemento;
  }
  function obtenerElementosVisiblesUnicos(documentoActual, selectores, minimoTexto = 20) {
    const elementos = [];
    const vistos = /* @__PURE__ */ new Set();
    for (const selector of selectores) {
      let coincidencias = [];
      try {
        coincidencias = documentoActual.querySelectorAll(selector);
      } catch {
        continue;
      }
      for (const elemento of coincidencias) {
        if (vistos.has(elemento) || !elementoEsVisible(elemento)) {
          continue;
        }
        const texto = normalizarTexto(
          elemento.innerText || elemento.textContent || ""
        );
        if (texto.length < minimoTexto) {
          continue;
        }
        vistos.add(elemento);
        elementos.push(elemento);
      }
    }
    return elementos;
  }
  function obtenerHuellaVisual(elemento) {
    try {
      const ventana = elemento.ownerDocument?.defaultView || window;
      const estilo = ventana.getComputedStyle(elemento);
      let fontSize = parseFloat(estilo.fontSize);
      if (isNaN(fontSize)) fontSize = 14;
      const opacity = parseFloat(estilo.opacity);
      return {
        esPequeno: fontSize <= 12,
        esMuyPequeno: fontSize <= 10,
        esSemiOculto: opacity < 0.6
      };
    } catch {
      return { esPequeno: false, esMuyPequeno: false, esSemiOculto: false };
    }
  }
  function elementoCercaDePixelRastreo(elemento) {
    try {
      let actual = elemento.parentElement;
      let pasos = 0;
      while (actual && pasos < 4) {
        const imagenes = actual.querySelectorAll("img");
        for (const img of imagenes) {
          if (img.width <= 2 || img.height <= 2 || img.style.display === "none" || img.style.visibility === "hidden") {
            return true;
          }
        }
        actual = actual.parentElement;
        pasos++;
      }
      return false;
    } catch {
      return false;
    }
  }
  function esBotonNativoDeCorreo(elemento) {
    const doc = elemento.ownerDocument;
    if (doc !== window.document) return false;
    let actual = elemento;
    let pasos = 0;
    while (actual && pasos < 6) {
      if (actual.classList?.contains("a3s")) {
        return false;
      }
      actual = actual.parentElement;
      pasos++;
    }
    return true;
  }
  var cacheContexto;
  var init_dom = __esm({
    "src/utils/dom.js"() {
      init_string();
      cacheContexto = /* @__PURE__ */ new WeakMap();
    }
  });

  // src/core/scanner.js
  function esGmailActual() {
    return location.hostname === "mail.google.com";
  }
  function esOutlookActual() {
    return [
      "outlook.office.com",
      "outlook.office365.com",
      "outlook.live.com"
    ].includes(location.hostname);
  }
  function eliminarRaicesContenidas(raices) {
    return raices.filter((raiz, indice) => {
      return !raices.some((otraRaiz, otroIndice) => {
        return indice !== otroIndice && otraRaiz.contains(raiz);
      });
    });
  }
  function obtenerRaicesGmail(documentoActual) {
    if (!esGmailActual()) {
      return [];
    }
    const selectores = [
      "div.a3s.aiL",
      "div.a3s",
      'div[role="listitem"] div.a3s',
      'div[role="main"] div.a3s',
      // Cabeceras nativas donde Gmail inyecta su botón de "Cancelar suscripción"
      "div.gE.iv.gt",
      "div.Ca",
      'div[data-tooltip*="unsubscribe" i]'
    ];
    const raices = obtenerElementosVisiblesUnicos(
      documentoActual,
      selectores,
      20
    );
    return eliminarRaicesContenidas(raices);
  }
  function obtenerRaicesOutlook(documentoActual) {
    if (!esOutlookActual()) {
      return [];
    }
    const selectoresPrioritarios = [
      '[role="main"] [data-testid="message-body"]',
      '[role="main"] [data-app-section="MailReadCompose"]',
      '[role="main"] [aria-label*="Message body" i]',
      '[role="main"] [aria-label*="Cuerpo del mensaje" i]',
      '[role="main"] [aria-label*="Message content" i]',
      '[role="main"] [aria-label*="Contenido del mensaje" i]',
      '[role="main"] [role="document"]',
      '[role="main"] [data-is-focusable="true"] [role="document"]',
      // Cabeceras nativas donde Outlook inyecta "Unsubscribe"
      '[data-testid="UnsubscribeButton"]',
      'button[name="Unsubscribe"]'
    ];
    let raices = obtenerElementosVisiblesUnicos(
      documentoActual,
      selectoresPrioritarios,
      20
    );
    if (!raices.length) {
      const selectoresAlternativos = [
        '[role="main"] div[contenteditable="false"]',
        '[role="main"] div[dir="ltr"]'
      ];
      raices = obtenerElementosVisiblesUnicos(
        documentoActual,
        selectoresAlternativos,
        60
      ).filter((elemento) => {
        const cantidadEnlaces = elemento.querySelectorAll("a[href]").length;
        const texto = normalizarTexto(
          elemento.innerText || elemento.textContent || ""
        );
        return cantidadEnlaces > 0 && texto.length >= 60 && texto.length <= 1e5;
      });
    }
    return eliminarRaicesContenidas(raices);
  }
  function obtenerRaicesGenericas(documentoActual) {
    const selectores = [
      '[role="main"]',
      "main",
      '[role="document"]'
    ];
    return obtenerElementosVisiblesUnicos(
      documentoActual,
      selectores,
      20
    );
  }
  function obtenerRaicesDeBusqueda(documentoActual) {
    if (esGmailActual()) {
      return obtenerRaicesGmail(documentoActual);
    }
    if (esOutlookActual()) {
      return obtenerRaicesOutlook(documentoActual);
    }
    return obtenerRaicesGenericas(documentoActual);
  }
  function obtenerDocumentosExplorables() {
    const documentos = [document];
    for (const iframe of document.querySelectorAll("iframe")) {
      try {
        const documentoIframe = iframe.contentDocument;
        if (documentoIframe && documentoIframe.documentElement) {
          documentos.push(documentoIframe);
        }
      } catch {
      }
    }
    return documentos;
  }
  function obtenerFirmaVistaActual() {
    const partes = [
      location.href,
      document.title
    ];
    if (esGmailActual()) {
      const asunto = document.querySelector(
        'h2.hP, [role="main"] h2'
      );
      const remitente = document.querySelector(
        "span[email].gD, span[email], .gD[email]"
      );
      partes.push(
        asunto?.innerText || "",
        remitente?.getAttribute?.("email") || ""
      );
    }
    if (esOutlookActual()) {
      const asunto = document.querySelector(
        '[role="main"] [role="heading"], [role="main"] h1, [role="main"] h2'
      );
      partes.push(asunto?.innerText || "");
    }
    return normalizarTexto(partes.join("|")).slice(0, 500);
  }
  function obtenerCandidatos(raiz) {
    const selectorAccionable = [
      "a[href]",
      "button",
      'input[type="button"]',
      'input[type="submit"]',
      '[role="button"]',
      "[onclick]",
      "[data-href]",
      "[data-url]"
    ].join(",");
    const selectorTextual = [
      "span",
      "p",
      "td",
      "div"
    ].join(",");
    const candidatos = [];
    const vistos = /* @__PURE__ */ new Set();
    function agregarCandidato(elemento) {
      if (!elemento || !elemento.isConnected || elemento.closest?.(
        `#${IDENTIFICADORES.anfitrion}`
      )) {
        return;
      }
      const accionable = obtenerElementoAccionable(elemento);
      if (!accionable || vistos.has(accionable) || !elementoEsVisible(accionable)) {
        return;
      }
      vistos.add(accionable);
      candidatos.push(accionable);
    }
    for (const elemento of raiz.querySelectorAll(selectorAccionable)) {
      const textoRapido = normalizarTexto([
        obtenerTextoPropio(elemento),
        obtenerHrefAbsoluto(elemento)
      ].join(" "));
      const esNativo = selectoresNativos.some((sel) => elemento.matches(sel));
      if (esNativo || patronHrefBaja.test(textoRapido) || patronTextoRelevante.test(textoRapido)) {
        agregarCandidato(elemento);
      }
      if (candidatos.length >= configuracion.maximoCandidatosPorRaiz) {
        break;
      }
    }
    if (candidatos.length < configuracion.maximoCandidatosPorRaiz) {
      for (const elemento of raiz.querySelectorAll(selectorTextual)) {
        const texto = normalizarTexto(
          elemento.innerText || elemento.textContent || ""
        );
        if (texto.length > 250 || !patronTextoRelevante.test(texto)) {
          continue;
        }
        agregarCandidato(elemento);
        if (candidatos.length >= configuracion.maximoCandidatosPorRaiz) {
          break;
        }
      }
    }
    return candidatos;
  }
  var init_scanner = __esm({
    "src/core/scanner.js"() {
      init_string();
      init_dom();
      init_constants();
    }
  });

  // src/ui/interface.js
  function crearInterfaz() {
    if (estado.raizInterfaz && estado.anfitrionInterfaz?.isConnected) {
      return estado.raizInterfaz;
    }
    document.getElementById(IDENTIFICADORES.anfitrion)?.remove();
    const anfitrion = document.createElement("div");
    anfitrion.id = IDENTIFICADORES.anfitrion;
    Object.assign(anfitrion.style, {
      all: "initial",
      position: "fixed",
      inset: "0",
      width: "0",
      height: "0",
      zIndex: "2147483647",
      pointerEvents: "none"
    });
    document.documentElement.appendChild(anfitrion);
    const raiz = anfitrion.attachShadow({ mode: "open" });
    const estilos = document.createElement("style");
    estilos.textContent = `
        :host {
            all: initial;
        }

        *,
        *::before,
        *::after {
            box-sizing: border-box;
        }

        #${IDENTIFICADORES.boton} {
            all: unset;
            box-sizing: border-box;
            position: fixed;
            right: 24px;
            bottom: 24px;
            z-index: 2147483647;
            display: none;
            min-width: 145px;
            padding: 12px 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 999px;
            background: ${configuracion.colores.primario};
            color: #ffffff;
            cursor: pointer;
            pointer-events: auto;
            user-select: none;
            white-space: nowrap;
            text-align: center;
            font: 700 14px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            box-shadow: 0 6px 22px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.2);
            transition: transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
        }

        #${IDENTIFICADORES.boton}:hover:not(:disabled) {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 9px 28px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.25);
        }

        #${IDENTIFICADORES.boton}:focus-visible {
            outline: 3px solid rgba(26, 115, 232, 0.35);
            outline-offset: 3px;
        }

        #${IDENTIFICADORES.boton}:disabled {
            cursor: not-allowed;
            opacity: 0.86;
        }

        #${IDENTIFICADORES.aviso} {
            position: fixed;
            top: 20px;
            left: 50%;
            z-index: 2147483647;
            max-width: min(560px, calc(100vw - 32px));
            padding: 12px 20px;
            border-radius: 12px;
            color: #ffffff;
            pointer-events: none;
            text-align: center;
            font: 600 14px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            transform: translateX(-50%);
        }

        #${IDENTIFICADORES.panel} {
            position: fixed;
            right: 18px;
            bottom: 88px;
            z-index: 2147483646;
            display: none;
            width: min(380px, calc(100vw - 36px));
            max-height: 48vh;
            overflow: auto;
            padding: 12px;
            border-radius: 14px;
            background: ${configuracion.colores.panel};
            color: #ffffff;
            pointer-events: auto;
            font: 12px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
        }

        #${IDENTIFICADORES.panel} pre {
            margin: 8px 0 0;
            padding: 8px;
            border-radius: 9px;
            background: rgba(255, 255, 255, 0.08);
            color: #e8eaed;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
        }

        @media (max-width: 600px) {
            #${IDENTIFICADORES.boton} {
                right: 12px;
                bottom: 12px;
                max-width: calc(100vw - 24px);
            }

            #${IDENTIFICADORES.panel} {
                right: 12px;
                bottom: 76px;
                width: calc(100vw - 24px);
            }
        }
    `;
    raiz.appendChild(estilos);
    estado.anfitrionInterfaz = anfitrion;
    estado.raizInterfaz = raiz;
    return raiz;
  }
  function crearAviso() {
    const raiz = crearInterfaz();
    estado.raizInterfaz?.getElementById(IDENTIFICADORES.aviso)?.remove();
    const aviso = document.createElement("div");
    aviso.id = IDENTIFICADORES.aviso;
    raiz.appendChild(aviso);
    return aviso;
  }
  function notificar(mensaje, color = configuracion.colores.peligro) {
    const aviso = crearAviso();
    aviso.textContent = mensaje;
    aviso.style.background = color;
    window.setTimeout(() => {
      aviso.remove();
    }, 3800);
  }
  function actualizarPanelDiagnostico(cantidadRaices, resultados, mejorResultado) {
    if (!configuracion.mostrarPanelDiagnostico) {
      estado.panelDiagnostico?.remove();
      estado.panelDiagnostico = null;
      return;
    }
    const raiz = crearInterfaz();
    if (!estado.panelDiagnostico?.isConnected) {
      const panel2 = document.createElement("div");
      panel2.id = IDENTIFICADORES.panel;
      raiz.appendChild(panel2);
      estado.panelDiagnostico = panel2;
    }
    const panel = estado.panelDiagnostico;
    panel.style.display = "block";
    panel.replaceChildren();
    const titulo = document.createElement("strong");
    titulo.textContent = "Email Smart Unsubscribe";
    const resumen = document.createElement("div");
    resumen.style.marginTop = "6px";
    resumen.style.color = "#c8d0d8";
    resumen.textContent = [
      `Proveedor: ${esGmailActual() ? "Gmail" : esOutlookActual() ? "Outlook" : location.hostname}`,
      `Ra\xEDces: ${cantidadRaices}`,
      `Candidatos: ${resultados.length}`,
      `Resultado: ${mejorResultado ? `${mejorResultado.porcentaje}%` : "sin coincidencia"}`
    ].join(" \xB7 ");
    panel.append(titulo, resumen);
    if (mejorResultado) {
      const detalles = document.createElement("pre");
      detalles.textContent = [
        `Texto: ${mejorResultado.texto}`,
        `URL: ${mejorResultado.href || "sin URL"}`,
        `Score: ${mejorResultado.score}`,
        "",
        ...mejorResultado.razones
      ].join("\n");
      panel.appendChild(detalles);
    }
  }
  var init_interface = __esm({
    "src/ui/interface.js"() {
      init_state();
      init_constants();
      init_scanner();
    }
  });

  // src/core/learning.js
  function obtenerFrasesAprendidas() {
    try {
      if (typeof GM_getValue !== "undefined") {
        const guardadas = GM_getValue(CLAVE_ALMACENAMIENTO, "[]");
        return JSON.parse(guardadas);
      }
    } catch (e) {
      if (configuracion.modoDebug) console.error("Error al obtener frases aprendidas:", e);
    }
    return [];
  }
  function aprenderNuevaFrase(textoCrudo) {
    if (!textoCrudo) return;
    let texto = normalizarTexto(textoCrudo);
    if (texto.length < 3 || texto.length > 50) return;
    const memoria = obtenerFrasesAprendidas();
    if (memoria.includes(texto)) return;
    memoria.push(texto);
    try {
      if (typeof GM_setValue !== "undefined") {
        GM_setValue(CLAVE_ALMACENAMIENTO, JSON.stringify(memoria));
        if (configuracion.modoDebug) {
          console.log(`[Auto-Aprendizaje] Nueva frase memorizada: "${texto}"`);
        }
      }
    } catch (e) {
      if (configuracion.modoDebug) console.error("Error al guardar nueva frase:", e);
    }
  }
  var CLAVE_ALMACENAMIENTO;
  var init_learning = __esm({
    "src/core/learning.js"() {
      init_string();
      init_constants();
      CLAVE_ALMACENAMIENTO = "esu_frases_aprendidas";
    }
  });

  // src/config/phrases.js
  var frasesBase, aprendidas, frases;
  var init_phrases = __esm({
    "src/config/phrases.js"() {
      init_string();
      init_learning();
      frasesBase = {
        criticas: [
          "unsubscribe",
          "un-subscribe",
          "one click unsubscribe",
          "click here to unsubscribe",
          "click to unsubscribe",
          "cancel email subscription",
          "cancel subscription",
          "darse de baja",
          "aqu\xED",
          "aqui",
          "darme de baja",
          "dar de baja",
          "cancelar suscripcion",
          "cancelar suscripci\xF3n",
          "cancelar mi suscripcion",
          "cancelar mi suscripci\xF3n",
          "cancelar tu suscripcion",
          "cancelar tu suscripci\xF3n",
          "baja de suscripcion",
          "baja de suscripci\xF3n",
          "baja del boletin",
          "baja del bolet\xEDn",
          "desuscribirse",
          "des-suscribirse",
          "desinscribirse",
          "remove me",
          "remove me from this list",
          "remove from mailing list",
          "leave this list",
          "stop emails",
          "stop receiving emails",
          "stop receiving these emails",
          "dejar de recibir",
          "dejar de recibir emails",
          "dejar de recibir correos",
          "no quiero recibir",
          "no recibir emails",
          "no recibir correos",
          "opt out",
          "opt-out",
          "optout",
          "quitarme de la lista"
        ],
        altas: [
          "manage subscriptions",
          "manage subscription",
          "manage email subscriptions",
          "subscription center",
          "subscription centre",
          "subscription preferences",
          "email preferences",
          "email preference center",
          "email preference centre",
          "communication preferences",
          "communications preferences",
          "newsletter preferences",
          "mail preferences",
          "manage your preferences",
          "change your preferences",
          "edit your preferences",
          "preferencias de correo",
          "preferencias de email",
          "preferencias de comunicacion",
          "preferencias de comunicaci\xF3n",
          "centro de preferencias",
          "centro de suscripciones",
          "administrar suscripciones",
          "administrar preferencias",
          "gestionar suscripciones",
          "gestionar preferencias",
          "gestiona tus preferencias",
          "modificar preferencias",
          "actualizar preferencias"
        ],
        medias: [
          "subscription",
          "subscriptions",
          "suscripcion",
          "suscripci\xF3n",
          "newsletter",
          "boletin",
          "bolet\xEDn",
          "mailing list",
          "email list",
          "lista de correo",
          "lista de emails",
          "promotional emails",
          "marketing emails",
          "commercial emails",
          "emails promocionales",
          "correos promocionales",
          "correos comerciales",
          "comunicaciones comerciales"
        ],
        bajas: [
          "preferences",
          "preferencias",
          "profile",
          "perfil",
          "settings",
          "configuracion",
          "configuraci\xF3n",
          "privacy",
          "privacidad",
          "terms",
          "legal"
        ],
        contextoNewsletter: [
          "you are receiving this email",
          "you received this email",
          "received this email because",
          "this email was sent to",
          "sent to this address",
          "recibes este correo",
          "recibiste este correo",
          "has recibido este correo",
          "este email fue enviado",
          "este correo fue enviado",
          "mailing address",
          "newsletter",
          "boletin",
          "bolet\xEDn",
          "campaign",
          "campana",
          "campa\xF1a",
          "email was intended for",
          "correo dirigido a"
        ],
        riesgo: [
          "password",
          "contrasena",
          "contrase\xF1a",
          "security",
          "seguridad",
          "verify account",
          "verificar cuenta",
          "billing",
          "facturacion",
          "facturaci\xF3n",
          "payment",
          "pago",
          "invoice",
          "download attachment",
          "descargar archivo",
          "urgent",
          "urgente",
          "confirm identity",
          "confirmar identidad",
          "bank",
          "banco",
          "wallet",
          "crypto",
          "transfer",
          "wire transfer"
        ],
        cuenta: [
          "delete account",
          "eliminar cuenta",
          "close account",
          "cerrar cuenta",
          "sign out",
          "logout",
          "log out",
          "cerrar sesion",
          "cerrar sesi\xF3n",
          "account settings",
          "configuracion de cuenta",
          "configuraci\xF3n de cuenta",
          "my account",
          "mi cuenta"
        ],
        social: [
          "facebook",
          "twitter",
          "x.com",
          "instagram",
          "linkedin",
          "youtube",
          "tiktok",
          "pinterest",
          "share",
          "compartir",
          "follow us",
          "siguenos",
          "s\xEDguenos"
        ],
        compra: [
          "order",
          "pedido",
          "purchase",
          "compra",
          "shipping",
          "envio",
          "env\xEDo",
          "tracking",
          "rastreo",
          "receipt",
          "recibo",
          "cart",
          "carrito",
          "checkout"
        ],
        verbosParada: [
          "dejar de",
          "parar",
          "cancelar",
          "darse de baja",
          "eliminar",
          "stop",
          "cancel",
          "remove",
          "unsubscribe",
          "no recibir",
          "abandonar",
          "quit",
          "renunciar"
        ],
        sustantivosComunicacion: [
          "e-mails",
          "emails",
          "correos",
          "mensajes",
          "boletin",
          "bolet\xEDn",
          "newsletter",
          "comunicaciones",
          "suscripcion",
          "suscripci\xF3n",
          "lista",
          "list",
          "messages",
          "communications",
          "notificaciones",
          "notifications",
          "avisos"
        ],
        accionesEnlace: [
          "haz clic",
          "clic aqui",
          "clic",
          "click here",
          "aqui",
          "aqu\xED",
          "pulsar",
          "este enlace",
          "this link",
          "pulsa aqui",
          "presiona",
          "ingresa aqui"
        ]
      };
      aprendidas = obtenerFrasesAprendidas();
      if (aprendidas.length > 0) {
        frasesBase.criticas.push(...aprendidas);
      }
      frases = limpiarFrasesRepetidas(frasesBase);
    }
  });

  // src/utils/math.js
  function limitarNumero(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, valor));
  }
  function convertirScoreAProbabilidad(score) {
    return 1 / (1 + Math.exp(-(score - 42) / 16));
  }
  function convertirProbabilidadAPorcentaje(probabilidad) {
    return Math.round(limitarNumero(probabilidad, 0, 1) * 100);
  }
  var init_math = __esm({
    "src/utils/math.js"() {
    }
  });

  // src/core/evaluator.js
  function crearResultado(elemento, score, razones) {
    const probabilidad = convertirScoreAProbabilidad(score);
    return {
      elemento,
      score,
      probabilidad,
      porcentaje: convertirProbabilidadAPorcentaje(probabilidad),
      razones,
      texto: obtenerTextoPropio(elemento).slice(0, 180),
      href: obtenerHrefAbsoluto(elemento)
    };
  }
  function evaluarElemento(elemento) {
    if (!elementoEsVisible(elemento)) {
      return crearResultado(
        elemento,
        configuracion.pesos.penalizacionOculto,
        ["Elemento no visible"]
      );
    }
    const textoPropio = obtenerTextoPropio(elemento);
    const contexto = obtenerContextoCercano(elemento);
    const href = normalizarTexto(
      obtenerHrefAbsoluto(elemento)
    );
    const atributos = normalizarTexto(
      obtenerTextoDeAtributos(elemento)
    );
    const textoCompleto = normalizarTexto(
      `${textoPropio} ${href} ${contexto}`
    );
    if (esBotonNativoDeCorreo(elemento)) {
      return crearResultado(elemento, configuracion.pesos.botonNativoCorreo, ["Bot\xF3n nativo inyectado por el cliente de correo"]);
    }
    if (textoPropio.length < 2 && href.length < 5) {
      return crearResultado(elemento, 0, ["Sin texto ni enlace \xFAtil"]);
    }
    let score = 0;
    const razones = [];
    const distanciaIntencion = calcularDistanciaSemantica(textoCompleto, frases.verbosParada, frases.accionesEnlace);
    if (distanciaIntencion <= 20 && contarCoincidencias(textoCompleto, frases.sustantivosComunicacion) > 0) {
      score += configuracion.pesos.proximidadSemanticaEstricta;
      razones.push("Proximidad NLP: Intenci\xF3n de baja muy cerca de acci\xF3n de enlace");
    } else if (contarCoincidencias(textoCompleto, frases.verbosParada) > 0 && contarCoincidencias(textoCompleto, frases.sustantivosComunicacion) > 0 && contarCoincidencias(textoCompleto, frases.accionesEnlace) > 0) {
      score += configuracion.pesos.deteccionAlgoritmicaContextual;
      razones.push("Detecci\xF3n algor\xEDtmica: Intenci\xF3n de parada + Comunicaci\xF3n + Enlace");
    }
    const huellaVisual = obtenerHuellaVisual(elemento);
    if (huellaVisual.esPequeno || huellaVisual.esSemiOculto) {
      score += configuracion.pesos.huellaVisualDiscreta;
      razones.push("Estilometr\xEDa: Huella visual de baja (texto peque\xF1o o difuminado)");
    }
    if (elementoCercaDePixelRastreo(elemento)) {
      score += configuracion.pesos.cercaniaPixelRastreo;
      razones.push("Topolog\xEDa: Enlace cercano a p\xEDxel de rastreo o baliza");
    }
    const fraseCritica = encontrarMejorFrase(textoCompleto, frases.criticas);
    const fraseAlta = encontrarMejorFrase(textoCompleto, frases.altas);
    const fraseMedia = encontrarMejorFrase(textoCompleto, frases.medias);
    const fraseBaja = encontrarMejorFrase(textoCompleto, frases.bajas);
    if (fraseCritica) {
      score += configuracion.pesos.fraseCritica;
      razones.push(`Frase cr\xEDtica: ${fraseCritica}`);
    }
    if (fraseAlta) {
      score += configuracion.pesos.fraseAlta;
      razones.push(`Frase alta: ${fraseAlta}`);
    }
    if (fraseMedia) {
      score += configuracion.pesos.fraseMedia;
      razones.push(`Frase media: ${fraseMedia}`);
    }
    if (fraseBaja) {
      score += configuracion.pesos.fraseBaja;
      razones.push(`Frase baja: ${fraseBaja}`);
    }
    if (patronHrefBaja.test(href)) {
      score += configuracion.pesos.hrefCritico;
      razones.push("URL compatible con baja");
    }
    if (patronDominioMarketing.test(href)) {
      score += configuracion.pesos.dominioMarketing;
      razones.push("Servicio t\xEDpico de email marketing");
    }
    if (contarCoincidencias(atributos, frases.criticas) > 0) {
      score += configuracion.pesos.atributoFuerte;
      razones.push("Atributo HTML fuerte");
    } else if (contarCoincidencias(atributos, frases.altas) > 0) {
      score += configuracion.pesos.atributoMedio;
      razones.push("Atributo HTML medio");
    }
    if (elementoPareceEstarEnFooter(elemento)) {
      score += configuracion.pesos.contextoFooter;
      razones.push("Ubicaci\xF3n de footer o zona legal");
    }
    if (contarCoincidencias(contexto, frases.altas) > 0) {
      score += configuracion.pesos.contextoPreferencias;
      razones.push("Contexto de preferencias");
    }
    if (contarCoincidencias(contexto, frases.contextoNewsletter) > 0) {
      score += configuracion.pesos.contextoNewsletter;
      razones.push("Contexto t\xEDpico de newsletter");
    }
    if (elemento.tagName === "A") {
      score += configuracion.pesos.esEnlace;
      razones.push("Es un enlace");
    }
    if (elemento.tagName === "BUTTON" || /button|submit/i.test(elemento.getAttribute?.("type") || "")) {
      score += configuracion.pesos.esBoton;
      razones.push("Es un bot\xF3n");
    }
    if (elementoTieneAccionDirecta(elemento)) {
      score += configuracion.pesos.esAccionable;
      razones.push("Tiene acci\xF3n directa");
    }
    const rectangulo = elemento.getBoundingClientRect();
    if (rectangulo.width <= 480 && rectangulo.height <= 110) {
      score += configuracion.pesos.elementoCompacto;
      razones.push("Elemento compacto");
    }
    if (/newsletter|campaign|email|mailing|suscripcion/.test(contexto) && /unsubscribe|baja|opt|prefer|desuscrib/.test(textoCompleto)) {
      score += configuracion.pesos.coherenciaNewsletterBaja;
      razones.push("Coherencia entre newsletter y baja");
    }
    const similitudDifusa = calcularCoincidenciaDifusa(`${textoPropio} ${href}`);
    if (similitudDifusa >= 0.78) {
      const bonificacion = Math.round(
        configuracion.pesos.coincidenciaDifusa * similitudDifusa
      );
      score += bonificacion;
      razones.push(`Coincidencia difusa ${Math.round(similitudDifusa * 100)}%`);
    }
    const palabrasCandidato = dividirEnPalabras(`${textoPropio} ${href}`);
    const palabrasObjetivo = dividirEnPalabras(
      "unsubscribe opt out remove me stop emails darse de baja dejar de recibir cancelar suscripcion email preferences manage subscriptions newsletter boletin"
    );
    const similitudJaccard = calcularSimilitudJaccard(palabrasCandidato, palabrasObjetivo);
    if (similitudJaccard > 0.08) {
      const bonificacion = Math.round(similitudJaccard * 45);
      score += bonificacion;
      razones.push(`Similitud de palabras +${bonificacion}`);
    }
    if (contarCoincidencias(textoCompleto, frases.riesgo) > 0) {
      score += configuracion.pesos.penalizacionRiesgo;
      razones.push("Penalizaci\xF3n por t\xE9rminos sensibles");
    }
    if (contarCoincidencias(textoCompleto, frases.cuenta) > 0) {
      score += configuracion.pesos.penalizacionCuenta;
      razones.push("Penalizaci\xF3n por acci\xF3n de cuenta");
    }
    if (contarCoincidencias(textoCompleto, frases.social) > 0 && !fraseCritica && !fraseAlta) {
      score += configuracion.pesos.penalizacionSocial;
      razones.push("Penalizaci\xF3n por enlace social");
    }
    if (contarCoincidencias(textoCompleto, frases.compra) > 0 && !fraseCritica) {
      score += configuracion.pesos.penalizacionCompra;
      razones.push("Penalizaci\xF3n por compra o pedido");
    }
    if (textoPropio.length > 700 && !fraseCritica) {
      score += configuracion.pesos.penalizacionTextoLargo;
      razones.push("Texto propio demasiado largo");
    }
    return crearResultado(elemento, score, razones);
  }
  function resultadoSigueSiendoValido(resultado) {
    return Boolean(
      resultado?.elemento && resultado.elemento.isConnected && elementoEsVisible(resultado.elemento)
    );
  }
  function buscarMejorResultado() {
    if (estado.buscando) {
      return estado.ultimoResultado;
    }
    estado.buscando = true;
    limpiarCacheContexto();
    try {
      const resultados = [];
      let raicesEncontradas = 0;
      for (const documentoActual of obtenerDocumentosExplorables()) {
        const raices = obtenerRaicesDeBusqueda(documentoActual);
        raicesEncontradas += raices.length;
        for (const raiz of raices) {
          for (const candidato of obtenerCandidatos(raiz)) {
            const resultado = evaluarElemento(candidato);
            if (resultado.probabilidad >= 0.25 || resultado.score > 20) {
              resultados.push(resultado);
            }
          }
        }
      }
      resultados.sort((resultadoA, resultadoB) => {
        return resultadoB.score - resultadoA.score || resultadoB.probabilidad - resultadoA.probabilidad;
      });
      if (configuracion.modoDebug) {
        console.group("[Email Smart Unsubscribe] Diagn\xF3stico");
        console.log("Ra\xEDces encontradas:", raicesEncontradas);
        console.table(
          resultados.slice(0, 10).map((resultado) => ({
            porcentaje: resultado.porcentaje,
            score: resultado.score,
            texto: resultado.texto,
            href: resultado.href,
            razones: resultado.razones.join(" | ")
          }))
        );
        console.groupEnd();
      }
      const mejorResultado = resultados[0] || null;
      if (!mejorResultado || mejorResultado.probabilidad < configuracion.umbralMostrar) {
        actualizarPanelDiagnostico(raicesEncontradas, resultados, null);
        return null;
      }
      actualizarPanelDiagnostico(raicesEncontradas, resultados, mejorResultado);
      return mejorResultado;
    } finally {
      estado.buscando = false;
    }
  }
  var init_evaluator = __esm({
    "src/core/evaluator.js"() {
      init_state();
      init_constants();
      init_phrases();
      init_string();
      init_math();
      init_dom();
      init_scanner();
      init_interface();
    }
  });

  // src/core/action.js
  function esProtocoloSeguro(url) {
    try {
      const destino = new URL(url, location.href);
      return [
        "http:",
        "https:"
      ].includes(destino.protocol);
    } catch {
      return false;
    }
  }
  function ejecutarElementoAccionable(elemento) {
    if (!resultadoSigueSiendoValido({ elemento })) {
      throw new Error("El enlace ya no pertenece al correo visible.");
    }
    const href = obtenerHrefAbsoluto(elemento);
    if (href && !esProtocoloSeguro(href)) {
      throw new Error("El enlace utiliza un protocolo no permitido.");
    }
    const evento = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      button: 0
    });
    const eventoAceptado = elemento.dispatchEvent(evento);
    if (eventoAceptado && elemento.tagName !== "A" && typeof elemento.click === "function") {
      elemento.click();
    }
  }
  async function manejarClickPrincipal() {
    const resultado = estado.ultimoResultado;
    if (estado.bloqueado || !resultadoSigueSiendoValido(resultado)) {
      estado.ultimoResultado = null;
      actualizarBotonPrincipal();
      notificar(
        "El correo cambi\xF3. Se actualiz\xF3 la detecci\xF3n.",
        configuracion.colores.advertencia
      );
      return;
    }
    const confirmarAccion = window.confirm(
      [
        "Se abrir\xE1 el enlace de cancelaci\xF3n detectado.",
        "",
        `Confianza estimada: ${resultado.porcentaje}%`,
        "",
        "El sitio de destino podr\xEDa solicitar una confirmaci\xF3n adicional.",
        "",
        "\xBFDeseas continuar?"
      ].join("\n")
    );
    if (!confirmarAccion) {
      return;
    }
    estado.bloqueado = true;
    actualizarEstadoProcesando(true);
    try {
      ejecutarElementoAccionable(resultado.elemento);
      const textoOriginal = resultado.elemento.innerText || resultado.elemento.textContent || "";
      if (textoOriginal) {
        aprenderNuevaFrase(textoOriginal);
      }
      notificar(
        `Enlace de baja abierto. Confianza: ${resultado.porcentaje}%`,
        configuracion.colores.exito
      );
    } catch (error) {
      console.error("[Email Smart Unsubscribe] Error:", error);
      notificar(
        error instanceof Error ? error.message : "No se pudo abrir el enlace de baja.",
        configuracion.colores.peligro
      );
    } finally {
      window.setTimeout(() => {
        estado.bloqueado = false;
        actualizarEstadoProcesando(false);
      }, configuracion.bloqueoMs);
    }
  }
  var init_action = __esm({
    "src/core/action.js"() {
      init_state();
      init_constants();
      init_interface();
      init_dom();
      init_evaluator();
      init_button();
      init_learning();
    }
  });

  // src/ui/button.js
  function crearBotonPrincipal() {
    const raiz = crearInterfaz();
    if (estado.botonPrincipal?.isConnected) {
      return estado.botonPrincipal;
    }
    const boton = document.createElement("button");
    boton.id = IDENTIFICADORES.boton;
    boton.type = "button";
    boton.textContent = "Desuscribir";
    boton.setAttribute("aria-label", "Buscar y abrir el enlace para cancelar la suscripci\xF3n");
    boton.addEventListener("click", manejarClickPrincipal);
    raiz.appendChild(boton);
    estado.botonPrincipal = boton;
    return boton;
  }
  function ocultarBotonPrincipal() {
    const boton = crearBotonPrincipal();
    boton.style.display = "none";
    boton.disabled = false;
    boton.removeAttribute("title");
  }
  function actualizarBotonPrincipal() {
    const boton = crearBotonPrincipal();
    const firmaActual = obtenerFirmaVistaActual();
    if (firmaActual !== estado.ultimaFirmaVista) {
      estado.ultimoResultado = null;
      estado.ultimaFirmaVista = firmaActual;
    }
    const resultado = buscarMejorResultado();
    estado.ultimoResultado = resultado;
    if (!resultado || !resultadoSigueSiendoValido(resultado)) {
      estado.ultimoResultado = null;
      ocultarBotonPrincipal();
      return;
    }
    const confianzaAlta = resultado.probabilidad >= configuracion.umbralAltaConfianza;
    boton.style.display = "block";
    boton.style.background = confianzaAlta ? configuracion.colores.exito : configuracion.colores.primario;
    boton.disabled = false;
    boton.textContent = confianzaAlta ? `Desuscribir \xB7 ${resultado.porcentaje}%` : `Posible baja \xB7 ${resultado.porcentaje}%`;
    boton.title = [
      `Probabilidad estimada: ${resultado.porcentaje}%`,
      `Puntuaci\xF3n: ${resultado.score}`,
      `Razones: ${resultado.razones.join(" | ")}`,
      resultado.href ? `Destino: ${resultado.href}` : ""
    ].filter(Boolean).join("\n");
  }
  function actualizarEstadoProcesando(estaProcesando) {
    const boton = crearBotonPrincipal();
    if (estaProcesando) {
      boton.textContent = "Procesando...";
      boton.disabled = true;
      boton.style.background = configuracion.colores.advertencia;
      return;
    }
    boton.disabled = false;
    actualizarBotonPrincipal();
  }
  var init_button = __esm({
    "src/ui/button.js"() {
      init_state();
      init_constants();
      init_interface();
      init_action();
      init_scanner();
      init_evaluator();
    }
  });

  // src/index.js
  var require_index = __commonJS({
    "src/index.js"() {
      init_state();
      init_constants();
      init_interface();
      init_button();
      (function() {
        "use strict";
        function mutacionPerteneceAlScript(mutacion) {
          const objetivo = mutacion.target;
          if (objetivo instanceof Element && objetivo.closest(`#${IDENTIFICADORES.anfitrion}`)) {
            return true;
          }
          for (const nodo of mutacion.addedNodes) {
            if (nodo === estado.anfitrionInterfaz || nodo instanceof Element && nodo.id === IDENTIFICADORES.anfitrion) {
              return true;
            }
          }
          return false;
        }
        function programarActualizacion() {
          window.clearTimeout(estado.timeoutBusqueda);
          estado.timeoutBusqueda = window.setTimeout(
            actualizarBotonPrincipal,
            configuracion.retrasoBusquedaMs
          );
        }
        function iniciarObservadorDOM() {
          if (!document.body) {
            return;
          }
          estado.observador?.disconnect();
          estado.observador = new MutationObserver((mutaciones) => {
            const hayCambioExterno = mutaciones.some(
              (mutacion) => !mutacionPerteneceAlScript(mutacion)
            );
            if (hayCambioExterno) {
              programarActualizacion();
            }
          });
          estado.observador.observe(document.body, {
            childList: true,
            subtree: true
          });
        }
        function observarCambiosDeRuta() {
          const programarPorRuta = () => {
            estado.ultimoResultado = null;
            ocultarBotonPrincipal();
            programarActualizacion();
          };
          window.addEventListener("hashchange", programarPorRuta);
          window.addEventListener("popstate", programarPorRuta);
          const historyPushState = history.pushState;
          const historyReplaceState = history.replaceState;
          history.pushState = function(...argumentos) {
            const resultado = historyPushState.apply(this, argumentos);
            programarPorRuta();
            return resultado;
          };
          history.replaceState = function(...argumentos) {
            const resultado = historyReplaceState.apply(this, argumentos);
            programarPorRuta();
            return resultado;
          };
        }
        function iniciarScript() {
          if (!document.body || !document.documentElement) {
            window.setTimeout(iniciarScript, 250);
            return;
          }
          crearInterfaz();
          crearBotonPrincipal();
          iniciarObservadorDOM();
          observarCambiosDeRuta();
          window.setTimeout(
            actualizarBotonPrincipal,
            configuracion.retrasoInicioMs
          );
        }
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", iniciarScript, { once: true });
        } else {
          iniciarScript();
        }
      })();
    }
  });
  require_index();
})();
