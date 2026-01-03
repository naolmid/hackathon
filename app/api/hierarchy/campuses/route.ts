export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getAllCampuses } from "@/lib/hierarchy";

export async function GET(request: NextRequest) {
  try {
    const campuses = await getAllCampuses();
    return NextResponse.json({ campuses });
  } catch (error) {
    console.error("Error fetching campuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch campuses" },
      { status: 500 }
    );
  }
}


