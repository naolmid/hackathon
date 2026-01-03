export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    // Fetch resources from the specified location
    const resources = await prisma.resourceItem.findMany({
      where: {
        locationId: locationId,
        currentQuantity: { gt: 0 }, // Only show resources that are available
      },
      select: {
        id: true,
        name: true,
        type: true,
        currentQuantity: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ resources });
  } catch (error: any) {
    console.error("Error fetching resources by location:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources", details: error.message },
      { status: 500 }
    );
  }
}


