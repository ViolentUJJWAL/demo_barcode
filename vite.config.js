import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // Allows external access
    port: 3000, // Ensure this matches your ngrok port
    strictPort: true,
    cors: true,
    allowedHosts: ['.ngrok-free.app'], // Allow all Ngrok subdomains
  },
});