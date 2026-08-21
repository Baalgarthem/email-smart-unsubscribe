import { estado } from '../config/state.js';
import { configuracion, patronHrefBaja, patronDominioMarketing } from '../config/constants.js';
import { frases } from '../config/phrases.js';
import { normalizarTexto, dividirEnPalabras, encontrarMejorFrase, contarCoincidencias, calcularCoincidenciaDifusa, calcularSimilitudJaccard, calcularDistanciaSemantica } from '../utils/string.js';
import { convertirScoreAProbabilidad, convertirProbabilidadAPorcentaje } from '../utils/math.js';
import { elementoEsVisible, obtenerTextoPropio, obtenerContextoCercano, obtenerHrefAbsoluto, obtenerTextoDeAtributos, elementoPareceEstarEnFooter, elementoTieneAccionDirecta, limpiarCacheContexto, obtenerHuellaVisual, elementoCercaDePixelRastreo, esBotonNativoDeCorreo } from '../utils/dom.js';
import { obtenerDocumentosExplorables, obtenerRaicesDeBusqueda, obtenerCandidatos } from './scanner.js';
import { actualizarPanelDiagnostico } from '../ui/interface.js';

export function crearResultado(elemento, score, razones) {
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

export function evaluarElemento(elemento) {
    if (!elementoEsVisible(elemento)) {
        return crearResultado(
            elemento,
            configuracion.pesos.penalizacionOculto,
            ['Elemento no visible']
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
        return crearResultado(elemento, configuracion.pesos.botonNativoCorreo, ['Botón nativo inyectado por el cliente de correo']);
    }

    if (textoPropio.length < 2 && href.length < 5) {
        return crearResultado(elemento, 0, ['Sin texto ni enlace útil']);
    }

    let score = 0;
    const razones = [];

    // Análisis NLP y Semántico Avanzado
    const distanciaIntencion = calcularDistanciaSemantica(textoCompleto, frases.verbosParada, frases.accionesEnlace);
    if (distanciaIntencion <= 20 && contarCoincidencias(textoCompleto, frases.sustantivosComunicacion) > 0) {
        score += configuracion.pesos.proximidadSemanticaEstricta;
        razones.push('Proximidad NLP: Intención de baja muy cerca de acción de enlace');
    } else if (
        contarCoincidencias(textoCompleto, frases.verbosParada) > 0 &&
        contarCoincidencias(textoCompleto, frases.sustantivosComunicacion) > 0 &&
        contarCoincidencias(textoCompleto, frases.accionesEnlace) > 0
    ) {
        score += configuracion.pesos.deteccionAlgoritmicaContextual;
        razones.push('Detección algorítmica: Intención de parada + Comunicación + Enlace');
    }

    // Análisis Topológico y Visual (Estilometría)
    const huellaVisual = obtenerHuellaVisual(elemento);
    if (huellaVisual.esPequeno || huellaVisual.esSemiOculto) {
        score += configuracion.pesos.huellaVisualDiscreta;
        razones.push('Estilometría: Huella visual de baja (texto pequeño o difuminado)');
    }

    if (elementoCercaDePixelRastreo(elemento)) {
        score += configuracion.pesos.cercaniaPixelRastreo;
        razones.push('Topología: Enlace cercano a píxel de rastreo o baliza');
    }

    const fraseCritica = encontrarMejorFrase(textoCompleto, frases.criticas);
    const fraseAlta = encontrarMejorFrase(textoCompleto, frases.altas);
    const fraseMedia = encontrarMejorFrase(textoCompleto, frases.medias);
    const fraseBaja = encontrarMejorFrase(textoCompleto, frases.bajas);

    if (fraseCritica) {
        score += configuracion.pesos.fraseCritica;
        razones.push(`Frase crítica: ${fraseCritica}`);
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
        razones.push('URL compatible con baja');
    }

    if (patronDominioMarketing.test(href)) {
        score += configuracion.pesos.dominioMarketing;
        razones.push('Servicio típico de email marketing');
    }

    if (contarCoincidencias(atributos, frases.criticas) > 0) {
        score += configuracion.pesos.atributoFuerte;
        razones.push('Atributo HTML fuerte');
    } else if (
        contarCoincidencias(atributos, frases.altas) > 0
    ) {
        score += configuracion.pesos.atributoMedio;
        razones.push('Atributo HTML medio');
    }

    if (elementoPareceEstarEnFooter(elemento)) {
        score += configuracion.pesos.contextoFooter;
        razones.push('Ubicación de footer o zona legal');
    }

    if (contarCoincidencias(contexto, frases.altas) > 0) {
        score += configuracion.pesos.contextoPreferencias;
        razones.push('Contexto de preferencias');
    }

    if (
        contarCoincidencias(contexto, frases.contextoNewsletter) > 0
    ) {
        score += configuracion.pesos.contextoNewsletter;
        razones.push('Contexto típico de newsletter');
    }

    if (elemento.tagName === 'A') {
        score += configuracion.pesos.esEnlace;
        razones.push('Es un enlace');
    }

    if (
        elemento.tagName === 'BUTTON' ||
        /button|submit/i.test(elemento.getAttribute?.('type') || '')
    ) {
        score += configuracion.pesos.esBoton;
        razones.push('Es un botón');
    }

    if (elementoTieneAccionDirecta(elemento)) {
        score += configuracion.pesos.esAccionable;
        razones.push('Tiene acción directa');
    }

    const rectangulo = elemento.getBoundingClientRect();

    if (rectangulo.width <= 480 && rectangulo.height <= 110) {
        score += configuracion.pesos.elementoCompacto;
        razones.push('Elemento compacto');
    }

    if (
        /newsletter|campaign|email|mailing|suscripcion/.test(contexto) &&
        /unsubscribe|baja|opt|prefer|desuscrib/.test(textoCompleto)
    ) {
        score += configuracion.pesos.coherenciaNewsletterBaja;
        razones.push('Coherencia entre newsletter y baja');
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
        'unsubscribe opt out remove me stop emails ' +
        'darse de baja dejar de recibir cancelar suscripcion ' +
        'email preferences manage subscriptions newsletter boletin'
    );

    const similitudJaccard = calcularSimilitudJaccard(palabrasCandidato, palabrasObjetivo);

    if (similitudJaccard > 0.08) {
        const bonificacion = Math.round(similitudJaccard * 45);

        score += bonificacion;
        razones.push(`Similitud de palabras +${bonificacion}`);
    }

    if (contarCoincidencias(textoCompleto, frases.riesgo) > 0) {
        score += configuracion.pesos.penalizacionRiesgo;
        razones.push('Penalización por términos sensibles');
    }

    if (contarCoincidencias(textoCompleto, frases.cuenta) > 0) {
        score += configuracion.pesos.penalizacionCuenta;
        razones.push('Penalización por acción de cuenta');
    }

    if (
        contarCoincidencias(textoCompleto, frases.social) > 0 &&
        !fraseCritica && !fraseAlta
    ) {
        score += configuracion.pesos.penalizacionSocial;
        razones.push('Penalización por enlace social');
    }

    if (
        contarCoincidencias(textoCompleto, frases.compra) > 0 &&
        !fraseCritica
    ) {
        score += configuracion.pesos.penalizacionCompra;
        razones.push('Penalización por compra o pedido');
    }

    if (textoPropio.length > 700 && !fraseCritica) {
        score += configuracion.pesos.penalizacionTextoLargo;
        razones.push('Texto propio demasiado largo');
    }

    return crearResultado(elemento, score, razones);
}

export function resultadoSigueSiendoValido(resultado) {
    return Boolean(
        resultado?.elemento &&
        resultado.elemento.isConnected &&
        elementoEsVisible(resultado.elemento)
    );
}

export function buscarMejorResultado() {
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

                    if (
                        resultado.probabilidad >= 0.25 ||
                        resultado.score > 20
                    ) {
                        resultados.push(resultado);
                    }
                }
            }
        }

        resultados.sort((resultadoA, resultadoB) => {
            return (
                resultadoB.score - resultadoA.score ||
                resultadoB.probabilidad - resultadoA.probabilidad
            );
        });

        if (configuracion.modoDebug) {
            console.group('[Email Smart Unsubscribe] Diagnóstico');
            console.log('Raíces encontradas:', raicesEncontradas);
            console.table(
                resultados.slice(0, 10).map(resultado => ({
                    porcentaje: resultado.porcentaje,
                    score: resultado.score,
                    texto: resultado.texto,
                    href: resultado.href,
                    razones: resultado.razones.join(' | ')
                }))
            );
            console.groupEnd();
        }

        const mejorResultado = resultados[0] || null;

        if (
            !mejorResultado ||
            mejorResultado.probabilidad < configuracion.umbralMostrar
        ) {
            actualizarPanelDiagnostico(raicesEncontradas, resultados, null);
            return null;
        }

        actualizarPanelDiagnostico(raicesEncontradas, resultados, mejorResultado);
        return mejorResultado;
    } finally {
        estado.buscando = false;
    }
}
