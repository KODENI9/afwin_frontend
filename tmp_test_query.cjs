const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

async function testQuery() {
    try {
        console.log('Testing Firestore query for draw history...');

        // Manual initialization since we're in a standalone script
        const serviceAccountPath = path.join(__dirname, 'backend', 'serviceAccountKey.json');
        if (fs.existsSync(serviceAccountPath)) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountPath),
            });
        } else {
            console.error('Service account key not found at', serviceAccountPath);
            process.exit(1);
        }

        const db = admin.firestore();
        const drawsRef = db.collection('draws');

        const snapshot = await drawsRef
            .where('status', '==', 'drawn')
            .orderBy('draw_date', 'desc')
            .limit(10)
            .get();

        console.log('Query successful! Found', snapshot.size, 'docs.');
    } catch (error) {
        console.error('Query failed with error:');
        console.error(error.message);
        if (error.message.includes('https://console.firebase.google.com')) {
            console.log('\nCRITICAL: Missing index detected! Create it here:');
            const link = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)[0];
            console.log(link);
        }
    }
    process.exit(0);
}

testQuery();
