import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Get the replica port from environment or use default
const replicaPort = process.env.REACT_APP_REPLICA_PORT || '4943';
const isProduction = process.env.NODE_ENV === 'production';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: isProduction ? undefined : {
      // Proxy API requests to the local dfx replica
      '/api': {
        target: `http://localhost:${replicaPort}`,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  define: {
    // Make environment variables available
    'process.env.REACT_APP_WALLET_CANISTER_ID': JSON.stringify(
      process.env.REACT_APP_WALLET_CANISTER_ID
    ),
    'process.env.REACT_APP_REPLICA_PORT': JSON.stringify(replicaPort),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});