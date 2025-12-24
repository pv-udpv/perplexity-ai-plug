import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'scripts/just-written/index.ts',
      userscript: {
        name: 'Just Written - Simple Perplexity AI Script',
        namespace: 'https://github.com/pv-udpv/perplexity-ai-userscripts',
        version: '1.0.0',
        description: 'A simple example userscript demonstrating keyboard shortcuts, message monitoring, and UI injection for Perplexity AI.',
        author: 'pv-udpv',
        license: 'MIT',
        match: ['https://www.perplexity.ai/*'],
        grant: [],
        'run-at': 'document-idle',
      },
      build: {
        fileName: 'just-written.user.js',
      },
    }),
  ],
  build: {
    target: 'ES2020',
    minify: 'esbuild',
    sourcemap: true,
    emptyOutDir: false,
  },
});
