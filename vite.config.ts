import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
      'process.env.SAMBANOVA_API_KEY': JSON.stringify(env.SAMBANOVA_API_KEY),
      'process.env.STUDYAI_API_KEY': JSON.stringify(env.STUDYAI_API_KEY),
      'process.env.EXTRA_API_KEY': JSON.stringify(env.EXTRA_API_KEY),
      'process.env.LONG_TOKEN_100': JSON.stringify(env.LONG_TOKEN_100),
      'process.env.SUNRA_API_KEY': JSON.stringify(env.SUNRA_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
