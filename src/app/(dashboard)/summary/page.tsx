'use client'
import { useEffect, useState } from 'react'
import { useAppContext } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatMonth } from '@/lib/utils'
import { TrendingUp, Receipt, PiggyBank, BarChart2, Sparkles, CreditCard, Monitor, Users, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface SummaryData {
  month: string
  totalIncome: number
  billsSpent: number
  savingsTotal: number
  investmentsTotal: number
  lifestyleTotal: number
  debtPaid: number
  softwareCost: number
  receivablesPending: number
  totalDebt: number
  totalExpenses: number
  cashRemaining: number
  breakdown: {
    income: { source: string; amount: number; type: string }[]
    bills: { category: string; allocated: number; spent: number; balance: number }[]
    savings: { type: string; amount: number; action: string }[]
    investments: { type: string; symbol?: string; amount: number }[]
    lifestyle: { type: string; description: string; amount: number }[]
  }
}

const CHART_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#06b6d4', '#ec4899', '#f59e0b', '#8b5cf6']

export default function SummaryPage() {
  const { selectedMonth, selectedCurrency } = useAppContext()
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/summary?month=${selectedMonth}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [selectedMonth])

  const fmt = (n: number) => formatCurrency(n, selectedCurrency)

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">Loading summary...</div>
  if (!data) return null

  const summaryItems = [
    { label: 'Total Income', value: data.totalIncome, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
    { label: 'Bills Spent', value: data.billsSpent, icon: Receipt, color: 'text-purple-400', bg: 'bg-purple-900/30' },
    { label: 'Savings', value: data.savingsTotal, icon: PiggyBank, color: 'text-blue-400', bg: 'bg-blue-900/30' },
    { label: 'Investments', value: data.investmentsTotal, icon: BarChart2, color: 'text-cyan-400', bg: 'bg-cyan-900/30' },
    { label: 'Lifestyle', value: data.lifestyleTotal, icon: Sparkles, color: 'text-pink-400', bg: 'bg-pink-900/30' },
    { label: 'Debt Paid', value: data.debtPaid, icon: CreditCard, color: 'text-red-400', bg: 'bg-red-900/30' },
    { label: 'Software', value: data.softwareCost, icon: Monitor, color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
    { label: 'Receivables Pending', value: data.receivablesPending, icon: Users, color: 'text-orange-400', bg: 'bg-orange-900/30' },
  ]

  const cashflowData = [
    { name: 'Income', value: data.totalIncome },
    { name: 'Bills', value: -data.billsSpent },
    { name: 'Savings', value: -data.savingsTotal },
    { name: 'Invest', value: -data.investmentsTotal },
    { name: 'Lifestyle', value: -data.lifestyleTotal },
    { name: 'Debt', value: -data.debtPaid },
    { name: 'Software', value: -data.softwareCost },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Monthly Summary</h1>
        <p className="text-zinc-500 text-sm mt-1">{formatMonth(selectedMonth)} — Complete Financial Overview</p>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryItems.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{fmt(value)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cash Remaining */}
      <Card className={`border-2 ${data.cashRemaining >= 0 ? 'border-emerald-600' : 'border-red-600'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Cash Remaining After All Outflows</p>
              <p className={`text-4xl font-bold mt-1 ${data.cashRemaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(data.cashRemaining)}</p>
            </div>
            <div className="text-right text-sm text-zinc-500">
              <p>Total Debt: <span className="text-red-400 font-medium">{fmt(data.totalDebt)}</span></p>
              <p className="mt-1">Total Outflows: <span className="text-white font-medium">{fmt(data.totalExpenses + data.savingsTotal + data.investmentsTotal)}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cashflow chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-300">Cashflow Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cashflowData}>
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} formatter={(v) => [fmt(Math.abs(Number(v))), Number(v) < 0 ? 'Outflow' : 'Inflow']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {cashflowData.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= 0 ? '#10b981' : CHART_COLORS[i] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-zinc-300">Income Sources</CardTitle></CardHeader>
          <CardContent>
            {data.breakdown.income.length === 0 ? <p className="text-zinc-600 text-sm">No income this month</p> :
              <div className="space-y-2">
                {data.breakdown.income.map((e, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-zinc-800 last:border-0">
                    <div>
                      <p className="text-sm text-white">{e.source}</p>
                      <p className="text-xs text-zinc-500">{e.type}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">{fmt(e.amount)}</p>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>

        {/* Bills Breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-zinc-300">Bills Detail</CardTitle></CardHeader>
          <CardContent>
            {data.breakdown.bills.length === 0 ? <p className="text-zinc-600 text-sm">No bills this month</p> :
              <div className="space-y-2">
                {data.breakdown.bills.map((b, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-zinc-800 last:border-0">
                    <div>
                      <p className="text-sm text-white">{b.category}</p>
                      <p className="text-xs text-zinc-500">Allocated: {fmt(b.allocated)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-purple-400">{fmt(b.spent)}</p>
                      <p className={`text-xs ${b.balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{b.balance >= 0 ? '+' : ''}{fmt(b.balance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
