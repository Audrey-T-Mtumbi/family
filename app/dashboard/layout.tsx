import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user's families
  const { data: familyMemberships } = await supabase
    .from('family_members')
    .select(`
      role,
      families (
        id,
        name,
        description,
        cover_image_url
      )
    `)
    .eq('user_id', user.id)

  const families = familyMemberships?.map(m => ({
    ...m.families,
    role: m.role
  })) || []

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav 
        user={user} 
        profile={profile} 
        families={families as Array<{id: string; name: string; description: string | null; cover_image_url: string | null; role: string}>}
      />
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  )
}
