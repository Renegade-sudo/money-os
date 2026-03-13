import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized } from '@/lib/api-helpers'
import { getMonthlyEquivalent } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)

  const [
    incomeEntries,
    allocation,
    debts,
    receivables,
    billEntries,
    savingsEntries,
    investments,
    assets,
    lifestyleEntries,
    softwareSubs,
  ] = await Promise.all([
    prisma.incomeEntry.findMany({ where: { userId: user.id, month } }),
    prisma.moneyAllocation.findFirst({ where: { userId: user.id, month } }),
    prisma.debt.findMany({ where: { userId: user.id } }),
    prisma.receivable.findMany({ where: { userId: user.id, status: { not: 'paid' } } }),
    prisma.billEntry.findMany({ where: { userId: user.id, month } }),
    prisma.savingsEntry.findMany({ where: { userId: user.id } }),
    prisma.investment.findMany({ where: { userId: user.id } }),
    prisma.asset.findMany({ where: { userId: user.id } }),
    prisma.lifestyleEntry.findMany({ where: { userId: user.id, month } }),
    prisma.softwareSubscription.findMany({ where: { userId: user.id, status: 'active' } }),
  ])

  const totalIncome = incomeEntries.reduce((s, e) => s + e.amount, 0)
  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + d.remainingBalance, 0)
  const totalReceivablesPending = receivables.reduce((s, r) => s + (r.amountDue - r.amountReceived), 0)

  const savingsBalance = savingsEntries.reduce((s, e) => {
    return e.actionType === 'withdrawal' ? s - e.amount : s + e.amount
  }, 0)

  const totalBillsSpent = billEntries.reduce((s, b) => s + b.actualSpent, 0)
  const totalBillsAllocated = billEntries.reduce((s, b) => s + b.allocatedAmount, 0)

  const totalInvestments = investments.reduce((s, i) => s + i.amount, 0)
  const totalAssetsValue = assets.reduce((s, a) => s + a.estimatedValue, 0)
  const totalLifestyle = lifestyleEntries.reduce((s, l) => s + l.amount, 0)

  const monthlySwCost = softwareSubs.reduce((s, sw) => s + getMonthlyEquivalent(sw.cost, sw.billingCycle), 0)
  const yearlySwCost = softwareSubs.reduce((s, sw) => s + (sw.billingCycle === 'yearly' ? sw.cost : sw.billingCycle === 'quarterly' ? sw.cost * 4 : sw.cost * 12), 0)

  // Income trend for last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  const trendEntries = await prisma.incomeEntry.groupBy({
    by: ['month'],
    where: { userId: user.id },
    _sum: { amount: true },
    orderBy: { month: 'asc' },
  })

  // Income by source for this month
  const incomeBySource: Record<string, number> = {}
  for (const e of incomeEntries) {
    incomeBySource[e.incomeType] = (incomeBySource[e.incomeType] || 0) + e.amount
  }

  // Debt breakdown
  const debtBreakdown = debts
    .filter(d => d.status === 'active')
    .map(d => ({ name: d.creditorName, value: d.remainingBalance }))

  // Recent activity
  const recentIncome = await prisma.incomeEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5 })
  const recentDebtPmts = await prisma.debtPayment.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 3 })
  const recentSoftware = await prisma.softwareSubscription.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 3 })

  return NextResponse.json({
    summary: {
      totalIncome,
      totalDebt,
      totalReceivablesPending,
      savingsBalance,
      totalBillsSpent,
      totalBillsAllocated,
      totalInvestments,
      totalAssetsValue,
      totalLifestyle,
      monthlySwCost,
      yearlySwCost,
      activeSoftwareSubs: softwareSubs.length,
    },
    allocation,
    charts: {
      incomeTrend: trendEntries.map(e => ({ month: e.month, amount: e._sum.amount || 0 })),
      incomeBySource: Object.entries(incomeBySource).map(([name, value]) => ({ name, value })),
      debtBreakdown,
    },
    recentActivity: {
      income: recentIncome,
      debtPayments: recentDebtPmts,
      software: recentSoftware,
    },
    alerts: {
      overBudgetBills: billEntries.filter(b => b.actualSpent > b.allocatedAmount && b.allocatedAmount > 0),
      upcomingSoftware: softwareSubs.filter(sw => {
        if (!sw.nextDueDate) return false
        const daysUntil = Math.ceil((new Date(sw.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return daysUntil <= 7 && daysUntil >= 0
      }),
    },
  })
}
