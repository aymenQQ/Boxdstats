
import pLimit from "p-limit";

const BASE = "https://api.themoviedb.org/3";
const key  = process.env.NEXT_PUBLIC_TMDB_KEY!;
const limit = pLimit(5);                       // ≤5 concurrent TMDB calls
const cache = new Map<string, string[]>();       // title-year → director

/* helper: simple movie search returns up to 4 ids, exact year only */
async function movieIds(title: string, year: string): Promise<number[]> {
  const ids: number[] = [];
  const url =
    `${BASE}/search/movie?api_key=${key}` +
    `&query=${encodeURIComponent(title)}` +
    `&year=${year}`;
  const r = await limit(() => fetch(url)).then(r => r.json());          
  
  const exactTitle = r.results.filter((film: any) =>                    /* Erases off the list movies that have a resembling title (Alien confused with Aliens or Alien³) */
    film.title.trim().toLowerCase() === title.trim().toLowerCase() );
  
  for (const film of exactTitle.slice(0, 1)) {
    if (film.id && !ids.includes(film.id)) ids.push(film.id);
  }

  /* Fallback, if TMDB date ≠ Letterboxd date, checks the earliest release date with the appropriate url to match letterboxd (Former code, not needed according to last tests) */
  /* 
  const urlfb =
    `${BASE}/search/movie?api_key=${key}` +
    `&query=${encodeURIComponent(title)}`;
  const rfb = await limit(() => fetch(urlfb)).then(rfb => rfb.json());

  const exactTitleFb = rfb.results.filter((film: any) => 
    film.title.trim().toLowerCase() === title.trim().toLowerCase() );

  exactTitleFb?.slice(0,1).forEach((film: any) => {
    const urlrelease = `${BASE}/movie/${film.id}/release_dates?api_key=${key}`;
      const release = fetch(urlrelease).then(release => release.json());
  });
  */

  return ids;
}

/* Fetch director for a given movie OR tv id */
async function fetchDirectors(id: number, type: "movie" | "tv"): Promise<string[]> {
  const url =
    `${BASE}/${type}/${id}?api_key=${key}&append_to_response=credits,aggregate_credits`;
  const data = await limit(() => fetch(url)).then(r => r.json());
  
  const movieDirectorName: string[] = 
  data.credits?.crew?.filter((crewMember: any) => crewMember.job === "Director").map((crewMember: any) => crewMember.name) || []; // Movie
  
  const tvDirectorName: string[] = 
  data.aggregate_credits?.crew?.filter((crewMember: any) => (Array.isArray(crewMember.jobs) && crewMember.jobs.some((j: any) => j.job === "Director")) || crewMember.job === "Director").map((crewMember: any) => crewMember.name) || []; // TV

  return Array.from(new Set([...movieDirectorName, ...tvDirectorName]));
}

/* Exported helper */
export async function getDirectors(title: string, year: string): Promise<string[]> {
  const cacheKey = `${title}-${year}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const allDirectorNames: string[] = [];

  /* Movies */
  for (const id of await movieIds(title, year)) {
    const names = await fetchDirectors(id, "movie");
    allDirectorNames.push(...names);
  }

  /* TV shows */
  const tvUrl =
    `${BASE}/search/tv?api_key=${key}` +
    `&query=${encodeURIComponent(title)}` +
    `&year=${year}`;
  const tv = await limit(() => fetch(tvUrl)).then(r => r.json());
  const shows = tv.results?.slice(0, 1) || [];

  for (const show of shows){
    if(show.id){
      const names = await fetchDirectors(show.id, "tv");
      allDirectorNames.push(...names);
    }
  }

  cache.set(cacheKey, allDirectorNames);
  return allDirectorNames;
}
