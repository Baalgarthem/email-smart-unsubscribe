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

const buildOptions = {
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: isMinify,
    outfile: 'dist/email-smart-unsubscribe.user.js',
    banner: { js: metaText }
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
