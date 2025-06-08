/* -------------------------------------------------------------------- */
/*  src/lib/tmdb.ts — movie + TV lookup without ±year margin            */
/* -------------------------------------------------------------------- */
import pLimit from "p-limit";

const BASE = "https://api.themoviedb.org/3";
const key  = process.env.NEXT_PUBLIC_TMDB_KEY!;
const limit = pLimit(5);                       // ≤5 concurrent TMDB calls
const cache = new Map<string, string>();       // title-year → director

/* helper: simple movie search returns up to 4 ids, exact year only */
async function movieIds(title: string, year: string): Promise<number[]> {
  const ids: number[] = [];
  const url =
    `${BASE}/search/movie?api_key=${key}` +
    `&query=${encodeURIComponent(title)}` +
    `&year=${year}`;
  const r = await limit(() => fetch(url)).then(r => r.json());
  
  const filteredfilm = r.results.filter((film: any) => 
    film.title.trim().toLowerCase() === title.trim().toLowerCase() );
  
  filteredfilm?.slice(0,1).forEach((film: any) => {
    if (film.id && !ids.includes(film.id)) ids.push(film.id);
  });

  /* Fallback */
  const urlfb =
    `${BASE}/search/movie?api_key=${key}` +
    `&query=${encodeURIComponent(title)}`;
  const rfb = await limit(() => fetch(urlfb)).then(rfb => rfb.json());
  const filteredfilmfb = rfb.results.filter((film: any) => 
    film.title.trim().toLowerCase() === title.trim().toLowerCase() );
  filteredfilmfb?.slice(0,1).forEach((film: any) => {
    const urlrelease = `${BASE}/movie/${film.id}/release_dates?api_key=${key}`;
      const release = fetch(urlrelease).then(release => release.json());
  });

  return ids;
}

/* helper: fetch director for a given movie OR tv id */
async function fetchDirector(id: number, type: "movie" | "tv"): Promise<string | undefined> {
  const url =
    `${BASE}/${type}/${id}?api_key=${key}&append_to_response=credits,aggregate_credits`;
  const data = await limit(() => fetch(url)).then(r => r.json());

  let d = data.credits?.crew?.find((c: any) => c.job === "Director")?.name;
  if (!d && data.aggregate_credits) {
    d = data.aggregate_credits.crew
        ?.find((c: any) =>
          (c.jobs && c.jobs.includes("Director")) || c.job === "Director")
        ?.name;
  }
  return d;
}

/* exported helper */
export async function getDirector(title: string, year: string): Promise<string> {
  const cacheKey = `${title}-${year}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  /* 1️⃣ try movie IDs (exact year only) */
  for (const id of await movieIds(title, year)) {
    const d = await fetchDirector(id, "movie");
    if (d) { cache.set(cacheKey, d); return d; }
  }

  /* 2️⃣ TV fallback */
  const tvUrl =
    `${BASE}/search/tv?api_key=${key}&query=${encodeURIComponent(title)}`;
  const tv = await limit(() => fetch(tvUrl)).then(r => r.json());
  if (tv.results?.[0]?.id) {
    const d = await fetchDirector(tv.results[0].id, "tv");
    if (d) { cache.set(cacheKey, d); return d; }
  }

  cache.set(cacheKey, "Unknown");
  return "Unknown";
}
