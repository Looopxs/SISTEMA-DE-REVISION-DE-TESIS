import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AnalysisPipeline } from '@kimy/ai-engine';
import { randomUUID } from 'crypto';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);
  private pipeline: AnalysisPipeline;

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {
    this.pipeline = new AnalysisPipeline({
      apiKey: process.env.GEMINI_API_KEY || '',
      maxGrade: Number(process.env.MAX_GRADE) || 20,
    });
  }

  async findAll(programId?: string) {
    return this.prisma.thesisTemplate.findMany({
      where: {
        ...(programId && { programId }),
        isActive: true,
      },
      include: {
        program: { select: { name: true } },
        _count: { select: { advances: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.thesisTemplate.findUnique({
      where: { id },
      include: {
        program: true,
        chunks: { orderBy: { chunkIndex: 'asc' } },
      },
    });
  }

  async upload(
    file: Express.Multer.File | undefined,
    data: { programId: string; name: string; version: string; citationStyle?: string; rawText?: string },
  ) {
    let fileKey = 'no-file';
    let fileType = 'text';

    if (file) {
      fileType = file.originalname.endsWith('.docx') ? 'docx' : 'pdf';
      fileKey = `templates/${data.programId}/${randomUUID()}.${fileType}`;
      try {
        await this.storage.upload(fileKey, file.buffer, file.mimetype);
      } catch (err: any) {
        this.logger.warn(`MinIO no disponible. Ignorando subida de archivo físico: ${err.message}`);
      }
    }

    let extractedSchema = null;
    try {
      const text = data.rawText ? data.rawText : (file ? await this.pipeline.extractText(file.buffer, fileType as any) : '');
      if (!text || text.length < 10) throw new Error('No text to extract');
      
      const systemPrompt = `Eres un analizador EXHAUSTIVO de documentos académicos. Tu objetivo es leer TODO el documento y extraer su estructura COMPLETA, sin omitir NADA. 
Debes extraer CADA capítulo, CADA subcapítulo, y CADA punto específico mencionado (ej: 1.1, 1.2, 1.2.1, etc).
Devuelve UNICAMENTE un JSON válido con este formato: 
{"sections": [{"label": "Título exacto de la sección o subsección", "description": "Descripción DETALLADA y extensa de todo lo que debe contener este apartado, incluyendo requisitos y reglas."}]}
Es CRÍTICO que el JSON contenga todos los detalles del patrón original y no sea un resumen breve.`;
      
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text.substring(0, 12000) }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 2500,
          temperature: 0.1,
        }),
      });

      if (!groqRes.ok) {
         throw new Error('Fallo al extraer estructura con Groq: ' + await groqRes.text());
      }
      
      const groqData = await groqRes.json();
      extractedSchema = JSON.parse(groqData.choices[0].message.content);

      const template = await this.prisma.thesisTemplate.create({
        data: {
          programId: data.programId,
          name: data.name,
          version: data.version,
          fileKey,
          fileType,
          extractedSchema: extractedSchema as any,
          citationStyle: data.citationStyle || 'APA',
        },
      });

      if (text.length > 50) {
        try {
          const chunks = await this.pipeline.chunkDocument(text);
          const embeddings = await this.pipeline.generateEmbeddings(chunks);

          for (let i = 0; i < chunks.length; i++) {
            await this.prisma.$executeRawUnsafe(
              `INSERT INTO "TemplateChunk" (id, "templateId", "sectionName", content, embedding, "chunkIndex", "createdAt")
               VALUES ($1, $2, $3, $4, $5::vector, $6, NOW())`,
              randomUUID(), template.id, 'auto', chunks[i],
              `[${embeddings[i].join(',')}]`, i,
            );
          }
        } catch (embErr: any) {
           this.logger.warn('Failed to generate chunks/embeddings: ' + embErr?.message);
        }
      }

      this.logger.log(`Template uploaded: ${template.id}`);
      return template;
    } catch (error) {
      this.logger.error('Error processing template:', error);
      return this.prisma.thesisTemplate.create({
        data: {
          programId: data.programId,
          name: data.name,
          version: data.version,
          fileKey,
          fileType,
          citationStyle: data.citationStyle || 'APA',
        },
      });
    }
  }

  async updateRubric(id: string, rubric: any) {
    return this.prisma.thesisTemplate.update({
      where: { id },
      data: { rubric },
    });
  }

  async deactivate(id: string) {
    return this.prisma.thesisTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
