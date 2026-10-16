/**
 * OpportunityX - Automated Test Suite
 * Validates qualification matching, eligibility gates, query parsing, and TinyFish integration.
 */

const { test, describe } = require("node:test");
const assert = require("node:assert");

const { evaluateEligibility, calculateMatchScore } = require("../server/engine/matcher");
const { parseQuery } = require("../server/engine/queryParser");
const { CURATED_OPPORTUNITIES } = require("../server/data/curatedCatalog");
const { aggregateAndDiscover } = require("../server/aggregator");

describe("Qualification-Aware Eligibility Gate Tests", () => {
  const firstYearBTech = {
    education: "BTech",
    year: "1st Year",
    skills: ["Python", "AI", "Web Development"],
    interests: ["Artificial Intelligence"],
    location: "India",
    workPreference: "Remote",
    preferences: ["Internships", "Hackathons"]
  };

  test("Scenario 1: First-year BTech student matches 1st-year friendly opportunities (GSoC, SIH, Reliance)", () => {
    const gsoc = CURATED_OPPORTUNITIES.find(o => o.id === "gsoc-2026");
    const evalResult = evaluateEligibility(gsoc, firstYearBTech);
    assert.strictEqual(evalResult.status, "ELIGIBLE");
    assert.strictEqual(evalResult.statusType, "eligible");

    const matchResult = calculateMatchScore(gsoc, firstYearBTech);
    assert.ok(matchResult.score >= 80, `Expected score >= 80, got ${matchResult.score}`);
  });

  test("Scenario 2: Listing explicitly requiring 4th year/graduates (Cisco SWE) marks 1st year as INELIGIBLE", () => {
    const cisco = CURATED_OPPORTUNITIES.find(o => o.id === "cisco-swe-early-career");
    const evalResult = evaluateEligibility(cisco, firstYearBTech);
    assert.strictEqual(evalResult.status, "INELIGIBLE");
    assert.strictEqual(evalResult.statusType, "ineligible");
    assert.ok(evalResult.failedCriteria.length > 0, "Failed criteria should explain year mismatch");

    const matchResult = calculateMatchScore(cisco, firstYearBTech);
    // Strict rule: Mandatory failure must cap or downgrade score
    assert.ok(matchResult.score <= 45, `Expected capped score <= 45 for ineligible candidate, got ${matchResult.score}`);
    assert.ok(matchResult.explanation.startsWith("Not eligible"), "Explanation must state candidate is not eligible");
  });

  test("Scenario 3: Scholarship restricted to degree (Reliance Tech) evaluates properly", () => {
    const reliance = CURATED_OPPORTUNITIES.find(o => o.id === "reliance-foundation-scholarship");
    // BTech 1st year matches
    const btechEval = evaluateEligibility(reliance, firstYearBTech);
    assert.strictEqual(btechEval.status, "ELIGIBLE");

    // Profile with BA 1st year fails degree restriction
    const artsProfile = { ...firstYearBTech, education: "BA" };
    const artsEval = evaluateEligibility(reliance, artsProfile);
    assert.strictEqual(artsEval.status, "INELIGIBLE");
  });

  test("Scenario 4: Remote-only preference with On-site listing flags conflict", () => {
    const ethIndia = CURATED_OPPORTUNITIES.find(o => o.id === "ethindia-2026"); // On-site in Bengaluru
    const remoteOnlyProfile = { ...firstYearBTech, workPreference: "Remote" };
    const evalResult = evaluateEligibility(ethIndia, remoteOnlyProfile);
    assert.ok(evalResult.failedCriteria.some(c => c.includes("On-site")), "Should flag remote vs onsite conflict");
  });

  test("Scenario 5: Beginner with 0 years experience passes zero-experience requirements", () => {
    const uberStar = CURATED_OPPORTUNITIES.find(o => o.id === "uber-star-2026");
    const beginnerProfile = { ...firstYearBTech, minExperienceYears: 0 };
    const evalResult = evaluateEligibility(uberStar, beginnerProfile);
    assert.strictEqual(evalResult.experienceStatus, "PASS");
  });

  test("Scenario 6: Opportunity with unverified criteria marked as NEEDS_VERIFICATION", () => {
    const unverifiedOpp = {
      id: "test-unverified",
      title: "Open Technology Fellowship",
      organization: "Community Org",
      category: "Fellowships",
      description: "Exciting technology fellowship.",
      acceptedDegrees: [],
      acceptedYears: [],
      eligibilityVerified: false
    };
    const evalResult = evaluateEligibility(unverifiedOpp, firstYearBTech);
    assert.strictEqual(evalResult.status, "NEEDS_VERIFICATION");
    assert.strictEqual(evalResult.statusType, "needs_verification");
  });

  test("Scenario 7: Expired deadline properly identified", () => {
    const expiredOpp = {
      id: "test-expired",
      title: "Past Hackathon",
      deadlineDaysFromNow: -5,
      acceptedYears: ["All"],
      acceptedDegrees: ["All"]
    };
    const { formatOpportunityRecord } = require("../server/aggregator");
    const formatted = formatOpportunityRecord(expiredOpp, firstYearBTech, {});
    assert.strictEqual(formatted.isExpired, true);
    assert.strictEqual(formatted.deadlineStatus, "Expired");
  });

  test("Scenario 8: Partial profile with missing fields handles gracefully without crashing", () => {
    const sparseProfile = { education: "BTech" };
    const gsoc = CURATED_OPPORTUNITIES.find(o => o.id === "gsoc-2026");
    const matchResult = calculateMatchScore(gsoc, sparseProfile);
    assert.ok(matchResult.score > 0);
  });
});

describe("Natural Language Query Parser Tests", () => {
  test("Scenario 9: Query conflicting with profile makes conflict explicit", () => {
    const profile = { year: "1st Year", workPreference: "Remote" };
    const query = "Find onsite final year mechanical jobs";
    const parsed = parseQuery(query, profile);

    assert.strictEqual(parsed.inferredYear, "4th Year");
    assert.strictEqual(parsed.inferredWorkMode, "On-site");
    assert.ok(parsed.conflictNotes.length >= 2, "Should note conflicts for both year and work mode");
  });

  test("Scenario 10: Profile updates alter matching results deterministically", () => {
    const firstYear = { education: "BTech", year: "1st Year", skills: ["Python"] };
    const fourthYear = { education: "BTech", year: "4th Year", skills: ["Python"] };

    const cisco = CURATED_OPPORTUNITIES.find(o => o.id === "cisco-swe-early-career");
    const res1 = calculateMatchScore(cisco, firstYear);
    const res2 = calculateMatchScore(cisco, fourthYear);

    assert.strictEqual(res1.eligibility.status, "INELIGIBLE");
    assert.strictEqual(res2.eligibility.status, "ELIGIBLE");
    assert.ok(res2.score > res1.score, "4th year score must exceed 1st year score for senior job");
  });
});

describe("End-to-End Aggregator Pipeline Test", () => {
  test("aggregateAndDiscover returns partitioned results with metadata", async () => {
    const payload = {
      profile: {
        education: "BTech",
        year: "1st Year",
        skills: ["Python", "AI"],
        interests: ["Artificial Intelligence"],
        preferences: ["Internships", "Hackathons"]
      },
      query: "remote AI internships"
    };

    const res = await aggregateAndDiscover(payload);
    assert.strictEqual(res.ok, true);
    assert.ok(Array.isArray(res.opportunities));
    assert.ok(res.opportunities.length > 0);
    assert.ok(res.meta.total > 0);
    assert.ok(res.meta.eligibleCount >= 0);
  });
});
