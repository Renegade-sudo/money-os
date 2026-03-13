// Server-only: this file imports Prisma and must never be used in client components
import { prisma } from './prisma'

export function calculateAllocations(totalIncome: number, plan: {
  tithePercent: number
  billsPercent: number
  savingsPercent: number
  debtPercent: number
  investmentPercent: number
  assetsPercent: number
  lifestylePercent: number
}) {
  return {
    titheAmount: (totalIncome * plan.tithePercent) / 100,
    billsAmount: (totalIncome * plan.billsPercent) / 100,
    savingsAmount: (totalIncome * plan.savingsPercent) / 100,
    debtAmount: (totalIncome * plan.debtPercent) / 100,
    investmentAmount: (totalIncome * plan.investmentPercent) / 100,
    assetsAmount: (totalIncome * plan.assetsPercent) / 100,
    lifestyleAmount: (totalIncome * plan.lifestylePercent) / 100,
  }
}

export async function recalculateMonthlyAllocation(userId: string, month: string) {
  const activePlan = await prisma.moneyPlan.findFirst({
    where: { userId, isActive: true },
  })

  if (!activePlan) return null

  const incomeEntries = await prisma.incomeEntry.findMany({
    where: { userId, month },
  })

  const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0)
  const allocations = calculateAllocations(totalIncome, activePlan)

  const allocation = await prisma.moneyAllocation.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, totalIncome, ...allocations, planId: activePlan.id },
    update: { totalIncome, ...allocations, planId: activePlan.id },
  })

  return allocation
}
