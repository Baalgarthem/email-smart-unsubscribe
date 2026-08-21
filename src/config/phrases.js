import { limpiarFrasesRepetidas } from '../utils/string.js';

const frasesBase = {
    criticas: [
        'unsubscribe', 'un-subscribe', 'one click unsubscribe', 'click here to unsubscribe', 'click to unsubscribe', 'cancel email subscription', 'cancel subscription', 'darse de baja', 'aquí', 'aqui', 'darme de baja', 'dar de baja', 'cancelar suscripcion', 'cancelar suscripción', 'cancelar mi suscripcion', 'cancelar mi suscripción', 'cancelar tu suscripcion', 'cancelar tu suscripción', 'baja de suscripcion', 'baja de suscripción', 'baja del boletin', 'baja del boletín', 'desuscribirse', 'des-suscribirse', 'desinscribirse', 'remove me', 'remove me from this list', 'remove from mailing list', 'leave this list', 'stop emails', 'stop receiving emails', 'stop receiving these emails', 'dejar de recibir', 'dejar de recibir emails', 'dejar de recibir correos', 'no quiero recibir', 'no recibir emails', 'no recibir correos', 'opt out', 'opt-out', 'optout', 'quitarme de la lista'
    ],
    altas: [
        'manage subscriptions', 'manage subscription', 'manage email subscriptions', 'subscription center', 'subscription centre', 'subscription preferences', 'email preferences', 'email preference center', 'email preference centre', 'communication preferences', 'communications preferences', 'newsletter preferences', 'mail preferences', 'manage your preferences', 'change your preferences', 'edit your preferences', 'preferencias de correo', 'preferencias de email', 'preferencias de comunicacion', 'preferencias de comunicación', 'centro de preferencias', 'centro de suscripciones', 'administrar suscripciones', 'administrar preferencias', 'gestionar suscripciones', 'gestionar preferencias', 'gestiona tus preferencias', 'modificar preferencias', 'actualizar preferencias'
    ],
    medias: [
        'subscription', 'subscriptions', 'suscripcion', 'suscripción', 'newsletter', 'boletin', 'boletín', 'mailing list', 'email list', 'lista de correo', 'lista de emails', 'promotional emails', 'marketing emails', 'commercial emails', 'emails promocionales', 'correos promocionales', 'correos comerciales', 'comunicaciones comerciales'
    ],
    bajas: [
        'preferences', 'preferencias', 'profile', 'perfil', 'settings', 'configuracion', 'configuración', 'privacy', 'privacidad', 'terms', 'legal'
    ],
    contextoNewsletter: [
        'you are receiving this email', 'you received this email', 'received this email because', 'this email was sent to', 'sent to this address', 'recibes este correo', 'recibiste este correo', 'has recibido este correo', 'este email fue enviado', 'este correo fue enviado', 'mailing address', 'newsletter', 'boletin', 'boletín', 'campaign', 'campana', 'campaña', 'email was intended for', 'correo dirigido a'
    ],
    riesgo: [
        'password', 'contrasena', 'contraseña', 'security', 'seguridad', 'verify account', 'verificar cuenta', 'billing', 'facturacion', 'facturación', 'payment', 'pago', 'invoice', 'download attachment', 'descargar archivo', 'urgent', 'urgente', 'confirm identity', 'confirmar identidad', 'bank', 'banco', 'wallet', 'crypto', 'transfer', 'wire transfer'
    ],
    cuenta: [
        'delete account', 'eliminar cuenta', 'close account', 'cerrar cuenta', 'sign out', 'logout', 'log out', 'cerrar sesion', 'cerrar sesión', 'account settings', 'configuracion de cuenta', 'configuración de cuenta', 'my account', 'mi cuenta'
    ],
    social: [
        'facebook', 'twitter', 'x.com', 'instagram', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'share', 'compartir', 'follow us', 'siguenos', 'síguenos'
    ],
    compra: [
        'order', 'pedido', 'purchase', 'compra', 'shipping', 'envio', 'envío', 'tracking', 'rastreo', 'receipt', 'recibo', 'cart', 'carrito', 'checkout'
    ],
    verbosParada: [
        'dejar de', 'parar', 'cancelar', 'darse de baja', 'eliminar', 'stop', 'cancel', 'remove', 'unsubscribe', 'no recibir', 'abandonar', 'quit', 'renunciar'
    ],
    sustantivosComunicacion: [
        'e-mails', 'emails', 'correos', 'mensajes', 'boletin', 'boletín', 'newsletter', 'comunicaciones', 'suscripcion', 'suscripción', 'lista', 'list', 'messages', 'communications', 'notificaciones', 'notifications', 'avisos'
    ],
    accionesEnlace: [
        'haz clic', 'clic aqui', 'clic', 'click here', 'aqui', 'aquí', 'pulsar', 'este enlace', 'this link', 'pulsa aqui', 'presiona', 'ingresa aqui'
    ]
};

export const frases = limpiarFrasesRepetidas(frasesBase);
