export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramNotification } from "@/lib/telegram";

// Telegram sends updates to this webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle /start command with token
    if (body.message?.text?.startsWith('/start ')) {
      const token = body.message.text.replace('/start ', '').trim();
      const chatId = body.message.chat.id.toString();
      const telegramUsername = body.message.from?.username || 'Unknown';

      // Find the TelegramLink with this token
      const telegramLink = await prisma.telegramLink.findFirst({
        where: {
          secureToken: token,
          bonded: false,
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      if (!telegramLink) {
        await sendTelegramNotification(
          chatId,
          '❌ Invalid or expired link. Please generate a new connection link from the ResourceMaster settings page.'
        );
        return NextResponse.json({ ok: true });
      }

      // Check if token is expired
      if (telegramLink.tokenExpires && new Date() > telegramLink.tokenExpires) {
        await sendTelegramNotification(
          chatId,
          '❌ This link has expired. Please generate a new connection link from the ResourceMaster settings page.'
        );
        return NextResponse.json({ ok: true });
      }

      // Bond the account
      await prisma.telegramLink.update({
        where: { id: telegramLink.id },
        data: {
          chatId,
          bonded: true,
          secureToken: null, // Clear the token after use
          tokenExpires: null,
        },
      });

      // Send confirmation
      await sendTelegramNotification(
        chatId,
        `✅ <b>Successfully Connected!</b>\n\nYour Telegram account (@${telegramUsername}) is now linked to ResourceMaster user <b>${telegramLink.user.username}</b>.\n\nYou will receive notifications based on your preferences. You can change these settings anytime from the ResourceMaster dashboard.`
      );

      return NextResponse.json({ ok: true });
    }

    // Handle plain /start (without token)
    if (body.message?.text === '/start') {
      const chatId = body.message.chat.id.toString();
      
      // Check if already connected
      const existingLink = await prisma.telegramLink.findFirst({
        where: {
          chatId,
          bonded: true,
        },
        include: {
          user: {
            select: { username: true },
          },
        },
      });

      if (existingLink) {
        await sendTelegramNotification(
          chatId,
          `✅ You are already connected as <b>${existingLink.user.username}</b>.\n\nTo disconnect, go to Settings in the ResourceMaster dashboard.`
        );
      } else {
        await sendTelegramNotification(
          chatId,
          `👋 <b>Welcome to ResourceMaster Bot!</b>\n\nTo connect your account, please go to the Settings page in the ResourceMaster dashboard and click "Connect Telegram". You'll receive a special link to complete the connection.`
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Handle /status command
    if (body.message?.text === '/status') {
      const chatId = body.message.chat.id.toString();
      
      const link = await prisma.telegramLink.findFirst({
        where: {
          chatId,
          bonded: true,
        },
        include: {
          user: {
            select: { username: true, role: true },
          },
        },
      });

      if (link) {
        await sendTelegramNotification(
          chatId,
          `📊 <b>Connection Status</b>\n\n✅ Connected\n👤 User: ${link.user.username}\n📋 Role: ${link.user.role.replace(/_/g, ' ')}\n🔔 Notifications: ${link.notificationPreference.replace(/_/g, ' ')}`
        );
      } else {
        await sendTelegramNotification(
          chatId,
          `📊 <b>Connection Status</b>\n\n❌ Not connected\n\nGo to ResourceMaster Settings to connect your account.`
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

// Telegram also sends GET requests to verify webhook
export async function GET() {
  return NextResponse.json({ status: "Telegram webhook active" });
}


