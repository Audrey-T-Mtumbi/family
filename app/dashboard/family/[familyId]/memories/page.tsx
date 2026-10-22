'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db, storage } from '@/lib/firebase'
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  serverTimestamp, orderBy, query
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import {
  ArrowLeft, Plus, Image, Video, Mic, BookOpen, X,
  Play, Upload, Search, Trash2, Calendar, User,
  Camera, Radio, Train
} from 'lucide-react'
import Link from 'next/link'

interface Memory {
  id: string
  title: string
  description?: string
  media_url?: string
  media_type: 'photo' | 'video' | 'audio' | 'story' | 'memory_train'
  linked_member_id?: string
  created_by?: string
  created_by_email?: string
  memory_date?: string
  createdAt?: any
}

interface Member {
  id: string
  first_name: string
  last_name: string | null
  avatar_url: string | null
}

const TYPE_META: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  photo:        { icon: Image,    color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)',  label: 'Photo' },
  video:        { icon: Video,    color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   label: 'Video' },
  audio:        { icon: Mic,      color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.25)',  label: 'Audio' },
  story:        { icon: Camera,   color: '#e07b39', bg: 'rgba(224,123,57,0.08)', border: 'rgba(224,123,57,0.25)', label: 'Live Story' },
  memory_train: { icon: Train,    color: '#4a7c59', bg: 'rgba(74,124,89,0.08)',  border: 'rgba(74,124,89,0.25)',  label: 'Memory Train' },
}

function Avatar({ member, size = 32 }: { member: Member; size?: number }) {
  const initials = (member.first_name[0] + (member.last_name?.[0] || '')).toUpperCase()
  return member.avatar_url
    ? <img src={member.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#4a7c59,#2d5a3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, color: 'white', fontWeight: 700, flexShrink: 0 }}>{initials}</div>
}

function yearsAgo(dateStr?: string) {
  if (!dateStr) return null
  const diff = new Date().getFullYear() - new Date(dateStr).getFullYear()
  if (diff === 0) return 'This year'
  if (diff === 1) return '1 year ago'
  return `${diff} years ago`
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  try { return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return dateStr }
}

// ── Live Record Modal ──────────────────────────────────────────────
function LiveRecordModal({ familyId, members, currentUser, onSave, onClose }: {
  familyId: string; members: Member[]; currentUser: any
  onSave: (m: Memory) => void; onClose: () => void
}) {
  const [mode, setMode] = useState<'choose' | 'camera' | 'mic'>('choose')
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [linkedMember, setLinkedMember] = useState('')
  const [memoryDate, setMemoryDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [timer, setTimer] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  const stopStream = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null }

  const startCamera = async () => {
    setMode('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch { alert('Camera access denied') }
  }

  const startMic = async () => {
    setMode('mic')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
    } catch { alert('Microphone access denied') }
  }

  const startRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    const mr = new MediaRecorder(streamRef.current)
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mode === 'camera' ? 'video/webm' : 'audio/webm' })
      setRecorded(blob); setRecordedUrl(URL.createObjectURL(blob)); stopStream()
    }
    mr.start(); mediaRecorderRef.current = mr
    setRecording(true); setTimer(0)
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
  }

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); clearInterval(timerRef.current) }

  const retake = () => {
    setRecorded(null); setRecordedUrl(null); setTimer(0)
    mode === 'camera' ? startCamera() : startMic()
  }

  const handleSave = async () => {
    if (!recorded || !title.trim()) return
    setUploading(true)
    try {
      const sRef = ref(storage, `memories/${familyId}/${Date.now()}-live.webm`)
      await uploadBytes(sRef, recorded)
      const mediaUrl = await getDownloadURL(sRef)
      const payload: any = {
        title, media_type: mode === 'camera' ? 'story' : 'audio',
        media_url: mediaUrl, linked_member_id: linkedMember || null,
        memory_date: memoryDate || null, created_by: currentUser?.uid,
        created_by_email: currentUser?.email, createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(collection(db, 'families', familyId, 'memories'), payload)
      onSave({ id: docRef.id, ...payload }); onClose()
    } catch (err) { console.error(err) }
    setUploading(false)
  }

  useEffect(() => () => { stopStream(); clearInterval(timerRef.current) }, [])
  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#0f0f1a', borderRadius: 22, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#e07b39' }} />
            <span style={{ color: 'white', fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700 }}>🎙️ Live Story</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {mode === 'choose' && (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'system-ui,sans-serif', textAlign: 'center', margin: '0 0 8px' }}>How do you want to record your story?</p>
            <button onClick={startCamera} style={{ width: '100%', padding: '18px', borderRadius: 16, border: '1px solid rgba(224,123,57,0.35)', background: 'rgba(224,123,57,0.08)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'system-ui,sans-serif', textAlign: 'left' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(224,123,57,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Camera size={24} style={{ color: '#e07b39' }} /></div>
              <div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>📹 Camera</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Record a video message to the family</div></div>
            </button>
            <button onClick={startMic} style={{ width: '100%', padding: '18px', borderRadius: 16, border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.08)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'system-ui,sans-serif', textAlign: 'left' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Mic size={24} style={{ color: '#8b5cf6' }} /></div>
              <div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>🎤 Voice Only</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Record a voice message or audio story</div></div>
            </button>
          </div>
        )}

        {mode === 'camera' && !recordedUrl && (
          <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {recording && (
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.65)', borderRadius: 20, padding: '4px 12px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ color: 'white', fontSize: 13, fontFamily: 'monospace' }}>{fmt(timer)}</span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <button onClick={recording ? stopRecording : startRecording} style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid white', background: recording ? '#ef4444' : 'rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                {recording ? <div style={{ width: 20, height: 20, borderRadius: 3, background: 'white' }} /> : <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#ef4444' }} />}
              </button>
            </div>
          </div>
        )}

        {mode === 'camera' && recordedUrl && (
          <video src={recordedUrl} controls style={{ width: '100%', display: 'block', background: '#000', maxHeight: 280 }} />
        )}

        {mode === 'mic' && (
          <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {!recordedUrl ? (
              <>
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: recording ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.07)', border: `2px solid ${recording ? '#8b5cf6' : 'rgba(139,92,246,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic size={38} style={{ color: '#8b5cf6' }} />
                </div>
                {recording && <span style={{ color: 'white', fontSize: 22, fontFamily: 'monospace' }}>{fmt(timer)}</span>}
                {!recording && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'system-ui,sans-serif', margin: 0 }}>Tap to start recording</p>}
                <button onClick={recording ? stopRecording : startRecording} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: recording ? '#ef4444' : '#8b5cf6', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>
                  {recording ? '⏹ Stop' : '⏺ Start Recording'}
                </button>
              </>
            ) : (
              <audio src={recordedUrl} controls style={{ width: '100%' }} />
            )}
          </div>
        )}

        {recordedUrl && (
          <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Give this story a title *" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: 'white', fontSize: 14, outline: 'none', fontFamily: 'system-ui,sans-serif' }} />
            <input type="date" value={memoryDate} onChange={e => setMemoryDate(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: memoryDate ? 'white' : 'rgba(255,255,255,0.35)', fontSize: 14, outline: 'none', fontFamily: 'system-ui,sans-serif' }} />
            <select value={linkedMember} onChange={e => setLinkedMember(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(20,20,40,0.95)', color: 'white', fontSize: 14, outline: 'none', fontFamily: 'system-ui,sans-serif' }}>
              <option value="">Link to family member (optional)</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name || ''}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={retake} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>↩ Retake</button>
              <button onClick={handleSave} disabled={uploading || !title.trim()} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: !title.trim() ? 'rgba(224,123,57,0.3)' : '#e07b39', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>
                {uploading ? '⏳ Saving...' : '💾 Save Story'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Memory Train Builder ───────────────────────────────────────────
function MemoryTrainModal({ familyId, members, currentUser, onSave, onClose }: {
  familyId: string; members: Member[]; currentUser: any
  onSave: (m: Memory) => void; onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [linkedMember, setLinkedMember] = useState('')
  const [entries, setEntries] = useState<{ date: string; file: File | null; preview: string | null; caption: string }[]>([
    { date: '', file: null, preview: null, caption: '' }
  ])
  const [uploading, setUploading] = useState(false)

  const addEntry = () => setEntries(e => [...e, { date: '', file: null, preview: null, caption: '' }])
  const removeEntry = (i: number) => setEntries(e => e.filter((_, idx) => idx !== i))
  const updateEntry = (i: number, key: string, val: any) => setEntries(e => e.map((en, idx) => idx === i ? { ...en, [key]: val } : en))
  const handleFile = (i: number, f: File | null) => { updateEntry(i, 'file', f); updateEntry(i, 'preview', f ? URL.createObjectURL(f) : null) }

  const handleSave = async () => {
    const valid = entries.filter(e => e.file && e.date)
    if (!title.trim() || valid.length === 0) return
    setUploading(true)
    try {
      const uploaded = await Promise.all(valid.map(async e => {
        const sRef = ref(storage, `memories/${familyId}/${Date.now()}-${e.file!.name}`)
        await uploadBytes(sRef, e.file!)
        return { url: await getDownloadURL(sRef), date: e.date, caption: e.caption }
      }))
      const payload: any = {
        title, media_type: 'memory_train',
        description: JSON.stringify(uploaded),
        linked_member_id: linkedMember || null,
        memory_date: valid[0].date,
        created_by: currentUser?.uid, created_by_email: currentUser?.email,
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(collection(db, 'families', familyId, 'memories'), payload)
      onSave({ id: docRef.id, ...payload }); onClose()
    } catch (err) { console.error(err) }
    setUploading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fdf6e3', borderRadius: 22, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(44,24,16,0.3)', border: '1px solid rgba(74,124,89,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(74,124,89,0.12)' }}>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 19, fontWeight: 700, color: '#2c1810', margin: 0 }}>🚂 Memory Train</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b5a47' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#6b5a47', fontFamily: 'system-ui,sans-serif', margin: 0 }}>Link photos with dates to create a scrollable photo timeline</p>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Train title * e.g. Growing Up" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: '#2c1810', outline: 'none', fontFamily: 'system-ui,sans-serif' }} />
          <select value={linkedMember} onChange={e => setLinkedMember(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: '#2c1810', outline: 'none', fontFamily: 'system-ui,sans-serif' }}>
            <option value="">Link to family member (optional)</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name || ''}</option>)}
          </select>
          {entries.map((entry, i) => (
            <div key={i} style={{ borderRadius: 14, border: '1px solid rgba(74,124,89,0.18)', background: 'rgba(255,255,255,0.5)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#4a7c59', fontFamily: 'system-ui,sans-serif' }}>📍 Stop {i + 1}</span>
                {entries.length > 1 && <button onClick={() => removeEntry(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }}><X size={14} /></button>}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {entry.preview
                  ? <img src={entry.preview} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  : <label style={{ width: 80, height: 80, borderRadius: 10, border: '2px dashed rgba(74,124,89,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(74,124,89,0.04)', flexShrink: 0 }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(i, e.target.files?.[0] || null)} />
                      <Upload size={20} style={{ color: '#4a7c59', opacity: 0.45 }} />
                    </label>
                }
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="date" value={entry.date} onChange={e => updateEntry(i, 'date', e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(139,105,20,0.25)', background: 'rgba(255,255,255,0.7)', fontSize: 13, color: '#2c1810', outline: 'none', fontFamily: 'system-ui,sans-serif' }} />
                  <input value={entry.caption} onChange={e => updateEntry(i, 'caption', e.target.value)} placeholder="Caption (optional)" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(139,105,20,0.25)', background: 'rgba(255,255,255,0.7)', fontSize: 13, color: '#2c1810', outline: 'none', fontFamily: 'system-ui,sans-serif' }} />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addEntry} style={{ padding: '10px', borderRadius: 10, border: '1px dashed rgba(74,124,89,0.35)', background: 'rgba(74,124,89,0.04)', color: '#4a7c59', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>+ Add another stop</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'transparent', color: '#6b5a47', fontSize: 13, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>Cancel</button>
            <button onClick={handleSave} disabled={uploading || !title.trim()} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: !title.trim() ? 'rgba(74,124,89,0.3)' : 'linear-gradient(135deg,#4a7c59,#2d5a3d)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>
              {uploading ? '⏳ Building...' : '🚂 Save Memory Train'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Memory Train Viewer ────────────────────────────────────────────
function MemoryTrainViewer({ memory }: { memory: Memory }) {
  const [idx, setIdx] = useState(0)
  let stops: { url: string; date: string; caption: string }[] = []
  try { stops = JSON.parse(memory.description || '[]').sort((a: any, b: any) => a.date.localeCompare(b.date)) } catch {}
  if (!stops.length) return <p style={{ color: '#6b5a47', fontFamily: 'system-ui,sans-serif', fontSize: 13 }}>No photos.</p>
  const cur = stops[idx]
  return (
    <div>
      {/* Horizontal scrolling track */}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 'max-content', padding: '8px 4px', gap: 0 }}>
          {stops.map((s, i) => {
            const active = i === idx
            const yr = new Date(s.date).getFullYear()
            const ago = yearsAgo(s.date)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div onClick={() => setIdx(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: active ? '#4a7c59' : '#a08060', fontFamily: 'system-ui,sans-serif', background: active ? 'rgba(74,124,89,0.12)' : 'transparent', borderRadius: 20, padding: '2px 8px', border: active ? '1px solid rgba(74,124,89,0.3)' : '1px solid transparent' }}>{ago}</span>
                  <div style={{ width: active ? 72 : 54, height: active ? 72 : 54, borderRadius: 12, overflow: 'hidden', border: `3px solid ${active ? '#4a7c59' : 'rgba(139,105,20,0.2)'}`, transition: 'all 0.2s', flexShrink: 0 }}>
                    <img src={s.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: 10, color: active ? '#2c1810' : '#8B6914', fontFamily: 'system-ui,sans-serif', fontWeight: active ? 700 : 400 }}>{yr}</span>
                </div>
                {i < stops.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: 18 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c9a227', margin: '0 2px' }} />
                    <div style={{ width: 28, height: 3, background: 'linear-gradient(90deg,#c9a227,#8B6914)', borderRadius: 2 }} />
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#8B6914', margin: '0 2px' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {/* Active photo */}
      <div style={{ marginTop: 10, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(74,124,89,0.2)' }}>
        <img src={cur.url} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }} />
        <div style={{ padding: '12px 16px', background: 'rgba(74,124,89,0.05)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#4a7c59', fontWeight: 700, fontFamily: 'system-ui,sans-serif' }}>{formatDate(cur.date)}</span>
            <span style={{ fontSize: 11, color: '#8B6914', background: 'rgba(139,105,20,0.1)', borderRadius: 20, padding: '2px 8px', fontFamily: 'system-ui,sans-serif' }}>{yearsAgo(cur.date)}</span>
          </div>
          {cur.caption && <p style={{ fontSize: 13, color: '#4a3728', fontFamily: 'Georgia,serif', fontStyle: 'italic', margin: 0 }}>{cur.caption}</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(74,124,89,0.3)', background: 'transparent', color: idx === 0 ? 'rgba(74,124,89,0.25)' : '#4a7c59', cursor: idx === 0 ? 'default' : 'pointer', fontSize: 12, fontFamily: 'system-ui,sans-serif' }}>← Prev</button>
            <span style={{ fontSize: 11, color: '#8B6914', fontFamily: 'system-ui,sans-serif', alignSelf: 'center' }}>{idx + 1} / {stops.length}</span>
            <button onClick={() => setIdx(Math.min(stops.length - 1, idx + 1))} disabled={idx === stops.length - 1} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(74,124,89,0.3)', background: 'transparent', color: idx === stops.length - 1 ? 'rgba(74,124,89,0.25)' : '#4a7c59', cursor: idx === stops.length - 1 ? 'default' : 'pointer', fontSize: 12, fontFamily: 'system-ui,sans-serif' }}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────
export default function MemoryVaultPage() {
  const params = useParams()
  const router = useRouter()
  const familyId = params.familyId as string

  const [memories, setMemories] = useState<Memory[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showLiveRecord, setShowLiveRecord] = useState(false)
  const [showMemoryTrain, setShowMemoryTrain] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterMember, setFilterMember] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [form, setForm] = useState({ title: '', description: '', media_type: 'photo' as Memory['media_type'], linked_member_id: '', memory_date: '' })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/auth/login'); return }
      setCurrentUser(user)
      try {
        const [membersSnap, memoriesSnap] = await Promise.all([
          getDocs(collection(db, 'families', familyId, 'treeMembers')),
          getDocs(query(collection(db, 'families', familyId, 'memories'), orderBy('createdAt', 'desc')))
        ])
        const mems: Member[] = []
        membersSnap.forEach(d => mems.push({ id: d.id, ...d.data() } as Member))
        setMembers(mems)
        const mems2: Memory[] = []
        memoriesSnap.forEach(d => mems2.push({ id: d.id, ...d.data() } as Memory))
        setMemories(mems2)
      } catch (err) { console.error(err) }
      setLoading(false)
    })
    return () => unsub()
  }, [familyId])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    if (files.length === 1) {
      setFile(files[0])
      setPreview(files[0].type.startsWith('image/') ? URL.createObjectURL(files[0]) : null)
      return
    }
    // Multiple photos — save each separately
    setUploading(true)
    setShowAddModal(false)
    for (const f of files) {
      const mediaUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = document.createElement('img')
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const maxSize = 1200
            let w = img.width, h = img.height
            const ratio = Math.min(maxSize / w, maxSize / h, 1)
            w = Math.round(w * ratio); h = Math.round(h * ratio)
            canvas.width = w; canvas.height = h
            canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
            resolve(canvas.toDataURL('image/jpeg', 0.85))
          }
          img.src = e.target!.result as string
        }
        reader.readAsDataURL(f)
      })
      const payload: any = {
        title: form.title || f.name.replace(/\.[^/.]+$/, ''),
        description: form.description || '',
        media_type: 'photo', media_url: mediaUrl,
        linked_member_id: form.linked_member_id || null,
        memory_date: form.memory_date || null,
        created_by: currentUser?.uid, created_by_email: currentUser?.email,
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(collection(db, 'families', familyId, 'memories'), payload)
      setMemories(prev => [{ id: docRef.id, ...payload }, ...prev])
    }
    setForm({ title: '', description: '', media_type: 'photo', linked_member_id: '', memory_date: '' })
    setFile(null); setPreview(null)
    setUploading(false)
  }
const handleAddMemory = async () => {
    if (!form.title.trim()) return
    setUploading(true)
    try {
      let mediaUrl = ''
      if (file) {
        if (form.media_type === 'photo') {
          mediaUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              const img = document.createElement('img')
              img.onload = () => {
                const canvas = document.createElement('canvas')
              const maxSize = 1200
let w = img.width, h = img.height
const ratio = Math.min(maxSize / w, maxSize / h, 1)
w = Math.round(w * ratio)
h = Math.round(h * ratio)
canvas.width = w; canvas.height = h
canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
resolve(canvas.toDataURL('image/jpeg', 0.85))
              }
              img.src = e.target!.result as string
            }
            reader.readAsDataURL(file)
          })
        } else {
          mediaUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
        }
      }
      const payload: any = {
        title: form.title, description: form.description || '',
        media_type: form.media_type, media_url: mediaUrl || null,
        linked_member_id: form.linked_member_id || null,
        memory_date: form.memory_date || null,
        created_by: currentUser?.uid, created_by_email: currentUser?.email,
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(collection(db, 'families', familyId, 'memories'), payload)
      setMemories(prev => [{ id: docRef.id, ...payload }, ...prev])
      setForm({ title: '', description: '', media_type: 'photo', linked_member_id: '', memory_date: '' })
      setFile(null); setPreview(null); setShowAddModal(false)
    } catch (err) { console.error(err) }
    setUploading(false)
  }

  const handleDelete = async (memory: Memory) => {
    if (!confirm('Delete this memory?')) return
    setDeleting(memory.id)
    try {
      await deleteDoc(doc(db, 'families', familyId, 'memories', memory.id))
if (memory.media_url && memory.media_url.startsWith('https://')) { 
  try { await deleteObject(ref(storage, memory.media_url)) } catch {} 
}     setMemories(prev => [...prev.filter(m => m.id !== memory.id)])
setSelectedMemory(null)
    } catch (err) { console.error(err) }
    setDeleting(null)
  }

  const getMember = (id?: string | null) => members.find(m => m.id === id)

  const filtered = memories.filter(m => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || m.media_type === filterType
    const matchMember = !filterMember || m.linked_member_id === filterMember
    return matchSearch && matchType && matchMember
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg,#fdf6e3,#ede8d8)' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 12 }}>📸</div><p style={{ color: '#6b5a47', fontFamily: 'Georgia,serif' }}>Loading memories...</p></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#fdf6e3 0%,#f5efe0 50%,#ede8d8 100%)' }}>

      {/* ── Header ── */}
      <div style={{ background: 'rgba(253,246,227,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(139,105,20,0.15)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href={`/dashboard/family/${familyId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b5a47', textDecoration: 'none', fontSize: 13, fontFamily: 'system-ui,sans-serif' }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <div style={{ width: 1, height: 20, background: 'rgba(139,105,20,0.2)' }} />
          <div>
            <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 700, color: '#2c1810', margin: 0 }}>📚 Memory Vault</h1>
            <p style={{ fontSize: 12, color: '#8B6914', margin: 0, fontFamily: 'system-ui,sans-serif' }}>{memories.length} {memories.length === 1 ? 'memory' : 'memories'} preserved</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowLiveRecord(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#e07b39,#b85c20)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>
            <Radio size={14} /> Live Story
          </button>
          <button onClick={() => setShowMemoryTrain(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#4a7c59,#2d5a3d)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>
            <Train size={14} /> Memory Train
          </button>
          <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 12, background: 'rgba(44,24,16,0.07)', border: '1px solid rgba(44,24,16,0.12)', color: '#2c1810', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* Search + type filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8B6914' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search memories..." style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: '1px solid rgba(139,105,20,0.25)', background: 'rgba(255,255,255,0.7)', fontSize: 13, color: '#2c1810', outline: 'none', fontFamily: 'system-ui,sans-serif', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(TYPE_META).map(([type, meta]) => {
              const Icon = meta.icon; const active = filterType === type
              return (
                <button key={type} onClick={() => setFilterType(active ? null : type)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 20, border: `1px solid ${active ? meta.color : 'rgba(139,105,20,0.2)'}`, background: active ? meta.bg : 'rgba(255,255,255,0.6)', color: active ? meta.color : '#6b5a47', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>
                  <Icon size={12} />{meta.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Member pills */}
        {members.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#8B6914', fontFamily: 'system-ui,sans-serif' }}>Filter:</span>
            <button onClick={() => setFilterMember(null)} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${!filterMember ? '#4a7c59' : 'rgba(74,124,89,0.3)'}`, background: !filterMember ? 'rgba(74,124,89,0.12)' : 'rgba(255,255,255,0.6)', color: !filterMember ? '#4a7c59' : '#6b5a47', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>All</button>
            {members.map(m => (
              <button key={m.id} onClick={() => setFilterMember(filterMember === m.id ? null : m.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: `1px solid ${filterMember === m.id ? '#4a7c59' : 'rgba(74,124,89,0.3)'}`, background: filterMember === m.id ? 'rgba(74,124,89,0.12)' : 'rgba(255,255,255,0.6)', color: filterMember === m.id ? '#4a7c59' : '#6b5a47', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>
                <Avatar member={m} size={18} />{m.first_name}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📷</div>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 22, color: '#2c1810', marginBottom: 8 }}>No memories yet</h3>
            <p style={{ color: '#6b5a47', fontFamily: 'system-ui,sans-serif', fontSize: 14 }}>Start with a Live Story, Memory Train, or add a photo</p>
          </div>
        )}

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {filtered.map(memory => {
            const meta = TYPE_META[memory.media_type] || TYPE_META.photo
            const Icon = meta.icon
            const linkedMember = getMember(memory.linked_member_id)
            let trainStops: any[] = []
            if (memory.media_type === 'memory_train') { try { trainStops = JSON.parse(memory.description || '[]') } catch {} }

            return (
              <div key={memory.id}
                style={{ borderRadius: 18, overflow: 'hidden', background: 'rgba(253,246,227,0.93)', border: `1px solid ${meta.border}`, boxShadow: '0 4px 20px rgba(44,24,16,0.07)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative' }}
                onClick={() => setSelectedMemory(memory)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(44,24,16,0.13)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(44,24,16,0.07)' }}
              >
                <div style={{ height: 150, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {memory.media_type === 'photo' && memory.media_url
                    ? <img src={memory.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (memory.media_type === 'video' || memory.media_type === 'story') && memory.media_url
                    ? <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={36} style={{ color: 'white', opacity: 0.8 }} /></div>
                    : memory.media_type === 'memory_train' && trainStops.length > 0
                    ? <div style={{ display: 'flex', gap: 4, padding: 8, width: '100%', height: '100%', boxSizing: 'border-box' }}>
                        {trainStops.slice(0, 3).map((s: any, i: number) => (
                          <div key={i} style={{ flex: 1, borderRadius: 8, overflow: 'hidden' }}>
                            <img src={s.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                        {trainStops.length > 3 && <div style={{ position: 'absolute', bottom: 6, right: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: 'white', fontFamily: 'system-ui,sans-serif' }}>+{trainStops.length - 3}</div>}
                      </div>
                    : <Icon size={36} style={{ color: meta.color, opacity: 0.5 }} />
                  }
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(253,246,227,0.93)', border: `1px solid ${meta.border}`, borderRadius: 20, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon size={11} style={{ color: meta.color }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, fontFamily: 'system-ui,sans-serif' }}>{meta.label}</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(memory) }} disabled={deleting === memory.id} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: 8, padding: 5, display: 'flex', cursor: 'pointer' }}>
                    <Trash2 size={12} style={{ color: 'white' }} />
                  </button>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#2c1810', fontFamily: 'Georgia,serif', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memory.title}</p>
                  {memory.memory_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#8B6914', fontFamily: 'system-ui,sans-serif', marginBottom: 3 }}>
                      <Calendar size={10} />{formatDate(memory.memory_date)}
                      {yearsAgo(memory.memory_date) !== 'This year' && <span style={{ background: 'rgba(139,105,20,0.1)', borderRadius: 10, padding: '1px 6px' }}>{yearsAgo(memory.memory_date)}</span>}
                    </div>
                  )}
                  {linkedMember && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#4a7c59', fontFamily: 'system-ui,sans-serif', marginBottom: 3 }}><User size={10} />{linkedMember.first_name}</div>}
                  {memory.media_type === 'memory_train' && <div style={{ fontSize: 11, color: '#4a7c59', fontFamily: 'system-ui,sans-serif' }}>🚂 {trainStops.length} stops</div>}
                  {memory.created_by_email && <div style={{ fontSize: 10, color: '#a08060', fontFamily: 'system-ui,sans-serif', marginTop: 2 }}>by {memory.created_by_email}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Add Photo/Video/Audio Modal ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowAddModal(false)}>
          <div style={{ background: '#fdf6e3', borderRadius: 22, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(139,105,20,0.2)', boxShadow: '0 24px 64px rgba(44,24,16,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 19, fontWeight: 700, color: '#2c1810', margin: 0 }}>📸 Add Memory</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b5a47' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
              {(['photo','video','audio'] as const).map(type => {
                const meta = TYPE_META[type]; const Icon = meta.icon; const active = form.media_type === type
                return (
                  <button key={type} onClick={() => { setForm(f => ({ ...f, media_type: type })); setFile(null); setPreview(null) }} style={{ padding: '10px 4px', borderRadius: 12, border: `2px solid ${active ? meta.color : 'transparent'}`, background: active ? meta.bg : 'rgba(255,255,255,0.5)', color: active ? meta.color : '#6b5a47', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, fontFamily: 'system-ui,sans-serif' }}>
                    <Icon size={20} />{meta.label}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title *" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: '#2c1810', outline: 'none', fontFamily: 'system-ui,sans-serif' }} />
              <input type="date" value={form.memory_date} onChange={e => setForm(f => ({ ...f, memory_date: e.target.value }))} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: form.memory_date ? '#2c1810' : '#8B6914', outline: 'none', fontFamily: 'system-ui,sans-serif' }} />
              <select value={form.linked_member_id} onChange={e => setForm(f => ({ ...f, linked_member_id: e.target.value }))} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: '#2c1810', outline: 'none', fontFamily: 'system-ui,sans-serif' }}>
                <option value="">Link to family member (optional)</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name || ''}</option>)}
              </select>
              <div>
<input ref={fileRef} type="file" accept={form.media_type === 'photo' ? 'image/*' : form.media_type === 'video' ? 'video/*' : 'audio/*'} onChange={handleFileChange} multiple={form.media_type === 'photo'} style={{ display: 'none' }} />                <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '18px', borderRadius: 12, border: '2px dashed rgba(139,105,20,0.35)', background: 'rgba(255,255,255,0.5)', color: '#8B6914', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: 'system-ui,sans-serif' }}>
                  <Upload size={22} /><span style={{ fontSize: 13, fontWeight: 600 }}>{file ? file.name : `Upload ${form.media_type}`}</span>
                </button>
                {preview && <img src={preview} alt="" style={{ width: '100%', borderRadius: 10, marginTop: 8, maxHeight: 180, objectFit: 'cover' }} />}
              </div>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" rows={2} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: '#2c1810', outline: 'none', resize: 'none', fontFamily: 'system-ui,sans-serif' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(139,105,20,0.3)', background: 'transparent', color: '#6b5a47', fontSize: 13, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>Cancel</button>
                <button onClick={handleAddMemory} disabled={uploading || !form.title.trim()} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: !form.title.trim() ? 'rgba(74,124,89,0.3)' : 'linear-gradient(135deg,#4a7c59,#2d5a3d)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>
                  {uploading ? '⏳ Saving...' : '💾 Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedMemory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setSelectedMemory(null)}>
          <div style={{ background: '#fdf6e3', borderRadius: 22, width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto', border: '1px solid rgba(139,105,20,0.2)', boxShadow: '0 24px 64px rgba(44,24,16,0.3)' }} onClick={e => e.stopPropagation()}>
            {selectedMemory.media_type === 'photo' && selectedMemory.media_url && (
              <img src={selectedMemory.media_url} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: '22px 22px 0 0', display: 'block' }} />
            )}
            {(selectedMemory.media_type === 'video' || selectedMemory.media_type === 'story') && selectedMemory.media_url && (
              <video controls src={selectedMemory.media_url} style={{ width: '100%', borderRadius: '22px 22px 0 0', display: 'block', maxHeight: 340, background: '#000' }} />
            )}
            {selectedMemory.media_type === 'audio' && selectedMemory.media_url && (
              <div style={{ padding: '28px 24px 16px', background: TYPE_META.audio.bg, borderRadius: '22px 22px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={28} style={{ color: '#8b5cf6' }} /></div></div>
                <audio controls src={selectedMemory.media_url} style={{ width: '100%' }} />
              </div>
            )}
            {selectedMemory.media_type === 'memory_train' && (
              <div style={{ padding: '20px 24px 0' }}><MemoryTrainViewer memory={selectedMemory} /></div>
            )}
            <div style={{ padding: '20px 24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 21, fontWeight: 700, color: '#2c1810', margin: 0 }}>{selectedMemory.title}</h2>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleDelete(selectedMemory)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}><Trash2 size={13} /> Delete</button>
                  <button onClick={() => setSelectedMemory(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b5a47', padding: 4 }}><X size={20} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {(() => { const meta = TYPE_META[selectedMemory.media_type] || TYPE_META.photo; const Icon = meta.icon; return <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 20, padding: '4px 10px', fontFamily: 'system-ui,sans-serif', fontWeight: 600 }}><Icon size={12} />{meta.label}</span> })()}
                {selectedMemory.memory_date && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8B6914', background: 'rgba(139,105,20,0.08)', border: '1px solid rgba(139,105,20,0.2)', borderRadius: 20, padding: '4px 10px', fontFamily: 'system-ui,sans-serif' }}>
                    <Calendar size={11} />{formatDate(selectedMemory.memory_date)}
                    {yearsAgo(selectedMemory.memory_date) !== 'This year' && <span style={{ background: 'rgba(139,105,20,0.15)', borderRadius: 10, padding: '1px 6px' }}>{yearsAgo(selectedMemory.memory_date)}</span>}
                  </span>
                )}
                {getMember(selectedMemory.linked_member_id) && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4a7c59', background: 'rgba(74,124,89,0.08)', border: '1px solid rgba(74,124,89,0.2)', borderRadius: 20, padding: '4px 10px', fontFamily: 'system-ui,sans-serif' }}>
                    <Avatar member={getMember(selectedMemory.linked_member_id)!} size={16} />{getMember(selectedMemory.linked_member_id)!.first_name}
                  </span>
                )}
              </div>
              {selectedMemory.description && selectedMemory.media_type !== 'memory_train' && (
                <p style={{ fontSize: 14, color: '#4a3728', lineHeight: 1.7, fontFamily: 'system-ui,sans-serif' }}>{selectedMemory.description}</p>
              )}
              {selectedMemory.created_by_email && <p style={{ fontSize: 12, color: '#a08060', marginTop: 14, fontFamily: 'system-ui,sans-serif' }}>📤 Shared by {selectedMemory.created_by_email}</p>}
            </div>
          </div>
        </div>
      )}

      {showLiveRecord && <LiveRecordModal familyId={familyId} members={members} currentUser={currentUser} onSave={m => setMemories(prev => [m, ...prev])} onClose={() => setShowLiveRecord(false)} />}
      {showMemoryTrain && <MemoryTrainModal familyId={familyId} members={members} currentUser={currentUser} onSave={m => setMemories(prev => [m, ...prev])} onClose={() => setShowMemoryTrain(false)} />}
    </div>
  )
}