'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { FamilyTreeCanvas } from '@/components/family-tree/family-tree-canvas'

export default function TreePage() {
  const params = useParams()
  const router = useRouter()
  const familyId = params.familyId as string
  const [family, setFamily] = useState<any>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/auth/login'); return }
      try {
        const familyDoc = await getDoc(doc(db, 'families', familyId))
        if (!familyDoc.exists()) { router.push('/dashboard'); return }
        const familyData = familyDoc.data()
        setFamily({ id: familyDoc.id, ...familyData })
        const role = familyData.members?.[user.uid]?.role
        setCanEdit(role === 'admin' || role === 'editor')
      } catch {
        router.push('/dashboard')
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [familyId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]" style={{ background: 'linear-gradient(135deg, #fdf6e3, #ede8d8)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <FamilyTreeCanvas
        familyId={familyId}
        familyName={family?.name || ''}
        initialMembers={[]}
        initialRelationships={[]}
        canEdit={canEdit}
      />
    </div>
  )
}