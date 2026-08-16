import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Relative base so the same build works from a domain root, a GitHub Pages
// subpath, or a file:// copy handed to a colleague.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
