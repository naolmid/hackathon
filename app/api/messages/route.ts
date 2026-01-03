import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramNotification, shouldNotify, formatTelegramMessage } from "@/lib/telegram";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // Get all messages for the user (both sent and received)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      },
      include: {
        fromUser: {
          select: {
            username: true,
            role: true,
          },
        },
        toUser: {
          select: {
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format messages to ensure all required fields are present
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      fromUser: msg.fromUser || { username: 'Unknown', role: 'UNKNOWN' },
      toUser: msg.toUser || { username: 'Unknown', role: 'UNKNOWN' },
      subject: msg.subject || null,
      content: msg.content,
      read: msg.read ?? false,
      readAt: msg.readAt,
      createdAt: msg.createdAt.toISOString(),
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromUsername, toUsername, subject, content } = body;

    if (!fromUsername || !toUsername || !content) {
      return NextResponse.json(
        { error: "fromUsername, toUsername, and content are required" },
        { status: 400 }
      );
    }

    // Find users by username
    const fromUser = await prisma.user.findUnique({
      where: { username: fromUsername },
      select: { id: true },
    });

    const toUser = await prisma.user.findUnique({
      where: { username: toUsername },
      select: { id: true },
    });

    if (!fromUser || !toUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        fromUserId: fromUser.id,
        toUserId: toUser.id,
        subject: subject || null,
        content,
      },
      include: {
        fromUser: {
          select: {
            username: true,
            role: true,
          },
        },
        toUser: {
          select: {
            username: true,
            role: true,
          },
        },
      },
    });

    // Check if recipient has Telegram connected and should receive notification
    const recipientTelegram = await prisma.telegramLink.findUnique({
      where: { userId: toUser.id },
    });

    if (recipientTelegram?.bonded && recipientTelegram.chatId) {
      const preference = recipientTelegram.notificationPreference as 'URGENT_ONLY' | 'URGENT_AND_SERIOUS' | 'OFF';
      
      if (shouldNotify(content, preference)) {
        // Determine urgency for formatting
        const isUrgent = content.includes('🚨 URGENT') || content.includes('URGENT ALERT');
        const urgency = isUrgent ? 'urgent' : 'serious';
        
        // Format and send Telegram notification
        const telegramMessage = formatTelegramMessage(
          `New Message from ${fromUsername}`,
          content.substring(0, 500), // Limit message length
          urgency
        );
        
        await sendTelegramNotification(recipientTelegram.chatId, telegramMessage);
      }
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message", details: error.message },
      { status: 500 }
    );
  }
}

