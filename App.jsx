import React, { useEffect, useState } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, googleProvider, db } from './firebase'

function useCollection(name) {
  const [items, setItems] = useState([])
  useEffect(() => {
    const q = query(collection(db, name), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [name])
  return items
}

function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Login failed', err)
      alert('Login failed. Check the browser console for details.')
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="bg-white shadow-lg rounded-2xl p-10 text-center max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-2">Riggs Family Dashboard</h1>
        <p className="text-slate-500 mb-6">Sign in with your Gmail account to continue.</p>
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition"
        >
          Login with Google
        </button>
      </div>
    </div>
  )
}

function Section({ title, icon, name, placeholder, extraFields }) {
  const items = useCollection(name)
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignee, setAssignee] = useState('')

  const addItem = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const payload = {
      text: text.trim(),
      done: false,
      createdBy: auth.currentUser?.displayName || 'Someone',
      createdAt: serverTimestamp(),
    }
    if (extraFields?.includes('dueDate')) payload.dueDate = dueDate || null
    if (extraFields?.includes('assignee')) payload.assignee = assignee || null
    await addDoc(collection(db, name), payload)
    setText('')
    setDueDate('')
    setAssignee('')
  }

  const toggleDone = async (item) => {
    await updateDoc(doc(db, name, item.id), { done: !item.done })
  }

  const remove = async (item) => {
    await deleteDoc(doc(db, name, item.id))
  }

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>

      <form onSubmit={addItem} className="flex flex-wrap gap-2 mb-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-[140px] border rounded-lg px-3 py-2 text-sm"
        />
        {extraFields?.includes('dueDate') && (
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        )}
        {extraFields?.includes('assignee') && (
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Assign to"
            className="border rounded-lg px-3 py-2 text-sm w-28"
          />
        )}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          Add
        </button>
      </form>

      <ul className="space-y-2 max-h-72 overflow-y-auto">
        {items.length === 0 && (
          <li className="text-sm text-slate-400 italic">Nothing here yet.</li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 border-b last:border-b-0 pb-2"
          >
            <button
              onClick={() => toggleDone(item)}
              className={`flex-1 text-left text-sm ${
                item.done ? 'line-through text-slate-400' : 'text-slate-800'
              }`}
            >
              {item.done ? '✓' : '○'} {item.text}
              {item.dueDate ? (
                <span className="text-xs text-slate-400 ml-2">due {item.dueDate}</span>
              ) : null}
              {item.assignee ? (
                <span className="text-xs text-slate-400 ml-2">→ {item.assignee}</span>
              ) : null}
            </button>
            <button
              onClick={() => remove(item)}
              className="text-slate-400 hover:text-red-500 text-sm"
              title="Delete"
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Dashboard() {
  const user = auth.currentUser
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Riggs Family Dashboard</h1>
          <p className="text-sm text-slate-500">Jacksonville, FL</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 hidden sm:inline">
            {user?.displayName}
          </span>
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-9 h-9 rounded-full"
            />
          )}
          <button
            onClick={() => signOut(auth)}
            className="text-sm bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section
          title="Tasks"
          icon="✓"
          name="tasks"
          placeholder="Add a task..."
          extraFields={['dueDate']}
        />
        <Section
          title="Chore Chart"
          icon="🧹"
          name="chores"
          placeholder="Add a chore..."
          extraFields={['dueDate', 'assignee']}
        />
        <Section
          title="Shopping List"
          icon="🛒"
          name="shopping"
          placeholder="Add an item..."
        />
        <Section
          title="Notes"
          icon="📝"
          name="notes"
          placeholder="Leave a note for the family..."
        />
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading...
      </div>
    )
  }

  return user ? <Dashboard /> : <Login />
}
