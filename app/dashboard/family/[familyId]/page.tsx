'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { TreesIcon as Tree, Users, BookOpen, Heart, Calendar, Copy, Check, ArrowLeft, Settings, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FamilyPage() {
  const params = useParams()
  const router = useRouter()
  const familyId = params.familyId as string
  const [family, setFamily] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.push('/auth/login'); return }
      setUser(currentUser)
      try {
        const familyDoc = await getDoc(doc(db, 'families', familyId))
        if (familyDoc.exists()) {
          setFamily({ id: familyDoc.id, ...familyDoc.data() })
        } else {
          router.push('/dashboard')
        }
      } catch (err) {
        router.push('/dashboard')
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [familyId])

  const copyInviteCode = () => {
    navigator.clipboard.writeText(family?.inviteCode || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const memberCount = family ? Object.keys(family.members || {}).length : 0
  const userRole = family?.members?.[user?.uid]?.role || 'member'
  const isAdmin = userRole === 'admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'linear-gradient(135deg, #fdf6e3, #ede8d8)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fdf6e3 0%, #f5efe0 50%, #ede8d8 100%)' }}>
      {/* Forest Background */}
      <div className="absolute inset-0 z-0" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.07 }} />
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(to bottom, rgba(253,246,227,0.6) 0%, rgba(245,239,224,0.8) 100%)' }} />

      <style>{`
        @keyframes float1{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        @keyframes float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-25px)}}
        .b1{animation:float1 6s ease-in-out infinite}
        .b2{animation:float2 8s ease-in-out infinite 1.5s}
      `}</style>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="b1 absolute top-10 left-8 w-32 h-32 rounded-full" style={{ background: 'rgba(139,105,20,0.09)' }}></div>
        <div className="b2 absolute top-40 right-12 w-24 h-24 rounded-full" style={{ background: 'rgba(74,124,89,0.09)' }}></div>
        <div className="b1 absolute bottom-32 right-1/4 w-20 h-20 rounded-full" style={{ background: 'rgba(201,162,39,0.08)' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6" style={{ color: '#6b5a47' }}>
          <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>

        {/* Family Header */}
        <div className="rounded-2xl p-8 mb-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4a7c59, #2d5a3d)' }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 -translate-y-16 translate-x-16" style={{ background: '#fff' }}></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 translate-y-12 -translate-x-8" style={{ background: '#fff' }}></div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Tree className="h-10 w-10 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-serif font-bold text-white">{family?.name}</h1>
                  {isAdmin && (
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)' }}>Admin</span>
                  )}
                </div>
                {family?.description && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{family.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <Users className="h-4 w-4" />{memberCount} member{memberCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <p className="text-xs mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Family Invite Code</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold tracking-widest text-white">{family?.inviteCode}</span>
                <button onClick={copyInviteCode} className="h-8 w-8 rounded-lg flex items-center justify-center transition-all" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4 text-white" />}
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Share to invite relatives</p>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

          {/* Family Tree */}
          <Link href={`/dashboard/family/${familyId}/tree`} className="group">
            <div className="rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1" style={{ background: 'rgba(253,246,227,0.85)', border: '1px solid rgba(74,124,89,0.2)' }}>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(74,124,89,0.12)' }}>
                <Tree className="h-6 w-6" style={{ color: '#4a7c59' }} />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2" style={{ color: '#2c1810' }}>Family Tree</h3>
              <p className="text-sm mb-4" style={{ color: '#6b5a47' }}>Visualise your family across generations with an interactive tree</p>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#4a7c59' }}>
                <Plus className="h-4 w-4" />Add members &amp; explore
              </div>
            </div>
          </Link>

          {/* Memory Vault */}
          <Link href={`/dashboard/family/${familyId}/memories`} className="group">
            <div className="rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1" style={{ background: 'rgba(253,246,227,0.85)', border: '1px solid rgba(139,105,20,0.2)' }}>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(139,105,20,0.12)' }}>
                <BookOpen className="h-6 w-6" style={{ color: '#8B6914' }} />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2" style={{ color: '#2c1810' }}>Memory Vault</h3>
              <p className="text-sm mb-4" style={{ color: '#6b5a47' }}>Upload photos, videos, voice recordings and family stories</p>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#8B6914' }}>
                <Plus className="h-4 w-4" />Add &amp; explore memories
              </div>
            </div>
          </Link>

       {/* Family Feed */}
<Link href={`/dashboard/family/${familyId}/feed`} className="group">
  <div className="rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1" style={{ background: 'rgba(253,246,227,0.85)', border: '1px solid rgba(184,92,56,0.2)' }}>
    <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(184,92,56,0.12)' }}>
      <Heart className="h-6 w-6" style={{ color: '#b85c38' }} />
    </div>
    <h3 className="font-serif font-bold text-lg mb-2" style={{ color: '#2c1810' }}>Family Feed</h3>
    <p className="text-sm mb-4" style={{ color: '#6b5a47' }}>Share updates, celebrate birthdays and stay connected</p>
    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#b85c38' }}>
      <Plus className="h-4 w-4" />Share with family
    </div>
  </div>
</Link>
{/* Events */}
<Link href={`/dashboard/family/${familyId}/events`} className="group">
  <div className="rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1" style={{ background: 'rgba(253,246,227,0.85)', border: '1px solid rgba(201,162,39,0.2)' }}>
    <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(201,162,39,0.12)' }}>
      <Calendar className="h-6 w-6" style={{ color: '#c9a227' }} />
    </div>
    <h3 className="font-serif font-bold text-lg mb-2" style={{ color: '#2c1810' }}>Events &amp; Reunions</h3>
    <p className="text-sm mb-4" style={{ color: '#6b5a47' }}>Plan family gatherings, reunions and important milestones</p>
    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#c9a227' }}>
      <Plus className="h-4 w-4" />Create an event
    </div>
  </div>
</Link>

          {/* Members */}
          <div className="rounded-2xl p-6 h-full" style={{ background: 'rgba(253,246,227,0.85)', border: '1px solid rgba(74,124,89,0.2)' }}>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(74,124,89,0.12)' }}>
              <Users className="h-6 w-6" style={{ color: '#4a7c59' }} />
            </div>
            <h3 className="font-serif font-bold text-lg mb-3" style={{ color: '#2c1810' }}>Members ({memberCount})</h3>
            <div className="space-y-2">
              {Object.entries(family?.members || {}).map(([uid, member]: any) => (
                <div key={uid} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#4a7c59' }}>
                      {member.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm" style={{ color: '#2c1810' }}>{member.email}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: member.role === 'admin' ? 'rgba(74,124,89,0.12)' : 'rgba(139,105,20,0.1)', color: member.role === 'admin' ? '#4a7c59' : '#8B6914' }}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings (admin only) */}
          {isAdmin && (
            <div className="rounded-2xl p-6 h-full" style={{ background: 'rgba(253,246,227,0.85)', border: '1px solid rgba(139,105,20,0.2)' }}>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(139,105,20,0.12)' }}>
                <Settings className="h-6 w-6" style={{ color: '#8B6914' }} />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2" style={{ color: '#2c1810' }}>Family Settings</h3>
              <p className="text-sm mb-4" style={{ color: '#6b5a47' }}>Manage your family name, description and member permissions</p>
              <Link href={`/dashboard/family/${familyId}/settings`}>
                <Button size="sm" style={{ background: 'linear-gradient(135deg, #c9a227, #8B6914)', border: 'none' }}>
                  Manage Settings
                </Button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}