import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// BASE_PATH est défini par le workflow de déploiement GitHub Pages (ex. "/PlanPlan/").
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
});
