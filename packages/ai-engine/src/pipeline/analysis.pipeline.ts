// ═══════════════════════════════════════════════════════════════
// KIMY — Pipeline de Análisis de IA
// ═══════════════════════════════════════════════════════════════

import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { EVALUATION_PROMPT, REFERENCES_PROMPT, STRUCTURE_PROMPT } from '../prompts';
import type { AnalysisResult, FindingOutput, ExtractedReference, TemplateSchema } from '../types';

function safeJsonParse(text: string): any {
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
  }
  cleanText = cleanText.trim();
  return JSON.parse(cleanText);
}


export class AnalysisPipeline {
  private llm: ChatGoogleGenerativeAI;
  private fastLlm: ChatGoogleGenerativeAI;
  private embeddings: GoogleGenerativeAIEmbeddings;
  private splitter: RecursiveCharacterTextSplitter;

  private config: {
    apiKey: string;
    maxGrade: number;
    model?: string;
    embeddingModel?: string;
  };

  constructor(config: {
    apiKey: string;
    maxGrade: number;
    model?: string;
    embeddingModel?: string;
  }) {
    this.config = config;
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: config.apiKey,
      modelName: config.model || 'gemini-2.0-flash',
      temperature: 0.1,
    });

    this.fastLlm = new ChatGoogleGenerativeAI({
      apiKey: config.apiKey,
      modelName: 'gemini-2.0-flash',
      temperature: 0,
    });

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: config.apiKey,
      modelName: config.embeddingModel || 'gemini-embedding-001',
    });

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' '],
    });
  }

  // ─── Extracción de texto ────────────────────
  async extractText(fileBuffer: Buffer, fileType: 'pdf' | 'docx'): Promise<string> {
    if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    }
    const data = await pdfParse(fileBuffer);
    return data.text;
  }

  // ─── Chunking ──────────────────────────────
  async chunkDocument(text: string): Promise<string[]> {
    return this.splitter.splitText(text);
  }

  // ─── Embeddings ────────────────────────────
  async generateEmbeddings(chunks: string[]): Promise<number[][]> {
    // Procesar en batches de 20 para evitar rate limits
    const batchSize = 20;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await this.embeddings.embedDocuments(batch);
      allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
  }

  // ─── Extracción de estructura ──────────────
  async extractStructure(text: string): Promise<TemplateSchema> {
    const response: any = await (this.fastLlm as any).invoke([
      { role: 'system', content: STRUCTURE_PROMPT },
      { role: 'user', content: text.substring(0, 6000) },
    ]);

    return safeJsonParse(response.content as string);
  }

  // ─── Análisis principal ────────────────────
  async analyze(
    advanceText: string,
    templateSchema: TemplateSchema | object,
    templateText: string,
    advanceType: string,
  ): Promise<AnalysisResult> {
    const startMs = Date.now();

    const userPrompt = `
## DOCUMENTO PATRÓN — ESTRUCTURA ESPERADA
${JSON.stringify(templateSchema, null, 2)}

## FRAGMENTO DEL PATRÓN (referencia de estilo y profundidad)
${templateText.substring(0, 4000)}

## TIPO DE AVANCE A EVALUAR
${advanceType}

## AVANCE DEL ESTUDIANTE
${advanceText.substring(0, 12000)}

## RESPUESTA REQUERIDA
Responde con este JSON exacto (sin backticks, sin markdown):
{
  "scores": {
    "structure": <número 0-100>,
    "content": <número 0-100>,
    "form": <número 0-100>,
    "originality": <número 0-100>
  },
  "executiveSummary": "<párrafo de 4-6 oraciones sintetizando fortalezas, debilidades, prioridad de corrección y nivel de avance>",
  "structureAnalysis": {
    "presentSections": ["lista de secciones encontradas"],
    "missingSections": ["lista de secciones faltantes del patrón"],
    "extraSections": ["secciones no esperadas"],
    "orderCorrect": true/false
  },
  "findings": [
    {
      "sectionRef": "<nombre de la sección afectada>",
      "pageRef": <número de página aprox o null>,
      "severity": "CRITICAL|MAJOR|MINOR|SUGGESTION",
      "description": "<descripción específica del hallazgo, mínimo 2 oraciones>",
      "correctionSteps": "<instrucciones paso a paso para corregir, mínimo 3 pasos>",
      "exampleImprovement": "<ejemplo concreto de redacción o estructura mejorada, mínimo 1 párrafo>",
      "recommendation": "<consejo académico adicional con referencias sugeridas>"
    }
  ]
}`;

    const response: any = await (this.llm as any).invoke([
      { role: 'system', content: EVALUATION_PROMPT },
      { role: 'user', content: userPrompt },
    ]);

    const parsed = safeJsonParse(response.content as string);
    const s = parsed.scores;
    const overall = s.structure * 0.3 + s.content * 0.4 + s.form * 0.2 + s.originality * 0.1;
    const grade = (overall / 100) * this.config.maxGrade;

    return {
      scores: {
        structure: Math.round(s.structure),
        content: Math.round(s.content),
        form: Math.round(s.form),
        originality: Math.round(s.originality),
        overall: Math.round(overall * 10) / 10,
      },
      grade: Math.round(grade * 10) / 10,
      executiveSummary: parsed.executiveSummary,
      structureAnalysis: parsed.structureAnalysis,
      findings: parsed.findings || [],
      processingMs: Date.now() - startMs,
    };
  }

  // ─── Extracción de referencias ─────────────
  async extractReferences(text: string): Promise<ExtractedReference[]> {
    // Buscar la sección de bibliografía
    const bibIndex = text.search(
      /referencias\s+bibliográficas?|bibliografía|references|bibliography/i,
    );
    const bibSection = bibIndex !== -1
      ? text.slice(bibIndex, bibIndex + 8000)
      : text.slice(-5000);

    const response: any = await (this.fastLlm as any).invoke([
      { role: 'system', content: REFERENCES_PROMPT },
      { role: 'user', content: bibSection },
    ]);

    const parsed = safeJsonParse(response.content as string);
    return parsed.references || [];
  }
}
