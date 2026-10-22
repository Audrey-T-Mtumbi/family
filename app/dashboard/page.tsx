'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Plus, Users, TreesIcon as Tree, BookOpen, Heart, Star } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fdf6e3 0%, #f5efe0 50%, #ede8d8 100%)' }}>

      {/* Forest Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: 0.15,
        }}
      />

      {/* Gradient fade over image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(253,246,227,0.55) 0%, rgba(245,239,224,0.7) 40%, rgba(237,232,216,0.9) 100%)',
        }}
      />

      {/* Animated floating bubbles */}
      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.08)} }
        @keyframes float3 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-15px) scale(1.03)} }
        @keyframes float4 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-25px) scale(1.06)} }
        .bubble1 { animation: float1 6s ease-in-out infinite; }
        .bubble2 { animation: float2 8s ease-in-out infinite 1s; }
        .bubble3 { animation: float3 7s ease-in-out infinite 2s; }
        .bubble4 { animation: float4 9s ease-in-out infinite 0.5s; }
      `}</style>

      {/* Floating bubbles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="bubble1 absolute top-10 left-8 w-36 h-36 rounded-full" style={{ background: 'rgba(139,105,20,0.12)' }}></div>
        <div className="bubble2 absolute top-40 right-16 w-24 h-24 rounded-full" style={{ background: 'rgba(74,124,89,0.12)' }}></div>
        <div className="bubble3 absolute top-20 left-1/3 w-16 h-16 rounded-full" style={{ background: 'rgba(184,92,56,0.10)' }}></div>
        <div className="bubble4 absolute bottom-40 right-1/4 w-28 h-28 rounded-full" style={{ background: 'rgba(139,105,20,0.09)' }}></div>
        <div className="bubble1 absolute bottom-20 left-16 w-20 h-20 rounded-full" style={{ background: 'rgba(74,124,89,0.10)' }}></div>
        <div className="bubble3 absolute top-1/2 right-8 w-14 h-14 rounded-full" style={{ background: 'rgba(201,162,39,0.12)' }}></div>
      </div>

      {/* All content */}
      <div className="relative z-10">

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium" style={{ background: 'rgba(139,105,20,0.12)', color: '#8B6914', border: '1px solid rgba(139,105,20,0.2)' }}>
              <Star className="h-4 w-4" />
              Your Family Legacy Awaits
            </div>

            <h1 className="text-5xl font-serif font-bold mb-4" style={{ color: '#2c1810' }}>
              Welcome back,<br />
              <span style={{ color: '#4a7c59' }}>{firstName}</span> 🌿
            </h1>

            <p className="text-lg mb-10" style={{ color: '#6b5a47' }}>
              Every family has a story worth preserving. Start building yours today.
            </p>

            {/* Main Action Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Link href="/dashboard/family/new" className="group">
                <div className="relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #4a7c59, #2d5a3d)' }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -translate-y-8 translate-x-8" style={{ background: '#fff' }}></div>
                  <div className="relative">
                    <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(255,255,255,0.2)' }}>
                      <Tree className="h-7 w-7 text-white" />
                    </div>
                    <h2 className="text-xl font-serif font-bold text-white mb-2">Create a Family</h2>
                    <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      Start your family tree and begin documenting your legacy
                    </p>
                    <div className="inline-flex items-center gap-2 text-white text-sm font-medium">
                      <Plus className="h-4 w-4" />
                      Get Started
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
                    <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      Connect with your relatives using a family invite code
                    </p>
                    <div className="inline-flex items-center gap-2 text-white text-sm font-medium">
                      <Users className="h-4 w-4" />
                      Enter Code
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-3" style={{ color: '#2c1810' }}>
              Everything your family needs
            </h2>
            <p style={{ color: '#6b5a47' }}>Build, share, and preserve your family story</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Tree, title: 'Family Tree', desc: 'Visualise generations with an interactive, beautiful family tree', color: '#4a7c59', bg: 'rgba(74,124,89,0.08)' },
              { icon: BookOpen, title: 'Memory Vault', desc: 'Store photos, videos, voice recordings and stories', color: '#8B6914', bg: 'rgba(139,105,20,0.08)' },
              { icon: Heart, title: 'Family Feed', desc: 'Share updates, celebrate birthdays and stay connected', color: '#b85c38', bg: 'rgba(184,92,56,0.08)' },
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl p-6 text-center backdrop-blur-sm" style={{ background: feature.bg, border: `1px solid ${feature.color}25` }}>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: feature.color + '15' }}>
                  <feature.icon className="h-6 w-6" style={{ color: feature.color }} />
                </div>
                <h3 className="font-serif font-semibold text-lg mb-2" style={{ color: '#2c1810' }}>{feature.title}</h3>
                <p className="text-sm" style={{ color: '#6b5a47' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-2xl mx-auto text-center rounded-2xl p-10 backdrop-blur-sm" style={{ background: 'rgba(253,246,227,0.75)', border: '1px solid rgba(139,105,20,0.15)' }}>
            <p className="text-xl font-serif italic mb-4" style={{ color: '#2c1810' }}>
              "In family life, love is the oil that eases friction, the cement that binds closer together."
            </p>
            <p className="text-sm font-medium" style={{ color: '#8B6914' }}>— Friedrich Nietzsche</p>
          </div>
        </div>

      </div>
    </div>
  )
}