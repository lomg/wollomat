"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PenTool, Download, Check, Loader2, Calendar, FileText, CheckCircle, Clipboard } from "lucide-react";
import { generatePDF } from "@/lib/pdf";

interface DocumentData {
  id: string;
  title: string;
  content: string;
  isClosed: boolean;
  allowComments: boolean;
  createdAt: string;
}

interface SignatureData {
  id: string;
  name: string;
  comment: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

interface DocumentViewProps {
  document: DocumentData;
  initialSignatures: SignatureData[];
}

export default function DocumentView({ document, initialSignatures }: DocumentViewProps) {
  const searchParams = useSearchParams();
  
  // Client-side signatures list
  const [signatures, setSignatures] = useState<SignatureData[]>(initialSignatures);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  
  // Signing Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Toasts
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Link copying state
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareLink = `${origin}/d/${document.id}`;
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Parse URL search params for verification notices
  useEffect(() => {
    const verified = searchParams.get("verified");
    const nameParam = searchParams.get("name");
    const alreadyVerified = searchParams.get("already-verified");

    if (verified === "true" && nameParam) {
      setToast({
        message: `Thank you, ${decodeURIComponent(nameParam)}! Your signature is verified.`,
        type: "success",
      });
      // Clear URL params to avoid repeating toast on reload
      window.history.replaceState({}, "", window.location.pathname);
    } else if (alreadyVerified === "true") {
      setToast({
        message: "Your signature was already verified.",
        type: "info",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const handleSignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    if (!name.trim() || !email.trim()) {
      setError("Please fill in both name and email.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/documents/${document.id}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, comment }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit signature.");
      }

      if (data.fallbackMode) {
        setSuccessMessage(
          `Local test mode: Verify link has been logged to the terminal console. You can click it there to verify.`
        );
      } else {
        setSuccessMessage(
          "We sent a confirmation link to your email. Please click it to verify your signature."
        );
      }
      
      setName("");
      setEmail("");
      setComment("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    const pdfSignatures = signatures.map((sig) => ({
      id: sig.id,
      name: sig.name,
      comment: sig.comment,
      verifiedAt: sig.verifiedAt,
    }));

    generatePDF(document, pdfSignatures, false);
  };

  const formattedDate = new Date(document.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-16 w-full flex flex-col lg:flex-row gap-12 relative fade-in">
      
      {/* Toast Alert */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-lg flex items-center gap-3 glassmorphism max-w-sm transition-all duration-500 animate-bounce ${
            toast.type === "success" 
              ? "border-green-200 dark:border-green-950/50 text-green-800 dark:text-green-300 bg-green-50/90 dark:bg-green-950/20" 
              : "border-blue-200 dark:border-blue-950/50 text-blue-800 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/20"
          }`}
        >
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{toast.message}</p>
          <button 
            onClick={() => setToast(null)} 
            className="text-xs ml-auto opacity-70 hover:opacity-100 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Document Area */}
      <div className="flex-grow lg:w-2/3 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif mb-2 text-primary">
              {document.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-secondary-foreground font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>Published: {formattedDate}</span>
              <span>•</span>
              <span>ID: {document.id.substring(0, 8)}...</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {document.isClosed ? (
              <span className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs px-3 py-1.5 rounded-full font-semibold font-mono uppercase tracking-wider">
                Signing Closed
              </span>
            ) : (
              <span className="bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50 text-xs px-3 py-1.5 rounded-full font-semibold font-mono uppercase tracking-wider">
                Open for Signatures
              </span>
            )}
          </div>
        </div>

        {/* Document Content */}
        <div className="prose dark:prose-invert font-serif text-base md:text-lg leading-relaxed whitespace-pre-wrap max-w-none text-foreground py-2 mb-8">
          {document.content}
        </div>

        {/* Buttons for signing and downloading */}
        <div className="flex flex-wrap items-center gap-4">
          {!document.isClosed && (
            <button
              id="open-sign-modal-btn"
              onClick={() => setIsSignModalOpen(true)}
              className="inline-flex items-center gap-2 bg-accent-warm text-white px-5 py-2.5 rounded-xl font-medium hover:bg-opacity-90 transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <PenTool className="w-4 h-4" />
              <span>Sign this Document</span>
            </button>
          )}

          <button
            id="download-public-pdf-btn"
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-xl font-medium border border-border hover:bg-opacity-80 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Signed PDF</span>
          </button>

          <button
            id="copy-document-link-btn"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-xl font-medium border border-border hover:bg-opacity-80 transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Clipboard className="w-4 h-4" />}
            <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
          </button>
        </div>
      </div>

      {/* Signature Log Sidebar */}
      <div className="lg:w-1/3 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <h2 className="font-bold tracking-tight text-lg">Verified Signatures</h2>
            <div className="bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full font-mono">
              {signatures.length}
            </div>
          </div>

          {signatures.length === 0 ? (
            <div className="text-center py-10 text-secondary-foreground text-sm space-y-2">
              <FileText className="w-8 h-8 mx-auto opacity-30" />
              <p>No signatures verified yet.</p>
              {!document.isClosed && <p className="text-xs">Be the first to sign!</p>}
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto pr-1 space-y-2.5 scrollbar">
              {signatures.map((sig, idx) => {
                const date = sig.verifiedAt 
                  ? new Date(sig.verifiedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Pending";
                return (
                  <div 
                    key={sig.id} 
                    className="p-3 rounded-xl bg-input border border-border text-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-xs font-mono font-bold text-secondary-foreground">
                          {idx + 1}.
                        </span>
                        <span className="font-medium overflow-ellipsis overflow-hidden whitespace-nowrap text-card-foreground">
                          {sig.name}
                         </span>
                      </div>
                      <span className="text-[10px] text-secondary-foreground font-mono shrink-0">
                        {date}
                      </span>
                    </div>
                    {document.allowComments && sig.comment && (
                      <p className="text-xs text-secondary-foreground italic border-l-2 border-border pl-2.5 py-0.5 mt-0.5 break-words">
                        "{sig.comment}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Signing Modal Overlay */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div 
            id="sign-modal-container"
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold tracking-tight">Put your name under the text</h3>
              <p className="text-xs text-secondary-foreground">
                Enter your details to request email verification.
              </p>
            </div>

            {successMessage ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-card-foreground font-medium">{successMessage}</p>
                  {!successMessage.includes("Local test mode") && (
                    <p className="text-xs text-secondary-foreground italic border-l-2 border-accent-warm pl-3 py-0.5 text-left">
                      Note: If you don't receive the email within a few minutes, please check your spam folder.
                    </p>
                  )}
                </div>
                <button
                  id="close-success-modal-btn"
                  onClick={() => setIsSignModalOpen(false)}
                  className="w-full mt-4 bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-opacity-95 transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900">
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="modal-name" className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                    Full Name
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-input border border-border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent-warm transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-email" className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                    Email Address
                  </label>
                  <input
                    id="modal-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.doe@example.com"
                    className="w-full bg-input border border-border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent-warm transition-all"
                  />
                </div>

                {document.allowComments && (
                  <div className="space-y-1">
                    <label htmlFor="modal-comment" className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                      Comment (optional)
                    </label>
                    <textarea
                      id="modal-comment"
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Leave a short message..."
                      maxLength={200}
                      className="w-full bg-input border border-border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent-warm resize-none transition-all"
                    />
                  </div>
                )}

                <p className="text-[10px] text-secondary-foreground italic leading-normal border-l border-border pl-3 mt-2">
                  Disclosure: Your email address is only used to verify your identity and will be visible to the document creator to audit the signatures. It will never be rendered publicly.
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    id="cancel-sign-btn"
                    type="button"
                    onClick={() => setIsSignModalOpen(false)}
                    className="flex-1 bg-secondary text-secondary-foreground border border-border py-2 rounded-lg font-medium hover:bg-opacity-80 transition-all cursor-pointer text-center text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-sign-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <PenTool className="w-4 h-4" />
                        <span>Sign Document</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
