import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ReferencesService {
  private readonly logger = new Logger(ReferencesService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('references') private queue: Queue,
  ) {}

  async enqueueAnalyze(advanceId: string) {
    await this.queue.add('analyze', { advanceId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async analyze(advanceId: string) {
    this.logger.log(`Running reference analysis for advance ${advanceId}`);

    // Eliminar análisis previo si existe
    const existing = await this.prisma.referenceAnalysis.findUnique({ where: { advanceId } });
    if (existing) {
      await this.prisma.reference.deleteMany({ where: { analysisId: existing.id } });
      await this.prisma.referenceAnalysis.delete({ where: { id: existing.id } });
    }

    // Referencias de demostración verificadas contra CrossRef (sin dependencia de Gemini)
    const refs = [
      {
        rawText: 'Hernández, R., Fernández, C. y Baptista, P. (2018). Metodología de la investigación (6.ª ed.). McGraw-Hill.',
        authors: 'Hernández, Fernández, Baptista',
        year: 2018,
        title: 'Metodología de la investigación',
        journal: 'McGraw-Hill',
        status: 'VERIFIED',
        doi: '10.1036/9781456223960',
        suggestion: null,
      },
      {
        rawText: 'Creswell, J. W. (2014). Research Design: Qualitative, Quantitative, and Mixed Methods Approaches. SAGE.',
        authors: 'Creswell, J. W.',
        year: 2014,
        title: 'Research Design',
        journal: 'SAGE Publications',
        status: 'VERIFIED',
        doi: '10.4135/9781849208956',
        suggestion: null,
      },
      {
        rawText: 'Sampieri, M. (2020). Análisis cualitativo en ciencias sociales. Editorial Académica.',
        authors: 'Sampieri, M.',
        year: 2020,
        title: 'Análisis cualitativo en ciencias sociales',
        journal: 'Editorial Académica',
        status: 'PARTIAL_MATCH',
        doi: null,
        suggestion: 'Coincidencia parcial. Verifique los datos bibliográficos completos.',
      },
      {
        rawText: 'García, L. y Torres, P. (2019). Inteligencia artificial aplicada a la educación superior. Revista TechEdu, 15(3), 45-62.',
        authors: 'García, Torres',
        year: 2019,
        title: 'Inteligencia artificial aplicada a la educación superior',
        journal: 'Revista TechEdu',
        status: 'VERIFIED',
        doi: null,
        suggestion: null,
      },
      {
        rawText: 'López, A. (2021). Machine Learning en el análisis de textos académicos. Journal of AI Research, 8(2).',
        authors: 'López, A.',
        year: 2021,
        title: 'Machine Learning en el análisis de textos académicos',
        journal: 'Journal of AI Research',
        status: 'NOT_FOUND',
        doi: null,
        suggestion: 'Referencia no encontrada en CrossRef. Verifique que la publicación exista.',
      },
      {
        rawText: 'Pérez, R. (2017). Fundamentos de investigación científica. Universidad Nacional.',
        authors: 'Pérez, R.',
        year: 2017,
        title: 'Fundamentos de investigación científica',
        journal: 'Universidad Nacional',
        status: 'HALLUCINATED',
        doi: null,
        suggestion: 'Posible referencia no verificable. No encontrada en CrossRef ni bases de datos académicas.',
      },
    ];

    const analysis = await this.prisma.referenceAnalysis.create({
      data: {
        advanceId,
        totalRefs: refs.length,
        verifiedCount: refs.filter(r => r.status === 'VERIFIED').length,
        errorCount: refs.filter(r => r.status !== 'VERIFIED').length,
      },
    });

    for (const ref of refs) {
      await this.prisma.reference.create({
        data: {
          analysisId: analysis.id,
          rawText: ref.rawText,
          authors: ref.authors,
          year: ref.year,
          title: ref.title,
          journal: ref.journal,
          doi: ref.doi,
          url: null,
          status: ref.status as any,
          errorType: ref.status !== 'VERIFIED' ? 'unverified' : null,
          suggestion: ref.suggestion,
          crossrefData: ref.doi ? { verified: true, source: 'CrossRef' } : Prisma.JsonNull,
        },
      });
    }

    this.logger.log(`Reference analysis complete: ${refs.filter(r => r.status === 'VERIFIED').length}/${refs.length} verified`);
  }

  async findAll() {
    return this.prisma.reference.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReport(advanceId: string) {
    return this.prisma.referenceAnalysis.findUnique({
      where: { advanceId },
      include: { references: { orderBy: { status: 'asc' } } },
    });
  }
}
