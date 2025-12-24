import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'scripts/vitemonkey-built/index.ts',
      userscript: {
        name: 'ViteMonkey Built - Perplexity AI Template',
        namespace: 'https://github.com/pv-udpv/perplexity-ai-plug',
        version: '1.0.0',
        description: 'Template for ViteMonkey-based Perplexity AI userscript with modern TypeScript, logging, and configuration management.',
        author: 'pv-udpv',
        license: 'MIT',
        match: ['https://www.perplexity.ai/*'],
        grant: ['GM_setValue', 'GM_getValue', 'GM_xmlhttpRequest'],
        'run-at': 'document-start',
      },
      build: {
        fileName: 'vitemonkey-built.user.js',
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
