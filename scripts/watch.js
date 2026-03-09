const esbuild = require('esbuild');
const fs = require('fs');

async function watch() {
  const pluginCtx = await esbuild.context({
    entryPoints: ['src/plugin/code.ts'],
    bundle: true,
    outfile: 'code.js',
    platform: 'browser',
    target: 'es6',
    format: 'iife',
  });

  const uiCtx = await esbuild.context({
    entryPoints: ['src/ui/main.ts'],
    bundle: true,
    write: false,
    platform: 'browser',
    target: 'es6',
    format: 'iife',
    outdir: 'out',
    loader: { '.css': 'css' },
    plugins: [{
      name: 'inline-html',
      setup(build) {
        build.onEnd(result => {
          const jsText  = result.outputFiles?.find(f => f.path.endsWith('.js'))?.text  ?? '';
          const cssText = result.outputFiles?.find(f => f.path.endsWith('.css'))?.text ?? '';
          let html = fs.readFileSync('src/ui/template.html', 'utf8');
          html = html.replace('/* __CSS_PLACEHOLDER__ */', cssText);
          html = html.replace('/* __JS_PLACEHOLDER__ */', jsText);
          fs.writeFileSync('ui.html', html);
          console.log('ui.html rebuilt');
        });
      }
    }]
  });

  await pluginCtx.watch();
  await uiCtx.watch();
  console.log('Watching for changes...');
}

watch().catch(console.error);
