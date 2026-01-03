export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBurnRate } from "@/lib/burn-rate-calculator";

export async function GET(request: NextRequest) {
  try {
    const resources = await prisma.resourceItem.findMany({
      include: {
        location: {
          include: {
            campus: true,
          },
        },
        usageHistory: {
          take: 30,
        },
      },
    });

    const predictions = await Promise.all(
      resources.map(async (resource) => {
        let daysUntilDepletion = resource.daysUntilDepletion;
        let urgency = "LOW";

        if (resource.usageHistory.length > 0) {
          const burnRate = await calculateBurnRate(resource.id);
          if (burnRate) {
            daysUntilDepletion = burnRate.daysUntilDepletion;
            urgency = burnRate.urgency;
          }
        } else if (daysUntilDepletion !== null) {
          // Use existing prediction and determine urgency
          if (daysUntilDepletion <= 7) urgency = "CRITICAL";
          else if (daysUntilDepletion <= 14) urgency = "HIGH";
          else if (daysUntilDepletion <= 30) urgency = "MEDIUM";
        }

        return {
          resourceId: resource.id,
          resourceName: resource.name,
          currentQuantity: resource.currentQuantity,
          daysUntilDepletion,
          urgency,
          location: `${resource.location.campus.name} - ${resource.location.name}`,
        };
      })
    );

    // Sort by urgency (CRITICAL first, then HIGH, MEDIUM, LOW)
    const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    predictions.sort((a, b) => {
      const aOrder = urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 4;
      const bOrder = urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 4;
      return aOrder - bOrder;
    });

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
}


