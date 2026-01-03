export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSecureToken, getTelegramBotLink, getTelegramDeepLink } from "@/lib/telegram";

// Sync token to Turso for localhost testing
async function syncTokenToTurso(userId: string, username: string, token: string, tokenExpires: Date) {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  
  if (!tursoUrl || !tursoToken || process.env.NODE_ENV === 'production') {
    return; // Skip if no Turso config or already in production
  }

  try {
    // Use HTTP API to sync to Turso
    const response = await fetch(tursoUrl.replace('libsql://', 'https://'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tursoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statements: [
          {
            q: `INSERT OR REPLACE INTO TelegramLink (id, userId, secureToken, tokenExpires, bonded, chatId, notificationPreference, createdAt, updatedAt) 
                VALUES (?, ?, ?, ?, 0, NULL, 'URGENT_ONLY', datetime('now'), datetime('now'))`,
            params: [`tg-${userId}`, userId, token, tokenExpires.toISOString()]
          }
        ]
      }),
    });
    
    if (response.ok) {
      console.log('Token synced to Turso for Telegram webhook');
    }
  } catch (e) {
    console.log('Could not sync to Turso (non-critical):', e);
  }
}

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

    // ALWAYS generate a FRESH token
    const token = generateSecureToken();
    const tokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing TelegramLink first to avoid stale data
    try {
      await prisma.telegramLink.deleteMany({
        where: { userId: user.id },
      });
    } catch (e) {
      // Ignore if doesn't exist
    }

    // Create fresh TelegramLink
    await prisma.telegramLink.create({
      data: {
        userId: user.id,
        secureToken: token,
        tokenExpires,
        bonded: false,
      },
    });

    // Sync to Turso so the deployed webhook can find it
    await syncTokenToTurso(user.id, username, token, tokenExpires);

    // Generate the bot links
    const botLink = getTelegramBotLink(token);
    const deepLink = getTelegramDeepLink(token);

    return NextResponse.json({
      success: true,
      link: botLink,
      deepLink: deepLink,
      expiresAt: tokenExpires.toISOString(),
      token: token, // Also return token for manual entry
    });
  } catch (error: any) {
    console.error("Error generating Telegram link:", error);
    return NextResponse.json(
      { error: "Failed to generate link", details: error.message },
      { status: 500 }
    );
  }
}


