export const IDENTIFICADORES = Object.freeze({
    anfitrion: 'esu-ui-host',
    boton: 'esu-pill',
    aviso: 'esu-notify',
    panel: 'esu-panel-diagnostico'
});

export const configuracion = {
    umbralMostrar: 0.58,
    umbralAltaConfianza: 0.74,

    maximoCandidatosPorRaiz: 500,
    bloqueoMs: 2000,
    retrasoBusquedaMs: 650,
    retrasoInicioMs: 1500,

    modoDebug: false,
    mostrarPanelDiagnostico: false,

    colores: {
        primario: '#1a73e8',
        peligro: '#d93025',
        exito: '#1e8e3e',
        advertencia: '#f9ab00',
        neutro: '#5f6368',
        panel: '#202124'
    },

    pesos: {
        fraseCritica: 45,
        fraseAlta: 32,
        fraseMedia: 20,
        fraseBaja: 10,

        hrefCritico: 42,
        dominioMarketing: 16,

        atributoFuerte: 24,
        atributoMedio: 14,

        contextoFooter: 18,
        contextoPreferencias: 16,
        contextoNewsletter: 10,

        esEnlace: 8,
        esBoton: 5,
        esAccionable: 7,
        elementoCompacto: 5,

        coherenciaNewsletterBaja: 12,
        coincidenciaDifusa: 10,
        deteccionAlgoritmicaContextual: 55,

        botonNativoCorreo: 1000,
        huellaVisualDiscreta: 25,
        proximidadSemanticaEstricta: 40,
        cercaniaPixelRastreo: 30,

        penalizacionRiesgo: -45,
        penalizacionCuenta: -30,
        penalizacionSocial: -20,
        penalizacionCompra: -28,
        penalizacionTextoLargo: -12,
        penalizacionOculto: -100
    }
};

export const patronHrefBaja = /(?:unsubscribe|un[-_]?subscribe|unsub|opt[\-_]?out|remove[_-]?me|leave[_-]?list|stop[_-]?emails|email[_-]?(?:preferences|settings|profile|subscription)|subscription[_-]?(?:preferences|center|centre|settings)|manage[_-]?(?:subscriptions|preferences)|preference[_-]?(?:center|centre)|list[_-]?unsubscribe|cancel(?:ar)?[_-]?(?:subscription|suscripcion)|baja[_-]?(?:suscripcion|boletin)|desuscrib)/i;

export const patronDominioMarketing = /(?:mailchimp|mandrillapp|sendgrid|sendinblue|brevo|hubspot|salesforce|pardot|marketo|eloqua|constantcontact|activecampaign|klaviyo|iterable|mailgun|sparkpost|campaign|newsletter|mailing)/i;

export const patronTextoRelevante = /unsubscribe|un\s*subscribe|opt\s*out|remove\s*me|stop\s*(?:receiving\s*)?(?:emails|messages)|darse?\s+de\s+baja|darme\s+de\s+baja|desuscrib|desinscrib|cancelar\s+(?:la\s+|mi\s+|tu\s+)?suscrip|baja\s+(?:de\s+)?suscrip|manage\s+(?:email\s+)?subscriptions|subscription\s+(?:preferences|center|centre)|preferencias?\s+(?:de\s+)?(?:correo|email|suscrip)|newsletter|boletin|boletín/i;

export const selectoresNativos = [
    // Gmail native list-unsubscribe button (often a span with 'Cancelar suscripción' or similar near the sender)
    '.Ca', // Historically Gmail's unsubscribe button class, but it changes. 
    'span[email="unsubscribe"]', // Fallback pattern
    'div[data-tooltip*="unsubscribe" i]',
    'div[data-tooltip*="cancelar suscripción" i]'
];
