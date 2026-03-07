import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users, TreesIcon as Tree, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Fetch user's families with member counts
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

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold mb-2">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground">
          Continue building your family legacy
        </p>
      </div>

      {families.length === 0 ? (
        // Empty State
        <div className="max-w-2xl mx-auto py-12">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Tree className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-serif text-2xl">Start Your Family Journey</CardTitle>
              <CardDescription className="text-base">
                Create your first family to begin building your tree and sharing memories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/dashboard/family/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create a Family
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/family/join">
                    <Users className="mr-2 h-4 w-4" />
                    Join with Invite Code
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Family Grid
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Create/Join Cards */}
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/dashboard/family/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/family/join">
                    <Users className="mr-2 h-4 w-4" />
                    Join
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Start or join another family
              </p>
            </CardContent>
          </Card>

          {/* Family Cards */}
          {families.map((family) => (
            <Link key={family.id} href={`/dashboard/family/${family.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Tree className="h-6 w-6" />
                    </div>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full capitalize">
                      {family.role}
                    </span>
                  </div>
                  <CardTitle className="font-serif mt-4 group-hover:text-primary transition-colors">
                    {family.name}
                  </CardTitle>
                  {family.description && (
                    <CardDescription className="line-clamp-2">
                      {family.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    View family
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
