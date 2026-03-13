import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) redirect('/login')

  const userName = session.user.name ?? session.user.email ?? ''

  return (
    <DashboardLayout userName={userName}>
      {children}
    </DashboardLayout>
  )
}
