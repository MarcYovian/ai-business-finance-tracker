import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { Readable } from "node:stream";

function mcpDevServerPlugin(): Plugin {
  return {
    name: "mcp-dev-server",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && (req.url === "/api/mcp" || req.url.startsWith("/api/mcp?") || req.url.startsWith("/api/mcp/"))) {
          try {
            const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (value) {
                if (Array.isArray(value)) {
                  value.forEach((v) => headers.append(key, v));
                } else {
                  headers.set(key, value);
                }
              }
            }

            const webReq = new Request(url, {
              method: req.method,
              headers,
              body:
                req.method !== "GET" && req.method !== "HEAD"
                  ? (Readable.toWeb(req) as ReadableStream<Uint8Array>)
                  : undefined,
              // @ts-expect-error duplex required in Node 18+ fetch
              duplex: "half",
            });

            const { handleMcpRequest } = await import("./api/_lib/handler.js");
            const webRes = await handleMcpRequest(webReq);

            res.statusCode = webRes.status;
            webRes.headers.forEach((val, key) => {
              res.setHeader(key, val);
            });

            if (webRes.body) {
              const reader = webRes.body.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
            }
            res.end();
          } catch (err: any) {
            console.error("MCP Dev Server Middleware Error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err.message || "Internal Server Error" }));
          }
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    server: {
      host: "::",
      port: 8080,
    },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mcpDevServerPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          recharts: ["recharts"],
          supabase: ["@supabase/supabase-js"],
          tanstack: ["@tanstack/react-query"],
        },
      },
    },
  },
};
});
