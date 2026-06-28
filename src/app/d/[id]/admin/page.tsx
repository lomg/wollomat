import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import AdminView from "@/components/AdminView";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export const metadata: Metadata = {
  title: "Admin Dashboard | Wollomat",
  robots: { index: false, follow: false }, // Direct search engines to skip indexing admin views
};

export default async function AdminPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token } = await searchParams;

  // Retrieve document
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    notFound();
  }

  // Validate the admin token to prevent unauthorized access
  if (document.adminToken !== token) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4 fade-in">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Unauthorized Access</h1>
        <p className="text-sm text-secondary-foreground">
          The administration token for this document is missing or invalid. Please check the link that was generated on creation.
        </p>
        <div className="pt-4">
          <a
            href={`/d/${document.id}`}
            className="inline-block bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:bg-opacity-95 transition-all"
          >
            Return to Signing Page
          </a>
        </div>
      </div>
    );
  }

  // Fetch all signatures (both verified and unverified) for the admin view
  const signatures = await prisma.signature.findMany({
    where: {
      documentId: id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Convert schema objects to simple JSON serializable formats
  const documentData = {
    id: document.id,
    title: document.title,
    content: document.content,
    isClosed: document.isClosed,
    allowComments: document.allowComments,
    adminToken: document.adminToken,
    createdAt: document.createdAt.toISOString(),
  };

  const signaturesData = signatures.map((sig: any) => ({
    id: sig.id,
    name: sig.name,
    email: sig.email,
    comment: sig.comment,
    isVerified: sig.isVerified,
    createdAt: sig.createdAt.toISOString(),
    verifiedAt: sig.verifiedAt ? sig.verifiedAt.toISOString() : null,
  }));

  return (
    <AdminView 
      document={documentData} 
      signatures={signaturesData} 
    />
  );
}
