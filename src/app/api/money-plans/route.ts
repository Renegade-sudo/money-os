import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const plans = await prisma.moneyPlan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const { planName, isActive, tithePercent, billsPercent, savingsPercent, debtPercent, investmentPercent, assetsPercent, lifestylePercent } = body

    const total = (tithePercent || 0) + (billsPercent || 0) + (savingsPercent || 0) + (debtPercent || 0) + (investmentPercent || 0) + (assetsPercent || 0) + (lifestylePercent || 0)
    if (Math.abs(total - 100) > 0.01) {
      return NextResponse.json({ error: 'Percentages must sum to 100%' }, { status: 400 })
    }

    // If setting as active, deactivate others
    if (isActive) {
      await prisma.moneyPlan.updateMany({ where: { userId: user.id }, data: { isActive: false } })
    }

    const plan = await prisma.moneyPlan.create({
      data: {
        userId: user.id,
        planName,
        isActive: isActive ?? false,
        tithePercent: tithePercent ?? 10,
        billsPercent: billsPercent ?? 50,
        savingsPercent: savingsPercent ?? 10,
        debtPercent: debtPercent ?? 15,
        investmentPercent: investmentPercent ?? 5,
        assetsPercent: assetsPercent ?? 5,
        lifestylePercent: lifestylePercent ?? 5,
      },
    })

    return NextResponse.json(plan, { status: 201 })
  } catch {
    return serverError()
  }
}
