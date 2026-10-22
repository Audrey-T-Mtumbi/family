'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Users, Heart, TreesIcon as Tree, BookOpen } from 'lucide-react'

export default function JoinFamilyPage() {
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')
      const q = query(collection(db, 'families'), where('inviteCode', '==', inviteCode.toUpperCase().trim()))
      const snapshot = await getDocs(q)
      if (snapshot.empty) throw new Error('Invalid invite code. Please check and try again.')
      const familyDoc = snapshot.docs[0]
      const familyData = familyDoc.data()
if (familyData.members && familyData.members[user.uid]) {
  router.push(`/dashboard/family/${familyDoc.id}`)
  return
}      await updateDoc(doc(db, 'families', familyDoc.id), {
        [`members.${user.uid}`]: { role: 'member', email: user.email, joinedAt: new Date() }
      })
      router.push(`/dashboard/family/${familyDoc.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join family')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fdf6e3 0%, #f5efe0 50%, #ede8d8 100%)' }}>
      {/* Forest Background */}
      <div className="absolute inset-0 z-0" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.08 }} />
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(to bottom, rgba(253,246,227,0.6) 0%, rgba(245,239,224,0.8) 100%)' }} />

      {/* Bubbles */}
      <style>{`
        @keyframes float1{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-28px)}}
        .b1{animation:float1 6s ease-in-out infinite}
        .b2{animation:float2 8s ease-in-out infinite 1s}
        .b3{animation:float1 7s ease-in-out infinite 2s}
      `}</style>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="b1 absolute top-10 right-8 w-36 h-36 rounded-full" style={{ background: 'rgba(201,162,39,0.10)' }}></div>
        <div className="b2 absolute top-40 left-12 w-24 h-24 rounded-full" style={{ background: 'rgba(74,124,89,0.10)' }}></div>
        <div className="b3 absolute bottom-20 right-1/4 w-20 h-20 rounded-full" style={{ background: 'rgba(139,105,20,0.08)' }}></div>
        <div className="b1 absolute bottom-40 left-1/4 w-28 h-28 rounded-full" style={{ background: 'rgba(184,92,56,0.07)' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6" style={{ color: '#6b5a47' }}>
          <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #c9a227, #8B6914)' }}>
              <Users className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-serif font-bold mb-2" style={{ color: '#2c1810' }}>Join a Family</h1>
            <p style={{ color: '#6b5a47' }}>Reconnect with your roots using a family invite code</p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl p-8 backdrop-blur-sm" style={{ background: 'rgba(253,246,227,0.85)', border: '1px solid rgba(139,105,20,0.15)', boxShadow: '0 8px 32px rgba(44,24,16,0.08)' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm rounded-xl" style={{ background: 'rgba(184,92,56,0.1)', color: '#b85c38', border: '1px solid rgba(184,92,56,0.2)' }}>{error}</div>
              )}

              <div className="space-y-3">
                <Label htmlFor="inviteCode" style={{ color: '#2c1810', fontWeight: 600 }}>Family Invite Code *</Label>
                <Input
                  id="inviteCode"
                  placeholder="E.G., ABC12345"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  maxLength={8}
                  className="text-center text-2xl font-mono tracking-[0.4em] py-6"
                  style={{ borderColor: 'rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)', color: '#2c1810' }}
                />
                <p className="text-xs text-center" style={{ color: '#8B6914' }}>Ask a family admin for the 8-character invite code</p>

                {/* Code character indicators */}
                <div className="flex justify-center gap-2 mt-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="w-8 h-1 rounded-full transition-all duration-200" style={{ background: i < inviteCode.length ? '#4a7c59' : 'rgba(139,105,20,0.2)' }}></div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading || inviteCode.length !== 8} className="flex-1 py-6 text-base font-semibold rounded-xl" style={{ background: 'linear-gradient(135deg, #c9a227, #8B6914)', border: 'none' }}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Joining...</> : <><Users className="mr-2 h-4 w-4" />Join Family</>}
                </Button>
                <Button type="button" variant="outline" asChild className="py-6 px-6 rounded-xl" style={{ borderColor: 'rgba(139,105,20,0.3)', color: '#6b5a47' }}>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </form>
          </div>

          {/* What you get */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: Tree, title: 'Family Tree', desc: 'View and explore the full family tree' },
              { icon: BookOpen, title: 'Memories', desc: 'Access shared photos, stories and recordings' },
              { icon: Heart, title: 'Family Feed', desc: 'Stay connected with family updates' },
            ].map((item) => (
              <div key={item.title} className="text-center rounded-xl p-4" style={{ background: 'rgba(201,162,39,0.07)', border: '1px solid rgba(201,162,39,0.15)' }}>
                <item.icon className="h-5 w-5 mx-auto mb-2" style={{ color: '#8B6914' }} />
                <p className="text-xs font-semibold mb-1" style={{ color: '#2c1810' }}>{item.title}</p>
                <p className="text-xs" style={{ color: '#6b5a47' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}