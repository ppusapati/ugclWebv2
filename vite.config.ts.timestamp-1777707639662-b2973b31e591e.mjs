// vite.config.ts
import { defineConfig } from "file:///E:/Maheshwari/UGCL/web/ugclWebv2/node_modules/vite/dist/node/index.js";
import { qwikVite } from "file:///E:/Maheshwari/UGCL/web/ugclWebv2/node_modules/@builder.io/qwik/dist/optimizer.mjs";
import { qwikCity } from "file:///E:/Maheshwari/UGCL/web/ugclWebv2/node_modules/@builder.io/qwik-city/lib/vite/index.mjs";
import tsconfigPaths from "file:///E:/Maheshwari/UGCL/web/ugclWebv2/node_modules/vite-tsconfig-paths/dist/index.mjs";

// package.json
var package_default = {
  name: "sree-ugcl",
  description: "Blank project with routing included",
  engines: {
    node: "^18.17.0 || ^20.3.0 || >=21.0.0"
  },
  "engines-annotation": "Mostly required by sharp which needs a Node-API v9 compatible runtime",
  packageManager: "pnpm@10.33.2",
  private: true,
  type: "module",
  scripts: {
    build: "qwik build",
    "build.lint": "pnpm lint",
    "build.client": "vite build",
    "build.preview": "vite build --ssr src/entry.preview.tsx",
    "build.server": "vite build -c adapters/cloud-run/vite.config.ts",
    "build.types": "tsc --incremental --noEmit",
    deploy: "gcloud run deploy ugcl-web --source . --project=ugcl-461407",
    dev: "vite --mode ssr",
    "dev.debug": "node --inspect-brk ./node_modules/vite/bin/vite.js --mode ssr --force",
    fmt: "prettier --write .",
    "fmt.check": "prettier --check .",
    "css:audit": "node scripts/css-audit.mjs",
    "css:enforce": "pnpm run css:audit",
    lint: 'eslint "src/**/*.ts*"',
    preview: "qwik build preview && vite preview --open",
    serve: "wrangler pages dev ./dist --compatibility-flags=nodejs_als",
    ssr: "vite build && vite build --ssr src/entry.ssr.tsx",
    start: "node dist/server.js",
    "test:unit": "vitest run src/config/route-registry.test.ts",
    qwik: "qwik"
  },
  devDependencies: {
    "@builder.io/qwik": "^1.19.2",
    "@builder.io/qwik-city": "^1.19.2",
    "@eslint/js": "latest",
    "@iconify-json/heroicons": "^1.2.3",
    "@modular-forms/qwik": "^0.29.1",
    "@types/node": "^20.14.11",
    "@unocss/preset-icons": "^66.6.8",
    "@unocss/preset-tagify": "^66.6.8",
    "@unocss/preset-uno": "^66.6.8",
    eslint: "9.25.1",
    "eslint-plugin-qwik": "^1.19.2",
    globals: "16.0.0",
    madge: "^8.0.0",
    prettier: "3.8.3",
    quill: "^2.0.3",
    typescript: "5.4.5",
    "typescript-eslint": "8.59.0",
    undici: "*",
    unocss: "^66.6.8",
    vite: "5.4.21",
    "vite-tsconfig-paths": "^4.2.1",
    vitest: "1.6.0",
    wrangler: "^3.0.0"
  },
  dependencies: {
    "@unocss/core": "^66.6.8",
    clsx: "^2.1.1",
    echarts: "^5.6.0",
    jspdf: "^3.0.1",
    "jspdf-autotable": "^5.0.7",
    mammoth: "^1.12.0",
    "maplibre-gl": "^4.7.1",
    xlsx: "^0.18.5"
  }
};

// vite.config.ts
import UnoCSS from "file:///E:/Maheshwari/UGCL/web/ugclWebv2/node_modules/unocss/dist/vite.mjs";
import path from "path";
var __vite_injected_original_dirname = "E:\\Maheshwari\\UGCL\\web\\ugclWebv2";
var { dependencies = {}, devDependencies = {} } = package_default;
errorOnDuplicatesPkgDeps(devDependencies, dependencies);
var vite_config_default = defineConfig(({ command, mode }) => {
  return {
    plugins: [qwikCity(), qwikVite(), tsconfigPaths(), UnoCSS()],
    resolve: {
      alias: {
        "~": path.resolve(__vite_injected_original_dirname, "src")
      }
    },
    // This tells Vite which dependencies to pre-build in dev mode.
    optimizeDeps: {
      // Put problematic deps that break bundling here, mostly those with binaries.
      // For example ['better-sqlite3'] if you use that in server functions.
      exclude: ["echarts", "xlsx", "maplibre-gl", "jspdf", "jspdf-autotable", "quill"]
      // disabled: true,
    },
    // Mark maplibre-gl as external for SSR to avoid bundling issues
    ssr: {
      external: ["maplibre-gl"],
      noExternal: []
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true
      },
      // Improve build performance
      target: "esnext",
      minify: "esbuild",
      // Reduce source map overhead
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("echarts")) return "vendor-echarts";
            if (id.includes("xlsx") || id.includes("jspdf") || id.includes("jspdf-autotable")) return "vendor-export";
            if (id.includes("quill")) return "vendor-editor";
            if (id.includes("maplibre-gl")) return "vendor-map";
            if (id.includes("@builder.io/qwik")) return "vendor-qwik";
            return "vendor";
          }
        }
      }
    },
    /**
     * This is an advanced setting. It improves the bundling of your server code. To use it, make sure you understand when your consumed packages are dependencies or dev dependencies. (otherwise things will break in production)
     */
    // ssr:
    //   command === "build" && mode === "production"
    //     ? {
    //         // All dev dependencies should be bundled in the server build
    //         noExternal: Object.keys(devDependencies),
    //         // Anything marked as a dependency will not be bundled
    //         // These should only be production binary deps (including deps of deps), CLI deps, and their module graph
    //         // If a dep-of-dep needs to be external, add it here
    //         // For example, if something uses `bcrypt` but you don't have it as a dep, you can write
    //         // external: [...Object.keys(dependencies), 'bcrypt']
    //         external: Object.keys(dependencies),
    //       }
    //     : undefined,
    server: {
      proxy: {
        "/api": "http://localhost:8080/"
      },
      headers: {
        // Don't cache the server response in dev mode
        "x-api-key": "87339ea3-1add-4689-ae57-3128ebd03c4f",
        "Cache-Control": "public, max-age=0"
      }
    },
    preview: {
      headers: {
        // Do cache the server response in preview (non-adapter production build)
        "Cache-Control": "public, max-age=600"
      }
    }
  };
});
function errorOnDuplicatesPkgDeps(devDependencies2, dependencies2) {
  let msg = "";
  const duplicateDeps = Object.keys(devDependencies2).filter(
    (dep) => dependencies2[dep]
  );
  const qwikPkg = Object.keys(dependencies2).filter(
    (value) => /qwik/i.test(value)
  );
  msg = `Move qwik packages ${qwikPkg.join(", ")} to devDependencies`;
  if (qwikPkg.length > 0) {
    throw new Error(msg);
  }
  msg = `
    Warning: The dependency "${duplicateDeps.join(", ")}" is listed in both "devDependencies" and "dependencies".
    Please move the duplicated dependencies to "devDependencies" only and remove it from "dependencies"
  `;
  if (duplicateDeps.length > 0) {
    throw new Error(msg);
  }
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcTWFoZXNod2FyaVxcXFxVR0NMXFxcXHdlYlxcXFx1Z2NsV2VidjJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXE1haGVzaHdhcmlcXFxcVUdDTFxcXFx3ZWJcXFxcdWdjbFdlYnYyXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9NYWhlc2h3YXJpL1VHQ0wvd2ViL3VnY2xXZWJ2Mi92aXRlLmNvbmZpZy50c1wiOy8qKlxyXG4gKiBUaGlzIGlzIHRoZSBiYXNlIGNvbmZpZyBmb3Igdml0ZS5cclxuICogV2hlbiBidWlsZGluZywgdGhlIGFkYXB0ZXIgY29uZmlnIGlzIHVzZWQgd2hpY2ggbG9hZHMgdGhpcyBmaWxlIGFuZCBleHRlbmRzIGl0LlxyXG4gKi9cclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCB0eXBlIFVzZXJDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgeyBxd2lrVml0ZSB9IGZyb20gXCJAYnVpbGRlci5pby9xd2lrL29wdGltaXplclwiO1xyXG5pbXBvcnQgeyBxd2lrQ2l0eSB9IGZyb20gXCJAYnVpbGRlci5pby9xd2lrLWNpdHkvdml0ZVwiO1xyXG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xyXG5pbXBvcnQgcGtnIGZyb20gXCIuL3BhY2thZ2UuanNvblwiO1xyXG5pbXBvcnQgVW5vQ1NTIGZyb20gJ3Vub2Nzcy92aXRlJztcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuXHJcbnR5cGUgUGtnRGVwID0gUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcclxuY29uc3QgeyBkZXBlbmRlbmNpZXMgPSB7fSwgZGV2RGVwZW5kZW5jaWVzID0ge30gfSA9IHBrZyBhcyBhbnkgYXMge1xyXG4gIGRlcGVuZGVuY2llczogUGtnRGVwO1xyXG4gIGRldkRlcGVuZGVuY2llczogUGtnRGVwO1xyXG4gIFtrZXk6IHN0cmluZ106IHVua25vd247XHJcbn07XHJcbmVycm9yT25EdXBsaWNhdGVzUGtnRGVwcyhkZXZEZXBlbmRlbmNpZXMsIGRlcGVuZGVuY2llcyk7XHJcblxyXG4vKipcclxuICogTm90ZSB0aGF0IFZpdGUgbm9ybWFsbHkgc3RhcnRzIGZyb20gYGluZGV4Lmh0bWxgIGJ1dCB0aGUgcXdpa0NpdHkgcGx1Z2luIG1ha2VzIHN0YXJ0IGF0IGBzcmMvZW50cnkuc3NyLnRzeGAgaW5zdGVhZC5cclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBjb21tYW5kLCBtb2RlIH0pOiBVc2VyQ29uZmlnID0+IHtcclxuICByZXR1cm4ge1xyXG4gICAgcGx1Z2luczogW3F3aWtDaXR5KCksIHF3aWtWaXRlKCksIHRzY29uZmlnUGF0aHMoKSwgVW5vQ1NTKCldLFxyXG4gICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnfic6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICAgIC8vIFRoaXMgdGVsbHMgVml0ZSB3aGljaCBkZXBlbmRlbmNpZXMgdG8gcHJlLWJ1aWxkIGluIGRldiBtb2RlLlxyXG4gICAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICAgIC8vIFB1dCBwcm9ibGVtYXRpYyBkZXBzIHRoYXQgYnJlYWsgYnVuZGxpbmcgaGVyZSwgbW9zdGx5IHRob3NlIHdpdGggYmluYXJpZXMuXHJcbiAgICAgIC8vIEZvciBleGFtcGxlIFsnYmV0dGVyLXNxbGl0ZTMnXSBpZiB5b3UgdXNlIHRoYXQgaW4gc2VydmVyIGZ1bmN0aW9ucy5cclxuICAgICAgZXhjbHVkZTogWydlY2hhcnRzJywgJ3hsc3gnLCAnbWFwbGlicmUtZ2wnLCAnanNwZGYnLCAnanNwZGYtYXV0b3RhYmxlJywgJ3F1aWxsJ10sXHJcbiAgICAgIC8vIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgfSxcclxuICAgIC8vIE1hcmsgbWFwbGlicmUtZ2wgYXMgZXh0ZXJuYWwgZm9yIFNTUiB0byBhdm9pZCBidW5kbGluZyBpc3N1ZXNcclxuICAgIHNzcjoge1xyXG4gICAgICBleHRlcm5hbDogWydtYXBsaWJyZS1nbCddLFxyXG4gICAgICBub0V4dGVybmFsOiBbXSxcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICBjb21tb25qc09wdGlvbnM6IHtcclxuICAgICAgICB0cmFuc2Zvcm1NaXhlZEVzTW9kdWxlczogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgICAgLy8gSW1wcm92ZSBidWlsZCBwZXJmb3JtYW5jZVxyXG4gICAgICB0YXJnZXQ6ICdlc25leHQnLFxyXG4gICAgICBtaW5pZnk6ICdlc2J1aWxkJyxcclxuICAgICAgLy8gUmVkdWNlIHNvdXJjZSBtYXAgb3ZlcmhlYWRcclxuICAgICAgc291cmNlbWFwOiBmYWxzZSxcclxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA5MDAsXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xyXG4gICAgICAgICAgICBpZiAoIWlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdlY2hhcnRzJykpIHJldHVybiAndmVuZG9yLWVjaGFydHMnO1xyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3hsc3gnKSB8fCBpZC5pbmNsdWRlcygnanNwZGYnKSB8fCBpZC5pbmNsdWRlcygnanNwZGYtYXV0b3RhYmxlJykpIHJldHVybiAndmVuZG9yLWV4cG9ydCc7XHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncXVpbGwnKSkgcmV0dXJuICd2ZW5kb3ItZWRpdG9yJztcclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdtYXBsaWJyZS1nbCcpKSByZXR1cm4gJ3ZlbmRvci1tYXAnO1xyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0BidWlsZGVyLmlvL3F3aWsnKSkgcmV0dXJuICd2ZW5kb3ItcXdpayc7XHJcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yJztcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIGlzIGFuIGFkdmFuY2VkIHNldHRpbmcuIEl0IGltcHJvdmVzIHRoZSBidW5kbGluZyBvZiB5b3VyIHNlcnZlciBjb2RlLiBUbyB1c2UgaXQsIG1ha2Ugc3VyZSB5b3UgdW5kZXJzdGFuZCB3aGVuIHlvdXIgY29uc3VtZWQgcGFja2FnZXMgYXJlIGRlcGVuZGVuY2llcyBvciBkZXYgZGVwZW5kZW5jaWVzLiAob3RoZXJ3aXNlIHRoaW5ncyB3aWxsIGJyZWFrIGluIHByb2R1Y3Rpb24pXHJcbiAgICAgKi9cclxuICAgIC8vIHNzcjpcclxuICAgIC8vICAgY29tbWFuZCA9PT0gXCJidWlsZFwiICYmIG1vZGUgPT09IFwicHJvZHVjdGlvblwiXHJcbiAgICAvLyAgICAgPyB7XHJcbiAgICAvLyAgICAgICAgIC8vIEFsbCBkZXYgZGVwZW5kZW5jaWVzIHNob3VsZCBiZSBidW5kbGVkIGluIHRoZSBzZXJ2ZXIgYnVpbGRcclxuICAgIC8vICAgICAgICAgbm9FeHRlcm5hbDogT2JqZWN0LmtleXMoZGV2RGVwZW5kZW5jaWVzKSxcclxuICAgIC8vICAgICAgICAgLy8gQW55dGhpbmcgbWFya2VkIGFzIGEgZGVwZW5kZW5jeSB3aWxsIG5vdCBiZSBidW5kbGVkXHJcbiAgICAvLyAgICAgICAgIC8vIFRoZXNlIHNob3VsZCBvbmx5IGJlIHByb2R1Y3Rpb24gYmluYXJ5IGRlcHMgKGluY2x1ZGluZyBkZXBzIG9mIGRlcHMpLCBDTEkgZGVwcywgYW5kIHRoZWlyIG1vZHVsZSBncmFwaFxyXG4gICAgLy8gICAgICAgICAvLyBJZiBhIGRlcC1vZi1kZXAgbmVlZHMgdG8gYmUgZXh0ZXJuYWwsIGFkZCBpdCBoZXJlXHJcbiAgICAvLyAgICAgICAgIC8vIEZvciBleGFtcGxlLCBpZiBzb21ldGhpbmcgdXNlcyBgYmNyeXB0YCBidXQgeW91IGRvbid0IGhhdmUgaXQgYXMgYSBkZXAsIHlvdSBjYW4gd3JpdGVcclxuICAgIC8vICAgICAgICAgLy8gZXh0ZXJuYWw6IFsuLi5PYmplY3Qua2V5cyhkZXBlbmRlbmNpZXMpLCAnYmNyeXB0J11cclxuICAgIC8vICAgICAgICAgZXh0ZXJuYWw6IE9iamVjdC5rZXlzKGRlcGVuZGVuY2llcyksXHJcbiAgICAvLyAgICAgICB9XHJcbiAgICAvLyAgICAgOiB1bmRlZmluZWQsXHJcblxyXG4gICAgc2VydmVyOiB7XHJcbiAgcHJveHk6IHtcclxuICAgICcvYXBpJzogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MC8nLFxyXG4gIH0sXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAvLyBEb24ndCBjYWNoZSB0aGUgc2VydmVyIHJlc3BvbnNlIGluIGRldiBtb2RlXHJcbiAgICAgICAgJ3gtYXBpLWtleSc6ICc4NzMzOWVhMy0xYWRkLTQ2ODktYWU1Ny0zMTI4ZWJkMDNjNGYnLFxyXG4gICAgICAgIFwiQ2FjaGUtQ29udHJvbFwiOiBcInB1YmxpYywgbWF4LWFnZT0wXCIsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgcHJldmlldzoge1xyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgLy8gRG8gY2FjaGUgdGhlIHNlcnZlciByZXNwb25zZSBpbiBwcmV2aWV3IChub24tYWRhcHRlciBwcm9kdWN0aW9uIGJ1aWxkKVxyXG4gICAgICAgIFwiQ2FjaGUtQ29udHJvbFwiOiBcInB1YmxpYywgbWF4LWFnZT02MDBcIixcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfTtcclxufSk7XHJcblxyXG4vLyAqKiogdXRpbHMgKioqXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gaWRlbnRpZnkgZHVwbGljYXRlIGRlcGVuZGVuY2llcyBhbmQgdGhyb3cgYW4gZXJyb3JcclxuICogQHBhcmFtIHtPYmplY3R9IGRldkRlcGVuZGVuY2llcyAtIExpc3Qgb2YgZGV2ZWxvcG1lbnQgZGVwZW5kZW5jaWVzXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZXBlbmRlbmNpZXMgLSBMaXN0IG9mIHByb2R1Y3Rpb24gZGVwZW5kZW5jaWVzXHJcbiAqL1xyXG5mdW5jdGlvbiBlcnJvck9uRHVwbGljYXRlc1BrZ0RlcHMoXHJcbiAgZGV2RGVwZW5kZW5jaWVzOiBQa2dEZXAsXHJcbiAgZGVwZW5kZW5jaWVzOiBQa2dEZXAsXHJcbikge1xyXG4gIGxldCBtc2cgPSBcIlwiO1xyXG4gIC8vIENyZWF0ZSBhbiBhcnJheSAnZHVwbGljYXRlRGVwcycgYnkgZmlsdGVyaW5nIGRldkRlcGVuZGVuY2llcy5cclxuICAvLyBJZiBhIGRlcGVuZGVuY3kgYWxzbyBleGlzdHMgaW4gZGVwZW5kZW5jaWVzLCBpdCBpcyBjb25zaWRlcmVkIGEgZHVwbGljYXRlLlxyXG4gIGNvbnN0IGR1cGxpY2F0ZURlcHMgPSBPYmplY3Qua2V5cyhkZXZEZXBlbmRlbmNpZXMpLmZpbHRlcihcclxuICAgIChkZXApID0+IGRlcGVuZGVuY2llc1tkZXBdLFxyXG4gICk7XHJcblxyXG4gIC8vIGluY2x1ZGUgYW55IGtub3duIHF3aWsgcGFja2FnZXNcclxuICBjb25zdCBxd2lrUGtnID0gT2JqZWN0LmtleXMoZGVwZW5kZW5jaWVzKS5maWx0ZXIoKHZhbHVlKSA9PlxyXG4gICAgL3F3aWsvaS50ZXN0KHZhbHVlKSxcclxuICApO1xyXG5cclxuICAvLyBhbnkgZXJyb3JzIGZvciBtaXNzaW5nIFwicXdpay1jaXR5LXBsYW5cIlxyXG4gIC8vIFtQTFVHSU5fRVJST1JdOiBJbnZhbGlkIG1vZHVsZSBcIkBxd2lrLWNpdHktcGxhblwiIGlzIG5vdCBhIHZhbGlkIHBhY2thZ2VcclxuICBtc2cgPSBgTW92ZSBxd2lrIHBhY2thZ2VzICR7cXdpa1BrZy5qb2luKFwiLCBcIil9IHRvIGRldkRlcGVuZGVuY2llc2A7XHJcblxyXG4gIGlmIChxd2lrUGtnLmxlbmd0aCA+IDApIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xyXG4gIH1cclxuXHJcbiAgLy8gRm9ybWF0IHRoZSBlcnJvciBtZXNzYWdlIHdpdGggdGhlIGR1cGxpY2F0ZXMgbGlzdC5cclxuICAvLyBUaGUgYGpvaW5gIGZ1bmN0aW9uIGlzIHVzZWQgdG8gcmVwcmVzZW50IHRoZSBlbGVtZW50cyBvZiB0aGUgJ2R1cGxpY2F0ZURlcHMnIGFycmF5IGFzIGEgY29tbWEtc2VwYXJhdGVkIHN0cmluZy5cclxuICBtc2cgPSBgXHJcbiAgICBXYXJuaW5nOiBUaGUgZGVwZW5kZW5jeSBcIiR7ZHVwbGljYXRlRGVwcy5qb2luKFwiLCBcIil9XCIgaXMgbGlzdGVkIGluIGJvdGggXCJkZXZEZXBlbmRlbmNpZXNcIiBhbmQgXCJkZXBlbmRlbmNpZXNcIi5cclxuICAgIFBsZWFzZSBtb3ZlIHRoZSBkdXBsaWNhdGVkIGRlcGVuZGVuY2llcyB0byBcImRldkRlcGVuZGVuY2llc1wiIG9ubHkgYW5kIHJlbW92ZSBpdCBmcm9tIFwiZGVwZW5kZW5jaWVzXCJcclxuICBgO1xyXG5cclxuICAvLyBUaHJvdyBhbiBlcnJvciB3aXRoIHRoZSBjb25zdHJ1Y3RlZCBtZXNzYWdlLlxyXG4gIGlmIChkdXBsaWNhdGVEZXBzLmxlbmd0aCA+IDApIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xyXG4gIH1cclxufVxyXG4iLCAie1xuICBcIm5hbWVcIjogXCJzcmVlLXVnY2xcIixcbiAgXCJkZXNjcmlwdGlvblwiOiBcIkJsYW5rIHByb2plY3Qgd2l0aCByb3V0aW5nIGluY2x1ZGVkXCIsXG4gIFwiZW5naW5lc1wiOiB7XG4gICAgXCJub2RlXCI6IFwiXjE4LjE3LjAgfHwgXjIwLjMuMCB8fCA+PTIxLjAuMFwiXG4gIH0sXG4gIFwiZW5naW5lcy1hbm5vdGF0aW9uXCI6IFwiTW9zdGx5IHJlcXVpcmVkIGJ5IHNoYXJwIHdoaWNoIG5lZWRzIGEgTm9kZS1BUEkgdjkgY29tcGF0aWJsZSBydW50aW1lXCIsXG4gIFwicGFja2FnZU1hbmFnZXJcIjogXCJwbnBtQDEwLjMzLjJcIixcbiAgXCJwcml2YXRlXCI6IHRydWUsXG4gIFwidHlwZVwiOiBcIm1vZHVsZVwiLFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwiYnVpbGRcIjogXCJxd2lrIGJ1aWxkXCIsXG4gICAgXCJidWlsZC5saW50XCI6IFwicG5wbSBsaW50XCIsXG4gICAgXCJidWlsZC5jbGllbnRcIjogXCJ2aXRlIGJ1aWxkXCIsXG4gICAgXCJidWlsZC5wcmV2aWV3XCI6IFwidml0ZSBidWlsZCAtLXNzciBzcmMvZW50cnkucHJldmlldy50c3hcIixcbiAgICBcImJ1aWxkLnNlcnZlclwiOiBcInZpdGUgYnVpbGQgLWMgYWRhcHRlcnMvY2xvdWQtcnVuL3ZpdGUuY29uZmlnLnRzXCIsXG4gICAgXCJidWlsZC50eXBlc1wiOiBcInRzYyAtLWluY3JlbWVudGFsIC0tbm9FbWl0XCIsXG4gICAgXCJkZXBsb3lcIjogXCJnY2xvdWQgcnVuIGRlcGxveSB1Z2NsLXdlYiAtLXNvdXJjZSAuIC0tcHJvamVjdD11Z2NsLTQ2MTQwN1wiLFxuICAgIFwiZGV2XCI6IFwidml0ZSAtLW1vZGUgc3NyXCIsXG4gICAgXCJkZXYuZGVidWdcIjogXCJub2RlIC0taW5zcGVjdC1icmsgLi9ub2RlX21vZHVsZXMvdml0ZS9iaW4vdml0ZS5qcyAtLW1vZGUgc3NyIC0tZm9yY2VcIixcbiAgICBcImZtdFwiOiBcInByZXR0aWVyIC0td3JpdGUgLlwiLFxuICAgIFwiZm10LmNoZWNrXCI6IFwicHJldHRpZXIgLS1jaGVjayAuXCIsXG4gICAgXCJjc3M6YXVkaXRcIjogXCJub2RlIHNjcmlwdHMvY3NzLWF1ZGl0Lm1qc1wiLFxuICAgIFwiY3NzOmVuZm9yY2VcIjogXCJwbnBtIHJ1biBjc3M6YXVkaXRcIixcbiAgICBcImxpbnRcIjogXCJlc2xpbnQgXFxcInNyYy8qKi8qLnRzKlxcXCJcIixcbiAgICBcInByZXZpZXdcIjogXCJxd2lrIGJ1aWxkIHByZXZpZXcgJiYgdml0ZSBwcmV2aWV3IC0tb3BlblwiLFxuICAgIFwic2VydmVcIjogXCJ3cmFuZ2xlciBwYWdlcyBkZXYgLi9kaXN0IC0tY29tcGF0aWJpbGl0eS1mbGFncz1ub2RlanNfYWxzXCIsXG4gICAgXCJzc3JcIjogXCJ2aXRlIGJ1aWxkICYmIHZpdGUgYnVpbGQgLS1zc3Igc3JjL2VudHJ5LnNzci50c3hcIixcbiAgICBcInN0YXJ0XCI6IFwibm9kZSBkaXN0L3NlcnZlci5qc1wiLFxuICAgIFwidGVzdDp1bml0XCI6IFwidml0ZXN0IHJ1biBzcmMvY29uZmlnL3JvdXRlLXJlZ2lzdHJ5LnRlc3QudHNcIixcbiAgICBcInF3aWtcIjogXCJxd2lrXCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQGJ1aWxkZXIuaW8vcXdpa1wiOiBcIl4xLjE5LjJcIixcbiAgICBcIkBidWlsZGVyLmlvL3F3aWstY2l0eVwiOiBcIl4xLjE5LjJcIixcbiAgICBcIkBlc2xpbnQvanNcIjogXCJsYXRlc3RcIixcbiAgICBcIkBpY29uaWZ5LWpzb24vaGVyb2ljb25zXCI6IFwiXjEuMi4zXCIsXG4gICAgXCJAbW9kdWxhci1mb3Jtcy9xd2lrXCI6IFwiXjAuMjkuMVwiLFxuICAgIFwiQHR5cGVzL25vZGVcIjogXCJeMjAuMTQuMTFcIixcbiAgICBcIkB1bm9jc3MvcHJlc2V0LWljb25zXCI6IFwiXjY2LjYuOFwiLFxuICAgIFwiQHVub2Nzcy9wcmVzZXQtdGFnaWZ5XCI6IFwiXjY2LjYuOFwiLFxuICAgIFwiQHVub2Nzcy9wcmVzZXQtdW5vXCI6IFwiXjY2LjYuOFwiLFxuICAgIFwiZXNsaW50XCI6IFwiOS4yNS4xXCIsXG4gICAgXCJlc2xpbnQtcGx1Z2luLXF3aWtcIjogXCJeMS4xOS4yXCIsXG4gICAgXCJnbG9iYWxzXCI6IFwiMTYuMC4wXCIsXG4gICAgXCJtYWRnZVwiOiBcIl44LjAuMFwiLFxuICAgIFwicHJldHRpZXJcIjogXCIzLjguM1wiLFxuICAgIFwicXVpbGxcIjogXCJeMi4wLjNcIixcbiAgICBcInR5cGVzY3JpcHRcIjogXCI1LjQuNVwiLFxuICAgIFwidHlwZXNjcmlwdC1lc2xpbnRcIjogXCI4LjU5LjBcIixcbiAgICBcInVuZGljaVwiOiBcIipcIixcbiAgICBcInVub2Nzc1wiOiBcIl42Ni42LjhcIixcbiAgICBcInZpdGVcIjogXCI1LjQuMjFcIixcbiAgICBcInZpdGUtdHNjb25maWctcGF0aHNcIjogXCJeNC4yLjFcIixcbiAgICBcInZpdGVzdFwiOiBcIjEuNi4wXCIsXG4gICAgXCJ3cmFuZ2xlclwiOiBcIl4zLjAuMFwiXG4gIH0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkB1bm9jc3MvY29yZVwiOiBcIl42Ni42LjhcIixcbiAgICBcImNsc3hcIjogXCJeMi4xLjFcIixcbiAgICBcImVjaGFydHNcIjogXCJeNS42LjBcIixcbiAgICBcImpzcGRmXCI6IFwiXjMuMC4xXCIsXG4gICAgXCJqc3BkZi1hdXRvdGFibGVcIjogXCJeNS4wLjdcIixcbiAgICBcIm1hbW1vdGhcIjogXCJeMS4xMi4wXCIsXG4gICAgXCJtYXBsaWJyZS1nbFwiOiBcIl40LjcuMVwiLFxuICAgIFwieGxzeFwiOiBcIl4wLjE4LjVcIlxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBSUEsU0FBUyxvQkFBcUM7QUFDOUMsU0FBUyxnQkFBZ0I7QUFDekIsU0FBUyxnQkFBZ0I7QUFDekIsT0FBTyxtQkFBbUI7OztBQ1AxQjtBQUFBLEVBQ0UsTUFBUTtBQUFBLEVBQ1IsYUFBZTtBQUFBLEVBQ2YsU0FBVztBQUFBLElBQ1QsTUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLHNCQUFzQjtBQUFBLEVBQ3RCLGdCQUFrQjtB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
