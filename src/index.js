
import { estado } from './config/state.js';
import { IDENTIFICADORES, configuracion } from './config/constants.js';
import { crearInterfaz } from './ui/interface.js';
import { crearBotonPrincipal, actualizarBotonPrincipal, ocultarBotonPrincipal } from './ui/button.js';

(function () {
    'use strict';

    function mutacionPerteneceAlScript(mutacion) {
        const objetivo = mutacion.target;

        if (
            objetivo instanceof Element &&
            objetivo.closest(`#${IDENTIFICADORES.anfitrion}`)
        ) {
            return true;
        }

        for (const nodo of mutacion.addedNodes) {
            if (
                nodo === estado.anfitrionInterfaz ||
                (nodo instanceof Element && nodo.id === IDENTIFICADORES.anfitrion)
            ) {
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

        estado.observador = new MutationObserver(mutaciones => {
            const hayCambioExterno = mutaciones.some(
                mutacion => !mutacionPerteneceAlScript(mutacion)
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

        window.addEventListener('hashchange', programarPorRuta);
        window.addEventListener('popstate', programarPorRuta);

        const historyPushState = history.pushState;
        const historyReplaceState = history.replaceState;

        history.pushState = function (...argumentos) {
            const resultado = historyPushState.apply(this, argumentos);
            programarPorRuta();
            return resultado;
        };

        history.replaceState = function (...argumentos) {
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarScript, { once: true });
    } else {
        iniciarScript();
    }
})();
