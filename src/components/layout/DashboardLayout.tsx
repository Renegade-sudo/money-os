'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import { getCurrentMonth } from '@/lib/utils'
import { FALLBACK_RATES } from '@/lib/currency'

interface AppContextType {
  selectedMonth: string
  setSelectedMonth: (m: string) => void
  selectedCurrency: string
  setSelectedCurrency: (c: string) => void
  exchangeRates: Record<string, number>
}

export const AppContext = createContext<AppContextType>({
  selectedMonth: getCurrentMonth(),
  setSelectedMonth: () => {},
  selectedCurrency: 'USD',
  setSelectedCurrency: () => {},
  exchangeRates: FALLBACK_RATES,
})

export function useAppContext() {
  return useContext(AppContext)
}

interface Props {
  children: React.ReactNode
  userName?: string | null
}

export default function DashboardLayout({ children, userName }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(FALLBACK_RATES)

  useEffect(() => {
    fetch('/api/exchange-rates')
      .then(r => r.json())
      .then(d => { if (d.rates) setExchangeRates(d.rates) })
      .catch(() => {})
  }, [])

  return (
    <AppContext.Provider value={{ selectedMonth, setSelectedMonth, selectedCurrency, setSelectedCurrency, exchangeRates }}>
      <div className="min-h-screen bg-zinc-950">
        <Sidebar />
        <TopNav
          userName={userName}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
        />
        <main className="ml-60 pt-14 min-h-screen bg-gray-50">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AppContext.Provider>
  )
}
