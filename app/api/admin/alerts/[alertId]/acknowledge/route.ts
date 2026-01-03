export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const alertId = params.alertId;

    // Get user from request (in real app, from session/auth)
    const userData = request.headers.get("x-user-data");
    let acknowledgedBy = "admin";
    
    if (userData) {
      const user = JSON.parse(userData);
      acknowledgedBy = user.username || user.id;
    }

    const alert = await prisma.resourceAlert.update({
      where: { id: alertId },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedBy: acknowledgedBy,
        acknowledgedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, alert });
  } catch (error: any) {
    console.error("Error acknowledging alert:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge alert", details: error.message },
      { status: 500 }
    );
  }
}

