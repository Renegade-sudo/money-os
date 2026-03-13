import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorized, serverError } from '@/lib/api-helpers'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const receivables = await prisma.receivable.findMany({
    where: { userId: user.id },
    include: { payments: { orderBy: { date: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(receivables)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const { clientName, projectName, totalContractValue, currency, paymentStage, amountDue, expectedDate, notes } = body

    if (!clientName || !projectName || !totalContractValue) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    const receivable = await prisma.receivable.create({
      data: {
        userId: user.id,
        clientName,
        projectName,
        totalContractValue: parseFloat(totalContractValue),
        currency: currency || 'USD',
        paymentStage,
        amountDue: parseFloat(amountDue || totalContractValue),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
      },
    })
    return NextResponse.json(receivable, { status: 201 })
  } catch {
    return serverError()
  }
}
