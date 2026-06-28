"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock, Trash2, Download, Check, Clipboard, Calendar, Mail, FileSpreadsheet, Loader2 } from "lucide-react";
import { generatePDF } from "@/lib/pdf";

interface DocumentData {
  id: string;
  title: string;
  content: string;
  isClosed: boolean;
  allowComments: boolean;
  adminToken: string;
  createdAt: string;
}

interface SignatureData {
  id: string;
  name: string;
  email: string;
  comment: string | null;
  isVerified: boolean;
  createdAt: string;
  verifiedAt: string | null;
}

interface AdminViewProps {
  document: DocumentData;
  signatures: SignatureData[];
}

export default function AdminView({ document: initialDoc, signatures: initialSignatures }: AdminViewProps) {
  const router = useRouter();
  
  const [document, setDocument] = useState<DocumentData>(initialDoc);
  const [signatures, setSignatures] = useState<SignatureData[]>(initialSignatures);
  
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const verifiedSignatures = signatures.filter((s) => s.isVerified);
  const pendingSignatures = signatures.filter((s) => !s.isVerified);

  const handleToggleStatus = async () => {
    setIsToggling(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents/${document.id}/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminToken: document.adminToken,
          action: "toggle-status",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to toggle document status.");
      }

      setDocument({
        ...document,
        isClosed: data.isClosed,
      });
    } catch (err: any) {
      setError(err.message || "Could not toggle status.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteDocument = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/documents/${document.id}/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminToken: document.adminToken,
          action: "delete",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete document.");
      }

      router.push("/?deleted=true");
    } catch (err: any) {
      setError(err.message || "Could not delete document.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDownloadPDF = (includeEmails: boolean) => {
    const pdfSignatures = verifiedSignatures.map((sig) => ({
      id: sig.id,
      name: sig.name,
      email: sig.email,
      comment: sig.comment,
      verifiedAt: sig.verifiedAt,
    }));

    generatePDF(document, pdfSignatures, includeEmails);
  };

  const copyEmail = (email: string, idx: number) => {
    navigator.clipboard.writeText(email);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const formattedDate = new Date(document.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-16 w-full space-y-8 fade-in">
      
      {/* Title block */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 px-2.5 py-1 rounded-md">
            Creator Dashboard
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-3 text-primary">
            Admin: {document.title}
          </h1>
          <p className="text-xs text-secondary-foreground font-mono mt-1">
            Created on: {formattedDate} | Document ID: {document.id}
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="toggle-signing-btn"
            onClick={handleToggleStatus}
            disabled={isToggling}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
              document.isClosed
                ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50 hover:bg-opacity-80"
                : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent hover:bg-opacity-90"
            }`}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : document.isClosed ? (
              <Unlock className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>{document.isClosed ? "Reopen Signing" : "Close Signing"}</span>
          </button>

          {!showDeleteConfirm ? (
            <button
              id="delete-doc-trigger"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-950/30 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Document</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/10 p-1.5 rounded-xl border border-red-200 dark:border-red-900/50 animate-in fade-in slide-in-from-right-3 duration-200">
              <span className="text-xs text-red-600 dark:text-red-400 font-semibold px-2">Are you sure?</span>
              <button
                id="delete-doc-confirm"
                onClick={handleDeleteDocument}
                disabled={isDeleting}
                className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Yes, delete</span>
              </button>
              <button
                id="delete-doc-cancel"
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-secondary text-secondary-foreground text-xs px-3 py-1.5 rounded-lg font-medium border border-border hover:bg-opacity-80 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {/* Stats Counter Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Verified Signatures</p>
          <p className="text-3xl font-bold tracking-tight mt-1 text-primary">{verifiedSignatures.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Pending Email Confirmations</p>
          <p className="text-3xl font-bold tracking-tight mt-1 text-orange-600 dark:text-orange-400">{pendingSignatures.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Signing Status</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-2.5 h-2.5 rounded-full ${document.isClosed ? "bg-red-500" : "bg-green-500"}`} />
            <span className="text-sm font-semibold">{document.isClosed ? "Closed" : "Active"}</span>
          </div>
        </div>
      </div>

      {/* Downloads & Ledger view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: PDFs & Document Text info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-base tracking-tight border-b border-border pb-3">Export Document</h2>
            <p className="text-xs text-secondary-foreground">
              Select which signature list view to export into the finalized PDF document.
            </p>
            
            <div className="space-y-3 pt-2">
              <button
                id="download-public-pdf-admin"
                onClick={() => handleDownloadPDF(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-900 text-left text-sm font-medium transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-card-foreground">Public PDF</p>
                    <p className="text-[10px] text-secondary-foreground font-normal">Names & timestamps only</p>
                  </div>
                </div>
              </button>

              <button
                id="download-audit-pdf-admin"
                onClick={() => handleDownloadPDF(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-slate-50 dark:hover:bg-slate-900 text-left text-sm font-medium transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-900/30"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-accent-warm" />
                  <div>
                    <p className="text-card-foreground">Audit Ledger PDF</p>
                    <p className="text-[10px] text-secondary-foreground font-normal">Includes signatory email addresses</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex justify-center">
              <a
                href={`/d/${document.id}`}
                className="text-xs text-accent-warm hover:underline font-semibold"
              >
                Go to Public Signing Page &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Right Columns: Signature Ledger List */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="border-b border-border pb-4 mb-4 flex items-center justify-between">
            <h2 className="font-bold text-base tracking-tight">Signatures Registry</h2>
            <span className="text-xs text-secondary-foreground font-mono">Verified + Pending Log</span>
          </div>

          {signatures.length === 0 ? (
            <div className="text-center py-16 text-secondary-foreground text-sm">
              No signature requests logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold text-secondary-foreground uppercase tracking-wider">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    {document.allowComments && <th className="py-3 px-4">Comment</th>}
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 pl-4 text-right">Verification Date (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {signatures.map((sig, idx) => {
                    const date = sig.verifiedAt
                      ? new Date(sig.verifiedAt).toISOString().replace("T", " ").substring(0, 16)
                      : "-";
                    return (
                      <tr key={sig.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3.5 pr-4 font-medium text-card-foreground">{sig.name}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-secondary-foreground">{sig.email}</span>
                            <button
                              onClick={() => copyEmail(sig.email, idx)}
                              className="p-1 rounded hover:bg-secondary text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                              title="Copy Email"
                            >
                              {copiedIndex === idx ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Clipboard className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        {document.allowComments && (
                          <td className="py-3.5 px-4 max-w-[200px] truncate text-secondary-foreground text-xs italic" title={sig.comment || ""}>
                            {sig.comment ? `"${sig.comment}"` : "-"}
                          </td>
                        )}
                        <td className="py-3.5 px-4">
                          {sig.isVerified ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-[10px] font-semibold font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-green-150 dark:border-green-900/30">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 text-[10px] font-semibold font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-orange-150 dark:border-orange-900/30">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pl-4 text-right font-mono text-xs text-secondary-foreground">{date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
