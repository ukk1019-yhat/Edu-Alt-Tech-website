import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.VITE_OPENROUTER_API_KEY),
      'import.meta.env.VITE_OPENROUTER_MODEL': JSON.stringify(env.VITE_OPENROUTER_MODEL),
    },
    server: {
      allowedHosts: true,
    },
  };
});