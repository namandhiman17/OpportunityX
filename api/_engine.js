/**
 * OpportunityX - Vercel Serverless Engine Gateway
 * Bridges serverless endpoints to core server modules.
 */

const path = require("node:path");
const fs = require("node:fs");

const ROOT_DIR = path.resolve(__dirname, "..");

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
    } catch {}
  }
}
loadEnv();

const { checkHealth, getApiKey } = require("../server/adapters/tinyfish");
const { aggregateAndDiscover } = require("../server/aggregator");
const { CURATED_OPPORTUNITIES } = require("../server/data/curatedCatalog");

module.exports = {
  checkHealth,
  getApiKey,
  aggregateAndDiscover,
  CURATED_OPPORTUNITIES
};
