'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingUp,
  SplitSquareHorizontal,
  CreditCard,
  Users,
  Receipt,
  PiggyBank,
  BarChart2,
  Package,
  Sparkles,
  Monitor,
  FileText,
  Settings,
  DollarSign,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income Log', icon: TrendingUp },
  { href: '/money-split', label: 'Money Split', icon: SplitSquareHorizontal },
  { href: '/debt', label: 'Debt Tracker', icon: CreditCard },
  { href: '/receivables', label: 'Receivables', icon: Users },
  { href: '/bills', label: 'Bills & Living', icon: Receipt },
  { href: '/savings', label: 'Savings', icon: PiggyBank },
  { href: '/investments', label: 'Investments', icon: BarChart2 },
  { href: '/assets', label: 'Assets', icon: Package },
  { href: '/lifestyle', label: 'Lifestyle', icon: Sparkles },
  { href: '/software', label: 'Software Tracker', icon: Monitor },
  { href: '/summary', label: 'Monthly Summary', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Money OS</p>
          <p className="text-xs text-zinc-500 mt-0.5">Financial Control Center</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    active
                      ? 'bg-emerald-600/20 text-emerald-400 font-medium'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">Money OS v1.0</p>
      </div>
    </aside>
  )
}
