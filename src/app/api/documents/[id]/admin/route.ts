import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { adminToken, action } = await request.json();

    if (!adminToken || typeof adminToken !== "string") {
      return NextResponse.json(
        { error: "Admin token is required." },
        { status: 401 }
      );
    }

    // Verify document exists and token matches
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    if (document.adminToken !== adminToken) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid admin token." },
        { status: 403 }
      );
    }

    if (action === "toggle-status") {
      const updated = await prisma.document.update({
        where: { id },
        data: { isClosed: !document.isClosed },
      });
      return NextResponse.json({
        success: true,
        isClosed: updated.isClosed,
      });
    }

    if (action === "delete") {
      await prisma.document.delete({
        where: { id },
      });
      return NextResponse.json({
        success: true,
        deleted: true,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported: toggle-status, delete." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error executing admin action:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while executing the admin action." },
      { status: 500 }
    );
  }
}
