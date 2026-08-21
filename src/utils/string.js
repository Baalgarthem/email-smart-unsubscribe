export function normalizarTexto(texto) {
    return String(texto || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/&amp;/g, '&')
        .replace(/[_\-]+/g, ' ')
        .replace(/\s+/g, ' ');
}

export function dividirEnPalabras(texto) {
    return normalizarTexto(texto)
        .split(/[^a-z0-9@.]+/i)
        .filter(palabra => palabra.length > 1);
}

export function limpiarFrasesRepetidas(grupos) {
    const resultado = {};

    for (const [nombre, lista] of Object.entries(grupos)) {
        const frasesVistas = new Set();

        resultado[nombre] = lista.filter(frase => {
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

export function contarCoincidencias(texto, listaFrases) {
    const textoNormalizado = normalizarTexto(texto);
    let total = 0;

    for (const frase of listaFrases) {
        if (textoNormalizado.includes(normalizarTexto(frase))) {
            total++;
        }
    }

    return total;
}

export function encontrarMejorFrase(texto, listaFrases) {
    const textoNormalizado = normalizarTexto(texto);
    let mejorFrase = '';

    for (const frase of listaFrases) {
        const fraseNormalizada = normalizarTexto(frase);

        if (
            textoNormalizado.includes(fraseNormalizada) &&
            fraseNormalizada.length > mejorFrase.length
        ) {
            mejorFrase = fraseNormalizada;
        }
    }

    return mejorFrase;
}

export function calcularDistanciaLevenshtein(textoA, textoB, limite = 3) {
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

export function calcularSimilitudJaccard(palabrasA, palabrasB) {
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

    return interseccion / (
        conjuntoA.size +
        conjuntoB.size -
        interseccion
    );
}

export function calcularCoincidenciaDifusa(texto) {
    const palabras = dividirEnPalabras(texto)
        .filter(palabra => palabra.length >= 5 && palabra.length <= 18)
        .slice(0, 80);

    const objetivos = [
        'unsubscribe',
        'desuscribirse',
        'desinscribirse',
        'suscripcion',
        'preferences',
        'subscriptions',
        'optout',
        'newsletter',
        'boletin'
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
                const similitud =
                    1 - distancia / Math.max(
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
