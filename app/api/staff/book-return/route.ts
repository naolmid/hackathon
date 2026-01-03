export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId, borrowerId, username } = body;

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }

    // Find the librarian
    let librarianId = null;
    if (username) {
      const librarian = await prisma.user.findUnique({
        where: { username: username },
        select: { id: true },
      });
      if (librarian) {
        librarianId = librarian.id;
      }
    }

    // Find the book
    const book = await prisma.resourceItem.findFirst({
      where: {
        OR: [
          { id: bookId },
          { name: { contains: bookId } },
        ],
        type: "BOOK",
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    // Find the active lending record
    const activeLending = await prisma.bookLending.findFirst({
      where: {
        bookId: book.id,
        status: "LENT",
        ...(borrowerId && { borrowerId: borrowerId }),
      },
      orderBy: {
        lentDate: "desc",
      },
    });

    if (!activeLending) {
      return NextResponse.json(
        { error: "No active lending found for this book" },
        { status: 404 }
      );
    }

    // Update the lending record to mark as returned
    await prisma.bookLending.update({
      where: { id: activeLending.id },
      data: {
        status: "RETURNED",
        returnDate: new Date(),
      },
    });

    // Update the book's currentQuantity back to available
    await prisma.resourceItem.update({
      where: { id: book.id },
      data: {
        currentQuantity: book.quantity, // Set back to full quantity
      },
    });

    return NextResponse.json({
      success: true,
      message: `Book "${book.name}" has been returned successfully.`,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error returning book:", error);
    return NextResponse.json(
      { error: "Failed to return book", details: error.message },
      { status: 500 }
    );
  }
}


