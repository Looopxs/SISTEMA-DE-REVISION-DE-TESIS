import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { PlagiarismService } from '../plagiarism/plagiarism.service';
import { ReferencesService } from '../references/references.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AdvancesService {
  private readonly logger = new Logger(AdvancesService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private aiAnalysisService: AiAnalysisService,
    private plagiarismService: PlagiarismService,
    private referencesService: ReferencesService,
  ) {}

  async findAll(filters: {
    studentId?: string;
    programId?: string;
    status?: string;
    advisorId?: string;
  }) {
    const where: any = {};

    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.programId) where.programId = filters.programId;
    if (filters.status) where.status = filters.status;
    if (filters.advisorId) {
      where.student = { advisorId: filters.advisorId };
    }

    return this.prisma.advance.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true } },
        program: { select: { name: true } },
        template: { select: { name: true, version: true } },
        aiAnalysis: {
          select: {
            overallScore: true,
            gradeConverted: true,
            originalityScore: true,
            _count: { select: { findings: true } },
          },
        },
        plagiarismReports: {
          select: { overallScore: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        review: {
          select: { finalGrade: true, status: true, reviewer: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const advance = await this.prisma.advance.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        program: true,
        template: true,
        aiAnalysis: { include: { findings: { orderBy: { severity: 'asc' } } } },
        review: { include: { reviewer: { select: { name: true } } } },
        plagiarismReports: {
          include: { alerts: { orderBy: { similarity: 'desc' }, take: 10 } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        referenceAnalysis: {
          include: { references: { orderBy: { status: 'asc' } } },
        },
      },
    });

    if (!advance) throw new NotFoundException('Avance no encontrado');
    return advance;
  }

  async upload(
    file: Express.Multer.File,
    data: {
      studentId: string;
      programId: string;
      templateId: string;
      title: string;
      advanceType: string;
    },
  ) {
    const fileType = file.originalname.endsWith('.docx') ? 'docx' : 'pdf';
    const fileKey = `advances/${data.studentId}/${randomUUID()}.${fileType}`;

    // Subir a MinIO
    await this.storage.upload(fileKey, file.buffer, file.mimetype);

    // Determinar versión
    const existingVersions = await this.prisma.advance.count({
      where: {
        studentId: data.studentId,
        advanceType: data.advanceType,
      },
    });

    // Si programId no viene en el token (caso Admin), lo sacamos del template
    let programId = data.programId;
    if (!programId) {
      const template = await this.prisma.thesisTemplate.findUnique({
        where: { id: data.templateId },
        select: { programId: true },
      });
      programId = template?.programId || '';
    }

    // Crear avance
    const advance = await this.prisma.advance.create({
      data: {
        title: data.title,
        advanceType: data.advanceType,
        version: existingVersions + 1,
        fileKey,
        fileType,
        fileSizeBytes: file.size,
        status: 'PENDING',
        student: { connect: { id: data.studentId } },
        program: { connect: { id: programId } },
        template: { connect: { id: data.templateId } },
      },
    });

    this.logger.log(`Advance uploaded: ${advance.id} by student ${data.studentId}`);

    // Auditoría
    await this.prisma.auditLog.create({
      data: {
        userId: data.studentId,
        action: 'UPLOAD_ADVANCE',
        entity: 'Advance',
        entityId: advance.id,
        metadata: { title: data.title, advanceType: data.advanceType },
      },
    });

    // Encolar el análisis de IA principal (el cual luego gatillará plagio y referencias al terminar)
    await this.aiAnalysisService.enqueueAnalyze(advance.id);

    return advance;
  }

  async getPreviewUrl(id: string) {
    const advance = await this.prisma.advance.findUnique({ where: { id } });
    if (!advance) throw new NotFoundException('Avance no encontrado');
    return this.storage.getPresignedUrl(advance.fileKey);
  }

  async getStudentAdvances(studentId: string) {
    const advances = await this.prisma.advance.findMany({
      where: { studentId },
      include: {
        aiAnalysis: {
          select: {
            overallScore: true,
            gradeConverted: true,
            _count: { select: { findings: true } },
          },
        },
        review: { select: { finalGrade: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      averageScore: 0,
      pendingCount: 0,
    };

    if (advances.length > 0) {
      const scoresArr = advances
        .filter((a) => a.aiAnalysis)
        .map((a) => a.aiAnalysis!.overallScore);
      stats.averageScore = scoresArr.length
        ? scoresArr.reduce((s, v) => s + v, 0) / scoresArr.length
        : 0;
      stats.pendingCount = advances.filter(
        (a) => a.status === 'PENDING' || a.status === 'AI_PROCESSING',
      ).length;
    }

    return { advances, stats };
  }
}
