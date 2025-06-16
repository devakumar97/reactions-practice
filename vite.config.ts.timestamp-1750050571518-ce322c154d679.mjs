// vite.config.ts
import { vitePlugin as remix } from "file:///D:/playground/drizzle/reactions-practice/node_modules/@remix-run/dev/dist/index.js";
import { sentryVitePlugin } from "file:///D:/playground/drizzle/reactions-practice/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import { glob } from "file:///D:/playground/drizzle/reactions-practice/node_modules/glob/dist/esm/index.js";
import { flatRoutes } from "file:///D:/playground/drizzle/reactions-practice/node_modules/remix-flat-routes/dist/index.js";
import { defineConfig } from "file:///D:/playground/drizzle/reactions-practice/node_modules/vite/dist/node/index.js";
import { envOnlyMacros } from "file:///D:/playground/drizzle/reactions-practice/node_modules/vite-env-only/dist/index.js";
var MODE = process.env.NODE_ENV;
var vite_config_default = defineConfig({
  build: {
    cssMinify: MODE === "production",
    target: "esnext",
    rollupOptions: {
      external: [/node:.*/, "fsevents"]
    },
    assetsInlineLimit: (source) => {
      if (source.endsWith("sprite.svg") || source.endsWith("favicon.svg") || source.endsWith("apple-touch-icon.png")) {
        return false;
      }
    },
    sourcemap: true
  },
  server: {
    watch: {
      ignored: ["**/playwright-report/**"]
    }
  },
  plugins: [
    envOnlyMacros(),
    // it would be really nice to have this enabled in tests, but we'll have to
    // wait until https://github.com/remix-run/remix/issues/9871 is fixed
    process.env.NODE_ENV === "test" ? null : remix({
      ignoredRouteFiles: ["**/*"],
      serverModuleFormat: "esm",
      future: {
        unstable_optimizeDeps: true,
        v3_fetcherPersist: true,
        v3_lazyRouteDiscovery: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true
      },
      routes: async (defineRoutes) => {
        return flatRoutes("routes", defineRoutes, {
          ignoredRouteFiles: [
            ".*",
            "**/*.css",
            "**/*.test.{js,jsx,ts,tsx}",
            "**/__*.*",
            // This is for server-side utilities you want to colocate
            // next to your routes without making an additional
            // directory. If you need a route that includes "server" or
            // "client" in the filename, use the escape brackets like:
            // my-route.[server].tsx
            "**/*.server.*",
            "**/*.client.*"
          ]
        });
      }
    }),
    process.env.SENTRY_AUTH_TOKEN ? sentryVitePlugin({
      disable: MODE !== "production",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      release: {
        name: process.env.COMMIT_SHA,
        setCommits: {
          auto: true
        }
      },
      sourcemaps: {
        filesToDeleteAfterUpload: await glob([
          "./build/**/*.map",
          ".server-build/**/*.map"
        ])
      }
    }) : null
  ],
  test: {
    include: ["./app/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup/setup-test-env.ts"],
    globalSetup: ["./tests/setup/global-setup.ts"],
    restoreMocks: true,
    coverage: {
      include: ["app/**/*.{ts,tsx}"],
      all: true
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxwbGF5Z3JvdW5kXFxcXGRyaXp6bGVcXFxccmVhY3Rpb25zLXByYWN0aWNlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxwbGF5Z3JvdW5kXFxcXGRyaXp6bGVcXFxccmVhY3Rpb25zLXByYWN0aWNlXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9wbGF5Z3JvdW5kL2RyaXp6bGUvcmVhY3Rpb25zLXByYWN0aWNlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgdml0ZVBsdWdpbiBhcyByZW1peCB9IGZyb20gJ0ByZW1peC1ydW4vZGV2J1xyXG5pbXBvcnQgeyBzZW50cnlWaXRlUGx1Z2luIH0gZnJvbSAnQHNlbnRyeS92aXRlLXBsdWdpbidcclxuaW1wb3J0IHsgZ2xvYiB9IGZyb20gJ2dsb2InXHJcbmltcG9ydCB7IGZsYXRSb3V0ZXMgfSBmcm9tICdyZW1peC1mbGF0LXJvdXRlcydcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHsgZW52T25seU1hY3JvcyB9IGZyb20gJ3ZpdGUtZW52LW9ubHknXHJcblxyXG5jb25zdCBNT0RFID0gcHJvY2Vzcy5lbnYuTk9ERV9FTlZcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcblx0YnVpbGQ6IHtcclxuXHRcdGNzc01pbmlmeTogTU9ERSA9PT0gJ3Byb2R1Y3Rpb24nLFxyXG5cdFx0dGFyZ2V0OiAnZXNuZXh0JyxcclxuXHRcdHJvbGx1cE9wdGlvbnM6IHtcclxuXHRcdFx0ZXh0ZXJuYWw6IFsvbm9kZTouKi8sICdmc2V2ZW50cyddLFxyXG5cdFx0fSxcclxuXHJcblx0XHRhc3NldHNJbmxpbmVMaW1pdDogKHNvdXJjZTogc3RyaW5nKSA9PiB7XHJcblx0XHRcdGlmIChcclxuXHRcdFx0XHRzb3VyY2UuZW5kc1dpdGgoJ3Nwcml0ZS5zdmcnKSB8fFxyXG5cdFx0XHRcdHNvdXJjZS5lbmRzV2l0aCgnZmF2aWNvbi5zdmcnKSB8fFxyXG5cdFx0XHRcdHNvdXJjZS5lbmRzV2l0aCgnYXBwbGUtdG91Y2gtaWNvbi5wbmcnKVxyXG5cdFx0XHQpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHJcblx0XHRzb3VyY2VtYXA6IHRydWUsXHJcblx0fSxcclxuXHRzZXJ2ZXI6IHtcclxuXHRcdHdhdGNoOiB7XHJcblx0XHRcdGlnbm9yZWQ6IFsnKiovcGxheXdyaWdodC1yZXBvcnQvKionXSxcclxuXHRcdH0sXHJcblx0fSxcclxuXHRwbHVnaW5zOiBbXHJcblx0XHRlbnZPbmx5TWFjcm9zKCksXHJcblx0XHQvLyBpdCB3b3VsZCBiZSByZWFsbHkgbmljZSB0byBoYXZlIHRoaXMgZW5hYmxlZCBpbiB0ZXN0cywgYnV0IHdlJ2xsIGhhdmUgdG9cclxuXHRcdC8vIHdhaXQgdW50aWwgaHR0cHM6Ly9naXRodWIuY29tL3JlbWl4LXJ1bi9yZW1peC9pc3N1ZXMvOTg3MSBpcyBmaXhlZFxyXG5cdFx0cHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICd0ZXN0J1xyXG5cdFx0XHQ/IG51bGxcclxuXHRcdFx0OiByZW1peCh7XHJcblx0XHRcdFx0XHRpZ25vcmVkUm91dGVGaWxlczogWycqKi8qJ10sXHJcblx0XHRcdFx0XHRzZXJ2ZXJNb2R1bGVGb3JtYXQ6ICdlc20nLFxyXG5cdFx0XHRcdFx0ZnV0dXJlOiB7XHJcblx0XHRcdFx0XHRcdHVuc3RhYmxlX29wdGltaXplRGVwczogdHJ1ZSxcclxuXHRcdFx0XHRcdFx0djNfZmV0Y2hlclBlcnNpc3Q6IHRydWUsXHJcblx0XHRcdFx0XHRcdHYzX2xhenlSb3V0ZURpc2NvdmVyeTogdHJ1ZSxcclxuXHRcdFx0XHRcdFx0djNfcmVsYXRpdmVTcGxhdFBhdGg6IHRydWUsXHJcblx0XHRcdFx0XHRcdHYzX3Rocm93QWJvcnRSZWFzb246IHRydWUsXHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0cm91dGVzOiBhc3luYyAoZGVmaW5lUm91dGVzKSA9PiB7XHJcblx0XHRcdFx0XHRcdHJldHVybiBmbGF0Um91dGVzKCdyb3V0ZXMnLCBkZWZpbmVSb3V0ZXMsIHtcclxuXHRcdFx0XHRcdFx0XHRpZ25vcmVkUm91dGVGaWxlczogW1xyXG5cdFx0XHRcdFx0XHRcdFx0Jy4qJyxcclxuXHRcdFx0XHRcdFx0XHRcdCcqKi8qLmNzcycsXHJcblx0XHRcdFx0XHRcdFx0XHQnKiovKi50ZXN0Lntqcyxqc3gsdHMsdHN4fScsXHJcblx0XHRcdFx0XHRcdFx0XHQnKiovX18qLionLFxyXG5cdFx0XHRcdFx0XHRcdFx0Ly8gVGhpcyBpcyBmb3Igc2VydmVyLXNpZGUgdXRpbGl0aWVzIHlvdSB3YW50IHRvIGNvbG9jYXRlXHJcblx0XHRcdFx0XHRcdFx0XHQvLyBuZXh0IHRvIHlvdXIgcm91dGVzIHdpdGhvdXQgbWFraW5nIGFuIGFkZGl0aW9uYWxcclxuXHRcdFx0XHRcdFx0XHRcdC8vIGRpcmVjdG9yeS4gSWYgeW91IG5lZWQgYSByb3V0ZSB0aGF0IGluY2x1ZGVzIFwic2VydmVyXCIgb3JcclxuXHRcdFx0XHRcdFx0XHRcdC8vIFwiY2xpZW50XCIgaW4gdGhlIGZpbGVuYW1lLCB1c2UgdGhlIGVzY2FwZSBicmFja2V0cyBsaWtlOlxyXG5cdFx0XHRcdFx0XHRcdFx0Ly8gbXktcm91dGUuW3NlcnZlcl0udHN4XHJcblx0XHRcdFx0XHRcdFx0XHQnKiovKi5zZXJ2ZXIuKicsXHJcblx0XHRcdFx0XHRcdFx0XHQnKiovKi5jbGllbnQuKicsXHJcblx0XHRcdFx0XHRcdFx0XSxcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0fSksXHJcblx0XHRwcm9jZXNzLmVudi5TRU5UUllfQVVUSF9UT0tFTlxyXG5cdFx0XHQ/IHNlbnRyeVZpdGVQbHVnaW4oe1xyXG5cdFx0XHRcdFx0ZGlzYWJsZTogTU9ERSAhPT0gJ3Byb2R1Y3Rpb24nLFxyXG5cdFx0XHRcdFx0YXV0aFRva2VuOiBwcm9jZXNzLmVudi5TRU5UUllfQVVUSF9UT0tFTixcclxuXHRcdFx0XHRcdG9yZzogcHJvY2Vzcy5lbnYuU0VOVFJZX09SRyxcclxuXHRcdFx0XHRcdHByb2plY3Q6IHByb2Nlc3MuZW52LlNFTlRSWV9QUk9KRUNULFxyXG5cdFx0XHRcdFx0cmVsZWFzZToge1xyXG5cdFx0XHRcdFx0XHRuYW1lOiBwcm9jZXNzLmVudi5DT01NSVRfU0hBLFxyXG5cdFx0XHRcdFx0XHRzZXRDb21taXRzOiB7XHJcblx0XHRcdFx0XHRcdFx0YXV0bzogdHJ1ZSxcclxuXHRcdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRzb3VyY2VtYXBzOiB7XHJcblx0XHRcdFx0XHRcdGZpbGVzVG9EZWxldGVBZnRlclVwbG9hZDogYXdhaXQgZ2xvYihbXHJcblx0XHRcdFx0XHRcdFx0Jy4vYnVpbGQvKiovKi5tYXAnLFxyXG5cdFx0XHRcdFx0XHRcdCcuc2VydmVyLWJ1aWxkLyoqLyoubWFwJyxcclxuXHRcdFx0XHRcdFx0XSksXHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdDogbnVsbCxcclxuXHRdLFxyXG5cdHRlc3Q6IHtcclxuXHRcdGluY2x1ZGU6IFsnLi9hcHAvKiovKi50ZXN0Lnt0cyx0c3h9J10sXHJcblx0XHRzZXR1cEZpbGVzOiBbJy4vdGVzdHMvc2V0dXAvc2V0dXAtdGVzdC1lbnYudHMnXSxcclxuXHRcdGdsb2JhbFNldHVwOiBbJy4vdGVzdHMvc2V0dXAvZ2xvYmFsLXNldHVwLnRzJ10sXHJcblx0XHRyZXN0b3JlTW9ja3M6IHRydWUsXHJcblx0XHRjb3ZlcmFnZToge1xyXG5cdFx0XHRpbmNsdWRlOiBbJ2FwcC8qKi8qLnt0cyx0c3h9J10sXHJcblx0XHRcdGFsbDogdHJ1ZSxcclxuXHRcdH0sXHJcblx0fSxcclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrVCxTQUFTLGNBQWMsYUFBYTtBQUN0VixTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLFlBQVk7QUFDckIsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxxQkFBcUI7QUFFOUIsSUFBTSxPQUFPLFFBQVEsSUFBSTtBQUV6QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMzQixPQUFPO0FBQUEsSUFDTixXQUFXLFNBQVM7QUFBQSxJQUNwQixRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDZCxVQUFVLENBQUMsV0FBVyxVQUFVO0FBQUEsSUFDakM7QUFBQSxJQUVBLG1CQUFtQixDQUFDLFdBQW1CO0FBQ3RDLFVBQ0MsT0FBTyxTQUFTLFlBQVksS0FDNUIsT0FBTyxTQUFTLGFBQWEsS0FDN0IsT0FBTyxTQUFTLHNCQUFzQixHQUNyQztBQUNELGVBQU87QUFBQSxNQUNSO0FBQUEsSUFDRDtBQUFBLElBRUEsV0FBVztBQUFBLEVBQ1o7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNOLFNBQVMsQ0FBQyx5QkFBeUI7QUFBQSxJQUNwQztBQUFBLEVBQ0Q7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNSLGNBQWM7QUFBQTtBQUFBO0FBQUEsSUFHZCxRQUFRLElBQUksYUFBYSxTQUN0QixPQUNBLE1BQU07QUFBQSxNQUNOLG1CQUFtQixDQUFDLE1BQU07QUFBQSxNQUMxQixvQkFBb0I7QUFBQSxNQUNwQixRQUFRO0FBQUEsUUFDUCx1QkFBdUI7QUFBQSxRQUN2QixtQkFBbUI7QUFBQSxRQUNuQix1QkFBdUI7QUFBQSxRQUN2QixzQkFBc0I7QUFBQSxRQUN0QixxQkFBcUI7QUFBQSxNQUN0QjtBQUFBLE1BQ0EsUUFBUSxPQUFPLGlCQUFpQjtBQUMvQixlQUFPLFdBQVcsVUFBVSxjQUFjO0FBQUEsVUFDekMsbUJBQW1CO0FBQUEsWUFDbEI7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFNQTtBQUFBLFlBQ0E7QUFBQSxVQUNEO0FBQUEsUUFDRCxDQUFDO0FBQUEsTUFDRjtBQUFBLElBQ0QsQ0FBQztBQUFBLElBQ0gsUUFBUSxJQUFJLG9CQUNULGlCQUFpQjtBQUFBLE1BQ2pCLFNBQVMsU0FBUztBQUFBLE1BQ2xCLFdBQVcsUUFBUSxJQUFJO0FBQUEsTUFDdkIsS0FBSyxRQUFRLElBQUk7QUFBQSxNQUNqQixTQUFTLFFBQVEsSUFBSTtBQUFBLE1BQ3JCLFNBQVM7QUFBQSxRQUNSLE1BQU0sUUFBUSxJQUFJO0FBQUEsUUFDbEIsWUFBWTtBQUFBLFVBQ1gsTUFBTTtBQUFBLFFBQ1A7QUFBQSxNQUNEO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDWCwwQkFBMEIsTUFBTSxLQUFLO0FBQUEsVUFDcEM7QUFBQSxVQUNBO0FBQUEsUUFDRCxDQUFDO0FBQUEsTUFDRjtBQUFBLElBQ0QsQ0FBQyxJQUNBO0FBQUEsRUFDSjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0wsU0FBUyxDQUFDLDBCQUEwQjtBQUFBLElBQ3BDLFlBQVksQ0FBQyxpQ0FBaUM7QUFBQSxJQUM5QyxhQUFhLENBQUMsK0JBQStCO0FBQUEsSUFDN0MsY0FBYztBQUFBLElBQ2QsVUFBVTtBQUFBLE1BQ1QsU0FBUyxDQUFDLG1CQUFtQjtBQUFBLE1BQzdCLEtBQUs7QUFBQSxJQUNOO0FBQUEsRUFDRDtBQUNELENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
