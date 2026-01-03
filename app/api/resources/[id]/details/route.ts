import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resourceId = params.id;

    const resource = await prisma.resourceItem.findUnique({
      where: { id: resourceId },
      include: {
        location: {
          include: {
            campus: true,
          },
        },
        bookLendings: {
          orderBy: {
            lentDate: "desc",
          },
          take: 10, // Last 10 lending records
        },
        _count: {
          select: {
            usageHistory: true,
            requisitions: true,
            bookLendings: true,
          },
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Check if book is currently lent
    const isLent = resource.type === "BOOK" && resource.currentQuantity === 0;
    const activeLending = resource.type === "BOOK" 
      ? resource.bookLendings.find(l => l.status === "LENT") || null
      : null;

    return NextResponse.json({
      ...resource,
      isLent,
      activeLending,
      lendingHistory: resource.bookLendings,
    });
  } catch (error: any) {
    console.error("Error fetching resource details:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource details", details: error.message },
      { status: 500 }
    );
  }
}

