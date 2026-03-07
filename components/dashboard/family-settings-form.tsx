'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Loader2, RefreshCw, Copy, Check } from 'lucide-react'
import { CopyInviteCode } from './copy-invite-code'

interface Family {
  id: string
  name: string
  description: string | null
  invite_code: string
}

interface Member {
  id: string
  role: string
  user_id: string
  profiles: {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
  } | null
}

interface FamilySettingsFormProps {
  family: Family
  members: Member[]
  currentUserId: string
}

export function FamilySettingsForm({ family, members, currentUserId }: FamilySettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [name, setName] = useState(family.name)
  const [description, setDescription] = useState(family.description || '')
  const [inviteCode, setInviteCode] = useState(family.invite_code)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('families')
      .update({
        name,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', family.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    }

    setLoading(false)
  }

  const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleRegenerateCode = async () => {
    setRegenerating(true)
    const newCode = generateInviteCode()

    const { error } = await supabase
      .from('families')
      .update({ invite_code: newCode })
      .eq('id', family.id)

    if (!error) {
      setInviteCode(newCode)
      router.refresh()
    }

    setRegenerating(false)
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from('family_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (!error) {
      router.refresh()
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId)

    if (!error) {
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href={`/dashboard/family/${family.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Family
        </Link>
      </Button>

      {/* Family Details */}
      <Card>
        <CardHeader>
          <CardTitle>Family Details</CardTitle>
          <CardDescription>
            Update your family&apos;s name and description
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm text-primary bg-primary/10 rounded-md">
                Family updated successfully!
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Family Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your family..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invite Code */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Code</CardTitle>
          <CardDescription>
            Share this code with family members to let them join
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CopyInviteCode code={inviteCode} />
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate New Code
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Generate New Invite Code?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will invalidate the current invite code. Anyone with the old code will no longer be able to join.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRegenerateCode} disabled={regenerating}>
                  {regenerating ? 'Generating...' : 'Generate New Code'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Members Management */}
      <Card>
        <CardHeader>
          <CardTitle>Family Members</CardTitle>
          <CardDescription>
            Manage member roles and access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              const isCurrentUser = member.user_id === currentUserId
              
              return (
                <div key={member.id} className="flex items-center gap-4 py-2">
                  <Avatar>
                    <AvatarImage src={member.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {member.profiles?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {member.profiles?.full_name || 'Unknown'}
                      {isCurrentUser && <span className="text-muted-foreground"> (you)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.profiles?.email}
                    </p>
                  </div>
                  
                  {isCurrentUser ? (
                    <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full capitalize">
                      {member.role}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.id, value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {member.profiles?.full_name || 'this member'} from the family. They can rejoin using the invite code.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleRemoveMember(member.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
