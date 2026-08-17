import React, { useEffect, useRef, useState } from 'react'
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
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, googleProvider, db, storage } from './firebase'

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

const FAMILY_MEMBERS = [
  { name: 'William', badge: 'bg-blue-100 text-blue-700' },
  { name: 'Jessica', badge: 'bg-pink-100 text-pink-700' },
  { name: 'Lucas', badge: 'bg-emerald-100 text-emerald-700' },
]

function assigneeBadgeClass(name) {
  const match = FAMILY_MEMBERS.find((m) => m.name === name)
  return match ? match.badge : 'bg-slate-100 text-slate-600'
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
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-32 bg-white text-slate-700"
          >
            <option value="">Assign to…</option>
            {FAMILY_MEMBERS.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
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
                <span
                  className={`text-xs ml-2 px-2 py-0.5 rounded-full font-medium ${assigneeBadgeClass(
                    item.assignee
                  )}`}
                >
                  {item.assignee}
                </span>
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

const CATEGORY_STYLES = {
  School: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  Family: { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
}

// Events created before the category field existed are all from Lucas's
// school calendar import, so they fall back to "School" rather than "Family".
function eventCategory(item) {
  return item.category === 'Family' ? 'Family' : 'School'
}

function toDateStr(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function monthMatrix(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    cells.push({ dateStr: toDateStr(new Date(year, month - 1, day)), day, inMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ dateStr: toDateStr(new Date(year, month, day)), day, inMonth: true })
  }
  let nextDay = 1
  while (cells.length < 42) {
    cells.push({ dateStr: toDateStr(new Date(year, month + 1, nextDay)), day: nextDay, inMonth: false })
    nextDay += 1
  }
  return cells
}

function CalendarView() {
  const events = useCollection('events')
  const today = todayStr()
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selectedDate, setSelectedDate] = useState(today)
  const [text, setText] = useState('')
  const [category, setCategory] = useState('Family')

  const cells = monthMatrix(cursor.year, cursor.month)
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const eventsByDate = {}
  events.forEach((ev) => {
    if (!ev.dueDate) return
    if (!eventsByDate[ev.dueDate]) eventsByDate[ev.dueDate] = []
    eventsByDate[ev.dueDate].push(ev)
  })

  const goPrev = () =>
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))
  const goNext = () =>
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))
  const goToday = () => {
    setCursor({ year: now.getFullYear(), month: now.getMonth() })
    setSelectedDate(today)
  }

  const addEvent = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const payload = {
      text: text.trim(),
      done: false,
      dueDate: selectedDate,
      category,
      createdBy: auth.currentUser?.displayName || 'Someone',
      createdAt: serverTimestamp(),
    }
    setText('')
    try {
      await addDoc(collection(db, 'events'), payload)
    } catch (err) {
      console.error('Failed to add event', err)
      setText(payload.text)
      alert('Could not save that — check your connection and try again.')
    }
  }

  const removeEvent = async (item) => {
    await deleteDoc(doc(db, 'events', item.id))
  }

  const selectedEvents = (eventsByDate[selectedDate] || []).slice().sort((a, b) => (a.text > b.text ? 1 : -1))

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>📅</span> Calendar
        </h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> School
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Family
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goPrev}
          className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200"
        >
          ← Prev
        </button>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-800">{monthLabel}</p>
          <button
            onClick={goToday}
            className="text-xs px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
          >
            Today
          </button>
        </div>
        <button
          onClick={goNext}
          className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const dayEvents = eventsByDate[cell.dateStr] || []
          const isToday = cell.dateStr === today
          const isSelected = cell.dateStr === selectedDate
          return (
            <button
              key={cell.dateStr}
              onClick={() => setSelectedDate(cell.dateStr)}
              className={`aspect-square rounded-lg p-1 text-left flex flex-col items-start justify-start border transition ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : isToday
                  ? 'border-blue-300 bg-white'
                  : 'border-transparent bg-slate-50 hover:bg-slate-100'
              } ${cell.inMonth ? '' : 'opacity-40'}`}
            >
              <span className={`text-xs ${isToday ? 'font-bold text-blue-600' : 'text-slate-600'}`}>
                {cell.day}
              </span>
              <div className="flex flex-wrap gap-0.5 mt-1">
                {dayEvents.slice(0, 3).map((ev) => (
                  <span
                    key={ev.id}
                    className={`w-1.5 h-1.5 rounded-full ${CATEGORY_STYLES[eventCategory(ev)].dot}`}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[9px] text-slate-400">+{dayEvents.length - 3}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-5 pt-4 border-t">
        <p className="text-sm font-semibold text-slate-700 mb-2">
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        {selectedEvents.length === 0 ? (
          <p className="text-sm text-slate-400 italic mb-3">No events this day.</p>
        ) : (
          <ul className="space-y-1 mb-3">
            {selectedEvents.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      CATEGORY_STYLES[eventCategory(ev)].badge
                    }`}
                  >
                    {eventCategory(ev)}
                  </span>
                  {ev.text}
                </span>
                <button
                  onClick={() => removeEvent(ev)}
                  className="text-slate-400 hover:text-red-500"
                  title="Delete"
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addEvent} className="flex flex-wrap gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add an event..."
            className="flex-1 min-w-[140px] border rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white text-slate-700"
          >
            <option value="Family">Family</option>
            <option value="School">School</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Add
          </button>
        </form>
      </div>
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

function PhotoSlideshow() {
  const photos = useCollection('photos')
  const [index, setIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (photos.length < 2) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [photos.length])

  useEffect(() => {
    if (index >= photos.length) setIndex(0)
  }, [photos.length, index])

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        const path = `photos/${Date.now()}_${file.name}`
        const ref = storageRef(storage, path)
        await uploadBytes(ref, file)
        const url = await getDownloadURL(ref)
        await addDoc(collection(db, 'photos'), {
          url,
          path,
          uploadedBy: auth.currentUser?.displayName || 'Someone',
          createdAt: serverTimestamp(),
        })
      }
    } catch (err) {
      console.error('Photo upload failed', err)
      alert('Could not upload one or more photos — check your connection and try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>📷</span> Family Photos
        </h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 whitespace-nowrap"
          >
            {uploading ? 'Uploading…' : '+ Add Photos'}
          </button>
        </div>
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-slate-400 italic py-10 text-center">
          No photos yet — tap "+ Add Photos" to get the slideshow started.
        </p>
      ) : (
        <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden bg-slate-100">
          {photos.map((p, i) => (
            <img
              key={p.id}
              src={p.url}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function timeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function GameTimeTimer() {
  const [minutes, setMinutes] = useState(30)
  const [secondsLeft, setSecondsLeft] = useState(null) // null = idle, not started
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!running) return
    if (secondsLeft <= 0) {
      setRunning(false)
      setFinished(true)
      return
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [running, secondsLeft])

  const start = () => {
    setFinished(false)
    setSecondsLeft(minutes * 60)
    setRunning(true)
  }
  const pause = () => setRunning(false)
  const resume = () => secondsLeft > 0 && setRunning(true)
  const reset = () => {
    setRunning(false)
    setFinished(false)
    setSecondsLeft(null)
  }

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span>🎮</span> Game Time
      </h2>

      {finished ? (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-lg font-semibold text-amber-600">⏰ Time's up!</p>
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Start New Timer
          </button>
        </div>
      ) : secondsLeft === null ? (
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-slate-600">Minutes:</label>
          <input
            type="number"
            min="1"
            max="180"
            value={minutes}
            onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
            className="border rounded-lg px-3 py-2 text-sm w-20"
          />
          <button
            onClick={start}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Start
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-3xl font-bold tabular-nums">{formatClock(secondsLeft)}</p>
          {running ? (
            <button
              onClick={pause}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={resume}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Resume
            </button>
          )}
          <button
            onClick={reset}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg"
          >
            Reset
          </button>
        </div>
      )}
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

  const firstName = (auth.currentUser?.displayName || '').split(' ')[0] || 'there'
  const myChoresToday = chores.filter(
    (c) => !c.done && c.dueDate === today && c.assignee === firstName
  ).length
  let greetingSubtext = "Nothing urgent today — enjoy it."
  if (myChoresToday > 0) {
    greetingSubtext = `You've got ${myChoresToday} chore${
      myChoresToday > 1 ? 's' : ''
    } on the list today.`
  } else if (dueToday.length > 0) {
    greetingSubtext = `${dueToday.length} item${
      dueToday.length > 1 ? 's are' : ' is'
    } due today for the family.`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {timeGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{greetingSubtext}</p>
      </div>

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

      <PhotoSlideshow />

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

      <GameTimeTimer />

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
        {activeTab === 'calendar' && <CalendarView />}
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
