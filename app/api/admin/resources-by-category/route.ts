import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");

    if (category) {
      // Get specific category details
      const resources = await prisma.resourceItem.findMany({
        where: {
          type: {
            in: getResourceTypesForCategory(category),
          },
        },
        include: {
          location: {
            include: {
              campus: true,
            },
          },
        },
      });

      const locations = resources.reduce((acc: any, resource) => {
        const locName = resource.location.name;
        if (!acc[locName]) {
          acc[locName] = {
            name: locName,
            count: 0,
            campus: resource.location.campus.name,
          };
        }
        acc[locName].count += resource.currentQuantity;
        return acc;
      }, {});

      const recentAlerts = await prisma.resourceAlert.findMany({
        where: {
          resource: {
            type: {
              in: getResourceTypesForCategory(category),
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          location: true,
        },
      });

      return NextResponse.json({
        category,
        total: resources.reduce((sum, r) => sum + r.currentQuantity, 0),
        locations: Object.values(locations),
        recentAlerts: recentAlerts.map(a => ({
          id: a.id,
          message: a.message,
          location: a.location.name,
          urgency: a.urgency,
          createdAt: a.createdAt,
        })),
      });
    }

    // Get all categories
    const categories = await getCategoryTotals();

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("Error fetching resources by category:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources", details: error.message },
      { status: 500 }
    );
  }
}

function getResourceTypesForCategory(category: string): string[] {
  const categoryMap: Record<string, string[]> = {
    library: ["BOOK", "LIBRARY_EQUIPMENT", "LIBRARY_FURNITURE"],
    labs: ["LAB_EQUIPMENT", "CHEMICAL", "LAB_SUPPLY", "COMPUTER"],
    cafeteria: ["MAINTENANCE_SUPPLY", "TOOL"],
    classrooms: ["COMPUTER", "LIBRARY_FURNITURE"],
  };
  return categoryMap[category.toLowerCase()] || [];
}

async function getCategoryTotals() {
  // Get ONLY Hachalu Campus
  const hachaluCampus = await prisma.campus.findUnique({
    where: { id: 'campus-hachalu' },
    select: { id: true },
  });
  
  if (!hachaluCampus) {
    return [];
  }
  
  const categories = [
    { name: "Library", types: ["BOOK", "LIBRARY_EQUIPMENT", "LIBRARY_FURNITURE"] },
    { name: "Labs", types: ["LAB_EQUIPMENT", "CHEMICAL", "LAB_SUPPLY", "COMPUTER"] },
    { name: "Cafeteria", types: ["MAINTENANCE_SUPPLY", "TOOL"] },
    { name: "Classrooms", types: ["COMPUTER", "LIBRARY_FURNITURE"] },
  ];

  const results = await Promise.all(
    categories.map(async (cat) => {
      const resources = await prisma.resourceItem.findMany({
        where: { 
          type: { in: cat.types as any },
          location: {
            campusId: hachaluCampus.id, // ONLY Hachalu Campus
          },
        },
        include: { location: true },
      });

      const locations = resources.reduce((acc: any, resource) => {
        const locName = resource.location.name;
        if (!acc[locName]) {
          acc[locName] = { name: locName, count: 0 };
        }
        acc[locName].count += resource.currentQuantity;
        return acc;
      }, {});

      return {
        name: cat.name,
        total: resources.reduce((sum, r) => sum + r.currentQuantity, 0),
        locations: Object.values(locations),
      };
    })
  );

  return results;
}

