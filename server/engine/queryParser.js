/**
 * OpportunityX - Natural Language Query Parser
 *
 * Extracts categories, academic year, degree, skills, and constraints from free-form user queries.
 * Merges query constraints with student profile without silently overwriting profile data.
 */

const CATEGORY_MAP = {
  internship: "Internships",
  internships: "Internships",
  intern: "Internships",
  job: "Jobs",
  jobs: "Jobs",
  employment: "Jobs",
  career: "Jobs",
  hackathon: "Hackathons",
  hackathons: "Hackathons",
  hack: "Hackathons",
  course: "Courses",
  courses: "Courses",
  certification: "Courses",
  class: "Courses",
  scholarship: "Scholarships",
  scholarships: "Scholarships",
  grant: "Scholarships",
  fellowship: "Fellowships",
  fellowships: "Fellowships",
  competition: "Competitions",
  competitions: "Competitions",
  contest: "Competitions",
  event: "Events",
  events: "Events",
  summit: "Events",
  workshop: "Workshops",
  workshops: "Workshops",
  bootcamp: "Workshops",
  conference: "Conferences",
  conferences: "Conferences",
  symposium: "Conferences"
};

const YEAR_PATTERNS = [
  { regex: /\b(1st|first)\s*(year|yr)?\b|\bfreshman\b/i, year: "1st Year" },
  { regex: /\b(2nd|second)\s*(year|yr)?\b|\bsophomore\b/i, year: "2nd Year" },
  { regex: /\b(3rd|third)\s*(year|yr)?\b|\bjunior\b/i, year: "3rd Year" },
  { regex: /\b(4th|fourth|final)\s*(year|yr)?\b|\bsenior\b/i, year: "4th Year" },
  { regex: /\bgraduate\b|\bgraduated\b/i, year: "Graduate" },
  { regex: /\bpostgraduate\b|\bmasters\b/i, year: "Postgraduate" }
];

const DEGREE_PATTERNS = [
  { regex: /\bb[\.\s]?tech\b/i, degree: "BTech" },
  { regex: /\bb[\.\s]?e\b/i, degree: "BE" },
  { regex: /\bb[\.\s]?sc\b/i, degree: "BSc" },
  { regex: /\bb[\.\s]?ca\b/i, degree: "BCA" },
  { regex: /\bm[\.\s]?ca\b/i, degree: "MCA" },
  { regex: /\bm[\.\s]?tech\b/i, degree: "MTech" },
  { regex: /\bmba\b/i, degree: "MBA" },
  { regex: /\bundergrad(uate)?\b/i, degree: "Undergraduate" },
  { regex: /\bpostgrad(uate)?\b/i, degree: "Postgraduate" }
];

const WORK_MODE_PATTERNS = [
  { regex: /\bremote\b|\bonline\b|\bvirtual\b|\bwork from home\b|\bwfh\b/i, mode: "Remote" },
  { regex: /\bhybrid\b/i, mode: "Hybrid" },
  { regex: /\bon[\s\-]?site\b|\bin[\s\-]?person\b|\boffice\b/i, mode: "On-site" }
];

const SKILL_KEYWORDS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C++", "C", "Go", "Rust",
  "AI", "Artificial Intelligence", "Machine Learning", "Deep Learning", "LLM", "NLP", "Computer Vision",
  "Web Development", "Frontend", "Backend", "Full Stack", "Data Science", "Data Analysis", "SQL",
  "Cloud", "AWS", "Azure", "GCP", "DevOps", "Docker", "Kubernetes", "Cybersecurity", "Blockchain", "Web3"
];

function parseQuery(rawQuery, profile = {}) {
  const query = (rawQuery || "").trim();
  if (!query) {
    return {
      rawQuery: "",
      categories: profile.preferences && profile.preferences.length > 0 ? profile.preferences : [],
      extractedSkills: [],
      inferredDegree: null,
      inferredYear: null,
      inferredWorkMode: null,
      isFreeRequired: false,
      isFundedRequired: false,
      isBeginnerOnly: false,
      keywords: [],
      conflictNotes: []
    };
  }

  const queryLower = query.toLowerCase();

  // 1. Identify categories
  const categories = new Set();
  for (const [term, cat] of Object.entries(CATEGORY_MAP)) {
    const regex = new RegExp(`\\b${term}\\b`, "i");
    if (regex.test(queryLower)) {
      categories.add(cat);
    }
  }

  // 2. Extract year
  let inferredYear = null;
  for (const item of YEAR_PATTERNS) {
    if (item.regex.test(queryLower)) {
      inferredYear = item.year;
      break;
    }
  }

  // 3. Extract degree
  let inferredDegree = null;
  for (const item of DEGREE_PATTERNS) {
    if (item.regex.test(queryLower)) {
      inferredDegree = item.degree;
      break;
    }
  }

  // 4. Extract work mode
  let inferredWorkMode = null;
  for (const item of WORK_MODE_PATTERNS) {
    if (item.regex.test(queryLower)) {
      inferredWorkMode = item.mode;
      break;
    }
  }

  // 5. Extract skills
  const extractedSkills = [];
  for (const skill of SKILL_KEYWORDS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, "i");
    if (regex.test(query)) {
      extractedSkills.push(skill);
    }
  }

  // 6. Special modifiers
  const isFreeRequired = /\b(free|without fees?|zero cost)\b/i.test(queryLower);
  const isFundedRequired = /\b(fully funded|funded|stipend|paid)\b/i.test(queryLower);
  const isBeginnerOnly = /\b(beginner|introductory|first time|no experience)\b/i.test(queryLower);

  // 7. Check conflicts between explicit query constraints and profile
  const conflictNotes = [];
  if (inferredYear && profile.year && inferredYear !== profile.year) {
    conflictNotes.push(`Query specified '${inferredYear}' which differs from your profile year '${profile.year}'. Showing opportunities matching '${inferredYear}'.`);
  }
  if (inferredWorkMode && profile.workPreference && profile.workPreference !== "Any" && inferredWorkMode !== profile.workPreference) {
    conflictNotes.push(`Query requested '${inferredWorkMode}' work mode overriding profile preference '${profile.workPreference}'.`);
  }

  // 8. Clean keywords for external search query
  const stopWords = new Set(["find", "show", "get", "for", "me", "the", "a", "an", "and", "in", "to", "with", "that", "actually", "suitable", "open"]);
  const tokens = queryLower
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  return {
    rawQuery: query,
    categories: categories.size > 0 ? Array.from(categories) : (profile.preferences || []),
    extractedSkills,
    inferredDegree,
    inferredYear,
    inferredWorkMode,
    isFreeRequired,
    isFundedRequired,
    isBeginnerOnly,
    keywords: tokens,
    conflictNotes
  };
}

module.exports = {
  parseQuery,
  CATEGORY_MAP,
  YEAR_PATTERNS,
  DEGREE_PATTERNS,
  WORK_MODE_PATTERNS
};
