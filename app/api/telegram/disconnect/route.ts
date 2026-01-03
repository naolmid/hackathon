export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/telegram";

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

    if (!user.telegramLink || !user.telegramLink.bonded) {
      return NextResponse.json(
        { error: "Telegram not connected" },
        { status: 400 }
      );
    }

    const chatId = user.telegramLink.chatId;

    // Delete the TelegramLink
    await prisma.telegramLink.delete({
      where: { userId: user.id },
    });

    // Notify on Telegram if possible
    if (chatId) {
      await sendTelegramNotification(
        chatId,
        `🔌 <b>Disconnected</b>\n\nYour Telegram account has been disconnected from ResourceMaster user <b>${username}</b>.\n\nYou will no longer receive notifications here.`
      );
    }

    return NextResponse.json({
      success: true,
      message: "Telegram disconnected successfully",
    });
  } catch (error: any) {
    console.error("Error disconnecting Telegram:", error);
    return NextResponse.json(
      { error: "Failed to disconnect", details: error.message },
      { status: 500 }
    );
  }
}


