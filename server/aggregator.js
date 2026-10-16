/**
 * OpportunityX - Multi-Source Aggregator & Ranking Orchestrator
 *
 * Merges Live TinyFish Web Search with Authoritative Curated Portals.
 * Performs deduplication, qualification-aware evaluation, and ranking.
 */

const { discoverOpportunities } = require("./adapters/tinyfish");
const { CURATED_OPPORTUNITIES } = require("./data/curatedCatalog");
const { parseQuery } = require("./engine/queryParser");
const { calculateMatchScore } = require("./engine/matcher");

function formatOpportunityRecord(opp, profile, parsedQuery) {
  const now = new Date();
  const daysLeft = opp.deadlineDaysFromNow !== undefined ? opp.deadlineDaysFromNow : 14;
  const deadlineDate = new Date(now.getTime() + daysLeft * 24 * 60 * 60 * 1000);
  const isExpired = daysLeft < 0;

  const formattedDateStr = deadlineDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  let deadlineStatus = "Deadline not specified";
  if (isExpired) {
    deadlineStatus = "Expired";
  } else if (daysLeft === 0) {
    deadlineStatus = "Closing Today";
  } else if (daysLeft === 1) {
    deadlineStatus = "1 day left";
  } else if (daysLeft <= 7) {
    deadlineStatus = `${daysLeft} days left`;
  } else {
    deadlineStatus = formattedDateStr;
  }

  // Calculate Qualification Match & Eligibility Gate
  const matchResult = calculateMatchScore(opp, profile, parsedQuery);

  return {
    ...opp,
    deadline: deadlineDate.toISOString().split("T")[0],
    deadlineFormatted: formattedDateStr,
    daysLeft,
    deadlineStatus,
    isExpired,
    matchScore: matchResult.score,
    matchBreakdown: matchResult.breakdown,
    matchExplanation: matchResult.explanation,
    eligibilityEval: matchResult.eligibility,
    eligibilityStatus: matchResult.eligibility.status, // "ELIGIBLE", "NEEDS_VERIFICATION", "INELIGIBLE"
    eligibilityBadge: matchResult.eligibility.statusBadge,
    eligibilityType: matchResult.eligibility.statusType, // "eligible", "needs_verification", "ineligible"
    matchedSkills: matchResult.matchedSkills,
    matchedInterests: matchResult.matchedInterests,
    retrievedAt: opp.retrievedAt || new Date().toISOString()
  };
}

/**
 * Deduplicate listings across multiple sources based on normalized title and domain
 */
function deduplicateOpportunities(opportunities) {
  const seen = new Set();
  const unique = [];

  for (const item of opportunities) {
    const normTitle = (item.title || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 32);
    const domain = (item.sourceDomain || "").toLowerCase();
    const key = `${normTitle}_${domain}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Main Discovery Function
 */
async function aggregateAndDiscover(payload = {}) {
  const startTime = Date.now();
  const profile = payload.profile || {};
  const rawQuery = payload.query || "";

  // 1. Parse natural-language search query
  const parsedQuery = parseQuery(rawQuery, profile);

  // 2. Fetch live web results via TinyFish
  const targetCategories = (parsedQuery.categories && parsedQuery.categories.length > 0)
    ? parsedQuery.categories
    : (profile.preferences && profile.preferences.length > 0 ? profile.preferences : []);

  let liveResults = [];
  let warnings = [...parsedQuery.conflictNotes];

  try {
    const categoriesToSearch = targetCategories.length > 0 ? targetCategories : ["Internships", "Hackathons", "Scholarships", "Courses"];
    const tfResult = await discoverOpportunities(categoriesToSearch, profile, parsedQuery);
    liveResults = tfResult.opportunities || [];
    if (tfResult.warnings) warnings.push(...tfResult.warnings);
  } catch (err) {
    warnings.push(`Live search temporarily degraded: ${err.message}`);
  }

  // 3. Filter authoritative curated catalog
  const filteredCurated = CURATED_OPPORTUNITIES.filter(opp => {
    // If specific categories selected/inferred, match them; if empty, include all 10 categories
    if (targetCategories.length > 0 && !targetCategories.includes(opp.category)) {
      return false;
    }
    return true;
  });

  // 4. Combine sources & deduplicate
  const combinedRaw = [...filteredCurated, ...liveResults];
  const uniqueItems = deduplicateOpportunities(combinedRaw);

  // 5. Evaluate eligibility and match score for every item
  const scoredOpportunities = uniqueItems.map(opp => formatOpportunityRecord(opp, profile, parsedQuery));

  // 6. Partition results by eligibility status
  const eligible = scoredOpportunities.filter(o => o.eligibilityType === "eligible");
  const needsVerification = scoredOpportunities.filter(o => o.eligibilityType === "needs_verification");
  const ineligible = scoredOpportunities.filter(o => o.eligibilityType === "ineligible");

  // Sort: Eligible first (descending by score), then Needs Verification, then Ineligible
  eligible.sort((a, b) => b.matchScore - a.matchScore);
  needsVerification.sort((a, b) => b.matchScore - a.matchScore);
  ineligible.sort((a, b) => b.matchScore - a.matchScore);

  const rankedOpportunities = [...eligible, ...needsVerification, ...ineligible];

  const durationMs = Date.now() - startTime;

  return {
    ok: true,
    opportunities: rankedOpportunities,
    meta: {
      total: rankedOpportunities.length,
      eligibleCount: eligible.length,
      needsVerificationCount: needsVerification.length,
      ineligibleCount: ineligible.length,
      liveCount: liveResults.length,
      curatedCount: filteredCurated.length,
      categories: targetCategories,
      durationMs,
      parsedQuery: {
        raw: rawQuery,
        inferredYear: parsedQuery.inferredYear,
        inferredDegree: parsedQuery.inferredDegree,
        inferredWorkMode: parsedQuery.inferredWorkMode,
        extractedSkills: parsedQuery.extractedSkills
      },
      warnings
    }
  };
}

module.exports = {
  aggregateAndDiscover,
  formatOpportunityRecord,
  deduplicateOpportunities
};
