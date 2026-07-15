export interface DialogueTurn {
  speaker: string;
  uzbekText: string;
  russianText: string;
  timestamp?: string;
}

export interface CallSummary {
  title: string;
  description: string;
  keyPoints: string[];
}

export interface CallMetadata {
  speakersCount: number;
  languageConfidence: 'high' | 'medium' | 'low';
}

export interface ProcessingResult {
  fileName: string;
  fileSize: string;
  processingTimeMs: number;
  metadata: CallMetadata;
  summary: CallSummary;
  dialogue: DialogueTurn[];
}
