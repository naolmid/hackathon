export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");
    const role = searchParams.get("role");

    if (username) {
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          role: true,
        },
      });
      return NextResponse.json({ user });
    }

    if (role) {
      const users = await prisma.user.findMany({
        where: { role: role as any },
        select: {
          id: true,
          username: true,
          role: true,
        },
      });
      return NextResponse.json({ users });
    }

    // Get all users (for admin)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    );
  }
}


