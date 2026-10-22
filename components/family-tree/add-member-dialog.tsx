'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Camera, User } from 'lucide-react'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

type Gender = 'male' | 'female' | 'other' | null

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    firstName: string
    lastName: string
    birthDate: string | null
    deathDate: string | null
    bio: string | null
    gender: Gender
    avatarUrl: string | null
  }) => Promise<void>
}

const GENDER_COLORS: Record<string, string> = {
  male: '#3b82f6',
  female: '#ec4899',
  other: '#8b5cf6',
}

export function AddMemberDialog({ open, onOpenChange, onSubmit }: AddMemberDialogProps) {
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [deathDate, setDeathDate] = useState('')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState<Gender>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let avatarUrl: string | null = null

    // Upload photo if selected
    if (photoFile) {
      setUploadingPhoto(true)
      try {
        const storageRef = ref(storage, `avatars/${Date.now()}-${photoFile.name}`)
        await uploadBytes(storageRef, photoFile)
        avatarUrl = await getDownloadURL(storageRef)
      } catch (err) {
        console.error('Photo upload failed:', err)
      }
      setUploadingPhoto(false)
    }

    await onSubmit({
      firstName,
      lastName,
      birthDate: birthDate || null,
      deathDate: deathDate || null,
      bio: bio || null,
      gender,
      avatarUrl,
    })

    // Reset
    setFirstName('')
    setLastName('')
    setBirthDate('')
    setDeathDate('')
    setBio('')
    setGender(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    setLoading(false)
  }

  const accentColor = gender ? GENDER_COLORS[gender] : '#4a7c59'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" style={{ borderRadius: 20, border: '1px solid rgba(139,105,20,0.2)' }}>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl" style={{ color: '#2c1810' }}>
            🌿 Add Family Member
          </DialogTitle>
          <DialogDescription style={{ color: '#6b5a47' }}>
            Add a new person to your family tree
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 90, height: 90,
                borderRadius: '50%',
                border: `3px dashed ${accentColor}`,
                background: photoPreview ? 'transparent' : `${accentColor}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s',
                boxShadow: `0 0 0 4px ${accentColor}20`,
              }}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Camera className="h-6 w-6 mx-auto mb-1" style={{ color: accentColor }} />
                  <span style={{ fontSize: 10, color: accentColor }}>Add Photo</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            {photoPreview && (
              <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null) }} style={{ fontSize: 11, color: '#b85c38', cursor: 'pointer', background: 'none', border: 'none' }}>
                Remove photo
              </button>
            )}
          </div>

          {/* Gender Selection */}
          <div className="space-y-2">
            <Label style={{ color: '#2c1810', fontWeight: 600 }}>Gender</Label>
            <div className="flex gap-2">
              {[
                { value: 'male', label: '♂ Male', color: '#3b82f6', bg: '#eff6ff' },
                { value: 'female', label: '♀ Female', color: '#ec4899', bg: '#fdf2f8' },
                { value: 'other', label: '⚥ Other', color: '#8b5cf6', bg: '#f5f3ff' },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(gender === g.value as Gender ? null : g.value as Gender)}
                  style={{
                    flex: 1, padding: '6px 4px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    border: `2px solid ${gender === g.value ? g.color : 'transparent'}`,
                    background: gender === g.value ? g.bg : 'rgba(0,0,0,0.03)',
                    color: gender === g.value ? g.color : '#6b5a47',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName" style={{ color: '#2c1810', fontWeight: 600 }}>First Name *</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. John" required style={{ borderColor: `${accentColor}40` }} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" style={{ color: '#2c1810', fontWeight: 600 }}>Last Name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Mensah" style={{ borderColor: `${accentColor}40` }} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="birthDate" style={{ color: '#2c1810', fontWeight: 600 }}>🎂 Birth Date</Label>
              <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{ borderColor: `${accentColor}40` }} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="deathDate" style={{ color: '#2c1810', fontWeight: 600 }}>✝ Death Date</Label>
              <Input id="deathDate" type="date" value={deathDate} onChange={(e) => setDeathDate(e.target.value)} style={{ borderColor: `${accentColor}40` }} />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <Label htmlFor="bio" style={{ color: '#2c1810', fontWeight: 600 }}>📖 Bio / Life Story</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Share something about this person's life, achievements, or personality..." rows={3} style={{ borderColor: `${accentColor}40` }} />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} style={{ borderColor: 'rgba(139,105,20,0.3)', color: '#6b5a47' }}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !firstName.trim()} style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, border: 'none' }}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{uploadingPhoto ? 'Uploading photo...' : 'Adding...'}</>
              ) : (
                <><User className="mr-2 h-4 w-4" />Add to Tree</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}