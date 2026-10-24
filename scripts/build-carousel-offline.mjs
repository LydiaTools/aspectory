import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

const result = await build({
  entryPoints: ['src/carousel.js'], bundle: true, write: false, format: 'iife',
  minify: true, legalComments: 'inline', outfile: 'carousel.js',
  loader: { '.woff2': 'dataurl', '.woff': 'dataurl' }
});
const javascript = result.outputFiles.find(file => file.path.endsWith('.js')).text;
const css = result.outputFiles.find(file => file.path.endsWith('.css')).text;
const licensePaths = ['LICENSE', 'node_modules/fflate/LICENSE', 'public/licenses/dm-sans-OFL.txt', 'public/licenses/space-grotesk-OFL.txt'];
const licenses = await Promise.all(licensePaths.map(async path => `${path}\n${await readFile(path, 'utf8')}`));
let html = await readFile('carousel.html', 'utf8');
html = html.replace(/<script type="module" src="\/src\/carousel.js"><\/script>/, () => `<style>${css}</style>\n<script>${javascript}</script>`);
html = html.replace('<!doctype html>', `<!doctype html>\n<!-- Standalone Carousel Fit v0.2.0. Bundled licenses:\n${licenses.join('\n\n')}\n-->`);
await writeFile('dist/carousel-offline.html', html);
console.log(`Standalone carousel-offline.html: ${Buffer.byteLength(html)} bytes`);
