import { normalizarTexto } from '../utils/string.js';
import { configuracion } from '../config/constants.js';

const CLAVE_ALMACENAMIENTO = 'esu_frases_aprendidas';

/**
 * Obtiene las frases que el script ha aprendido de clics anteriores.
 * @returns {Array<string>} Lista de frases aprendidas.
 */
export function obtenerFrasesAprendidas() {
    try {
        if (typeof GM_getValue !== 'undefined') {
            const guardadas = GM_getValue(CLAVE_ALMACENAMIENTO, '[]');
            return JSON.parse(guardadas);
        }
    } catch (e) {
        if (configuracion.modoDebug) console.error('Error al obtener frases aprendidas:', e);
    }
    return [];
}

/**
 * Aprende una nueva frase de un botón de desuscripción confirmado por el usuario.
 * @param {string} textoCrudo El texto del botón o enlace confirmado.
 */
export function aprenderNuevaFrase(textoCrudo) {
    if (!textoCrudo) return;

    // Limpiar el texto (quitar espacios extra, puntuación básica)
    // Extraemos solo el fragmento más corto y relevante si es un texto largo.
    let texto = normalizarTexto(textoCrudo);
    
    // No aprender frases gigantes ni vacías
    if (texto.length < 3 || texto.length > 50) return;

    // Obtener la memoria actual
    const memoria = obtenerFrasesAprendidas();

    // Si ya la conocemos, no hacer nada
    if (memoria.includes(texto)) return;

    // Si es nueva, la guardamos
    memoria.push(texto);

    try {
        if (typeof GM_setValue !== 'undefined') {
            GM_setValue(CLAVE_ALMACENAMIENTO, JSON.stringify(memoria));
            if (configuracion.modoDebug) {
                console.log(`[Auto-Aprendizaje] Nueva frase memorizada: "${texto}"`);
            }
        }
    } catch (e) {
        if (configuracion.modoDebug) console.error('Error al guardar nueva frase:', e);
    }
}
