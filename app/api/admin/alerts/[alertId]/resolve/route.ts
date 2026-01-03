export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const alertId = params.alertId;

    const alert = await prisma.resourceAlert.update({
      where: { id: alertId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, alert });
  } catch (error: any) {
    console.error("Error resolving alert:", error);
    return NextResponse.json(
      { error: "Failed to resolve alert", details: error.message },
      { status: 500 }
    );
  }
}

