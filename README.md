# 🚀 OpportunityX — Personalized Opportunity Discovery Platform

**OpportunityX** is an intelligent, qualification-aware discovery platform designed to help students and early-career applicants find genuine opportunities tailored to their specific degree, academic year, skills, and work preferences.

Instead of manually navigating dozens of disjointed job boards and competition websites, OpportunityX unifies discovery across **all 10 core student categories**, strictly evaluates published eligibility criteria, and transparently explains why each opportunity matches or does not match your profile.

---

## 🎯 Core Value & Philosophy

1. **Qualification-Aware Gatekeeping:** Mandatory eligibility criteria (e.g., minimum academic year, accepted degree programs, residency, work mode) are evaluated **before** calculating relevance scores. A high relevance score never disguises a known mandatory eligibility failure.
2. **Honest Data Handling:** Clear distinction between verified authoritative portals and live web search results. If eligibility terms are not published or require confirmation, the system labels them `Needs Verification` rather than pretending the user qualifies.
3. **Multi-Source Aggregation:** Combines live web discovery powered by the **TinyFish Search API** (`api.search.tinyfish.ai`) with a verified database of premier global and national student programs.
4. **Complete Application Workspace:** In-browser application tracker supporting statuses (`Saved`, `Planning to apply`, `Applied`, `Interview / Assessment`, `Accepted`, `Rejected`) with private notes and dates.

---

## 📋 The 10 Opportunity Categories

| Category | Primary Evaluation Factors | Sample Verified Programs |
| :--- | :--- | :--- |
| **1. Internships** | Degree, academic year, skills, stipend, work mode, deadline | Google Summer of Code, Microsoft Explore, Uber STAR, Amazon AFE, LFX |
| **2. Jobs** | Degree, graduating year, experience level, CTC, location | Cisco Early Career, TCS NQT Digital, Google Early Career |
| **3. Hackathons** | Team rules, student eligibility, theme, prizes, dates | Smart India Hackathon (SIH), ETHIndia, MLH Global Hack Week |
| **4. Scholarships** | Education level, discipline, merit criteria, grant funding | Reliance Foundation Scholarship, Google Generation Scholarship |
| **5. Fellowships** | Academic standing, research domain, stipend, mentor institute | IISc Summer AI Fellowship, Indian Academy of Sciences (SRFP) |
| **6. Courses** | Prerequisites, difficulty, audit availability, certification | DeepLearning.AI GenAI, Harvard CS50 AI with Python |
| **7. Competitions** | Eligibility rules, team size, prize pool, submission deadline | Kaggle AI Olympiad, ICPC International Collegiate Contest |
| **8. Events** | Target audience, student passes, virtual streaming, dates | GitHub Universe Student Summit, AWS Summit Student Day |
| **9. Workshops** | Prerequisites, hands-on labs, sandbox credits, certificates | AWS GenAI Builder Workshop, Microsoft Reactor AI Series |
| **10. Conferences**| Student tracks, diversity grants, paper/poster submissions | PyCon India Student Track, ACM India Annual Conference |

---

## 🏗️ Technology Stack

- **Frontend:** Vanilla HTML5, Vanilla CSS3 (Custom properties, WCAG AA contrast, responsive layouts), Vanilla JavaScript (ES6+ modular architecture). Zero build step required.
- **Backend:** Native Node.js HTTP server (`server.js`) with zero npm runtime dependencies. Employs built-in `http`, `https`, `crypto`, `fs`, and `path`.
- **Search Provider:** TinyFish Search API (`https://api.search.tinyfish.ai`) for real-time live web indexing and opportunity discovery.
- **Testing:** Node.js native test runner (`node:test`, `node:assert`).
- **Serverless Integration:** Vercel Serverless Functions (`api/*`).

---

## 📂 Project Structure

```
OpportunityX/
├── .env.example                     # Environment template with credential documentation
├── .gitignore                       # Excludes secrets, logs, node_modules
├── .vercelignore                    # Excludes private config from Vercel deployments
├── index.html                       # Semantic, accessible HTML5 single-page application
├── styles.css                       # Design system with dark/light themes & animations
├── app.js                           # Frontend controller, state, tracking, and fallback engine
├── server.js                        # Node.js backend server & API dispatcher
├── package.json                     # Project scripts and metadata
├── vercel.json                      # Vercel deployment configuration
├── server/
│   ├── adapters/
│   │   └── tinyfish.js              # TinyFish Search API client with caching & rate-limit handling
│   ├── data/
│   │   └── curatedCatalog.js        # Authoritative verified database across all 10 categories
│   ├── engine/
│   │   ├── matcher.js               # 2-stage eligibility gate & weighted match scoring (0-100)
│   │   └── queryParser.js           # Natural-language query parser & constraint extractor
│   └── aggregator.js                # Multi-source deduplication, ranking, and partitioning
├── api/
│   ├── _engine.js                   # Serverless bridge to core server modules
│   ├── health/
│   │   └── tinyfish.js              # GET /api/health/tinyfish (live latency & health check)
│   └── opportunities/
│       └── discover.js              # POST /api/opportunities/discover (main discovery endpoint)
└── tests/
    └── eligibility.test.js          # Automated test suite covering 11 realistic test scenarios
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18.0.0 or later recommended).

### 1. Clone & Enter Directory
```bash
git clone https://github.com/namandhiman17/OpportunityX.git
cd OpportunityX
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` to include your TinyFish API key:
```env
OPPORTUNITYX_API_KEY="sk-tinyfish-your-api-key-here"
PORT=3000
```
> **Security Note:** `.env` is ignored by Git in `.gitignore`. Never commit API keys to version control.

### 3. Run the Development Server
```bash
npm start
# or
node server.js
```

Open your browser at:
👉 **`http://localhost:3000`**

---

## 🧪 Automated Testing

OpportunityX includes an automated test suite verifying eligibility gates, academic-year restrictions, search parsing, and score calculations.

Run tests with:
```bash
npm test
```
All 11 tests validate scenarios including:
- 1st-year BTech student matching early-year programs.
- Senior 4th-year/graduate engineering jobs (e.g., Cisco SWE) strictly marking 1st-year applicants as `INELIGIBLE`.
- Degree restrictions for scholarships (BTech vs. BA/BCom).
- Work mode preference conflicts (Remote vs. On-site).
- Query conflict detection (e.g., query requesting "4th year" while profile is "1st Year").

---

## 🌐 Connected Sources & Data Quality

### Currently Connected Sources
1. **TinyFish Live Search API:** Real-time web discovery across Indian and global student portals. Results are ingested, sanitized, and labeled with `sourceType: "live-web-discovery"`.
2. **Authoritative Student Catalog:** Curated entries from verified organizations (Google Open Source, Microsoft Careers, Reliance Foundation, AICTE, Ministry of Education, Devfolio, MLH, Coursera, Harvard edX, IISc). Labeled `sourceType: "verified-authority"`.

### Source Limitations
- Live web search results from external sites may not always state degree requirements in snippet text. In these cases, the engine honestly assigns `NEEDS_VERIFICATION` and links directly to the official portal for confirmation.
- Rate limits on search APIs are managed using an in-memory cache (15-minute TTL) with exponential backoff and fallback to the verified catalog.

---

## 🔐 Security Best Practices

- Private API keys are strictly kept server-side in `.env`.
- No credentials or private tokens are leaked in frontend bundles, script tags, or client network requests.
- All outbound external links use `rel="noopener noreferrer"` and `target="_blank"`.
- User bookmarks, profile data, and personal notes are stored locally in the user's browser `localStorage` ensuring privacy.

---

## 🚀 Deployment

### Deploying to Vercel
1. Push code to your repository:
   ```bash
   git add .
   git commit -m "Complete qualification-aware discovery engine and TinyFish integration"
   git push origin main
   ```
2. Import the repository into your Vercel Dashboard.
3. In **Project Settings > Environment Variables**, add:
   - `OPPORTUNITYX_API_KEY` = `sk-tinyfish-...`
4. Deploy! Vercel automatically routes `/api/*` to serverless functions and serves the frontend globally via CDN.
