import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocationsByCampus } from "@/lib/hierarchy";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get("campusId");
    const type = searchParams.get("type"); // Optional: filter by location type

    let locations;

    if (campusId) {
      // Get locations for specific campus
      locations = await getLocationsByCampus(campusId);
    } else {
      // Get ONLY Hachalu Campus locations (or filter by type if provided)
      const hachaluCampus = await prisma.campus.findUnique({
        where: { id: 'campus-hachalu' },
        select: { id: true },
      });
      
      if (!hachaluCampus) {
        return NextResponse.json({ locations: [] });
      }
      
      const where: any = {
        campusId: hachaluCampus.id, // ONLY Hachalu Campus
      };
      if (type) {
        where.type = type;
      }
      const allLocations = await prisma.resourceLocation.findMany({
        where,
        include: {
          campus: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });
      locations = allLocations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        type: loc.type,
        campusId: loc.campusId,
        campus: loc.campus,
      }));
    }

    return NextResponse.json({ locations });
  } catch (error: any) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations", details: error.message },
      { status: 500 }
    );
  }
}

