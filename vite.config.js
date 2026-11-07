import { defineConfig } from 'vite';
export default defineConfig({
  server: {
    watch: {
      ignored: ['**/legacy/**', '**/qa/**', '**/dist/**', '**/.playwright/**', '**/.pnpm-store/**'],
    },
  },
  build: { outDir: 'dist/client', chunkSizeWarningLimit: 900, base: './' },
  css: { preprocessorOptions: { less: { javascriptEnabled: true, modifyVars: {
    'primary-color':'#5B3A2E', 'link-color':'#5B3A2E', 'text-color':'#3B2A22',
    'text-color-secondary':'#7A6555', 'heading-color':'#3B2A22', 'body-background':'#FAF8F4',
    'component-background':'#FFFCF7','border-color-base':'#927C68', 'border-radius-base':'8px',
    'font-family':'"Microsoft YaHei UI", "Noto Sans SC", sans-serif', 'font-size-base':'14px',
    'success-color':'#2D6946','warning-color':'#7A5200','error-color':'#A43838',
    'control-height':'36px'
  } } } }
});
