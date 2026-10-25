import { handleMcpRequest } from "./_lib/handler.js";

export const config = {
  maxDuration: 30,
};

/**
 * Universal Vercel Serverless Function handler.
 * Seamlessly adapts between Vercel's Node.js runtime (req, res) and Web Standard (Request => Response).
 */
export default async function handler(req: any, res?: any) {
  // Case A: Web Standard fetch-style API (e.g. Edge runtime or test harnesses)
  if (!res && req instanceof Request) {
    return handleMcpRequest(req);
  }

  // Case B: Node.js Serverless runtime (req: IncomingMessage, res: ServerResponse)
  try {
    const host = req.headers?.["x-forwarded-host"] || req.headers?.host || "localhost";
    const proto = req.headers?.["x-forwarded-proto"] || "https";
    const fullUrl = `${proto}://${host}${req.url || "/api/mcp"}`;

    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers || {})) {
      if (Array.isArray(val)) {
        val.forEach((v) => headers.append(key, v));
      } else if (typeof val === "string") {
        headers.set(key, val);
      }
    }

    let requestBody: any = undefined;
    if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
      if (req.body !== undefined && req.body !== null) {
        requestBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      } else if (typeof req.on === "function") {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        }
        if (chunks.length > 0) {
          requestBody = Buffer.concat(chunks).toString("utf-8");
        }
      }
    }

    const webReq = new Request(fullUrl, {
      method: req.method,
      headers,
      body: requestBody,
    });

    const webRes = await handleMcpRequest(webReq);

    res.statusCode = webRes.status;
    webRes.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    const responseText = await webRes.text();
    res.end(responseText);
  } catch (err: any) {
    if (res && !res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32603, message: err?.message || "Internal server error" },
        })
      );
    }
  }
}
