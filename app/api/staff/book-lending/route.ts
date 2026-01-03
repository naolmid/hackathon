export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorizeUrgency } from "@/lib/alert-categorizer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, bookId, dueDate, notes, librarianId, username } = body;

    // Find user by username if provided
    let userId = librarianId;
    if (username) {
      const user = await prisma.user.findUnique({
        where: { username: username },
        select: { id: true },
      });
      if (user) {
        userId = user.id;
      }
    }
    
    // If no valid user found, use default
    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: "LIBRARIAN" },
        select: { id: true },
      });
      userId = defaultUser?.id || "demo-librarian-id";
    }

    // Find or create book resource
    let book = await prisma.resourceItem.findFirst({
      where: { name: { contains: bookId }, type: "BOOK" },
    });

    if (!book) {
      // Find a library location or use default
      const libraryLocation = await prisma.resourceLocation.findFirst({
        where: { type: "LIBRARY" },
      });
      
      // Create book if it doesn't exist
      book = await prisma.resourceItem.create({
        data: {
          name: `Book ${bookId}`,
          type: "BOOK",
          quantity: 1,
          currentQuantity: 0,
          locationId: libraryLocation?.id || "default-location",
        },
      });
    }

    // Create book lending record
    const lending = await prisma.bookLending.create({
      data: {
        bookId: book.id,
        borrowerName: studentId,
        borrowerId: studentId,
        dueDate: new Date(dueDate),
        librarianId: userId,
        status: "LENT",
      },
    });

    // Update book current quantity
    await prisma.resourceItem.update({
      where: { id: book.id },
      data: { currentQuantity: { decrement: 1 } },
    });

    // Create alert for book lending (LOW urgency)
    await prisma.resourceAlert.create({
      data: {
        resourceId: book.id,
        locationId: book.locationId,
        alertType: "BOOK_LENDING",
        urgency: categorizeUrgency("BOOK_LENDING"),
        message: `${studentId} borrowed book ${bookId}`,
        submittedBy: userId,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, lending }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating book lending:", error);
    return NextResponse.json(
      { error: "Failed to create book lending", details: error.message },
      { status: 500 }
    );
  }
}


