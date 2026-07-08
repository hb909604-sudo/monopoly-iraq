import { defineConfig } from 'vite';

// base: './' يجعل مسارات الملفات نسبية، وهو ما تحتاجه GitHub Pages
// سواء نُشر المشروع على جذر النطاق أو داخل مسار فرعي مثل /repo-name/
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
});
