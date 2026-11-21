import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import uniModule from '@dcloudio/vite-plugin-uni';
// The static asset copier needs an absolute input directory.
const inputDir = fileURLToPath(new URL('./uni-app/', import.meta.url));
process.env.UNI_INPUT_DIR = inputDir;
const uni = uniModule.default || uniModule;
export default defineConfig({ root: inputDir, plugins: [uni()] });
