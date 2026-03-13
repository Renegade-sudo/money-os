import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'
import { getNextDueDate } from '@/lib/utils'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  const subs = await prisma.softwareSubscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(subs)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()
  try {
    const body = await req.json()
    const { softwareName, category, planName, billingCycle, cost, currency, startDate, lastPaidDate, nextDueDate, autoCalculatedNextDue, status, paymentMethod, notes } = body

    if (!softwareName || !category || !billingCycle || !cost) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    let computedNextDue = nextDueDate ? new Date(nextDueDate) : null
    if (autoCalculatedNextDue !== false && lastPaidDate && billingCycle !== 'custom') {
      computedNextDue = getNextDueDate(new Date(lastPaidDate), billingCycle)
    }

    const sub = await prisma.softwareSubscription.create({
      data: {
        userId: user.id,
        softwareName,
        category,
        planName,
        billingCycle,
        cost: parseFloat(cost),
        currency: currency || 'USD',
        startDate: startDate ? new Date(startDate) : null,
        lastPaidDate: lastPaidDate ? new Date(lastPaidDate) : null,
        nextDueDate: computedNextDue,
        autoCalculatedNextDue: autoCalculatedNextDue !== false,
        status: status || 'active',
        paymentMethod,
        notes,
      },
    })
    return NextResponse.json(sub, { status: 201 })
  } catch { return serverError() }
}
