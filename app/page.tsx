import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  TreesIcon as Tree, 
  Users, 
  Image, 
  Calendar, 
  Shield, 
  Heart,
  ArrowRight,
  Sparkles
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Tree className="h-7 w-7 text-primary" />
            <span className="text-xl font-serif font-semibold">Family Album</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Preserve Your Legacy
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-balance mb-6">
              Where Family Stories{' '}
              <span className="text-primary">Come Alive</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto">
              Build your family tree, share precious memories, and create a living legacy 
              that connects generations. Your family&apos;s story deserves to be told.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="text-base">
                <Link href="/auth/sign-up">
                  Start Your Family Tree
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link href="/auth/login">
                  Sign In to Continue
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Everything Your Family Needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete platform to document, share, and celebrate your family heritage.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Tree className="h-6 w-6" />}
              title="Interactive Family Tree"
              description="Build a beautiful, interactive family tree with drag-and-drop simplicity. Connect generations and discover your roots."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Private Family Space"
              description="Create private family groups where members can connect, share updates, and stay in touch across distances."
            />
            <FeatureCard
              icon={<Image className="h-6 w-6" />}
              title="Memory Vault"
              description="Store and organize photos, videos, and documents. Tag family members and create albums for special occasions."
            />
            <FeatureCard
              icon={<Calendar className="h-6 w-6" />}
              title="Family Timeline"
              description="See your family history unfold on a beautiful timeline. Document milestones, birthdays, and important events."
            />
            <FeatureCard
              icon={<Heart className="h-6 w-6" />}
              title="Social Features"
              description="Share moments, react to posts, and keep the conversation going with comments and reactions."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Privacy First"
              description="Your family data stays private. Invite-only access ensures only family members can view your content."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-primary/5 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Start Building Your Legacy Today
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join families around the world who are preserving their stories for future generations.
            </p>
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Tree className="h-5 w-5 text-primary" />
              <span className="font-serif font-semibold">Family Album</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Preserving family legacies, one story at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
