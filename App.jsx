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

function todayStr() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function addDaysStr(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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

    // Clear the form immediately so it doesn't sit there with stale text
    // while the write is in flight (Firestore round-trip can take a moment).
    setText('')
    setDueDate('')
    setAssignee('')

    try {
      await addDoc(collection(db, name), payload)
    } catch (err) {
      console.error('Failed to add item', err)
      // Restore what the user typed so they don't lose it on failure.
      setText(payload.text)
      if (payload.dueDate) setDueDate(payload.dueDate)
      if (payload.assignee) setAssignee(payload.assignee)
      alert('Could not save that — check your connection and try again.')
    }
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

      <ul className="space-y-2 max-h-96 overflow-y-auto">
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

const OAKLEAF_LAT = 30.1735
const OAKLEAF_LON = -81.7573

function weatherDescription(code) {
  const map = {
    0: { label: 'Clear sky', icon: '☀️' },
    1: { label: 'Mostly clear', icon: '🌤️' },
    2: { label: 'Partly cloudy', icon: '⛅' },
    3: { label: 'Overcast', icon: '☁️' },
    45: { label: 'Fog', icon: '🌫️' },
    48: { label: 'Fog', icon: '🌫️' },
    51: { label: 'Light drizzle', icon: '🌦️' },
    53: { label: 'Drizzle', icon: '🌦️' },
    55: { label: 'Heavy drizzle', icon: '🌧️' },
    61: { label: 'Light rain', icon: '🌦️' },
    63: { label: 'Rain', icon: '🌧️' },
    65: { label: 'Heavy rain', icon: '🌧️' },
    71: { label: 'Light snow', icon: '🌨️' },
    73: { label: 'Snow', icon: '🌨️' },
    75: { label: 'Heavy snow', icon: '❄️' },
    80: { label: 'Rain showers', icon: '🌦️' },
    81: { label: 'Rain showers', icon: '🌧️' },
    82: { label: 'Violent showers', icon: '⛈️' },
    95: { label: 'Thunderstorm', icon: '⛈️' },
    96: { label: 'Thunderstorm w/ hail', icon: '⛈️' },
    99: { label: 'Thunderstorm w/ hail', icon: '⛈️' },
  }
  return map[code] || { label: 'Weather', icon: '🌡️' }
}

function dayLabel(dateStr, index) {
  if (index === 0) return 'Today'
  // Parse as a local date (not UTC) so it matches the calendar day Open-Meteo means.
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${OAKLEAF_LAT}&longitude=${OAKLEAF_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=7&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York`
    fetch(url)
      .then((res) => res.json())
      .then((data) => setWeather(data))
      .catch((err) => {
        console.error('Weather fetch failed', err)
        setError(true)
      })
  }, [])

  if (error) return null // fail silently rather than break the dashboard

  if (!weather) {
    return (
      <div className="bg-white rounded-2xl shadow p-5 text-sm text-slate-400">
        Loading weather…
      </div>
    )
  }

  const { label, icon } = weatherDescription(weather.current?.weather_code)
  const hi = Math.round(weather.daily?.temperature_2m_max?.[0])
  const lo = Math.round(weather.daily?.temperature_2m_min?.[0])
  const days = weather.daily?.time || []

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-slate-500">Oakleaf Plantation, FL</p>
          <p className="text-3xl font-bold">
            {Math.round(weather.current?.temperature_2m)}°F
          </p>
          <p className="text-sm text-slate-600">
            {icon} {label}
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>
            H: {hi}° L: {lo}°
          </p>
          <p>Feels like {Math.round(weather.current?.apparent_temperature)}°</p>
          <p>Humidity {weather.current?.relative_humidity_2m}%</p>
          <p>Wind {Math.round(weather.current?.wind_speed_10m)} mph</p>
        </div>
      </div>

      {days.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-4 pt-4 border-t">
          {days.map((dateStr, i) => {
            const dayIcon = weatherDescription(weather.daily.weather_code?.[i]).icon
            const dayHi = Math.round(weather.daily.temperature_2m_max?.[i])
            const dayLo = Math.round(weather.daily.temperature_2m_min?.[i])
            return (
              <div key={dateStr} className="text-center">
                <p className="text-xs font-medium text-slate-500">{dayLabel(dateStr, i)}</p>
                <p className="text-xl leading-none my-1">{dayIcon}</p>
                <p className="text-xs text-slate-700">
                  {dayHi}° <span className="text-slate-400">{dayLo}°</span>
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const FAMILY_ALBUM_URL = 'https://photos.app.goo.gl/jRkx92CHNsQUEZUP9'

function PhotoWidget() {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📷</span>
          <div>
            <h2 className="text-lg font-semibold">Family Photos</h2>
            <p className="text-sm text-slate-500">
              Shared album — add photos anytime from the Google Photos app.
            </p>
          </div>
        </div>
        <a
          href={FAMILY_ALBUM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap"
        >
          View Slideshow
        </a>
      </div>
    </div>
  )
}

function HomeDashboard({ onNavigate }) {
  const tasks = useCollection('tasks')
  const chores = useCollection('chores')
  const shopping = useCollection('shopping')
  const events = useCollection('events')

  const today = todayStr()
  const weekAhead = addDaysStr(7)

  const withType = [
    ...tasks.map((t) => ({ ...t, type: 'Task', typeIcon: '✓' })),
    ...chores.map((c) => ({ ...c, type: 'Chore', typeIcon: '🧹' })),
    ...events.map((e) => ({ ...e, type: 'Event', typeIcon: '📅' })),
  ]

  const dueToday = withType.filter((i) => !i.done && i.dueDate === today)

  const upcoming = withType
    .filter((i) => !i.done && i.dueDate && i.dueDate > today && i.dueDate <= weekAhead)
    .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))

  const tasksDue = tasks.filter((t) => !t.done && t.dueDate).length
  const choresDue = chores.filter((c) => !c.done && c.dueDate).length
  const itemsToBuy = shopping.filter((s) => !s.done).length

  return (
    <div className="space-y-6">
      {dueToday.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4">
          <p className="font-semibold mb-2">
            ⚠️ Due Today: {dueToday.length} item{dueToday.length > 1 ? 's' : ''}
          </p>
          <ul className="space-y-1 text-sm">
            {dueToday.map((item) => (
              <li key={item.id}>
                {item.typeIcon} {item.text}{' '}
                <span className="text-red-500">({item.type})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <WeatherWidget />

      <PhotoWidget />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('tasks')}
          className="bg-white rounded-2xl shadow p-5 text-left hover:shadow-md transition"
        >
          <p className="text-sm text-slate-500">Tasks Due</p>
          <p className="text-3xl font-bold">{tasksDue}</p>
        </button>
        <button
          onClick={() => onNavigate('chores')}
          className="bg-white rounded-2xl shadow p-5 text-left hover:shadow-md transition"
        >
          <p className="text-sm text-slate-500">Chores Due</p>
          <p className="text-3xl font-bold">{choresDue}</p>
        </button>
        <button
          onClick={() => onNavigate('shopping')}
          className="bg-white rounded-2xl shadow p-5 text-left hover:shadow-md transition"
        >
          <p className="text-sm text-slate-500">Items to Buy</p>
          <p className="text-3xl font-bold">{itemsToBuy}</p>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h2 className="text-lg font-semibold mb-3">Upcoming This Week</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Nothing coming up this week.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between border-b last:border-b-0 pb-2 text-sm"
              >
                <span>
                  {item.typeIcon} {item.text}
                </span>
                <span className="text-slate-400">
                  {item.dueDate} · {item.type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Dashboard() {
  const user = auth.currentUser
  const [activeTab, setActiveTab] = useState('home')

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'tasks', label: 'Tasks', icon: '✓' },
    { id: 'chores', label: 'Chore Chart', icon: '🧹' },
    { id: 'shopping', label: 'Shopping', icon: '🛒' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'notes', label: 'Notes', icon: '📝' },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Riggs Family Dashboard</h1>
          <p className="text-sm text-slate-500">32065 - Oakleaf Plantation</p>
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

      <nav className="bg-white border-b px-6 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        {activeTab === 'home' && <HomeDashboard onNavigate={setActiveTab} />}
        {activeTab === 'tasks' && (
          <Section
            title="Tasks"
            icon="✓"
            name="tasks"
            placeholder="Add a task..."
            extraFields={['dueDate']}
          />
        )}
        {activeTab === 'chores' && (
          <Section
            title="Chore Chart"
            icon="🧹"
            name="chores"
            placeholder="Add a chore..."
            extraFields={['dueDate', 'assignee']}
          />
        )}
        {activeTab === 'shopping' && (
          <Section title="Shopping List" icon="🛒" name="shopping" placeholder="Add an item..." />
        )}
        {activeTab === 'calendar' && (
          <Section
            title="Calendar"
            icon="📅"
            name="events"
            placeholder="Add an event..."
            extraFields={['dueDate']}
          />
        )}
        {activeTab === 'notes' && (
          <Section
            title="Notes"
            icon="📝"
            name="notes"
            placeholder="Leave a note for the family..."
          />
        )}
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
