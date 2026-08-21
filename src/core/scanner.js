import { normalizarTexto } from '../utils/string.js';
import { 
    obtenerElementosVisiblesUnicos, 
    obtenerElementoAccionable, 
    elementoEsVisible, 
    obtenerTextoPropio, 
    obtenerHrefAbsoluto 
} from '../utils/dom.js';
import { IDENTIFICADORES, configuracion, patronHrefBaja, patronTextoRelevante, selectoresNativos } from '../config/constants.js';

export function esGmailActual() {
    return location.hostname === 'mail.google.com';
}

export function esOutlookActual() {
    return [
        'outlook.office.com',
        'outlook.office365.com',
        'outlook.live.com'
    ].includes(location.hostname);
}

export function eliminarRaicesContenidas(raices) {
    return raices.filter((raiz, indice) => {
        return !raices.some((otraRaiz, otroIndice) => {
            return (
                indice !== otroIndice &&
                otraRaiz.contains(raiz)
            );
        });
    });
}

export function obtenerRaicesGmail(documentoActual) {
    if (!esGmailActual()) {
        return [];
    }

    const selectores = [
        'div.a3s.aiL',
        'div.a3s',
        'div[role="listitem"] div.a3s',
        'div[role="main"] div.a3s',
        // Cabeceras nativas donde Gmail inyecta su botón de "Cancelar suscripción"
        'div.gE.iv.gt',
        'div.Ca',
        'div[data-tooltip*="unsubscribe" i]'
    ];

    const raices = obtenerElementosVisiblesUnicos(
        documentoActual,
        selectores,
        20
    );

    return eliminarRaicesContenidas(raices);
}

export function obtenerRaicesOutlook(documentoActual) {
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
        ).filter(elemento => {
            const cantidadEnlaces =
                elemento.querySelectorAll('a[href]').length;

            const texto = normalizarTexto(
                elemento.innerText ||
                elemento.textContent ||
                ''
            );

            return (
                cantidadEnlaces > 0 &&
                texto.length >= 60 &&
                texto.length <= 100000
            );
        });
    }

    return eliminarRaicesContenidas(raices);
}

export function obtenerRaicesGenericas(documentoActual) {
    const selectores = [
        '[role="main"]',
        'main',
        '[role="document"]'
    ];

    return obtenerElementosVisiblesUnicos(
        documentoActual,
        selectores,
        20
    );
}

export function obtenerRaicesDeBusqueda(documentoActual) {
    if (esGmailActual()) {
        return obtenerRaicesGmail(documentoActual);
    }

    if (esOutlookActual()) {
        return obtenerRaicesOutlook(documentoActual);
    }

    return obtenerRaicesGenericas(documentoActual);
}

export function obtenerDocumentosExplorables() {
    const documentos = [document];

    for (const iframe of document.querySelectorAll('iframe')) {
        try {
            const documentoIframe = iframe.contentDocument;

            if (
                documentoIframe &&
                documentoIframe.documentElement
            ) {
                documentos.push(documentoIframe);
            }
        } catch {
            // Los iframes de otro origen no pueden inspeccionarse.
        }
    }

    return documentos;
}

export function obtenerFirmaVistaActual() {
    const partes = [
        location.href,
        document.title
    ];

    if (esGmailActual()) {
        const asunto = document.querySelector(
            'h2.hP, [role="main"] h2'
        );

        const remitente = document.querySelector(
            'span[email].gD, span[email], .gD[email]'
        );

        partes.push(
            asunto?.innerText || '',
            remitente?.getAttribute?.('email') || ''
        );
    }

    if (esOutlookActual()) {
        const asunto = document.querySelector(
            '[role="main"] [role="heading"], ' +
            '[role="main"] h1, ' +
            '[role="main"] h2'
        );

        partes.push(asunto?.innerText || '');
    }

    return normalizarTexto(partes.join('|')).slice(0, 500);
}

export function obtenerCandidatos(raiz) {
    const selectorAccionable = [
        'a[href]',
        'button',
        'input[type="button"]',
        'input[type="submit"]',
        '[role="button"]',
        '[onclick]',
        '[data-href]',
        '[data-url]'
    ].join(',');

    const selectorTextual = [
        'span',
        'p',
        'td',
        'div'
    ].join(',');

    const candidatos = [];
    const vistos = new Set();

    function agregarCandidato(elemento) {
        if (
            !elemento ||
            !elemento.isConnected ||
            elemento.closest?.(
                `#${IDENTIFICADORES.anfitrion}`
            )
        ) {
            return;
        }

        const accionable = obtenerElementoAccionable(elemento);

        if (
            !accionable ||
            vistos.has(accionable) ||
            !elementoEsVisible(accionable)
        ) {
            return;
        }

        vistos.add(accionable);
        candidatos.push(accionable);
    }

    for (const elemento of raiz.querySelectorAll(selectorAccionable)) {
        const textoRapido = normalizarTexto([
            obtenerTextoPropio(elemento),
            obtenerHrefAbsoluto(elemento)
        ].join(' '));

        const esNativo = selectoresNativos.some(sel => elemento.matches(sel));

        if (
            esNativo ||
            patronHrefBaja.test(textoRapido) ||
            patronTextoRelevante.test(textoRapido)
        ) {
            agregarCandidato(elemento);
        }

        if (
            candidatos.length >=
            configuracion.maximoCandidatosPorRaiz
        ) {
            break;
        }
    }

    if (
        candidatos.length <
        configuracion.maximoCandidatosPorRaiz
    ) {
        for (const elemento of raiz.querySelectorAll(selectorTextual)) {
            const texto = normalizarTexto(
                elemento.innerText ||
                elemento.textContent ||
                ''
            );

            if (
                texto.length > 250 ||
                !patronTextoRelevante.test(texto)
            ) {
                continue;
            }

            agregarCandidato(elemento);

            if (
                candidatos.length >=
                configuracion.maximoCandidatosPorRaiz
            ) {
                break;
            }
        }
    }

    return candidatos;
}
