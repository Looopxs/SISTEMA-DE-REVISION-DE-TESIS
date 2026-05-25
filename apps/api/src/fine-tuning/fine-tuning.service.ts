import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FineTuningService {
  private readonly logger = new Logger(FineTuningService.name);

  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalPairs, byOutcome, byProgram, datasets] = await Promise.all([
      this.prisma.fineTuningPair.count(),
      this.prisma.fineTuningPair.groupBy({
        by: ['outcomeType'],
        _count: { _all: true },
      }),
      this.prisma.fineTuningPair.groupBy({
        by: ['programId'],
        _count: { _all: true },
      }),
      this.prisma.fineTuningDataset.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return { totalPairs, byOutcome, byProgram, datasets };
  }

  async getDatasets() {
    return this.prisma.fineTuningDataset.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async exportDataset() {
    const pairs = await this.prisma.fineTuningPair.findMany({
      where: { datasetId: null },
      take: 2000,
      include: {
        finding: {
          select: { sectionRef: true, severity: true, description: true },
        },
      },
    });

    // Generar JSONL para fine-tuning
    const jsonlLines = pairs.map((pair) => {
      const original = pair.originalOutput as any;
      const correction = pair.humanCorrection as any;

      return JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'Eres un evaluador académico experto. Analiza hallazgos de revisión de tesis y genera retroalimentación precisa.',
          },
          {
            role: 'user',
            content: `Evalúa este hallazgo (tipo avance: ${pair.advanceType}):\nSección: ${original.sectionRef}\nSeveridad: ${original.severity}\nDescripción: ${original.description}`,
          },
          {
            role: 'assistant',
            content: JSON.stringify(correction),
          },
        ],
      });
    });

    return {
      pairCount: pairs.length,
      jsonl: jsonlLines.join('\n'),
    };
  }
}
