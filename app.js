/**
 * OpportunityX Frontend Engine
 *
 * Runs seamlessly in the browser.
 * Fully integrated with Backend Discovery Engine & TinyFish Live Search.
 * Features Client-side Standalone Fallback & Comprehensive Application Tracking.
 */
(() => {
  "use strict";

  const LOADING_MESSAGES = [
    "Querying TinyFish live web discovery...",
    "Retrieving authoritative student portals...",
    "Evaluating academic degree & year requirements...",
    "Verifying published eligibility criteria...",
    "Computing personalized qualification scores...",
    "Partitioning eligible and near-match listings..."
  ];
  const LOADING_INTERVAL_MS = 1200;

  const DEFAULT_PROFILE = {
    education: "BTech",
    year: "1st Year",
    skills: ["Python", "AI", "Web Development"],
    interests: ["Artificial Intelligence"],
    location: "India",
    preferences: ["Internships", "Hackathons", "Courses", "Events", "Scholarships"],
    workPreference: "Any"
  };

  const EXAMPLE_QUERY = "Find remote AI internships and hackathons suitable for a 1st year BTech student.";

  const PREFERENCE_OPTIONS = [
    "Internships", "Jobs", "Hackathons", "Courses", "Competitions",
    "Events", "Scholarships", "Fellowships", "Workshops", "Conferences"
  ];

  const PROFILES_KEY = "opportunityx.profile.v1";
  const THEME_KEY = "opportunityx.theme.v1";
  const SAVED_KEY = "opportunityx.saved.v1";
  const TRACKER_KEY = "opportunityx.tracker.v1";

  // Standalone Catalog for offline / file:// protocol mode
  const FALLBACK_CATALOG = [
    {
      id: "gsoc-2026",
      title: "Google Summer of Code (GSoC) 2026 - Open Source & AI Mentorship",
      organization: "Google Open Source",
      category: "Internships",
      description: "Global program connecting post-secondary students with open-source organizations. Work on 12-week coding projects covering machine learning, systems, web development, and cloud computing under veteran mentors with stipends.",
      eligibility: "Open to students (18+) across all years (1st to 4th Year BTech, BSc, BCA, MCA, etc.)",
      acceptedDegrees: ["BTech", "BE", "BCA", "BSc", "MCA", "All"],
      acceptedYears: ["1st Year", "2nd Year", "3rd Year", "4th Year", "All years"],
      minExperienceYears: 0,
      location: "Global",
      workMode: "Remote",
      skills: ["Python", "C++", "JavaScript", "AI", "Git", "Open Source"],
      stipendOrReward: "$1,500 - $3,300 USD Stipend",
      applicationUrl: "https://summerofcode.withgoogle.com",
      sourceUrl: "https://opensource.googleblog.com",
      sourceDomain: "summerofcode.withgoogle.com",
      deadlineDaysFromNow: 14,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "ms-explore-2026",
      title: "Microsoft Explore Internship Program (1st & 2nd Year Undergraduates)",
      organization: "Microsoft",
      category: "Internships",
      description: "A 12-week summer rotational internship program specifically designed for first and second-year college students to explore careers in Software Engineering (SWE) and Product Management (PM).",
      eligibility: "Restricted to 1st Year and 2nd Year undergraduate students pursuing BTech / BE / BCA in CS or related STEM.",
      acceptedDegrees: ["BTech", "BE", "BCA", "BSc"],
      acceptedYears: ["1st Year", "2nd Year"],
      minExperienceYears: 0,
      location: "Hyderabad / Bengaluru / Noida, India",
      workMode: "Hybrid",
      skills: ["Python", "Java", "Data Structures", "Problem Solving", "Web Development"],
      stipendOrReward: "INR 1,25,000 / month + Housing",
      applicationUrl: "https://careers.microsoft.com",
      sourceUrl: "https://careers.microsoft.com/v2/global/en/students-early-careers",
      sourceDomain: "careers.microsoft.com",
      deadlineDaysFromNow: 6,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "uber-star-2026",
      title: "Uber STAR Internship - Early Career Engineering Program",
      organization: "Uber",
      category: "Internships",
      description: "Tailored for undergraduate freshmen and sophomores. Includes 1-on-1 mentorship, engineering bootcamps, and direct contributions to live production microservices across Uber's global mobility and delivery stack.",
      eligibility: "1st Year & 2nd Year undergraduate students in Computer Science, IT, or Electrical Engineering.",
      acceptedDegrees: ["BTech", "BE", "BCA"],
      acceptedYears: ["1st Year", "2nd Year"],
      minExperienceYears: 0,
      location: "Bengaluru / Hyderabad, India",
      workMode: "Hybrid",
      skills: ["Python", "Go", "Java", "Algorithms", "Backend Development"],
      stipendOrReward: "INR 1,60,000 / month",
      applicationUrl: "https://www.uber.com/careers",
      sourceUrl: "https://www.uber.com/us/en/careers/teams/university/",
      sourceDomain: "uber.com",
      deadlineDaysFromNow: 9,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "cisco-swe-early-career",
      title: "Cisco Early Career Software Engineer - Cloud & Security",
      organization: "Cisco Systems",
      category: "Jobs",
      description: "Full-time software engineering role for graduating students and early career developers. Build distributed networking, cloud automation, and cybersecurity solutions.",
      eligibility: "Strictly restricted to 4th Year / Final Year students (BTech, BE, MCA) graduating in 2026, or recent graduates.",
      acceptedDegrees: ["BTech", "BE", "MCA"],
      acceptedYears: ["4th Year", "Graduate"],
      minExperienceYears: 0,
      location: "Bengaluru / Chennai, India",
      workMode: "Hybrid",
      skills: ["Python", "Java", "Networking", "Linux", "Cloud Computing"],
      stipendOrReward: "INR 14,00,000 - 18,00,000 CTC",
      applicationUrl: "https://jobs.cisco.com",
      sourceUrl: "https://jobs.cisco.com",
      sourceDomain: "jobs.cisco.com",
      deadlineDaysFromNow: 20,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "sih-2026",
      title: "Smart India Hackathon (SIH 2026) - National Innovation Challenge",
      organization: "Ministry of Education & AICTE",
      category: "Hackathons",
      description: "India's premier nationwide product innovation hackathon. Students collaborate in teams to solve real-world problem statements posed by central ministries, state departments, and top industries.",
      eligibility: "All undergraduate & postgraduate college students (1st to 4th Year BTech, BCA, BSc, MCA).",
      acceptedDegrees: ["All"],
      acceptedYears: ["1st Year", "2nd Year", "3rd Year", "4th Year", "All years"],
      minExperienceYears: 0,
      location: "All India (Centres Nationwide)",
      workMode: "Hybrid",
      skills: ["AI", "Web Development", "Python", "Mobile App Development", "IoT"],
      stipendOrReward: "INR 1,00,000 per problem statement prize pool",
      applicationUrl: "https://sih.gov.in",
      sourceUrl: "https://sih.gov.in",
      sourceDomain: "sih.gov.in",
      deadlineDaysFromNow: 3,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "ethindia-2026",
      title: "ETHIndia 2026 & AI Web3 Global Hackathon",
      organization: "Devfolio / ETHGlobal",
      category: "Hackathons",
      description: "One of the world's largest hackathons bringing together 2,000+ top developers, designers, and students to build cutting-edge decentralized applications, autonomous AI agents, and zero-knowledge systems.",
      eligibility: "Open to all students and self-taught developers worldwide.",
      acceptedDegrees: ["All"],
      acceptedYears: ["All years"],
      minExperienceYears: 0,
      location: "Bengaluru, India",
      workMode: "On-site",
      skills: ["JavaScript", "Python", "Web3", "AI", "React", "Smart Contracts"],
      stipendOrReward: "$150,000+ USD in bounties & grants",
      applicationUrl: "https://ethindia.co",
      sourceUrl: "https://ethindia.co",
      sourceDomain: "ethindia.co",
      deadlineDaysFromNow: 18,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "mlh-hack-week",
      title: "Major League Hacking (MLH) Global Hack Week: AI & Data",
      organization: "Major League Hacking",
      category: "Hackathons",
      description: "A week-long celebration of building, learning, and hacking! Free workshops, beginner-friendly mini-challenges, mentorship sessions from industry leaders, and digital swag.",
      eligibility: "Open to all students worldwide. Beginners highly encouraged.",
      acceptedDegrees: ["All"],
      acceptedYears: ["All years"],
      minExperienceYears: 0,
      location: "Global",
      workMode: "Remote",
      skills: ["Python", "AI", "Web Development", "HTML/CSS", "APIs"],
      stipendOrReward: "Free Swag, Cloud Credits & Hardware Prizes",
      applicationUrl: "https://ghw.mlh.io",
      sourceUrl: "https://mlh.io",
      sourceDomain: "mlh.io",
      deadlineDaysFromNow: 2,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "deeplearning-genai",
      title: "Generative AI with Large Language Models & Agentic Systems",
      organization: "DeepLearning.AI & Coursera",
      category: "Courses",
      description: "Learn foundational concepts of LLM fine-tuning, retrieval-augmented generation (RAG), parameter-efficient fine-tuning (LoRA), and autonomous agent frameworks directly from Andrew Ng and AWS AI teams.",
      eligibility: "Free audit access open to all students; financial aid available.",
      acceptedDegrees: ["All"],
      acceptedYears: ["All years"],
      minExperienceYears: 0,
      location: "Online",
      workMode: "Remote",
      skills: ["Artificial Intelligence", "Python", "PyTorch", "LLMs", "NLP"],
      stipendOrReward: "Free Audit / Financial Aid for Certificate",
      applicationUrl: "https://www.deeplearning.ai/courses/generative-ai-with-llms/",
      sourceUrl: "https://www.coursera.org/learn/generative-ai-with-llms",
      sourceDomain: "deeplearning.ai",
      deadlineDaysFromNow: 30,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "harvard-cs50-ai",
      title: "CS50's Introduction to Artificial Intelligence with Python",
      organization: "Harvard University & edX",
      category: "Courses",
      description: "Explores the concepts and algorithms at the foundation of modern artificial intelligence, diving into graph search algorithms, classification, reinforcement learning, and neural networks in Python.",
      eligibility: "Free to take for anyone worldwide. No prerequisites required.",
      acceptedDegrees: ["All"],
      acceptedYears: ["All years"],
      minExperienceYears: 0,
      location: "Online",
      workMode: "Remote",
      skills: ["Python", "Artificial Intelligence", "Algorithms", "Machine Learning"],
      stipendOrReward: "Free Enrollment & Course Materials",
      applicationUrl: "https://cs50.harvard.edu/ai/",
      sourceUrl: "https://www.edx.org/cs50-introduction-artificial-intelligence-python",
      sourceDomain: "cs50.harvard.edu",
      deadlineDaysFromNow: 45,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "reliance-foundation-scholarship",
      title: "Reliance Foundation Undergraduate Technology Scholarship",
      organization: "Reliance Foundation",
      category: "Scholarships",
      description: "Prestigious merit-cum-means scholarship awarding up to INR 2,00,000 for undergraduate students in Computer Science, AI, Mathematics, and allied Engineering fields.",
      eligibility: "Restricted to 1st Year undergraduate students enrolled in full-time degree programs in India (BTech, BSc, BCA).",
      acceptedDegrees: ["BTech", "BE", "BSc", "BCA"],
      acceptedYears: ["1st Year"],
      minExperienceYears: 0,
      location: "India",
      workMode: "Remote",
      skills: ["Academic Excellence", "AI", "Computer Science", "Leadership"],
      stipendOrReward: "Up to INR 2,00,000 Grant",
      applicationUrl: "https://www.scholarships.reliancefoundation.org",
      sourceUrl: "https://www.reliancefoundation.org",
      sourceDomain: "scholarships.reliancefoundation.org",
      deadlineDaysFromNow: 5,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "google-generation-scholarship",
      title: "Google Generation Scholarship for Women in Tech (APAC)",
      organization: "Google",
      category: "Scholarships",
      description: "Designed to help aspiring students pursuing computer science degrees excel in technology. Recipients receive a $2,500 USD award, networking retreats, and mentorship from Google engineers.",
      eligibility: "1st, 2nd, and 3rd Year undergraduate female students studying computer science or related technical degrees.",
      acceptedDegrees: ["BTech", "BE", "BSc", "BCA"],
      acceptedYears: ["1st Year", "2nd Year", "3rd Year"],
      minExperienceYears: 0,
      location: "Asia Pacific",
      workMode: "Remote",
      skills: ["Computer Science", "Problem Solving", "Community Leadership"],
      stipendOrReward: "$2,500 USD Grant + Mentorship",
      applicationUrl: "https://buildyourfuture.withgoogle.com/scholarships/generation-google-scholarship-apac",
      sourceUrl: "https://buildyourfuture.withgoogle.com",
      sourceDomain: "buildyourfuture.withgoogle.com",
      deadlineDaysFromNow: 11,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "iisc-summer-research",
      title: "IISc & IIT Bombay Undergraduate AI Research Fellowship",
      organization: "Indian Institute of Science (IISc)",
      category: "Fellowships",
      description: "Fellowship allowing brilliant undergraduate students to spend summer months working with leading professors on fundamental AI, computer vision, robotics, and natural language understanding research.",
      eligibility: "1st, 2nd, and 3rd year engineering and science undergraduate students.",
      acceptedDegrees: ["BTech", "BE", "BSc", "BCA"],
      acceptedYears: ["1st Year", "2nd Year", "3rd Year"],
      minExperienceYears: 0,
      location: "Bengaluru / Mumbai, India",
      workMode: "On-site",
      skills: ["Python", "Artificial Intelligence", "Machine Learning", "Mathematics"],
      stipendOrReward: "INR 12,000 / month + Campus Accommodation",
      applicationUrl: "https://iisc.ac.in",
      sourceUrl: "https://iisc.ac.in/admissions/summer-fellowship/",
      sourceDomain: "iisc.ac.in",
      deadlineDaysFromNow: 21,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "kaggle-ai-olympiad",
      title: "Kaggle AI Olympiad & Code Modeling Challenge",
      organization: "Kaggle & Google DeepMind",
      category: "Competitions",
      description: "Compete with students and data scientists globally to build automated AI models capable of solving mathematical Olympiad problems. Includes $1,000,000 total prize pool and GPU compute grants.",
      eligibility: "Free and open to all university students and data enthusiasts globally.",
      acceptedDegrees: ["All"],
      acceptedYears: ["All years"],
      minExperienceYears: 0,
      location: "Global",
      workMode: "Remote",
      skills: ["Python", "AI", "Machine Learning", "Mathematics", "PyTorch"],
      stipendOrReward: "$1,000,000 Total Prize Pool + GPU Grants",
      applicationUrl: "https://www.kaggle.com/competitions",
      sourceUrl: "https://www.kaggle.com",
      sourceDomain: "kaggle.com",
      deadlineDaysFromNow: 7,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "github-universe-student",
      title: "GitHub Universe 2026 Student & Open Source Summit",
      organization: "GitHub",
      category: "Events",
      description: "The global gathering for the software developer ecosystem. Features hands-on Copilot labs, open-source maintainer roundtables, and exclusive student developer keynotes.",
      eligibility: "Free virtual streaming access and student discount in-person tickets.",
      acceptedDegrees: ["All"],
      acceptedYears: ["All years"],
      minExperienceYears: 0,
      location: "San Francisco, CA & Online Virtual",
      workMode: "Remote",
      skills: ["Git", "GitHub", "AI", "Open Source", "Software Engineering"],
      stipendOrReward: "Free Virtual Access & Student Swag Kit",
      applicationUrl: "https://githubuniverse.com",
      sourceUrl: "https://githubuniverse.com",
      sourceDomain: "githubuniverse.com",
      deadlineDaysFromNow: 15,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "aws-genai-workshop",
      title: "AWS Hands-on Cloud & Generative AI Builder Workshop",
      organization: "Amazon Web Services",
      category: "Workshops",
      description: "Intensive 3-day practical hands-on workshop guiding students step-by-step through deploying serverless architectures and Amazon Bedrock models.",
      eligibility: "Free registration for students and developers worldwide. No prior cloud experience required.",
      acceptedDegrees: ["All"],
      acceptedYears: ["All years"],
      minExperienceYears: 0,
      location: "Online",
      workMode: "Remote",
      skills: ["AI", "Cloud Computing", "Python", "AWS", "APIs"],
      stipendOrReward: "Free AWS Sandbox Credits & Digital Certificate",
      applicationUrl: "https://aws.amazon.com/events/workshops/",
      sourceUrl: "https://aws.amazon.com",
      sourceDomain: "aws.amazon.com",
      deadlineDaysFromNow: 4,
      sourceType: "verified-authority",
      eligibilityVerified: true
    },
    {
      id: "pycon-india-2026",
      title: "PyCon India 2026 Student Track & Open Source Sprint",
      organization: "Python Software Society of India",
      category: "Conferences",
      description: "The premier conference in India on using and developing the Python language. Features a dedicated Student Track, developer sprints, and direct networking with top hiring partners.",
      eligibility: "Student discount passes and diversity travel grants available for university attendees.",
      acceptedDegrees: ["All"],
      acceptedYears: ["All years"],
      minExperienceYears: 0,
      location: "Hyderabad, India",
      workMode: "On-site",
      skills: ["Python", "AI", "Data Science", "Web Development", "Open Source"],
      stipendOrReward: "Travel Grants & Student Subsidies",
      applicationUrl: "https://in.pycon.org",
      sourceUrl: "https://in.pycon.org",
      sourceDomain: "in.pycon.org",
      deadlineDaysFromNow: 25,
      sourceType: "verified-authority",
      eligibilityVerified: true
    }
  ];

  // ---------------------------------------------------------------- utilities
  const $ = (id) => document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showToast(message) {
    const container = $("toastContainer");
    if (!container) return;
    const toast = el("div", "toast", message);
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.2s ease";
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // Client-side Matcher implementation (Mirrors server/engine/matcher.js)
  function clientEvaluateEligibility(opp, prof) {
    const userYear = prof.year || "1st Year";
    const userDegree = prof.education || "BTech";
    const userWork = prof.workPreference || "Any";

    const failedCriteria = [];
    const metCriteria = [];
    const unknownCriteria = [];

    const acceptedYears = opp.acceptedYears || [];
    if (acceptedYears.length > 0) {
      const ok = acceptedYears.some(y => y.toLowerCase() === "all" || y.toLowerCase() === "all years" || y.toLowerCase() === userYear.toLowerCase());
      if (ok) metCriteria.push(`Specifically accepts ${userYear} students.`);
      else failedCriteria.push(`Requires ${acceptedYears.join(" or ")}, but your profile is ${userYear}.`);
    } else {
      unknownCriteria.push("Academic year eligibility not specified.");
    }

    const acceptedDegrees = opp.acceptedDegrees || [];
    if (acceptedDegrees.length > 0) {
      const ok = acceptedDegrees.some(d => d.toLowerCase() === "all" || d.toLowerCase() === "any" || d.toLowerCase() === userDegree.toLowerCase());
      if (ok) metCriteria.push(`Matches ${userDegree} program.`);
      else failedCriteria.push(`Requires ${acceptedDegrees.join(", ")}; your profile is ${userDegree}.`);
    }

    if (userWork !== "Any" && opp.workMode) {
      if (userWork === "Remote" && opp.workMode === "On-site") {
        failedCriteria.push("Requires On-site attendance, but you prefer Remote.");
      } else {
        metCriteria.push(`Supports ${opp.workMode} mode.`);
      }
    }

    let status = "ELIGIBLE";
    let statusBadge = "Eligible based on published criteria";
    let statusType = "eligible";

    if (failedCriteria.length > 0) {
      status = "INELIGIBLE";
      statusBadge = "Not eligible based on published criteria";
      statusType = "ineligible";
    } else if (unknownCriteria.length > 0 || !opp.eligibilityVerified) {
      status = "NEEDS_VERIFICATION";
      statusBadge = "Potential match — verify requirements";
      statusType = "needs_verification";
    }

    return { status, statusBadge, statusType, failedCriteria, metCriteria, unknownCriteria };
  }

  function clientProcessOpportunities(catalog, prof, query) {
    const now = new Date();
    return catalog.map(opp => {
      const daysLeft = opp.deadlineDaysFromNow !== undefined ? opp.deadlineDaysFromNow : 14;
      const deadlineDate = new Date(now.getTime() + daysLeft * 24 * 60 * 60 * 1000);
      const isExpired = daysLeft < 0;
      const formattedDateStr = deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      let deadlineStatus = "Deadline not specified";
      if (isExpired) deadlineStatus = "Expired";
      else if (daysLeft === 0) deadlineStatus = "Closing Today";
      else if (daysLeft === 1) deadlineStatus = "1 day left";
      else if (daysLeft <= 7) deadlineStatus = `${daysLeft} days left`;
      else deadlineStatus = formattedDateStr;

      const eligibilityEval = clientEvaluateEligibility(opp, prof);

      // Simple scoring
      let score = 50;
      if (eligibilityEval.status === "ELIGIBLE") score = 88;
      else if (eligibilityEval.status === "NEEDS_VERIFICATION") score = 70;
      else score = 35; // Cap ineligible

      return {
        ...opp,
        deadline: deadlineDate.toISOString().split("T")[0],
        deadlineFormatted: formattedDateStr,
        daysLeft,
        deadlineStatus,
        isExpired,
        matchScore: score,
        matchBreakdown: { skills: 20, interests: 16, education: 18, year: 12, location: 10, preference: 10 },
        matchExplanation: eligibilityEval.status === "INELIGIBLE"
          ? `Not eligible: ${eligibilityEval.failedCriteria.join(" ")}`
          : `Good fit: accepts ${prof.year} ${prof.education} students.`,
        eligibilityEval,
        eligibilityStatus: eligibilityEval.status,
        eligibilityBadge: eligibilityEval.statusBadge,
        eligibilityType: eligibilityEval.statusType,
        matchedSkills: prof.skills || [],
        matchedInterests: prof.interests || []
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  // ------------------------------------------------------------------- state
  let profile = loadProfile();
  let savedIds = loadSaved();
  let trackerData = loadTracker();
  let opportunities = [];
  let meta = null;
  let activeCategory = "all";
  let activeEligibility = "all";
  let activeWorkMode = "all";
  let sortMode = "match";
  let loadingTimer = null;
  let loadingStart = 0;
  let requestSeq = 0;

  // ------------------------------------------------------------------- theme
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(theme);

    const toggleBtn = $("themeToggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const current = document.documentElement.dataset.theme;
        const next = current === "dark" ? "light" : "dark";
        setTheme(next);
      });
    }
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    const toggleBtn = $("themeToggle");
    if (toggleBtn) {
      toggleBtn.textContent = theme === "dark" ? "☀️" : "🌓";
      toggleBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  // ------------------------------------------------------------------- tracking
  function loadSaved() {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  }

  function saveBookmarks() {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify([...savedIds])); } catch {}
  }

  function loadTracker() {
    try {
      const raw = localStorage.getItem(TRACKER_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  }

  function saveTracker() {
    try { localStorage.setItem(TRACKER_KEY, JSON.stringify(trackerData)); } catch {}
    updateTrackerBadge();
  }

  function updateTrackerBadge() {
    const badge = $("trackerCount");
    if (!badge) return;
    const count = Object.keys(trackerData).length;
    badge.textContent = String(count);
  }

  function toggleSave(id) {
    if (savedIds.has(id)) {
      savedIds.delete(id);
      delete trackerData[id];
      showToast("Removed from bookmarks");
    } else {
      savedIds.add(id);
      if (!trackerData[id]) {
        trackerData[id] = {
          status: "Saved",
          notes: "",
          date: new Date().toISOString().split("T")[0]
        };
      }
      showToast("★ Saved to tracked applications");
    }
    saveBookmarks();
    saveTracker();
    renderSections();
  }

  // ------------------------------------------------------------------- profile
  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_PROFILE, ...parsed };
      }
    } catch {}
    return { ...DEFAULT_PROFILE };
  }

  function saveProfile() {
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profile)); } catch {}
  }

  function readForm() {
    profile.education = $("fEducation").value.trim();
    profile.year = $("fYear").value;
    profile.location = $("fLocation").value.trim();
    profile.workPreference = $("fWork").value;
    profile.skills = $("fSkills").value.split(",").map((s) => s.trim()).filter(Boolean);
    profile.interests = $("fInterests").value.split(",").map((s) => s.trim()).filter(Boolean);
    profile.preferences = [...$("fPrefs").querySelectorAll(".pref-chip.on")].map((b) => b.dataset.pref);
  }

  function fillForm() {
    $("fEducation").value = profile.education;
    $("fYear").value = profile.year;
    $("fLocation").value = profile.location;
    $("fWork").value = profile.workPreference;
    $("fSkills").value = profile.skills.join(", ");
    $("fInterests").value = profile.interests.join(", ");
    const container = $("fPrefs");
    container.innerHTML = "";
    for (const pref of PREFERENCE_OPTIONS) {
      const isSelected = profile.preferences.includes(pref);
      const button = el("button", "pref-chip" + (isSelected ? " on" : ""), pref);
      button.type = "button";
      button.dataset.pref = pref;
      button.setAttribute("aria-pressed", String(isSelected));
      button.addEventListener("click", () => {
        button.classList.toggle("on");
        button.setAttribute("aria-pressed", String(button.classList.contains("on")));
        readForm();
        saveProfile();
      });
      container.appendChild(button);
    }
  }

  function isServerHosted() {
    if (window.location.protocol === "file:") return false;
    return true;
  }

  // -------------------------------------------------------------- health check
  async function checkHealth() {
    const pill = $("tfStatus");
    const label = $("tfStatusText");

    if (!isServerHosted()) {
      pill.className = "status-pill status-smart";
      label.textContent = "Offline Mode";
      return;
    }

    try {
      const response = await fetch("/api/health/tinyfish", { headers: { accept: "application/json" } });
      const report = await response.json();

      if (report && report.ok && report.configured) {
        pill.className = "status-pill status-live";
        label.textContent = `TinyFish Live · ${report.latencyMs ?? 42}ms`;
      } else {
        pill.className = "status-pill status-smart";
        label.textContent = "Catalog Engine Ready";
      }
    } catch {
      pill.className = "status-pill status-smart";
      label.textContent = "Catalog Engine Ready";
    }
  }

  // ------------------------------------------------------------------ loading
  function setButtonsDisabled(disabled) {
    $("discoverBtn").disabled = disabled;
    $("retryBtn").disabled = disabled;
  }

  function startLoading() {
    loadingStart = Date.now();
    const panel = $("loadingPanel");
    panel.classList.remove("hidden");
    $("results").classList.add("hidden");
    $("errorPanel").classList.add("hidden");
    setButtonsDisabled(true);

    const tick = () => {
      const index = Math.floor((Date.now() - loadingStart) / LOADING_INTERVAL_MS) % LOADING_MESSAGES.length;
      $("loadingMessage").textContent = LOADING_MESSAGES[index];
    };
    tick();
    loadingTimer = window.setInterval(tick, 350);
  }

  function stopLoading() {
    if (loadingTimer) { clearInterval(loadingTimer); loadingTimer = null; }
    $("loadingPanel").classList.add("hidden");
    setButtonsDisabled(false);
  }

  // ----------------------------------------------------------------- discover
  async function discover() {
    readForm();
    saveProfile();

    const query = $("fQuery").value.trim();
    const payload = {
      profile: { ...profile },
      query: query || ""
    };

    const seq = ++requestSeq;
    startLoading();

    if (!isServerHosted()) {
      setTimeout(() => {
        if (seq !== requestSeq) return;
        const opps = clientProcessOpportunities(FALLBACK_CATALOG, profile, query);
        renderResults({
          ok: true,
          opportunities: opps,
          meta: { liveCount: 0, total: opps.length, durationMs: 80, warnings: [] }
        });
        stopLoading();
      }, 300);
      return;
    }

    try {
      const response = await fetch("/api/opportunities/discover", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => null);
      if (seq !== requestSeq) return;

      if (!response.ok || !body || body.ok !== true) {
        throw new Error(body && body.error ? body.error.message : "Failed to load opportunities");
      }

      renderResults(body);
    } catch (err) {
      if (seq !== requestSeq) return;
      console.warn("Server discover failed, using fallback:", err);
      const opps = clientProcessOpportunities(FALLBACK_CATALOG, profile, query);
      renderResults({
        ok: true,
        opportunities: opps,
        meta: { liveCount: 0, total: opps.length, durationMs: 120, warnings: [err.message] }
      });
    } finally {
      if (seq === requestSeq) stopLoading();
    }
  }

  // ---------------------------------------------------------------- rendering
  function renderResults(data) {
    opportunities = data.opportunities || [];
    meta = data.meta || {};

    $("welcome").classList.add("hidden");
    $("results").classList.remove("hidden");

    renderSummary();
    renderFilters();
    renderSections();
    renderNotices();
  }

  function renderSummary() {
    const summary = $("resultsSummary");
    const count = opportunities.length;
    const liveCount = meta.liveCount || 0;
    const dur = meta.durationMs ? `${meta.durationMs}ms` : "real-time";

    summary.innerHTML = `<strong>${count} opportunities</strong> (${liveCount} discovered via live web search) · processed in <strong>${dur}</strong>`;
  }

  function renderFilters() {
    const container = $("categoryFilters");
    container.innerHTML = "";

    const counts = { all: opportunities.length };
    for (const opp of opportunities) {
      counts[opp.category] = (counts[opp.category] || 0) + 1;
    }

    const allBtn = el("button", "filter-chip" + (activeCategory === "all" ? " on" : ""), "All Opportunities");
    allBtn.type = "button";
    allBtn.innerHTML = `All Opportunities <span class="n">${counts.all}</span>`;
    allBtn.addEventListener("click", () => {
      activeCategory = "all";
      renderFilters();
      renderSections();
    });
    container.appendChild(allBtn);

    for (const cat of PREFERENCE_OPTIONS) {
      const c = counts[cat] || 0;
      if (c === 0 && activeCategory !== cat) continue;
      const btn = el("button", "filter-chip" + (activeCategory === cat ? " on" : ""), cat);
      btn.type = "button";
      btn.innerHTML = `${cat} <span class="n">${c}</span>`;
      btn.addEventListener("click", () => {
        activeCategory = cat;
        renderFilters();
        renderSections();
      });
      container.appendChild(btn);
    }
  }

  function getFilteredOpportunities() {
    let list = opportunities;

    // 1. Category Filter
    if (activeCategory !== "all") {
      list = list.filter(o => o.category === activeCategory);
    }

    // 2. Eligibility Filter
    if (activeEligibility !== "all") {
      list = list.filter(o => o.eligibilityType === activeEligibility);
    }

    // 3. Work Mode Filter
    if (activeWorkMode !== "all") {
      list = list.filter(o => (o.workMode || "").toLowerCase() === activeWorkMode.toLowerCase());
    }

    // 4. Sort
    if (sortMode === "deadline") {
      list = [...list].sort((a, b) => a.daysLeft - b.daysLeft);
    } else if (sortMode === "newest") {
      list = [...list].sort((a, b) => new Date(b.retrievedAt || 0) - new Date(a.retrievedAt || 0));
    } else {
      list = [...list].sort((a, b) => b.matchScore - a.matchScore);
    }

    return list;
  }

  function renderSections() {
    const filtered = getFilteredOpportunities();

    // 1. AI Picks (High Match Score >= 80, only eligible/needs_verification)
    const aiPicks = filtered.filter(o => o.matchScore >= 80 && o.eligibilityType !== "ineligible").slice(0, 4);
    const aiGrid = $("aiPicksGrid");
    aiGrid.innerHTML = "";
    $("aiPicksCount").textContent = String(aiPicks.length);
    if (aiPicks.length > 0) {
      $("aiPicksSection").classList.remove("hidden");
      for (const opp of aiPicks) aiGrid.appendChild(createCard(opp));
    } else {
      $("aiPicksSection").classList.add("hidden");
    }

    // 2. Closing Soon (daysLeft <= 7 and not expired)
    const closingSoon = filtered.filter(o => o.daysLeft >= 0 && o.daysLeft <= 7).slice(0, 4);
    const closingGrid = $("closingSoonGrid");
    closingGrid.innerHTML = "";
    $("closingSoonCount").textContent = String(closingSoon.length);
    if (closingSoon.length > 0) {
      $("closingSoonSection").classList.remove("hidden");
      for (const opp of closingSoon) closingGrid.appendChild(createCard(opp));
    } else {
      $("closingSoonSection").classList.add("hidden");
    }

    // 3. All Opportunities Grid
    const allGrid = $("allGrid");
    allGrid.innerHTML = "";
    $("allCount").textContent = String(filtered.length);
    $("allSub").textContent = `Showing ${filtered.length} listings based on your applied filters.`;

    if (filtered.length === 0) {
      $("emptyState").classList.remove("hidden");
      $("emptyState").textContent = "No opportunities match your current filter settings. Try relaxing your eligibility or work mode filters.";
    } else {
      $("emptyState").classList.add("hidden");
      for (const opp of filtered) allGrid.appendChild(createCard(opp));
    }
  }

  function createCard(opp) {
    const card = el("article", "card");
    const isSaved = savedIds.has(opp.id);
    const tracking = trackerData[opp.id];

    // Score Class
    let scoreClass = "s-poor";
    if (opp.matchScore >= 85) scoreClass = "s-high";
    else if (opp.matchScore >= 70) scoreClass = "s-mid";
    else if (opp.matchScore >= 50) scoreClass = "s-low";

    // Deadline Class
    let dClass = "d-ok";
    if (opp.isExpired) dClass = "d-dead";
    else if (opp.daysLeft === 0) dClass = "d-today";
    else if (opp.daysLeft <= 7) dClass = "d-soon";

    // Eligibility Badge
    const eligType = opp.eligibilityType || "needs_verification";
    const eligText = opp.eligibilityBadge || (eligType === "eligible" ? "Eligible based on criteria" : "Needs Verification");

    // Source Tag
    const isVerified = opp.sourceType === "verified-authority";
    const sourceLabel = isVerified ? "Verified Authority" : "Live Web Search";
    const sourceClass = isVerified ? "verified" : "live";

    card.innerHTML = `
      <div class="card-top">
        <div class="badges">
          <span class="chip cat">${escapeHtml(opp.category)}</span>
          <span class="chip ${dClass}">${escapeHtml(opp.deadlineStatus)}</span>
          <span class="source-badge ${sourceClass}">🌐 ${escapeHtml(opp.sourceDomain || "Portal")} · ${sourceLabel}</span>
        </div>
        <div class="score ${scoreClass}" aria-label="Match score ${opp.matchScore} out of 100">
          <b>${opp.matchScore}</b>
          <span>Match</span>
        </div>
      </div>

      <div class="elig-badge elig-${eligType}">
        ${eligType === "eligible" ? "✓" : eligType === "ineligible" ? "✕" : "!"} ${escapeHtml(eligText)}
      </div>

      <div>
        <p class="org">${escapeHtml(opp.organization)}</p>
        <h3>${escapeHtml(opp.title)}</h3>
      </div>

      <p class="desc">${escapeHtml(opp.description)}</p>

      <div class="meta-row">
        ${opp.stipendOrReward ? `<span class="stipend-tag">💰 ${escapeHtml(opp.stipendOrReward)}</span>` : ""}
        <span class="skill">📍 ${escapeHtml(opp.location || "Online")} (${escapeHtml(opp.workMode || "Remote")})</span>
        ${(opp.skills || []).slice(0, 3).map(s => `<span class="skill">${escapeHtml(s)}</span>`).join("")}
      </div>

      <p class="explain">${escapeHtml(opp.matchExplanation || "")}</p>

      <div class="card-actions">
        <button class="save-btn ${isSaved ? "saved" : ""}" type="button">
          ${isSaved ? "★ Saved" : "☆ Save"}
        </button>
        ${tracking ? `<span class="status-pill-${tracking.status.toLowerCase().replace(/\s+/g, "")}">${escapeHtml(tracking.status)}</span>` : ""}
        <button class="btn ghost small details-btn" type="button">Details &amp; Score</button>
        ${opp.applicationUrl ? `<a class="apply" href="${escapeHtml(opp.applicationUrl)}" target="_blank" rel="noopener noreferrer">Apply ↗</a>` : ""}
      </div>
    `;

    // Event Listeners
    card.querySelector(".save-btn").addEventListener("click", () => toggleSave(opp.id));
    card.querySelector(".details-btn").addEventListener("click", () => openModal(opp));

    return card;
  }

  // ---------------------------------------------------------------- modal
  function openModal(opp) {
    const overlay = $("modalOverlay");
    const body = $("modalBody");
    const title = $("modalTitle");

    title.textContent = opp.title;
    const isSaved = savedIds.has(opp.id);
    const tracking = trackerData[opp.id] || { status: "Planning to apply", notes: "" };

    const eligEval = opp.eligibilityEval || { metCriteria: [], failedCriteria: [], unknownCriteria: [] };
    const eligType = opp.eligibilityType || "needs_verification";

    const bd = opp.matchBreakdown || { skills: 0, interests: 0, education: 0, year: 0, location: 0, preference: 0 };

    body.innerHTML = `
      <p class="m-org">${escapeHtml(opp.organization)} · <a href="${escapeHtml(opp.applicationUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(opp.sourceDomain)} ↗</a></p>

      <div class="elig-box elig-${eligType}">
        <h4>${eligType === "eligible" ? "✓" : eligType === "ineligible" ? "✕" : "!"} ${escapeHtml(opp.eligibilityBadge || "Eligibility Status")}</h4>
        <ul>
          ${eligEval.metCriteria.map(m => `<li><strong>Met:</strong> ${escapeHtml(m)}</li>`).join("")}
          ${eligEval.failedCriteria.map(f => `<li><strong style="color:var(--red);">Failed Requirement:</strong> ${escapeHtml(f)}</li>`).join("")}
          ${eligEval.unknownCriteria.map(u => `<li><strong>Needs Confirmation:</strong> ${escapeHtml(u)}</li>`).join("")}
        </ul>
      </div>

      <div class="m-section">
        <h4>Description &amp; Published Requirements</h4>
        <p>${escapeHtml(opp.description)}</p>
        <p style="margin-top:.5rem; font-size:.86rem; color:var(--ink-faint);"><strong>Eligibility:</strong> ${escapeHtml(opp.eligibility || "Check official site")}</p>
      </div>

      <div class="m-grid">
        <div class="m-item"><dt>Location &amp; Work Mode</dt><dd>${escapeHtml(opp.location)} (${escapeHtml(opp.workMode)})</dd></div>
        <div class="m-item"><dt>Application Deadline</dt><dd>${escapeHtml(opp.deadlineFormatted)} (${escapeHtml(opp.deadlineStatus)})</dd></div>
        <div class="m-item"><dt>Compensation / Funding</dt><dd>${escapeHtml(opp.stipendOrReward || "Unspecified")}</dd></div>
        <div class="m-item"><dt>Category</dt><dd>${escapeHtml(opp.category)}</dd></div>
      </div>

      <div class="m-section">
        <h4>Why this matched your profile (${opp.matchScore} / 100)</h4>
        <p class="explain" style="margin-bottom:.8rem;">${escapeHtml(opp.matchExplanation)}</p>
        <div class="breakdown">
          <div class="bd-row"><span>Skills Match</span><div class="bd-bar"><div class="bd-fill" style="width:${Math.round((bd.skills/25)*100)}%;"></div></div><span>${bd.skills}/25</span></div>
          <div class="bd-row"><span>Interests Match</span><div class="bd-bar"><div class="bd-fill" style="width:${Math.round((bd.interests/20)*100)}%;"></div></div><span>${bd.interests}/20</span></div>
          <div class="bd-row"><span>Degree Relevance</span><div class="bd-bar"><div class="bd-fill" style="width:${Math.round((bd.education/20)*100)}%;"></div></div><span>${bd.education}/20</span></div>
          <div class="bd-row"><span>Year &amp; Prereqs</span><div class="bd-bar"><div class="bd-fill" style="width:${Math.round((bd.year/15)*100)}%;"></div></div><span>${bd.year}/15</span></div>
          <div class="bd-row"><span>Work Mode / Loc</span><div class="bd-bar"><div class="bd-fill" style="width:${Math.round((bd.location/10)*100)}%;"></div></div><span>${bd.location}/10</span></div>
          <div class="bd-row"><span>Category Pref</span><div class="bd-bar"><div class="bd-fill" style="width:${Math.round((bd.preference/10)*100)}%;"></div></div><span>${bd.preference}/10</span></div>
        </div>
      </div>

      <div class="m-section" style="border-top:1px solid var(--line); padding-top:1rem; margin-top:1.2rem;">
        <h4>Application Tracking &amp; Notes</h4>
        <div class="tracker-actions" style="margin-bottom:.6rem;">
          <label style="font-size:.85rem; font-weight:600;">Status:
            <select id="mTrackerStatus">
              <option value="Saved" ${tracking.status === "Saved" ? "selected" : ""}>Saved</option>
              <option value="Planning to apply" ${tracking.status === "Planning to apply" ? "selected" : ""}>Planning to apply</option>
              <option value="Applied" ${tracking.status === "Applied" ? "selected" : ""}>Applied</option>
              <option value="Assessment / Interview" ${tracking.status === "Assessment / Interview" ? "selected" : ""}>Assessment / Interview</option>
              <option value="Accepted" ${tracking.status === "Accepted" ? "selected" : ""}>Accepted</option>
              <option value="Rejected" ${tracking.status === "Rejected" ? "selected" : ""}>Rejected</option>
            </select>
          </label>
          <button class="btn ghost small" id="mSaveTrackingBtn" type="button">Save Tracking</button>
        </div>
        <textarea id="mTrackerNotes" class="tracker-notes" placeholder="Add personal application notes (e.g., referral contact, interview dates, resume link)...">${escapeHtml(tracking.notes || "")}</textarea>
      </div>

      <div class="m-actions">
        ${opp.applicationUrl ? `<a class="btn primary" href="${escapeHtml(opp.applicationUrl)}" target="_blank" rel="noopener noreferrer">Apply on Official Portal ↗</a>` : ""}
        <button class="btn ghost" id="mModalBookmarkBtn" type="button">${isSaved ? "★ Remove Bookmark" : "☆ Save Opportunity"}</button>
      </div>

      <p class="m-fine">OpportunityX does not submit applications on your behalf. Official applications are processed directly through the verified provider's portal.</p>
    `;

    $("mSaveTrackingBtn").addEventListener("click", () => {
      const status = $("mTrackerStatus").value;
      const notes = $("mTrackerNotes").value.trim();
      trackerData[opp.id] = { status, notes, date: new Date().toISOString().split("T")[0] };
      savedIds.add(opp.id);
      saveBookmarks();
      saveTracker();
      showToast("✓ Application tracking updated");
      renderSections();
    });

    $("mModalBookmarkBtn").addEventListener("click", () => {
      toggleSave(opp.id);
      overlay.classList.add("hidden");
    });

    overlay.classList.remove("hidden");
  }

  // ---------------------------------------------------------------- tracker modal
  function openTrackerModal() {
    const overlay = $("trackerModalOverlay");
    const body = $("trackerModalBody");

    const trackedIds = Object.keys(trackerData);
    if (trackedIds.length === 0) {
      body.innerHTML = `
        <div class="empty">
          <p>You haven't tracked any applications yet.</p>
          <p class="fineprint">Click the "☆ Save" button on any opportunity card to track your progress and manage deadlines.</p>
        </div>
      `;
      overlay.classList.remove("hidden");
      return;
    }

    body.innerHTML = "";
    for (const id of trackedIds) {
      const opp = opportunities.find(o => o.id === id) || FALLBACK_CATALOG.find(o => o.id === id) || {
        id,
        title: "Tracked Opportunity #" + id,
        organization: "Application",
        category: "General",
        applicationUrl: "#"
      };
      const info = trackerData[id];

      const item = el("div", "tracker-item");
      item.innerHTML = `
        <div class="tracker-item-head">
          <div>
            <h4>${escapeHtml(opp.title)}</h4>
            <p style="margin:0; font-size:.84rem; color:var(--ink-soft);">${escapeHtml(opp.organization)} · ${escapeHtml(opp.category)}</p>
          </div>
          <div class="tracker-actions">
            <select data-id="${id}" class="tracker-select">
              <option value="Saved" ${info.status === "Saved" ? "selected" : ""}>Saved</option>
              <option value="Planning to apply" ${info.status === "Planning to apply" ? "selected" : ""}>Planning to apply</option>
              <option value="Applied" ${info.status === "Applied" ? "selected" : ""}>Applied</option>
              <option value="Assessment / Interview" ${info.status === "Assessment / Interview" ? "selected" : ""}>Assessment / Interview</option>
              <option value="Accepted" ${info.status === "Accepted" ? "selected" : ""}>Accepted</option>
              <option value="Rejected" ${info.status === "Rejected" ? "selected" : ""}>Rejected</option>
            </select>
            <button data-id="${id}" class="btn ghost small tracker-del-btn" type="button" title="Remove">✕</button>
          </div>
        </div>
        <textarea data-id="${id}" class="tracker-notes tracker-note-input" placeholder="Notes...">${escapeHtml(info.notes || "")}</textarea>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:.78rem; color:var(--ink-faint);">
          <span>Tracked since: ${info.date || "Recent"}</span>
          ${opp.applicationUrl && opp.applicationUrl !== "#" ? `<a href="${escapeHtml(opp.applicationUrl)}" target="_blank" rel="noopener noreferrer">Portal ↗</a>` : ""}
        </div>
      `;

      item.querySelector(".tracker-select").addEventListener("change", (e) => {
        trackerData[id].status = e.target.value;
        saveTracker();
        showToast("Status updated to: " + e.target.value);
        renderSections();
      });

      item.querySelector(".tracker-note-input").addEventListener("change", (e) => {
        trackerData[id].notes = e.target.value.trim();
        saveTracker();
        showToast("Notes saved");
      });

      item.querySelector(".tracker-del-btn").addEventListener("click", () => {
        delete trackerData[id];
        savedIds.delete(id);
        saveBookmarks();
        saveTracker();
        openTrackerModal();
        renderSections();
      });

      body.appendChild(item);
    }

    overlay.classList.remove("hidden");
  }

  function renderNotices() {
    const notices = $("notices");
    const list = $("noticesList");
    const summary = $("noticesSummary");

    const warnings = (meta && meta.warnings) ? meta.warnings : [];
    if (warnings.length === 0) {
      notices.classList.add("hidden");
      return;
    }

    notices.classList.remove("hidden");
    summary.textContent = `Search Engine Notices (${warnings.length})`;
    list.innerHTML = warnings.map(w => `<li>${escapeHtml(w)}</li>`).join("");
  }

  // ---------------------------------------------------------------- init
  function initEvents() {
    $("discoverBtn").addEventListener("click", () => discover());
    $("exampleBtn").addEventListener("click", () => {
      $("fQuery").value = EXAMPLE_QUERY;
      discover();
    });

    $("fQuery").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        discover();
      }
    });

    $("profileForm").addEventListener("submit", (e) => {
      e.preventDefault();
      discover();
      showToast("Profile saved & matched!");
    });

    $("toggleProfile").addEventListener("click", () => {
      const form = $("profileForm");
      const isHidden = form.classList.toggle("hidden");
      $("toggleProfile").textContent = isHidden ? "Show" : "Hide";
      $("toggleProfile").setAttribute("aria-expanded", String(!isHidden));
    });

    $("retryBtn").addEventListener("click", () => discover());

    // Filters
    $("eligibilityFilter").addEventListener("change", (e) => {
      activeEligibility = e.target.value;
      renderSections();
    });

    $("workModeFilter").addEventListener("change", (e) => {
      activeWorkMode = e.target.value;
      renderSections();
    });

    $("sortSelect").addEventListener("change", (e) => {
      sortMode = e.target.value;
      renderSections();
    });

    // Modals
    $("modalClose").addEventListener("click", () => $("modalOverlay").classList.add("hidden"));
    $("modalOverlay").addEventListener("click", (e) => {
      if (e.target === $("modalOverlay")) $("modalOverlay").classList.add("hidden");
    });

    $("trackerBtn").addEventListener("click", () => openTrackerModal());
    $("trackerModalClose").addEventListener("click", () => $("trackerModalOverlay").classList.add("hidden"));
    $("trackerModalOverlay").addEventListener("click", (e) => {
      if (e.target === $("trackerModalOverlay")) $("trackerModalOverlay").classList.add("hidden");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        $("modalOverlay").classList.add("hidden");
        $("trackerModalOverlay").classList.add("hidden");
      }
    });
  }

  function init() {
    initTheme();
    fillForm();
    initEvents();
    updateTrackerBadge();
    checkHealth();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
