import { normalizarTexto } from './string.js';

let cacheContexto = new WeakMap();

export function limpiarCacheContexto() {
    cacheContexto = new WeakMap();
}

export function obtenerHrefAbsoluto(elemento) {
    const href =
        elemento?.href ||
        elemento?.getAttribute?.('href') ||
        elemento?.getAttribute?.('data-href') ||
        elemento?.getAttribute?.('data-url') ||
        '';

    try {
        return href ? new URL(href, location.href).href : '';
    } catch {
        return href;
    }
}

export function obtenerTextoDeAtributos(elemento) {
    const atributos = [
        'href', 'title', 'aria-label', 'aria-description', 'alt', 'value', 'name', 'id', 'class',
        'data-testid', 'data-test-id', 'data-action', 'data-link-name', 'data-link-type', 'data-track',
        'data-tracking', 'data-url', 'data-href', 'data-qa', 'data-cy', 'rel', 'target', 'type', 'role'
    ];

    return atributos
        .map(atributo => elemento?.getAttribute?.(atributo))
        .filter(Boolean)
        .join(' ');
}

export function obtenerTextoPropio(elemento) {
    return normalizarTexto([
        elemento?.innerText,
        elemento?.textContent,
        obtenerTextoDeAtributos(elemento),
        obtenerHrefAbsoluto(elemento)
    ].filter(Boolean).join(' '));
}

export function elementoEsVisible(elemento) {
    try {
        if (!elemento?.isConnected) {
            return false;
        }

        const ventana = elemento.ownerDocument?.defaultView || window;
        const estilo = ventana.getComputedStyle(elemento);

        if (
            estilo.display === 'none' ||
            estilo.visibility === 'hidden' ||
            Number(estilo.opacity) < 0.05 ||
            estilo.pointerEvents === 'none'
        ) {
            return false;
        }

        const rectangulo = elemento.getBoundingClientRect();

        if (rectangulo.width < 2 || rectangulo.height < 2) {
            return false;
        }

        return Boolean(
            elemento.offsetWidth ||
            elemento.offsetHeight ||
            elemento.getClientRects().length
        );
    } catch {
        return false;
    }
}

export function obtenerContextoCercano(elemento) {
    if (cacheContexto.has(elemento)) {
        return cacheContexto.get(elemento);
    }

    const partes = [obtenerTextoPropio(elemento)];

    let actual = elemento.parentElement;
    let profundidad = 0;

    while (actual && profundidad < 4) {
        const texto = actual.innerText || actual.textContent || '';

        if (texto && texto.length < 1800) {
            partes.push(texto);
        }

        actual = actual.parentElement;
        profundidad++;
    }

    const contexto = normalizarTexto(
        partes.join(' ')
    ).slice(0, 3500);

    cacheContexto.set(elemento, contexto);
    return contexto;
}

export function elementoPareceEstarEnFooter(elemento) {
    let actual = elemento;
    let pasos = 0;

    while (actual && pasos < 6) {
        const descripcion = normalizarTexto([
            actual.tagName,
            actual.getAttribute?.('role'),
            actual.getAttribute?.('class'),
            actual.getAttribute?.('id'),
            actual.getAttribute?.('aria-label')
        ].filter(Boolean).join(' '));

        if (
            /footer|pie de pagina|legal|compliance|email footer|mail footer|unsubscribe area|subscription footer|fine print/.test(
                descripcion
            )
        ) {
            return true;
        }

        actual = actual.parentElement;
        pasos++;
    }

    return false;
}

export function elementoTieneAccionDirecta(elemento) {
    if (!elemento) {
        return false;
    }

    return Boolean(
        elemento.tagName === 'A' ||
        elemento.tagName === 'BUTTON' ||
        elemento.onclick ||
        elemento.getAttribute?.('href') ||
        elemento.getAttribute?.('data-href') ||
        elemento.getAttribute?.('data-url') ||
        elemento.getAttribute?.('role') === 'button' ||
        /button|submit/i.test(elemento.getAttribute?.('type') || '')
    );
}

export function obtenerElementoAccionable(elemento) {
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

export function obtenerElementosVisiblesUnicos(
    documentoActual,
    selectores,
    minimoTexto = 20
) {
    const elementos = [];
    const vistos = new Set();

    for (const selector of selectores) {
        let coincidencias = [];

        try {
            coincidencias = documentoActual.querySelectorAll(selector);
        } catch {
            continue;
        }

        for (const elemento of coincidencias) {
            if (
                vistos.has(elemento) ||
                !elementoEsVisible(elemento)
            ) {
                continue;
            }

            const texto = normalizarTexto(
                elemento.innerText ||
                elemento.textContent ||
                ''
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
