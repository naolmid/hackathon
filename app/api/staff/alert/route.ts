export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeUrgency } from "@/lib/alert-categorizer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertType, message, locationId, urgency, submittedBy, username } = body;

    // Find user by username if provided, otherwise use submittedBy
    let userId = submittedBy;
    if (username) {
      const user = await prisma.user.findUnique({
        where: { username: username },
        select: { id: true },
      });
      if (user) {
        userId = user.id;
      }
    }

    // If no valid user found, create a demo user or use default
    if (!userId) {
      // Try to find or create a default user
      const defaultUser = await prisma.user.findFirst({
        where: { role: { in: ["IT_STAFF", "LAB_MANAGER", "CAFETERIA", "LIBRARIAN"] } },
        select: { id: true },
      });
      userId = defaultUser?.id || "demo-user-id";
    }

    // Find or create a default location if locationId is not provided
    let finalLocationId = locationId;
    if (!finalLocationId || finalLocationId === "") {
      const defaultLocation = await prisma.resourceLocation.findFirst({
        where: { type: "CAFETERIA" }, // Try to find a cafeteria location first
        select: { id: true },
      });
      if (!defaultLocation) {
        // If no cafeteria, try any location
        const anyLocation = await prisma.resourceLocation.findFirst({
          select: { id: true },
        });
        if (!anyLocation) {
          return NextResponse.json(
            { error: "No location found. Please create a location first.", details: "No resource locations exist in the database." },
            { status: 400 }
          );
        }
        finalLocationId = anyLocation.id;
      } else {
        finalLocationId = defaultLocation.id;
      }
    }
    
    // Verify location exists
    const locationExists = await prisma.resourceLocation.findUnique({
      where: { id: finalLocationId },
      select: { id: true },
    });
    
    if (!locationExists) {
      return NextResponse.json(
        { error: "Invalid location ID", details: `Location with ID ${finalLocationId} does not exist.` },
        { status: 400 }
      );
    }

    // Auto-categorize urgency if not provided
    const finalUrgency = urgency || categorizeUrgency(alertType as any, message);

    // Create alert
    const alert = await prisma.resourceAlert.create({
      data: {
        locationId: finalLocationId,
        alertType: alertType as any,
        urgency: finalUrgency as any,
        message,
        submittedBy: userId,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, alert }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert", details: error.message },
      { status: 500 }
    );
  }
}


