
import pLimit from "p-limit";

const BASE_TMDB_LINK = "https://api.themoviedb.org/3";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY!;
const concurrentCallsLimiter = pLimit(5);                       
const directorsCache = new Map<string, string[]>();

/* searches a movie with a title and a year, turns it into a json and returns ids 
of movie titles in the json that matches exactly the one given by the user's file */
async function fetchIds(title: string, year: string): Promise<number[]> {
  const ids: number[] = [];
  const QueryUrl =`${BASE_TMDB_LINK}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&year=${year}`
  
  const querryData = 
    await concurrentCallsLimiter(() =>
    fetch(QueryUrl))
    .then(response => response.json());
  
  const exactTitle = 
    querryData.results.filter((film: any) =>
    film.title.trim().toLowerCase() === title.trim().toLowerCase());

  for (const film of exactTitle.slice(0, 1)) {
    if (film.id && !ids.includes(film.id)) ids.push(film.id);
  }
  
  return ids;
}

/* searches the credits of the movie/show with its id, turn it into a json, 
and returns the names of crew members that have the jobs "director"  */
async function fetchDirectors(id: number, type: "movie" | "tv"): Promise<string[]> {
  const creditsUrl =`${BASE_TMDB_LINK}/${type}/${id}?api_key=${API_KEY}&append_to_response=credits,aggregate_credits`;
  
  const creditsData = 
    await concurrentCallsLimiter(() => 
    fetch(creditsUrl))
    .then(r => r.json());
  
  const movieDirectorName: string[] = 
    creditsData.credits?.crew?.
    filter((crewMember: any) => crewMember.job === "Director").
    map((crewMember: any) => crewMember.name) || [];
  
  const tvDirectorName: string[] = 
    creditsData.aggregate_credits?.crew?.
    filter((crewMember: any) => (Array.isArray(crewMember.jobs) && crewMember.jobs.some((j: any) => j.job === "Director")) || crewMember.job === "Director").
    map((crewMember: any) => crewMember.name) || []; // TV

  return Array.from(new Set([...movieDirectorName, ...tvDirectorName]));
}


export async function getDirectors(title: string, year: string): Promise<string[]> {
  const cacheKey = `${title}-${year}`;
  if (directorsCache.has(cacheKey)) return directorsCache.get(cacheKey)!;

  const allDirectorNames: string[] = [];

  /* Movies */
  for (const id of await fetchIds(title, year)) {
    const names = await fetchDirectors(id, "movie");
    allDirectorNames.push(...names);
  }

  /* TV shows */
  const tvUrl =`${BASE_TMDB_LINK}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;
  const tv = await concurrentCallsLimiter(() => fetch(tvUrl)).then(r => r.json());
  const shows = tv.results?.slice(0, 1) || [];

  for (const show of shows){
    if(show.id){
      const names = await fetchDirectors(show.id, "tv");
      allDirectorNames.push(...names);
    }
  }

  directorsCache.set(cacheKey, allDirectorNames);
  return allDirectorNames;
}
