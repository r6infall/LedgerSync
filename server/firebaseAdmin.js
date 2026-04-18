const admin = require('firebase-admin');

// We will use standard env variables for Firebase Admin SDK
// You can provide these in your .env file
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace literal \n with actual newlines if present
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
    // Provide a dummy app initialization for local dev if keys are missing
    // This allows the server to boot, but auth will fail.
    admin.initializeApp();
  }
}

module.exports = admin;
