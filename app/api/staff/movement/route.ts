export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeUrgency } from "@/lib/alert-categorizer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceId, resourceName, fromLocationId, toLocationId, reason, movedBy, username } = body;

    // Find user by username if provided
    let userId = movedBy;
    if (username) {
      const user = await prisma.user.findUnique({
        where: { username: username },
        select: { id: true },
      });
      if (user) {
        userId = user.id;
      }
    }
    
    // If no valid user found, use default
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: { in: ["IT_STAFF", "LAB_MANAGER"] } },
        select: { id: true },
      });
      userId = defaultUser?.id || "demo-user-id";
    }

    // Validate that from and to locations are the same type
    const fromLocation = await prisma.resourceLocation.findUnique({
      where: { id: fromLocationId },
      select: { type: true, name: true },
    });
    const toLocation = await prisma.resourceLocation.findUnique({
      where: { id: toLocationId },
      select: { type: true, name: true },
    });

    if (!fromLocation || !toLocation) {
      return NextResponse.json(
        { error: "Invalid location IDs" },
        { status: 400 }
      );
    }

    if (fromLocation.type !== toLocation.type) {
      return NextResponse.json(
        { error: `Cannot move resources between different location types. ${fromLocation.name} (${fromLocation.type}) and ${toLocation.name} (${toLocation.type}) must be the same type.` },
        { status: 400 }
      );
    }

    // Create movement record
    const movementData: any = {
      fromLocationId,
      toLocationId,
      movedBy: userId,
      reason,
      resourceName: resourceName || undefined,
    };

    // Only connect resource if resourceId is provided
    if (resourceId) {
      movementData.resourceId = resourceId;
    }

    // Move the resource - try by ID first, then by name
    let resourceToMove = null;
    let actualResourceId = resourceId;
    
    if (resourceId) {
      // Try to find by ID
      resourceToMove = await prisma.resourceItem.findUnique({
        where: { id: resourceId },
        include: { location: true },
      });
    }
    
    // If not found by ID, try to find by name in the from location
    if (!resourceToMove && resourceName && fromLocationId) {
      resourceToMove = await prisma.resourceItem.findFirst({
        where: {
          name: resourceName,
          locationId: fromLocationId,
        },
        include: { location: true },
      });
      
      if (resourceToMove) {
        actualResourceId = resourceToMove.id;
      }
    }
    
    // If resource found, validate and move it
    if (resourceToMove) {
      if (resourceToMove.locationId !== fromLocationId) {
        return NextResponse.json(
          { error: `Resource "${resourceName || resourceId}" is not in ${fromLocation.name}. It is currently in ${resourceToMove.location.name}.` },
          { status: 400 }
        );
      }
      
      // Update resource location
      await prisma.resourceItem.update({
        where: { id: resourceToMove.id },
        data: { locationId: toLocationId },
      });
      
      // Update movement record with the actual resource ID
      movementData.resourceId = actualResourceId;
    } else {
      // Resource not found - provide helpful error
      if (!resourceId && !resourceName) {
        return NextResponse.json(
          { error: "Either Resource ID or Resource Name must be provided" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `Resource "${resourceName || resourceId}" not found in ${fromLocation.name}` },
        { status: 404 }
      );
    }

    const movement = await prisma.resourceMovement.create({
      data: movementData,
    });

    // Create alert for the movement showing the change
    const fromLocName = fromLocation.name;
    const toLocName = toLocation.name;
    await prisma.resourceAlert.create({
      data: {
        locationId: toLocationId,
        alertType: "RESOURCE_MOVEMENT",
        urgency: categorizeUrgency("RESOURCE_MOVEMENT"),
        message: `${resourceName || 'Resource'} moved from ${fromLocName} to ${toLocName}`,
        submittedBy: userId,
        status: "PENDING",
      },
    });

    return NextResponse.json({ 
      success: true, 
      movement,
      message: `Resource moved from ${fromLocName} to ${toLocName}. Admin will see -1 in ${fromLocName} and +1 in ${toLocName}.`
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating movement:", error);
    return NextResponse.json(
      { error: "Failed to create movement", details: error.message },
      { status: 500 }
    );
  }
}


