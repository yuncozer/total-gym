import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { fetchEquipment, EQUIPMENT_MAP } from "@/app/lib/wgerApi";

export async function GET() {
  try {
    const equipment = await fetchEquipment();
    
    const transformedEquipment = equipment.map(eq => ({
      id: eq.id,
      name: EQUIPMENT_MAP[eq.id] || eq.name,
    }));

    return NextResponse.json(
      {
        success: true,
        total: transformedEquipment.length,
        data: transformedEquipment,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching equipment from WGER:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}