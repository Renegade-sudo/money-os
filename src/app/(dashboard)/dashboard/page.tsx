'use client'
import { useEffect, useState } from 'react'
import { useAppContext } from '@/components/layout/DashboardLayout'
import { formatCurrency, formatMonth } from '@/lib/utils'
import {
  TrendingUp, CreditCard, Users, PiggyBank, Receipt, BarChart2,
  Package, Sparkles, Monitor, AlertTriangle, Clock, ArrowUpRight,
  DollarSign
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

interface DashboardData {
  summary: {
    totalIncome: number; totalDebt: number; totalReceivablesPending: number
    savingsBalance: number; totalBillsSpent: number; totalBillsAllocated: number
    totalInvestments: number; totalAssetsValue: number; totalLifestyle: number
    monthlySwCost: number; yearlySwCost: number; activeSoftwareSubs: number
  }
  allocation: {
    titheAmount: number; billsAmount: number; savingsAmount: number; debtAmount: number
    investmentAmount: number; assetsAmount: number; lifestyleAmount: number; totalIncome: number
  } | null
  charts: {
    incomeTrend: { month: string; amount: number }[]
    incomeBySource: { name: string; value: number }[]
    debtBreakdown: { name: string; value: number }[]
  }
  recentActivity: {
    income: { id: string; sourceName: string; amount: number; currency: string; dateReceived: string }[]
    debtPayments: { id: string; amountPaid: number; currency: string; date: string }[]
    software: { id: string; softwareName: string; cost: number; currency: string }[]
  }
  alerts: {
    overBudgetBills: { id: string; description: string; allocatedAmount: number; actualSpent: number }[]
    upcomingSoftware: { id: string; softwareName: string; nextDueDate: string; cost: number }[]
  }
}

function StatCard({ title, value, icon: Icon, color, sub }: { title: string; value: string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { selectedMonth, selectedCurrency } = useAppContext()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard?month=${selectedMonth}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedMonth])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Loading dashboard...</div>
      </div>
    )
  }

  const s = data?.summary
  const fmt = (n: number) => formatCurrency(n, selectedCurrency)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{formatMonth(selectedMonth)} — Financial Overview</p>
      </div>

      {/* Alerts */}
      {(data?.alerts.overBudgetBills.length || 0) + (data?.alerts.upcomingSoftware.length || 0) > 0 && (
        <div className="space-y-2">
          {data?.alerts.overBudgetBills.map(b => (
            <div key={b.id} className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
              <span className="text-yellow-800">Bill overspent: <strong>{b.description}</strong> — Allocated {fmt(b.allocatedAmount)}, Spent {fmt(b.actualSpent)}</span>
            </div>
          ))}
          {data?.alerts.upcomingSoftware.map(sw => (
            <div key={sw.id} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-blue-800">Subscription due: <strong>{sw.softwareName}</strong> — {fmt(sw.cost)} on {new Date(sw.nextDueDate).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Income This Month" value={fmt(s?.totalIncome || 0)} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title="Total Debt" value={fmt(s?.totalDebt || 0)} icon={CreditCard} color="bg-red-600" />
        <StatCard title="Receivables Pending" value={fmt(s?.totalReceivablesPending || 0)} icon={Users} color="bg-orange-600" />
        <StatCard title="Savings Balance" value={fmt(s?.savingsBalance || 0)} icon={PiggyBank} color="bg-blue-600" />
        <StatCard title="Bills Spent" value={fmt(s?.totalBillsSpent || 0)} icon={Receipt} color="bg-purple-600" sub={`of ${fmt(s?.totalBillsAllocated || 0)} allocated`} />
        <StatCard title="Investments" value={fmt(s?.totalInvestments || 0)} icon={BarChart2} color="bg-cyan-600" />
        <StatCard title="Assets Value" value={fmt(s?.totalAssetsValue || 0)} icon={Package} color="bg-amber-600" />
        <StatCard title="Lifestyle Spending" value={fmt(s?.totalLifestyle || 0)} icon={Sparkles} color="bg-pink-600" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Active Subscriptions" value={`${s?.activeSoftwareSubs || 0}`} icon={Monitor} color="bg-indigo-600" />
        <StatCard title="Monthly Software Cost" value={fmt(s?.monthlySwCost || 0)} icon={DollarSign} color="bg-violet-600" />
        <StatCard title="Yearly Software Cost" value={fmt(s?.yearlySwCost || 0)} icon={DollarSign} color="bg-fuchsia-600" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">Income Monthly Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data?.charts.incomeTrend}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [fmt(Number(v)), 'Income']} />
              <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">Income by Source</p>
          {(data?.charts.incomeBySource.length || 0) === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No income logged this month</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data?.charts.incomeBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {data?.charts.incomeBySource.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} formatter={(v) => fmt(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Allocation + Debt Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">Money Allocation This Month</p>
          {!data?.allocation ? (
            <div className="text-gray-400 text-sm">No allocation yet. Log income to trigger allocation.</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Tithe', amount: data.allocation.titheAmount, color: 'bg-emerald-500' },
                { label: 'Bills', amount: data.allocation.billsAmount, color: 'bg-purple-500' },
                { label: 'Savings', amount: data.allocation.savingsAmount, color: 'bg-blue-500' },
                { label: 'Debt', amount: data.allocation.debtAmount, color: 'bg-red-500' },
                { label: 'Investments', amount: data.allocation.investmentAmount, color: 'bg-cyan-500' },
                { label: 'Assets', amount: data.allocation.assetsAmount, color: 'bg-amber-500' },
                { label: 'Lifestyle', amount: data.allocation.lifestyleAmount, color: 'bg-pink-500' },
              ].map(({ label, amount, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                  <span className="text-sm text-gray-500 w-24">{label}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${color}`}
                      style={{ width: `${Math.min(100, (amount / (data.allocation?.totalIncome || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-900 font-medium w-24 text-right">{fmt(amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">Debt Breakdown</p>
          {(data?.charts.debtBreakdown.length || 0) === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No active debts</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.charts.debtBreakdown} layout="vertical">
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} formatter={(v) => [fmt(Number(v)), 'Remaining']} />
                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</p>
        <div className="space-y-1">
          {data?.recentActivity.income.map(e => (
            <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">Income logged — <span className="text-gray-500">{e.sourceName}</span></p>
                <p className="text-xs text-gray-400">{new Date(e.dateReceived).toLocaleDateString()}</p>
              </div>
              <span className="text-sm font-semibold text-emerald-600">+{formatCurrency(e.amount, e.currency)}</span>
            </div>
          ))}
          {data?.recentActivity.debtPayments.map(p => (
            <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">Debt payment made</p>
                <p className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString()}</p>
              </div>
              <span className="text-sm font-semibold text-red-600">-{formatCurrency(p.amountPaid, p.currency)}</span>
            </div>
          ))}
          {data?.recentActivity.software.map(sw => (
            <div key={sw.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Monitor className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">Software — <span className="text-gray-500">{sw.softwareName}</span></p>
              </div>
              <span className="text-sm text-gray-500">{formatCurrency(sw.cost, sw.currency)}</span>
            </div>
          ))}
          {!data?.recentActivity.income.length && !data?.recentActivity.debtPayments.length && !data?.recentActivity.software.length && (
            <div className="text-center text-gray-400 text-sm py-6">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  )
}
