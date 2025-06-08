# BoxdStats

**BoxdStats** lets you upload a Letterboxd CSV export and using TMDB's API shows :  
 
 - Your top rated directors
 - (Future features)

Built with **Next.js 14 / React / TypeScript** as a personal BTS SIO project.

---

## Tech stack

| Front end | Back end |
|-----------|----------|
| Next 14 (App Router) / React / Tailwind CSS | Node 18 Route Handlers |

---

## Setup

```bash
# 1. Clone or download
git clone https://github.com/<your-user>/boxdstats.git
cd boxdstats      # or unzip the download then cd boxdstats

# 2. Install deps
npm install

# 3. TMDB key (required)
Go to https://developer.themoviedb.org/
Sign in (or create a free account)
Navigate to Settings -> API and request an API Token
Copy the key shown
create .env.local file
edit .env.local and paste:
TMDB_API_KEY=<your-api-key>

# 4. Run
npm run dev
open http://localhost:3000
