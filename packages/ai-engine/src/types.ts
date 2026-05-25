export interface AnalysisResult {
  scores: {
    structure: number;
    content: number;
    form: number;
    originality: number;
    overall: number;
  };
  grade: number;
  executiveSummary: string;
  structureAnalysis: {
    presentSections: string[];
    missingSections: string[];
    extraSections: string[];
    orderCorrect: boolean;
  };
  findings: FindingOutput[];
  processingMs: number;
}

export interface FindingOutput {
  sectionRef: string;
  pageRef?: number;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'SUGGESTION';
  description: string;
  correctionSteps: string;
  exampleImprovement: string;
  recommendation: string;
}

export interface ExtractedReference {
  rawText: string;
  authors: string | null;
  year: number | null;
  title: string | null;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  doi: string | null;
  url: string | null;
}

export interface TemplateSchema {
  sections: {
    name: string;
    required: boolean;
    order: number;
    subsections?: string[];
    minWords?: number;
    maxWords?: number;
    description?: string;
  }[];
  citationStyle: string;
  writingStyle?: string;
}
