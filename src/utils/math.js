export function limitarNumero(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, valor));
}

export function convertirScoreAProbabilidad(score) {
    return 1 / (1 + Math.exp(-(score - 42) / 16));
}

export function convertirProbabilidadAPorcentaje(probabilidad) {
    return Math.round(limitarNumero(probabilidad, 0, 1) * 100);
}
