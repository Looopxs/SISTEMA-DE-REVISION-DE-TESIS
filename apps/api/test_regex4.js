const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const adv = await prisma.advance.findUnique({
    where: { id: 'cmqv6u9dk0000bktg6mf9l9as' },
    include: { 
      plagiarismReports: {
        include: { alerts: true }
      }
    }
  });
  
  if (!adv) return console.log('No advance found');
  
  const plag = adv.plagiarismReports[0];
  const extractedText = adv.extractedText || '';
  
  console.log('--- ADVANCE ID:', adv.id);
  console.log('Alerts:', plag?.alerts?.length);
  
  if (plag && plag.alerts) {
    plag.alerts.forEach((alert, i) => {
      const snippet = alert.targetSnippet;
      console.log(`Alert ${i} snippet length:`, snippet?.length);
      console.log('Exact match?', snippet ? extractedText.includes(snippet) : false);
      
      if (snippet) {
        const words = snippet.trim().split(/\s+/).filter(w => w.length > 2).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (words.length > 0) {
          const regexStr = words.join('[\\s\\S]{1,15}?');
          const regex = new RegExp(`(${regexStr})`, 'gi');
          const match = extractedText.match(regex);
          console.log(`Fuzzy match for Alert ${i}?`, !!match);
        } else {
          console.log(`Fuzzy match for Alert ${i}? NO WORDS`);
        }
      }
    });
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
