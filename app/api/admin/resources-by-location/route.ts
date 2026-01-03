import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get ONLY Hachalu Campus
    const hachaluCampus = await prisma.campus.findUnique({
      where: { id: 'campus-hachalu' },
      select: { id: true },
    });
    
    if (!hachaluCampus) {
      return NextResponse.json({ locations: [], groupedByType: {} });
    }
    
    // Get all resources with their locations (ONLY Hachalu Campus)
    const resources = await prisma.resourceItem.findMany({
      where: {
        location: {
          campusId: hachaluCampus.id, // ONLY Hachalu Campus
        },
      },
      include: {
        location: {
          include: {
            campus: true,
          },
        },
      },
      orderBy: {
        location: {
          name: "asc",
        },
      },
    });

    // Group by location, then by resource type
    const locationGroups: Record<string, {
      locationId: string;
      locationName: string;
      locationType: string;
      campusName: string;
      resources: {
        name: string;
        type: string;
        quantity: number;
        currentQuantity: number;
      }[];
      totalItems: number;
      resourceTypes: Record<string, number>; // Count by type (computers, desks, etc.)
    }> = {};

    resources.forEach((resource) => {
      const locName = resource.location.name;
      if (!locationGroups[locName]) {
        locationGroups[locName] = {
          locationId: resource.location.id,
          locationName: locName,
          locationType: resource.location.type,
          campusName: resource.location.campus.name,
          resources: [],
          totalItems: 0,
          resourceTypes: {},
        };
      }
      locationGroups[locName].resources.push({
        name: resource.name,
        type: resource.type,
        quantity: resource.quantity,
        currentQuantity: resource.currentQuantity,
      });
      locationGroups[locName].totalItems += resource.currentQuantity;
      
      // Count by resource type (e.g., "computers", "desks", "chairs")
      const typeKey = resource.type.replace(/_/g, " ").toLowerCase();
      if (!locationGroups[locName].resourceTypes[typeKey]) {
        locationGroups[locName].resourceTypes[typeKey] = 0;
      }
      locationGroups[locName].resourceTypes[typeKey] += resource.currentQuantity;
    });

    // Group locations into categories
    const groupedLocations: Record<string, typeof locationGroups> = {};
    
    Object.values(locationGroups).forEach((loc) => {
      let groupKey = loc.locationType;
      
      // Group Computer Labs together
      if (loc.locationName.match(/Computer Lab \d+/i)) {
        groupKey = 'COMPUTER_LABS';
      }
      // Group Lecture Halls together
      else if (loc.locationName.match(/Lecture Hall LH\d+/i)) {
        groupKey = 'LECTURE_HALLS';
      }
      // Group Classrooms together
      else if (loc.locationName.match(/Classroom CR\d+/i)) {
        groupKey = 'CLASSROOMS';
      }
      
      if (!groupedLocations[groupKey]) {
        groupedLocations[groupKey] = {};
      }
      groupedLocations[groupKey][loc.locationName] = loc;
    });

    // Return grouped locations
    return NextResponse.json({
      locations: Object.values(locationGroups),
      groupedLocations,
    });
  } catch (error: any) {
    console.error("Error fetching resources by location:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources", details: error.message },
      { status: 500 }
    );
  }
}

