'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { Plus, Users, TreesIcon as Tree, ArrowRight, Star, BookOpen, Heart } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [families, setFamilies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { setLoading(false); return }
      setUser(currentUser)

      // Fetch all families where this user is a member
      try {
        const familiesRef = collection(db, 'families')
        const snapshot = await getDocs(familiesRef)
        const userFamilies: any[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          if (data.members && data.members[currentUser.uid]) {
            userFamilies.push({ id: doc.id, ...data })
          }
        })
        setFamilies(userFamilies)
      } catch (err) {
        console.error('Error fetching families:', err)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'linear-gradient(135deg, #fdf6e3, #ede8d8)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fdf6e3 0%, #f5efe0 50%, #ede8d8 100%)' }}>
      {/* Forest Background */}
      <div className="absolute inset-0 z-0" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', opacity: 0.10 }} />
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(to bottom, rgba(253,246,227,0.55) 0%, rgba(245,239,224,0.75) 40%, rgba(237,232,216,0.92) 100%)' }} />

      {/* Bubbles */}
      <style>{`
        @keyframes float1{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-28px)}}
        .b1{animation:float1 6s ease-in-out infinite}
        .b2{animation:float2 8s ease-in-out infinite 1s}
        .b3{animation:float1 7s ease-in-out infinite 2s}
      `}</style>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="b1 absolute top-10 left-8 w-36 h-36 rounded-full" style={{ background: 'rgba(139,105,20,0.12)' }}></div>
        <div className="b2 absolute top-32 right-16 w-24 h-24 rounded-full" style={{ background: 'rgba(74,124,89,0.12)' }}></div>
        <div className="b3 absolute top-20 left-1/3 w-16 h-16 rounded-full" style={{ background: 'rgba(184,92,56,0.10)' }}></div>
        <div className="b1 absolute bottom-40 right-1/4 w-28 h-28 rounded-full" style={{ background: 'rgba(139,105,20,0.09)' }}></div>
        <div className="b2 absolute bottom-20 left-16 w-20 h-20 rounded-full" style={{ background: 'rgba(74,124,89,0.10)' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-medium" style={{ background: 'rgba(139,105,20,0.12)', color: '#8B6914', border: '1px solid rgba(139,105,20,0.2)' }}>
            <Star className="h-4 w-4" />
            Your Family Legacy
          </div>
          <h1 className="text-5xl font-serif font-bold mb-3" style={{ color: '#2c1810' }}>
            Welcome back, <span style={{ color: '#4a7c59' }}>{firstName}</span> 🌿
          </h1>
          <p className="text-lg" style={{ color: '#6b5a47' }}>
            {families.length > 0 ? 'Continue building your family legacy' : 'Every family has a story worth preserving. Start building yours today.'}
          </p>
        </div>

        {families.length === 0 ? (
          // Empty state
          <div className="max-w-2xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Link href="/dashboard/family/new" className="group">
                <div className="relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #4a7c59, #2d5a3d)' }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -translate-y-8 translate-x-8" style={{ background: '#fff' }}></div>
                  <div className="relative">
                    <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(255,255,255,0.2)' }}>
                      <Tree className="h-7 w-7 text-white" />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-white mb-2">Create a Family</h2>
                    <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>Start your family tree and begin documenting your legacy</p>
                    <div className="inline-flex items-center gap-2 text-white text-sm font-medium">
                      <Plus className="h-4 w-4" />Get Started
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/dashboard/family/join" className="group">
                <div className="relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #c9a227, #8B6914)' }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -translate-y-8 translate-x-8" style={{ background: '#fff' }}></div>
                  <div className="relative">
                    <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(255,255,255,0.2)' }}>
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-white mb-2">Join a Family</h2>
                    <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>Connect with relatives using a family invite code</p>
                    <div className="inline-flex items-center gap-2 text-white text-sm font-medium">
                      <Users className="h-4 w-4" />Enter Code
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Tree, title: 'Family Tree', desc: 'Interactive visual tree across generations', color: '#4a7c59', bg: 'rgba(74,124,89,0.08)' },
                { icon: BookOpen, title: 'Memory Vault', desc: 'Photos, videos, voice recordings & stories', color: '#8B6914', bg: 'rgba(139,105,20,0.08)' },
                { icon: Heart, title: 'Family Feed', desc: 'Share updates and celebrate together', color: '#b85c38', bg: 'rgba(184,92,56,0.08)' },
              ].map((f) => (
                <div key={f.title} className="rounded-2xl p-5 text-center" style={{ background: f.bg, border: `1px solid ${f.color}25` }}>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: f.color + '15' }}>
                    <f.icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-serif font-semibold mb-1" style={{ color: '#2c1810' }}>{f.title}</h3>
                  <p className="text-xs" style={{ color: '#6b5a47' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Families grid
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Existing families */}
              {families.map((family) => {
                const memberCount = Object.keys(family.members || {}).length
                const userRole = family.members?.[user?.uid]?.role || 'member'
                return (
                  <Link key={family.id} href={`/dashboard/family/${family.id}`} className="group">
                    <div className="rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1" style={{ background: 'rgba(253,246,227,0.88)', border: '1px solid rgba(74,124,89,0.2)' }}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-14 w-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4a7c59, #2d5a3d)' }}>
                          <Tree className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full capitalize font-medium" style={{ background: userRole === 'admin' ? 'rgba(74,124,89,0.12)' : 'rgba(139,105,20,0.1)', color: userRole === 'admin' ? '#4a7c59' : '#8B6914' }}>
                          {userRole}
                        </span>
                      </div>
                      <h3 className="text-xl font-serif font-bold mb-1 group-hover:text-green-700 transition-colors" style={{ color: '#2c1810' }}>{family.name}</h3>
                      {family.description && (
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: '#6b5a47' }}>{family.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs flex items-center gap-1" style={{ color: '#8B6914' }}>
                          <Users className="h-3 w-3" />{memberCount} member{memberCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs flex items-center gap-1 font-medium" style={{ color: '#4a7c59' }}>
                          View family <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}

              {/* Create new family card */}
              <Link href="/dashboard/family/new" className="group">
                <div className="rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center text-center min-h-[180px]" style={{ background: 'rgba(253,246,227,0.6)', border: '2px dashed rgba(74,124,89,0.3)' }}>
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(74,124,89,0.1)' }}>
                    <Plus className="h-6 w-6" style={{ color: '#4a7c59' }} />
                  </div>
                  <p className="font-serif font-semibold mb-1" style={{ color: '#4a7c59' }}>Create Another Family</p>
                  <p className="text-xs" style={{ color: '#6b5a47' }}>Start a new family tree</p>
                </div>
              </Link>

              {/* Join family card */}
              <Link href="/dashboard/family/join" className="group">
                <div className="rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center text-center min-h-[180px]" style={{ background: 'rgba(253,246,227,0.6)', border: '2px dashed rgba(201,162,39,0.3)' }}>
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(201,162,39,0.1)' }}>
                    <Users className="h-6 w-6" style={{ color: '#c9a227' }} />
                  </div>
                  <p className="font-serif font-semibold mb-1" style={{ color: '#c9a227' }}>Join a Family</p>
                  <p className="text-xs" style={{ color: '#6b5a47' }}>Use an invite code</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Quote */}
        <div className="max-w-2xl mx-auto mt-16 text-center rounded-2xl p-8" style={{ background: 'rgba(253,246,227,0.7)', border: '1px solid rgba(139,105,20,0.15)' }}>
          <p className="text-lg font-serif italic mb-3" style={{ color: '#2c1810' }}>
            "In family life, love is the oil that eases friction, the cement that binds closer together."
          </p>
          <p className="text-sm font-medium" style={{ color: '#8B6914' }}>— Friedrich Nietzsche</p>
        </div>
      </div>
    </div>
  )
}