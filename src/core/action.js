import { estado } from '../config/state.js';
import { configuracion } from '../config/constants.js';
import { notificar } from '../ui/interface.js';
import { obtenerHrefAbsoluto } from '../utils/dom.js';
import { resultadoSigueSiendoValido } from './evaluator.js';
import { actualizarBotonPrincipal, actualizarEstadoProcesando } from '../ui/button.js';
import { aprenderNuevaFrase } from './learning.js';

export function esProtocoloSeguro(url) {
    try {
        const destino = new URL(url, location.href);

        return [
            'http:',
            'https:'
        ].includes(destino.protocol);
    } catch {
        return false;
    }
}

export function ejecutarElementoAccionable(elemento) {
    if (!resultadoSigueSiendoValido({ elemento })) {
        throw new Error('El enlace ya no pertenece al correo visible.');
    }

    const href = obtenerHrefAbsoluto(elemento);

    if (href && !esProtocoloSeguro(href)) {
        throw new Error('El enlace utiliza un protocolo no permitido.');
    }

    const evento = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
        button: 0
    });

    const eventoAceptado = elemento.dispatchEvent(evento);

    if (
        eventoAceptado &&
        elemento.tagName !== 'A' &&
        typeof elemento.click === 'function'
    ) {
        elemento.click();
    }
}

export async function manejarClickPrincipal() {
    const resultado = estado.ultimoResultado;

    if (estado.bloqueado || !resultadoSigueSiendoValido(resultado)) {
        estado.ultimoResultado = null;
        actualizarBotonPrincipal();

        notificar(
            'El correo cambió. Se actualizó la detección.',
            configuracion.colores.advertencia
        );

        return;
    }

    const confirmarAccion = window.confirm(
        [
            'Se abrirá el enlace de cancelación detectado.',
            '',
            `Confianza estimada: ${resultado.porcentaje}%`,
            '',
            'El sitio de destino podría solicitar una confirmación adicional.',
            '',
            '¿Deseas continuar?'
        ].join('\n')
    );

    if (!confirmarAccion) {
        return;
    }

    estado.bloqueado = true;
    actualizarEstadoProcesando(true);

    try {
        ejecutarElementoAccionable(resultado.elemento);

        // Auto-aprendizaje: memorizar el texto original del enlace para futuras detecciones
        const textoOriginal = resultado.elemento.innerText || resultado.elemento.textContent || '';
        if (textoOriginal) {
            aprenderNuevaFrase(textoOriginal);
        }

        notificar(
            `Enlace de baja abierto. Confianza: ${resultado.porcentaje}%`,
            configuracion.colores.exito
        );
    } catch (error) {
        console.error('[Email Smart Unsubscribe] Error:', error);

        notificar(
            error instanceof Error ? error.message : 'No se pudo abrir el enlace de baja.',
            configuracion.colores.peligro
        );
    } finally {
        window.setTimeout(() => {
            estado.bloqueado = false;
            actualizarEstadoProcesando(false);
        }, configuracion.bloqueoMs);
    }
}
