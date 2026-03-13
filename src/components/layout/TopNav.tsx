'use client'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LogOut, User } from 'lucide-react'
import { CURRENCIES, formatMonth } from '@/lib/utils'

interface TopNavProps {
  userName?: string | null
  selectedMonth: string
  onMonthChange: (month: string) => void
  selectedCurrency: string
  onCurrencyChange: (currency: string) => void
}

function getRecentMonths(count = 12): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

export default function TopNav({ userName, selectedMonth, onMonthChange, selectedCurrency, onCurrencyChange }: TopNavProps) {
  const months = getRecentMonths()

  return (
    <header className="fixed top-0 left-60 right-0 h-14 bg-zinc-950 border-b border-zinc-800 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger className="w-44 h-8 text-xs bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700 focus:ring-zinc-600 focus:border-zinc-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {months.map((m) => (
              <SelectItem key={m} value={m} className="text-zinc-200 focus:bg-zinc-800 focus:text-white data-[state=checked]:text-white">
                {formatMonth(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="w-24 h-8 text-xs bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700 focus:ring-zinc-600 focus:border-zinc-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c} className="text-zinc-200 focus:bg-zinc-800 focus:text-white data-[state=checked]:text-white">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-zinc-300">{userName || 'User'}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="h-8 w-8 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
