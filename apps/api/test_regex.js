const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const adv = await prisma.advance.findFirst({
    where: { plagiarismReports: { some: {} } },
    include: { plagiarismReports: true }
  });
  
  if (!adv) return console.log('No advance found');
  
  const plag = adv.plagiarismReports[0];
  const extractedText = adv.extractedText || '';
  const snippet = plag.alerts && plag.alerts.length > 0 ? plag.alerts[0].targetSnippet : null;
  
  console.log('--- ADVANCE ID:', adv.id);
  console.log('Snippet length:', snippet?.length);
  console.log('Extracted length:', extractedText?.length);
  console.log('Exact match?', snippet ? extractedText.includes(snippet) : false);
  
  if (snippet) {
    const words = snippet.trim().split(/\s+/).filter(w => w.length > 2).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    console.log('Words count:', words.length);
    if (words.length > 0) {
      const regexStr = words.join('[\\s\\S]{1,15}?');
      const regex = new RegExp(`(${regexStr})`, 'gi');
      const match = extractedText.match(regex);
      console.log('Fuzzy match?', !!match);
      if (match) {
        console.log('Match found length:', match[0].length);
      } else {
        console.log('Regex string length:', regexStr.length);
        console.log('First 5 words:', words.slice(0, 5));
      }
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
