import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FamilySettingsForm } from '@/components/dashboard/family-settings-form'

interface FamilySettingsPageProps {
  params: Promise<{ familyId: string }>
}

export default async function FamilySettingsPage({ params }: FamilySettingsPageProps) {
  const { familyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Check membership and role
  const { data: membership } = await supabase
    .from('family_members')
    .select('role')
    .eq('family_id', familyId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    redirect(`/dashboard/family/${familyId}`)
  }

  // Fetch family details
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single()

  if (!family) {
    notFound()
  }

  // Fetch members for management
  const { data: members } = await supabase
    .from('family_members')
    .select(`
      id,
      role,
      user_id,
      profiles (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('family_id', familyId)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Family Settings</h1>
          <p className="text-muted-foreground">
            Manage {family.name} settings and members
          </p>
        </div>

        <FamilySettingsForm 
          family={family} 
          members={members || []}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
