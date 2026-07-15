import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from "docx";
import { ProcessingResult } from "./types";

export async function downloadDocx(result: ProcessingResult) {
  // Create a beautiful Word document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Main Title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: result.summary.title,
                bold: true,
                size: 32, // 16pt
                color: "1E293B", // Slate 800
              }),
            ],
            spacing: { after: 120, before: 120 },
          }),

          // Metadata line
          new Paragraph({
            children: [
              new TextRun({ text: "Файл: ", bold: true, size: 20 }),
              new TextRun({ text: `${result.fileName} (${result.fileSize}) | `, size: 20 }),
              new TextRun({ text: "Время обработки: ", bold: true, size: 20 }),
              new TextRun({ text: `${(result.processingTimeMs / 1000).toFixed(2)} сек | `, size: 20 }),
              new TextRun({ text: "Спикеров: ", bold: true, size: 20 }),
              new TextRun({ text: `${result.metadata.speakersCount} | `, size: 20 }),
              new TextRun({ text: "Точность ИИ: ", bold: true, size: 20 }),
              new TextRun({ text: result.metadata.languageConfidence === "high" ? "Высокая" : result.metadata.languageConfidence === "medium" ? "Средняя" : "Низкая", size: 20 }),
            ],
            spacing: { after: 360 },
          }),

          // Header: Summary
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "Краткое резюме разговора (на русском)",
                bold: true,
                size: 24, // 12pt
                color: "0F172A",
              }),
            ],
            spacing: { before: 240, after: 120 },
          }),

          // Description
          new Paragraph({
            children: [
              new TextRun({
                text: result.summary.description,
                italics: true,
                size: 22,
                color: "334155", // Slate 700
              }),
            ],
            spacing: { after: 180 },
          }),

          // Key points heading
          new Paragraph({
            children: [
              new TextRun({
                text: "Ключевые моменты:",
                bold: true,
                size: 22,
                color: "1E293B",
              }),
            ],
            spacing: { after: 120 },
          }),

          // Key points items
          ...result.summary.keyPoints.map(
            (point) =>
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun({
                    text: point,
                    size: 22,
                    color: "334155",
                  }),
                ],
                spacing: { after: 60 },
              })
          ),

          // Horizontal Divider
          new Paragraph({
            border: {
              bottom: {
                color: "CBD5E1",
                space: 12,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            spacing: { before: 240, after: 240 },
          }),

          // Header: Dialogue
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: "Полная транскрипция и перевод диалога",
                bold: true,
                size: 24,
                color: "0F172A",
              }),
            ],
            spacing: { after: 240 },
          }),

          // Dialogue Turns
          ...result.dialogue.flatMap((turn) => {
            const speakerName = turn.speaker || "Спикер";
            const timestampText = turn.timestamp ? ` [${turn.timestamp}]` : "";

            return [
              // Speaker block header
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${speakerName}${timestampText}:`,
                    bold: true,
                    size: 22,
                    color: "0284C7", // Sky 600
                  }),
                ],
                spacing: { before: 120, after: 60 },
              }),
              // Russian translation
              new Paragraph({
                children: [
                  new TextRun({
                    text: "РУС: ",
                    bold: true,
                    size: 21,
                    color: "0F172A",
                  }),
                  new TextRun({
                    text: turn.russianText,
                    size: 21,
                    color: "0F172A",
                  }),
                ],
                indent: { left: 360 },
                spacing: { after: 40 },
              }),
              // Original Uzbek transcript
              new Paragraph({
                children: [
                  new TextRun({
                    text: "UZB (исходный): ",
                    bold: true,
                    size: 20,
                    color: "64748B", // Slate 500
                  }),
                  new TextRun({
                    text: turn.uzbekText,
                    italics: true,
                    size: 20,
                    color: "64748B",
                  }),
                ],
                indent: { left: 360 },
                spacing: { after: 180 },
              }),
            ];
          }),
        ],
      },
    ],
  });

  // Pack the document to a blob
  const blob = await Packer.toBlob(doc);

  // Trigger browser download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${result.summary.title.replace(/[\s/\\:*?"<>|]+/g, "_")}_транскрипт.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
