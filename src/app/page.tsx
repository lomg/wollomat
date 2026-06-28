"use client";

import React, { useState } from "react";
import { ArrowRight, Clipboard, Check, Loader2, Sparkles } from "lucide-react";

export default function CreateDocumentPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creatorEmail, setCreatorEmail] = useState("");
  const [allowComments, setAllowComments] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [createdDoc, setCreatedDoc] = useState<{
    id: string;
    adminToken: string;
  } | null>(null);

  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!title.trim() || !content.trim() || !creatorEmail.trim()) {
      setError("Please fill out all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          creatorEmail,
          allowComments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create document.");
      }

      setCreatedDoc(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "share" | "admin") => {
    navigator.clipboard.writeText(text);
    if (type === "share") {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } else {
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2000);
    }
  };

  if (createdDoc) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareLink = `${origin}/d/${createdDoc.id}`;
    const adminLink = `${origin}/d/${createdDoc.id}/admin?token=${createdDoc.adminToken}`;

    return (
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 fade-in w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 text-accent-warm mb-4">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Wollomat Ready
          </h1>
          <p className="text-secondary-foreground max-w-md mx-auto">
            Your document has been created. Distribute the signing link and manage it via the admin panel.
          </p>
        </div>

        <div className="space-y-6">
          {/* Share Link Card */}
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover-glow">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground mb-2">
              1. Share with Signatories
            </h2>
            <p className="text-xs text-secondary-foreground mb-4">
              Send this link to anyone you want to put their name under the text.
            </p>
            <div className="flex items-center gap-2">
              <input
                id="share-link-input"
                type="text"
                readOnly
                value={shareLink}
                className="w-full bg-input border border-border px-3 py-2.5 rounded-lg text-sm font-mono overflow-ellipsis focus:outline-none"
              />
              <button
                id="copy-share-btn"
                onClick={() => copyToClipboard(shareLink, "share")}
                className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-opacity-90 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                title="Copy Link"
              >
                {copiedShare ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <a
                href={`/d/${createdDoc.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-accent-warm font-medium hover:underline"
              >
                View Document Page <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Admin Link Card */}
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover-glow">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-foreground mb-2">
              2. Creator Administration
            </h2>
            <p className="text-xs text-secondary-foreground mb-4">
              Use this link to download the detailed signature ledger (with emails), close signing, or delete the document. Keep this link private.
            </p>
            <div className="flex items-center gap-2">
              <input
                id="admin-link-input"
                type="text"
                readOnly
                value={adminLink}
                className="w-full bg-input border border-border px-3 py-2.5 rounded-lg text-sm font-mono overflow-ellipsis focus:outline-none text-orange-600 dark:text-orange-400"
              />
              <button
                id="copy-admin-btn"
                onClick={() => copyToClipboard(adminLink, "admin")}
                className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-opacity-90 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                title="Copy Link"
              >
                {copiedAdmin ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <a
                href={`/d/${createdDoc.id}/admin?token=${createdDoc.adminToken}`}
                className="inline-flex items-center gap-1.5 text-xs text-accent-warm font-medium hover:underline"
              >
                Open Admin Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 fade-in w-full flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-12 items-stretch">
        {/* Introduction text */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-serif mb-4 leading-tight">
            Collect group signatures, <span className="text-accent-warm italic">simply.</span>
          </h1>
          <p className="text-secondary-foreground mb-8 text-base md:text-lg leading-relaxed">
            Wollomat is built for closed groups who want to collectively sign a text. No accounts, no hassle. Write your text, share the link, and verify every signature via a quick double-opt-in email verification.
          </p>
          
          <div className="hidden md:flex flex-col gap-4 text-sm text-secondary-foreground border-l-2 border-border pl-6 py-2">
            <div className="flex gap-2 items-start">
              <span className="text-accent-warm font-bold">1.</span>
              <span>Write your collective text.</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-accent-warm font-bold">2.</span>
              <span>Send the signature link to your group.</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-accent-warm font-bold">3.</span>
              <span>Download the signed document with verified signature logs.</span>
            </div>
          </div>
        </div>

        {/* Creation Form */}
        <div className="flex-grow bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between md:w-1/2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-lg font-semibold tracking-tight mb-2">Create Signature Document</h2>
            
            {error && (
              <div className="p-3 text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="title" className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
                Document Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Complaint regarding neighborhood construction noise"
                className="w-full bg-input border border-border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent-warm transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="content" className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
                Document Text
              </label>
              <textarea
                id="content"
                required
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the full text that people should sign under here..."
                className="w-full bg-input border border-border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent-warm font-serif resize-y transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="creatorEmail" className="text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
                Creator Email
              </label>
              <input
                id="creatorEmail"
                type="email"
                required
                value={creatorEmail}
                onChange={(e) => setCreatorEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-input border border-border px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent-warm transition-all"
              />
              <p className="text-[10px] text-secondary-foreground italic mt-1">
                Used only to send you the admin management link. Never displayed publicly.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1.5">
              <input
                id="allowComments"
                type="checkbox"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent-warm focus:ring-accent-warm cursor-pointer"
              />
              <label htmlFor="allowComments" className="text-xs font-medium text-card-foreground select-none cursor-pointer">
                Allow signatories to leave an optional comment
              </label>
            </div>

            <button
              id="create-document-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-primary text-primary-foreground py-2.5 px-4 rounded-lg font-medium hover:bg-opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Wollomat...</span>
                </>
              ) : (
                <>
                  <span>Publish Document</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      <div className="text-center pt-4 border-t border-border/50">
        <a
          id="creator-dashboard-link"
          href="/dashboard/login"
          className="text-xs text-secondary-foreground hover:text-accent-warm transition-colors font-mono underline underline-offset-4"
        >
          Manage my documents (Creator Dashboard)
        </a>
      </div>
    </div>
  );
}
