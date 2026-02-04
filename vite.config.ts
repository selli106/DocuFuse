import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Determine the base path
    // For GitHub Pages: /DocuFuse/
    // For local dev: /
    const base = process.env.GITHUB_PAGES === 'true' ? '/DocuFuse/' : '/';
    
    console.log(`Building with base path: ${base}`);
    
    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Ensure clean builds
        emptyOutDir: true,
        // Generate source maps for debugging
        sourcemap: true,
        // Improve chunk splitting
        rollupOptions: {
          input: 'index.html',
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
            }
          }
        }
      }
    };
});
