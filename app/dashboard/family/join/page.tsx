'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Users } from 'lucide-react'

export default function JoinFamilyPage() {
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Find family by invite code
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id, name')
        .eq('invite_code', inviteCode.toUpperCase().trim())
        .single()

      if (familyError || !family) {
        throw new Error('Invalid invite code. Please check and try again.')
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', family.id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        throw new Error('You are already a member of this family.')
      }

      // Join as member
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: user.id,
          role: 'member',
        })

      if (memberError) throw memberError

      router.push(`/dashboard/family/${family.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join family')
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Users className="h-6 w-6" />
            </div>
            <CardTitle className="font-serif text-2xl">Join a Family</CardTitle>
            <CardDescription>
              Enter the invite code shared by a family admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code *</Label>
                <Input
                  id="inviteCode"
                  placeholder="e.g., ABC12345"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  maxLength={8}
                  className="uppercase tracking-widest text-center text-lg font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Ask a family admin for the 8-character invite code
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading || inviteCode.length !== 8}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Family'
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
