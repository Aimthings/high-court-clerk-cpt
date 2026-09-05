// Parses a Commission "Response-Sheet-cum-Answer-Key" PDF (P&H High Court /
// S.S.S.C. Clerk and same-format sheets) entirely in Node — no OCR.
//
// For every question the sheet carries, as selectable text: Q number, options,
// Question ID, Status (Answered/Not Answered) and Chosen Option. The CORRECT
// option is a small green tick image overlaid on it (wrong options carry red
// crosses). We locate every option-mark by tracking the PDF transform matrix,
// classify the tick by its square aspect ratio, and read the correct option from
// the tick's position among the four marks. Validated against a real 2022 sheet.
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

const mmul = (m, n) => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];

async function pageMarks(page) {
  const ops = await page.getOperatorList();
  let m = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const out = [];
  for (let i = 0; i < ops.fnArray.length; i += 1) {
    const fn = ops.fnArray[i];
    const a = ops.argsArray[i];
    if (fn === OPS.save) stack.push(m.slice());
    else if (fn === OPS.restore) m = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (fn === OPS.transform) m = mmul(m, a);
    else if (fn === OPS.paintImageXObject || fn === OPS.paintImageMaskXObject || fn === OPS.paintInlineImageXObject) {
      const w = Math.hypot(m[0], m[1]);
      const h = Math.hypot(m[2], m[3]);
      out.push({ w, h, cy: m[3] * 0.5 + m[5] });
    }
  }
  // Keep only the small option marks; a tick is ~square, a cross is wider.
  return out.filter((k) => k.h > 5 && k.h < 18 && k.w > 5 && k.w < 26)
    .map((k) => ({ cy: k.cy, tick: (k.w / k.h) < 1.25 }));
}

async function pageLines(page) {
  const tc = await page.getTextContent();
  const byY = {};
  for (const it of tc.items) {
    const y = Math.round(it.transform[5]);
    (byY[y] = byY[y] || []).push({ x: it.transform[4], s: it.str });
  }
  return Object.entries(byY).map(([y, arr]) => {
    arr.sort((p, q) => p.x - q.x);
    return { y: +y, x: arr[0].x, t: arr.map((z) => z.s).join('') };
  });
}

// Returns { questions:[{q,chosen,correct,status,section}], meta, sections:{} }.
export async function parseResponseSheet(buffer) {
  const doc = await getDocument({
    data: new Uint8Array(buffer), useSystemFonts: true, isEvalSupported: false,
  }).promise;

  const questions = [];
  let curSection = null;
  const meta = {};
  let fullText = '';

  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p); // eslint-disable-line no-await-in-loop
    const lines = await pageLines(page); // eslint-disable-line no-await-in-loop
    fullText += `\n${lines.map((l) => l.t).join('\n')}`;

    const ql = lines.filter((l) => /Q\.\d+/.test(l.t))
      .map((l) => ({ y: l.y, q: +l.t.match(/Q\.(\d+)/)[1] }))
      .sort((a, b) => b.y - a.y);
    if (!ql.length) continue;

    const marks = await pageMarks(page); // eslint-disable-line no-await-in-loop
    const chosen = lines.filter((l) => /Chosen Option/.test(l.t))
      .map((l) => ({ y: l.y, v: (l.t.match(/Chosen Option\s*:\s*(--|\d)/) || [])[1] }));
    const status = lines.filter((l) => /Status\s*:/.test(l.t))
      .map((l) => ({ y: l.y, v: (l.t.match(/Status\s*:\s*(Answered|Not Answered)/) || [])[1] }));
    const secs = lines.filter((l) => /Section\s*:/.test(l.t))
      .map((l) => ({ y: l.y, v: (l.t.match(/Section\s*:\s*(.+)/) || [])[1]?.trim() }));

    for (let i = 0; i < ql.length; i += 1) {
      const y0 = ql[i].y;
      const y1 = i + 1 < ql.length ? ql[i + 1].y : -1e9;
      const inReg = (yy) => yy <= y0 + 3 && yy > y1;
      const rm = marks.filter((mk) => inReg(mk.cy)).sort((a, b) => b.cy - a.cy); // opt1..4 top→bottom
      const ti = rm.findIndex((mk) => mk.tick);
      const correct = ti >= 0 ? ti + 1 : null;
      const ch = chosen.find((c) => inReg(c.y));
      const stt = status.find((s) => inReg(s.y));
      let sec = null;
      for (const s of secs) if (s.y >= y0 - 2) sec = s.v;
      if (sec) curSection = sec;
      questions.push({
        q: ql[i].q,
        chosen: ch ? ch.v : null,
        correct,
        status: stt ? stt.v : null,
        section: curSection || 'General',
      });
    }
  }

  // de-dup by question number (a question may span a page break)
  const seen = new Map();
  for (const it of questions) if (!seen.has(it.q)) seen.set(it.q, it);
  const qs = [...seen.values()].sort((a, b) => a.q - b.q);

  // best-effort candidate meta for the confirmation screen
  const mDate = fullText.match(/Exam Date\s*[\r\n]+\s*([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})/i)
    || fullText.match(/\b([0-3]?\d[\/-][01]?\d[\/-]\d{4})\b/);
  if (mDate) meta.examDate = mDate[1];
  const mShift = fullText.match(/Shift\s*[\r\n]+\s*([0-9: APM.\-]+)/i);
  if (mShift) meta.shift = mShift[1].trim();
  const mExam = fullText.match(/(RECRUITMENT[^\n]+|Exam Name\s*[\r\n]+\s*([^\n]+))/i);
  if (mExam) meta.examName = (mExam[2] || mExam[1] || '').trim().slice(0, 120);

  return { questions: qs, meta };
}
