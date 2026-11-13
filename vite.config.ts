/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { offlinePlugin } from './scripts/offlinePlugin.ts'

export default defineConfig({
  plugins: [react(), offlinePlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    // Orçamento: o avulso de produto fica abaixo de 180 kB brutos por chunk.
    // O vendor (React + Router) é a exceção conhecida — ~258 kB brutos / 82 kB
    // comprimidos — e o limite abaixo evita um aviso que já está analisado.
    // Orçamento real acompanhado: ≤ 120 kB comprimidos no primeiro carregamento.
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        // Vendor estável em cache longo, separado do código do produto.
        manualChunks: (id: string) => (id.includes('node_modules') ? 'vendor' : undefined),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.*', 'src/tests/**', 'src/**/*.d.ts'],
    },
  },
})
