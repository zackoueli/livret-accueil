import jsPDF from "jspdf";

export type PdfPageFormat = "a4" | "a5" | "a6";

const PAGE_SIZES_MM: Record<PdfPageFormat, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  a5: { width: 148, height: 210 },
  a6: { width: 105, height: 148 },
};

export async function downloadQrPdf({
  qrDataUrl,
  format,
  title,
  subtitle,
  fileName,
}: {
  qrDataUrl: string;
  format: PdfPageFormat;
  title: string;
  subtitle?: string;
  fileName: string;
}) {
  const { width: pageWidth, height: pageHeight } = PAGE_SIZES_MM[format];
  const doc = new jsPDF({ unit: "mm", format: [pageWidth, pageHeight] });

  const margin = pageWidth * 0.14;
  const contentWidth = pageWidth - margin * 2;

  // Titre, centré, sobre
  const titleSize = format === "a6" ? 13 : format === "a5" ? 16 : 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(titleSize);
  doc.setTextColor(20, 20, 20);
  const titleY = pageHeight * 0.16;
  doc.text(title, pageWidth / 2, titleY, { align: "center", maxWidth: contentWidth });

  // QR centré verticalement dans la page
  const qrSize = contentWidth;
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = (pageHeight - qrSize) / 2 - (pageHeight * 0.03);
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // Sous-titre / instruction, sous le QR
  const subSize = format === "a6" ? 8 : format === "a5" ? 9.5 : 11;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(subSize);
  doc.setTextColor(120, 120, 120);
  const subtitleY = qrY + qrSize + pageHeight * 0.055;
  doc.text(subtitle ?? "Scannez pour accéder au livret d'accueil", pageWidth / 2, subtitleY, {
    align: "center",
    maxWidth: contentWidth,
  });

  doc.save(`${fileName}.pdf`);
}
