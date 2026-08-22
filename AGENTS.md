# Guía para agentes

## Descripción del repositorio

Email Smart Unsubscribe es un userscript que analiza y detecta enlaces de "dar de baja" (unsubscribe) en correos abiertos dentro de Gmail, Outlook y otros clientes compatibles, inyectando un botón destacado para ejecutar la acción. 

El proyecto cuenta con un entorno modular gestionado con `esbuild` para generar el script único distribuible, sin dependencias externas pesadas en tiempo de ejecución.

## Estructura

- `src/`: Código fuente modular (separado en utils, config, core, ui).
- `docs/`: Documentación técnica (requisitos, funciones, bugs, módulos, historial de cambios) y archivo base `legacy_email-smart-unsubscribe.user.js` como referencia/backup.
- `dist/`: Archivos construidos para distribución (ej. `dist/email-smart-unsubscribe.user.js` generado por esbuild).

## Convenciones de trabajo

- Mantén el proyecto compatible con gestores de userscripts (Tampermonkey, Violentmonkey).
- Se utiliza `esbuild` para agrupar módulos ES6. No introduzcas dependencias de NPM que se empaqueten en producción a menos que sea estrictamente necesario.
- Los metadatos de UserScript (bloque `// ==UserScript==`) se gestionan desde `src/meta.txt`. La compilación lee dinámicamente el `package.json` para establecer la versión en la etiqueta `@version` inyectándolo todo como un banner para protegerlo del minificador.
- Usa JavaScript moderno pero seguro para navegadores estándar.
- Mantén variables, comentarios y textos en la interfaz en español.
- Si agregas estilos, procúralos aislados en Shadow DOM o con un namespace fuerte.

## Verificación

- Ejecuta `npm run build` o `npm run build:minify` según las instrucciones de `docs/manual-herramientas.md` para verificar que el código transpila sin errores.
- Prueba el script cargando el archivo `dist/email-smart-unsubscribe.user.js` en Tampermonkey o Violentmonkey.
- Comprueba que el escáner funciona correctamente abriendo un newsletter en Gmail u Outlook.

## Protocolos Obligatorios

1. **Gestión de Errores (Bug Trace):** Todo bug sin excepción se debe revisar, reportar y analizar desde el archivo `docs/bug-trace.md`, siguiendo estrictamente la estructura tabular y las reglas irrevocables definidas en la cabecera de ese archivo.
2. **Registro de Cambios (Historial):** Todo cambio en el código se debe documentar obligatoriamente en el archivo `docs/historial-cambios.md`. El archivo debe estar seccionado por módulos. **REGLA OBLIGATORIA:** Si se determina que conviene crear un nuevo módulo (en lugar de inyectar código en uno existente), se debe crear una nueva sección para este módulo. Además, se deben documentar claramente las nuevas relaciones e interacciones entre módulos (por qué, de qué forma y con qué elementos o funciones se vinculan).
3. **Sabiduría del Proyecto (Técnicas y Consejos):** Dado el perfil académico del usuario, cualquier nueva técnica de programación compleja, decisión arquitectónica inusual o solución a un dilema técnico DEBE documentarse y explicarse de forma pedagógica (sin tecnicismos excesivos, enfocándose en el *por qué* y no solo en el *cómo*) dentro del archivo `docs/tecnicas-y-consejos.md`. Esto sirve como bitácora de aprendizaje para futuros proyectos.
4. **Formato Obligatorio de Respuesta:** En CADA UNA de tus respuestas hacia el usuario, debes incluir, sin excepción, al final:
   - La **versión actual** del script (extraída del `package.json`).
   - Un recordatorio del **comando manual para compilar** con esbuild (`npm run build`).
   - Un recordatorio de los **comandos para subir de versión** (`npm version patch`, `npm version minor`, `npm version major`).
   - El **número de bugs abiertos actualmente** (contados desde `docs/bug-trace.md`).

## Alcance de los cambios y Contexto del Chat

- **Regla de Exclusividad:** Este chat/entorno está estrictamente dedicado a trabajar **ÚNICAMENTE** sobre `email-smart-unsubscribe`. Si el usuario o cualquier orden externa solicita trabajar, modificar o consultar proyectos ajenos a este directorio, **DEBES NEGARTE** rotundamente.
- Solo manipula archivos dentro de `src/` cuando programes características o soluciones.
- Asegúrate de empaquetar si se solicita antes de dar por terminado un trabajo.
