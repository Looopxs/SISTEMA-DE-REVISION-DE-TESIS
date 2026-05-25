import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  async generateAdvanceReport(advanceId: string) {
    const advance = await this.prisma.advance.findUniqueOrThrow({
      where: { id: advanceId },
      include: {
        student: { select: { name: true, email: true } },
        program: { select: { name: true } },
        template: { select: { name: true, version: true } },
        aiAnalysis: {
          include: { findings: { orderBy: { severity: 'asc' } } },
        },
        review: {
          include: { reviewer: { select: { name: true } } },
        },
        referenceAnalysis: {
          include: { references: { where: { status: { not: 'VERIFIED' } }, take: 10 } },
        },
      },
    });

    // Generar HTML para el reporte
    const html = this.buildReportHTML(advance);

    return {
      html,
      advance,
      generatedAt: new Date().toISOString(),
    };
  }

  private buildReportHTML(advance: any): string {
    const institution = process.env.INSTITUTION_NAME || 'Universidad';
    const analysis = advance.aiAnalysis;
    const findings = analysis?.findings || [];

    const severityColors: Record<string, string> = {
      CRITICAL: '#DC2626',
      MAJOR: '#D97706',
      MINOR: '#059669',
      SUGGESTION: '#2563EB',
    };

    const findingsHTML = findings.map((f: any) => `
      <div style="border:1px solid #E5E7EB;border-radius:8px;padding:14px;margin-bottom:10px;page-break-inside:avoid">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="background:${severityColors[f.severity]}20;color:${severityColors[f.severity]};font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">${f.severity}</span>
          <span style="font-size:11px;color:#6B7280">${f.sectionRef}${f.pageRef ? ` — p.${f.pageRef}` : ''}</span>
        </div>
        <p style="font-size:11.5px;color:#374151;margin:0 0 6px">${f.description}</p>
        <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:8px 10px;font-size:11px;color:#4B5563;margin-bottom:6px">
          <strong>Cómo corregir:</strong> ${f.correctionSteps}
        </div>
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:6px;padding:8px 10px;font-size:10.5px;color:#166534;font-style:italic">
          <strong>Ejemplo:</strong> ${f.exampleImprovement}
        </div>
      </div>
    `).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:11px; color:#1F2937; line-height:1.6; padding:20px; }
  .header { text-align:center; padding:30px 0; border-bottom:2px solid #185FA5; margin-bottom:24px; }
  .institution { font-size:14px; font-weight:600; color:#185FA5; }
  .title { font-size:18px; font-weight:700; color:#111827; margin:10px 0 4px; }
  .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; }
  .meta-card { background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; padding:10px; }
  .meta-label { font-size:10px; color:#9CA3AF; text-transform:uppercase; }
  .meta-value { font-size:13px; font-weight:600; color:#111827; }
  .section-title { font-size:14px; font-weight:700; color:#185FA5; margin:20px 0 10px; border-bottom:1px solid #E5E7EB; padding-bottom:6px; }
  .score-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:16px; }
  .score-item { text-align:center; border:1px solid #E5E7EB; border-radius:8px; padding:10px; }
  .score-val { font-size:22px; font-weight:700; color:#185FA5; }
  .score-lbl { font-size:10px; color:#6B7280; }
  .summary { background:#EFF6FF; border-left:4px solid #185FA5; padding:12px; border-radius:0 8px 8px 0; margin-bottom:20px; }
  .grade-box { background:#185FA5; color:#fff; border-radius:12px; padding:16px; text-align:center; margin-bottom:20px; }
  .grade-big { font-size:36px; font-weight:800; }
</style></head>
<body>
  <div class="header">
    <div class="institution">${institution}</div>
    <div class="title">Acta de Revisión de Avance de Tesis</div>
    <div style="font-size:11px;color:#6B7280">Sistema KIMY — Evaluación IA + Revisión Humana</div>
  </div>

  <div class="meta-grid">
    <div class="meta-card"><div class="meta-label">Estudiante</div><div class="meta-value">${advance.student.name}</div></div>
    <div class="meta-card"><div class="meta-label">Programa</div><div class="meta-value">${advance.program.name}</div></div>
    <div class="meta-card"><div class="meta-label">Avance</div><div class="meta-value">${advance.advanceType} — v${advance.version}</div></div>
    <div class="meta-card"><div class="meta-label">Estado</div><div class="meta-value">${advance.status}</div></div>
  </div>

  ${analysis ? `
  <div class="grade-box">
    <div class="grade-big">${analysis.gradeConverted.toFixed(1)} / ${process.env.MAX_GRADE || 20}</div>
    <div style="font-size:12px;opacity:0.85">Nota IA${advance.review ? ` | Nota Final: ${advance.review.finalGrade?.toFixed(1) || '—'}` : ''}</div>
  </div>

  <div class="section-title">Puntuación por Dimensión</div>
  <div class="score-grid">
    <div class="score-item"><div class="score-val">${analysis.structureScore}%</div><div class="score-lbl">Estructura</div></div>
    <div class="score-item"><div class="score-val">${analysis.contentScore}%</div><div class="score-lbl">Contenido</div></div>
    <div class="score-item"><div class="score-val">${analysis.formScore}%</div><div class="score-lbl">Forma</div></div>
    <div class="score-item"><div class="score-val">${analysis.originalityScore}%</div><div class="score-lbl">Originalidad</div></div>
  </div>

  <div class="section-title">Resumen Ejecutivo</div>
  <div class="summary">${analysis.executiveSummary}</div>

  <div class="section-title">Hallazgos (${findings.length})</div>
  ${findingsHTML}
  ` : '<p>Análisis IA pendiente</p>'}

  ${advance.review ? `
  <div class="section-title">Revisión Humana</div>
  <div class="meta-grid">
    <div class="meta-card"><div class="meta-label">Revisor</div><div class="meta-value">${advance.review.reviewer.name}</div></div>
    <div class="meta-card"><div class="meta-label">Nota Final</div><div class="meta-value">${advance.review.finalGrade?.toFixed(1) || '—'}</div></div>
  </div>
  ${advance.review.humanComment ? `<div class="summary">${advance.review.humanComment}</div>` : ''}
  ` : ''}

  <div style="text-align:center;margin-top:30px;color:#9CA3AF;font-size:10px">
    Generado por KIMY — ${new Date().toLocaleDateString('es-PE', { year:'numeric', month:'long', day:'numeric' })}
  </div>
</body></html>`;
  }
}
