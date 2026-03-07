import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FamilyTreeCanvas } from '@/components/family-tree/family-tree-canvas'

interface TreePageProps {
  params: Promise<{ familyId: string }>
}

export default async function TreePage({ params }: TreePageProps) {
  const { familyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Check membership
  const { data: membership } = await supabase
    .from('family_members')
    .select('role')
    .eq('family_id', familyId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    notFound()
  }

  // Fetch family info
  const { data: family } = await supabase
    .from('families')
    .select('id, name')
    .eq('id', familyId)
    .single()

  if (!family) {
    notFound()
  }

  // Fetch tree members
  const { data: treeMembers } = await supabase
    .from('tree_members')
    .select('*')
    .eq('family_id', familyId)

  // Fetch relationships
  const { data: relationships } = await supabase
    .from('tree_relationships')
    .select('*')
    .eq('family_id', familyId)

  const canEdit = membership.role === 'admin' || membership.role === 'editor'

  return (
    <div className="h-[calc(100vh-4rem)]">
      <FamilyTreeCanvas
        familyId={familyId}
        familyName={family.name}
        initialMembers={treeMembers || []}
        initialRelationships={relationships || []}
        canEdit={canEdit}
      />
    </div>
  )
}
