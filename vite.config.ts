import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'SchemaNode',
      fileName: () => `index.js`,
    },
    rollupOptions: {
      output: {
        globals: {
          'schema-node': 'SchemaNode'
        }
      }
    }
  },
  plugins: [dts({
    outDir: 'dist',         // emit index.d.ts to dist/
    insertTypesEntry: true     // adds `export * from './index'` to index.d.ts
  })]
})
