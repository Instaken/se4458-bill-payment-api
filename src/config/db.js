const admin = require('firebase-admin');
require('dotenv').config();

if (!admin.apps.length) {
    
    const firebaseConfig = {};

    if (process.env.PROJECT_ID) {
        firebaseConfig.projectId = process.env.PROJECT_ID;
    }

    admin.initializeApp(firebaseConfig);
}

const db = admin.firestore();
console.log("Firestore bağlantısı başlatıldı.");

module.exports = db;