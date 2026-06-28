import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { title, content, creatorEmail, allowComments } = await request.json();

    if (!title || typeof title !== "string" || title.trim().length === 0 || title.trim().length > 150) {
      return NextResponse.json(
        { error: "Title is required, must be a valid string, and cannot exceed 150 characters." },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0 || content.trim().length > 50000) {
      return NextResponse.json(
        { error: "Document text is required and cannot exceed 50,000 characters." },
        { status: 400 }
      );
    }

    if (!creatorEmail || typeof creatorEmail !== "string" || !creatorEmail.includes("@") || creatorEmail.trim().length > 254) {
      return NextResponse.json(
        { error: "A valid creator email is required and cannot exceed 254 characters." },
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        creatorEmail: creatorEmail.trim().toLowerCase(),
        allowComments: typeof allowComments === "boolean" ? allowComments : false,
      },
    });

    return NextResponse.json({
      id: document.id,
      adminToken: document.adminToken,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the document." },
      { status: 500 }
    );
  }
}
