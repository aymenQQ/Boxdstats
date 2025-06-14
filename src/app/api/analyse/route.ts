import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { getDirector } from "@/lib/tmdb";

/* structure of ratings.csv */
type RatingsRow = { Name: string; Year: string; Rating: string };

export async function POST(req: NextRequest) {
  /* 1 – plain text body */
  const csvText = await req.text();

  /* 2 – parse rows that have BOTH title and rating */
  const rows = Papa.parse<RatingsRow>(csvText, { header: true })
    .data.filter(r => r.Name && r.Rating);

  /* 3 – resolve directors (TMDB) and aggregate */
  type Bucket = { sum: number; count: number };
  const byDirector: Record<string, Bucket> = {};

  await Promise.all(
    rows.map(async r => {
      const director = await getDirector(r.Name, r.Year);
      const rating   = parseFloat(r.Rating);
      if (!byDirector[director])
        byDirector[director] = { sum: 0, count: 0 };

      byDirector[director].sum   += rating;
      byDirector[director].count += 1;
    })
  );

  /* 4 – build top-10 list */
  const toplist = Object.entries(byDirector)
    .filter(([, v]) => v.count >= 4)                    // ≥3 films threshold
    .map(([d, v]) => ({ director: d, avg: v.sum / v.count, films: v.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  return NextResponse.json({ toplist });
}
