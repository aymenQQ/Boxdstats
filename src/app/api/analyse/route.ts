import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { getDirectors } from "@/lib/tmdb";

/* Structure of ratings.csv */
type RatingsRow = { Name: string; Year: string; Rating: string };

export async function POST(req: NextRequest) {
  /* Plain text body */
  const csvText = await req.text();

  /* Parse rows that have BOTH title and rating */
  const rows = Papa.parse<RatingsRow>(csvText, { header: true })
    .data.filter(r => r.Name && r.Rating);

  /* Resolve directors (TMDB) and aggregate */
  type Bucket = { sum: number; count: number };
  const byDirector: Record<string, Bucket> = {};

  await Promise.all(
    rows.map(async r => {
      const director = await getDirectors(r.Name, r.Year);
      const rating   = parseFloat(r.Rating);

      director.forEach((d) => {
        if (!byDirector[d]) {
          byDirector[d] = { sum: 0, count: 0};
        }
        byDirector[d].sum += rating;
        byDirector[d].count += 1;
        });
      })
      
  );

  /* Build top-10 list */
  const toplist = Object.entries(byDirector)
    .filter(([, v]) => v.count >= 4)                    // ≥4 films threshold
    .map(([d, v]) => ({ director: d, avg: v.sum / v.count, films: v.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  return NextResponse.json({ toplist });
}
