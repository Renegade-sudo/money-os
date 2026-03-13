'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

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

const defaultPlan = { planName: '', tithePercent: 10, billsPercent: 50, savingsPercent: 10, debtPercent: 15, investmentPercent: 5, assetsPercent: 5, lifestylePercent: 5 }

export default function SettingsPage() {
  const { data: session } = useSession()
  const userName = session?.user?.name ?? ''
  const userEmail = session?.user?.email ?? ''
  const [plans, setPlans] = useState<Plan[]>([])
  const [open, setOpen] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState(defaultPlan)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchPlans = () => fetch('/api/money-plans').then(r => r.json()).then(setPlans)
  useEffect(() => { fetchPlans() }, [])

  const total = form.tithePercent + form.billsPercent + form.savingsPercent + form.debtPercent + form.investmentPercent + form.assetsPercent + form.lifestylePercent

  function openEdit(plan: Plan) {
    setEditPlan(plan)
    setForm({
      planName: plan.planName,
      tithePercent: plan.tithePercent,
      billsPercent: plan.billsPercent,
      savingsPercent: plan.savingsPercent,
      debtPercent: plan.debtPercent,
      investmentPercent: plan.investmentPercent,
      assetsPercent: plan.assetsPercent,
      lifestylePercent: plan.lifestylePercent,
    })
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (Math.abs(total - 100) > 0.01) { setError('Percentages must sum to 100%'); return }
    setSaving(true)
    if (editPlan) {
      await fetch(`/api/money-plans/${editPlan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/money-plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false)
    setOpen(false)
    setEditPlan(null)
    setForm(defaultPlan)
    fetchPlans()
  }

  async function deletePlan(id: string) {
    if (!confirm('Delete this plan?')) return
    await fetch(`/api/money-plans/${id}`, { method: 'DELETE' })
    fetchPlans()
  }

  async function setActivePlan(id: string) {
    await fetch(`/api/money-plans/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: true }) })
    fetchPlans()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Configure your money rules and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-sm text-zinc-300">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xl font-bold">
              {userName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-white">{userName}</p>
              <p className="text-zinc-500 text-sm">{userEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Money Plans */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-zinc-300">Money Allocation Plans</CardTitle>
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditPlan(null); setForm(defaultPlan); setError('') } }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5" /> New Plan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle></DialogHeader>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Plan Name</Label>
                    <Input placeholder="e.g. Debt Season Plan" value={form.planName} onChange={e => setForm({ ...form, planName: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'tithePercent', label: 'Tithe %' },
                      { key: 'billsPercent', label: 'Bills %' },
                      { key: 'savingsPercent', label: 'Savings %' },
                      { key: 'debtPercent', label: 'Debt Repayment %' },
                      { key: 'investmentPercent', label: 'Investments %' },
                      { key: 'assetsPercent', label: 'Assets %' },
                      { key: 'lifestylePercent', label: 'Lifestyle %' },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1.5">
                        <Label>{label}</Label>
                        <Input
                          type="number" step="0.1" min="0" max="100"
                          value={(form as Record<string, number | string>)[key]}
                          onChange={e => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    ))}
                  </div>
                  <div className={`p-3 rounded-lg ${Math.abs(total - 100) < 0.01 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'} text-sm font-medium`}>
                    Total: {total.toFixed(1)}% {Math.abs(total - 100) < 0.01 ? '— Perfect!' : '— Must equal 100%'}
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditPlan(null); setForm(defaultPlan) }}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{editPlan ? 'Update Plan' : 'Create Plan'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-4">No plans yet. Create your first allocation plan.</p>
          ) : (
            <div className="space-y-3">
              {plans.map(plan => (
                <div key={plan.id} className={`border rounded-lg p-4 ${plan.isActive ? 'border-emerald-600 bg-emerald-900/10' : 'border-zinc-800'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{plan.planName}</span>
                      {plan.isActive && <Badge variant="success">Active</Badge>}
                    </div>
                    <div className="flex gap-2">
                      {!plan.isActive && (
                        <Button size="sm" variant="outline" onClick={() => setActivePlan(plan.id)}>
                          <CheckCircle className="w-3.5 h-3.5" /> Activate
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openEdit(plan)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => deletePlan(plan.id)} className="text-zinc-600 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-xs text-center">
                    {[
                      { label: 'Tithe', v: plan.tithePercent },
                      { label: 'Bills', v: plan.billsPercent },
                      { label: 'Savings', v: plan.savingsPercent },
                      { label: 'Debt', v: plan.debtPercent },
                      { label: 'Invest', v: plan.investmentPercent },
                      { label: 'Assets', v: plan.assetsPercent },
                      { label: 'Lifestyle', v: plan.lifestylePercent },
                    ].map(({ label, v }) => (
                      <div key={label} className="bg-zinc-800 rounded p-1.5">
                        <div className="text-zinc-500 text-xs">{label}</div>
                        <div className="text-white font-bold">{v}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card>
        <CardHeader><CardTitle className="text-sm text-zinc-300">How Allocation Works</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>When you log income, the system automatically:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Sums all income for the month</li>
              <li>Applies your active plan percentages</li>
              <li>Stores the calculated allocation amounts</li>
              <li>Updates if you add or remove income entries</li>
            </ol>
            <p className="mt-3 text-zinc-500 text-xs">Only one plan can be active at a time. Switching plans recalculates the current month&apos;s allocation.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
