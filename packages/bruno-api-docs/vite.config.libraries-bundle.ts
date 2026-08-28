import { defineConfig } from 'vite';
import { resolve } from 'path';

// This output is stringified and re-evaluated inside the QuickJS sandbox, so it must
// stay a fully self-contained iife: any hoisted helper, shared chunk, or module-scope
// import would reference an identifier that does not exist in the sandbox and fail at boot.
function wrapInFunction() {
  return {
    name: 'wrap-in-function',
    generateBundle(options: any, bundle: any) {
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk') {
          // Wrap the entire code in getBundledCode function
          chunk.code = `const getBundledCode = () => { return function(){
${chunk.code}
}(); }; export { getBundledCode };`;
        }
      }
    }
  };
}

// Vite config for bundling libraries similar to bundle-libraries.js
export default defineConfig({
  resolve: {
    alias: {
      '@slices': resolve(__dirname, 'src/store/slices'),
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/scripting/sandbox/quickjs/bundle-entry.ts'),
      name: 'LibraryBundle',
      fileName: 'bundled-libraries',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        format: 'iife',
        name: 'LibraryBundle'
      },
      plugins: [wrapInFunction()]
    },
    outDir: 'src/scripting/sandbox/quickjs',
    emptyOutDir: false,
  },
  define: {
    global: 'globalThis'
  }
});
