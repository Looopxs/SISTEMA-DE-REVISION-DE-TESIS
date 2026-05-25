import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.program.findFirst().then(prog => 
  p.thesisTemplate.create({ 
    data: { 
      programId: prog.id, 
      name: 'Formato APA 7 - Guía de Tesis Oficial', 
      version: '1.0', 
      fileKey: 'dummy/path.pdf',
      fileType: 'application/pdf',
      isActive: true, 
      rubric: { structure: 30, content: 40, style: 15, originality: 15 } 
    } 
  })
).then(()=>console.log('Template created')).catch(console.error).finally(()=>p.$disconnect());
