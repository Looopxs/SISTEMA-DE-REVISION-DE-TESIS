const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const adv = await prisma.advance.findUnique({
    where: { id: 'cmqv6u9dk0000bktg6mf9l9as' },
    include: { plagiarismReports: true }
  });
  
  if (!adv) return console.log('No advance found');
  
  const plag = adv.plagiarismReports[0];
  console.log('Plagiarism Reports count:', adv.plagiarismReports.length);
  console.log('Plag Object:', JSON.stringify(plag, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
