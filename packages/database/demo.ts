import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Poblando datos de demostración...');
  
  const student = await prisma.user.findUnique({ where: { email: 'estudiante1@kimy.edu' } });
  const program = await prisma.program.findFirst();
  
  if (!student || !program) {
    console.log('❌ Faltan usuarios o programas. Corre seed.ts primero.');
    return;
  }

  // Crear template
  const template = await prisma.thesisTemplate.create({
    data: {
      programId: program.id,
      name: 'Plantilla de Tesis 2026',
      version: '1.0',
      fileKey: 'demo-template.pdf',
      fileType: 'pdf',
      isActive: true,
      rubric: { structure: 40, content: 40, style: 20 },
      extractedSchema: { sections: ["Introducción", "Metodología", "Resultados"] }
    }
  });

  // Crear Avances
  const advance1 = await prisma.advance.create({
    data: {
      studentId: student.id,
      templateId: template.id,
      title: 'Análisis de Redes Neuronales en Tesis',
      advanceType: 'PROYECTO',
      fileKey: 'demo-advance-1.pdf',
      fileType: 'pdf',
      extractedText: 'El presente trabajo investiga las redes neuronales...',
      status: 'AI_COMPLETE'
    }
  });

  const advance2 = await prisma.advance.create({
    data: {
      studentId: student.id,
      templateId: template.id,
      title: 'Implementación de Blockchain en Educación',
      advanceType: 'INFORME',
      fileKey: 'demo-advance-2.pdf',
      fileType: 'pdf',
      extractedText: 'La tecnología blockchain permite registros inmutables...',
      status: 'OBSERVED'
    }
  });

  // Inyectar AI Analysis
  await prisma.aIAnalysis.create({
    data: {
      advanceId: advance1.id,
      structureScore: 85,
      contentScore: 90,
      formScore: 88,
      originalityScore: 95,
      overallScore: 89.5,
      gradeConverted: 17.9,
      executiveSummary: 'APROBADO: Excelente estructura y redacción.',
      processingMs: 1500,
      modelUsed: 'gemini-1.5-pro',
      findings: {
        create: [
          { sectionRef: 'Metodología', pageRef: 12, severity: 'MINOR', description: 'Mejorar formato APA', correctionSteps: 'Alinear tablas', recommendation: 'Ver manual APA' }
        ]
      }
    }
  });

  await prisma.aIAnalysis.create({
    data: {
      advanceId: advance2.id,
      structureScore: 50,
      contentScore: 55,
      formScore: 60,
      originalityScore: 70,
      overallScore: 58.75,
      gradeConverted: 11.75,
      executiveSummary: 'OBSERVADO: Faltan antecedentes y el diseño metodológico es débil.',
      processingMs: 1400,
      modelUsed: 'gemini-1.5-pro',
      findings: {
        create: [
          { sectionRef: 'Introducción', pageRef: 5, severity: 'CRITICAL', description: 'No hay justificación', correctionSteps: 'Agregar justificación social', recommendation: 'Leer Hernández Sampieri' }
        ]
      }
    }
  });

  // Inyectar Plagio
  const report1 = await prisma.plagiarismReport.create({
    data: { advanceId: advance1.id, method: 'EMBEDDINGS_COSINE', overallScore: 12.5, status: 'done' }
  });
  await prisma.plagiarismAlert.create({
    data: { reportId: report1.id, sectionName: 'Marco Teórico', similarity: 0.2, sourceSnippet: 'Redes neuronales artificiales', targetSnippet: 'Las redes neuronales', severity: 'minor' }
  });

  console.log('✅ Datos de demostración poblados con éxito!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
