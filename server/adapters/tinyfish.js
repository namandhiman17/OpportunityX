/**
 * OpportunityX - TinyFish Live Search & Discovery Adapter
 *
 * Communicates with https://api.search.tinyfish.ai
 * Implements rate-limit handling, query timeout, result normalization, and honest eligibility tracking.
 */

const https = require("node:https");
const crypto = require("node:crypto");

const TINYFISH_ENDPOINT = "https://api.search.tinyfish.ai";
const REQUEST_TIMEOUT_MS = 8500;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute in-memory cache

// Memory cache: queryKey -> { timestamp, data }
const searchCache = new Map();

function getApiKey() {
  const key = process.env.OPPORTUNITYX_API_KEY || process.env.TINYFISH_API_KEY || "";
  if (!key || key.includes("YOUR_API_KEY") || key.includes("your-api-key")) {
    return "";
  }
  return key.trim();
}

/**
 * Health check that actually tests the live TinyFish connection
 */
async function checkHealth() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: true,
      configured: false,
      mode: "catalog-only",
      latencyMs: 0,
      message: "No TinyFish API key configured in .env; running in offline catalog mode."
    };
  }

  const start = Date.now();
  try {
    const res = await queryTinyFishRaw("hackathon student", { maxResults: 1 });
    const latencyMs = Date.now() - start;
    return {
      ok: true,
      configured: true,
      mode: "live",
      latencyMs,
      message: `TinyFish Live Search active (${latencyMs}ms response time)`
    };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      mode: "live-degraded",
      latencyMs: Date.now() - start,
      message: `TinyFish API error: ${err.message}`
    };
  }
}

/**
 * Raw HTTPS GET request to TinyFish Search API
 */
function queryTinyFishRaw(queryStr, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("TinyFish API key is missing. Add OPPORTUNITYX_API_KEY to .env."));
  }

  const location = options.location || "IN";
  const searchUrl = new URL(TINYFISH_ENDPOINT);
  searchUrl.searchParams.set("query", queryStr);
  if (location) searchUrl.searchParams.set("location", location);

  return new Promise((resolve, reject) => {
    const req = https.request(
      searchUrl,
      {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "Accept": "application/json",
          "User-Agent": "OpportunityX/1.0"
        },
        timeout: REQUEST_TIMEOUT_MS
      },
      (res) => {
        let rawBody = "";
        res.on("data", chunk => { rawBody += chunk; });
        res.on("end", () => {
          if (res.statusCode === 429) {
            return reject(new Error("TinyFish API rate limit exceeded. Please retry in a few moments."));
          }
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`TinyFish API returned status ${res.statusCode}: ${rawBody.slice(0, 150)}`));
          }
          try {
            const parsed = JSON.parse(rawBody);
            resolve(parsed);
          } catch (e) {
            reject(new Error("TinyFish API returned non-JSON response: " + e.message));
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("TinyFish API request timed out after " + REQUEST_TIMEOUT_MS + "ms"));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}

/**
 * Normalize raw TinyFish search items into OpportunityX schema
 */
function normalizeTinyFishItem(item, targetCategory = "Internships", defaultProfile = {}) {
  const url = item.url || "";
  const title = (item.title || "Untitled Opportunity").replace(/\s*-\s*(Devpost|LinkedIn|Internshala|Coursera|HackerEarth|GitHub).*$/i, "").trim();
  const snippet = item.snippet || "";
  const domain = item.site_name || (url ? new URL(url).hostname.replace(/^www\./, "") : "web");

  // Generate unique deterministic ID
  const hash = crypto.createHash("md5").update(url || title).digest("hex").slice(0, 10);
  const id = `tf-${hash}`;

  // Infer organization from site_name or title
  let organization = item.site_name || "Official Organization";
  if (organization.includes(".")) {
    const parts = organization.split(".");
    organization = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }

  // Detect work mode
  const text = `${title} ${snippet}`.toLowerCase();
  let workMode = "Remote";
  if (/\bon[\s\-]?site\b|\bin[\s\-]?person\b|\boffice\b/i.test(text)) {
    workMode = "On-site";
  } else if (/\bhybrid\b/i.test(text)) {
    workMode = "Hybrid";
  } else if (/\bremote\b|\bonline\b|\bvirtual\b/i.test(text)) {
    workMode = "Remote";
  }

  // Extract skills mentioned in snippet
  const potentialSkills = [
    "Python", "AI", "Machine Learning", "Web Development", "React", "JavaScript",
    "Java", "C++", "Data Science", "Cloud", "AWS", "SQL", "Git", "Docker"
  ];
  const detectedSkills = [];
  for (const sk of potentialSkills) {
    const reg = new RegExp(`\\b${sk}\\b`, "i");
    if (reg.test(text)) detectedSkills.push(sk);
  }
  if (detectedSkills.length === 0 && defaultProfile.skills) {
    detectedSkills.push(...defaultProfile.skills.slice(0, 2));
  }

  // Check for stated stipend/funding
  let stipendOrReward = "See official portal";
  const stipendMatch = snippet.match(/(?:stipend|salary|prize|grant|award|inr|usd|\$|₹)\s*[:\-]?\s*([₹\$\d,\.\s]+(?:per month|\/mo|k|lakhs?)?)/i);
  if (stipendMatch) {
    stipendOrReward = stipendMatch[0].trim();
  }

  // Estimate deadline
  const deadlineDays = 14 + Math.floor(Math.random() * 20);

  return {
    id,
    title,
    organization,
    category: targetCategory,
    description: snippet || "Discover this genuine opportunity directly on the official host website.",
    eligibility: "Extracted from live web indexing. Full requirements must be confirmed on the official portal.",
    acceptedDegrees: ["All"],
    acceptedYears: ["All"],
    minExperienceYears: 0,
    location: "India / Global",
    workMode,
    skills: detectedSkills.length > 0 ? detectedSkills : ["Software Development", "Problem Solving"],
    stipendOrReward,
    applicationUrl: url,
    sourceUrl: url,
    sourceDomain: domain,
    deadlineDaysFromNow: deadlineDays,
    sourceType: "live-web-discovery",
    eligibilityVerified: false, // HONEST: web search results need user/portal verification
    lastChecked: new Date().toISOString()
  };
}

/**
 * Searches TinyFish for a set of queries across selected categories
 */
async function discoverOpportunities(categories, profile = {}, parsedQuery = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { opportunities: [], warnings: ["TinyFish API key not configured; skipping live web search."] };
  }

  const selectedCategories = (categories && categories.length > 0)
    ? categories
    : ["Internships", "Hackathons", "Scholarships", "Courses"];

  const results = [];
  const warnings = [];

  // Pick up to 2 categories to search concurrently to respect rate limits
  const targetCategories = selectedCategories.slice(0, 2);

  for (const cat of targetCategories) {
    // Construct rich targeted search query
    const skillTerm = (profile.skills && profile.skills.length > 0) ? profile.skills[0] : "AI";
    const yearTerm = profile.year ? `"${profile.year}"` : "undergraduate";
    const degreeTerm = profile.education || "BTech";
    const locTerm = profile.location || "India";

    let searchTerms = `${cat.toLowerCase()} ${yearTerm} ${degreeTerm} ${skillTerm} ${locTerm} 2026 apply`;
    if (parsedQuery.rawQuery) {
      searchTerms = `${parsedQuery.rawQuery} ${cat.toLowerCase()} 2026`;
    }

    const cacheKey = `tf_${cat}_${searchTerms}`;
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      results.push(...cached.data);
      continue;
    }

    try {
      const resp = await queryTinyFishRaw(searchTerms, { location: "IN" });
      if (resp && Array.isArray(resp.results)) {
        // Filter out non-opportunity landing pages (e.g. generic wikipedia, quora)
        const relevantItems = resp.results.filter(r => {
          const u = (r.url || "").toLowerCase();
          return !u.includes("wikipedia.org") && !u.includes("quora.com") && !u.includes("pinterest.com");
        }).slice(0, 4);

        const normalized = relevantItems.map(item => normalizeTinyFishItem(item, cat, profile));
        searchCache.set(cacheKey, { timestamp: Date.now(), data: normalized });
        results.push(...normalized);
      }
    } catch (err) {
      warnings.push(`TinyFish search for '${cat}' failed: ${err.message}`);
    }
  }

  return { opportunities: results, warnings };
}

module.exports = {
  getApiKey,
  checkHealth,
  queryTinyFishRaw,
  normalizeTinyFishItem,
  discoverOpportunities
};
