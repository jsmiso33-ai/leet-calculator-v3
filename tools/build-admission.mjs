import { dirname, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entry = resolve(root, 'src/admission-react.jsx');
const contents = await readFile(entry, 'utf8');
const require = createRequire(import.meta.url);

await build({
  absWorkingDir: root,
  stdin: {
    contents,
    loader: 'jsx',
    resolveDir: resolve(root, 'src'),
    sourcefile: 'src/admission-react.jsx',
  },
  outfile: 'admission-react.js',
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'AdmissionReactBundle',
  plugins: [{
    name: 'node-resolve-from-root',
    setup(buildApi) {
      buildApi.onResolve({ filter: /^[^./].*/ }, args => ({
        path: require.resolve(args.path, { paths: [root] }),
      }));
      buildApi.onResolve({ filter: /^\./ }, args => ({
        path: require.resolve(resolve(args.resolveDir, args.path)),
      }));
    },
  }],
});
