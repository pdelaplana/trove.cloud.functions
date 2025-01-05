import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export Firestore instance for reuse
export const db = admin.firestore();
