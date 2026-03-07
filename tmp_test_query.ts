import { db } from './backend/src/config/firebase';

async function testQuery() {
  try {
    console.log('Testing Firestore query for draw history...');
    const drawsRef = db.collection('draws');
    const snapshot = await drawsRef
      .where('status', '==', 'drawn')
      .orderBy('draw_date', 'desc')
      .limit(10)
      .get();
    
    console.log('Query successful! Found', snapshot.size, 'docs.');
  } catch (error: any) {
    console.error('Query failed with error:');
    console.error(error.message);
    if (error.stack) {
      // Look for the index creation link in the error message or stack
      const linkMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
      if (linkMatch) {
        console.log('\nCRITICAL: Missing index detected! Create it here:');
        console.log(linkMatch[0]);
      }
    }
  }
  process.exit(0);
}

testQuery();
