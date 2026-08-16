// ============================================================
// FIREBASE CONFIG — REPLACE WITH YOUR OWN PROJECT VALUES
// ------------------------------------------------------------
// Go to: https://console.firebase.google.com
//   -> Your Project -> Project Settings (gear icon) -> General
//   -> "Your apps" -> Web app -> SDK setup and configuration
// Copy the firebaseConfig object shown there and paste it below.
// ============================================================
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'riggs-family-dashboard.firebaseapp.com',
  projectId: 'riggs-family-dashboard',
  storageBucket: 'riggs-family-dashboard.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
