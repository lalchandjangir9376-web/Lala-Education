import { jsPDF } from 'jspdf';
import { StudyMaterial } from '../types';

export function generateAndDownloadPdf(material: StudyMaterial, language: 'hi' | 'en' = 'hi') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // App Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LALA EDUCATION APP', margin, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Rajasthan Board (RBSE) & CBSE Study Material | Classes 9, 10, 11 & 12', margin, 19);

  doc.setFillColor(239, 68, 68); // Red badge
  doc.roundedRect(pageWidth - margin - 32, 8, 32, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDY NOTES', pageWidth - margin - 28, 16);

  let y = 38;

  // Title box
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'FD');

  const titleText = (language === 'hi' && material.titleHi) ? material.titleHi : material.title;
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const splitTitle = doc.splitTextToSize(titleText, contentWidth - 10);
  doc.text(splitTitle[0] || titleText, margin + 5, y + 8);

  // Metadata tags
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // Slate 600
  const metaText = `Class: ${material.classGrade}  |  Subject: ${material.subject}  |  Chapter: ${material.chapter || 'Chapter Notes'}  |  Language: ${material.language.toUpperCase()}`;
  doc.text(metaText, margin + 5, y + 18);

  y += 32;

  // Overview / Summary
  const summary = (language === 'hi' && material.contentSummaryHi)
    ? material.contentSummaryHi
    : (material.contentSummary || material.descriptionHi || material.description);

  if (summary) {
    doc.setFillColor(238, 242, 255); // Indigo 50
    doc.setDrawColor(199, 210, 254); // Indigo 200
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

    doc.setTextColor(67, 56, 202); // Indigo 700
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CHAPTER OVERVIEW / SUMMARY:', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const splitSummary = doc.splitTextToSize(summary, contentWidth - 8);
    doc.text(splitSummary.slice(0, 2), margin + 4, y + 12);
    y += 24;
  }

  // Body content
  const rawContent = material.bodyContent || material.description || 'Comprehensive notes for this chapter.';
  const lines = rawContent.split('\n');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Check page break
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;

      // Header on subsequent pages
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Lala Education App — Class ${material.classGrade} ${material.subject} — ${material.chapter || ''}`, margin, 12);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 14, pageWidth - margin, 14);
    }

    if (rawLine.startsWith('## ')) {
      // H2 Section Heading
      y += 4;
      doc.setFillColor(224, 231, 255); // Indigo 100
      doc.roundedRect(margin, y - 4, contentWidth, 8, 1.5, 1.5, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138); // Blue 900
      doc.text(rawLine.replace(/^##\s+/, ''), margin + 3, y + 1.5);
      y += 8;
    } else if (rawLine.startsWith('### ')) {
      // H3 Subheading
      y += 2;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(rawLine.replace(/^###\s+/, ''), margin, y);
      y += 6;
    } else if (rawLine.startsWith('• ') || rawLine.startsWith('- ') || rawLine.startsWith('* ')) {
      // Bullet point
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const bulletText = rawLine.replace(/^[•\-*]\s+/, '');
      const wrapped = doc.splitTextToSize(`• ${bulletText}`, contentWidth - 4);
      doc.text(wrapped, margin + 2, y);
      y += wrapped.length * 4.8;
    } else if (rawLine.trim() === '') {
      y += 3;
    } else {
      // Regular paragraph
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const wrapped = doc.splitTextToSize(rawLine, contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 4.8;
    }
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Lala Education App | Page ${p} of ${totalPages} | Free educational resource for Rajasthan students`,
      margin,
      pageHeight - 8
    );
  }

  // Download
  const filename = `${material.subject}_Class${material.classGrade}_${(material.chapter || 'Notes').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
