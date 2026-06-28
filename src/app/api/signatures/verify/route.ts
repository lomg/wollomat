import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/?error=missing-token", request.url));
    }

    // Find the pending signature
    const signature = await prisma.signature.findFirst({
      where: { verificationToken: token },
    });

    if (!signature) {
      // Redirect to homepage with invalid token notice
      return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
    }

    if (signature.isVerified) {
      // Already verified, just redirect to the document page
      return NextResponse.redirect(
        new URL(`/d/${signature.documentId}?already-verified=true`, request.url)
      );
    }

    // Update signature status to verified
    await prisma.signature.update({
      where: { id: signature.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    // Redirect to document view page with success state
    return NextResponse.redirect(
      new URL(
        `/d/${signature.documentId}?verified=true&name=${encodeURIComponent(signature.name)}`,
        request.url
      )
    );
  } catch (error) {
    console.error("Error verifying signature:", error);
    return NextResponse.redirect(new URL("/?error=verification-error", request.url));
  }
}
