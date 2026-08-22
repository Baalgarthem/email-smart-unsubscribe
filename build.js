const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Leer versión del package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const version = packageJson.version;

// Leer plantilla de metadatos
let metaText = fs.readFileSync(path.join(__dirname, 'src', 'meta.txt'), 'utf8');
metaText = metaText.replace('{{VERSION}}', version);

const isMinify = process.argv.includes('--minify');
const isWatch = process.argv.includes('--watch');

const pluginEmbellecedor = {
    name: 'embellecedor-separadores',
    setup(build) {
        build.onEnd(result => {
            if (isMinify || result.errors.length > 0) return;

            const outFile = build.initialOptions.outfile;
            try {
                const rutaArchivo = path.join(__dirname, outFile);
                let contenido = fs.readFileSync(rutaArchivo, 'utf8');

                const regexSeparador = /^\s*\/\/\s*(src\/[a-zA-Z0-9_/-]+\.js)\s*$/gm;

                contenido = contenido.replace(regexSeparador, (match, rutaModulo) => {
                    const padLength = Math.max(0, 50 - rutaModulo.length);
                    const paddingIzquierdo = ' '.repeat(Math.floor(padLength / 2));
                    const paddingDerecho = ' '.repeat(Math.ceil(padLength / 2));
                    
                    return `
/* ════════════════════════════════════════════════════════════ */
/* ${paddingIzquierdo}MÓDULO: ${rutaModulo}${paddingDerecho} */
/* ════════════════════════════════════════════════════════════ */`;
                });

                // Eliminamos los saltos de línea extra que deja esbuild antes de nuestro banner
                contenido = contenido.replace(/\n{3,}\/\* ════/g, '\n\n/* ════');

                fs.writeFileSync(rutaArchivo, contenido, 'utf8');
            } catch (error) {
                console.error('Error al embellecer separadores:', error);
            }
        });
    },
};

const buildOptions = {
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: isMinify,
    outfile: 'dist/email-smart-unsubscribe.user.js',
    banner: { js: metaText },
    plugins: [pluginEmbellecedor]
};

async function runBuild() {
    if (isWatch) {
        const ctx = await esbuild.context(buildOptions);
        await ctx.watch();
        console.log(`👀 Modo observador (watch) activado. Compilando automáticamente al guardar cambios... (v${version})`);
    } else {
        await esbuild.build(buildOptions);
        console.log(`✅ Build completado exitosamente (v${version})`);
    }
}

runBuild().catch(() => process.exit(1));
