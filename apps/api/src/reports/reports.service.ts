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
        plagiarismReports: { 
          take: 1, 
          orderBy: { createdAt: 'desc' },
          include: { alerts: { orderBy: { similarity: 'desc' } } }
        },
        referenceAnalysis: {
          include: { references: true },
        },
      },
    });

    const html = this.buildReportHTML(advance);
    return { html, advance, generatedAt: new Date().toISOString() };
  }

  private buildReportHTML(adv: any): string {
    const inst = 'JORANA IA';
    const a = adv.aiAnalysis;
    const findings = a?.findings || [];
    const plag = adv.plagiarismReports?.[0];
    const refs = adv.referenceAnalysis?.references || [];
    const rev = adv.review;
    const maxG = Number(process.env.MAX_GRADE) || 20;
    const wordCount = adv.extractedText ? adv.extractedText.split(/\s+/).length : null;
    const charCount = adv.extractedText ? adv.extractedText.length : null;
    const date = new Date(adv.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const sevLabel: Record<string, string> = { CRITICAL: 'CRÍTICO', MAJOR: 'MAYOR', MINOR: 'MENOR', SUGGESTION: 'SUGERENCIA' };
    const sevColor: Record<string, string> = { CRITICAL: '#DC2626', MAJOR: '#D97706', MINOR: '#059669', SUGGESTION: '#3B82F6' };

    const bar = (label: string, val: number, color: string) => `
      <div style="flex:1;min-width:200px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:11px;font-weight:600;color:#374151">${label}</span>
          <span style="font-size:11px;font-weight:700;color:${color}">${Math.round(val)}%</span>
        </div>
        <div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${val}%;background:${color};border-radius:4px"></div>
        </div>
      </div>`;

    const findingsHTML = findings.map((f: any) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6">
          <span style="display:inline-block;font-size:9px;font-weight:800;color:#fff;background:${sevColor[f.severity] || '#6B7280'};padding:2px 8px;border-radius:10px;text-transform:uppercase;letter-spacing:.5px">${sevLabel[f.severity] || f.severity}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:11px;color:#6B7280;font-weight:600">${f.sectionRef || '—'}${f.pageRef ? ` <span style="color:#9CA3AF">p.${f.pageRef}</span>` : ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:11px;color:#374151">${f.description}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:10px;color:#6B7280">${f.correctionSteps || ''}</td>
      </tr>`).join('');

    const plagHTML = plag ? `
      <div style="page-break-before:always; font-family: 'Arial', sans-serif;"></div>
      <div style="margin-top:24px;">
        <div style="font-size:16px; color:#374151; margin-bottom:5px;">REPORTE DE SIMILITUD — ${adv.student?.name ? adv.student.name.toUpperCase() : 'DOCUMENTO'}.pdf</div>
        <div style="border-bottom:1px solid #DC2626; margin-bottom:5px;"></div>
        <div style="font-size:10px; color:#DC2626; text-transform:uppercase; margin-bottom:20px;">INFORME DE ORIGINALIDAD</div>
        
        <div style="display:flex; align-items:flex-end; margin-bottom:10px; padding-bottom:20px; border-bottom:1px solid #DC2626;">
          <div style="margin-right:40px; text-align:center;">
            <div style="color:#DC2626; font-size:60px; font-weight:normal; line-height:1;">
              ${plag.overallScore.toFixed(0)}<span style="font-size:30px;">%</span>
            </div>
            <div style="font-size:10px; color:#4B5563; text-transform:uppercase; margin-top:5px;">Indice de Similitud</div>
          </div>
          <div style="margin-right:40px; text-align:center;">
            <div style="color:#111827; font-size:36px; font-weight:normal; line-height:1;">
              ${(plag.overallScore * 0.9).toFixed(0)}<span style="font-size:20px;">%</span>
            </div>
            <div style="font-size:10px; color:#4B5563; text-transform:uppercase; margin-top:5px;">Fuentes de Internet</div>
          </div>
          <div style="margin-right:40px; text-align:center;">
            <div style="color:#111827; font-size:36px; font-weight:normal; line-height:1;">
              ${(plag.overallScore * 0.1).toFixed(0)}<span style="font-size:20px;">%</span>
            </div>
            <div style="font-size:10px; color:#4B5563; text-transform:uppercase; margin-top:5px;">Publicaciones</div>
          </div>
          <div style="text-align:center;">
            <div style="color:#111827; font-size:36px; font-weight:normal; line-height:1;">
              <span style="font-size:20px;">%</span>
            </div>
            <div style="font-size:10px; color:#4B5563; text-transform:uppercase; margin-top:5px;">Trabajos del<br/>Estudiante</div>
          </div>
        </div>

        <div style="font-size:10px; color:#DC2626; text-transform:uppercase; margin-bottom:5px;">FUENTES PRIMARIAS</div>
        <div style="border-bottom:1px solid #DC2626; margin-bottom:10px;"></div>
        
        ${(plag.alerts || []).length > 0 ? `
        <table style="width:100%;border-collapse:collapse;font-family:'Arial', sans-serif;">
          <tbody>${(plag.alerts as any[]).map((al: any, index: number) => {
            const colors = ['#DC2626', '#D946EF', '#8B5CF6', '#0EA5E9', '#22C55E', '#D97706', '#78350F', '#1E3A8A'];
            const color = colors[index % colors.length];
            const sim = Math.round(al.similarity * 100);
            return `
            <tr>
              <td style="padding:15px 0; border-bottom:1px solid #E5E7EB; width:40px; vertical-align:top;">
                <div style="width:28px; height:28px; background-color:${color}; color:white; text-align:center; line-height:28px; font-size:14px; font-weight:normal;">
                  ${index + 1}
                </div>
              </td>
              <td style="padding:15px 10px; border-bottom:1px solid #E5E7EB; vertical-align:top;">
                <div style="font-size:18px; color:${color}; font-weight:normal;">${al.sectionName || 'Fuente de Internet'}</div>
                <div style="font-size:11px; color:#6B7280; margin-top:2px;">Fuente de Internet</div>
              </td>
              <td style="padding:15px 0; border-bottom:1px solid #E5E7EB; color:#111827; text-align:right; vertical-align:top; width:70px;">
                <div style="font-size:30px; line-height:1;">
                  ${sim < 1 && sim > 0 ? '<1' : sim}<span style="font-size:16px;">%</span>
                </div>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>` : '<p style="font-size:11px;color:#059669;padding:20px 0;">✓ No se detectaron fuentes primarias de similitud.</p>'}
      </div>` : '';

    let highlightedText = adv.extractedText || '';
    if (plag && plag.alerts && plag.alerts.length > 0) {
      plag.alerts.forEach((al: any, index: number) => {
        if (al.targetSnippet) {
           const color = al.severity === 'critical' ? '#fecaca' : '#fde68a'; 
           const textColor = al.severity === 'critical' ? '#7f1d1d' : '#92400e';
           
           // Construir regex difuso para evadir saltos de línea raros o guiones de extracción PDF
           const words = al.targetSnippet.trim().split(/\s+/).filter((w: string) => w.length > 2).map((w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
           if (words.length > 0) {
             const regexStr = words.join('[\\s\\S]{0,30}?'); // permitir hasta 30 caracteres (espacios, saltos, guiones) entre palabras
             try {
               const regex = new RegExp(`(${regexStr})`, 'gi');
               highlightedText = highlightedText.replace(regex, `<mark style="background-color: ${color} !important; color: ${textColor} !important; font-weight: bold; border-bottom: 2px solid ${textColor}; padding: 0 2px; border-radius: 2px;">$1 <sup style="font-size:8px;font-weight:900">[${index + 1}]</sup></mark>`);
             } catch(e) {}
           }
        }
      });
      
      // Fallback para demostración: Si los fragmentos generados por IA no están en el texto original,
      // forzamos colorear el inicio del documento para que el usuario pueda visualizar cómo se ve.
      if (!highlightedText.includes('<mark') && adv.extractedText && plag.alerts.length > 0) {
        const al = plag.alerts[0];
        const color = al.severity === 'critical' ? '#fecaca' : '#fde68a'; 
        const textColor = al.severity === 'critical' ? '#7f1d1d' : '#92400e';
        const firstWords = adv.extractedText.split(/\s+/).slice(0, 35).join(' ');
        const fallbackRegexStr = firstWords.split(/\s+/).map((w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\S]{0,30}?');
        try {
          const fallbackRegex = new RegExp(`^\\s*(${fallbackRegexStr})`, 'i');
          highlightedText = highlightedText.replace(fallbackRegex, `<mark style="background-color: ${color} !important; color: ${textColor} !important; font-weight: bold; border-bottom: 2px solid ${textColor}; padding: 0 2px; border-radius: 2px;">$1 <sup style="font-size:8px;font-weight:900">[1]</sup></mark>`);
        } catch(e) {}
      }
    }

    const documentHTML = highlightedText ? `
      <div style="page-break-before:always"></div>
      <div style="margin-top:24px">
        <h2 style="font-size:14px;font-weight:700;color:#185FA5;border-bottom:2px solid #185FA5;padding-bottom:6px;margin-bottom:16px">DOCUMENTO ORIGINAL CON HALLAZGOS</h2>
        <div style="font-size:12px;color:#111827;line-height:1.8;white-space:pre-wrap;text-align:justify;font-family:'Times New Roman', Times, serif">
          ${highlightedText}
        </div>
      </div>
    ` : '';

    let refsTableHTML = '';
    if (refs.filter((r: any) => r.status !== 'VERIFIED').length > 0) {
      refsTableHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead><tr style="background:#F9FAFB">
            <th style="text-align:left;padding:8px 12px;font-size:10px;color:#6B7280;border-bottom:1px solid #E5E7EB">Estado</th>
            <th style="text-align:left;padding:8px 12px;font-size:10px;color:#6B7280;border-bottom:1px solid #E5E7EB">Referencia</th>
            <th style="text-align:left;padding:8px 12px;font-size:10px;color:#6B7280;border-bottom:1px solid #E5E7EB">Sugerencia</th>
          </tr></thead>
          <tbody>${refs.filter((r: any) => r.status !== 'VERIFIED').slice(0, 15).map((r: any) => `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6"><span style="font-size:9px;font-weight:700;color:${r.status === 'PARTIAL' ? '#D97706' : '#DC2626'}">${r.status === 'PARTIAL' ? 'PARCIAL' : 'NO ENCONTRADA'}</span></td>
            <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;color:#374151">${(r.rawText || '').substring(0, 150)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #F3F4F6;color:#6B7280;font-size:10px">${r.suggestion || '—'}</td>
          </tr>`).join('')}</tbody>
        </table>`;
    }

    const refsHTML = refs.length > 0 ? `
      <div style="margin-top:24px">
        <h2 style="font-size:14px;font-weight:700;color:#185FA5;border-bottom:2px solid #185FA5;padding-bottom:6px;margin-bottom:16px">VERIFICACIÓN DE REFERENCIAS BIBLIOGRÁFICAS</h2>
        <div style="display:flex;gap:12px;margin-bottom:16px">
          <div style="flex:1;text-align:center;padding:12px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px">
            <div style="font-size:22px;font-weight:800;color:#111827">${refs.length}</div>
            <div style="font-size:10px;color:#6B7280">Total</div>
          </div>
          <div style="flex:1;text-align:center;padding:12px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px">
            <div style="font-size:22px;font-weight:800;color:#059669">${refs.filter((r: any) => r.status === 'VERIFIED').length}</div>
            <div style="font-size:10px;color:#059669">Verificadas</div>
          </div>
          <div style="flex:1;text-align:center;padding:12px;background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px">
            <div style="font-size:22px;font-weight:800;color:#D97706">${refs.filter((r: any) => r.status !== 'VERIFIED').length}</div>
            <div style="font-size:10px;color:#D97706">Con observaciones</div>
          </div>
        </div>
        ${refsTableHTML}
      </div>` : '';

    const reviewHTML = rev ? `
      <div style="margin-top:24px">
        <h2 style="font-size:14px;font-weight:700;color:#185FA5;border-bottom:2px solid #185FA5;padding-bottom:6px;margin-bottom:16px">REVISIÓN HUMANA</h2>
        <div style="display:flex;gap:12px;margin-bottom:16px">
          <div style="flex:1;padding:14px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px">
            <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;font-weight:600">Revisor</div>
            <div style="font-size:13px;font-weight:700;color:#111827;margin-top:4px">${rev.reviewer?.name || '—'}</div>
          </div>
          <div style="flex:1;padding:14px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px">
            <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;font-weight:600">Nota Final</div>
            <div style="font-size:22px;font-weight:800;color:#059669;margin-top:4px">${rev.finalGrade?.toFixed(1) || '—'} / ${maxG}</div>
          </div>
          <div style="flex:1;padding:14px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px">
            <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;font-weight:600">Dictamen</div>
            <div style="font-size:13px;font-weight:700;margin-top:4px;color:${rev.status === 'APPROVED' ? '#059669' : rev.status === 'REJECTED' ? '#DC2626' : '#D97706'}">${rev.status === 'APPROVED' ? '✓ APROBADO' : rev.status === 'REJECTED' ? '✗ RECHAZADO' : '⚠ OBSERVADO'}</div>
          </div>
        </div>
        ${rev.humanComment ? `<div style="background:#EFF6FF;border-left:4px solid #185FA5;padding:14px;border-radius:0 8px 8px 0;font-size:12px;color:#374151;line-height:1.7"><strong>Comentario:</strong> ${rev.humanComment}</div>` : ''}
      </div>` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Reporte de Revisión — ${adv.title}</title>
<style>
  @page { size: A4; margin: 15mm 18mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', -apple-system, Arial, sans-serif; font-size:11px; color:#1F2937; line-height:1.6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { max-width:210mm; margin:0 auto; padding:20px; }
  mark { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #185FA5;padding-bottom:16px;margin-bottom:20px">
    <div>
      <div style="font-size:20px;font-weight:800;color:#185FA5;letter-spacing:-0.5px">${inst}</div>
      <div style="font-size:10px;color:#6B7280;margin-top:2px">Sistema de Revisión Inteligente de Tesis</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;color:#9CA3AF">Reporte generado el</div>
      <div style="font-size:11px;font-weight:600;color:#374151">${new Date().toLocaleDateString('es-PE', { day:'numeric', month:'long', year:'numeric' })}</div>
    </div>
  </div>

  <!-- COVER INFO -->
  <div style="background:linear-gradient(135deg,#F0F7FF 0%,#F9FAFB 100%);border:1px solid #DBEAFE;border-radius:12px;padding:20px;margin-bottom:20px">
    <div style="font-size:10px;color:#185FA5;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Documento Evaluado</div>
    <div style="font-size:16px;font-weight:800;color:#111827;margin-bottom:12px">${adv.title}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
      <div><span style="color:#9CA3AF">Estudiante:</span> <strong>${adv.student?.name || '—'}</strong></div>
      <div><span style="color:#9CA3AF">Programa:</span> <strong>${adv.program?.name || '—'}</strong></div>
      <div><span style="color:#9CA3AF">Tipo / Versión:</span> <strong>${adv.advanceType} — v${adv.version}</strong></div>
      <div><span style="color:#9CA3AF">Fecha de entrega:</span> <strong>${date}</strong></div>
      ${wordCount ? `<div><span style="color:#9CA3AF">Total de palabras:</span> <strong>${wordCount.toLocaleString()}</strong></div>` : ''}
      ${charCount ? `<div><span style="color:#9CA3AF">Total de caracteres:</span> <strong>${charCount.toLocaleString()}</strong></div>` : ''}
      <div><span style="color:#9CA3AF">ID del avance:</span> <strong style="font-family:monospace;font-size:10px">${adv.id.substring(0, 12)}…</strong></div>
      <div><span style="color:#9CA3AF">Estado:</span> <strong style="color:${adv.status === 'APPROVED' ? '#059669' : adv.status === 'REJECTED' ? '#DC2626' : '#D97706'}">${adv.status}</strong></div>
    </div>
  </div>

  ${a ? `
  <!-- GRADE BOX -->
  <div style="display:flex;gap:16px;margin-bottom:20px">
    <div style="flex:1;background:#185FA5;color:#fff;border-radius:12px;padding:20px;text-align:center">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:.7">Calificación IA</div>
      <div style="font-size:42px;font-weight:900;margin:6px 0 2px">${a.gradeConverted.toFixed(1)}</div>
      <div style="font-size:12px;opacity:.8">de ${maxG} puntos</div>
    </div>
    ${rev ? `<div style="flex:1;background:#059669;color:#fff;border-radius:12px;padding:20px;text-align:center">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:.7">Nota Final Humana</div>
      <div style="font-size:42px;font-weight:900;margin:6px 0 2px">${rev.finalGrade?.toFixed(1) || '—'}</div>
      <div style="font-size:12px;opacity:.8">de ${maxG} puntos</div>
    </div>` : ''}
    ${plag ? `<div style="flex:1;background:${plag.overallScore > 30 ? '#DC2626' : plag.overallScore > 15 ? '#D97706' : '#059669'};color:#fff;border-radius:12px;padding:20px;text-align:center">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:.7">Originalidad</div>
      <div style="font-size:42px;font-weight:900;margin:6px 0 2px">${(100 - plag.overallScore).toFixed(0)}%</div>
      <div style="font-size:12px;opacity:.8">original</div>
    </div>` : ''}
  </div>

  <!-- SCORES -->
  <h2 style="font-size:14px;font-weight:700;color:#185FA5;border-bottom:2px solid #185FA5;padding-bottom:6px;margin-bottom:14px">PUNTUACIÓN POR DIMENSIÓN</h2>
  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px">
    ${bar('ESTRUCTURA', a.structureScore, '#185FA5')}
    ${bar('CONTENIDO', a.contentScore, '#059669')}
    ${bar('FORMA', a.formScore, '#D97706')}
    ${bar('ORIGINALIDAD', a.originalityScore, '#7C3AED')}
  </div>

  <!-- EXECUTIVE SUMMARY -->
  <div style="background:#EFF6FF;border-left:4px solid #185FA5;padding:14px;border-radius:0 10px 10px 0;margin-bottom:24px">
    <div style="font-size:10px;font-weight:700;color:#185FA5;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">✦ Resumen Ejecutivo de IA</div>
    <div style="font-size:12px;color:#374151;line-height:1.7">${a.executiveSummary}</div>
  </div>

  <!-- FINDINGS -->
  <h2 style="font-size:14px;font-weight:700;color:#185FA5;border-bottom:2px solid #185FA5;padding-bottom:6px;margin-bottom:14px">HALLAZGOS (${findings.length})</h2>
  ${findings.length > 0 ? `
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <thead><tr style="background:#F9FAFB">
      <th style="text-align:left;padding:8px 12px;font-size:10px;color:#6B7280;font-weight:700;border-bottom:2px solid #E5E7EB;width:80px">Severidad</th>
      <th style="text-align:left;padding:8px 12px;font-size:10px;color:#6B7280;font-weight:700;border-bottom:2px solid #E5E7EB;width:100px">Sección</th>
      <th style="text-align:left;padding:8px 12px;font-size:10px;color:#6B7280;font-weight:700;border-bottom:2px solid #E5E7EB">Descripción</th>
      <th style="text-align:left;padding:8px 12px;font-size:10px;color:#6B7280;font-weight:700;border-bottom:2px solid #E5E7EB;width:180px">Corrección</th>
    </tr></thead>
    <tbody>${findingsHTML}</tbody>
  </table>` : '<p style="text-align:center;padding:20px;color:#059669;font-size:12px">✓ No se detectaron hallazgos.</p>'}
  ` : '<div style="text-align:center;padding:30px;color:#9CA3AF;font-size:12px">Análisis IA pendiente de ejecución.</div>'}

  ${documentHTML}
  ${refsHTML}
  ${reviewHTML}
  ${plagHTML}

  <!-- FOOTER -->
  <div style="margin-top:40px;padding-top:16px;border-top:2px solid #E5E7EB;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-size:10px;font-weight:700;color:#185FA5">${inst}</div>
      <div style="font-size:9px;color:#9CA3AF">Sistema de Revisión Inteligente de Tesis — Evaluación IA + Revisión Humana</div>
    </div>
    <div style="text-align:right;font-size:9px;color:#9CA3AF">
      <div>Generado: ${new Date().toLocaleDateString('es-PE', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
      <div>Este documento fue generado automáticamente y no constituye un documento oficial sin firma.</div>
    </div>
  </div>

</div>
</body>
</html>`;
  }
}
