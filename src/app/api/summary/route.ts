import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized } from '@/lib/api-helpers'
import { getMonthlyEquivalent } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)

  const [income, bills, savings, investments, lifestyle, debts, debtPayments, software, receivables] = await Promise.all([
    prisma.incomeEntry.findMany({ where: { userId: user.id, month } }),
    prisma.billEntry.findMany({ where: { userId: user.id, month } }),
    prisma.savingsEntry.findMany({ where: { userId: user.id, month } }),
    prisma.investment.findMany({ where: { userId: user.id, month } }),
    prisma.lifestyleEntry.findMany({ where: { userId: user.id, month } }),
    prisma.debt.findMany({ where: { userId: user.id } }),
    prisma.debtPayment.findMany({ where: { userId: user.id, date: { gte: new Date(month + '-01'), lt: new Date(new Date(month + '-01').getFullYear(), new Date(month + '-01').getMonth() + 1, 1) } } }),
    prisma.softwareSubscription.findMany({ where: { userId: user.id, status: 'active' } }),
    prisma.receivable.findMany({ where: { userId: user.id, status: { not: 'paid' } } }),
  ])

  const totalIncome = income.reduce((s, e) => s + e.amount, 0)
  const billsSpent = bills.reduce((s, b) => s + b.actualSpent, 0)
  const savingsTotal = savings.filter(s => s.actionType !== 'withdrawal').reduce((s, e) => s + e.amount, 0)
  const investmentsTotal = investments.reduce((s, i) => s + i.amount, 0)
  const lifestyleTotal = lifestyle.reduce((s, l) => s + l.amount, 0)
  const debtPaid = debtPayments.reduce((s, d) => s + d.amountPaid, 0)
  const softwareCost = software.reduce((s, sw) => s + getMonthlyEquivalent(sw.cost, sw.billingCycle), 0)
  const receivablesPending = receivables.reduce((s, r) => s + (r.amountDue - r.amountReceived), 0)
  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + d.remainingBalance, 0)

  const totalExpenses = billsSpent + lifestyleTotal + debtPaid + softwareCost
  const cashRemaining = totalIncome - totalExpenses - savingsTotal - investmentsTotal

  return NextResponse.json({
    month,
    totalIncome,
    billsSpent,
    savingsTotal,
    investmentsTotal,
    lifestyleTotal,
    debtPaid,
    softwareCost,
    receivablesPending,
    totalDebt,
    totalExpenses,
    cashRemaining,
    breakdown: {
      income: income.map(e => ({ source: e.sourceName, amount: e.amount, type: e.incomeType })),
      bills: bills.map(b => ({ category: b.category, allocated: b.allocatedAmount, spent: b.actualSpent, balance: b.balance })),
      savings: savings.map(s => ({ type: s.savingsType, amount: s.amount, action: s.actionType })),
      investments: investments.map(i => ({ type: i.investmentType, symbol: i.symbol, amount: i.amount })),
      lifestyle: lifestyle.map(l => ({ type: l.lifestyleType, description: l.description, amount: l.amount })),
    },
  })
}
