import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import DocumentView from "@/components/DocumentView";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return {
        title: "Document Not Found | Wollomat",
      };
    }

    return {
      title: `${document.title} | Wollomat`,
      description: `Put your name under the document: "${document.title}". Wollomat provides collective signature tools for closed groups with email verification.`,
    };
  } catch (err) {
    return {
      title: "Wollomat Signature Document",
    };
  }
}

export default async function DocumentPage({ params }: Props) {
  const { id } = await params;

  // Query database in server component
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    notFound();
  }

  // Fetch only verified signatures, ordered chronologically
  const signatures = await prisma.signature.findMany({
    where: {
      documentId: id,
      isVerified: true,
    },
    orderBy: {
      verifiedAt: "asc",
    },
  });

  // Convert schema objects to simple JSON serializable formats
  const documentData = {
    id: document.id,
    title: document.title,
    content: document.content,
    isClosed: document.isClosed,
    allowComments: document.allowComments,
    createdAt: document.createdAt.toISOString(),
  };

  const signaturesData = signatures.map((sig: any) => ({
    id: sig.id,
    name: sig.name,
    comment: sig.comment,
    createdAt: sig.createdAt.toISOString(),
    verifiedAt: sig.verifiedAt ? sig.verifiedAt.toISOString() : null,
  }));

  return (
    <DocumentView 
      document={documentData} 
      initialSignatures={signaturesData} 
    />
  );
}
