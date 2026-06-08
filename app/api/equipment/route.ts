import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { EQUIPMENT_MAP } from "@/app/lib/wgerApi";

export async function GET() {
  const equipment = Object.entries(EQUIPMENT_MAP).map(([id, name]) => ({
    id: Number(id),
    name,
  }));

  return NextResponse.json(
    {
      success: true,
      total: equipment.length,
      data: equipment,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    }
  );
}