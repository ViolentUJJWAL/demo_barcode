import { defineConfig } from "vite";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    port: 10000,  // Ensure this matches the port used in Render
    host: "0.0.0.0",
    strictPort: true,  // Ensures Vite only runs on the specified port
    allowedHosts: ["https://demo-barcode.onrender.com"], // Add your Render domain here
  },
  preview: {
    port: 10000,
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: ["https://demo-barcode.onrender.com"],
  },
});