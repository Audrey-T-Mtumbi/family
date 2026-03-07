import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  TreesIcon as Tree, 
  Users, 
  Copy, 
  ArrowRight,
  Settings
} from 'lucide-react'
import { CopyInviteCode } from '@/components/dashboard/copy-invite-code'

interface FamilyPageProps {
  params: Promise<{ familyId: string }>
}

export default async function FamilyPage({ params }: FamilyPageProps) {
  const { familyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch family details
  const { data: family, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single()

  if (error || !family) {
    notFound()
  }

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

  // Fetch family members
  const { data: members } = await supabase
    .from('family_members')
    .select(`
      id,
      role,
      joined_at,
      profiles (
        id,
        full_name,
        avatar_url,
        email
      )
    `)
    .eq('family_id', familyId)

  // Fetch tree member count
  const { count: treeMemberCount } = await supabase
    .from('tree_members')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', familyId)

  const isAdmin = membership.role === 'admin'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Family Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">{family.name}</h1>
            {family.description && (
              <p className="text-muted-foreground">{family.description}</p>
            )}
          </div>
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/family/${familyId}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href={`/dashboard/family/${familyId}/tree`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <Tree className="h-6 w-6" />
                  </div>
                  <CardTitle className="font-serif group-hover:text-primary transition-colors">
                    Family Tree
                  </CardTitle>
                  <CardDescription>
                    {treeMemberCount || 0} members in tree
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    View & edit tree
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center text-accent mb-2">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="font-serif">Members</CardTitle>
                <CardDescription>
                  {members?.length || 0} family members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex -space-x-2">
                  {members?.slice(0, 5).map((member) => (
                    <Avatar key={member.id} className="border-2 border-background h-8 w-8">
                      <AvatarImage src={member.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {member.profiles?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {(members?.length || 0) > 5 && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                      +{(members?.length || 0) - 5}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Family Members</CardTitle>
              <CardDescription>
                People who have joined this family
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members?.map((member) => (
                  <div key={member.id} className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={member.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {member.profiles?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.profiles?.full_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.profiles?.email}
                      </p>
                    </div>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full capitalize">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invite Card */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invite Family Members</CardTitle>
                <CardDescription>
                  Share this code to invite others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CopyInviteCode code={family.invite_code} />
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Family Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{members?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tree Members</span>
                <span className="font-medium">{treeMemberCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Role</span>
                <span className="font-medium capitalize">{membership.role}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
