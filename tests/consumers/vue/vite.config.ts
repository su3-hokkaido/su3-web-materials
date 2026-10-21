import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    vue({
      template: {
        // Tell Vue's compiler that su3-* tags are custom elements, not components to resolve.
        compilerOptions: { isCustomElement: (tag) => tag.startsWith('su3-') },
      },
    }),
  ],
});
