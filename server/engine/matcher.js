/**
 * OpportunityX - Qualification-Aware Matching & Scoring Engine
 *
 * Implements strict two-stage evaluation:
 * 1. Mandatory Eligibility Gate (Accepted degrees, academic year window, residency, work mode)
 *    Classifies into: ELIGIBLE, NEEDS_VERIFICATION, INELIGIBLE.
 * 2. Weighted Relevance Scoring (0-100) across Skills (25%), Interests (20%), Education (20%),
 *    Year/Prerequisites (15%), Location (10%), Preferences (10%).
 *
 * A high relevance score NEVER overrides a known mandatory eligibility failure.
 */

// Normalizes academic year strings into comparable numerical / range representation
function normalizeYearRank(yearStr) {
  if (!yearStr) return null;
  const s = String(yearStr).toLowerCase();
  if (s.includes("1st") || s.includes("first") || s.includes("freshman")) return 1;
  if (s.includes("2nd") || s.includes("second") || s.includes("sophomore")) return 2;
  if (s.includes("3rd") || s.includes("third") || s.includes("junior")) return 3;
  if (s.includes("4th") || s.includes("fourth") || s.includes("senior") || s.includes("final")) return 4;
  if (s.includes("5th") || s.includes("fifth")) return 5;
  if (s.includes("postgraduate") || s.includes("masters") || s.includes("mtech") || s.includes("mca")) return 6;
  if (s.includes("graduate") || s.includes("alumni")) return 5;
  return null;
}

function matchesWord(text, word) {
  if (!text || !word) return false;
  const trimmed = word.trim().toLowerCase();
  if (!trimmed) return false;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, "i");
  return regex.test(text);
}

/**
 * Stage 1: Evaluate Hard Eligibility Requirements
 */
function evaluateEligibility(opportunity, profile, parsedQuery = {}) {
  const opp = opportunity;
  const activeYear = parsedQuery.inferredYear || profile.year || "1st Year";
  const activeDegree = parsedQuery.inferredDegree || profile.education || "BTech";
  const activeWorkPref = parsedQuery.inferredWorkMode || profile.workPreference || "Any";

  const userYearRank = normalizeYearRank(activeYear);
  const eligText = (opp.eligibility || opp.eligibilityRequirements || "").toLowerCase();
  const titleAndDesc = `${opp.title} ${opp.description} ${eligText}`.toLowerCase();

  const failedCriteria = [];
  const metCriteria = [];
  const unknownCriteria = [];

  // 1. Academic Year Check
  let yearStatus = "UNKNOWN"; // "PASS", "FAIL", "UNKNOWN"
  const acceptedYears = opp.acceptedYears || [];

  if (acceptedYears.length > 0) {
    const isYearExplicitlyAccepted = acceptedYears.some(y => {
      const yLower = y.toLowerCase();
      return yLower === "all" || yLower === "all years" || yLower === "any" || yLower === activeYear.toLowerCase() ||
        (userYearRank && normalizeYearRank(y) === userYearRank);
    });

    if (isYearExplicitlyAccepted) {
      yearStatus = "PASS";
      metCriteria.push(`Specifically accepts ${activeYear} applicants.`);
    } else {
      yearStatus = "FAIL";
      failedCriteria.push(`Requires ${acceptedYears.join(" or ")}, but your profile is ${activeYear}.`);
    }
  } else if (eligText) {
    // Check for explicit exclusionary year patterns in eligibility text
    const requiresLaterYears = /\b(3rd\s*(and|&|\/|to|-)\s*4th|final\s*year|penultimate\s*year|graduating\s*students?|3rd\s*or\s*4th\s*year)\b/i.test(eligText);
    const requiresEarlyYearsOnly = /\b(1st\s*(and|&|\/|to|-)\s*2nd\s*year|freshmen\s*and\s*sophomores?|1st\s*year\s*only)\b/i.test(eligText);
    const openToAllYears = /\b(all\s*undergraduate|all\s*years|open\s*to\s*all|any\s*student|all\s*college\s*students)\b/i.test(eligText);

    if (openToAllYears) {
      yearStatus = "PASS";
      metCriteria.push(`Open to all academic years.`);
    } else if (userYearRank === 1 && requiresLaterYears) {
      yearStatus = "FAIL";
      failedCriteria.push(`Requires 3rd/4th year or graduating students; does not accept 1st Year applicants.`);
    } else if (userYearRank >= 3 && requiresEarlyYearsOnly) {
      yearStatus = "FAIL";
      failedCriteria.push(`Restricted to 1st & 2nd year students; does not accept senior applicants.`);
    } else if (matchesWord(eligText, activeYear)) {
      yearStatus = "PASS";
      metCriteria.push(`Accepts ${activeYear} students based on published text.`);
    } else {
      yearStatus = "UNKNOWN";
      unknownCriteria.push(`Specific academic year eligibility not explicitly stated.`);
    }
  } else {
    yearStatus = "UNKNOWN";
    unknownCriteria.push(`Eligibility requirements not published by source.`);
  }

  // 2. Degree & Discipline Check
  let degreeStatus = "UNKNOWN";
  const acceptedDegrees = opp.acceptedDegrees || [];

  if (acceptedDegrees.length > 0) {
    const isDegreeAccepted = acceptedDegrees.some(d => {
      const dLower = d.toLowerCase();
      return dLower === "all" || dLower === "any" || dLower === "stem" || dLower === activeDegree.toLowerCase() ||
        (activeDegree.toLowerCase() === "btech" && (dLower === "be" || dLower === "undergraduate" || dLower === "engineering"));
    });

    if (isDegreeAccepted) {
      degreeStatus = "PASS";
      metCriteria.push(`Accepts ${activeDegree} program.`);
    } else {
      degreeStatus = "FAIL";
      failedCriteria.push(`Requires degree in ${acceptedDegrees.join(", ")}; your profile is ${activeDegree}.`);
    }
  } else if (eligText) {
    if (matchesWord(eligText, activeDegree) || eligText.includes("undergraduate") || eligText.includes("all students") || eligText.includes("engineering")) {
      degreeStatus = "PASS";
      metCriteria.push(`Matches educational requirement (${activeDegree}).`);
    } else if (/\b(masters\s*only|mba\s*only|phd\s*only|medical\s*students?\s*only)\b/i.test(eligText)) {
      degreeStatus = "FAIL";
      failedCriteria.push(`Restricted to postgraduate or specific specialized program.`);
    } else {
      degreeStatus = "UNKNOWN";
    }
  }

  // 3. Work Mode Check
  let workModeStatus = "PASS";
  const oppMode = (opp.workMode || "").toLowerCase();
  const prefMode = activeWorkPref.toLowerCase();

  if (prefMode !== "any") {
    if (prefMode === "remote" && oppMode === "on-site") {
      workModeStatus = "FAIL";
      failedCriteria.push(`Requires On-site attendance, but you prefer Remote work.`);
    } else if (prefMode === "on-site" && oppMode === "remote") {
      workModeStatus = "PASS"; // remote is universally accessible
      metCriteria.push(`Remote participation available.`);
    } else if (oppMode && oppMode !== prefMode && oppMode !== "hybrid") {
      workModeStatus = "FAIL";
      failedCriteria.push(`Work mode is ${opp.workMode}, which conflicts with preferred ${activeWorkPref}.`);
    } else {
      workModeStatus = "PASS";
      metCriteria.push(`Matches work mode preference (${opp.workMode || "Flexible"}).`);
    }
  }

  // 4. Experience Check
  let experienceStatus = "PASS";
  if (opp.minExperienceYears > 0) {
    experienceStatus = "FAIL";
    failedCriteria.push(`Requires ${opp.minExperienceYears}+ years of prior professional experience.`);
  }

  // Synthesize Final Eligibility Classification
  let status = "ELIGIBLE";
  let statusBadge = "Eligible based on published criteria";
  let statusType = "eligible"; // "eligible", "needs_verification", "ineligible"

  if (failedCriteria.length > 0) {
    status = "INELIGIBLE";
    statusBadge = "Not eligible based on published criteria";
    statusType = "ineligible";
  } else if (unknownCriteria.length > 0 || !opp.eligibilityVerified) {
    status = "NEEDS_VERIFICATION";
    statusBadge = "Potential match — verify requirements";
    statusType = "needs_verification";
  }

  return {
    status,
    statusBadge,
    statusType,
    failedCriteria,
    metCriteria,
    unknownCriteria,
    yearStatus,
    degreeStatus,
    workModeStatus,
    experienceStatus
  };
}

/**
 * Stage 2: Calculate Weighted Relevance Score (0 - 100)
 */
function calculateMatchScore(opportunity, profile, parsedQuery = {}) {
  const opp = opportunity;
  const studentSkills = (profile.skills || []).map(s => s.trim()).filter(Boolean);
  const studentInterests = (profile.interests || []).map(i => i.trim()).filter(Boolean);
  const oppSkills = (opp.skills || []).map(s => s.toLowerCase());
  const oppText = `${opp.title} ${opp.description} ${opp.category} ${oppSkills.join(" ")}`;

  const eligibilityEval = evaluateEligibility(opp, profile, parsedQuery);

  const breakdown = {
    skills: 0,        // Max 25
    interests: 0,     // Max 20
    education: 0,     // Max 20
    year: 0,          // Max 15
    location: 0,      // Max 10
    preference: 0,    // Max 10
    queryBonus: 0     // Max 10 bonus
  };

  const explanations = [];

  // 1. Skills match (25%)
  let matchedSkillsCount = 0;
  const matchedSkillsList = [];
  for (const skill of studentSkills) {
    const sLower = skill.toLowerCase();
    const isDirectMatch = oppSkills.some(os => os === sLower || os.includes(sLower) || sLower.includes(os));
    const isWordMatch = matchesWord(oppText, skill);
    if (isDirectMatch || isWordMatch) {
      matchedSkillsCount++;
      matchedSkillsList.push(skill);
    }
  }
  if (studentSkills.length > 0) {
    const ratio = Math.min(1, matchedSkillsCount / Math.min(studentSkills.length, 3));
    breakdown.skills = Math.round(ratio * 25);
    if (matchedSkillsCount > 0) {
      explanations.push(`matches ${matchedSkillsCount} skill${matchedSkillsCount > 1 ? "s" : ""} (${matchedSkillsList.slice(0, 3).join(", ")})`);
    }
  } else {
    breakdown.skills = 16;
  }

  // 2. Interests match (20%)
  let matchedInterestsCount = 0;
  const matchedInterestsList = [];
  for (const interest of studentInterests) {
    if (matchesWord(oppText, interest)) {
      matchedInterestsCount++;
      matchedInterestsList.push(interest);
    }
  }
  if (studentInterests.length > 0) {
    const ratio = Math.min(1, matchedInterestsCount / Math.min(studentInterests.length, 2));
    breakdown.interests = Math.round(ratio * 20);
    if (matchedInterestsCount > 0) {
      explanations.push(`aligns with interest in ${matchedInterestsList[0]}`);
    }
  } else {
    breakdown.interests = 14;
  }

  // 3. Education relevance (20%)
  if (eligibilityEval.degreeStatus === "PASS") {
    breakdown.education = 20;
    explanations.push(`degree fits (${profile.education || "Undergraduate"})`);
  } else if (eligibilityEval.degreeStatus === "UNKNOWN") {
    breakdown.education = 12;
  } else {
    breakdown.education = 0;
  }

  // 4. Academic Year & Prerequisites (15%)
  if (eligibilityEval.yearStatus === "PASS") {
    breakdown.year = 15;
    explanations.push(`welcomes ${profile.year || "1st Year"} students`);
  } else if (eligibilityEval.yearStatus === "UNKNOWN") {
    breakdown.year = 8;
  } else {
    breakdown.year = 0;
  }

  // 5. Location & Work Mode (10%)
  if (eligibilityEval.workModeStatus === "PASS") {
    breakdown.location = 10;
    if (opp.workMode) {
      explanations.push(`${opp.workMode.toLowerCase()} mode supported`);
    }
  } else {
    breakdown.location = 2;
  }

  // 6. Category preference (10%)
  const prefs = (profile.preferences || []).map(p => p.toLowerCase());
  if (prefs.length === 0 || prefs.includes((opp.category || "").toLowerCase())) {
    breakdown.preference = 10;
  } else {
    breakdown.preference = 3;
  }

  // Query relevance bonus (up to 10 points)
  if (parsedQuery.keywords && parsedQuery.keywords.length > 0) {
    let hits = 0;
    for (const kw of parsedQuery.keywords) {
      if (matchesWord(oppText, kw)) hits++;
    }
    breakdown.queryBonus = Math.min(10, Math.round((hits / parsedQuery.keywords.length) * 10));
    if (breakdown.queryBonus >= 5) {
      explanations.push(`directly matches search query`);
    }
  }

  let totalScore = breakdown.skills + breakdown.interests + breakdown.education +
    breakdown.year + breakdown.location + breakdown.preference + breakdown.queryBonus;

  // STRICT RULE: If ineligible, score cannot masquerade as high suitability
  if (eligibilityEval.status === "INELIGIBLE") {
    totalScore = Math.min(42, Math.max(15, totalScore * 0.4));
  } else {
    totalScore = Math.min(99, Math.max(38, totalScore));
  }

  let explanationSummary = "";
  if (eligibilityEval.status === "INELIGIBLE") {
    explanationSummary = `Not eligible: ${eligibilityEval.failedCriteria.join(" ")}`;
  } else if (explanations.length > 0) {
    explanationSummary = `Strong match: ${explanations.join("; ")}.`;
  } else {
    explanationSummary = `General match based on your ${profile.education || "student"} profile and category interests.`;
  }

  return {
    score: Math.round(totalScore),
    breakdown,
    eligibility: eligibilityEval,
    explanation: explanationSummary,
    matchedSkills: matchedSkillsList,
    matchedInterests: matchedInterestsList
  };
}

module.exports = {
  evaluateEligibility,
  calculateMatchScore,
  normalizeYearRank,
  matchesWord
};
