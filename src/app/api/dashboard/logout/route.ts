import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const sessionToken = request.headers.get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("wollomat_session="))
      ?.split("=")[1];

    if (sessionToken) {
      // Delete session from database
      await prisma.creatorSession.delete({
        where: { token: decodeURIComponent(sessionToken) },
      }).catch(() => {}); // Ignore error if session already deleted
    }

    const response = NextResponse.json({ success: true });
    
    // Clear the cookie by setting maxAge to 0
    response.cookies.set("wollomat_session", "", {
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Dashboard logout error:", error);
    return NextResponse.json({ error: "Failed to log out." }, { status: 500 });
  }
}
