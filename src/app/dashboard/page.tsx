import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import DashboardHeader from "@/components/DashboardHeader";
import { Calendar, PenLine, ExternalLink, Settings, ShieldAlert, FileText, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents Dashboard | Wollomat",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("wollomat_session")?.value;

  if (!sessionToken) {
    redirect("/dashboard/login");
  }

  // Validate active session
  const session = await prisma.creatorSession.findUnique({
    where: { token: sessionToken },
  });

  if (!session || new Date() > session.expiresAt) {
    redirect("/dashboard/login?error=Session expired. Please log in again.");
  }

  const email = session.email;

  // Retrieve creator's documents
  const documents = await prisma.document.findMany({
    where: { creatorEmail: email },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          signatures: {
            where: { isVerified: true },
          },
        },
      },
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 md:py-16 w-full space-y-8 fade-in">
      <DashboardHeader email={email} />

      {documents.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-primary">No documents found</h2>
          <p className="text-sm text-secondary-foreground leading-relaxed">
            You haven't published any documents with this email address yet, or they have been deleted.
          </p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-opacity-95 transition-all"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Create new Wollomat</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground">
            My Published Documents ({documents.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((doc) => {
              const formattedDate = new Date(doc.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              
              const verifiedCount = doc._count.signatures;

              return (
                <div
                  key={doc.id}
                  className="bg-card border border-border hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 hover-glow transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-bold text-base tracking-tight text-primary leading-snug line-clamp-2">
                        {doc.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${
                          doc.isClosed
                            ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30"
                            : "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-150 dark:border-green-900/30"
                        }`}
                      >
                        {doc.isClosed ? "Closed" : "Active"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-secondary-foreground font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>{verifiedCount} verified signature{verifiedCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                    <a
                      href={`/d/${doc.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground border border-border text-xs font-semibold px-3 py-2 rounded-xl hover:bg-opacity-80 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Page</span>
                    </a>
                    <a
                      href={`/d/${doc.id}/admin?token=${doc.adminToken}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-opacity-90 transition-all cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Admin View</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
