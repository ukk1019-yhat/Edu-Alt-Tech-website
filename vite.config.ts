import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function parseEnv(filePath: string): Record<string, string> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const vars: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      vars[key] = val;
    }
    return vars;
  } catch {
    return {};
  }
}

export default defineConfig({
  plugins: [react()],
  define: (() => {
    const envPath = path.resolve(process.cwd(), '.env');
    const env = parseEnv(envPath);
    return {
      __OPENROUTER_API_KEY__: JSON.stringify(env.VITE_OPENROUTER_API_KEY || ''),
      __OPENROUTER_MODEL__: JSON.stringify(env.VITE_OPENROUTER_MODEL || 'google/gemma-3-27b-it'),
    };
  })(),
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
            return 'vendor';
          }
          if (id.includes('node_modules/firebase')) {
            return 'firebase';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/framer-motion')) {
            return 'ui';
          }
          if (id.includes('lib/ai') || id.includes('AIAssistant') || id.includes('FlashcardDeck')) {
            return 'ai';
          }
        },
      },
    },
  },
  server: {
    allowedHosts: true,
  },
});