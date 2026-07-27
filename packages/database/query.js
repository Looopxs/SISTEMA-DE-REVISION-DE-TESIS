const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.thesisTemplate.findFirst({where: {name: 'UNT COMPLETO'}, orderBy: {createdAt: 'desc'}})
  .then(res => { console.log(JSON.stringify(res, null, 2)); prisma.$disconnect(); })
  .catch(e => { console.error(e); prisma.$disconnect(); });
