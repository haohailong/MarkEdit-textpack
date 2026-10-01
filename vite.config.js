import { defineConfig } from 'vite';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const packages = JSON.parse(readFileSync(new URL('./package-lock.json', import.meta.url))).packages;
const notices = new Map();
for (const [directory, metadata] of Object.entries(packages)) {
  if (!directory || metadata.dev || directory.startsWith('node_modules/@types/')) continue;
  const licenseFile = readdirSync(new URL(`./${directory}/`, import.meta.url))
    .find(name => /^licen[sc]e(?:\.|$)/i.test(name));
  if (!licenseFile) throw new Error(`Missing license notice for ${directory}`);
  const license = readFileSync(new URL(`./${directory}/${licenseFile}`, import.meta.url), 'utf8').trim();
  const name = directory.replace(/^node_modules\//, '');
  notices.set(license, [...(notices.get(license) ?? []), name]);
}
const licenseBanner = '/*!\nThird-party license notices for runtime dependencies:\n\n' +
  [...notices].map(([license, names]) => `${names.join(', ')}\n\n${license}`).join('\n\n---\n\n') +
  '\n*/\n';
if (licenseBanner.slice(3, -3).includes('*/')) throw new Error('License text contains a comment terminator');

export default defineConfig({
  plugins: [{
    name: 'preserve-third-party-notices',
    closeBundle() {
      const output = new URL('./dist/markedit-textpack.js', import.meta.url);
      const code = readFileSync(output, 'utf8');
      if (!code.startsWith(licenseBanner)) writeFileSync(output, licenseBanner + code);
    },
  }],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'main.js',
      name: 'MarkEditTextpack',
      formats: ['cjs'],
      fileName: () => 'markedit-textpack.js',
    },
    rollupOptions: {
      external: ['markedit-api'],
    },
  },
});
