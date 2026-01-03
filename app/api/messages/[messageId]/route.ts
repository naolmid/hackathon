import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const message = await prisma.message.update({
      where: { id: params.messageId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Failed to update message", details: error.message },
      { status: 500 }
    );
  }
}

