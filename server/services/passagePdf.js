// A4 printed-passage PDF (brief §2/§6). In exam mode the passage is NEVER in the
// DOM — the candidate reads from this sheet, exactly as the hall hands it out.
import PDFDocument from 'pdfkit';

export function streamPassagePdf(res, passage) {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 64, bottom: 64, left: 64, right: 64 } });
  doc.pipe(res);

  doc.font('Times-Bold').fontSize(11).fillColor('#1A1712')
    .text('HIGH COURT CLERK CPT — PRACTICE MATERIAL', { characterSpacing: 0.5 });
  doc.moveDown(0.3);
  doc.font('Times-Roman').fontSize(10).fillColor('#6a6154')
    .text('Part II — English typing · 10 minutes · reproduce the passage below.');
  doc.moveDown(0.2);
  doc.font('Times-Italic').fontSize(9).fillColor('#6a6154')
    .text('Built from the official S.S.S.C. C.P.T. criteria. Not a real exam question.');

  doc.moveDown(1);
  doc.moveTo(64, doc.y).lineTo(531, doc.y).strokeColor('#E0D9C9').lineWidth(1).stroke();
  doc.moveDown(1);

  doc.font('Times-Bold').fontSize(13).fillColor('#1A1712').text(passage.title);
  doc.moveDown(0.6);
  doc.font('Times-Roman').fontSize(13).fillColor('#1A1712')
    .text(passage.body, { align: 'justify', lineGap: 4 });

  doc.moveDown(1.2);
  doc.font('Times-Italic').fontSize(9).fillColor('#6a6154')
    .text(`Word count: ${passage.word_count}. Score = (words typed − mistakes) ÷ 10, pass at 30.`);

  doc.end();
}
