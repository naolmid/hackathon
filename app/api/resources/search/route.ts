import { NextRequest, NextResponse } from "next/server";
import { searchResources } from "@/lib/resource-tree";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const campusId = searchParams.get("campusId") || undefined;

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const resources = await searchResources(query, campusId);
    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Error searching resources:", error);
    return NextResponse.json(
      { error: "Failed to search resources" },
      { status: 500 }
    );
  }
}

