import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const debts = await prisma.debt.findMany({
    where: { userId: user.id },
    include: { payments: { orderBy: { date: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(debts)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const { creditorName, originalAmount, currency, startDate, dueDate, priorityLevel, notes } = body

    if (!creditorName || !originalAmount || !startDate) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const debt = await prisma.debt.create({
      data: {
        userId: user.id,
        creditorName,
        originalAmount: parseFloat(originalAmount),
        currency: currency || 'USD',
        startDate: new Date(startDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        priorityLevel: priorityLevel || 'medium',
        remainingBalance: parseFloat(originalAmount),
        notes,
      },
    })

    return NextResponse.json(debt, { status: 201 })
  } catch {
    return serverError()
  }
}
