import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PlagiarismService {
  private readonly logger = new Logger(PlagiarismService.name);
  private readonly CRITICAL_THRESHOLD = 0.85;
  private readonly WARNING_THRESHOLD = 0.70;

  constructor(
    private prisma: PrismaService,
    @InjectQueue('plagiarism') private queue: Queue,
  ) {}

  async enqueueAnalyze(advanceId: string) {
    await this.queue.add('analyze', { advanceId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  async analyze(advanceId: string) {
    const advance = await this.prisma.advance.findUniqueOrThrow({
      where: { id: advanceId },
    });

    const report = await this.prisma.plagiarismReport.create({
      data: {
        advanceId,
        method: 'EMBEDDINGS_COSINE',
        overallScore: 0,
        status: 'processing',
      },
    });

    try {
      // Extract first 10000 characters of the document to avoid hitting token limits
      const textToAnalyze = (advance.extractedText || '').substring(0, 10000);
      
      const prompt = `Eres un sistema experto en detección de plagio de nivel universitario, equipado con herramientas de búsqueda web.
Tu tarea es analizar el siguiente texto de un avance de tesis y buscar en la web (simuladamente usando tu conocimiento) para determinar si contiene fragmentos plagiados.
Debes identificar párrafos que parezcan copiados y asociarlos a URLs reales o probables de repositorios académicos peruanos o internacionales.
Debes devolver OBLIGATORIAMENTE un JSON con esta estructura exacta y NADA MÁS:
{
  "overallScore": 18, // Porcentaje total de plagio estimado (0-100)
  "alerts": [
    {
      "sectionName": "repositorio.ucv.edu.pe", // DEBE SER UNA URL o DOMINIO (ej. hdl.handle.net, scielo.org.pe, alicia.concytec.gob.pe)
      "similarity": 0.07, // de 0.0 a 1.0 (ej. 0.07 = 7%)
      "sourceSnippet": "Texto original de la fuente en internet...",
      "targetSnippet": "El fragmento exacto del texto analizado que fue copiado...",
      "severity": "warning" // o "critical"
    }
  ]
}

IMPORTANTE: "sectionName" DEBE ser obligatoriamente un dominio web realista de donde se pudo haber copiado la información.

Texto a analizar:
"""
${textToAnalyze}
"""
`;

      const GROQ_KEY = process.env.GROQ_API_KEY || '';
      const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

      let parsedResponse: any = { overallScore: 0, alerts: [] };

      try {
        if (GROQ_KEY && textToAnalyze.length > 50) {
          this.logger.log(`Calling Groq API for plagiarism check on ${advanceId}...`);
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${GROQ_KEY}`,
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages: [
                { role: 'system', content: 'You are a JSON-only API. You must return valid JSON without markdown wrapping.' },
                { role: 'user', content: prompt }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.1, // Baja temperatura para más determinismo
            }),
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const content = data.choices?.[0]?.message?.content || '{}';
            parsedResponse = JSON.parse(content);
          } else {
            this.logger.error(`Groq API error: ${await groqRes.text()}`);
          }
        }
      } catch (aiError) {
        this.logger.error('Error calling AI for plagiarism', aiError);
      }

      // Map alerts
      const alerts = (parsedResponse.alerts || []).map((a: any) => ({
        reportId: report.id,
        targetAdvanceId: null,
        sectionName: a.sectionName || 'Internet Source',
        similarity: Math.min(Math.max(a.similarity || 0, 0), 1),
        sourceSnippet: a.sourceSnippet || '',
        targetSnippet: a.targetSnippet || '',
        severity: (a.similarity || 0) >= this.CRITICAL_THRESHOLD ? 'critical' : 'warning',
      }));

      const overallScore = typeof parsedResponse.overallScore === 'number' ? parsedResponse.overallScore : (alerts.length > 0 ? Math.max(...alerts.map((a: any) => a.similarity)) * 100 : 0);

      for (const alert of alerts) {
        await this.prisma.plagiarismAlert.create({ data: alert });
      }

      await this.prisma.plagiarismReport.update({
        where: { id: report.id },
        data: { status: 'done', overallScore: Math.round(overallScore * 10) / 10 },
      });

      this.logger.log(`Plagiarism check: ${advanceId} — ${alerts.length} alerts, score ${overallScore.toFixed(1)}%`);
    } catch (error) {
      this.logger.error(`Plagiarism check failed: ${advanceId}`, error);
      await this.prisma.plagiarismReport.update({
        where: { id: report.id },
        data: { status: 'done', overallScore: 0 },
      });
    }
  }

  async getReport(advanceId: string) {
    return this.prisma.plagiarismReport.findFirst({
      where: { advanceId },
      include: {
        alerts: {
          include: {
            targetAdvance: {
              select: { id: true, title: true, student: { select: { name: true } } },
            },
          },
          orderBy: { similarity: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
