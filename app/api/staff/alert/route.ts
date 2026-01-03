export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeUrgency } from "@/lib/alert-categorizer";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertType, message, locationId, urgency, submittedBy, username } = body;

    // Find user by username if provided, otherwise use submittedBy
    let userId = submittedBy;
    let submitterUsername = username;
    if (username) {
      const user = await prisma.user.findUnique({
        where: { username: username },
        select: { id: true, username: true },
      });
      if (user) {
        userId = user.id;
        submitterUsername = user.username;
      }
    }

    // If no valid user found, create a demo user or use default
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: { in: ["IT_STAFF", "LAB_MANAGER", "CAFETERIA", "LIBRARIAN"] } },
        select: { id: true, username: true },
      });
      userId = defaultUser?.id || "demo-user-id";
      submitterUsername = defaultUser?.username || "staff";
    }

    // Find or create a default location if locationId is not provided
    let finalLocationId = locationId;
    let locationName = "Unknown Location";
    if (!finalLocationId || finalLocationId === "") {
      const defaultLocation = await prisma.resourceLocation.findFirst({
        where: { type: "CAFETERIA" },
        select: { id: true, name: true },
      });
      if (!defaultLocation) {
        const anyLocation = await prisma.resourceLocation.findFirst({
          select: { id: true, name: true },
        });
        if (!anyLocation) {
          return NextResponse.json(
            { error: "No location found. Please create a location first.", details: "No resource locations exist in the database." },
            { status: 400 }
          );
        }
        finalLocationId = anyLocation.id;
        locationName = anyLocation.name;
      } else {
        finalLocationId = defaultLocation.id;
        locationName = defaultLocation.name;
      }
    } else {
      const loc = await prisma.resourceLocation.findUnique({
        where: { id: finalLocationId },
        select: { id: true, name: true },
      });
      if (loc) {
        locationName = loc.name;
      }
    }
    
    // Verify location exists
    const locationExists = await prisma.resourceLocation.findUnique({
      where: { id: finalLocationId },
      select: { id: true },
    });
    
    if (!locationExists) {
      return NextResponse.json(
        { error: "Invalid location ID", details: `Location with ID ${finalLocationId} does not exist.` },
        { status: 400 }
      );
    }

    // Auto-categorize urgency if not provided
    const finalUrgency = urgency || categorizeUrgency(alertType as any, message);

    // Create alert
    const alert = await prisma.resourceAlert.create({
      data: {
        locationId: finalLocationId,
        alertType: alertType as any,
        urgency: finalUrgency as any,
        message,
        submittedBy: userId,
        status: "PENDING",
      },
    });

    // SEND TELEGRAM NOTIFICATIONS TO ADMINS
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["CAMPUS_ADMIN", "UNIVERSITY_ADMIN"] },
      },
      include: {
        telegramLink: true,
      },
    });

    for (const admin of admins) {
      if (admin.telegramLink?.bonded && admin.telegramLink.chatId) {
        const pref = admin.telegramLink.notificationPreference;
        
        // Check if should notify based on preference
        const isUrgent = finalUrgency === "URGENT";
        const isSerious = finalUrgency === "SERIOUS";
        
        let shouldSend = false;
        if (pref === "URGENT_ONLY" && isUrgent) shouldSend = true;
        if (pref === "URGENT_AND_SERIOUS" && (isUrgent || isSerious)) shouldSend = true;
        if (pref === "ALL") shouldSend = true;
        
        if (shouldSend) {
          const emoji = isUrgent ? "🚨" : isSerious ? "⚠️" : "📋";
          const telegramMessage = `${emoji} <b>${finalUrgency} ALERT</b>\n\n📍 Location: ${locationName}\n👤 From: ${submitterUsername}\n📝 Type: ${alertType}\n\n${message}`;
          
          await sendTelegramNotification(admin.telegramLink.chatId, telegramMessage);
        }
      }
    }

    return NextResponse.json({ success: true, alert }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert", details: error.message },
      { status: 500 }
    );
  }
}
