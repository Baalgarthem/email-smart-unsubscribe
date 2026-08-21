import { estado } from '../config/state.js';
import { IDENTIFICADORES, configuracion } from '../config/constants.js';
import { esGmailActual, esOutlookActual } from '../core/scanner.js';

export function crearInterfaz() {
    if (
        estado.raizInterfaz &&
        estado.anfitrionInterfaz?.isConnected
    ) {
        return estado.raizInterfaz;
    }

    document.getElementById(IDENTIFICADORES.anfitrion)?.remove();

    const anfitrion = document.createElement('div');
    anfitrion.id = IDENTIFICADORES.anfitrion;

    Object.assign(anfitrion.style, {
        all: 'initial',
        position: 'fixed',
        inset: '0',
        width: '0',
        height: '0',
        zIndex: '2147483647',
        pointerEvents: 'none'
    });

    document.documentElement.appendChild(anfitrion);

    const raiz = anfitrion.attachShadow({ mode: 'open' });
    const estilos = document.createElement('style');

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

export function crearAviso() {
    const raiz = crearInterfaz();

    estado.raizInterfaz?.getElementById(IDENTIFICADORES.aviso)?.remove();

    const aviso = document.createElement('div');
    aviso.id = IDENTIFICADORES.aviso;

    raiz.appendChild(aviso);
    return aviso;
}

export function notificar(mensaje, color = configuracion.colores.peligro) {
    const aviso = crearAviso();

    aviso.textContent = mensaje;
    aviso.style.background = color;

    window.setTimeout(() => {
        aviso.remove();
    }, 3800);
}

export function actualizarPanelDiagnostico(cantidadRaices, resultados, mejorResultado) {
    if (!configuracion.mostrarPanelDiagnostico) {
        estado.panelDiagnostico?.remove();
        estado.panelDiagnostico = null;
        return;
    }

    const raiz = crearInterfaz();

    if (!estado.panelDiagnostico?.isConnected) {
        const panel = document.createElement('div');
        panel.id = IDENTIFICADORES.panel;

        raiz.appendChild(panel);
        estado.panelDiagnostico = panel;
    }

    const panel = estado.panelDiagnostico;
    panel.style.display = 'block';
    panel.replaceChildren();

    const titulo = document.createElement('strong');
    titulo.textContent = 'Email Smart Unsubscribe';

    const resumen = document.createElement('div');
    resumen.style.marginTop = '6px';
    resumen.style.color = '#c8d0d8';
    resumen.textContent = [
        `Proveedor: ${esGmailActual() ? 'Gmail' : esOutlookActual() ? 'Outlook' : location.hostname}`,
        `Raíces: ${cantidadRaices}`,
        `Candidatos: ${resultados.length}`,
        `Resultado: ${mejorResultado ? `${mejorResultado.porcentaje}%` : 'sin coincidencia'}`
    ].join(' · ');

    panel.append(titulo, resumen);

    if (mejorResultado) {
        const detalles = document.createElement('pre');
        detalles.textContent = [
            `Texto: ${mejorResultado.texto}`,
            `URL: ${mejorResultado.href || 'sin URL'}`,
            `Score: ${mejorResultado.score}`,
            '',
            ...mejorResultado.razones
        ].join('\n');

        panel.appendChild(detalles);
    }
}
