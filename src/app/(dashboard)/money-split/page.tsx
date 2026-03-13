'use client'
import { useEffect, useState } from 'react'
import { useAppContext } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatMonth } from '@/lib/utils'
import { Plus, CheckCircle, Edit } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#ef4444', '#06b6d4', '#f59e0b', '#ec4899']

interface Plan {
  id: string
  planName: string
  isActive: boolean
  tithePercent: number
  billsPercent: number
  savingsPercent: number
  debtPercent: number
  investmentPercent: number
  assetsPercent: number
  lifestylePercent: number
}

interface Allocation {
  month: string
  totalIncome: number
  titheAmount: number
  billsAmount: number
  savingsAmount: number
  debtAmount: number
  investmentAmount: number
  assetsAmount: number
  lifestyleAmount: number
  plan: Plan
}

const defaultPlan = {
  planName: '',
  tithePercent: 10,
  billsPercent: 50,
  savingsPercent: 10,
  debtPercent: 15,
  investmentPercent: 5,
  assetsPercent: 5,
  lifestylePercent: 5,
}

export default function MoneySplitPage() {
  const { selectedMonth, selectedCurrency } = useAppContext()
  const [plans, setPlans] = useState<Plan[]>([])
  const [allocation, setAllocation] = useState<Allocation | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultPlan)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchData = () => {
    fetch('/api/money-plans').then(r => r.json()).then(setPlans)
    fetch(`/api/allocations?month=${selectedMonth}`).then(r => r.json()).then(d => setAllocation(d[0] || null))
  }

  useEffect(() => { fetchData() }, [selectedMonth])

  const total = form.tithePercent + form.billsPercent + form.savingsPercent + form.debtPercent + form.investmentPercent + form.assetsPercent + form.lifestylePercent

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (Math.abs(total - 100) > 0.01) { setError('Percentages must sum to 100%'); return }
    setSaving(true)
    const res = await fetch('/api/money-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, isActive: false }),
    })
    setSaving(false)
    if (res.ok) { setOpen(false); setForm(defaultPlan); fetchData() }
    else { const d = await res.json(); setError(d.error) }
  }

  async function setActive(id: string) {
    await fetch(`/api/money-plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    })
    fetchData()
  }

  const fmt = (n: number) => formatCurrency(n, selectedCurrency)
  const activePlan = plans.find(p => p.isActive)

  const allocationData = allocation ? [
    { name: 'Tithe', value: allocation.titheAmount },
    { name: 'Bills', value: allocation.billsAmount },
    { name: 'Savings', value: allocation.savingsAmount },
    { name: 'Debt', value: allocation.debtAmount },
    { name: 'Investments', value: allocation.investmentAmount },
    { name: 'Assets', value: allocation.assetsAmount },
    { name: 'Lifestyle', value: allocation.lifestyleAmount },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Money Split</h1>
          <p className="text-zinc-500 text-sm mt-1">Allocation for {formatMonth(selectedMonth)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4" /> New Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Money Plan</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Plan Name</Label>
                <Input placeholder="e.g. Debt Season Plan" value={form.planName} onChange={e => setForm({ ...form, planName: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'tithePercent', label: 'Tithe %' },
                  { key: 'billsPercent', label: 'Bills %' },
                  { key: 'savingsPercent', label: 'Savings %' },
                  { key: 'debtPercent', label: 'Debt %' },
                  { key: 'investmentPercent', label: 'Investments %' },
                  { key: 'assetsPercent', label: 'Assets %' },
                  { key: 'lifestylePercent', label: 'Lifestyle %' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={(form as Record<string, number | string>)[key]}
                      onChange={e => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                ))}
              </div>
              <div className={`text-sm font-medium ${Math.abs(total - 100) < 0.01 ? 'text-emerald-400' : 'text-red-400'}`}>
                Total: {total.toFixed(1)}% {Math.abs(total - 100) < 0.01 ? '✓' : '(must equal 100%)'}
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>Create Plan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plans List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Your Plans</h2>
          {plans.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-zinc-600 text-sm">No plans yet. Create one to get started.</CardContent></Card>
          ) : plans.map(plan => (
            <Card key={plan.id} className={plan.isActive ? 'border-emerald-600' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{plan.planName}</span>
                    {plan.isActive && <Badge variant="success">Active</Badge>}
                  </div>
                  {!plan.isActive && (
                    <Button size="sm" variant="outline" onClick={() => setActive(plan.id)}>
                      <CheckCircle className="w-3.5 h-3.5" /> Set Active
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    { label: 'Tithe', v: plan.tithePercent },
                    { label: 'Bills', v: plan.billsPercent },
                    { label: 'Savings', v: plan.savingsPercent },
                    { label: 'Debt', v: plan.debtPercent },
                    { label: 'Invest', v: plan.investmentPercent },
                    { label: 'Assets', v: plan.assetsPercent },
                    { label: 'Lifestyle', v: plan.lifestylePercent },
                  ].map(({ label, v }) => (
                    <div key={label} className="bg-zinc-800 rounded p-2 text-center">
                      <div className="text-zinc-400">{label}</div>
                      <div className="text-white font-semibold">{v}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Allocation Visualization */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Allocation This Month</h2>
          {!allocation ? (
            <Card><CardContent className="py-8 text-center text-zinc-600 text-sm">Log income to see your allocation breakdown.</CardContent></Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 mb-1">Total Income Allocated</p>
                  <p className="text-3xl font-bold text-emerald-400">{fmt(allocation.totalIncome)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={allocationData.filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50}>
                        {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} formatter={(v) => fmt(Number(v))} />
                      <Legend formatter={(v) => <span className="text-xs text-zinc-400">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <div className="space-y-2">
                {allocationData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-zinc-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
