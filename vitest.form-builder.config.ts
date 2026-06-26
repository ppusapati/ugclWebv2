import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: [
      'src/components/form-builder/renderer/form-dependency.utils.test.ts',
      'src/components/form-builder/renderer/fields/select-field.utils.test.ts',
    ],
  },
});
