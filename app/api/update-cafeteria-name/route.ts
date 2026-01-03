import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Update the cafeteria location name directly
    const updated = await prisma.resourceLocation.update({
      where: { id: 'loc-hachalu-cafeteria' },
      data: {
        name: 'HHC CAMPUS',
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Cafeteria name updated to HHC CAMPUS',
      location: updated 
    });
  } catch (error: any) {
    console.error("Error updating cafeteria name:", error);
    return NextResponse.json(
      { error: "Failed to update cafeteria name", details: error.message },
      { status: 500 }
    );
  }
}

