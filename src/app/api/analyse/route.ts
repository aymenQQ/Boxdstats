import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { getDirectors } from "@/lib/tmdb";

type RatingsRow = { Name: string; Year: string; Rating: string };
type DirectorStats = { sum: number; count: number; };


export async function POST(request: NextRequest) {
  const csvText = await request.text();

  const minParam = request.nextUrl.searchParams.get("min");
  const minFilms = Math.max(1, Math.min(10, Number(minParam) || 4));

  const ratingRows: RatingsRow[] = Papa.parse<RatingsRow>(csvText, { header: true })
    .data.filter(row => row.Name && row.Rating);

  const byDirector: Record<string, DirectorStats> = {};

  await Promise.all(
    ratingRows.map(async (row) => {
      const director = await getDirectors(row.Name, row.Year);
      const rating   = parseFloat(row.Rating);

      director.forEach((directorName) => {
        if (!byDirector[directorName]) {
          byDirector[directorName] = { sum: 0, count: 0};
        }
        byDirector[directorName].sum += rating;
        byDirector[directorName].count += 1;
        });
      })    
  );

  const toplist = Object.entries(byDirector)
    .filter(([, stats]) => stats.count >= minFilms)
    .map(([director, stats]) => ({ director, avg: stats.sum / stats.count, films: stats.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  return NextResponse.json({ toplist });
}
