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
    file: Express.Multer.File,
    data: { programId: string; name: string; version: string; citationStyle?: string },
  ) {
    const fileType = file.originalname.endsWith('.docx') ? 'docx' : 'pdf';
    const fileKey = `templates/${data.programId}/${randomUUID()}.${fileType}`;

    // Subir archivo a MinIO
    await this.storage.upload(fileKey, file.buffer, file.mimetype);

    // Extraer texto y estructura
    let extractedSchema = null;
    try {
      const text = await this.pipeline.extractText(file.buffer, fileType as any);
      extractedSchema = await this.pipeline.extractStructure(text);

      // Crear template con chunks
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

      // Generar chunks y embeddings
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

      this.logger.log(`Template uploaded: ${template.id} (${chunks.length} chunks)`);
      return template;
    } catch (error) {
      this.logger.error('Error processing template:', error);
      // Guardar sin análisis IA
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
