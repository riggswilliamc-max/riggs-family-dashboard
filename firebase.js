// ============================================================
// FIREBASE CONFIG — Riggs Family Dashboard project
// ============================================================
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: 'AIzaSyD9GAS3MslrizrAh7CIe3KUiG56Sy5o0sI',
    authDomain: 'riggs-family-dashboard.firebaseapp.com',
    projectId: 'riggs-family-dashboard',
    storageBucket: 'riggs-family-dashboard.firebasestorage.app',
    messagingSenderId: '237887771733',
    appId: '1:237887771733:web:b505dd56ceabd08408b0dc',
    measurementId: 'G-MRF22M8ZDW',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
