// Builds preview/play.html: a single self-contained file that runs the game in any browser.
//   bun run preview/build.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const shim = (f: string) => resolve(import.meta.dir, 'shims', f);
const NM = process.env.PREVIEW_NODE_MODULES ?? resolve(root, 'node_modules');

const result = await Bun.build({
  entrypoints: [resolve(import.meta.dir, 'entry.tsx')],
  minify: true,
  target: 'browser',
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [
    {
      name: 'rn-web-shims',
      setup(build) {
        build.onResolve({ filter: /^react-native$/ }, () => ({ path: shim('react-native.tsx') }));
        build.onResolve({ filter: /^react-native-safe-area-context$/ }, () => ({ path: shim('safe-area.tsx') }));
        build.onResolve({ filter: /^@react-native-async-storage\/async-storage$/ }, () => ({ path: shim('async-storage.ts') }));
        build.onResolve({ filter: /^expo-haptics$/ }, () => ({ path: shim('haptics.ts') }));
        build.onResolve({ filter: /^react-native-svg$/ }, () => ({ path: shim('svg.tsx') }));
        build.onResolve({ filter: /^expo-status-bar$/ }, () => ({ path: shim('status-bar.tsx') }));
        build.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, (a) => ({ path: Bun.resolveSync(a.path, NM) }));
      },
    },
  ],
});
if (!result.success) { console.error(result.logs); process.exit(1); }
const js = await result.outputs[0].text();
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Generations (browser preview)</title></head><body><div id="root"></div><script>${js.replace(/<\/script>/g, '<\\/script>')}</script></body></html>`;
mkdirSync(dirname(resolve(root, 'preview/play.html')), { recursive: true });
writeFileSync(resolve(root, 'preview/play.html'), html);
console.log('built preview/play.html', (html.length / 1024).toFixed(0) + ' KB');
