/**
 * OpportunityX - Backend Server & Discovery Engine
 *
 * Runs using native Node.js (zero external dependencies).
 * Integrates TinyFish Live Search API with Authoritative Student Portals.
 * Implements two-stage Qualification-Aware Matching & Application Tracking.
 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

let PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;

// Read .env if present
function loadEnv() {
  const envPath = path.join(ROOT_DIR, ".env");
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
    } catch (err) {
      console.warn("Could not read .env file:", err.message);
    }
  }
}
loadEnv();

const { checkHealth } = require("./server/adapters/tinyfish");
const { aggregateAndDiscover } = require("./server/aggregator");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png"
};

async function requestHandler(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Favicon
  if (pathname === "/favicon.ico") {
    res.writeHead(200, { "Content-Type": "image/svg+xml" });
    res.end(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#4f46e5"/><circle cx="14" cy="14" r="6" fill="none" stroke="white" stroke-width="3"/><path d="M19 19l6 6" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>`);
    return;
  }

  // 1. Health check API (tests real live TinyFish connection)
  if (pathname === "/api/health/tinyfish" && req.method === "GET") {
    try {
      const healthReport = await checkHealth();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(healthReport));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, message: err.message }));
    }
    return;
  }

  // 2. Discover opportunities API (Multi-Source Aggregation + Qualification Matching)
  if (pathname === "/api/opportunities/discover" && req.method === "POST") {
    let bodyData = "";
    req.on("data", chunk => { bodyData += chunk; });
    req.on("end", async () => {
      try {
        const payload = bodyData ? JSON.parse(bodyData) : {};
        const responseData = await aggregateAndDiscover(payload);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(responseData));
      } catch (err) {
        console.error("Discovery error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          ok: false,
          error: {
            code: "DISCOVERY_ERROR",
            message: err.message || "Failed to aggregate opportunities"
          }
        }));
      }
    });
    return;
  }

  // 3. Static Files Serving
  let filePath = pathname === "/" ? "/index.html" : pathname;
  const safeFilePath = path.normalize(path.join(ROOT_DIR, filePath));

  // Prevent directory traversal
  if (!safeFilePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  fs.stat(safeFilePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found: " + pathname);
      return;
    }

    const ext = path.extname(safeFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    const stream = fs.createReadStream(safeFilePath);
    stream.pipe(res);
  });
}

const server = http.createServer(requestHandler);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`Port ${PORT} is in use, retrying on port ${PORT + 1}...`);
    PORT += 1;
    server.listen(PORT);
  } else {
    console.error("Server error:", err);
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n=============================================================`);
    console.log(`🚀 OpportunityX server running at: http://localhost:${PORT}`);
    console.log(`📡 TinyFish Live Search & Qualification-Aware Engine Active`);
    console.log(`=============================================================\n`);
  });
}

module.exports = requestHandler;
