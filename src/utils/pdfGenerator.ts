import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Utilitário para gerar e baixar PDF visualmente bonito a partir de um elemento HTML
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  filename: string
): Promise<Blob> {
  // Configuração otimizada para renderização nítida (2x scale)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1024,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Primeira página
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pdfHeight;

  // Páginas adicionais se o conteúdo for maior que 1 página A4
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
  }

  const cleanName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(cleanName);

  return pdf.output('blob');
}
