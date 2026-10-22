'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, TreesIcon as Tree, Shield, Users, Sparkles } from 'lucide-react'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default function CreateFamilyPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
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
      const familyRef = await addDoc(collection(db, 'families'), {
        name,
        description: description || null,
        inviteCode: generateInviteCode(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        members: {
          [user.uid]: { role: 'admin', email: user.email, joinedAt: serverTimestamp() }
        }
      })
      router.push(`/dashboard/family/${familyRef.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create family')
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
        <div className="b1 absolute top-10 left-8 w-36 h-36 rounded-full" style={{ background: 'rgba(139,105,20,0.10)' }}></div>
        <div className="b2 absolute top-32 right-12 w-24 h-24 rounded-full" style={{ background: 'rgba(74,124,89,0.10)' }}></div>
        <div className="b3 absolute bottom-20 left-1/4 w-20 h-20 rounded-full" style={{ background: 'rgba(184,92,56,0.08)' }}></div>
        <div className="b1 absolute bottom-40 right-1/4 w-28 h-28 rounded-full" style={{ background: 'rgba(201,162,39,0.09)' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6" style={{ color: '#6b5a47' }}>
          <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #4a7c59, #2d5a3d)' }}>
              <Tree className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-serif font-bold mb-2" style={{ color: '#2c1810' }}>Create a Family</h1>
            <p style={{ color: '#6b5a47' }}>Start your family tree and invite members to join</p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl p-8 backdrop-blur-sm" style={{ background: 'rgba(253,246,227,0.85)', border: '1px solid rgba(139,105,20,0.15)', boxShadow: '0 8px 32px rgba(44,24,16,0.08)' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm rounded-xl" style={{ background: 'rgba(184,92,56,0.1)', color: '#b85c38', border: '1px solid rgba(184,92,56,0.2)' }}>{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" style={{ color: '#2c1810', fontWeight: 600 }}>Family Name *</Label>
                <Input id="name" placeholder="e.g., The Mensah Family" value={name} onChange={(e) => setName(e.target.value)} required style={{ borderColor: 'rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)' }} />
                <p className="text-xs" style={{ color: '#8B6914' }}>This will be visible to all family members</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" style={{ color: '#2c1810', fontWeight: 600 }}>Family Description</Label>
                <Textarea id="description" placeholder="Share a little about your family's story, origin, or what makes you unique..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} style={{ borderColor: 'rgba(139,105,20,0.3)', background: 'rgba(255,255,255,0.7)' }} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading || !name.trim()} className="flex-1 py-6 text-base font-semibold rounded-xl" style={{ background: 'linear-gradient(135deg, #4a7c59, #2d5a3d)', border: 'none' }}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : <><Tree className="mr-2 h-4 w-4" />Create Family</>}
                </Button>
                <Button type="button" variant="outline" asChild className="py-6 px-6 rounded-xl" style={{ borderColor: 'rgba(139,105,20,0.3)', color: '#6b5a47' }}>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </form>
          </div>

          {/* What happens next */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: Sparkles, title: 'Invite Code', desc: 'A unique code is generated for your family' },
              { icon: Users, title: 'Add Members', desc: 'Share the code with relatives to join' },
              { icon: Shield, title: 'You\'re Admin', desc: 'Control who joins and their permissions' },
            ].map((item) => (
              <div key={item.title} className="text-center rounded-xl p-4" style={{ background: 'rgba(74,124,89,0.07)', border: '1px solid rgba(74,124,89,0.15)' }}>
                <item.icon className="h-5 w-5 mx-auto mb-2" style={{ color: '#4a7c59' }} />
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