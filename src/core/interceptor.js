import { evaluarElemento } from './evaluator.js';
import { configuracion } from '../config/constants.js';
import { notificar } from '../ui/interface.js';
import { aprenderNuevaFrase } from './learning.js';
import { ejecutarElementoAccionable } from './action.js';

let interceptorActivo = false;

function manejarClicGlobal(evento) {
    const enlace = evento.target.closest('a');
    if (!enlace) return;

    const cuerpoCorreo = enlace.closest('.a3s, [role="main"], .allowTextSelection');
    if (!cuerpoCorreo) return;

    const resultado = evaluarElemento(enlace);

    if (resultado.probabilidad > 0.25 && resultado.probabilidad < configuracion.umbralMostrar) {
        evento.preventDefault();
        evento.stopPropagation();

        const textoEnlace = (enlace.innerText || enlace.textContent || '').trim();

        const confirmar = window.confirm(
            [
                'ESCUDO PASIVO DE SMART UNSUBSCRIBE',
                '',
                'Has hecho clic en un enlace dudoso que podría ser de desuscripción.',
                `Texto: "${textoEnlace}"`,
                `Confianza heurística: ${Math.round(resultado.probabilidad * 100)}%`,
                '',
                '¿Quieres que proceda como una cancelación de suscripción y aprenda de él?'
            ].join('\n')
        );

        if (confirmar) {
            if (textoEnlace) {
                aprenderNuevaFrase(textoEnlace);
                notificar(`Aprendido: "${textoEnlace}"`, configuracion.colores.exito);
            }
            try {
                ejecutarElementoAccionable(enlace);
            } catch (error) {
                notificar('Error al procesar el enlace.', configuracion.colores.peligro);
            }
        } else {
            const confirmacionNavegacion = window.confirm('¿Deseas visitar este enlace de forma normal?');
            if (confirmacionNavegacion) {
                window.open(enlace.href, enlace.target || '_self');
            }
        }
    } else if (resultado.probabilidad >= configuracion.umbralMostrar) {
        const textoEnlace = (enlace.innerText || enlace.textContent || '').trim();
        if (textoEnlace) {
            aprenderNuevaFrase(textoEnlace);
        }
    }
}

export function iniciarInterceptor() {
    if (interceptorActivo) return;
    document.addEventListener('click', manejarClicGlobal, true);
    interceptorActivo = true;
    console.log('[Email Smart Unsubscribe] Escudo Pasivo interceptor inicializado.');
}
