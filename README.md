# BoxdStats

**BoxdStats** lets you upload a Letterboxd CSV export and (for now) shows your top-rated directors.  
Built with **Next.js 14 / React / TypeScript** as a personal BTS SIO project.

---

## Tech stack

| Front end | Back end |
|-----------|----------|
| Next 14 (App Router) / React / Tailwind CSS | Node 18 Route Handlers |
| TypeScript | csv-parse |

---

## Setup

```bash
# 1. Clone or download
git clone https://github.com/<your-user>/boxdstats.git
cd boxdstats      # or unzip the download then cd boxdstats

# 2. Install deps
npm install

# 3. TMDB key (required)
# create .env.local file
# edit .env.local and paste:
# TMDB_API_KEY=xxxxxxxxxxxxxxxxxxxx

# 4. Run
npm run dev
# open http://localhost:3000
