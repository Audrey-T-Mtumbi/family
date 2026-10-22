'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  TreesIcon as Tree,
  Home,
  Users,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
} from 'lucide-react'

interface DashboardNavProps {
  user: any
  profile: any
  families: Array<{
    id: string
    name: string
    description: string | null
    cover_image_url: string | null
    role: string
  }>
}

export function DashboardNav({ user, profile, families }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut(auth)
    router.push('/')
  }

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  const familyIdMatch = pathname.match(/\/dashboard\/family\/([^/]+)/)
  const currentFamilyId = familyIdMatch ? familyIdMatch[1] : null
  const currentFamily = families.find(f => f.id === currentFamilyId)

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Tree className="h-6 w-6 text-primary" />
              <span className="text-lg font-serif font-semibold hidden sm:inline">Family Album</span>
            </Link>

            {families.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {currentFamily ? currentFamily.name : 'Select Family'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Your Families</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {families.map((family) => (
                    <DropdownMenuItem key={family.id} asChild>
                      <Link href={`/dashboard/family/${family.id}`} className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        {family.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/family/new" className="cursor-pointer">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Family
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/family/join" className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      Join a Family
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link href="/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
              {currentFamily && (
                <Button
                  variant={pathname.includes('/tree') ? 'secondary' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/family/${currentFamily.id}/tree`}>
                    <Tree className="h-4 w-4 mr-2" />
                    Tree
                  </Link>
                </Button>
              )}
            </nav>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(currentUser?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{currentUser?.email || 'User'}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {signingOut ? 'Signing out...' : 'Sign Out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}