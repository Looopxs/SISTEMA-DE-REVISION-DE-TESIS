const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const adv = await prisma.advance.findUnique({
    where: { id: 'cmqv6u9dk0000bktg6mf9l9as' },
    include: { plagiarismReports: { include: { alerts: true } } }
  });
  const extractedText = adv.extractedText || '';
  const plag = adv.plagiarismReports[0];
  
  plag.alerts.forEach((alert, i) => {
    const snippet = alert.targetSnippet;
    console.log(`\n\n--- ALERT ${i} ---`);
    console.log('Snippet:', snippet);
    
    if (snippet) {
      const words = snippet.trim().split(/\s+/).filter(w => w.length > 2).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (words.length > 0) {
        console.log('Words:', words.join(', '));
        const regexStr = words.join('[\\s\\S]{0,30}?'); // let's try 30 chars
        const regex = new RegExp(`(${regexStr})`, 'gi');
        const match = extractedText.match(regex);
        console.log(`Fuzzy match with 30 chars?`, !!match);
        
        // Find if any words exist in the text at all
        const foundWords = words.filter(w => new RegExp(w, 'i').test(extractedText));
        console.log(`Found words: ${foundWords.length}/${words.length}`);
        
        // let's print the first 200 chars of extracted text just to see what we are dealing with
        if (i === 0) console.log('Extracted start:', extractedText.substring(0, 200));
      }
    }
  });
}

run().catch(console.error).finally(() => prisma.$disconnect());
