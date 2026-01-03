import { NextRequest, NextResponse } from "next/server";
import { calculateBurnRate } from "@/lib/burn-rate-calculator";

export async function GET(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const burnRate = await calculateBurnRate(params.resourceId);
    
    if (!burnRate) {
      return NextResponse.json(
        { error: "Insufficient usage data" },
        { status: 404 }
      );
    }

    return NextResponse.json({ burnRate });
  } catch (error) {
    console.error("Error calculating burn rate:", error);
    return NextResponse.json(
      { error: "Failed to calculate burn rate" },
      { status: 500 }
    );
  }
}

