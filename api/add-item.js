// Vercel serverless function: adds one item to the family dashboard's Firestore.
// Scoped on purpose — this endpoint can only CREATE documents in a fixed list of
// collections. It can't read, update, or delete anything, so a leaked API_SECRET
// only ever lets someone add list items, never touch existing family data.
//
// Required Vercel project env vars:
//   FIREBASE_SERVICE_ACCOUNT_KEY_BASE64  - base64 of the Firebase service account JSON
//   API_SECRET                           - shared secret required in the X-Api-Secret header

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const ALLOWED_COLLECTIONS = ['tasks', 'chores', 'shopping', 'notes', 'events']

function getDb() {
  if (!getApps().length) {
    const raw = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 || '', 'base64').toString('utf8')
    const serviceAccount = JSON.parse(raw)
    initializeApp({ credential: cert(serviceAccount) })
  }
  return getFirestore()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const providedSecret = req.headers['x-api-secret']
  if (!providedSecret || providedSecret !== process.env.API_SECRET) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { collection: col, text, dueDate, assignee, category, endDate, recurrence, createdBy } = req.body || {}

  if (!col || !ALLOWED_COLLECTIONS.includes(col)) {
    res.status(400).json({ error: `collection must be one of: ${ALLOWED_COLLECTIONS.join(', ')}` })
    return
  }
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'text is required' })
    return
  }

  const payload = {
    text: text.trim(),
    createdBy: createdBy || 'Claude',
    createdAt: FieldValue.serverTimestamp(),
  }

  if (col !== 'notes') payload.done = false

  if (['tasks', 'chores', 'events'].includes(col) && dueDate) payload.dueDate = dueDate
  if (['tasks', 'chores'].includes(col) && assignee) payload.assignee = assignee
  if (col === 'events') {
    payload.category = category || 'general'
    if (endDate) payload.endDate = endDate
    if (recurrence) payload.recurrence = recurrence
  }

  try {
    const db = getDb()
    const ref = await db.collection(col).add(payload)
    res.status(200).json({ ok: true, id: ref.id, collection: col })
  } catch (err) {
    console.error('add-item failed:', err)
    res.status(500).json({ error: 'Failed to write to Firestore' })
  }
}
