import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSecureToken, getTelegramBotLink, getTelegramDeepLink } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      );
    }

    // Find user
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

    // Generate secure token
    const token = generateSecureToken();
    const tokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create or update TelegramLink
    if (user.telegramLink) {
      await prisma.telegramLink.update({
        where: { userId: user.id },
        data: {
          secureToken: token,
          tokenExpires,
          bonded: false,
          chatId: null,
        },
      });
    } else {
      await prisma.telegramLink.create({
        data: {
          userId: user.id,
          secureToken: token,
          tokenExpires,
          bonded: false,
        },
      });
    }

    // Generate the bot links
    const botLink = getTelegramBotLink(token);
    const deepLink = getTelegramDeepLink(token);

    return NextResponse.json({
      success: true,
      link: botLink,
      deepLink: deepLink,
      expiresAt: tokenExpires.toISOString(),
    });
  } catch (error: any) {
    console.error("Error generating Telegram link:", error);
    return NextResponse.json(
      { error: "Failed to generate link", details: error.message },
      { status: 500 }
    );
  }
}

