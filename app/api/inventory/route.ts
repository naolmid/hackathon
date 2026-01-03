import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const resources = await prisma.resourceItem.findMany({
      include: {
        location: {
          include: {
            campus: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, quantity, currentQuantity, locationId } = body;

    if (!name || !type || !locationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const resource = await prisma.resourceItem.create({
      data: {
        name,
        type,
        quantity: quantity || 0,
        currentQuantity: currentQuantity || quantity || 0,
        locationId,
      },
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}

