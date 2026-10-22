'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  serverTimestamp, orderBy, query, onSnapshot
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { ArrowLeft, Send, Trash2, Gift, Heart, X } from 'lucide-react'
import Link from 'next/link'

interface Post {
  id: string
  text: string
  created_by: string
  created_by_email: string
  created_by_name?: string
  createdAt?: any
}

interface Member {
  id: string
  first_name: string
  last_name: string | null
  birth_date: string | null
  avatar_url: string | null
}

function getInitials(email: string, name?: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

function timeAgo(ts: any) {
  if (!ts) return 'just now'
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getUpcomingBirthdays(members: Member[]) {
  const today = new Date()
  const upcoming: { member: Member; daysUntil: number; age: number }[] = []
  members.forEach(m => {
    if (!m.birth_date) return
    const bday = new Date(m.birth_date)
    const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
    const nextYear = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate())
    const target = thisYear >= today ? thisYear : nextYear
    const daysUntil = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const age = target.getFullYear() - bday.getFullYear()
    if (daysUntil <= 30) upcoming.push({ member: m, daysUntil, age })
  })
  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil)
}

export default function FamilyFeedPage() {
  const params = useParams()
  const router = useRouter()
  const familyId = params.familyId as string

  const [posts, setPosts] = useState<Post[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showBirthdays, setShowBirthdays] = useState(true)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/auth/login'); return }
      setCurrentUser(user)
      try {
        const membersSnap = await getDocs(collection(db, 'families', familyId, 'treeMembers'))
        const mems: Member[] = []
        membersSnap.forEach(d => mems.push({ id: d.id, ...d.data() } as Member))
        setMembers(mems)
      } catch (err) { console.error(err) }
      setLoading(false)
    })
    return () => unsub()
  }, [familyId])

  useEffect(() => {
    const q = query(collection(db, 'families', familyId, 'feed'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const p: Post[] = []
      snap.forEach(d => p.push({ id: d.id, ...d.data() } as Post))
      setPosts(p)
    })
    return () => unsub()
  }, [familyId])

  const handlePost = async () => {
    if (!text.trim() || posting) return
    setPosting(true)
    try {
      await addDoc(collection(db, 'families', familyId, 'feed'), {
        text: text.trim(),
        created_by: currentUser.uid,
        created_by_email: currentUser.email,
        created_by_name: currentUser.displayName || null,
        createdAt: serverTimestamp(),
      })
      setText('')
      if (textRef.current) textRef.current.style.height = 'auto'
    } catch (err) { console.error(err) }
    setPosting(false)
  }

  const handleDelete = async (post: Post) => {
    if (!confirm('Delete this post?')) return
    setDeleting(post.id)
    try {
      await deleteDoc(doc(db, 'families', familyId, 'feed', post.id))
    } catch (err) { console.error(err) }
    setDeleting(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
  }

  const upcomingBirthdays = getUpcomingBirthdays(members)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fdf6e3' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
        <p style={{ color: '#6b5a47', fontFamily: 'Georgia,serif' }}>Loading feed...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #fdf6e3 0%, #f0e8d0 100%)', fontFamily: 'system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'rgba(253,246,227,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(139,105,20,0.12)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14, height: 56 }}>
          <Link href={`/dashboard/family/${familyId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b5a47', textDecoration: 'none', fontSize: 13 }}>
            <ArrowLeft size={16} />Back
          </Link>
          <div style={{ width: 1, height: 20, background: 'rgba(139,105,20,0.2)' }} />
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 700, color: '#2c1810', margin: 0 }}>🌿 Family Feed</h1>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#8B6914' }}>{posts.length} posts</div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>

        {/* Birthday reminders */}
        {upcomingBirthdays.length > 0 && showBirthdays && (
          <div style={{ borderRadius: 16, border: '1px solid rgba(201,162,39,0.3)', background: 'linear-gradient(135deg, rgba(253,246,227,0.9), rgba(255,248,210,0.9))', padding: '14px 16px', marginBottom: 20, position: 'relative' }}>
            <button onClick={() => setShowBirthdays(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#8B6914', padding: 2 }}><X size={14} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Gift size={15} style={{ color: '#c9a227' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#8B6914', textTransform: 'uppercase', letterSpacing: 0.8 }}>Upcoming Birthdays</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingBirthdays.slice(0, 3).map(({ member, daysUntil, age }) => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a227,#8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                    {member.first_name[0]}{member.last_name?.[0] || ''}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#2c1810' }}>{member.first_name} {member.last_name || ''}</span>
                    <span style={{ fontSize: 12, color: '#8B6914', marginLeft: 6 }}>turns {age}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: daysUntil === 0 ? '#ef4444' : '#c9a227', background: daysUntil === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(201,162,39,0.1)', borderRadius: 20, padding: '2px 10px' }}>
                    {daysUntil === 0 ? '🎂 Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compose box */}
        <div style={{ borderRadius: 18, border: '1px solid rgba(139,105,20,0.18)', background: 'rgba(253,246,227,0.95)', padding: '16px', marginBottom: 20, boxShadow: '0 2px 12px rgba(44,24,16,0.05)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#4a7c59,#2d5a3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 700, flexShrink: 0 }}>
              {getInitials(currentUser?.email || '', currentUser?.displayName || '')}
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                ref={textRef}
                value={text}
                onChange={e => {
                  setText(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                onKeyDown={handleKeyDown}
                placeholder="What's happening in the family? 🌿"
                rows={2}
                style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontSize: 15, color: '#2c1810', fontFamily: 'Georgia,serif', lineHeight: 1.6, minHeight: 60 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(139,105,20,0.1)' }}>
                <span style={{ fontSize: 12, color: text.length > 250 ? '#ef4444' : '#a08060' }}>{text.length}/280</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#a08060' }}>⌘+Enter to post</span>
                  <button
                    onClick={handlePost}
                    disabled={!text.trim() || posting || text.length > 280}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 20, border: 'none', background: !text.trim() || text.length > 280 ? 'rgba(74,124,89,0.3)' : 'linear-gradient(135deg,#4a7c59,#2d5a3d)', color: 'white', fontSize: 13, fontWeight: 700, cursor: !text.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
                  >
                    <Send size={13} />{posting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: 20, color: '#2c1810', marginBottom: 8 }}>No posts yet</h3>
            <p style={{ color: '#6b5a47', fontSize: 14 }}>Be the first to share something with the family!</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {posts.map((post, i) => {
            const isOwn = post.created_by === currentUser?.uid
            const initials = getInitials(post.created_by_email, post.created_by_name || '')
            const colors = ['#4a7c59', '#c9a227', '#8b5cf6', '#3b82f6', '#ef4444', '#e07b39']
            const color = colors[post.created_by_email.charCodeAt(0) % colors.length]

            return (
              <div key={post.id} style={{ borderRadius: 16, border: '1px solid rgba(139,105,20,0.1)', background: 'rgba(253,246,227,0.92)', padding: '16px', transition: 'background 0.15s', position: 'relative' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(253,246,227,1)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(253,246,227,0.92)'}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + time */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#2c1810' }}>
                        {post.created_by_name || post.created_by_email.split('@')[0]}
                      </span>
                      <span style={{ fontSize: 12, color: '#a08060' }}>@{post.created_by_email.split('@')[0]}</span>
                      <span style={{ fontSize: 12, color: '#c0a880' }}>·</span>
                      <span style={{ fontSize: 12, color: '#a08060' }}>{timeAgo(post.createdAt)}</span>
                    </div>
                    {/* Post text */}
                    <p style={{ fontSize: 15, color: '#2c1810', lineHeight: 1.65, fontFamily: 'Georgia,serif', margin: 0, wordBreak: 'break-word' }}>{post.text}</p>
                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
                      <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#a08060', fontSize: 12, padding: 0 }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#a08060'}
                      >
                        <Heart size={14} />
                      </button>
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(post)}
                          disabled={deleting === post.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#a08060', fontSize: 12, padding: 0, marginLeft: 'auto' }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#a08060'}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}