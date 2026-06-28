import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/dashboard/login?error=Missing login token.", request.url)
      );
    }

    // Find and validate token
    const dbToken = await prisma.dashboardToken.findUnique({
      where: { token },
    });

    if (!dbToken) {
      return NextResponse.redirect(
        new URL("/dashboard/login?error=Invalid login link.", request.url)
      );
    }

    if (new Date() > dbToken.expiresAt) {
      // Clean up expired token
      await prisma.dashboardToken.delete({ where: { id: dbToken.id } }).catch(() => {});
      return NextResponse.redirect(
        new URL("/dashboard/login?error=Login link has expired.", request.url)
      );
    }

    const email = dbToken.email;

    // Delete token so it can't be reused
    await prisma.dashboardToken.delete({ where: { id: dbToken.id } });

    // Create session (valid for 7 days)
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.creatorSession.create({
      data: {
        email,
        token: sessionToken,
        expiresAt,
      },
    });

    // Create response and set cookie
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set("wollomat_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Dashboard verify error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/login?error=Failed to verify login.", request.url)
    );
  }
}
