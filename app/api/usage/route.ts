export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const usageData = await prisma.usageData.findMany({
      include: {
        resource: {
          include: {
            location: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json({ usageData });
  } catch (error) {
    console.error("Error fetching usage data:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceId, usageRate, estimatedDaysUntilDepletion } = body;

    if (!resourceId || usageRate === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create usage data entry
    const usageData = await prisma.usageData.create({
      data: {
        resourceId,
        usageRate,
        submittedBy: "system", // Will be replaced with actual user ID
      },
    });

    // Update resource with days until depletion if provided
    if (estimatedDaysUntilDepletion !== undefined) {
      await prisma.resourceItem.update({
        where: { id: resourceId },
        data: {
          daysUntilDepletion: estimatedDaysUntilDepletion,
        },
      });
    }

    return NextResponse.json({ usageData });
  } catch (error) {
    console.error("Error creating usage data:", error);
    return NextResponse.json(
      { error: "Failed to create usage data" },
      { status: 500 }
    );
  }
}


