import { estado } from '../config/state.js';
import { IDENTIFICADORES, configuracion } from '../config/constants.js';
import { crearInterfaz } from './interface.js';
import { manejarClickPrincipal } from '../core/action.js';
import { obtenerFirmaVistaActual } from '../core/scanner.js';
import { buscarMejorResultado, resultadoSigueSiendoValido } from '../core/evaluator.js';

export function crearBotonPrincipal() {
    const raiz = crearInterfaz();

    if (estado.botonPrincipal?.isConnected) {
        return estado.botonPrincipal;
    }

    const boton = document.createElement('button');
    boton.id = IDENTIFICADORES.boton;
    boton.type = 'button';
    boton.textContent = 'Desuscribir';
    boton.setAttribute('aria-label', 'Buscar y abrir el enlace para cancelar la suscripción');

    boton.addEventListener('click', manejarClickPrincipal);

    raiz.appendChild(boton);
    estado.botonPrincipal = boton;

    return boton;
}

export function ocultarBotonPrincipal() {
    const boton = crearBotonPrincipal();

    boton.style.display = 'none';
    boton.disabled = false;
    boton.removeAttribute('title');
}

export function actualizarBotonPrincipal() {
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

    boton.style.display = 'block';
    boton.style.background = confianzaAlta
        ? configuracion.colores.exito
        : configuracion.colores.primario;

    boton.disabled = false;
    boton.textContent = confianzaAlta
        ? `Desuscribir · ${resultado.porcentaje}%`
        : `Posible baja · ${resultado.porcentaje}%`;

    boton.title = [
        `Probabilidad estimada: ${resultado.porcentaje}%`,
        `Puntuación: ${resultado.score}`,
        `Razones: ${resultado.razones.join(' | ')}`,
        resultado.href ? `Destino: ${resultado.href}` : ''
    ].filter(Boolean).join('\n');
}

export function actualizarEstadoProcesando(estaProcesando) {
    const boton = crearBotonPrincipal();

    if (estaProcesando) {
        boton.textContent = 'Procesando...';
        boton.disabled = true;
        boton.style.background = configuracion.colores.advertencia;
        return;
    }

    boton.disabled = false;
    actualizarBotonPrincipal();
}
