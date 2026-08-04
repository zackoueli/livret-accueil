import jsPDF from "jspdf";

export type PdfPageFormat = "a4" | "a5" | "a6";

const PAGE_SIZES_MM: Record<PdfPageFormat, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  a5: { width: 148, height: 210 },
  a6: { width: 105, height: 148 },
};

const MARGIN_MM = 15;

export async function downloadQrPdf({
  qrDataUrl,
  logoUrl,
  format,
  title,
  fileName,
  accentColor,
}: {
  qrDataUrl: string;
  logoUrl: string;
  format: PdfPageFormat;
  title: string;
  fileName: string;
  accentColor: string;
}) {
  const { width: pageWidth, height: pageHeight } = PAGE_SIZES_MM[format];
  const doc = new jsPDF({ unit: "mm", format: [pageWidth, pageHeight] });

  const contentWidth = pageWidth - MARGIN_MM * 2;

  doc.setFontSize(format === "a6" ? 11 : 14);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  const titleY = MARGIN_MM + 4;
  doc.text(title, pageWidth / 2, titleY, { align: "center", maxWidth: contentWidth });

  const qrSize = Math.min(contentWidth, pageHeight - MARGIN_MM * 2 - 20);
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = titleY + 10;
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  const logoSize = qrSize * 0.22;
  const logoImg = await loadImage(logoUrl);
  const logoX = qrX + (qrSize - logoSize) / 2;
  const logoY = qrY + (qrSize - logoSize) / 2;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(logoX - 1.5, logoY - 1.5, logoSize + 3, logoSize + 3, 1.5, 1.5, "F");
  doc.addImage(logoImg, "PNG", logoX, logoY, logoSize, logoSize);

  doc.setDrawColor(accentColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN_MM, MARGIN_MM, contentWidth, pageHeight - MARGIN_MM * 2, 3, 3);

  doc.save(`${fileName}.pdf`);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
