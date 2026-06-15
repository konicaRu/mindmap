import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` для GitHub Pages: project pages обслуживаются по пути /<repo>/.
// Переопределяется переменной окружения BASE_PATH (используется в CI).
const base = process.env.BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
