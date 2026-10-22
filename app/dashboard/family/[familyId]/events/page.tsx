'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc,
  doc, serverTimestamp, orderBy, query, onSnapshot, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import {
  ArrowLeft, Plus, X, Trash2, MessageCircle,
  Calendar, MapPin, Users, Clock, ChevronDown, ChevronUp, Send
} from 'lucide-react'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  description?: string
  event_type: string
  date: string
  time?: string
  location?: string
  created_by: string
  created_by_email: string
  going: string[]
  not_going: string[]
  createdAt?: any
}

interface Comment {
  id: string
  text: string
  created_by: string
  created_by_email: string
  created_by_name?: string
  createdAt?: any
}

const EVENT_TYPES = [
  { value: 'reunion', label: '🏡 Family Reunion', color: '#4a7c59', bg: 'rgba(74,124,89,0.1)' },
  { value: 'birthday', label: '🎂 Birthday', color: '#e07b39', bg: 'rgba(224,123,57,0.1)' },
  { value: 'anniversary', label: '💍 Anniversary', color: '#c9a227', bg: 'rgba(201,162,39,0.1)' },
  { value: 'gathering', label: '🍽️ Gathering', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { value: 'memorial', label: '🕊️ Memorial', color: '#6b5a47', bg: 'rgba(107,90,71,0.1)' },
  { value: 'custom', label: '📅 Custom Event', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
]

function getEventType(value: string) {
  return EVENT_TYPES.find(t => t.value === value) || EVENT_TYPES[5]
}

function getCountdown(dateStr: string, timeStr?: string) {
  const eventDate = new Date(`${dateStr}${timeStr ? 'T' + timeStr : 'T00:00:00'}`)
  const now = new Date()
  const diff = eventDate.getTime() - now.getTime()
  if (diff < 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function timeAgo(ts: any) {
  if (!ts) return 'just now'
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getInitials(email: string, name?: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

// ── Comment Section ────────────────────────────────────────────────
function CommentSection({ familyId, eventId, currentUser }: { familyId: string; eventId: string; currentUser: any }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'families', familyId, 'events', eventId, 'comments'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, snap => {
      const c: Comment[] = []
      snap.forEach(d => c.push({ id: d.id, ...d.data() } as Comment))
      setComments(c)
    })
    return () => unsub()
  }, [familyId, eventId])

  const handlePost = async () => {
    if (!text.trim() || posting) return
    setPosting(true)
    try {
      await addDoc(collection(db, 'families', familyId, 'events', eventId, 'comments'), {
        text: text.trim(),
        created_by: currentUser.uid,
        created_by_email: currentUser.email,
        created_by_name: currentUser.displayName || null,
        createdAt: serverTimestamp(),
      })
      setText('')
    } catch (err) { console.error(err) }
    setPosting(false)
  }

  const colors = ['#4a7c59', '#c9a227', '#8b5cf6', '#3b82f6', '#ef4444', '#e07b39']

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid rgba(139,105,20,0.1)', paddingTop: 14 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#8B6914', marginBottom: 10, fontFamily: 'system-ui,sans-serif' }}>
        💬 {comments.length} comment{comments.length !== 1 ? 's' : ''}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        {comments.map(c => {
          const color = colors[c.created_by_email.charCodeAt(0) % colors.length]
          return (
            <div key={c.id} style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,${color},${color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                {getInitials(c.created_by_email, c.created_by_name)}
              </div>
              <div style={{ flex: 1, background: 'rgba(139,105,20,0.05)', borderRadius: 10, padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2c1810', fontFamily: 'system-ui,sans-serif' }}>{c.created_by_name || c.created_by_email.split('@')[0]}</span>
                  <span style={{ fontSize: 11, color: '#a08060', fontFamily: 'system-ui,sans-serif' }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={{ fontSize: 13, color: '#2c1810', margin: 0, fontFamily: 'Georgia,serif', lineHeight: 1.5 }}>{c.text}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handlePost()}
          placeholder="Add a comment..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid rgba(139,105,20,0.25)', background: 'rgba(255,255,255,0.7)', fontSize: 13, color: '#2c1810', outline: 'none', fontFamily: 'system-ui,sans-serif' }}
        />
        <button onClick={handlePost} disabled={!text.trim() || posting} style={{ padding: '8px 14px', borderRadius: 20, border: 'none', background: !text.trim() ? 'rgba(74,124,89,0.3)' : 'linear-gradient(135deg,#4a7c59,#2d5a3d)', color: 'white', cursor: !text.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
          <Send size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Event Card ─────────────────────────────────────────────────────
function EventCard({ event, currentUser, familyId, onDelete }: { event: Event; currentUser: any; familyId: string; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const eventType = getEventType(event.event_type)
  const countdown = getCountdown(event.date, event.time)
  const isPast = !countdown
  const isGoing = event.going?.includes(currentUser?.uid)
  const isNotGoing = event.not_going?.includes(currentUser?.uid)
  const isOwn = event.created_by === currentUser?.uid

  const handleRSVP = async (going: boolean) => {
    const ref = doc(db, 'families', familyId, 'events', event.id)
    if (going) {
      await updateDoc(ref, {
        going: isGoing ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
        not_going: arrayRemove(currentUser.uid)
      })
    } else {
      await updateDoc(ref, {
        not_going: isNotGoing ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
        going: arrayRemove(currentUser.uid)
      })
    }
  }

  return (
    <div style={{ borderRadius: 18, border: `1px solid ${eventType.color}30`, background: 'rgba(253,246,227,0.95)', boxShadow: '0 2px 16px rgba(44,24,16,0.06)', overflow: 'hidden', opacity: isPast ? 0.75 : 1 }}>
      {/* Left color bar */}
      <div style={{ display: 'flex' }}>
        <div style={{ width: 4, background: eventType.color, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '16px 18px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: eventType.color, background: eventType.bg, borderRadius: 20, padding: '2px 10px', fontFamily: 'system-ui,sans-serif' }}>{eventType.label}</span>
                {isPast && <span style={{ fontSize: 11, color: '#a08060', background: 'rgba(107,90,71,0.08)', borderRadius: 20, padding: '2px 8px', fontFamily: 'system-ui,sans-serif' }}>Past event</span>}
                {!isPast && countdown && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderRadius: 20, padding: '2px 10px', fontFamily: 'system-ui,sans-serif' }}>⏱ {countdown}</span>
                )}
              </div>
              <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, color: '#2c1810', margin: 0, marginBottom: 8 }}>{event.title}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b5a47', fontFamily: 'system-ui,sans-serif' }}>
                  <Calendar size={12} style={{ color: eventType.color }} />
                  {formatDate(event.date)}{event.time && ` at ${event.time}`}
                </div>
                {event.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b5a47', fontFamily: 'system-ui,sans-serif' }}>
                    <MapPin size={12} style={{ color: eventType.color }} />
                    {event.location}
                  </div>
                )}
                {event.description && (
                  <p style={{ fontSize: 13, color: '#4a3728', fontFamily: 'Georgia,serif', margin: '4px 0 0', lineHeight: 1.5 }}>{event.description}</p>
                )}
              </div>
            </div>
            {isOwn && (
              <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0a080', padding: 4, flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#c0a080'}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* RSVP */}
          {!isPast && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <button onClick={() => handleRSVP(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 20, border: `1px solid ${isGoing ? '#4a7c59' : 'rgba(74,124,89,0.3)'}`, background: isGoing ? 'rgba(74,124,89,0.12)' : 'transparent', color: isGoing ? '#4a7c59' : '#6b5a47', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui,sans-serif', transition: 'all 0.15s' }}>
                ✅ Going {event.going?.length > 0 && `(${event.going.length})`}
              </button>
              <button onClick={() => handleRSVP(false)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 20, border: `1px solid ${isNotGoing ? '#ef4444' : 'rgba(239,68,68,0.2)'}`, background: isNotGoing ? 'rgba(239,68,68,0.08)' : 'transparent', color: isNotGoing ? '#ef4444' : '#6b5a47', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui,sans-serif', transition: 'all 0.15s' }}>
                ❌ Can't go {event.not_going?.length > 0 && `(${event.not_going.length})`}
              </button>
              <button onClick={() => setExpanded(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#8B6914', fontSize: 12, fontFamily: 'system-ui,sans-serif', padding: 0 }}>
                <MessageCircle size={13} />Comments {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          )}

          {isPast && (
            <button onClick={() => setExpanded(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#8B6914', fontSize: 12, fontFamily: 'system-ui,sans-serif', padding: 0, marginBottom: 8 }}>
              <MessageCircle size={13} />Comments {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}

          {expanded && <CommentSection familyId={familyId} eventId={event.id} currentUser={currentUser} />}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
export default function EventsPage() {
  const params = useParams()
  const router = useRouter()
  const familyId = params.familyId as string

  const [events, setEvents] = useState<Event[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', event_type: 'reunion',
    date: '', time: '', location: ''
  })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/auth/login'); return }
      setCurrentUser(user)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'families', familyId, 'events'), orderBy('date', 'asc'))
    const unsub = onSnapshot(q, snap => {
      const evs: Event[] = []
      snap.forEach(d => evs.push({ id: d.id, ...d.data() } as Event))
      setEvents(evs)
    })
    return () => unsub()
  }, [familyId])

  const handleAdd = async () => {
    if (!form.title.trim() || !form.date) return
    setUploading(true)
    try {
      await addDoc(collection(db, 'families', familyId, 'events'), {
        ...form,
        going: [],
        not_going: [],
        created_by: currentUser.uid,
        created_by_email: currentUser.email,
        createdAt: serverTimestamp(),
      })
      setForm({ title: '', description: '', event_type: 'reunion', date: '', time: '', location: '' })
      setShowAdd(false)
    } catch (err) { console.error(err) }
    setUploading(false)
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Delete this event?')) return
    await deleteDoc(doc(db, 'families', familyId, 'events', eventId))
  }

  const now = new Date().toISOString().split('T')[0]
  const upcoming = events.filter(e => e.date >= now && (!filterType || e.event_type === filterType))
  const past = events.filter(e => e.date < now && (!filterType || e.event_type === filterType))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fdf6e3' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
        <p style={{ color: '#6b5a47', fontFamily: 'Georgia,serif' }}>Loading events...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#fdf6e3 0%,#f0e8d0 100%)', fontFamily: 'system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'rgba(253,246,227,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(139,105,20,0.12)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14, height: 56 }}>
          <Link href={`/dashboard/family/${familyId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b5a47', textDecoration: 'none', fontSize: 13 }}>
            <ArrowLeft size={16} />Back
          </Link>
          <div style={{ width: 1, height: 20, background: 'rgba(139,105,20,0.2)' }} />
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 700, color: '#2c1810', margin: 0 }}>📅 Events & Reunions</h1>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg,#4a7c59,#2d5a3d)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} />New Event
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>

        {/* Type filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterType(null)} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${!filterType ? '#4a7c59' : 'rgba(74,124,89,0.3)'}`, background: !filterType ? 'rgba(74,124,89,0.12)' : 'rgba(255,255,255,0.6)', color: !filterType ? '#4a7c59' : '#6b5a47', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>All</button>
          {EVENT_TYPES.map(t => (
            <button key={t.value} onClick={() => setFilterType(filterType === t.value ? null : t.value)} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${filterType === t.value ? t.color : 'rgba(139,105,20,0.2)'}`, background: filterType === t.value ? t.bg : 'rgba(255,255,255,0.6)', color: filterType === t.value ? t.color : '#6b5a47', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t.label}</button>
          ))}
        </div>

        {/* Upcoming */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: '#2c1810', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            🗓 Upcoming <span style={{ fontSize: 12, color: '#8B6914', fontFamily: 'system-ui,sans-serif', fontWeight: 400 }}>({upcoming.length})</span>
          </h2>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 16, border: '1px dashed rgba(139,105,20,0.2)', background: 'rgba(253,246,227,0.5)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🌿</div>
              <p style={{ color: '#6b5a47', fontSize: 14 }}>No upcoming events — add one!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcoming.map(e => <EventCard key={e.id} event={e} currentUser={currentUser} familyId={familyId} onDelete={() => handleDelete(e.id)} />)}
            </div>
          )}
        </div>

        {/* Past events */}
        {past.length > 0 && (
          <div>
            <button onClick={() => setShowPast(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, color: '#6b5a47', padding: 0, marginBottom: 14 }}>
              🕰 Past Events ({past.length}) {showPast ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showPast && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {past.reverse().map(e => <EventCard key={e.id} event={e} currentUser={currentUser} familyId={familyId} onDelete={() => handleDelete(e.id)} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowAdd(false)}>
          <div style={{ background: '#fdf6e3', borderRadius: 22, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(139,105,20,0.2)', boxShadow: '0 24px 64px rgba(44,24,16,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 19, fontWeight: 700, color: '#2c1810', margin: 0 }}>📅 New Event</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b5a47' }}><X size={20} /></button>
            </div>

            {/* Event type selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {EVENT_TYPES.map(t => (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, event_type: t.value }))} style={{ padding: '8px 4px', borderRadius: 10, border: `2px solid ${form.event_type === t.value ? t.color : 'transparent'}`, background: form.event_type === t.value ? t.bg : 'rgba(255,255,255,0.5)', color: form.event_type === t.value ? t.color : '#6b5a47', fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title *" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: '#2c1810', outline: 'none' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#8B6914', fontWeight: 600, display: 'block', marginBottom: 4 }}>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: '#2c1810', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#8B6914', fontWeight: 600, display: 'block', marginBottom: 4 }}>Time</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: '#2c1810', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location (optional)" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: '#2c1810', outline: 'none' }} />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" rows={3} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: '#2c1810', outline: 'none', resize: 'none', fontFamily: 'Georgia,serif' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'transparent', color: '#6b5a47', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleAdd} disabled={uploading || !form.title.trim() || !form.date} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: !form.title.trim() || !form.date ? 'rgba(74,124,89,0.3)' : 'linear-gradient(135deg,#4a7c59,#2d5a3d)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {uploading ? '⏳ Saving...' : '📅 Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}