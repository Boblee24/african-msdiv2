import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await initDb();

    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const confidence = searchParams.get("confidence");
    const source = searchParams.get("source");

    // Build filtered query
    let datasets;
    if (country && country !== "all") {
      datasets = await sql`
        SELECT * FROM datasets WHERE node_code = ${country}
        ORDER BY node_country, id
      `;
    } else if (confidence && confidence !== "all") {
      datasets = await sql`
        SELECT * FROM datasets WHERE confidence_level = ${confidence}
        ORDER BY node_country, id
      `;
    } else if (source && source !== "all") {
      datasets = await sql`
        SELECT * FROM datasets WHERE data_source = ${source}
        ORDER BY node_country, id
      `;
    } else {
      datasets = await sql`SELECT * FROM datasets ORDER BY node_country, id`;
    }

    // Keep marker payload bounded, but return full-table CSB counts for stats.
    const submissions = await sql`
      SELECT * FROM csb_submissions ORDER BY created_at DESC LIMIT 100
    `;

    const csbStatsRows = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE validation_status = 'validated')::int AS validated,
        COUNT(*) FILTER (WHERE validation_status = 'flagged')::int AS flagged,
        COUNT(*) FILTER (WHERE validation_status = 'rejected')::int AS rejected
      FROM csb_submissions
    `;

    return NextResponse.json({
      datasets,
      submissions,
      csbStats: csbStatsRows[0] ?? { total: 0, validated: 0, flagged: 0, rejected: 0 },
    });
  } catch (error) {
    console.error("GET /api/datasets error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
