import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, '.', '');

  let reactPlugin: any = null;
  try {
    const mod = await import('@vitejs/plugin-react');
    reactPlugin = mod && (mod.default || mod.react) ? (mod.default || mod.react) : null;
  } catch (err) {
    console.warn('@vitejs/plugin-react not found, continuing without it');
    reactPlugin = null;
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: reactPlugin ? [reactPlugin()] : [],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
