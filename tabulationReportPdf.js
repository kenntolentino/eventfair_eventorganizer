import PDFDocument from "pdfkit";

const NAVY = "#10233F";
const GOLD = "#B78A35";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const INK = "#0F172A";
const PLACEMENT_MARKER = "Official placements and score standings:\n";

function extractMetadata(summary, label) {
  const line = summary.split(/\r?\n/).find((item) => item.startsWith(`${label}:`));
  return line ? line.slice(label.length + 1).trim() : "Not recorded";
}

function extractPlacements(summary) {
  const placementSection = summary.split(PLACEMENT_MARKER)[1]?.split(/\n\nTabulator notes:/)[0] || "";
  return placementSection.split(/\r?\n/).filter(Boolean).map((line) => {
    const current = line.match(
      /^(.+?) \| (.+?) \| Contestant #(.+?) \| ([\d.]+) (weighted total|weighted average) \| raw total ([\d.]+)$/,
    );
    if (current) {
      return {
        placement: current[1],
        name: current[2],
        contestantNumber: current[3],
        score: current[4],
        scoreLabel: current[5],
        rawScore: current[6],
      };
    }

    const legacy = line.match(
      /^(.+?)\s+[\u2013\u2014?]\s+(.+?) \| ([\d.]+) (weighted total|weighted average) \| raw total ([\d.]+)$/,
    );
    if (!legacy) return null;
    return {
      placement: legacy[1],
      name: legacy[2],
      contestantNumber: "Not captured",
      score: legacy[3],
      scoreLabel: legacy[4],
      rawScore: legacy[5],
    };
  }).filter(Boolean);
}

function drawFooter(doc) {
  const y = doc.page.height - doc.page.margins.bottom + 18;
  doc.save();
  doc.strokeColor(BORDER).moveTo(doc.page.margins.left, y - 10).lineTo(doc.page.width - doc.page.margins.right, y - 10).stroke();
  doc.font("Helvetica").fontSize(8).fillColor(MUTED)
    .text("EventFair | Transparent and sustainable judge tabulation", doc.page.margins.left, y, { lineBreak: false });
  doc.restore();
}

export function createTabulationReportPdf(report, event, author) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 54, right: 48, bottom: 58, left: 48 },
    bufferPages: true,
    info: {
      Title: report.title,
      Author: "EventFair",
      Subject: `Tabulation results for ${event?.name || "event"}`,
    },
  });
  const summary = report.summary || "";
  const placements = extractPlacements(summary);
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc.rect(0, 0, doc.page.width, 13).fill(NAVY);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(NAVY)
    .text("EVENTFAIR", doc.page.margins.left, 34, { characterSpacing: 1.4 });
  doc.font("Helvetica").fontSize(8).fillColor(GOLD)
    .text("TRANSPARENT TABULATION", doc.page.margins.left + 91, 37, { characterSpacing: 0.6 });

  doc.moveDown(2);
  doc.font("Helvetica-Bold").fontSize(22).fillColor(INK)
    .text("Tabulation Results Snapshot", { width: pageWidth });
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(13).fillColor(MUTED)
    .text(event?.name || "Event", { width: pageWidth });
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(9).fillColor(MUTED)
    .text(report.title, { width: pageWidth });

  const generatedAt = report.createdAt ? new Date(report.createdAt).toLocaleString() : "Not recorded";
  const preparedBy = author?.name || author?.fullName || "Tabulator";
  const scoringFormula = extractMetadata(summary, "Scoring formula");
  const eventStatus = extractMetadata(summary, "Event status at generation");
  const completeSheets = extractMetadata(summary, "Complete judge sheets");
  const sheetStatesMetadata = extractMetadata(summary, "Submitted judge sheets");
  const sheetStatesMatch = sheetStatesMetadata.match(/^(\d+);\s*draft judge sheets:\s*(\d+)/i);
  const sheetStates = sheetStatesMatch
    ? `${sheetStatesMatch[1]} submitted / ${sheetStatesMatch[2]} draft`
    : sheetStatesMetadata;
  const rosterMetadata = extractMetadata(summary, "Registered contestants");
  const rosterMatch = rosterMetadata.match(/^(\d+);\s*assigned judges:\s*(\d+)/i);
  const roster = rosterMatch
    ? `${rosterMatch[1]} registered contestants  |  ${rosterMatch[2]} assigned judges`
    : rosterMetadata;
  const openDiscrepancies = extractMetadata(summary, "Open discrepancies at generation");

  doc.moveDown(1.2);
  const metaTop = doc.y;
  const metaHeight = 102;
  doc.roundedRect(doc.page.margins.left, metaTop, pageWidth, metaHeight, 8).fill("#F8FAFC");
  doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED)
    .text("GENERATED", doc.page.margins.left + 14, metaTop + 12)
    .text("PREPARED BY", doc.page.margins.left + 14, metaTop + 39)
    .text("EVENT STATUS", doc.page.margins.left + 14, metaTop + 66)
    .text("SCORING FORMULA", doc.page.margins.left + pageWidth / 2, metaTop + 12)
    .text("COMPLETE SHEETS", doc.page.margins.left + pageWidth / 2, metaTop + 39)
    .text("SUBMITTED / DRAFT", doc.page.margins.left + pageWidth / 2, metaTop + 66);
  doc.font("Helvetica").fontSize(9).fillColor(INK)
    .text(generatedAt, doc.page.margins.left + 14, metaTop + 23, { width: pageWidth / 2 - 25 })
    .text(preparedBy, doc.page.margins.left + 14, metaTop + 50, { width: pageWidth / 2 - 25 })
    .text(eventStatus, doc.page.margins.left + 14, metaTop + 77, { width: pageWidth / 2 - 25 })
    .text(scoringFormula, doc.page.margins.left + pageWidth / 2, metaTop + 23, { width: pageWidth / 2 - 14 })
    .text(completeSheets, doc.page.margins.left + pageWidth / 2, metaTop + 50, { width: pageWidth / 2 - 14 })
    .text(sheetStates, doc.page.margins.left + pageWidth / 2, metaTop + 77, { width: pageWidth / 2 - 14 });
  doc.y = metaTop + metaHeight + 14;

  doc.font("Helvetica").fontSize(9).fillColor(MUTED)
    .text(`${roster}  |  ${openDiscrepancies} open discrepancies at generation`, { width: pageWidth });
  doc.moveDown(1.2);

  doc.font("Helvetica-Bold").fontSize(13).fillColor(INK)
    .text(placements.length ? "Verified Placements at Snapshot" : "Verified Placements", { width: pageWidth });
  doc.moveDown(0.55);

  if (!placements.length) {
    const emptyStateTop = doc.y;
    doc.roundedRect(doc.page.margins.left, emptyStateTop, pageWidth, 56, 8).fill("#FFF7E6");
    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK)
      .text("No verified rankings were recorded at this snapshot.", doc.page.margins.left + 14, emptyStateTop + 13, { width: pageWidth - 28 });
    doc.font("Helvetica").fontSize(8).fillColor(MUTED)
      .text("Complete and verify tabulation before announcing official placements.", doc.page.margins.left + 14, emptyStateTop + 30, { width: pageWidth - 28 });
    doc.y = emptyStateTop + 70;
  } else {
    const columns = {
      placement: { x: doc.page.margins.left, width: 112 },
      name: { x: doc.page.margins.left + 112, width: 172 },
      number: { x: doc.page.margins.left + 284, width: 72 },
      score: { x: doc.page.margins.left + 356, width: pageWidth - 356 },
    };
    const drawTableHeader = () => {
      const top = doc.y;
      doc.rect(doc.page.margins.left, top, pageWidth, 25).fill(NAVY);
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#FFFFFF")
        .text("PLACEMENT", columns.placement.x + 8, top + 8, { width: columns.placement.width - 12 })
        .text("CONTESTANT", columns.name.x + 5, top + 8, { width: columns.name.width - 8 })
        .text("CONTESTANT #", columns.number.x + 4, top + 8, { width: columns.number.width - 6 })
        .text("VERIFIED SCORE", columns.score.x + 3, top + 8, { width: columns.score.width - 6 });
      doc.y = top + 25;
    };
    drawTableHeader();
    for (const [index, placement] of placements.entries()) {
      const rowHeight = 42;
      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
        drawTableHeader();
      }
      const top = doc.y;
      doc.rect(doc.page.margins.left, top, pageWidth, rowHeight)
        .fill(index % 2 === 0 ? "#F8FAFC" : "#FFFFFF");
      doc.strokeColor(BORDER).moveTo(doc.page.margins.left, top + rowHeight)
        .lineTo(doc.page.width - doc.page.margins.right, top + rowHeight).stroke();
      const champion = placement.placement === "Champion";
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(champion ? GOLD : INK)
        .text(placement.placement, columns.placement.x + 8, top + 9, { width: columns.placement.width - 12 });
      doc.font("Helvetica-Bold").fontSize(9).fillColor(INK)
        .text(placement.name, columns.name.x + 5, top + 14, { width: columns.name.width - 10, height: 12, ellipsis: true });
      doc.font("Helvetica").fontSize(8).fillColor(MUTED)
        .text(`#${placement.contestantNumber}`, columns.number.x + 4, top + 14, { width: columns.number.width - 6, height: 12, ellipsis: true });
      doc.font("Helvetica-Bold").fontSize(9).fillColor(INK)
        .text(placement.score, columns.score.x + 3, top + 9, { width: columns.score.width - 8 });
      doc.font("Helvetica").fontSize(7.5).fillColor(MUTED)
        .text(`${placement.scoreLabel} | Raw ${placement.rawScore}`, columns.score.x + 3, top + 23, { width: columns.score.width - 8, height: 12, ellipsis: true });
      doc.y = top + rowHeight;
    }
    doc.y += 16;
  }

  const notesIndex = summary.indexOf("\n\nTabulator notes:\n");
  const notes = notesIndex >= 0 ? summary.slice(notesIndex + "\n\nTabulator notes:\n".length).trim() : "";
  if (notes) {
    if (doc.y > doc.page.height - doc.page.margins.bottom - 72) doc.addPage();
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text("Tabulator Notes", { width: pageWidth });
    doc.moveDown(0.35);
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(notes, { width: pageWidth, lineGap: 3 });
  }

  const pages = doc.bufferedPageRange();
  for (let pageIndex = pages.start; pageIndex < pages.start + pages.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    drawFooter(doc);
  }
  return doc;
}
