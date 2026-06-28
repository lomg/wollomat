import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface DocumentData {
  id: string;
  title: string;
  content: string;
  createdAt: string | Date;
}

interface SignatureData {
  id: string;
  name: string;
  email?: string;
  comment?: string | null;
  verifiedAt: string | Date | null;
}

export function generatePDF(
  document: DocumentData,
  signatures: SignatureData[],
  includeEmails: boolean = false
) {
  // Create a new A4 PDF (portrait, millimeters)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // slate-900 (#0f172a)
  const secondaryColor: [number, number, number] = [71, 85, 105]; // slate-600 (#475569)
  const dividerColor: [number, number, number] = [226, 232, 240]; // slate-200 (#e2e8f0)

  // 1. Header (Document Title)
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  
  // Title text wrapping just in case it is very long
  const titleLines = doc.splitTextToSize(document.title, contentWidth);
  let currentY = margin;
  
  titleLines.forEach((line: string) => {
    doc.text(line, margin, currentY);
    currentY += 8;
  });
  currentY += 2;

  // Meta info (Creation Date & Source)
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const formattedCreated = new Date(document.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Published on: ${formattedCreated} | Generated via Wollomat`, margin, currentY);
  currentY += 4;

  // Divider line
  doc.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // 2. Document Content Text
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85); // slate-700 (#334155)

  // Split content by paragraphs first to preserve spacing
  const paragraphs = document.content.split("\n");
  
  paragraphs.forEach((paragraph) => {
    const cleanParagraph = paragraph.trim();
    if (cleanParagraph.length === 0) {
      currentY += 5; // Paragraph space
      return;
    }

    const wrappedLines = doc.splitTextToSize(cleanParagraph, contentWidth);
    
    wrappedLines.forEach((line: string) => {
      // Check if we need to add a new page
      if (currentY > pageHeight - margin - 15) {
        doc.addPage();
        currentY = margin;
      }
      
      doc.text(line, margin, currentY);
      currentY += 6; // Line height
    });
    
    currentY += 3; // Space between paragraphs
  });

  currentY += 10;

  // 3. Divider before signatures
  if (currentY > pageHeight - margin - 40) {
    doc.addPage();
    currentY = margin;
  } else {
    doc.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
  }

  // Signatures Section Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(
    includeEmails ? "Signature Ledger (Auditable)" : "Signatures Log",
    margin,
    currentY
  );
  currentY += 6;

  // 4. Signatures Table
  const hasComments = signatures.some((sig) => sig.comment && sig.comment.trim().length > 0);

  let tableHeaders: string[];
  let tableRows: string[][];

  if (includeEmails) {
    if (hasComments) {
      tableHeaders = ["#", "Name", "Email Address", "Comment", "Verification Date (UTC)"];
      tableRows = signatures.map((sig, idx) => {
        const verifyDate = sig.verifiedAt
          ? new Date(sig.verifiedAt).toISOString().replace("T", " ").substring(0, 19)
          : "Pending";
        return [(idx + 1).toString(), sig.name, sig.email || "N/A", sig.comment || "-", verifyDate];
      });
    } else {
      tableHeaders = ["#", "Name", "Email Address", "Verification Date (UTC)"];
      tableRows = signatures.map((sig, idx) => {
        const verifyDate = sig.verifiedAt
          ? new Date(sig.verifiedAt).toISOString().replace("T", " ").substring(0, 19)
          : "Pending";
        return [(idx + 1).toString(), sig.name, sig.email || "N/A", verifyDate];
      });
    }
  } else {
    if (hasComments) {
      tableHeaders = ["#", "Name", "Comment", "Verification Date (UTC)"];
      tableRows = signatures.map((sig, idx) => {
        const verifyDate = sig.verifiedAt
          ? new Date(sig.verifiedAt).toISOString().replace("T", " ").substring(0, 19)
          : "Pending";
        return [(idx + 1).toString(), sig.name, sig.comment || "-", verifyDate];
      });
    } else {
      tableHeaders = ["#", "Name", "Verification Date (UTC)"];
      tableRows = signatures.map((sig, idx) => {
        const verifyDate = sig.verifiedAt
          ? new Date(sig.verifiedAt).toISOString().replace("T", " ").substring(0, 19)
          : "Pending";
        return [(idx + 1).toString(), sig.name, verifyDate];
      });
    }
  }

  // Call jspdf-autotable
  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableRows,
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50 (#f8fafc)
    },
    didDrawPage: (data: any) => {
      // Footer page numbering on every page
      const totalPages = doc.getNumberOfPages();
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400 (#94a3b8)
      
      const pageStr = `Page ${data.pageNumber} of ${totalPages}`;
      doc.text(
        pageStr,
        pageWidth - margin - doc.getTextWidth(pageStr),
        pageHeight - 10
      );
      doc.text(
        `Document ID: ${document.id}`,
        margin,
        pageHeight - 10
      );
    },
  });

  // Save the PDF
  const filename = `${document.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-signed.pdf`;
  doc.save(filename);
}
