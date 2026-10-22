import { DashboardNav } from '@/components/dashboard/dashboard-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='min-h-screen flex flex-col'>
      <DashboardNav
        user={null}
        profile={null}
        families={[]}
      />
      <main className='flex-1 bg-background'>
        {children}
      </main>
    </div>
  )
}
