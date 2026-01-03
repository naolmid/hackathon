export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Sync Telegram link token to Turso for localhost testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;

    if (!tursoUrl || !tursoToken) {
      return NextResponse.json({ error: "Turso not configured" }, { status: 400 });
    }

    // Get the user and their telegram link from local DB
    const user = await prisma.user.findUnique({
      where: { username },
      include: { telegramLink: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.telegramLink || !user.telegramLink.secureToken) {
      return NextResponse.json({ error: "No pending token to sync" }, { status: 400 });
    }

    // Use Turso HTTP API to sync the token
    const httpUrl = tursoUrl.replace('libsql://', 'https://');
    
    // First, ensure the user exists in Turso
    const userSyncResponse = await fetch(httpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tursoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statements: [
          {
            sql: `INSERT OR REPLACE INTO User (id, username, password, role, campusId, createdAt, updatedAt) 
                  VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            args: [user.id, user.username, user.password, user.role, user.campusId]
          }
        ]
      }),
    });

    if (!userSyncResponse.ok) {
      const errText = await userSyncResponse.text();
      console.error('User sync failed:', errText);
    }

    // Now sync the TelegramLink
    const tokenExpires = user.telegramLink.tokenExpires?.toISOString() || new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    const telegramSyncResponse = await fetch(httpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tursoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statements: [
          {
            sql: `INSERT OR REPLACE INTO TelegramLink (id, userId, secureToken, tokenExpires, bonded, chatId, notificationPreference, createdAt, updatedAt) 
                  VALUES (?, ?, ?, ?, 0, NULL, 'URGENT_ONLY', datetime('now'), datetime('now'))`,
            args: [user.telegramLink.id, user.id, user.telegramLink.secureToken, tokenExpires]
          }
        ]
      }),
    });

    if (!telegramSyncResponse.ok) {
      const errText = await telegramSyncResponse.text();
      console.error('Telegram sync failed:', errText);
      return NextResponse.json({ error: "Failed to sync to Turso", details: errText }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Token synced to production database. You can now click the Telegram link!",
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Sync failed", details: error.message }, { status: 500 });
  }
}

