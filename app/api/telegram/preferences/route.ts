export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { telegramLink: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      connected: user.telegramLink?.bonded || false,
      preference: user.telegramLink?.notificationPreference || 'URGENT_ONLY',
    });
  } catch (error: any) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, preference } = body;

    if (!username || !preference) {
      return NextResponse.json(
        { error: "Username and preference required" },
        { status: 400 }
      );
    }

    // Validate preference
    const validPreferences = ['URGENT_ONLY', 'URGENT_AND_SERIOUS', 'OFF'];
    if (!validPreferences.includes(preference)) {
      return NextResponse.json(
        { error: "Invalid preference. Must be URGENT_ONLY, URGENT_AND_SERIOUS, or OFF" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { telegramLink: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.telegramLink) {
      return NextResponse.json(
        { error: "Telegram not connected" },
        { status: 400 }
      );
    }

    // Update preference
    await prisma.telegramLink.update({
      where: { userId: user.id },
      data: { notificationPreference: preference },
    });

    return NextResponse.json({
      success: true,
      preference,
    });
  } catch (error: any) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences", details: error.message },
      { status: 500 }
    );
  }
}


