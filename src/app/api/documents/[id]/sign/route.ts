import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, email, comment } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 }
      );
    }

    // Check if document exists and is open
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    if (document.isClosed) {
      return NextResponse.json(
        { error: "This document is closed for signatures." },
        { status: 400 }
      );
    }

    // Rate limiting: check if this email requested to sign in the last 60 seconds
    const cleanEmail = email.trim().toLowerCase();
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentSignature = await prisma.signature.findFirst({
      where: {
        documentId: id,
        email: cleanEmail,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentSignature) {
      return NextResponse.json(
        { error: "Too many signing requests. Please wait 60 seconds." },
        { status: 429 }
      );
    }

    // Extract comment if comments are enabled
    let finalComment: string | null = null;
    if (document.allowComments && typeof comment === "string" && comment.trim().length > 0) {
      finalComment = comment.trim().substring(0, 500);
    }

    // Check if this email has already signed (or has a pending signature)
    const existingSignature = await prisma.signature.findFirst({
      where: {
        documentId: id,
        email: cleanEmail,
      },
    });

    let signature;

    if (existingSignature) {
      if (existingSignature.isVerified) {
        return NextResponse.json(
          { error: "You have already signed this document." },
          { status: 400 }
        );
      }
      // Reuse the existing signature and regenerate token to resend the mail
      signature = await prisma.signature.update({
        where: { id: existingSignature.id },
        data: {
          name: name.trim(),
          comment: finalComment,
          createdAt: new Date(), // Reset timestamp for verification timeout purposes
        },
      });
    } else {
      // Create new pending signature
      signature = await prisma.signature.create({
        data: {
          documentId: id,
          name: name.trim(),
          email: cleanEmail,
          comment: finalComment,
        },
      });
    }

    // Build verification URL
    const origin = new URL(request.url).origin;
    const verificationLink = `${origin}/api/signatures/verify?token=${signature.verificationToken}`;

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      // Fallback local logging
      console.log("\n========================================================");
      console.log("  [Wollomat] EMAIL VERIFICATION FALLBACK");
      console.log(`  Signatory: ${signature.name} <${signature.email}>`);
      console.log(`  Document:  "${document.title}"`);
      console.log(`  Verify at: ${verificationLink}`);
      console.log("========================================================\n");

      return NextResponse.json({
        success: true,
        fallbackMode: true,
        message: "Verification link generated locally (logged to server console).",
      });
    }

    // Send email using Resend
    const resend = new Resend(resendApiKey);
    // Use onboarding@resend.dev if a custom domain is not configured yet
    const sender = process.env.EMAIL_FROM || "Wollomat <onboarding@resend.dev>";

    await resend.emails.send({
      from: sender,
      to: signature.email,
      subject: `Confirm your signature: ${document.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Confirm your signature</h2>
          <p style="color: #334155; line-height: 1.5;">Hi ${signature.name},</p>
          <p style="color: #334155; line-height: 1.5;">You requested to sign the document: <strong>${document.title}</strong>.</p>
          <p style="color: #334155; line-height: 1.5;">Please click the button below to verify your email and confirm your signature:</p>
          <div style="margin: 24px 0;">
            <a href="${verificationLink}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Confirm Signature</a>
          </div>
          <p style="color: #64748b; font-size: 0.875rem;">If the button above does not work, copy and paste this URL into your browser:</p>
          <p style="color: #0f172a; font-size: 0.875rem; word-break: break-all;">${verificationLink}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 0.75rem;">If you did not request this email, you can safely ignore it.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully.",
    });
  } catch (error) {
    console.error("Error initiating signature:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while requesting your signature." },
      { status: 500 }
    );
  }
}
