const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.thesisTemplate.updateMany({
  where: {
    name: { in: ['UNT 2026', 'UCV', 'Formato APA 7', 'Formato APA 7 - Guía de Tesis Oficial'] }
  },
  data: {
    isActive: false
  }
})
  .then(res => { console.log('Deactivated:', res.count); prisma.$disconnect(); })
  .catch(e => { console.error(e); prisma.$disconnect(); });
