const esbuild = require('esbuild');
const fs = require('fs');

async function build() {
  // Plugin backend → code.js
  await esbuild.build({
    entryPoints: ['src/plugin/code.ts'],
    bundle: true,
    outfile: 'code.js',
    platform: 'browser',
    target: 'es6',
    format: 'iife',
    logLevel: 'info',
  });

  // UI bundle (JS + CSS in-memory)
  const uiResult = await esbuild.build({
    entryPoints: ['src/ui/main.ts'],
    bundle: true,
    write: false,
    platform: 'browser',
    target: 'es6',
    format: 'iife',
    outdir: 'out',
    loader: { '.css': 'css' },
  });

  const jsText  = uiResult.outputFiles.find(f => f.path.endsWith('.js'))?.text  ?? '';
  const cssText = uiResult.outputFiles.find(f => f.path.endsWith('.css'))?.text ?? '';

  let html = fs.readFileSync('src/ui/template.html', 'utf8');
  html = html.replace('/* __CSS_PLACEHOLDER__ */', cssText);
  html = html.replace('/* __JS_PLACEHOLDER__ */', jsText);
  fs.writeFileSync('ui.html', html);

  console.log('Build complete: code.js + ui.html');
}

build().catch(e => { console.error(e); process.exit(1); });
