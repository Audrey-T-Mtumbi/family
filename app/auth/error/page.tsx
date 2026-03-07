import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TreesIcon as Tree, AlertCircle, ArrowLeft } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <Tree className="h-8 w-8 text-primary" />
            <span className="text-2xl font-serif font-semibold text-foreground">Family Album</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="font-serif text-2xl">Authentication Error</CardTitle>
            <CardDescription className="text-base">
              Something went wrong during authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              This could happen if your verification link has expired or has already been used.
              Please try signing in or create a new account.
            </p>

            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/auth/login">
                  Try Signing In
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/auth/sign-up">
                  Create New Account
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
