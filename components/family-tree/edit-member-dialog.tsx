'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Trash2 } from 'lucide-react'

type Gender = 'male' | 'female' | 'other' | null

interface TreeMember {
  id: string
  first_name: string
  last_name: string | null
  birth_date: string | null
  death_date: string | null
  bio: string | null
  gender?: Gender
}

interface EditMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: TreeMember | null
  onSubmit: (data: {
    firstName: string
    lastName: string
    birthDate: string | null
    deathDate: string | null
    bio: string | null
    gender: Gender
  }) => Promise<void>
  onDelete: () => Promise<void>
}

const GENDER_OPTIONS: { value: Gender; label: string; emoji: string; color: string; border: string; bg: string }[] = [
  { value: 'male',   label: 'Male',        emoji: '♂', color: '#1d4ed8', border: '#3b82f6', bg: '#eff6ff' },
  { value: 'female', label: 'Female',      emoji: '♀', color: '#be185d', border: '#ec4899', bg: '#fdf2f8' },
  { value: 'other',  label: 'Other',       emoji: '⚧', color: '#6d28d9', border: '#8b5cf6', bg: '#f5f3ff' },
  { value: null,     label: 'Unspecified', emoji: '?', color: '#4a7c59', border: '#4a7c59', bg: '#f0fdf4' },
]

export function EditMemberDialog({
  open,
  onOpenChange,
  member,
  onSubmit,
  onDelete,
}: EditMemberDialogProps) {
  const [loading, setLoading]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [deathDate, setDeathDate] = useState('')
  const [bio,       setBio]       = useState('')
  const [gender,    setGender]    = useState<Gender>(null)

  useEffect(() => {
    if (member) {
      setFirstName(member.first_name)
      setLastName(member.last_name || '')
      setBirthDate(member.birth_date || '')
      setDeathDate(member.death_date || '')
      setBio(member.bio || '')
      setGender(member.gender ?? null)
    }
  }, [member])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit({
      firstName,
      lastName,
      birthDate: birthDate || null,
      deathDate: deathDate || null,
      bio: bio || null,
      gender,
    })
    setLoading(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
  }

  if (!member) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit Family Member</DialogTitle>
          <DialogDescription>Update information for this family member</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editFirstName">First Name *</Label>
              <Input
                id="editFirstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLastName">Last Name</Label>
              <Input
                id="editLastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Gender selector */}
          <div className="space-y-2">
            <Label>Gender</Label>
            <div className="grid grid-cols-4 gap-2">
              {GENDER_OPTIONS.map((opt) => {
                const isSelected = gender === opt.value
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    style={{
                      border: `2px solid ${isSelected ? opt.border : '#e2e8f0'}`,
                      background: isSelected ? opt.bg : '#fff',
                      borderRadius: 10,
                      padding: '8px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s',
                      boxShadow: isSelected ? `0 0 0 3px ${opt.border}30` : 'none',
                    }}
                  >
                    <span style={{ fontSize: 20, color: isSelected ? opt.color : '#94a3b8' }}>
                      {opt.emoji}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: isSelected ? opt.color : '#64748b',
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}>
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editBirthDate">Birth Date</Label>
              <Input
                id="editBirthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDeathDate">Death Date</Label>
              <Input
                id="editDeathDate"
                type="date"
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="editBio">Bio</Label>
            <Textarea
              id="editBio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short description..."
              rows={3}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" className="sm:mr-auto">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Family Member?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove {member.first_name} from the family tree. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</>
                    ) : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !firstName.trim()}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}