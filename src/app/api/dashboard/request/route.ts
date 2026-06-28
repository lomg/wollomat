import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Rate limiting: check if a magic link was requested in the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentToken = await prisma.dashboardToken.findFirst({
      where: {
        email: cleanEmail,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentToken) {
      return NextResponse.json(
        { error: "Too many login requests. Please wait 60 seconds." },
        { status: 429 }
      );
    }

    // Check if the user has actually created any documents
    const documentCount = await prisma.document.count({
      where: { creatorEmail: cleanEmail },
    });

    if (documentCount === 0) {
      return NextResponse.json(
        { error: "No documents found associated with this email address." },
        { status: 404 }
      );
    }

    // Generate dashboard token (valid for 15 minutes)
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.dashboardToken.create({
      data: {
        email: cleanEmail,
        token,
        expiresAt,
      },
    });

    const origin = new URL(request.url).origin;
    const magicLink = `${origin}/api/dashboard/verify?token=${token}`;

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.log("\n========================================================");
      console.log("  [Wollomat] CREATOR DASHBOARD LOGIN LINK");
      console.log(`  Email:    ${cleanEmail}`);
      console.log(`  Link:     ${magicLink}`);
      console.log("========================================================\n");

      return NextResponse.json({
        success: true,
        fallbackMode: true,
        message: "Magic login link generated locally (logged to server console).",
      });
    }

    const resend = new Resend(resendApiKey);
    const sender = process.env.EMAIL_FROM || "Wollomat <onboarding@resend.dev>";

    await resend.emails.send({
      from: sender,
      to: cleanEmail,
      subject: "Access your Wollomat Documents Dashboard",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Access your dashboard</h2>
          <p style="color: #334155; line-height: 1.5;">Hi,</p>
          <p style="color: #334155; line-height: 1.5;">You requested a magic link to access your Wollomat dashboard and manage your documents.</p>
          <p style="color: #334155; line-height: 1.5;">This link is valid for 15 minutes. Click the button below to log in:</p>
          <div style="margin: 24px 0;">
            <a href="${magicLink}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Go to Dashboard</a>
          </div>
          <p style="color: #64748b; font-size: 0.875rem;">If the button above does not work, copy and paste this URL into your browser:</p>
          <p style="color: #0f172a; font-size: 0.875rem; word-break: break-all;">${magicLink}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 0.75rem;">If you did not request this email, you can safely ignore it.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Magic login link sent to your email address.",
    });
  } catch (error) {
    console.error("Dashboard login request error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while requesting login." },
      { status: 500 }
    );
  }
}
