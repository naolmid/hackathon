export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUrgencyGroup } from "@/lib/alert-categorizer";

export async function GET(request: NextRequest) {
  try {
    // Get ONLY Hachalu Campus
    const hachaluCampus = await prisma.campus.findUnique({
      where: { id: 'campus-hachalu' },
      select: { id: true },
    });
    
    if (!hachaluCampus) {
      return NextResponse.json({ alerts: [] });
    }
    
    const alerts = await prisma.resourceAlert.findMany({
      where: {
        status: {
          not: "RESOLVED",
        },
        location: {
          campusId: hachaluCampus.id, // ONLY Hachalu Campus
        },
      },
      orderBy: [
        { urgency: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        location: true,
        submittedByUser: {
          select: {
            username: true,
            role: true,
          },
        },
      },
      take: 100,
    });

    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      alertType: alert.alertType,
      message: alert.message,
      location: alert.location.name,
      urgency: alert.urgency,
      status: alert.status,
      createdAt: alert.createdAt.toISOString(),
      submittedBy: alert.submittedByUser?.username || "Unknown",
    }));

    return NextResponse.json({ alerts: formattedAlerts });
  } catch (error: any) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts", details: error.message },
      { status: 500 }
    );
  }
}


