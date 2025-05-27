import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'SchemaNode',
      fileName: (format) => `schema-node.${format}.js`,
    },
    rollupOptions: {
      output: {
        globals: {
          'schema-node': 'SchemaNode'
        }
      }
    }
  }
})
