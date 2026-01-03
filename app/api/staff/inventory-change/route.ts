import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeUrgency } from "@/lib/alert-categorizer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemName, locationId, quantityChange, reason, submittedBy } = body;

    // Find user by username if provided
    let userId = submittedBy;
    if (body.username) {
      const user = await prisma.user.findUnique({
        where: { username: body.username },
        select: { id: true },
      });
      if (user) {
        userId = user.id;
      }
    }
    
    // If no valid user found, use default
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: { in: ["IT_STAFF", "LAB_MANAGER", "CAFETERIA"] } },
        select: { id: true },
      });
      userId = defaultUser?.id || "demo-user-id";
    }

    // Find or create resource item
    let resource = await prisma.resourceItem.findFirst({
      where: { name: itemName, locationId },
    });

    if (!resource) {
      // Create resource if it doesn't exist
      resource = await prisma.resourceItem.create({
        data: {
          name: itemName,
          type: "LAB_EQUIPMENT", // Default type, should be determined by context
          quantity: Math.abs(quantityChange),
          currentQuantity: Math.max(0, quantityChange),
          locationId,
        },
      });
    } else {
      // Update existing resource
      resource = await prisma.resourceItem.update({
        where: { id: resource.id },
        data: {
          currentQuantity: {
            increment: quantityChange,
          },
        },
      });
    }

    // Create alert for inventory change (MEDIUM urgency)
    await prisma.resourceAlert.create({
      data: {
        resourceId: resource.id,
        locationId,
        alertType: "INVENTORY_CHANGE",
        urgency: categorizeUrgency("INVENTORY_CHANGE"),
        message: `${itemName}: ${quantityChange > 0 ? '+' : ''}${quantityChange} ${reason ? `(${reason})` : ''}`,
        submittedBy: userId,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, resource }, { status: 201 });
  } catch (error: any) {
    console.error("Error updating inventory:", error);
    return NextResponse.json(
      { error: "Failed to update inventory", details: error.message },
      { status: 500 }
    );
  }
}

